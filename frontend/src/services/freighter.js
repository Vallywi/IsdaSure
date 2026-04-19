import { Account, BASE_FEE, Memo, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import * as freighterSdk from '@stellar/freighter-api';

const DEFAULT_NETWORK_PASSPHRASE = import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;
const CONTRACT_ID =
  import.meta.env.VITE_SOROBAN_CONTRACT_ID ||
  '';

function getFreighterApi() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.freighterApi || window.freighter || null;
}

function extractAddress(result) {
  if (!result) return '';
  if (typeof result === 'string') return result;
  return result.publicKey || result.address || result.result || '';
}

function extractSignedXdr(result) {
  if (!result) return '';
  if (typeof result === 'string') return result;
  return result.signedTxXdr || result.signedTx || result.xdr || result.result || '';
}

function safeDataValue(payload) {
  try {
    // manageData accepts string | Buffer | null (not Uint8Array)
    return JSON.stringify(payload || {}).slice(0, 64);
  } catch {
    return 'isdasure';
  }
}

export function isFreighterAvailable() {
  return Boolean(getFreighterApi() || freighterSdk);
}

export function formatWalletAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export async function connectFreighterWallet() {
  if (typeof window === 'undefined') {
    throw new Error('Wallet connection is only available in the browser.');
  }

  const api = getFreighterApi();
  let address = '';

  if (api?.getPublicKey) {
    const result = await api.getPublicKey();
    if (result?.error) {
      throw new Error(result.error);
    }
    address = extractAddress(result);
  }

  if (!address && freighterSdk?.requestAccess) {
    const result = await freighterSdk.requestAccess();
    if (result?.error) {
      throw new Error(result.error);
    }
    address = extractAddress(result);
  }

  if (!address && freighterSdk?.getAddress) {
    const result = await freighterSdk.getAddress();
    if (result?.error) {
      throw new Error(result.error);
    }
    address = extractAddress(result);
  }

  if (!address) {
    throw new Error('Freighter wallet not detected or site permission is blocked. Please allow this site in Freighter settings.');
  }

  return address;
}

export async function signFreighterTransaction({ walletAddress, action, payload, memoText }) {
  const api = getFreighterApi();
  const signWithInjectedApi = api?.signTransaction;
  const signWithSdk = freighterSdk?.signTransaction;

  if (!signWithInjectedApi && !signWithSdk) {
    throw new Error('Freighter signing is unavailable.');
  }

  const source = String(walletAddress || '').trim();
  if (!source) {
    throw new Error('Wallet address is required before signing.');
  }

  const account = new Account(source, '0');
  const txBuilder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: DEFAULT_NETWORK_PASSPHRASE,
  })
    .addMemo(Memo.text((memoText || `IsdaSure ${action}`).slice(0, 28)))
    .addOperation(
      Operation.manageData({
        name: `isdasure:${String(action || 'call').slice(0, 20)}`,
        value: safeDataValue(payload),
      }),
    )
    .setTimeout(180);

  const unsignedTx = txBuilder.build();
  const unsignedTxXdr = unsignedTx.toXDR();

  const signResult = signWithInjectedApi
    ? await api.signTransaction(unsignedTxXdr, {
        networkPassphrase: DEFAULT_NETWORK_PASSPHRASE,
      })
    : await freighterSdk.signTransaction(unsignedTxXdr, {
        networkPassphrase: DEFAULT_NETWORK_PASSPHRASE,
      });

  if (signResult?.error) {
    throw new Error(signResult.error);
  }

  const signedTxXdr = extractSignedXdr(signResult);
  if (!signedTxXdr) {
    throw new Error('Freighter did not return a signed transaction.');
  }

  return {
    signedTxXdr,
    unsignedTxXdr,
    networkPassphrase: DEFAULT_NETWORK_PASSPHRASE,
    contractId: CONTRACT_ID,
  };
}

export async function signPreparedFreighterTransaction({ unsignedTxXdr, networkPassphrase }) {
  const api = getFreighterApi();
  const signWithInjectedApi = api?.signTransaction;
  const signWithSdk = freighterSdk?.signTransaction;

  if (!signWithInjectedApi && !signWithSdk) {
    throw new Error('Freighter signing is unavailable.');
  }

  if (!unsignedTxXdr) {
    throw new Error('Missing unsigned transaction XDR.');
  }

  const passphrase = networkPassphrase || DEFAULT_NETWORK_PASSPHRASE;
  const signResult = signWithInjectedApi
    ? await api.signTransaction(unsignedTxXdr, {
        networkPassphrase: passphrase,
      })
    : await freighterSdk.signTransaction(unsignedTxXdr, {
        networkPassphrase: passphrase,
      });

  if (signResult?.error) {
    throw new Error(signResult.error);
  }

  const signedTxXdr = extractSignedXdr(signResult);
  if (!signedTxXdr) {
    throw new Error('Freighter did not return a signed transaction.');
  }

  return {
    signedTxXdr,
    unsignedTxXdr,
    networkPassphrase: passphrase,
    contractId: CONTRACT_ID,
  };
}
