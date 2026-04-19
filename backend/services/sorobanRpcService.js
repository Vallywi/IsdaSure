const { Contract, Networks, TransactionBuilder, nativeToScVal, rpc } = require('@stellar/stellar-sdk');

const DEFAULT_NETWORK_PASSPHRASE = process.env.SOROBAN_NETWORK_PASSPHRASE || Networks.TESTNET;
const SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL || '';

function isSorobanRpcConfigured() {
  return Boolean(String(SOROBAN_RPC_URL || '').trim());
}

function getSorobanChainMode() {
  return isSorobanRpcConfigured() ? 'rpc' : 'mock';
}

function createRpcServer() {
  if (!SOROBAN_RPC_URL) {
    const error = new Error('SOROBAN_RPC_URL is not configured. Add it to backend environment variables for real on-chain transactions.');
    error.status = 500;
    throw error;
  }

  return new rpc.Server(SOROBAN_RPC_URL, {
    allowHttp: SOROBAN_RPC_URL.startsWith('http://'),
  });
}

function normalize(value) {
  return String(value || '').trim().toUpperCase();
}

function isTestnet(networkPassphrase) {
  return String(networkPassphrase || '').toLowerCase().includes('test') || networkPassphrase === Networks.TESTNET;
}

function explorerTxUrl(hash, networkPassphrase) {
  if (!hash) return '';
  const network = isTestnet(networkPassphrase) ? 'testnet' : 'public';
  return `https://stellar.expert/explorer/${network}/tx/${hash}`;
}

function sourceFromSignedTransaction({ signedTxXdr, networkPassphrase }) {
  const tx = TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase || DEFAULT_NETWORK_PASSPHRASE);
  return String(tx.source || tx.sourceAccount?.accountId?.() || '').trim();
}

function assertSignedSourceMatchesWallet({ signedTxXdr, walletAddress, networkPassphrase }) {
  if (!signedTxXdr) {
    throw new Error('Missing signed transaction XDR.');
  }

  const source = normalize(sourceFromSignedTransaction({ signedTxXdr, networkPassphrase }));
  const wallet = normalize(walletAddress);

  if (!wallet) {
    throw new Error('Missing wallet address.');
  }

  if (source !== wallet) {
    const error = new Error('Signed transaction source does not match wallet address.');
    error.status = 403;
    throw error;
  }
}

function toScVal(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Contract argument contains invalid number.');
    }
    if (!Number.isInteger(value)) {
      throw new Error('Contract numeric arguments must be integers.');
    }

    return nativeToScVal(value, { type: value >= 0 ? 'u32' : 'i32' });
  }

  if (typeof value === 'bigint') {
    return nativeToScVal(value, { type: value >= 0n ? 'u64' : 'i64' });
  }

  return nativeToScVal(value);
}

function normalizeContractArgs(args) {
  if (Array.isArray(args)) {
    return args.map(toScVal);
  }

  if (args && typeof args === 'object') {
    return Object.values(args).map(toScVal);
  }

  return [];
}

async function prepareUnsignedSorobanTransaction({ walletAddress, contractCall, networkPassphrase }) {
  const passphrase = networkPassphrase || DEFAULT_NETWORK_PASSPHRASE;
  const source = String(walletAddress || '').trim();
  const contractId = String(contractCall?.contractId || '').trim();
  const method = String(contractCall?.method || '').trim();

  if (!source) {
    throw new Error('Wallet address is required to prepare a transaction.');
  }
  if (!contractId) {
    throw new Error('Contract ID is required to prepare a transaction.');
  }
  if (!method) {
    throw new Error('Contract method is required to prepare a transaction.');
  }

  const server = createRpcServer();
  const sourceAccount = await server.getAccount(source);
  const contract = new Contract(contractId);
  const operation = contract.call(method, ...normalizeContractArgs(contractCall?.args));

  let transaction = new TransactionBuilder(sourceAccount, {
    fee: '100000',
    networkPassphrase: passphrase,
  })
    .addOperation(operation)
    .setTimeout(180)
    .build();

  try {
    transaction = await server.prepareTransaction(transaction);
  } catch (error) {
    const rawMessage = String(error?.message || '');
    if (/non-existent contract function|MissingValue/i.test(rawMessage)) {
      const friendly = new Error(
        `Contract method "${method}" was not found on ${contractId}. Update SOROBAN_CONTRACT_ID to the deployed IsdaSure contract (with contribute and trigger_storm methods).`,
      );
      friendly.status = 400;
      throw friendly;
    }
    throw error;
  }

  return {
    mode: 'rpc',
    unsignedTxXdr: transaction.toXDR(),
    networkPassphrase: passphrase,
    contractId,
    method,
  };
}

async function submitSignedSorobanTransaction({ signedTxXdr, walletAddress, contractCall, networkPassphrase }) {
  const passphrase = networkPassphrase || DEFAULT_NETWORK_PASSPHRASE;
  assertSignedSourceMatchesWallet({ signedTxXdr, walletAddress, networkPassphrase: passphrase });

  const server = createRpcServer();
  const transaction = TransactionBuilder.fromXDR(signedTxXdr, passphrase);
  const sendResult = await server.sendTransaction(transaction);
  const txHash = sendResult?.hash || '';

  if (sendResult?.status === 'ERROR') {
    const error = new Error('Soroban RPC rejected transaction.');
    error.status = 400;
    throw error;
  }

  const txResult = txHash
    ? await server.pollTransaction(txHash, {
        timeout: 45_000,
      })
    : { status: 'FAILED' };

  const status = txResult?.status === 'SUCCESS' ? 'CONFIRMED' : txResult?.status === 'FAILED' ? 'FAILED' : 'PENDING';

  return {
    mode: 'rpc',
    txHash,
    status,
    ledger: txResult?.ledger || txResult?.latestLedger || sendResult?.latestLedger || null,
    contractResult: txResult?.returnValue || txResult?.resultXdr || null,
    explorerUrl: explorerTxUrl(txHash, passphrase),
    raw: {
      sendResult,
      txResult,
      contractCall,
    },
  };
}

module.exports = {
  isSorobanRpcConfigured,
  getSorobanChainMode,
  prepareUnsignedSorobanTransaction,
  submitSignedSorobanTransaction,
  assertSignedSourceMatchesWallet,
  explorerTxUrl,
};
