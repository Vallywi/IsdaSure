const fs = require('fs');
const path = require('path');

const dataDirectory = path.join(__dirname, '..', 'data');
const groupsFilePath = path.join(dataDirectory, 'groups.json');

const defaultState = {
  groups: [],
};

function ensureStore() {
  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }

  if (!fs.existsSync(groupsFilePath)) {
    fs.writeFileSync(groupsFilePath, JSON.stringify(defaultState, null, 2));
  }
}

function readState() {
  try {
    ensureStore();
    const raw = fs.readFileSync(groupsFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.groups) ? parsed : { ...defaultState };
  } catch {
    return { ...defaultState };
  }
}

function saveState(nextState) {
  ensureStore();
  fs.writeFileSync(groupsFilePath, JSON.stringify(nextState, null, 2));
}

const state = readState();

function normalizeName(groupName) {
  return String(groupName || '').trim().toLowerCase();
}

function buildMember({ identifier, walletAddress, fullName }) {
  return {
    identifier: String(identifier || '').trim().toLowerCase(),
    walletAddress: String(walletAddress || '').trim().toUpperCase(),
    fullName: String(fullName || '').trim(),
    joinedAt: new Date().toISOString(),
  };
}

function memberKey(member) {
  return member.identifier || member.walletAddress || member.fullName.toLowerCase();
}

function publicGroup(group) {
  return {
    id: group.id,
    name: group.name,
    createdBy: group.createdBy,
    members: group.members,
    dailyLimit: group.dailyLimit,
    createdAt: group.createdAt,
  };
}

function listGroups() {
  return state.groups.map(publicGroup);
}

function getGroupByName(groupName) {
  const key = normalizeName(groupName);
  if (!key) return null;
  return state.groups.find((group) => normalizeName(group.name) === key) || null;
}

function createGroup(payload = {}) {
  const name = String(payload.groupName || '').trim();
  if (!name) {
    throw new Error('Group name is required.');
  }

  const member = buildMember(payload);
  if (!member.identifier && !member.walletAddress && !member.fullName) {
    throw new Error('User reference is required to create a group.');
  }

  if (getGroupByName(name)) {
    throw new Error('Group already exists.');
  }

  const group = {
    id: `group-${Date.now()}`,
    name,
    createdBy: {
      identifier: member.identifier,
      walletAddress: member.walletAddress,
      fullName: member.fullName,
    },
    dailyLimit: Number(payload.dailyLimit || process.env.DAILY_PESO_LIMIT || 1000),
    members: [member],
    createdAt: new Date().toISOString(),
  };

  state.groups.push(group);
  saveState(state);
  return publicGroup(group);
}

function joinGroup(payload = {}) {
  const group = getGroupByName(payload.groupName);
  if (!group) {
    throw new Error('Group not found.');
  }

  const member = buildMember(payload);
  if (!member.identifier && !member.walletAddress && !member.fullName) {
    throw new Error('User reference is required to join group.');
  }

  const key = memberKey(member);
  const exists = group.members.some((item) => memberKey(item) === key);
  if (!exists) {
    group.members.push(member);
    saveState(state);
  }

  return publicGroup(group);
}

function getUserGroups(payload = {}) {
  const probe = buildMember(payload);
  const key = memberKey(probe);
  if (!key) return [];
  return state.groups.filter((group) => group.members.some((member) => memberKey(member) === key)).map(publicGroup);
}

function isMemberOfGroup(payload = {}, groupName) {
  const group = getGroupByName(groupName);
  if (!group) return false;
  const probe = buildMember(payload);
  const key = memberKey(probe);
  if (!key) return false;
  return group.members.some((member) => memberKey(member) === key);
}

module.exports = {
  listGroups,
  getGroupByName,
  createGroup,
  joinGroup,
  getUserGroups,
  isMemberOfGroup,
};
