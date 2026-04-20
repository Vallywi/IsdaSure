import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PoolCard from '../components/PoolCard';
import SpotlightCard from '../components/SpotlightCard';
import TransactionHistoryList from '../components/TransactionHistoryList';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';

export default function Admin() {
  const navigate = useNavigate();
  const {
    walletConnected,
    connectionStatus,
    shortWalletAddress,
    userRole,
    poolState,
    users,
    groups,
    payoutHistory,
    loadingAction,
    successMessage,
    isAdminWallet,
    txLifecycle,
    walletApprovalAction,
  } = useWallet();
  const { triggerStormOnContract } = useContract();
  const [selectedStormGroup, setSelectedStormGroup] = useState('');

  const usersWithStats = useMemo(() => {
    return users
      .filter((user) => user.role === 'user')
      .map((user) => {
      const totalContributions = (user.activityHistory || [])
        .filter((entry) => entry.type === 'contribution')
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

      const userGroupNames = (groups || [])
        .filter((group) =>
          (group.members || []).some((member) => {
            const identifierMatch =
              String(member.identifier || '').trim().toLowerCase() ===
              String(user.identifier || '').trim().toLowerCase();
            const walletMatch =
              String(member.walletAddress || '').trim().toUpperCase() &&
              String(member.walletAddress || '').trim().toUpperCase() === String(user.walletAddress || '').trim().toUpperCase();
            const fullNameMatch =
              String(member.fullName || '').trim().toLowerCase() ===
              String(user.fullName || '').trim().toLowerCase();

            return identifierMatch || walletMatch || fullNameMatch;
          }),
        )
        .map((group) => group.name);

      return {
        ...user,
        totalContributions,
        userGroupNames,
        avatarInitials: String(user.fullName || 'U')
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() || '')
          .join(''),
      };
    });
  }, [groups, users]);

  const allGroupsSummary = useMemo(() => {
    return (groups || []).map((group) => ({
      id: group.id,
      name: group.name,
      members: Array.isArray(group.members) ? group.members.length : Number(group.memberCount || 0),
      totalPool: Number(group.totalPool || 0),
    }));
  }, [groups]);

  useEffect(() => {
    if (selectedStormGroup && !allGroupsSummary.some((group) => group.name === selectedStormGroup)) {
      setSelectedStormGroup('');
    }
  }, [allGroupsSummary, selectedStormGroup]);

  useEffect(() => {
    if (!walletConnected) {
      navigate('/');
      return;
    }
    if (userRole !== 'admin') {
      navigate('/dashboard');
    }
  }, [navigate, userRole, walletConnected]);

  const handleTriggerStorm = async () => {
    try {
      await triggerStormOnContract(selectedStormGroup);
    } catch {
      // shared state already shows error
    }
  };

  return (
    <div className="isdasure-shell">
      <Navbar />
      <main className="space-y-8 py-6 md:py-10">
        <SpotlightCard className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-4">
            <p className="linear-kicker">Admin dashboard</p>
            <h1 className="linear-heading max-w-2xl text-4xl sm:text-5xl md:text-6xl">
              Manage storm triggers and monitor user activity from one place.
            </h1>
            <p className="linear-lead max-w-2xl">
              The admin view is intentionally compact: clear action, clear users, clear payout logs.
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--border-accent)] bg-[color:var(--accent-glow)] px-6 py-8 text-[color:var(--foreground)] shadow-[0_8px_26px_rgba(94,106,210,0.22)]">
            <p className="linear-kicker !text-[rgba(237,239,242,0.7)]">Wallet Address</p>
            <p className="mt-3 text-2xl font-semibold">{walletConnected ? shortWalletAddress : 'Not connected'}</p>
            <p className="mt-2 text-sm font-medium text-white/85">Status: {connectionStatus}</p>
            <p className="mt-4 text-sm text-white/80">Storm trigger is restricted to admin accounts only.</p>
          </div>
        </SpotlightCard>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <PoolCard title="Total Pool" value={poolState.totalPool} suffix="XLM" hint="Current community balance" />
          <PoolCard title="Contributors" value={usersWithStats.length} hint="Visible contributors in admin portal" />
          <PoolCard title="Admin Status" value={successMessage || 'Ready'} hint="Admin only controls" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <SpotlightCard className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">Trigger Storm Day</h2>
            <p className="text-sm linear-muted">This action is restricted to admin accounts only.</p>
            {isAdminWallet ? (
              <div className="space-y-3">
                <select value={selectedStormGroup} onChange={(event) => setSelectedStormGroup(event.target.value)} className="linear-input w-full">
                  <option value="">Select group</option>
                  {allGroupsSummary.map((group) => (
                    <option key={group.id || group.name} value={group.name}>
                      {group.name} ({group.members} members)
                    </option>
                  ))}
                </select>
                <button type="button" onClick={handleTriggerStorm} disabled={loadingAction === 'storm' || !selectedStormGroup} className="linear-button-admin w-full">
                {loadingAction === 'storm' ? <span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current/40 border-t-current" />Triggering...</span> : 'Trigger Storm Day'}
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-[color:var(--border-default)] bg-[color:var(--surface)] p-4 text-sm linear-muted">
                Connect the configured admin wallet to enable storm trigger.
              </div>
            )}
            <div className="rounded-lg border border-[color:var(--border-default)] bg-[color:var(--surface)] p-4 text-sm linear-muted">
              Storm trigger is locked after payout until new contributions are made.
            </div>
            {txLifecycle.phase !== 'idle' ? (
              <div className="rounded-lg border border-[color:var(--border-default)] bg-[color:var(--surface)] px-4 py-3 text-sm linear-muted">
                <p className="font-semibold text-[color:var(--foreground)]">
                  Transaction: {txLifecycle.phase === 'pending' ? 'Pending' : txLifecycle.phase === 'confirmed' ? 'Confirmed' : 'Failed'}
                </p>
                {txLifecycle.txHash ? <p className="mt-1 break-all text-xs">Hash: {txLifecycle.txHash}</p> : null}
                {txLifecycle.explorerUrl ? (
                  <a href={txLifecycle.explorerUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-[color:var(--accent-bright)] underline">
                    View on Stellar Expert
                  </a>
                ) : null}
              </div>
            ) : null}
          </SpotlightCard>

          <SpotlightCard className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">Groups</h2>
            <div className="space-y-3">
              {allGroupsSummary.map((group) => (
                <div key={group.id || group.name} className="rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] p-4 text-sm">
                  <p className="font-semibold text-[color:var(--foreground)]">{group.name}</p>
                  <p className="mt-1 linear-muted">Members: {group.members}</p>
                  <p className="linear-muted">Group Pool: ₱{group.totalPool}</p>
                </div>
              ))}
              {!allGroupsSummary.length ? (
                <div className="rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] p-4 text-sm linear-muted">
                  No groups yet.
                </div>
              ) : null}
            </div>
          </SpotlightCard>

        </section>

        <TransactionHistoryList title="Payout Logs" items={payoutHistory} emptyText="No payout logs yet" />
      </main>
      {walletApprovalAction === 'storm' ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[color:var(--border-accent)] bg-[color:var(--surface)] p-6 text-center text-[color:var(--foreground)] shadow-[0_22px_44px_rgba(2,6,23,0.45)]">
            <p className="text-lg font-semibold">Waiting for Freighter approval</p>
            <p className="mt-2 text-sm linear-muted">Approve the admin transaction in Freighter to continue.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
