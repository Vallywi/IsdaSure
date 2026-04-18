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
    createdAt: new Date().toISOString(),
  },
];

const users = [...seedUsers];

function publicUser(user) {
  return {
    id: user.id,
    role: user.role,
    fullName: user.fullName,
    identifier: user.identifier,
    age: user.age,
    walletAddress: user.walletAddress,
    profilePicture: user.profilePicture,
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
    createdAt: new Date().toISOString(),
  };

  users.push(user);

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
};