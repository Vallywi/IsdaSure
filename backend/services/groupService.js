const fs = require('fs');
const path = require('path');
const { resolveUser, listUsers } = require('./authService');
const { getDataDirectory, getReadDataDirectory } = require('./storagePath');

// writable data directory (runtime writes go here)
const dataDirectory = getDataDirectory();
// packaged/read-only data directory (if present in the deployed bundle)
const readDataDirectory = getReadDataDirectory();
const groupsFilePath = path.join(dataDirectory, 'groups.json');
const groupsReadFilePath = path.join(readDataDirectory, 'groups.json');
const REQUIRED_DAILY_CONTRIBUTION = Number(process.env.REQUIRED_DAILY_CONTRIBUTION || 50);

const defaultState = {
  groups: [],
};

function ensureStore() {
  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }

  // If there is packaged data (bundled with the deployment) and the runtime write-path
  // hasn't been initialized yet, copy the packaged file into the writable directory so
  // runtime reads/writes operate from a writable copy.
  if (!fs.existsSync(groupsFilePath)) {
    try {
      if (fs.existsSync(groupsReadFilePath)) {
        const contents = fs.readFileSync(groupsReadFilePath, 'utf8');
        fs.writeFileSync(groupsFilePath, contents, 'utf8');
        return;
      }
    } catch (e) {
      // fall through and initialize with default
    }
    fs.writeFileSync(groupsFilePath, JSON.stringify(defaultState, null, 2));
  }
}

