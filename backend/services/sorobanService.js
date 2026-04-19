const fs = require('fs');
const path = require('path');
const { recordUserActivity, getDailyContributionTotal } = require('./authService');
const { assertFreshNonce } = require('./nonceService');
const {
  getSorobanChainMode,
  isSorobanRpcConfigured,
  prepareUnsignedSorobanTransaction,
  submitSignedSorobanTransaction,
} = require('./sorobanRpcService');
const { isMemberOfGroup, getGroupByName } = require('./groupService');

const adminAddress = 'admin@isdasure.dev';
const configuredAdminWallet = String(process.env.ADMIN_WALLET_ADDRESS || '')
  .trim()
  .toUpperCase();
const dataDirectory = path.join(__dirname, '..', 'data');
const poolFilePath = path.join(dataDirectory, 'pool.json');
const MIN_CONTRIBUTION = Number(process.env.MIN_CONTRIBUTION || 10);
const MAX_CONTRIBUTION = Number(process.env.MAX_CONTRIBUTION || 100000);
const DAILY_PESO_LIMIT = Number(process.env.DAILY_PESO_LIMIT || 1000);
const ESTIMATED_FEE_XLM = Number(process.env.ESTIMATED_FEE_XLM || 0.00001);
const DEFAULT_CONTRACT_ID = String(process.env.SOROBAN_CONTRACT_ID || '').trim();

