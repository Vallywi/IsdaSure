const adminAddress = 'admin@isdasure.dev';

const state = {
  totalPool: 200,
  contributors: ['User 1', 'User 2', 'User 3', 'User 4', 'User 5', 'User 6'],
  recentContributions: [
    { user: 'User 1', amount: 50, time: '1 minute ago' },
    { user: 'User 2', amount: 50, time: '1 minute ago' },
    { user: 'User 3', amount: 50, time: '1 minute ago' },
  ],
  payouts: [],
  lastUpdated: 'Now',
};

function snapshot() {
  return {
    totalPool: state.totalPool,
    contributors: state.contributors.length,
    contributorNames: [...state.contributors],
    recentContributions: [...state.recentContributions],
    payouts: [...state.payouts],
    lastUpdated: state.lastUpdated,
  };
}

function normalizeAmount(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Amount must be greater than zero');
  }
  return value;
}

function contributeToPool(payload = {}) {
  const user = payload.user || 'Anonymous User';
  const amount = normalizeAmount(payload.amount ?? 50);

  if (!state.contributors.includes(user)) {
    state.contributors.push(user);
  }

  state.totalPool += amount;
  state.recentContributions.unshift({
    user,
    amount,
    time: 'Just now',
  });
  state.recentContributions = state.recentContributions.slice(0, 5);
  state.lastUpdated = 'Now';

  return snapshot();
}

function triggerStormDay(payload = {}) {
  const admin = payload.admin || '';

  if (admin !== adminAddress && admin !== 'admin') {
    const error = new Error('Unauthorized admin');
    error.status = 403;
    throw error;
  }

  const contributorCount = Math.max(state.contributors.length, 1);
  const payoutAmount = contributorCount > 0 ? Number((state.totalPool / contributorCount).toFixed(2)) : 0;

  state.payouts = state.contributors.map((user) => ({
    user,
    amount: payoutAmount,
  }));
  state.totalPool = 0;
  state.lastUpdated = 'Now';

  return snapshot();
}

function getStatus() {
  return snapshot();
}

module.exports = {
  contributeToPool,
  triggerStormDay,
  getStatus,
};