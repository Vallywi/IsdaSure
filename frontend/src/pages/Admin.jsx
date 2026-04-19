import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PoolCard from '../components/PoolCard';
import SpotlightCard from '../components/SpotlightCard';
import TransactionHistoryList from '../components/TransactionHistoryList';
import { useWallet } from '../hooks/useWallet';

export default function Admin() {
  const navigate = useNavigate();
  const { walletConnected, userRole, poolState, users, triggerStorm, payoutHistory, loadingAction, successMessage } = useWallet();

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
      await triggerStorm();
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
            <p className="mt-3 text-2xl font-semibold">{walletConnected ? 'Admin connected' : 'Not connected'}</p>
            <p className="mt-4 text-sm text-white/80">Storm trigger is restricted to admin accounts only.</p>
          </div>
        </SpotlightCard>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <PoolCard title="Total Pool" value={poolState.totalPool} suffix="XLM" hint="Current community balance" />
          <PoolCard title="Contributors" value={poolState.contributors} hint="Registered contributors" />
          <PoolCard title="Admin Status" value={successMessage || 'Ready'} hint="Admin only controls" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <SpotlightCard className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">Trigger Storm Day</h2>
            <p className="text-sm linear-muted">This action is restricted to admin accounts only.</p>
            <button type="button" onClick={handleTriggerStorm} disabled={loadingAction === 'storm'} className="linear-button-admin w-full">
              {loadingAction === 'storm' ? 'Triggering...' : 'Trigger Storm Day'}
            </button>
            <div className="rounded-lg border border-[color:var(--border-default)] bg-[color:var(--surface)] p-4 text-sm linear-muted">
              Storm trigger is locked after payout until new contributions are made.
            </div>
          </SpotlightCard>

          <SpotlightCard className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">Users</h2>
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] p-4">
                  <p className="font-semibold text-[color:var(--foreground)]">{user.fullName}</p>
                  <p className="text-sm linear-muted">{user.identifier}</p>
                  <p className="linear-kicker !mt-1 !text-[10px] !tracking-[0.16em]">{user.role}</p>
                </div>
              ))}
            </div>
          </SpotlightCard>
        </section>

        <TransactionHistoryList title="Payout Logs" items={payoutHistory} emptyText="No payout logs yet" />
      </main>
    </div>
  );
}
