import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SpotlightCard from '../components/SpotlightCard';
import { useWallet } from '../hooks/useWallet';

export default function Login() {
  const navigate = useNavigate();
  const { role } = useParams();
  const { walletConnected, walletAddress, login } = useWallet();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        <section className="space-y-7">
          <div className="linear-pill">
            {role === 'admin' ? 'Admin Login' : 'User Login'}
          </div>
          <h1 className="linear-display max-w-3xl">
            Sign in to continue.
          </h1>
          <p className="linear-lead max-w-xl">
            Wallet linked: {walletAddress}
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['Secure access', 'The wallet stays bound to the account flow.'],
              ['Role aware', 'Login behavior changes with your role.'],
            ].map(([title, copy]) => (
              <SpotlightCard key={title} className="p-5">
                <p className="linear-kicker">{title}</p>
                <p className="mt-3 text-sm leading-6 linear-muted">{copy}</p>
              </SpotlightCard>
            ))}
          </div>
        </section>

        <SpotlightCard className="space-y-5">
          <div>
            <p className="linear-kicker">Access panel</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">{role === 'admin' ? 'Admin Login' : 'User Login'}</h2>
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
              <span className="mb-2 block text-sm font-semibold text-[color:var(--foreground)]">Password</span>
              <input
                type="password"
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
        </SpotlightCard>
      </main>
    </div>
  );
}
