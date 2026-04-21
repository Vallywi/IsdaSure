const fs = require('fs');
const path = require('path');
const { getDataDirectory } = require('./storagePath');
const { recordUserActivity } = require('./authService');
const { assertFreshNonce } = require('./nonceService');
const {
  getSorobanChainMode,
  isSorobanRpcConfigured,
  prepareUnsignedSorobanTransaction,
  submitSignedSorobanTransaction,
} = require('./sorobanRpcService');
const {
  isMemberOfGroup,
  getGroupByName,
  getMemberGroupStats,
  recordContribution,
  triggerStormForGroup,
  getGlobalPoolSummary,
  allStormHistory,
} = require('./groupService');

const adminAddress = 'admin@isdasure.dev';
const configuredAdminWallet = String(process.env.ADMIN_WALLET_ADDRESS || '')
  .trim()
  .toUpperCase();
const dataDirectory = getDataDirectory();
const poolFilePath = path.join(dataDirectory, 'pool.json');
const MIN_CONTRIBUTION = Number(process.env.MIN_CONTRIBUTION || 10);
const MAX_CONTRIBUTION = Number(process.env.MAX_CONTRIBUTION || 100000);
const DAILY_PESO_LIMIT = Number(process.env.DAILY_PESO_LIMIT || 1000);
const ESTIMATED_FEE_XLM = Number(process.env.ESTIMATED_FEE_XLM || 0.00001);
const DEFAULT_CONTRACT_ID = String(process.env.SOROBAN_CONTRACT_ID || '').trim();
const isVercelRuntime = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

const defaultState = {
  totalPool: 0,
  contributors: [],
  recentContributions: [],
  payouts: [],
  payoutLogs: [],
  chainHistory: [],
  lastUpdated: 'Now',
};

function ensurePoolStore() {
  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }

  if (!fs.existsSync(poolFilePath)) {
    fs.writeFileSync(poolFilePath, JSON.stringify(defaultState, null, 2));
  }
}

function readPoolState() {
  try {
    ensurePoolStore();
    const raw = fs.readFileSync(poolFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : { ...defaultState };
  } catch {
    return { ...defaultState };
  }
}

function savePoolState(nextState) {
  ensurePoolStore();
  fs.writeFileSync(poolFilePath, JSON.stringify(nextState, null, 2));
}

const state = readPoolState();

function snapshot() {
  const summary = getGlobalPoolSummary();
  const latestStorm = summary.recentStorms[0] || null;
  const payoutLogs = summary.recentStorms
    .flatMap((storm) =>
      (storm.payouts || []).map((item) => ({
        id: `${storm.id}-${item.walletAddress || item.identifier || item.user}`,
        type: 'payout',
        groupId: storm.groupId,
        groupName: storm.groupName,
        user: item.user,
        amount: item.amount,
        timestamp: storm.timestamp,
        txHash: storm.txHash || '',
        txStatus: storm.txStatus || 'CONFIRMED',
        explorerUrl: storm.explorerUrl || '',
      })),
    )
    .slice(0, 200);

  return {
    chainMode: getSorobanChainMode(),
    rpcConfigured: isSorobanRpcConfigured(),
    totalPool: summary.totalPool,
    contributors: summary.contributors,
    contributorNames: [...summary.contributorNames],
    groups: summary.groups,
    recentContributions: [...summary.recentContributions],
    payouts: latestStorm ? [...(latestStorm.payouts || [])] : [],
    payoutLogs,
    stormHistory: [...summary.recentStorms],
    chainHistory: [...(state.chainHistory || [])],
    contributionRules: {
      minAmount: MIN_CONTRIBUTION,
      maxAmount: MAX_CONTRIBUTION,
      dailyPesoLimit: DAILY_PESO_LIMIT,
      estimatedFeeXlm: ESTIMATED_FEE_XLM,
    },
    lastUpdated: state.lastUpdated,
  };
}

function normalizeAmount(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Amount must be greater than zero.');
  }
  if (value < MIN_CONTRIBUTION || value > MAX_CONTRIBUTION) {
    throw new Error(`Amount must be between ${MIN_CONTRIBUTION} and ${MAX_CONTRIBUTION}.`);
  }
  return value;
}

