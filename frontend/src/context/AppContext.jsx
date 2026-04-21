import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { StrKey } from '@stellar/stellar-sdk';
import {
  apiApproveGroupJoin,
  apiCreateGroup,
  apiGetChainHistory,
  apiGetStatus,
  apiJoinGroup,
  apiRejectGroupJoin,
  apiLogin,
  apiMyGroups,
  apiListGroups,
  apiRegister,
  apiUsers,
} from '../services/api';
import {
  connectFreighterWallet,
  formatWalletAddress,
  isFreighterAvailable,
  signFreighterTransaction,
  signPreparedFreighterTransaction,
} from '../services/freighter';
import {
  invokeContribute,
  invokeTriggerStorm,
  prepareContributeInvocation,
  prepareTriggerStormInvocation,
} from '../services/contract';
import { buildStellarExpertTxUrl } from '../services/stellar';

const defaultPoolState = {
  chainMode: 'mock',
  rpcConfigured: false,
  totalPool: 0,
  contributors: 0,
  contributorNames: [],
  groups: [],
  recentContributions: [],
  stormHistory: [],
  payouts: [],
  lastUpdated: 'Now',
};

const defaultAuthState = {
  isAuthenticated: false,
  role: '',
  user: null,
};

const initialAuthState = readStoredValue('isdasure-auth', defaultAuthState);

const defaultWalletState = {
  connected: false,
  address: '',
};

const defaultTxLifecycle = {
  phase: 'idle',
  txHash: '',
  status: '',
  ledger: null,
  explorerUrl: '',
  actionLabel: '',
  contractResult: null,
};

const ADMIN_WALLET_ADDRESS = String(import.meta.env.VITE_ADMIN_WALLET_ADDRESS || '')
  .trim()
  .toUpperCase();

const AppContext = createContext(null);

function readStoredValue(key, fallback) {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const stored = window.localStorage.getItem(key);
  if (!stored) {
    return fallback;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return fallback;
  }
}

function isValidWalletAddress(address) {
  return StrKey.isValidEd25519PublicKey(String(address || '').trim());
}

function readStoredWalletState() {
  const stored = readStoredValue('isdasure-wallet', defaultWalletState);
  if (!stored?.connected || !isValidWalletAddress(stored.address)) {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('isdasure-wallet');
    }
    return defaultWalletState;
  }

  return {
    connected: true,
    address: String(stored.address).trim(),
  };
}

function shortAddress(address) {
  return formatWalletAddress(address);
}

