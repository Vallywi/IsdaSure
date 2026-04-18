import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as freighterSdk from '@stellar/freighter-api';
import {
  apiContribute,
  apiGetStatus,
  apiLogin,
  apiRegister,
  apiTriggerStorm,
  apiUsers,
} from '../services/api';

const defaultPoolState = {
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

const defaultWalletState = {
  connected: false,
  address: '',
};

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
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return 'dark';
    }
    return window.localStorage.getItem('isdasure-theme') || 'dark';
  });
  const [wallet, setWallet] = useState(() => readStoredValue('isdasure-wallet', defaultWalletState));
  const [auth, setAuth] = useState(() => readStoredValue('isdasure-auth', defaultAuthState));
  const [poolState, setPoolState] = useState(defaultPoolState);
  const [users, setUsers] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [selectedRole, setSelectedRole] = useState(() => window.localStorage.getItem('isdasure-selected-role') || '');
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [themeReady, setThemeReady] = useState(false);

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
    const loadStatus = async () => {
      try {
        const response = await apiGetStatus();
        setPoolState((previous) => ({
          ...previous,
          ...response.status,
        }));
      } catch {
        setPoolState(defaultPoolState);
      }
    };

    loadStatus();
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
    const intervalId = window.setInterval(async () => {
      try {
        const response = await apiGetStatus();
        setPoolState((previous) => ({
          ...previous,
          ...response.status,
        }));
      } catch {
        // keep UI stable
      }
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, []);

  const connectWallet = async () => {
    if (typeof window === 'undefined') {
      throw new Error('Wallet connection is only available in the browser.');
    }

    const freighterApi = window.freighterApi;
    let address = '';

    if (freighterApi?.getPublicKey) {
      const result = await freighterApi.getPublicKey();
      if (result?.error) throw new Error(result.error);
      address = result?.publicKey || result?.address || result?.result || '';
    }

    if (!address && freighterSdk.requestAccess) {
      const result = await freighterSdk.requestAccess();
      if (result?.error) throw new Error(result.error);
      address = result?.address || result?.publicKey || '';
    }

    if (!address && freighterSdk.getAddress) {
      const result = await freighterSdk.getAddress();
      if (result?.error) throw new Error(result.error);
      address = result?.address || '';
    }

    if (!address) {
      throw new Error('Freighter wallet not detected or permission denied.');
    }

    setWallet({ connected: true, address });
    setSuccessMessage('Wallet connected successfully');
    return address;
  };

  const hasFreighter = () => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.freighterApi);
  };

  const disconnectWallet = () => {
    setWallet(defaultWalletState);
    setAuth(defaultAuthState);
    setSelectedRole('');
    setSuccessMessage('Wallet disconnected');
  };

  const selectRole = (role) => {
    setSelectedRole(role);
    setSuccessMessage('Role selected');
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
      setSuccessMessage(`${response.user.role === 'admin' ? 'Admin' : 'User'} login successful`);
      return response.user;
    } catch (error) {
      setErrorMessage(error.message || 'Transaction failed');
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
      setSuccessMessage('Registration successful');
      return response.user;
    } catch (error) {
      setErrorMessage(error.message || 'Transaction failed');
      throw error;
    } finally {
      setLoading(false);
      setLoadingAction('');
    }
  };

  const logout = () => {
    setAuth(defaultAuthState);
    setSelectedRole('');
    setSuccessMessage('Signed out');
  };

  const refreshStatus = async () => {
    const response = await apiGetStatus();
    setPoolState((previous) => ({
      ...previous,
      ...response.status,
    }));
    return response.status;
  };

  const contribute = async (amount) => {
    if (!auth.isAuthenticated || auth.role !== 'user') {
      throw new Error('Unauthorized action');
    }
    if (!wallet.connected || !wallet.address) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setLoadingAction('contribute');
    setErrorMessage('');

    try {
      const response = await apiContribute({
        user: auth.user?.fullName || auth.user?.identifier || wallet.address,
        walletAddress: wallet.address,
        amount,
      });

      const nextStatus = response.status || response;

      setPoolState((previous) => ({
        ...previous,
        ...nextStatus,
      }));

      const entry = {
        id: `contribution-${Date.now()}`,
        type: 'contribution',
        user: auth.user?.fullName || 'User',
        amount,
        timestamp: new Date().toISOString(),
      };

      setTransactionHistory((previous) => [entry, ...previous]);
      setSuccessMessage('Contribution successful');
      return nextStatus;
    } catch (error) {
      setErrorMessage(error.message || 'Transaction failed');
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

    setLoading(true);
    setLoadingAction('storm');
    setErrorMessage('');

    try {
      const response = await apiTriggerStorm({
        admin: auth.user?.identifier || auth.user?.fullName || 'admin',
        walletAddress: wallet.address,
      });

      const nextStatus = response.status || response;

      setPoolState((previous) => ({
        ...previous,
        ...nextStatus,
      }));
      const payoutEntries = (nextStatus.payouts || []).map((item) => ({
        id: `payout-${Date.now()}-${item.user}`,
        type: 'payout',
        user: item.user,
        amount: item.amount,
        timestamp: new Date().toISOString(),
      }));

      setPayoutHistory(payoutEntries);
      setTransactionHistory((previous) => [...payoutEntries, ...previous]);
      setSuccessMessage('Storm Triggered - Payout Sent');
      return nextStatus;
    } catch (error) {
      setErrorMessage(error.message || 'Transaction failed');
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

  const value = {
    theme,
    setTheme,
    toggleTheme,
    themeReady,
    wallet,
    walletConnected: wallet.connected,
    walletAddress: wallet.address,
    shortWalletAddress: shortAddress(wallet.address),
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
    clearStatusMessages: () => {
      setErrorMessage('');
      setSuccessMessage('');
    },
    poolState,
    users,
    transactionHistory,
    payoutHistory,
    userProfile,
    myActivity,
    refreshStatus,
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
