import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PoolCard from '../components/PoolCard';
import ProfileCard from '../components/ProfileCard';
import SpotlightCard from '../components/SpotlightCard';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    walletConnected,
    connectionStatus,
    userRole,
    userProfile,
    poolState,
    shortWalletAddress,
    groups,
    myGroups,
    activeGroupName,
    setActiveGroupName,
    createGroup,
    joinGroup,
    successMessage,
    loadingAction,
    txLifecycle,
    walletApprovalAction,
  } = useWallet();
  const { contributeToContract } = useContract();
  const minAmount = Number(poolState?.contributionRules?.minAmount || 10);
  const maxAmount = Number(poolState?.contributionRules?.maxAmount || 100000);
  const dailyLimit = Number(poolState?.contributionRules?.dailyPesoLimit || 1000);
  const estimatedFee = Number(poolState?.contributionRules?.estimatedFeeXlm || 0.00001);
  const [amount, setAmount] = useState(50);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinGroupName, setJoinGroupName] = useState('');
  const [groupError, setGroupError] = useState('');

  const getSafeErrorMessage = (error, fallback) => {
    try {
      if (typeof error?.message === 'string' && error.message) {
        return error.message.slice(0, 240);
      }
      return String(error || fallback).slice(0, 240) || fallback;
    } catch {
      return fallback;
    }
  };

  const amountError = Number.isFinite(Number(amount))
    ? Number(amount) < minAmount || Number(amount) > maxAmount
      ? `Amount must be between ${minAmount} and ${maxAmount}`
      : ''
    : 'Amount must be a valid number';

  useEffect(() => {
    if (!walletConnected) {
      navigate('/');
      return;
    }
    if (userRole === 'admin') {
      navigate('/admin');
    }
  }, [navigate, userRole, walletConnected]);

  useEffect(() => {
    if (activeGroupName) {
      setGroupError('');
    }
  }, [activeGroupName]);

  const handleContribute = async () => {
    if (!activeGroupName) {
      setGroupError('Create or join a group, then select it before contributing.');
      return;
    }
    if (amountError) {
      return;
    }
    try {
      setGroupError('');
      await contributeToContract(Number(amount));
    } catch (error) {
      setGroupError(getSafeErrorMessage(error, 'Contribution failed.'));
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      setGroupError('');
      await createGroup(newGroupName.trim());
      setNewGroupName('');
    } catch (error) {
      setGroupError(getSafeErrorMessage(error, 'Unable to create group.'));
    }
  };

  const handleJoinGroup = async () => {
    if (!joinGroupName.trim()) return;
    try {
      setGroupError('');
      await joinGroup(joinGroupName.trim());
      setJoinGroupName('');
    } catch (error) {
      setGroupError(getSafeErrorMessage(error, 'Unable to join group.'));
    }
  };

  return (
    <div className="isdasure-shell">
      <Navbar />
      <main className="space-y-8 py-6 md:py-10">
        <SpotlightCard className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-4">
            <p className="linear-kicker">User dashboard</p>
            <h1 className="linear-heading max-w-2xl text-4xl sm:text-5xl md:text-6xl">
              Keep track of your pool, your profile, and your contribution history.
            </h1>
            <p className="linear-lead max-w-2xl">
              The layout keeps the important actions visible while reducing clutter and emphasizing wallet-linked identity.
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--border-accent)] bg-[color:var(--accent-glow)] px-6 py-8 text-[color:var(--foreground)] shadow-[0_8px_26px_rgba(94,106,210,0.22)]">
            <p className="linear-kicker">Wallet Address</p>
            <p className="mt-3 text-2xl font-semibold">{walletConnected ? shortWalletAddress : 'Not connected'}</p>
            <p className="mt-2 text-sm font-medium text-[color:var(--foreground-muted)]">Status: {connectionStatus}</p>
            <p className="mt-4 text-sm text-[color:var(--foreground-muted)]">Contributions update in real time after each action.</p>
          </div>
        </SpotlightCard>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <PoolCard title="Total Pool Amount" value={poolState.totalPool} suffix="XLM" hint="Community pool available now" />
          <PoolCard title="Number of Contributors" value={poolState.contributors} hint="Registered contributors" />
          <PoolCard title="Status" value={successMessage || 'Ready'} hint="Wallet-linked dashboard" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <ProfileCard
            name={userProfile.name}
            picture={userProfile.picture}
            walletAddress={userProfile.walletAddress}
            description="User Profile"
          />

          <SpotlightCard className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">Contribute</h2>
            <p className="text-sm linear-muted">Support the pool with a custom contribution amount.</p>
            <div className="rounded-lg border border-[color:var(--border-default)] bg-[color:var(--surface)]/82 p-4 text-sm linear-muted space-y-3">
              <p className="font-semibold text-[color:var(--foreground)]">Contribution Group</p>
              <select
                value={activeGroupName}
                onChange={(event) => setActiveGroupName(event.target.value)}
                className="linear-input w-full"
              >
                <option value="">Select group</option>
                {[...myGroups, ...groups]
                  .filter((group, index, array) => array.findIndex((item) => item.name === group.name) === index)
                  .map((group) => (
                    <option key={group.id || group.name} value={group.name}>
                      {group.name}
                    </option>
                  ))}
              </select>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(event) => setNewGroupName(event.target.value)}
                  placeholder="Create group name"
                  className="linear-input w-full"
                />
                <button type="button" onClick={handleCreateGroup} disabled={loadingAction === 'contribute' || !newGroupName.trim()} className="linear-button-secondary disabled:cursor-not-allowed disabled:opacity-60">Create</button>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  type="text"
                  value={joinGroupName}
                  onChange={(event) => setJoinGroupName(event.target.value)}
                  placeholder="Join existing group"
                  className="linear-input w-full"
                />
                <button type="button" onClick={handleJoinGroup} disabled={loadingAction === 'contribute' || !joinGroupName.trim()} className="linear-button-secondary disabled:cursor-not-allowed disabled:opacity-60">Join</button>
              </div>
              <p className="text-xs text-[color:var(--foreground-muted)]">Current group: {activeGroupName || 'None selected'}</p>
              <p className="text-xs">Daily user limit: ₱{dailyLimit}</p>
              {groupError ? <p className="text-xs font-semibold text-rose-400">{groupError}</p> : null}
            </div>
            <label className="space-y-2 text-sm linear-muted">
              <span>Amount (₱)</span>
              <input
                type="number"
                min={minAmount}
                max={maxAmount}
                step="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="linear-input w-full"
              />
            </label>
            <p className="text-xs linear-muted">Min: ₱{minAmount} | Max: ₱{maxAmount} | Daily Limit: ₱{dailyLimit} | Estimated Fee: {estimatedFee} XLM</p>
            {amountError ? <p className="text-xs font-semibold text-rose-400">{amountError}</p> : null}
            <button type="button" onClick={handleContribute} disabled={loadingAction === 'contribute' || Boolean(amountError)} className="linear-button-primary w-full">
              {loadingAction === 'contribute' ? <span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Processing...</span> : `Contribute ₱${Number(amount || 0)}`}
            </button>
            <div className="rounded-lg border border-[color:var(--border-default)] bg-[color:var(--surface)] p-4 text-sm linear-muted">
              Wallet Address: {walletConnected ? shortWalletAddress : 'Not connected'}
            </div>
            {txLifecycle.phase !== 'idle' ? (
              <div className="rounded-lg border border-[color:var(--border-default)] bg-[color:var(--surface)] px-4 py-3 text-sm linear-muted">
                <p className="font-semibold text-[color:var(--foreground)]">
                  Transaction: {txLifecycle.phase === 'pending' ? 'Pending' : txLifecycle.phase === 'confirmed' ? 'Confirmed' : 'Failed'}
                </p>
                {txLifecycle.txHash ? <p className="mt-1 break-all text-xs">Hash: {txLifecycle.txHash}</p> : null}
                {txLifecycle.ledger ? <p className="mt-1 text-xs">Ledger: {txLifecycle.ledger}</p> : null}
                {txLifecycle.explorerUrl ? (
                  <a href={txLifecycle.explorerUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-[color:var(--accent-bright)] underline">
                    View on Stellar Expert
                  </a>
                ) : null}
              </div>
            ) : null}
            {successMessage ? <p className="rounded-lg border border-[color:var(--border-accent)] bg-[color:var(--accent-glow)] px-4 py-3 text-sm font-medium text-[color:var(--foreground)]">{successMessage}</p> : null}
          </SpotlightCard>
        </section>
      </main>
      {walletApprovalAction === 'contribute' ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[color:var(--border-accent)] bg-[color:var(--surface)] p-6 text-center text-[color:var(--foreground)] shadow-[0_22px_44px_rgba(2,6,23,0.45)]">
            <p className="text-lg font-semibold">Waiting for Freighter approval</p>
            <p className="mt-2 text-sm linear-muted">Approve the transaction in Freighter to continue.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