const defaultState = {
  totalPool: 200,
  contributors: ['User 1', 'User 2', 'User 3', 'User 4', 'User 5', 'User 6'],
  recentContributions: [
    { user: 'User 1', amount: 50, time: '1 minute ago' },
    { user: 'User 2', amount: 50, time: '1 minute ago' },
    { user: 'User 3', amount: 50, time: '1 minute ago' },
  ],
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
  return {
    chainMode: getSorobanChainMode(),
    rpcConfigured: isSorobanRpcConfigured(),
    totalPool: state.totalPool,
    contributors: state.contributors.length,
    contributorNames: [...state.contributors],
    recentContributions: [...state.recentContributions],
    payouts: [...state.payouts],
    payoutLogs: [...(state.payoutLogs || [])],
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

function validateContribution(payload = {}) {
  const user = payload.user || 'Anonymous User';
  const amount = normalizeAmount(payload.amount ?? 50);
  const groupName = String(payload.groupName || '').trim();
  if (!groupName) {
    throw new Error('You must join or create a group before contributing.');
  }

  const isMember = isMemberOfGroup(
    {
      identifier: payload.identifier,
      walletAddress: payload.walletAddress,
      fullName: user,
    },
    groupName,
  );
  if (!isMember) {
    throw new Error('You are not a member of this group. Join the group before contributing.');
  }

  const group = getGroupByName(groupName);
  const groupDailyLimit = Number(group?.dailyLimit || DAILY_PESO_LIMIT);
  const contributedToday = getDailyContributionTotal({
    identifier: payload.identifier,
    walletAddress: payload.walletAddress,
    fullName: user,
  });
  if (contributedToday + amount > groupDailyLimit) {
    throw new Error(`Daily limit reached. You can contribute up to ₱${groupDailyLimit} per day.`);
  }

  return {
    user,
    amount,
    groupName,
    contributedToday,
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

  return {
    admin,
    walletAddress,
  };
}

async function prepareContributionTransaction(payload = {}) {
  const { user, amount } = validateContribution(payload);
  const contractCall = buildContractCall({
    payload,
    method: 'contribute',
    args: [user, amount],
  });

  if (!isSorobanRpcConfigured()) {
    return buildMockPreparedTransaction({ payload, method: 'contribute' });
  }

  try {
    const prepared = await prepareUnsignedSorobanTransaction({
      walletAddress: payload.walletAddress,
      networkPassphrase: payload.networkPassphrase || payload.contractCall?.networkPassphrase,
      contractCall,
    });

    return prepared;
  } catch (error) {
    if (!isMissingMethodError(error)) {
      throw error;
    }

    // Compatibility path for contracts that expose increment(amount) instead of contribute(user, amount).
    return prepareUnsignedSorobanTransaction({
      walletAddress: payload.walletAddress,
      networkPassphrase: payload.networkPassphrase || payload.contractCall?.networkPassphrase,
      contractCall: {
        ...contractCall,
        method: 'increment',
        args: [amount],
      },
    });
  }
}

async function prepareStormTransaction(payload = {}) {
  const { walletAddress } = validateAdminTrigger(payload);
  const contractCall = buildContractCall({
    payload,
    method: 'trigger_storm',
    args: [],
  });

  if (!isSorobanRpcConfigured()) {
    return buildMockPreparedTransaction({ payload, method: 'trigger_storm' });
  }

  try {
    const prepared = await prepareUnsignedSorobanTransaction({
      walletAddress,
      networkPassphrase: payload.networkPassphrase || payload.contractCall?.networkPassphrase,
      contractCall,
    });

    return prepared;
  } catch (error) {
    if (!isMissingMethodError(error)) {
      throw error;
    }

    // Compatibility path for contracts that expose reset() instead of trigger_storm(admin).
    return prepareUnsignedSorobanTransaction({
      walletAddress,
      networkPassphrase: payload.networkPassphrase || payload.contractCall?.networkPassphrase,
      contractCall: {
        ...contractCall,
        method: 'reset',
        args: [],
      },
    });
  }
}

async function contributeToPool(payload = {}) {
  const { user, amount, groupName, contributedToday } = validateContribution(payload);
  const contractCall = buildContractCall({
    payload,
    method: 'contribute',
    args: [user, amount],
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

  if (!state.contributors.includes(user)) {
    state.contributors.push(user);
  }

  state.totalPool += amount;
  state.recentContributions.unshift({
    user,
    amount,
    time: tx.status === 'CONFIRMED' ? 'Just now' : 'Pending',
  });
  state.recentContributions = state.recentContributions.slice(0, 5);
  appendChainHistory({
    id: `chain-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type: 'contribution',
    user,
    amount,
    groupName,
    txHash: tx.txHash,
    status: tx.status,
    ledger: tx.ledger,
    explorerUrl: tx.explorerUrl,
    timestamp: new Date().toISOString(),
    contractResult: tx.contractResult,
  });
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
        groupName,
        dailyTotal: contributedToday + amount,
        txHash: tx.txHash,
        txStatus: tx.status,
      },
    },
  );

  return {
    status: snapshot(),
    tx,
  };
}

async function triggerStormDay(payload = {}) {
  const { admin, walletAddress } = validateAdminTrigger(payload);
  const contractCall = buildContractCall({
    payload,
    method: 'trigger_storm',
    args: [],
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

  const contributorCount = Math.max(state.contributors.length, 1);
  const payoutAmount = contributorCount > 0 ? Number((state.totalPool / contributorCount).toFixed(2)) : 0;

  state.payouts = state.contributors.map((user) => ({
    user,
    amount: payoutAmount,
  }));

  const payoutLogEntries = state.payouts.map((item) => ({
    id: `payout-${Date.now()}-${Math.random().toString(16).slice(2, 8)}-${item.user}`,
    type: 'payout',
    user: item.user,
    amount: item.amount,
    timestamp: new Date().toISOString(),
    txHash: tx.txHash,
    txStatus: tx.status,
    explorerUrl: tx.explorerUrl,
  }));

  state.payoutLogs = [...payoutLogEntries, ...(state.payoutLogs || [])].slice(0, 200);
  state.totalPool = 0;
  appendChainHistory({
    id: `chain-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type: 'storm',
    user: admin || 'admin',
    amount: payoutAmount,
    txHash: tx.txHash,
    status: tx.status,
    ledger: tx.ledger,
    explorerUrl: tx.explorerUrl,
    timestamp: new Date().toISOString(),
    contractResult: tx.contractResult,
  });
  state.lastUpdated = 'Now';
  savePoolState(state);

  state.contributors.forEach((user) => {
    recordUserActivity(
      { fullName: user },
      {
        type: 'payout',
        title: 'Payout received',
        amount: payoutAmount,
        metadata: {
          source: 'storm-trigger',
          txHash: tx.txHash,
          txStatus: tx.status,
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
  return snapshot();
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