import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PoolCard from '../components/PoolCard';
import ProfileCard from '../components/ProfileCard';
import SpotlightCard from '../components/SpotlightCard';
import TransactionHistoryList from '../components/TransactionHistoryList';
import { useWallet } from '../hooks/useWallet';

export default function Dashboard() {
  const navigate = useNavigate();
  const { walletConnected, userRole, userProfile, poolState, contribute, myActivity, successMessage, loadingAction } = useWallet();
  const [amount] = useState(50);

  useEffect(() => {
    if (!walletConnected) {
      navigate('/');
      return;
    }
    if (userRole === 'admin') {
      navigate('/admin');
    }
  }, [navigate, userRole, walletConnected]);

  const handleContribute = async () => {
    try {
      await contribute(amount);
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
            <p className="linear-kicker">User dashboard</p>
            <h1 className="linear-heading max-w-2xl text-4xl sm:text-5xl md:text-6xl">
              Keep track of your pool, your profile, and your contribution history.
            </h1>
            <p className="linear-lead max-w-2xl">
              The layout keeps the important actions visible while reducing clutter and emphasizing wallet-linked identity.
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--border-accent)] bg-[color:var(--accent-glow)] px-6 py-8 text-[color:var(--foreground)] shadow-[0_8px_26px_rgba(94,106,210,0.22)]">
            <p className="linear-kicker !text-[rgba(237,239,242,0.7)]">Wallet Address</p>
            <p className="mt-3 text-2xl font-semibold">{walletConnected ? userProfile.walletAddress : 'Not connected'}</p>
            <p className="mt-4 text-sm text-white/80">Contributions update in real time after each action.</p>
          </div>
        </SpotlightCard>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <PoolCard title="Total Pool Amount" value={poolState.totalPool} suffix="XLM" hint="Community pool available now" />
          <PoolCard title="Number of Contributors" value={poolState.contributors} hint="Registered contributors" />
          <PoolCard title="Status" value={successMessage || 'Ready'} hint="Wallet-linked dashboard" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <ProfileCard
            name={userProfile.name}
            picture={userProfile.picture}
            walletAddress={userProfile.walletAddress}
            description="User Profile"
          />

          <SpotlightCard className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">Contribute</h2>
            <p className="text-sm linear-muted">Support the pool with a quick ₱50 contribution.</p>
            <button type="button" onClick={handleContribute} disabled={loadingAction === 'contribute'} className="linear-button-primary w-full">
              {loadingAction === 'contribute' ? 'Processing...' : 'Contribute P50'}
            </button>
            <div className="rounded-lg border border-[color:var(--border-default)] bg-[color:var(--surface)] p-4 text-sm linear-muted">
              Wallet Address: {walletConnected ? userProfile.walletAddress : 'Not connected'}
            </div>
            <TransactionHistoryList title="Contribution History" items={myActivity} emptyText="No contributions yet" />
            {successMessage ? <p className="rounded-lg border border-[color:var(--border-accent)] bg-[color:var(--accent-glow)] px-4 py-3 text-sm font-medium text-[color:var(--foreground)]">{successMessage}</p> : null}
          </SpotlightCard>
        </section>
      </main>
    </div>
  );
}
