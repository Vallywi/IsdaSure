import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  apiCreateGroup,
  apiGetChainHistory,
  apiGetStatus,
  apiJoinGroup,
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
  signPreparedFreighterTransaction,
} from '../services/freighter';
import {
  invokeContribute,
  invokeTriggerStorm,
  prepareContributeInvocation,
  prepareTriggerStormInvocation,
} from '../services/contract';

const defaultPoolState = {
  chainMode: 'mock',
  rpcConfigured: false,
  totalPool: 200,
  contributors: 6,
  contributorNames: ['Ana', 'Ben', 'Cora', 'Dino', 'Ella', 'Fritz'],
  recentContributions: [
    { user: 'Ana', amount: 50, timestamp: new Date().toISOString() },
    { user: 'Ben', amount: 50, timestamp: new Date().toISOString() },
    { user: 'Cora', amount: 50, timestamp: new Date().toISOString() },
  ],
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

function shortAddress(address) {
  return formatWalletAddress(address);
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
    explorerUrl: entry.explorerUrl || entry.metadata?.explorerUrl || '',
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
  const [wallet, setWallet] = useState(() => readStoredValue('isdasure-wallet', defaultWalletState));
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

  const createNonce = () => `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

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
        if (!nextGroups.some((group) => group.name === activeGroupName)) {
          setActiveGroupName(nextGroups[0]?.name || '');
        }
      } catch {
        setMyGroups([]);
      }
    };

    loadMyGroups();
  }, [activeGroupName, auth.isAuthenticated, auth.user, wallet.address]);

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
    const [allGroupsResponse, myGroupsResponse] = await Promise.all([
      apiListGroups().catch(() => ({ groups: [] })),
      apiMyGroups({
        identifier: auth.user.identifier,
        walletAddress: wallet.address || auth.user.walletAddress,
        fullName: auth.user.fullName,
      }).catch(() => ({ groups: [] })),
    ]);

    setGroups(allGroupsResponse.groups || []);
    setMyGroups(myGroupsResponse.groups || []);
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
    const [allGroupsResponse, myGroupsResponse] = await Promise.all([
      apiListGroups().catch(() => ({ groups: [] })),
      apiMyGroups({
        identifier: auth.user.identifier,
        walletAddress: wallet.address || auth.user.walletAddress,
        fullName: auth.user.fullName,
      }).catch(() => ({ groups: [] })),
    ]);

    setGroups(allGroupsResponse.groups || []);
    setMyGroups(myGroupsResponse.groups || []);
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
        groupName: activeGroupName,
      });

      const nonce = createNonce();
      const requiresWalletSignature = prepared?.mode !== 'mock';
      let signedTxXdr = '';

      if (requiresWalletSignature) {
        setWalletApprovalAction('contribute');
        const signed = await signPreparedFreighterTransaction({
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
      if (Array.isArray(nextStatus.chainHistory)) {
        setChainHistory(nextStatus.chainHistory);
      }

      const entry = {
        id: `contribution-${Date.now()}`,
        type: 'contribution',
        user: auth.user?.fullName || 'User',
        amount: normalizedAmount,
        groupName: activeGroupName,
        timestamp: new Date().toISOString(),
        txHash: tx.txHash || '',
        txStatus: tx.status || 'PENDING',
        explorerUrl: tx.explorerUrl || '',
      };

      setTransactionHistory((previous) => [entry, ...previous]);
      setTxLifecycle({
        phase: tx.status === 'FAILED' ? 'failed' : tx.status === 'CONFIRMED' ? 'confirmed' : 'pending',
        txHash: tx.txHash || '',
        status: tx.status || 'PENDING',
        ledger: tx.ledger || null,
        explorerUrl: tx.explorerUrl || '',
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

  const triggerStorm = async () => {
    if (!auth.isAuthenticated || auth.role !== 'admin') {
      throw new Error('Unauthorized action');
    }
    if (!wallet.connected || !wallet.address) {
      throw new Error('Wallet not connected');
    }
    if (ADMIN_WALLET_ADDRESS && wallet.address.toUpperCase() !== ADMIN_WALLET_ADDRESS) {
      throw new Error('Only the admin wallet can trigger storm day.');
    }

    setLoading(true);
    setLoadingAction('storm');
    setErrorMessage('');
    setTxLifecycle(defaultTxLifecycle);

    try {
      const prepared = await prepareTriggerStormInvocation({
        admin: auth.user?.identifier || auth.user?.fullName || 'admin',
        walletAddress: wallet.address,
      });

      const nonce = createNonce();
      const requiresWalletSignature = prepared?.mode !== 'mock';
      let signedTxXdr = '';

      if (requiresWalletSignature) {
        setWalletApprovalAction('storm');
        const signed = await signPreparedFreighterTransaction({
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
      if (Array.isArray(nextStatus.chainHistory)) {
        setChainHistory(nextStatus.chainHistory);
      }
      const payoutEntries = (nextStatus.payouts || []).map((item) => ({
        id: `payout-${Date.now()}-${item.user}`,
        type: 'payout',
        user: item.user,
        amount: item.amount,
        timestamp: new Date().toISOString(),
        txHash: tx.txHash || '',
        txStatus: tx.status || 'PENDING',
        explorerUrl: tx.explorerUrl || '',
      }));

      setPayoutHistory(Array.isArray(nextStatus.payoutLogs) ? nextStatus.payoutLogs : payoutEntries);
      setTransactionHistory((previous) => [...payoutEntries, ...previous]);
      setTxLifecycle({
        phase: tx.status === 'FAILED' ? 'failed' : tx.status === 'CONFIRMED' ? 'confirmed' : 'pending',
        txHash: tx.txHash || '',
        status: tx.status || 'PENDING',
        ledger: tx.ledger || null,
        explorerUrl: tx.explorerUrl || '',
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
    myGroups,
    activeGroupName,
    setActiveGroupName,
    createGroup,
    joinGroup,
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
