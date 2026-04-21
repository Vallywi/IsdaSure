const DEFAULT_NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

function isTestnetNetwork(networkPassphrase) {
  const value = String(networkPassphrase || '').toLowerCase();
  return !value || value.includes('test');
}

export function buildStellarExpertTxUrl(hash, networkPassphrase = DEFAULT_NETWORK_PASSPHRASE) {
  const txHash = String(hash || '').trim();
  if (!txHash) {
    return '';
  }

  const network = isTestnetNetwork(networkPassphrase) ? 'testnet' : 'public';
  return `https://stellar.expert/explorer/${network}/tx/${txHash}`;
}