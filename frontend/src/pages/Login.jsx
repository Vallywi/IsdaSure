import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SpotlightCard from '../components/SpotlightCard';
import { useWallet } from '../hooks/useWallet';

export default function Login() {
  const navigate = useNavigate();
  const { role } = useParams();
  const { walletConnected, login } = useWallet();
  const isAdminRole = role === 'admin';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roleSummary = isAdminRole
    ? 'Use this portal for barangay officials in small islands to manage governance tasks and storm-trigger actions.'
    : 'Use this portal to access your personal dashboard, contribution history, and wallet-linked account activity.';

  const roleHighlights = isAdminRole
    ? [
        ['Barangay Governance', 'Review resident member records and enforce local policy workflows.'],
        ['Storm Trigger Action', 'Initiate approved storm-trigger operations for affected island communities.'],
        ['Payout Oversight', 'Track and verify payout execution with clear accountability records.'],
        ['Island Activity Monitoring', 'Monitor community-level activity signals for operational readiness.'],
      ]
    : [
        ['Personal Dashboard', 'Open your account workspace with role-aware navigation and controls.'],
        ['Activity Tracking', 'Review your recent account actions and contribution history in one place.'],
        ['Wallet Security', 'Continue using wallet-linked verification for safer account access.'],
        ['Guided Access', 'Follow a simplified sign-in experience built for fast user entry.'],
      ];

  const primaryHighlights = roleHighlights.slice(0, 2);
  const secondaryHighlights = roleHighlights.slice(2, 4);

  useEffect(() => {
    if (!walletConnected) {
      navigate('/');
    }
  }, [navigate, walletConnected]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login({ identifier, password, role });
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="isdasure-shell">
      <Navbar />
      <main className="mx-auto grid max-w-7xl gap-10 py-6 md:py-10 lg:grid-cols-[1fr_0.92fr] lg:items-start">
        <section>
          <div className="max-w-3xl space-y-4">
            <div className="linear-pill">
              {isAdminRole ? 'Barangay Official Login' : 'User Login'}
            </div>
            <h1 className="linear-heading -mt-1 text-4xl sm:text-5xl">
              {isAdminRole ? 'Barangay official access workspace' : 'Member access workspace'}
            </h1>
            <p className="linear-lead max-w-2xl">{roleSummary}</p>

            <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
              {primaryHighlights.map(([title, copy]) => (
                <SpotlightCard key={title} className="h-full p-4 [&::before]:hidden">
                  <p className="linear-kicker">{title}</p>
                  <p className="mt-2 text-sm leading-6 linear-muted">{copy}</p>
                </SpotlightCard>
              ))}
            </div>

            <div className="rounded-2xl border border-[color:var(--border-default)] bg-[color:var(--surface)]/60 px-4 py-3 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--foreground-subtle)]">Security note</p>
              <p className="mt-2 text-sm linear-muted">Only wallet-connected sessions can proceed to authenticated role actions.</p>
            </div>
          </div>
        </section>

        <SpotlightCard
          className={[
            'space-y-5 [&::before]:hidden',
            isAdminRole ? 'min-h-[460px] lg:min-h-[520px]' : 'min-h-[400px] lg:min-h-[460px]',
          ].join(' ')}
        >
          <div>
            <p className="linear-kicker">Access panel</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">{isAdminRole ? '🏦 Barangay Official Login' : 'User Login'}</h2>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--foreground)]">Email or Phone Number</span>
              <input
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="linear-input"
                placeholder="Enter email or phone"
              />
            </label>
            <label className="block">
              <div className="mb-2 flex items-center justify-between">
                <span className="block text-sm font-semibold text-[color:var(--foreground)]">Password</span>
                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-bright)] transition hover:text-[color:var(--foreground)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="linear-input"
                placeholder="Enter password"
              />
            </label>

            {error ? <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200">{error}</p> : null}

            <button type="submit" disabled={loading} className="linear-button-primary w-full disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <div className="grid gap-3 md:grid-cols-2">
            {secondaryHighlights.map(([title, copy]) => (
              <div key={title} className="rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)]/55 p-3">
                <p className="linear-kicker">{title}</p>
                <p className="mt-2 text-sm leading-6 linear-muted">{copy}</p>
              </div>
            ))}
          </div>
        </SpotlightCard>
      </main>
    </div>
  );
}