function readState() {
  try {
    ensureStore();
    // Prefer runtime writable copy if present, otherwise attempt to read packaged file
    const readPath = fs.existsSync(groupsFilePath) ? groupsFilePath : (fs.existsSync(groupsReadFilePath) ? groupsReadFilePath : groupsFilePath);
    const raw = fs.readFileSync(readPath, 'utf8');
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

function normalizeIdentifier(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeWallet(value) {
  return String(value || '').trim().toUpperCase();
}

function toIsoDateOnly(timestamp = new Date().toISOString()) {
  return String(timestamp).slice(0, 10);
}

function getMemberReferenceKeys(member) {
  const identifier = normalizeIdentifier(member?.identifier);
  const walletAddress = normalizeWallet(member?.walletAddress);
  const fullName = String(member?.fullName || '').trim().toLowerCase();
  return { identifier, walletAddress, fullName };
}

function referencesMatch(a, b) {
  const left = getMemberReferenceKeys(a);
  const right = getMemberReferenceKeys(b);

  if (left.identifier && right.identifier) {
    return left.identifier === right.identifier;
  }

  if (left.fullName && right.fullName) {
    return left.fullName === right.fullName;
  }

  if (left.walletAddress && right.walletAddress) {
    return left.walletAddress === right.walletAddress;
  }

  return false;
}

function buildMember({ identifier, walletAddress, fullName, profilePicture, picture, joinedAt }) {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const normalizedWalletAddress = normalizeWallet(walletAddress);
  const normalizedFullName = String(fullName || '').trim();
  const resolvedUser = resolveUser({
    identifier: normalizedIdentifier,
    walletAddress: normalizedWalletAddress,
    fullName: normalizedFullName,
  });

  const memberPicture = String(
    profilePicture || picture || resolvedUser?.profilePicture || '',
  ).trim();

  return {
    identifier: normalizedIdentifier,
    walletAddress: normalizedWalletAddress,
    fullName: normalizedFullName,
    profilePicture: memberPicture,
    picture: memberPicture,
    joinedAt: joinedAt || new Date().toISOString(),
  };
}

function memberKey(member) {
  const reference = getMemberReferenceKeys(member);
  return reference.identifier || reference.fullName || reference.walletAddress || '';
}

function getContributionKey(member) {
  const identifier = normalizeIdentifier(member?.identifier);
  if (identifier) return identifier;
  const fullName = String(member?.fullName || '').trim().toLowerCase();
  if (fullName) return fullName;
  return normalizeWallet(member?.walletAddress);
}

function buildEventKey(entry, kind) {
  const txHash = String(entry?.txHash || '').trim();
  if (txHash) {
    return `${kind}:tx:${txHash}`;
  }

  const identifier = normalizeIdentifier(entry?.identifier);
  const walletAddress = normalizeWallet(entry?.walletAddress);
  const user = String(entry?.user || '').trim().toLowerCase();
  const amount = String(Number(entry?.amount || 0));
  const timestamp = String(entry?.timestamp || '').trim();
  const groupId = String(entry?.groupId || '').trim();
  const groupName = String(entry?.groupName || '').trim().toLowerCase();
  return `${kind}:fallback:${groupId}|${groupName}|${identifier}|${walletAddress}|${user}|${amount}|${timestamp}`;
}

function parseTimestamp(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function compareChronological(a, b) {
  const delta = parseTimestamp(a?.timestamp) - parseTimestamp(b?.timestamp);
  if (delta !== 0) {
    return delta;
  }
  return String(a?.id || '').localeCompare(String(b?.id || ''));
}

function normalizeGroup(rawGroup = {}) {
  const members = Array.isArray(rawGroup.members) ? rawGroup.members.map((member) => buildMember(member)) : [];
  const memberContributions = rawGroup.memberContributions && typeof rawGroup.memberContributions === 'object' ? { ...rawGroup.memberContributions } : {};
  const contributionHistory = Array.isArray(rawGroup.contributionHistory) ? rawGroup.contributionHistory : [];
  const stormHistory = Array.isArray(rawGroup.stormHistory) ? rawGroup.stormHistory : [];
  const pendingMembers = Array.isArray(rawGroup.pendingMembers) ? rawGroup.pendingMembers.map((member) => buildMember(member)) : [];

  members.forEach((member) => {
    const key = getContributionKey(member);
    if (typeof memberContributions[key] !== 'number') {
      memberContributions[key] = 0;
    }
  });

  const seenContributionKeys = new Set();
  const dedupedContributionHistory = contributionHistory.filter((entry) => {
    const eventKey = buildEventKey(entry, 'contribution');
    if (seenContributionKeys.has(eventKey)) {
      return false;
    }
    seenContributionKeys.add(eventKey);
    return true;
  });

  const seenStormKeys = new Set();
  const dedupedStormHistory = stormHistory.filter((entry) => {
    const eventKey = buildEventKey(entry, 'storm');
    if (seenStormKeys.has(eventKey)) {
      return false;
    }
    seenStormKeys.add(eventKey);
    return true;
  });

  const latestStormTimestamp = dedupedStormHistory.reduce(
    (latest, entry) => Math.max(latest, parseTimestamp(entry.timestamp)),
    0,
  );

  const hasEventHistory = dedupedContributionHistory.length > 0 || dedupedStormHistory.length > 0;
  const rebuiltMemberContributions = {};
  let rebuiltTotalPool = 0;

  [...dedupedContributionHistory]
    .sort(compareChronological)
    .forEach((entry) => {
      const entryTime = parseTimestamp(entry.timestamp);
      if (latestStormTimestamp && entryTime <= latestStormTimestamp) {
        return;
      }

      const entryMember = buildMember({
        identifier: entry.identifier,
        walletAddress: entry.walletAddress,
        fullName: entry.user,
      });
      const resolvedMember = members.find((item) => referencesMatch(item, entryMember)) || entryMember;
      const contributionKey = getContributionKey(resolvedMember);
      const amount = Number(entry.amount || 0);

      entry.contributionKey = contributionKey;
      rebuiltMemberContributions[contributionKey] = Number(rebuiltMemberContributions[contributionKey] || 0) + amount;
      rebuiltTotalPool += amount;
    });

  members.forEach((member) => {
    const contributionKey = getContributionKey(member);
    if (typeof rebuiltMemberContributions[contributionKey] !== 'number') {
      rebuiltMemberContributions[contributionKey] = 0;
    }
  });

  const currentPool = hasEventHistory
    ? rebuiltTotalPool
    : Number.isFinite(Number(rawGroup.totalPool))
      ? Number(rawGroup.totalPool)
      : Object.values(memberContributions).reduce((sum, value) => sum + Number(value || 0), 0);

  return {
    id: String(rawGroup.id || `group-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`),
    name: String(rawGroup.name || '').trim(),
    createdBy: rawGroup.createdBy || null,
    createdAt: rawGroup.createdAt || new Date().toISOString(),
    requiredDailyAmount: Number(rawGroup.requiredDailyAmount || REQUIRED_DAILY_CONTRIBUTION),
    dailyLimit: Number(rawGroup.dailyLimit || process.env.DAILY_PESO_LIMIT || 1000),
    joinApprovalEnabled: Boolean(rawGroup.joinApprovalEnabled),
    members,
    pendingMembers,
    totalPool: currentPool,
    memberContributions: hasEventHistory ? rebuiltMemberContributions : memberContributions,
    contributionHistory: dedupedContributionHistory,
    stormHistory: dedupedStormHistory,
  };
}

state.groups = state.groups.map(normalizeGroup);

function getUserContributionActivities(user, group) {
  return (user?.activityHistory || []).filter((entry) => {
    if (entry?.type !== 'contribution') {
      return false;
    }

    const entryGroupName = normalizeName(entry.groupName || entry.metadata?.groupName || '');
    const entryGroupId = String(entry.groupId || entry.metadata?.groupId || '').trim();
    return entryGroupName === normalizeName(group.name) || entryGroupId === group.id;
  });
}

function reconcileGroupFromUsers(group, users) {
  const nextGroup = normalizeGroup(group);
  const contributionEntriesByKey = new Map(
    nextGroup.contributionHistory.map((entry) => [buildEventKey(entry, 'contribution'), entry]),
  );

  let changed = false;

  users.forEach((user) => {
    const activities = getUserContributionActivities(user, nextGroup);
    if (!activities.length) {
      return;
    }

    const member = buildMember(user);
    const existingMember = nextGroup.members.find((item) => referencesMatch(item, member));

    if (!existingMember) {
      nextGroup.members.push(member);
      changed = true;
    }

    activities.forEach((activity) => {
      const txHash = String(activity.metadata?.txHash || activity.txHash || '').trim();
      const sourceActivityId = String(activity.id || activity.metadata?.activityId || '').trim();
      const contributionKey = getContributionKey(member);
      const eventKey = txHash
        ? `contribution:tx:${txHash}`
        : sourceActivityId
          ? `contribution:activity:${sourceActivityId}`
          : buildEventKey({
              identifier: user.identifier || member.identifier,
              walletAddress: user.walletAddress || member.walletAddress,
              fullName: user.fullName || member.fullName,
              user: user.fullName || user.identifier || member.walletAddress,
              amount: Number(activity.amount || 0),
              timestamp: activity.timestamp || new Date().toISOString(),
              groupId: nextGroup.id,
              groupName: nextGroup.name,
            }, 'contribution');
      const reconciledEntry = {
        id: txHash
          ? `group-contribution-${txHash}`
          : sourceActivityId
            ? `group-contribution-${sourceActivityId}`
            : `group-contribution-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        groupId: nextGroup.id,
        groupName: nextGroup.name,
        user: user.fullName || user.identifier || member.walletAddress,
        identifier: user.identifier || member.identifier,
        walletAddress: user.walletAddress || member.walletAddress,
        contributionKey,
        amount: Number(activity.amount || 0),
        timestamp: activity.timestamp || new Date().toISOString(),
        txHash,
        txStatus: activity.metadata?.txStatus || 'CONFIRMED',
        explorerUrl: activity.metadata?.explorerUrl || '',
        sourceActivityId,
      };

      if (contributionEntriesByKey.has(eventKey)) {
        Object.assign(contributionEntriesByKey.get(eventKey), reconciledEntry);
      } else {
        nextGroup.contributionHistory.unshift(reconciledEntry);
        contributionEntriesByKey.set(eventKey, reconciledEntry);
        changed = true;
      }
    });
  });

  return nextGroup;
}

function reconcileGroupsFromUsers() {
  const users = listUsers();
  state.groups = state.groups.map((group) => reconcileGroupFromUsers(group, users));
  saveState(state);
}

function removeSmokeTestGroups() {
  const previousLength = state.groups.length;
  state.groups = state.groups.filter((group) => {
    const name = String(group?.name || '').trim().toLowerCase();
    const creatorIdentifier = String(group?.createdBy?.identifier || '').trim().toLowerCase();
    const isSmokeName = name.startsWith('smokegroup-');
    const isSmokeCreator = creatorIdentifier === 'smoke@isdasure.dev';
    return !(isSmokeName || isSmokeCreator);
  });

  if (state.groups.length !== previousLength) {
    saveState(state);
  }
}

reconcileGroupsFromUsers();
removeSmokeTestGroups();

function contributedToday(group, member) {
  const contributionKey = getContributionKey(member);
  const today = toIsoDateOnly();
  return group.contributionHistory.some(
    (entry) => entry.contributionKey === contributionKey && toIsoDateOnly(entry.timestamp) === today,
  );
}

function publicGroup(group, { includeHistory = true } = {}) {
  const normalized = normalizeGroup(group);
  const members = normalized.members.map((member) => {
    const contributionKey = getContributionKey(member);
    const totalContributed = Number(normalized.memberContributions[contributionKey] || 0);
    const paidToday = contributedToday(normalized, member);
    return {
      ...member,
      picture: member.picture || member.profilePicture || '',
      profilePicture: member.profilePicture || member.picture || '',
      totalContributed,
      contributionStatus: paidToday ? 'Paid today' : 'Not yet contributed',
    };
  });

  const contributionByMember = members.map((member) => ({
    identifier: member.identifier,
    walletAddress: member.walletAddress,
    fullName: member.fullName,
    totalContributed: member.totalContributed,
    contributionStatus: member.contributionStatus,
  }));

  return {
    id: normalized.id,
    group_id: normalized.id,
    name: normalized.name,
    group_name: normalized.name,
    createdBy: normalized.createdBy,
    createdAt: normalized.createdAt,
    requiredDailyAmount: normalized.requiredDailyAmount,
    dailyLimit: normalized.dailyLimit,
    joinApprovalEnabled: normalized.joinApprovalEnabled,
    totalPool: normalized.totalPool,
    members,
    pendingMembers: normalized.pendingMembers,
    memberCount: members.length,
    contributionByMember,
    contributionHistory: includeHistory ? normalized.contributionHistory : undefined,
    stormHistory: includeHistory ? normalized.stormHistory : undefined,
  };
}

function listGroups() {
  return state.groups.map((group) => publicGroup(group));
}

function findGroup(groupNameOrId) {
  const normalizedName = normalizeName(groupNameOrId);
  const normalizedId = String(groupNameOrId || '').trim();
  return state.groups.find((group) => normalizeName(group.name) === normalizedName || group.id === normalizedId) || null;
}

function getGroupByName(groupName) {
  return findGroup(groupName);
}

function getGroupById(groupId) {
  return findGroup(groupId);
}

function upsertMemberContributionContainer(group, member) {
  const key = getContributionKey(member);
  if (typeof group.memberContributions[key] !== 'number') {
    group.memberContributions[key] = 0;
  }
  return key;
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

  if (findGroup(name)) {
    throw new Error('Group already exists.');
  }

  const requiredDailyAmount = Number(payload.requiredDailyAmount || REQUIRED_DAILY_CONTRIBUTION);

  const group = {
    id: `group-${Date.now()}`,
    name,
    createdBy: {
      identifier: member.identifier,
      walletAddress: member.walletAddress,
      fullName: member.fullName,
    },
    requiredDailyAmount: Number.isFinite(requiredDailyAmount) && requiredDailyAmount > 0 ? requiredDailyAmount : REQUIRED_DAILY_CONTRIBUTION,
    dailyLimit: Number(payload.dailyLimit || process.env.DAILY_PESO_LIMIT || 1000),
    joinApprovalEnabled: Boolean(payload.joinApprovalEnabled),
    members: [member],
    pendingMembers: [],
    totalPool: 0,
    memberContributions: {},
    contributionHistory: [],
    stormHistory: [],
    createdAt: new Date().toISOString(),
  };

  upsertMemberContributionContainer(group, member);

  state.groups.push(group);
  saveState(state);
  return publicGroup(group);
}

function joinGroup(payload = {}) {
  const group = findGroup(payload.groupName || payload.groupId);
  if (!group) {
    throw new Error('Group not found.');
  }

  const member = buildMember(payload);
  if (!member.identifier && !member.walletAddress && !member.fullName) {
    throw new Error('User reference is required to join group.');
  }

  const alreadyMember = group.members.some((item) => referencesMatch(item, member));
  const alreadyPending = group.pendingMembers.some((item) => referencesMatch(item, member));

  if (alreadyMember || alreadyPending) {
    throw new Error('User already joined this group.');
  }

  if (group.joinApprovalEnabled) {
    group.pendingMembers.push(member);
    saveState(state);
    return {
      ...publicGroup(group),
      joinPending: true,
      message: 'Join request submitted and waiting for group creator approval.',
    };
  }

  group.members.push(member);
  upsertMemberContributionContainer(group, member);
  saveState(state);

  return publicGroup(group);
}

function forceAddMember(payload = {}) {
  const group = findGroup(payload.groupName || payload.groupId);
  if (!group) {
    throw new Error('Group not found.');
  }

  const member = buildMember(payload);
  if (!member.identifier && !member.walletAddress && !member.fullName) {
    throw new Error('User reference is required to join group.');
  }

  const alreadyMember = group.members.some((item) => referencesMatch(item, member));
  if (alreadyMember) {
    return publicGroup(group);
  }

  // Forcefully add the member regardless of joinApprovalEnabled
  group.members.push(member);
  upsertMemberContributionContainer(group, member);
  saveState(state);

  return publicGroup(group);
}

function approveJoinRequest(payload = {}) {
  const group = findGroup(payload.groupName || payload.groupId);
  if (!group) {
    throw new Error('Group not found.');
  }

  const approver = buildMember(payload.approver || payload);
  if (!referencesMatch(group.createdBy || {}, approver)) {
    const error = new Error('Only the group creator can approve join requests.');
    error.status = 403;
    throw error;
  }

  const target = buildMember(payload.target || payload);
  const pendingIndex = group.pendingMembers.findIndex((member) => referencesMatch(member, target));
  if (pendingIndex === -1) {
    throw new Error('Join request not found.');
  }

  const [member] = group.pendingMembers.splice(pendingIndex, 1);
  const alreadyMember = group.members.some((item) => referencesMatch(item, member));
  if (!alreadyMember) {
    group.members.push(member);
    upsertMemberContributionContainer(group, member);
  }

  saveState(state);
  return publicGroup(group);
}

function rejectJoinRequest(payload = {}) {
  const group = findGroup(payload.groupName || payload.groupId);
  if (!group) {
    throw new Error('Group not found.');
  }

  const approver = buildMember(payload.approver || payload);
  if (!referencesMatch(group.createdBy || {}, approver)) {
    const error = new Error('Only the group creator can reject join requests.');
    error.status = 403;
    throw error;
  }

  const target = buildMember(payload.target || payload);
  const pendingIndex = group.pendingMembers.findIndex((member) => referencesMatch(member, target));
  if (pendingIndex === -1) {
    throw new Error('Join request not found.');
  }

  group.pendingMembers.splice(pendingIndex, 1);
  saveState(state);
  return publicGroup(group);
}

function getUserGroups(payload = {}) {
  const probe = buildMember(payload);
  if (!memberKey(probe)) return [];
  return state.groups.filter((group) => group.members.some((member) => referencesMatch(member, probe))).map((group) => publicGroup(group));
}

function isMemberOfGroup(payload = {}, groupNameOrId) {
  const group = findGroup(groupNameOrId);
  if (!group) return false;
  const probe = buildMember(payload);
  if (!memberKey(probe)) return false;
  return group.members.some((member) => referencesMatch(member, probe));
}

function getMemberGroupStats(payload = {}, groupNameOrId) {
  const group = findGroup(groupNameOrId);
  if (!group) return null;

  const probe = buildMember(payload);
  const member = group.members.find((item) => referencesMatch(item, probe));
  if (!member) return null;

  const contributionKey = getContributionKey(member);
  const totalContributed = Number(group.memberContributions[contributionKey] || 0);
  const today = toIsoDateOnly();
  const contributedTodayAmount = group.contributionHistory
    .filter((entry) => entry.contributionKey === contributionKey && toIsoDateOnly(entry.timestamp) === today)
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  return {
    totalContributed,
    contributedTodayAmount,
    contributionStatus: contributedTodayAmount >= Number(group.requiredDailyAmount || REQUIRED_DAILY_CONTRIBUTION) ? 'Paid today' : 'Not yet contributed',
    missedContributionWarning: contributedTodayAmount < Number(group.requiredDailyAmount || REQUIRED_DAILY_CONTRIBUTION),
  };
}

function recordContribution(payload = {}) {
  const group = findGroup(payload.groupName || payload.groupId);
  if (!group) {
    throw new Error('Group not found.');
  }

  const member = group.members.find((item) =>
    referencesMatch(item, {
      identifier: payload.identifier,
      walletAddress: payload.walletAddress,
      fullName: payload.user,
    }),
  );

  if (!member) {
    throw new Error('You are not a member of this group. Join the group before contributing.');
  }

  const amount = Number(payload.amount || 0);
  const key = upsertMemberContributionContainer(group, member);
  group.memberContributions[key] = Number(group.memberContributions[key] || 0) + amount;
  group.totalPool = Number(group.totalPool || 0) + amount;

  const historyEntry = {
    id: `group-contribution-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    groupId: group.id,
    groupName: group.name,
    user: member.fullName || payload.user || member.identifier || member.walletAddress,
    identifier: member.identifier,
    walletAddress: member.walletAddress,
    contributionKey: key,
    amount,
    timestamp: new Date().toISOString(),
    txHash: payload.txHash || '',
    txStatus: payload.txStatus || 'CONFIRMED',
    explorerUrl: payload.explorerUrl || '',
  };

  group.contributionHistory = [historyEntry, ...group.contributionHistory].slice(0, 400);
  saveState(state);

  return {
    group: publicGroup(group),
    entry: historyEntry,
    memberStats: getMemberGroupStats(payload, group.id),
  };
}

function triggerStormForGroup(payload = {}) {
  const group = findGroup(payload.groupName || payload.groupId);
  if (!group) {
    throw new Error('Group not found.');
  }

  const payouts = group.members
    .map((member) => {
      const key = getContributionKey(member);
      return {
        user: member.fullName || member.identifier || member.walletAddress,
        identifier: member.identifier,
        walletAddress: member.walletAddress,
        amount: Number(group.memberContributions[key] || 0),
      };
    })
    .filter((item) => item.amount > 0);

  const stormRecord = {
    id: `group-storm-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    groupId: group.id,
    groupName: group.name,
    triggeredBy: payload.admin || payload.walletAddress || 'admin',
    timestamp: new Date().toISOString(),
    totalPayout: payouts.reduce((sum, item) => sum + item.amount, 0),
    payouts,
    txHash: payload.txHash || '',
    txStatus: payload.txStatus || 'CONFIRMED',
    explorerUrl: payload.explorerUrl || '',
  };

  group.stormHistory = [stormRecord, ...group.stormHistory].slice(0, 100);
  group.members.forEach((member) => {
    const key = getContributionKey(member);
    group.memberContributions[key] = 0;
  });
  group.totalPool = 0;
  saveState(state);

  return {
    group: publicGroup(group),
    payouts,
    stormRecord,
  };
}

function allContributionHistory() {
  return state.groups
    .flatMap((group) => group.contributionHistory.map((entry) => ({ ...entry, groupId: group.id, groupName: group.name })))
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
}

function allStormHistory() {
  return state.groups
    .flatMap((group) => group.stormHistory.map((entry) => ({ ...entry, groupId: group.id, groupName: group.name })))
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
}

function getGlobalPoolSummary() {
  const groups = listGroups();
  const totalPool = groups.reduce((sum, group) => sum + Number(group.totalPool || 0), 0);
  const uniqueContributors = new Set();
  groups.forEach((group) => {
    (group.members || []).forEach((member) => {
      const key = member.walletAddress || member.identifier || member.fullName;
      if (key) uniqueContributors.add(key);
    });
  });

  return {
    totalPool,
    contributors: uniqueContributors.size,
    contributorNames: groups
      .flatMap((group) => (group.members || []).map((member) => member.fullName || member.identifier || member.walletAddress))
      .filter(Boolean),
    groups,
    recentContributions: allContributionHistory().slice(0, 30),
    recentStorms: allStormHistory().slice(0, 30),
  };
}

module.exports = {
  listGroups,
  getGroupByName,
  getGroupById,
  createGroup,
  joinGroup,
  approveJoinRequest,
  rejectJoinRequest,
  getUserGroups,
  isMemberOfGroup,
  getMemberGroupStats,
  recordContribution,
  triggerStormForGroup,
  allContributionHistory,
  allStormHistory,
  getGlobalPoolSummary,
  forceAddMember,
};
