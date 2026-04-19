const nonceStore = new Map();

function cleanupExpired(now) {
  for (const [key, expiry] of nonceStore.entries()) {
    if (expiry <= now) {
      nonceStore.delete(key);
    }
  }
}

function assertFreshNonce({ walletAddress, nonce, ttlMs = 5 * 60 * 1000 }) {
  const wallet = String(walletAddress || '').trim().toUpperCase();
  const value = String(nonce || '').trim();

  if (!wallet) {
    throw new Error('Wallet address is required.');
  }
  if (!value) {
    throw new Error('Missing nonce for wallet action.');
  }

  const now = Date.now();
  cleanupExpired(now);

  const key = `${wallet}:${value}`;
  if (nonceStore.has(key)) {
    const error = new Error('Replay detected. Nonce was already used.');
    error.status = 409;
    throw error;
  }

  nonceStore.set(key, now + ttlMs);
}

module.exports = {
  assertFreshNonce,
};