function appendChainHistory(entry) {
  state.chainHistory = [entry, ...(state.chainHistory || [])].slice(0, 100);
}

function buildContractCall({ payload, method, args }) {
  const fallbackContractId = DEFAULT_CONTRACT_ID;
  const payloadContractId = String(payload?.contractCall?.contractId || '').trim();
  return {
    contractId: fallbackContractId || payloadContractId,
    method: payload?.contractCall?.method || method,
    args: payload?.contractCall?.args || args,
  };
}

function isMissingMethodError(error) {
  const message = String(error?.message || '');
  return /method .* was not found|non-existent contract function|MissingValue/i.test(message);
}

async function prepareTransactionWithFallback({
  payload,
  walletAddress,
  networkPassphrase,
  preferredMethod,
  fallbackMethod,
  args,
}) {
  const preferredContractCall = buildContractCall({
    payload,
    method: preferredMethod,
    args,
  });

  if (!isSorobanRpcConfigured()) {
    return buildMockPreparedTransaction({ payload, method: preferredMethod });
  }

  try {
    return await prepareUnsignedSorobanTransaction({
      walletAddress,
      networkPassphrase,
      contractCall: preferredContractCall,
    });
  } catch (error) {
    if (!fallbackMethod || !isMissingMethodError(error)) {
      throw error;
    }

    const fallbackContractCall = buildContractCall({
      payload,
      method: fallbackMethod,
      args,
    });

    return prepareUnsignedSorobanTransaction({
      walletAddress,
      networkPassphrase,
      contractCall: fallbackContractCall,
    });
  }
}

function buildMockPreparedTransaction({ payload, method }) {
  const contractCall = buildContractCall({
    payload,
    method,
    args: [],
  });

  return {
    mode: 'mock',
    unsignedTxXdr: '',
    networkPassphrase: payload.networkPassphrase || payload.contractCall?.networkPassphrase || '',
    contractId: contractCall.contractId,
    method: contractCall.method,
  };
}

function buildMockConfirmedTx(contractCall) {
  return {
    mode: 'mock',
    txHash: '',
    status: 'CONFIRMED',
    ledger: null,
    contractResult: {
      note: 'No Soroban RPC configured; using mocked confirmation. Set SOROBAN_RPC_URL to enable real on-chain submission.',
      contractCall,
    },
    explorerUrl: '',
    raw: {
      mocked: true,
      contractCall,
    },
  };
}

function assertRpcConfiguredForHosted() {
  if (isVercelRuntime && !isSorobanRpcConfigured()) {
    const error = new Error(
      'Soroban RPC is not configured on Vercel. Set SOROBAN_RPC_URL and SOROBAN_CONTRACT_ID in Vercel environment variables to enable real on-chain transactions and Stellar Expert history links.',
    );
    error.status = 500;
    throw error;
  }
}

function validateContribution(payload = {}) {
  const user = payload.user || 'Anonymous User';
  const amount = normalizeAmount(payload.amount ?? 50);
  const groupKey = String(payload.groupId || payload.groupName || '').trim();
  if (!groupKey) {
    throw new Error('You must join or create a group before contributing.');
  }

  const group = getGroupByName(groupKey);
  if (!group) {
    throw new Error('Group not found.');
  }

  const groupName = group.name;

  const isMember = isMemberOfGroup(
    {
      identifier: payload.identifier,
      walletAddress: payload.walletAddress,
      fullName: user,
    },
    group.id,
  );
  if (!isMember) {
    throw new Error('You are not a member of this group. Join the group before contributing.');
  }

  const requiredDailyAmount = Number(group?.requiredDailyAmount || 50);
  if (amount < requiredDailyAmount) {
    throw new Error(`Minimum daily contribution for this group is ₱${requiredDailyAmount}.`);
  }

  const groupDailyLimit = Number(group?.dailyLimit || DAILY_PESO_LIMIT);
  const stats = getMemberGroupStats(
    {
      identifier: payload.identifier,
      walletAddress: payload.walletAddress,
      fullName: user,
    },
    group.id,
  );

  const contributedToday = Number(stats?.contributedTodayAmount || 0);
  if (contributedToday + amount > groupDailyLimit) {
    throw new Error(`Daily limit reached. You can contribute up to ₱${groupDailyLimit} per day in this group.`);
  }

  return {
    identifier: payload.identifier,
    walletAddress: payload.walletAddress,
    fullName: user,
    user,
    amount,
    groupId: group.id,
    groupName: group.name,
    contributedToday,
    requiredDailyAmount,
  };
}

