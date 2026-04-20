const fs = require('fs');
const path = require('path');
const { getDataDirectory } = require('./storagePath');

const dataDirectory = getDataDirectory();
const usersFilePath = path.join(dataDirectory, 'users.json');

const seedUsers = [
  {
    id: 'admin-1',
    role: 'admin',
    fullName: 'Barangay Admin',
    identifier: 'admin@isdasure.dev',
    password: 'admin123',
    age: 40,
    walletAddress: '',
    profilePicture: '',
    activityHistory: [
      {
        id: 'activity-admin-seed',
        type: 'system',
        title: 'System account ready',
        amount: 0,
        timestamp: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

function ensureUsersStore() {
  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }

  if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify(seedUsers, null, 2));
  }
}

function readUsersFromDisk() {
  try {
    ensureUsersStore();
    const raw = fs.readFileSync(usersFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...seedUsers];
  } catch {
    return [...seedUsers];
  }
}

function saveUsersToDisk(nextUsers) {
  ensureUsersStore();
  fs.writeFileSync(usersFilePath, JSON.stringify(nextUsers, null, 2));
}

const users = readUsersFromDisk();

function publicUser(user) {
  return {
    id: user.id,
    role: user.role,
    fullName: user.fullName,
    identifier: user.identifier,
    age: user.age,
    walletAddress: user.walletAddress,
    profilePicture: user.profilePicture,
    activityHistory: [...(user.activityHistory || [])],
    createdAt: user.createdAt,
  };
}

function normalizeIdentifier(identifier) {
  return String(identifier || '').trim().toLowerCase();
}

function findUserByIdentifier(identifier) {
  const value = normalizeIdentifier(identifier);
  return users.find((user) => normalizeIdentifier(user.identifier) === value);
}

function findUserByWalletAddress(walletAddress) {
  const value = String(walletAddress || '').trim().toLowerCase();
  if (!value) {
    return null;
  }

  return users.find((user) => String(user.walletAddress || '').trim().toLowerCase() === value);
}

function findUsersByWalletAddress(walletAddress) {
  const value = String(walletAddress || '').trim().toLowerCase();
  if (!value) {
    return [];
  }

  return users.filter((user) => String(user.walletAddress || '').trim().toLowerCase() === value);
}

function findUserByFullName(fullName) {
  const value = String(fullName || '').trim().toLowerCase();
  if (!value) {
    return null;
  }

  return users.find((user) => String(user.fullName || '').trim().toLowerCase() === value);
}

function resolveUser({ identifier, walletAddress, fullName } = {}) {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const normalizedFullName = String(fullName || '').trim().toLowerCase();
  const walletMatches = findUsersByWalletAddress(walletAddress);

  if (normalizedIdentifier) {
    const directByIdentifier = findUserByIdentifier(normalizedIdentifier);
    if (directByIdentifier) {
      return directByIdentifier;
    }

    const byIdentifierInsideWallet = walletMatches.find((user) => normalizeIdentifier(user.identifier) === normalizedIdentifier);
    if (byIdentifierInsideWallet) {
      return byIdentifierInsideWallet;
    }
  }

  if (normalizedFullName) {
    const byFullNameInsideWallet = walletMatches.find((user) => String(user.fullName || '').trim().toLowerCase() === normalizedFullName);
    if (byFullNameInsideWallet) {
      return byFullNameInsideWallet;
    }

    const directByFullName = findUserByFullName(normalizedFullName);
    if (directByFullName) {
      return directByFullName;
    }

    const identifierFromFullName = findUserByIdentifier(normalizedFullName);
    if (identifierFromFullName) {
      return identifierFromFullName;
    }
  }

  if (walletMatches.length === 1) {
    return walletMatches[0];
  }

  return null;
}

function recordUserActivity({ identifier, walletAddress, fullName } = {}, activity = {}) {
  const user = resolveUser({ identifier, walletAddress, fullName });

  if (!user) {
    return null;
  }

  const historyEntry = {
    id: `activity-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type: activity.type || 'activity',
    title: activity.title || 'Activity recorded',
    user: activity.user || user.fullName || user.identifier,
    identifier: user.identifier,
    walletAddress: user.walletAddress,
    amount: Number(activity.amount || 0),
    timestamp: activity.timestamp || new Date().toISOString(),
    metadata: activity.metadata || {},
  };

  user.activityHistory = [historyEntry, ...(user.activityHistory || [])].slice(0, 50);
  saveUsersToDisk(users);

  return publicUser(user);
}

function getDailyContributionTotal({ identifier, walletAddress, fullName } = {}, date = new Date()) {
  const user = resolveUser({ identifier, walletAddress, fullName });
  if (!user) {
    return 0;
  }

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return (user.activityHistory || [])
    .filter((entry) => entry.type === 'contribution')
    .filter((entry) => {
      const time = new Date(entry.timestamp).getTime();
      return Number.isFinite(time) && time >= dayStart.getTime() && time < dayEnd.getTime();
    })
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
}

function registerUser(payload = {}) {
  const fullName = String(payload.fullName || '').trim();
  const identifier = normalizeIdentifier(payload.identifier);
  const password = String(payload.password || '').trim();
  const age = Number(payload.age);
  const walletAddress = String(payload.walletAddress || '').trim();
  const profilePicture = String(payload.profilePicture || '').trim();

  if (!fullName) {
    throw new Error('Full name is required.');
  }
  if (!identifier) {
    throw new Error('Email or phone number is required.');
  }
  if (!password) {
    throw new Error('Password is required.');
  }
  if (!Number.isFinite(age) || age < 1) {
    throw new Error('Age is required.');
  }
  if (!walletAddress) {
    throw new Error('Wallet address is required.');
  }

  const existing = findUserByIdentifier(identifier);
  if (existing) {
    throw new Error('User already exists.');
  }

  const user = {
    id: `user-${Date.now()}`,
    role: 'user',
    fullName,
    identifier,
    password,
    age,
    walletAddress,
    profilePicture,
    activityHistory: [
      {
        id: `activity-register-${Date.now()}`,
        type: 'registration',
        title: 'Account registered',
        amount: 0,
        timestamp: new Date().toISOString(),
        metadata: {
          walletAddress,
        },
      },
    ],
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  saveUsersToDisk(users);

  return publicUser(user);
}

function loginUser(payload = {}) {
  const identifier = normalizeIdentifier(payload.identifier);
  const password = String(payload.password || '').trim();
  const role = String(payload.role || '').trim().toLowerCase();

  if (!identifier) {
    throw new Error('Email or phone number is required.');
  }
  if (!password) {
    throw new Error('Password is required.');
  }

  const user = findUserByIdentifier(identifier);

  if (!user || user.password !== password) {
    throw new Error('Invalid credentials.');
  }

  if (role && user.role !== role) {
    throw new Error('Unauthorized action');
  }

  return publicUser(user);
}

function listUsers() {
  return users.map(publicUser);
}

module.exports = {
  registerUser,
  loginUser,
  listUsers,
  recordUserActivity,
  resolveUser,
  getDailyContributionTotal,
};