function normalizeMemberIdentifier(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeMemberWallet(value) {
  return String(value || '').trim().toUpperCase();
}

function normalizeMemberName(value) {
  return String(value || '').trim().toLowerCase();
}

function memberMatchesUser(member, user, walletAddress = '') {
  const memberIdentifier = normalizeMemberIdentifier(member?.identifier);
  const userIdentifier = normalizeMemberIdentifier(user?.identifier);
  if (memberIdentifier && userIdentifier) {
    return memberIdentifier === userIdentifier;
  }

  const memberName = normalizeMemberName(member?.fullName);
  const userName = normalizeMemberName(user?.fullName);
  if (memberName && userName) {
    return memberName === userName;
  }

  const memberWallet = normalizeMemberWallet(member?.walletAddress);
  const userWallet = normalizeMemberWallet(walletAddress || user?.walletAddress);
  if (memberWallet && userWallet) {
    return memberWallet === userWallet;
  }

  return false;
}

function normalizeActivityHistory(entries, fallbackUser) {
  return (entries || []).map((entry, index) => ({
    id: entry.id || `activity-${Date.now()}-${index}`,
    type: entry.type || 'activity',
    user: entry.user || entry.metadata?.user || fallbackUser?.fullName || fallbackUser?.identifier || 'User',
    amount: Number(entry.amount || 0),
    timestamp: entry.timestamp || new Date().toISOString(),
    txHash: entry.txHash || entry.metadata?.txHash || '',
    txStatus: entry.txStatus || entry.metadata?.txStatus || 'CONFIRMED',
    explorerUrl: entry.explorerUrl || entry.metadata?.explorerUrl || buildStellarExpertTxUrl(entry.txHash || entry.metadata?.txHash || ''),
    groupName: entry.groupName || entry.metadata?.groupName || '',
    title: entry.title || '',
    metadata: entry.metadata || {},
  }));
}

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return 'dark';
    }
    return window.localStorage.getItem('isdasure-theme') || 'dark';
  });
  const [wallet, setWallet] = useState(() => readStoredWalletState());
  const [auth, setAuth] = useState(() => initialAuthState);
  const [poolState, setPoolState] = useState(defaultPoolState);
  const [users, setUsers] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState(() =>
    normalizeActivityHistory(initialAuthState.user?.activityHistory || [], initialAuthState.user),
  );
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [chainHistory, setChainHistory] = useState([]);
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [activeGroupName, setActiveGroupName] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return window.localStorage.getItem('isdasure-active-group') || '';
  });
  const [selectedRole, setSelectedRole] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return window.localStorage.getItem('isdasure-selected-role') || '';
  });
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [toasts, setToasts] = useState([]);
  const [walletApprovalAction, setWalletApprovalAction] = useState('');
  const [txLifecycle, setTxLifecycle] = useState(defaultTxLifecycle);
  const [themeReady, setThemeReady] = useState(false);

  const mergedGroups = useMemo(() => {
    const map = new Map();
    [...groups, ...myGroups].forEach((group) => {
      if (!group?.name) return;
      map.set(group.name, group);
    });
    return Array.from(map.values());
  }, [groups, myGroups]);

  const activeGroup = useMemo(() => {
    if (!activeGroupName) return null;
    return mergedGroups.find((group) => group.name === activeGroupName) || null;
  }, [activeGroupName, mergedGroups]);

  const activeGroupContributionHistory = useMemo(() => {
    if (!activeGroup?.contributionHistory) return [];
    return [...activeGroup.contributionHistory].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  }, [activeGroup]);

  const activeGroupMemberStats = useMemo(() => {
    if (!activeGroup || !auth.user) {
      return null;
    }

    const member = (activeGroup.contributionByMember || []).find((item) =>
      memberMatchesUser(item, auth.user, wallet.address || auth.user.walletAddress),
    );

    return member || null;
  }, [activeGroup, auth.user, wallet.address]);

  const createNonce = () => `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

  const shouldRequireWalletSignature = () => {
    if (typeof window === 'undefined') {
      return true;
    }

    const host = String(window.location.hostname || '').toLowerCase();
    const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(host);
    return !isLocalHost || isFreighterAvailable();
  };

  const refreshGroupCollections = async () => {
    const [allGroupsResponse, myGroupsResponse] = await Promise.all([
      apiListGroups().catch(() => ({ groups: [] })),
      auth.isAuthenticated && auth.user
        ? apiMyGroups({
            identifier: auth.user.identifier,
            walletAddress: wallet.address || auth.user.walletAddress,
            fullName: auth.user.fullName,
          }).catch(() => ({ groups: [] }))
        : Promise.resolve({ groups: [] }),
    ]);

    setGroups(allGroupsResponse.groups || []);
    setMyGroups(myGroupsResponse.groups || []);
    return {
      groups: allGroupsResponse.groups || [],
      myGroups: myGroupsResponse.groups || [],
    };
  };

  const normalizeMessage = (value, fallback = 'Transaction failed') => {
    const fallbackText = String(fallback || 'Transaction failed');
    const limit = 240;
    if (value == null) {
      return fallbackText;
    }

    try {
      if (typeof value === 'string') {
        return value.slice(0, limit) || fallbackText;
      }
      if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
        return String(value).slice(0, limit);
      }
      if (value instanceof Error && typeof value.message === 'string') {
        return value.message.slice(0, limit) || fallbackText;
      }

      const seen = new WeakSet();
      const serialized = JSON.stringify(
        value,
        (key, nestedValue) => {
          if (nestedValue && typeof nestedValue === 'object') {
            if (seen.has(nestedValue)) {
              return '[Circular]';
            }
            seen.add(nestedValue);
          }
          if (typeof nestedValue === 'string' && nestedValue.length > 120) {
            return `${nestedValue.slice(0, 120)}...`;
          }
          return nestedValue;
        },
        0,
      );
      if (!serialized) {
        return fallbackText;
      }
      return serialized.slice(0, limit);
    } catch {
      try {
        return String(value).slice(0, limit) || fallbackText;
      } catch {
        return fallbackText;
      }
    }
  };

  const userFriendlyError = (error) => {
    const message = normalizeMessage(error?.message || error, 'Transaction failed');
    if (/declin|reject|cancel/i.test(message)) {
      return 'Request was canceled in Freighter. No transaction was sent.';
    }
    return message;
  };

  const pushToast = (message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    setToasts((previous) => [...previous, { id, message: normalizeMessage(message, ''), type }]);
    return id;
  };

  const dismissToast = (id) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  };

  const setErrorWithToast = (message) => {
    const nextMessage = normalizeMessage(message, 'Transaction failed');
    setErrorMessage(nextMessage);
    if (nextMessage) {
      pushToast(nextMessage, 'error');
    }
  };

  const setSuccessWithToast = (message) => {
    const nextMessage = normalizeMessage(message, 'Success');
    setSuccessMessage(nextMessage);
    if (nextMessage) {
      pushToast(nextMessage, 'success');
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem('isdasure-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    setThemeReady(true);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((previous) => (previous === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    window.localStorage.setItem('isdasure-wallet', JSON.stringify(wallet));
  }, [wallet]);

  useEffect(() => {
    window.localStorage.setItem('isdasure-auth', JSON.stringify(auth));
  }, [auth]);

  useEffect(() => {
    window.localStorage.setItem('isdasure-selected-role', selectedRole);
  }, [selectedRole]);

  useEffect(() => {
    window.localStorage.setItem('isdasure-active-group', activeGroupName);
  }, [activeGroupName]);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await apiGetStatus();
        setPoolState((previous) => ({
          ...previous,
          ...response.status,
        }));
        if (Array.isArray(response.status?.payoutLogs)) {
          setPayoutHistory(response.status.payoutLogs);
        }
      } catch {
        setPoolState(defaultPoolState);
        setPayoutHistory([]);
      }
    };

    loadStatus();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await apiGetChainHistory(40);
        setChainHistory(response.history || []);
      } catch {
        setChainHistory([]);
      }
    };

    loadHistory();
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      if (auth.role !== 'admin') return;
      try {
        const response = await apiUsers();
        setUsers(response.users || []);
      } catch {
        setUsers([]);
      }
    };

    loadUsers();
  }, [auth.role]);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const response = await apiListGroups();
        setGroups(response.groups || []);
      } catch {
        setGroups([]);
      }
    };

    loadGroups();
  }, []);

  useEffect(() => {
    const loadMyGroups = async () => {
      if (!auth.isAuthenticated || !auth.user) {
        setMyGroups([]);
        return;
      }

      try {
        const response = await apiMyGroups({
          identifier: auth.user.identifier,
          walletAddress: wallet.address || auth.user.walletAddress,
          fullName: auth.user.fullName,
        });
        const nextGroups = response.groups || [];
        setMyGroups(nextGroups);
        setActiveGroupName((previous) => (nextGroups.some((group) => group.name === previous) ? previous : nextGroups[0]?.name || ''));
      } catch {
        setMyGroups([]);
      }
    };

    loadMyGroups();
  }, [auth.isAuthenticated, auth.user, wallet.address]);

  useEffect(() => {
    const intervalId = window.setInterval(async () => {
      try {
        const response = await apiGetStatus();
        setPoolState((previous) => ({
          ...previous,
          ...response.status,
        }));
        if (Array.isArray(response.status?.payoutLogs)) {
          setPayoutHistory(response.status.payoutLogs);
        }
      } catch {
        // keep UI stable
      }
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, []);

  const connectWallet = async () => {
    const address = await connectFreighterWallet();

    if (!isValidWalletAddress(address)) {
      throw new Error('Freighter returned an invalid wallet address. Please reconnect the wallet and try again.');
    }

    setWallet({ connected: true, address });
    setSuccessWithToast('Wallet connected successfully');
    return address;
  };

  const hasFreighter = () => {
    return isFreighterAvailable();
  };

  const disconnectWallet = () => {
    setWallet(defaultWalletState);
    setAuth(defaultAuthState);
    setSelectedRole('');
    setSuccessWithToast('Wallet disconnected');
  };

  const selectRole = (role) => {
    setSelectedRole(role);
    setSuccessWithToast('Role selected');
  };

  const login = async ({ identifier, password, role }) => {
    setLoading(true);
    setLoadingAction('login');
    setErrorMessage('');

    try {
      const response = await apiLogin({ identifier, password, role });
      const nextAuth = {
        isAuthenticated: true,
        role: response.user.role,
        user: response.user,
      };
      setAuth(nextAuth);
      setTransactionHistory(normalizeActivityHistory(response.user.activityHistory || [], response.user));
      setSuccessWithToast(`${response.user.role === 'admin' ? 'Admin' : 'User'} login successful`);
      return response.user;
    } catch (error) {
      setErrorWithToast(error.message || 'Transaction failed');
      throw error;
    } finally {
      setLoading(false);
      setLoadingAction('');
    }
  };

  const register = async ({ fullName, identifier, password, age, profilePicture }) => {
    setLoading(true);
    setLoadingAction('register');
    setErrorMessage('');

    try {
      const response = await apiRegister({
        fullName,
        identifier,
        password,
        age,
        walletAddress: wallet.address,
        profilePicture,
      });
      const nextAuth = {
        isAuthenticated: true,
        role: 'user',
        user: response.user,
      };
      setAuth(nextAuth);
      setTransactionHistory(normalizeActivityHistory(response.user.activityHistory || [], response.user));
      setSuccessWithToast('Registration successful');
      return response.user;
    } catch (error) {
      setErrorWithToast(error.message || 'Transaction failed');
      throw error;
    } finally {
      setLoading(false);
      setLoadingAction('');
    }
  };

  const logout = () => {
    setAuth(defaultAuthState);
    setSelectedRole('');
    setTransactionHistory([]);
    setPayoutHistory([]);
    setMyGroups([]);
    setActiveGroupName('');
    setSuccessWithToast('Signed out');
  };

  const createGroup = async (groupName) => {
    if (!auth.isAuthenticated || !auth.user) {
      throw new Error('Please sign in first.');
    }
    const response = await apiCreateGroup({
      groupName,
      identifier: auth.user.identifier,
      walletAddress: wallet.address || auth.user.walletAddress,
      fullName: auth.user.fullName,
      dailyLimit: Number(poolState?.contributionRules?.dailyPesoLimit || 1000),
    });
    const next = response.group;
    await refreshGroupCollections();
    setMyGroups((previous) => {
      const filtered = previous.filter((item) => item.name !== next.name);
      return [next, ...filtered];
    });
    setGroups((previous) => {
      const filtered = previous.filter((item) => item.name !== next.name);
      return [next, ...filtered];
    });
    setActiveGroupName(next.name);
    setSuccessWithToast(`Group ${next.name} created`);
    return next;
  };

  const joinGroup = async (groupName) => {
    if (!auth.isAuthenticated || !auth.user) {
      throw new Error('Please sign in first.');
    }
    const response = await apiJoinGroup({
      groupName,
      identifier: auth.user.identifier,
      walletAddress: wallet.address || auth.user.walletAddress,
      fullName: auth.user.fullName,
    });
    const next = response.group;
    await refreshGroupCollections();
    setMyGroups((previous) => {
      const filtered = previous.filter((item) => item.name !== next.name);
      return [next, ...filtered];
    });
    setGroups((previous) => {
      const filtered = previous.filter((item) => item.name !== next.name);
      return [next, ...filtered];
    });
    setActiveGroupName(next.name);
    setSuccessWithToast(`Joined group ${next.name}`);
    return next;
  };

  const approveJoinRequest = async (groupName, targetMember) => {
    if (!auth.isAuthenticated || !auth.user) {
      throw new Error('Please sign in first.');
    }
    const response = await apiApproveGroupJoin({
      groupName,
      approver: {
        identifier: auth.user.identifier,
        walletAddress: wallet.address || auth.user.walletAddress,
        fullName: auth.user.fullName,
      },
      target: targetMember,
    });

    await refreshGroupCollections();
    setSuccessWithToast('Join request approved');
    return response.group;
  };

  const rejectJoinRequest = async (groupName, targetMember) => {
    if (!auth.isAuthenticated || !auth.user) {
      throw new Error('Please sign in first.');
    }
    const response = await apiRejectGroupJoin({
      groupName,
      approver: {
        identifier: auth.user.identifier,
        walletAddress: wallet.address || auth.user.walletAddress,
        fullName: auth.user.fullName,
      },
      target: targetMember,
    });

    await refreshGroupCollections();
    setSuccessWithToast('Join request rejected');
    return response.group;
  };

  const refreshStatus = async () => {
    const response = await apiGetStatus();
    setPoolState((previous) => ({
      ...previous,
      ...response.status,
    }));
    if (Array.isArray(response.status?.payoutLogs)) {
      setPayoutHistory(response.status.payoutLogs);
    }
    if (Array.isArray(response.status?.chainHistory)) {
      setChainHistory(response.status.chainHistory);
    }
    return response.status;
  };

  const contribute = async (amount) => {
    if (!auth.isAuthenticated || auth.role !== 'user') {
      throw new Error('Unauthorized action');
    }
    if (!wallet.connected || !wallet.address) {
      throw new Error('Wallet not connected');
    }

    const minAmount = Number(poolState?.contributionRules?.minAmount || 10);
    const maxAmount = Number(poolState?.contributionRules?.maxAmount || 100000);
    const normalizedAmount = Number(amount);

    if (!Number.isFinite(normalizedAmount) || normalizedAmount < minAmount || normalizedAmount > maxAmount) {
      throw new Error(`Contribution must be between ${minAmount} and ${maxAmount}.`);
    }
    if (!activeGroupName) {
      throw new Error('Join or create a group before contributing.');
    }

    setLoading(true);
    setLoadingAction('contribute');
    setErrorMessage('');
    setTxLifecycle(defaultTxLifecycle);

    try {
      const prepared = await prepareContributeInvocation({
        user: auth.user?.fullName || auth.user?.identifier || wallet.address,
        identifier: auth.user?.identifier || '',
        walletAddress: wallet.address,
        amount: normalizedAmount,
        groupId: activeGroup?.id,
        groupName: activeGroupName,
      });

      const nonce = createNonce();
      const requiresWalletSignature = prepared?.mode !== 'mock' || shouldRequireWalletSignature();
      let signedTxXdr = '';

      if (requiresWalletSignature) {
        setWalletApprovalAction('contribute');
        const signed = prepared?.mode === 'mock'
          ? await signFreighterTransaction({
              walletAddress: wallet.address,
              action: 'contribute',
              payload: {
                user: auth.user?.fullName || auth.user?.identifier || wallet.address,
                identifier: auth.user?.identifier || '',
                walletAddress: wallet.address,
                amount: normalizedAmount,
                groupId: activeGroup?.id,
                groupName: activeGroupName,
                nonce,
              },
              memoText: `IsdaSure contribute ${normalizedAmount}`,
            })
          : await signPreparedFreighterTransaction({
              unsignedTxXdr: prepared.unsignedTxXdr,
              networkPassphrase: prepared.networkPassphrase,
            });
        signedTxXdr = signed.signedTxXdr;
      }
      setWalletApprovalAction('');
      setTxLifecycle((previous) => ({
        ...previous,
        phase: 'pending',
        status: 'PENDING',
      }));

      const response = await invokeContribute({
        user: auth.user?.fullName || auth.user?.identifier || wallet.address,
        identifier: auth.user?.identifier || '',
        walletAddress: wallet.address,
        amount: normalizedAmount,
        groupId: activeGroup?.id,
        groupName: activeGroupName,
        nonce,
        signedTxXdr,
        networkPassphrase: prepared.networkPassphrase,
        contractId: prepared.contractId,
        contractMethod: prepared.method,
      });

      const nextStatus = response.status || response;
      const tx = response.tx || {};

      setPoolState((previous) => ({
        ...previous,
        ...nextStatus,
      }));
      if (Array.isArray(nextStatus.groups)) {
        setGroups(nextStatus.groups);
        if (auth.isAuthenticated && auth.user) {
          const mine = nextStatus.groups.filter((group) =>
            (group.members || []).some((member) =>
              memberMatchesUser(member, auth.user, wallet.address || auth.user.walletAddress),
            ),
          );
          setMyGroups(mine);
        }
      }
      if (Array.isArray(nextStatus.chainHistory)) {
        setChainHistory(nextStatus.chainHistory);
      }

      const entry = {
        id: `contribution-${Date.now()}`,
        type: 'contribution',
        actionLabel: 'Contribute',
        user: auth.user?.fullName || 'User',
        amount: normalizedAmount,
        groupName: activeGroupName,
        timestamp: new Date().toISOString(),
        txHash: tx.txHash || '',
        txStatus: tx.status || 'PENDING',
        explorerUrl: tx.explorerUrl || buildStellarExpertTxUrl(tx.txHash || ''),
      };

      setTransactionHistory((previous) => [entry, ...previous]);
      setTxLifecycle({
        phase: tx.status === 'FAILED' ? 'failed' : tx.status === 'CONFIRMED' ? 'confirmed' : 'pending',
        txHash: tx.txHash || '',
        status: tx.status || 'PENDING',
        ledger: tx.ledger || null,
        explorerUrl: tx.explorerUrl || buildStellarExpertTxUrl(tx.txHash || ''),
        actionLabel: 'Contribute',
        contractResult: tx.contractResult || null,
      });
      if (tx.mode === 'mock') {
        pushToast('Running in mock chain mode. Configure Soroban RPC to get a real on-chain tx hash.', 'info');
      }
      setSuccessWithToast('✅ Contribution Successful');
      return nextStatus;
    } catch (error) {
      setWalletApprovalAction('');
      const message = userFriendlyError(error);
      setTxLifecycle((previous) => ({
        ...previous,
        phase: 'failed',
        status: 'FAILED',
      }));
      setErrorWithToast(message);
      throw error;
    } finally {
      setLoading(false);
      setLoadingAction('');
    }
  };

  const triggerStorm = async (groupNameOverride = '') => {
    if (!auth.isAuthenticated || auth.role !== 'admin') {
      throw new Error('Unauthorized action');
    }
    if (!wallet.connected || !wallet.address) {
      throw new Error('Wallet not connected');
    }
    if (ADMIN_WALLET_ADDRESS && wallet.address.toUpperCase() !== ADMIN_WALLET_ADDRESS) {
      throw new Error('Only the admin wallet can trigger storm day.');
    }

    const targetGroupName = String(groupNameOverride || activeGroupName || '').trim();
    if (!targetGroupName) {
      throw new Error('Select a group before triggering storm day.');
    }

    const targetGroup = mergedGroups.find((group) => group.name === targetGroupName);
    if (!targetGroup) {
      throw new Error('Selected group was not found. Refresh and try again.');
    }

    setLoading(true);
    setLoadingAction('storm');
    setErrorMessage('');
    setTxLifecycle(defaultTxLifecycle);

    try {
      const prepared = await prepareTriggerStormInvocation({
        admin: auth.user?.identifier || auth.user?.fullName || 'admin',
        walletAddress: wallet.address,
        groupId: targetGroup.id,
        groupName: targetGroup.name,
      });

      const nonce = createNonce();
      const requiresWalletSignature = prepared?.mode !== 'mock' || shouldRequireWalletSignature();
      let signedTxXdr = '';

      if (requiresWalletSignature) {
        setWalletApprovalAction('storm');
        const signed = prepared?.mode === 'mock'
          ? await signFreighterTransaction({
              walletAddress: wallet.address,
              action: 'storm',
              payload: {
                admin: auth.user?.identifier || auth.user?.fullName || 'admin',
                walletAddress: wallet.address,
                groupId: targetGroup.id,
                groupName: targetGroup.name,
                nonce,
              },
              memoText: `IsdaSure storm ${targetGroup.name}`,
            })
          : await signPreparedFreighterTransaction({
              unsignedTxXdr: prepared.unsignedTxXdr,
              networkPassphrase: prepared.networkPassphrase,
            });
        signedTxXdr = signed.signedTxXdr;
      }
      setWalletApprovalAction('');
      setTxLifecycle((previous) => ({
        ...previous,
        phase: 'pending',
        status: 'PENDING',
      }));

      const response = await invokeTriggerStorm({
        admin: auth.user?.identifier || auth.user?.fullName || 'admin',
        walletAddress: wallet.address,
        groupId: targetGroup.id,
        groupName: targetGroup.name,
        nonce,
        signedTxXdr,
        networkPassphrase: prepared.networkPassphrase,
        contractId: prepared.contractId,
        contractMethod: prepared.method,
      });

      const nextStatus = response.status || response;
      const tx = response.tx || {};

      setPoolState((previous) => ({
        ...previous,
        ...nextStatus,
      }));
      if (Array.isArray(nextStatus.groups)) {
        setGroups(nextStatus.groups);
      }
      if (Array.isArray(nextStatus.chainHistory)) {
        setChainHistory(nextStatus.chainHistory);
      }
      const payoutEntries = (nextStatus.payouts || []).map((item) => ({
        id: `payout-${Date.now()}-${item.user}`,
        type: 'payout',
        actionLabel: 'Payout Release',
        user: item.user,
        amount: item.amount,
        timestamp: new Date().toISOString(),
        txHash: tx.txHash || '',
        txStatus: tx.status || 'PENDING',
        explorerUrl: tx.explorerUrl || buildStellarExpertTxUrl(tx.txHash || ''),
      }));

      setPayoutHistory(Array.isArray(nextStatus.payoutLogs) ? nextStatus.payoutLogs : payoutEntries);
      setTransactionHistory((previous) => [...payoutEntries, ...previous]);
      setTxLifecycle({
        phase: tx.status === 'FAILED' ? 'failed' : tx.status === 'CONFIRMED' ? 'confirmed' : 'pending',
        txHash: tx.txHash || '',
        status: tx.status || 'PENDING',
        ledger: tx.ledger || null,
        explorerUrl: tx.explorerUrl || buildStellarExpertTxUrl(tx.txHash || ''),
        actionLabel: 'Payout Release',
        contractResult: tx.contractResult || null,
      });
      if (tx.mode === 'mock') {
        pushToast('Running in mock chain mode. Configure Soroban RPC to get a real on-chain tx hash.', 'info');
      }
      setSuccessWithToast('🌧️ Storm Triggered');

      const activeUserName = auth.user?.fullName || auth.user?.identifier || '';
      const myPayout = payoutEntries.find((entry) => entry.user === activeUserName);
      if (myPayout) {
        pushToast(`💸 You received: ${myPayout.amount} XLM`, 'success');
      }

      return nextStatus;
    } catch (error) {
      setWalletApprovalAction('');
      const message = userFriendlyError(error);
      setTxLifecycle((previous) => ({
        ...previous,
        phase: 'failed',
        status: 'FAILED',
      }));
      setErrorWithToast(message);
      throw error;
    } finally {
      setLoading(false);
      setLoadingAction('');
    }
  };

  const currentUser = auth.user;
  const myActivity = useMemo(() => {
    if (!currentUser) return [];
    return transactionHistory.filter((entry) => entry.user === currentUser.fullName || entry.user === currentUser.identifier);
  }, [currentUser, transactionHistory]);

  const userProfile = {
    name: currentUser?.fullName || 'Guest',
    picture: currentUser?.profilePicture || '',
    walletAddress: wallet.address,
    totalContributions: myActivity.filter((entry) => entry.type === 'contribution').reduce((sum, entry) => sum + entry.amount, 0),
    myActivity,
  };

  const isAdminWallet = ADMIN_WALLET_ADDRESS
    ? wallet.address.toUpperCase() === ADMIN_WALLET_ADDRESS
    : auth.role === 'admin' && wallet.connected;

  const value = {
    theme,
    setTheme,
    toggleTheme,
    themeReady,
    wallet,
    walletConnected: wallet.connected,
    connectionStatus: wallet.connected ? 'Connected' : 'Not Connected',
    walletAddress: wallet.address,
    shortWalletAddress: shortAddress(wallet.address),
    adminWalletAddress: ADMIN_WALLET_ADDRESS,
    isAdminWallet,
    hasFreighter,
    connectWallet,
    disconnectWallet,
    auth,
    isAuthenticated: auth.isAuthenticated,
    userRole: auth.role,
    currentUser,
    selectedRole,
    setSelectedRole: selectRole,
    loading,
    loadingAction,
    errorMessage,
    successMessage,
    toasts,
    dismissToast,
    clearStatusMessages: () => {
      setErrorMessage('');
      setSuccessMessage('');
    },
    poolState,
    users,
    transactionHistory,
    payoutHistory,
    chainHistory,
    txLifecycle,
    walletApprovalAction,
    userProfile,
    myActivity,
    refreshStatus,
    groups,
    mergedGroups,
    myGroups,
    activeGroupName,
    setActiveGroupName,
    activeGroup,
    activeGroupContributionHistory,
    activeGroupMemberStats,
    createGroup,
    joinGroup,
    approveJoinRequest,
    rejectJoinRequest,
    login,
    register,
    logout,
    contribute,
    triggerStorm,
    fetchUsers: async () => {
      const response = await apiUsers();
      setUsers(response.users || []);
      return response.users || [];
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