function validateAdminTrigger(payload = {}) {
  const admin = payload.admin || '';
  const walletAddress = String(payload.walletAddress || '')
    .trim()
    .toUpperCase();

  if (configuredAdminWallet && walletAddress !== configuredAdminWallet) {
    const error = new Error('Unauthorized admin wallet');
    error.status = 403;
    throw error;
  }

  if (!configuredAdminWallet && admin !== adminAddress && admin !== 'admin') {
    const error = new Error('Unauthorized admin');
    error.status = 403;
    throw error;
  }

  const group = getGroupByName(payload.groupId || payload.groupName);
  if (!group) {
    throw new Error('Group not found.');
  }

  return {
    admin,
    walletAddress,
    groupId: group.id,
    groupName: group.name,
  };
}

async function prepareContributionTransaction(payload = {}) {
  assertRpcConfiguredForHosted();
  const { user, amount, groupId } = validateContribution(payload);
  return prepareTransactionWithFallback({
    payload,
    walletAddress: payload.walletAddress,
    networkPassphrase: payload.networkPassphrase || payload.contractCall?.networkPassphrase,
    preferredMethod: 'contribute',
    fallbackMethod: 'increment',
    args: [amount],
  });
}

async function prepareStormTransaction(payload = {}) {
  assertRpcConfiguredForHosted();
  const { walletAddress } = validateAdminTrigger(payload);
  return prepareTransactionWithFallback({
    payload,
    walletAddress,
    networkPassphrase: payload.networkPassphrase || payload.contractCall?.networkPassphrase,
    preferredMethod: 'trigger_storm',
    fallbackMethod: 'reset',
    args: [],
  });
}

async function contributeToPool(payload = {}) {
  assertRpcConfiguredForHosted();
  const { user, amount, groupName, groupId, contributedToday } = validateContribution(payload);
  const contractCall = buildContractCall({
    payload,
    method: 'contribute',
    args: [user, groupId, amount],
  });

  assertFreshNonce({
    walletAddress: payload.walletAddress,
    nonce: payload.nonce,
  });

  const tx = isSorobanRpcConfigured()
    ? await submitSignedSorobanTransaction({
        signedTxXdr: payload.signedTxXdr,
        walletAddress: payload.walletAddress,
        contractCall,
        networkPassphrase: payload.networkPassphrase || payload.contractCall?.networkPassphrase,
      })
    : buildMockConfirmedTx(contractCall);

  const contributionResult = recordContribution({
    groupId,
    groupName,
    user,
    identifier: payload.identifier,
    walletAddress: payload.walletAddress,
    amount,
    txHash: tx.txHash,
    txStatus: tx.status,
    explorerUrl: tx.explorerUrl,
  });

  appendChainHistory({
    id: `chain-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type: 'contribution',
    user,
    amount,
    groupId,
    groupName,
    txHash: tx.txHash,
    status: tx.status,
    ledger: tx.ledger,
    explorerUrl: tx.explorerUrl,
    timestamp: new Date().toISOString(),
    contractResult: tx.contractResult,
  });

  const summary = getGlobalPoolSummary();
  state.totalPool = summary.totalPool;
  state.contributors = summary.contributorNames;
  state.recentContributions = summary.recentContributions.slice(0, 30);
  state.lastUpdated = 'Now';
  savePoolState(state);

  recordUserActivity(
    {
      identifier: payload.identifier,
      walletAddress: payload.walletAddress,
      fullName: user,
    },
    {
      type: 'contribution',
      title: 'Contribution recorded',
      amount,
      metadata: {
        walletAddress: payload.walletAddress || '',
        groupId,
        groupName,
        dailyTotal: contributedToday + amount,
        txHash: tx.txHash,
        txStatus: tx.status,
        explorerUrl: tx.explorerUrl,
      },
    },
  );

  return {
    status: snapshot(),
    tx,
  };
}

async function triggerStormDay(payload = {}) {
  assertRpcConfiguredForHosted();
  const { admin, walletAddress, groupId, groupName } = validateAdminTrigger(payload);
  const contractCall = buildContractCall({
    payload,
    method: 'trigger_storm',
    args: [groupId],
  });

  assertFreshNonce({
    walletAddress,
    nonce: payload.nonce,
  });

  const tx = isSorobanRpcConfigured()
    ? await submitSignedSorobanTransaction({
        signedTxXdr: payload.signedTxXdr,
        walletAddress,
        contractCall,
        networkPassphrase: payload.networkPassphrase || payload.contractCall?.networkPassphrase,
      })
    : buildMockConfirmedTx(contractCall);

  const stormResult = triggerStormForGroup({
    groupId,
    groupName,
    admin,
    walletAddress,
    txHash: tx.txHash,
    txStatus: tx.status,
    explorerUrl: tx.explorerUrl,
  });

  const payoutLogEntries = (stormResult.payouts || []).map((item) => ({
    id: `payout-${Date.now()}-${Math.random().toString(16).slice(2, 8)}-${item.user}`,
    type: 'payout',
    groupId,
    groupName,
    user: item.user,
    amount: item.amount,
    timestamp: new Date().toISOString(),
    txHash: tx.txHash,
    txStatus: tx.status,
    explorerUrl: tx.explorerUrl,
  }));

  const summary = getGlobalPoolSummary();
  state.totalPool = summary.totalPool;
  state.contributors = summary.contributorNames;
  state.recentContributions = summary.recentContributions.slice(0, 30);
  state.payouts = stormResult.payouts || [];
  state.payoutLogs = [...payoutLogEntries, ...(state.payoutLogs || [])].slice(0, 200);
  appendChainHistory({
    id: `chain-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type: 'storm',
    user: admin || 'admin',
    groupId,
    groupName,
    amount: (stormResult.payouts || []).reduce((sum, item) => sum + Number(item.amount || 0), 0),
    txHash: tx.txHash,
    status: tx.status,
    ledger: tx.ledger,
    explorerUrl: tx.explorerUrl,
    timestamp: new Date().toISOString(),
    contractResult: tx.contractResult,
  });
  state.lastUpdated = 'Now';
  savePoolState(state);

  (stormResult.payouts || []).forEach((item) => {
    recordUserActivity(
      {
        identifier: item.identifier,
        walletAddress: item.walletAddress,
        fullName: item.user,
      },
      {
        type: 'payout',
        title: 'Payout received',
        amount: item.amount,
        metadata: {
          source: 'storm-trigger',
          groupId,
          groupName,
          txHash: tx.txHash,
          txStatus: tx.status,
          explorerUrl: tx.explorerUrl,
        },
      },
    );
  });

  return {
    status: snapshot(),
    tx,
  };
}

function getStatus() {
  const status = snapshot();
  const globalStormHistory = allStormHistory();
  return {
    ...status,
    stormHistory: globalStormHistory,
  };
}

function getChainHistory(limit = 30) {
  const value = Number(limit);
  const max = Number.isFinite(value) ? Math.min(Math.max(value, 1), 100) : 30;
  return [...(state.chainHistory || [])].slice(0, max);
}

module.exports = {
  prepareContributionTransaction,
  prepareStormTransaction,
  contributeToPool,
  triggerStormDay,
  getStatus,
  getChainHistory,
};