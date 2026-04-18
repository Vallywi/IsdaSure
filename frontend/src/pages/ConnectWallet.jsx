import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SpotlightCard from '../components/SpotlightCard';
import { useWallet } from '../hooks/useWallet';
import { useTheme } from '../hooks/useTheme';

export default function ConnectWallet() {
  const navigate = useNavigate();
  const { connectWallet, walletConnected, shortWalletAddress, hasFreighter } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onPreferenceChange = () => setReduceMotion(media.matches);
    onPreferenceChange();

    if (media.addEventListener) {
      media.addEventListener('change', onPreferenceChange);
    } else {
      media.addListener(onPreferenceChange);
    }

    let rafId = null;
    const onScroll = () => {
      if (media.matches) {
        return;
      }

      const nextProgress = Math.min(window.scrollY / 900, 1);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = window.requestAnimationFrame(() => setScrollProgress(nextProgress));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      if (media.removeEventListener) {
        media.removeEventListener('change', onPreferenceChange);
      } else {
        media.removeListener(onPreferenceChange);
      }
    };
  }, []);

  const heroTextStyle = useMemo(() => {
    if (reduceMotion) {
      return undefined;
    }

    return {
      opacity: Math.max(0, 1 - scrollProgress * 0.56),
      transform: `translate3d(0, ${scrollProgress * 52}px, 0) scale(${1 - scrollProgress * 0.028})`,
      transformOrigin: 'top left',
      willChange: 'transform, opacity',
    };
  }, [reduceMotion, scrollProgress]);

  const heroPanelStyle = useMemo(() => {
    if (reduceMotion) {
      return undefined;
    }

    return {
      opacity: Math.max(0, 1 - scrollProgress * 0.46),
      transform: `translate3d(0, ${scrollProgress * 28}px, 0) scale(${1 - scrollProgress * 0.016})`,
      transformOrigin: 'top right',
      willChange: 'transform, opacity',
    };
  }, [reduceMotion, scrollProgress]);

  const handleConnect = async () => {
    try {
      await connectWallet();
      navigate('/roles');
    } catch (error) {
      alert(error.message || 'Wallet connection failed');
    }
  };

  return (
    <div className="min-h-screen">
      <header className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_10px_36px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--border-accent)] bg-[color:var(--accent)] text-lg font-semibold text-white shadow-[0_4px_14px_rgba(94,106,210,0.35)]">I</div>
              <div>
                <p className="text-lg font-semibold tracking-tight text-[color:var(--foreground)]">IsdaSure</p>
                <p className="linear-kicker !tracking-[0.16em] !text-[10px]">Digital marine resilience platform</p>
              </div>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button"
                onClick={toggleTheme}
                className="linear-button-secondary px-4 py-2 text-sm"
              >
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
              <button type="button" onClick={() => navigate('/roles')} className="linear-button-ghost rounded-lg px-4 py-2 text-sm">
                Login
              </button>
              <button type="button" onClick={handleConnect} className="linear-button-primary px-4 py-2 text-sm">
                Connect Wallet
              </button>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={toggleTheme}
                className="linear-button-secondary px-3 py-2 text-sm"
              >
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
              <button type="button" onClick={handleConnect} className="linear-button-primary px-4 py-2 text-sm">
                Connect
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-16 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-7 stagger-enter" style={heroTextStyle}>
            <div className="linear-pill gap-2">
              <span className="linear-kicker !text-[10px] !tracking-[0.24em] !text-[color:var(--accent-bright)]">verified</span>
              <span className="h-1 w-1 rounded-full bg-[color:var(--accent)]" />
              <span>Stellar Network Powered</span>
            </div>

            <h1 className="linear-display max-w-3xl">
              The future of fisherfolk trust.
            </h1>

            <p className="linear-lead max-w-xl">
              IsdaSure secures contribution history and community support events by linking identities to wallet-based access and transparent role-based actions.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={handleConnect} className="linear-button-primary w-full sm:w-auto">
                Verify Now
              </button>
              <button type="button" onClick={() => navigate('/register')} className="linear-button-secondary w-full sm:w-auto">
                Register User
              </button>
            </div>

            {walletConnected ? (
              <div className="rounded-lg border border-[color:var(--border-accent)] bg-[color:var(--accent-glow)] p-5 text-sm text-[color:var(--foreground)]">
                Connected wallet: {shortWalletAddress}
              </div>
            ) : null}
            {!hasFreighter() ? (
              <p className="text-sm text-amber-300">Freighter extension not detected in this browser.</p>
            ) : null}
          </div>

          <SpotlightCard className="relative overflow-hidden rounded-[2.2rem] p-6" style={heroPanelStyle}>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/12 via-transparent to-sky-500/12" />
            <div className="relative space-y-5">
              <div className="rounded-[1.7rem] border border-[color:var(--border-default)] bg-[color:var(--surface)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="linear-kicker">Community Certificate</p>
                    <p className="mt-1 text-xl font-semibold tracking-tight text-[color:var(--foreground)]">Contribution Record</p>
                  </div>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Verified</span>
                </div>
              </div>

              <div className="h-52 rounded-[1.7rem] bg-gradient-to-br from-indigo-500/30 via-sky-400/20 to-blue-500/30" />

              <div className="rounded-[1.7rem] border border-[color:var(--border-default)] bg-[color:var(--surface)] p-5 text-sm">
                <p className="linear-kicker !text-[10px]">Cryptographic Hash</p>
                <p className="mt-2 break-all font-semibold text-[color:var(--foreground)]">GAVX...K7N2...9QWL...M9R4...Z3B8</p>
              </div>
            </div>
          </SpotlightCard>
        </section>

        <section className="space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="linear-heading text-4xl sm:text-5xl md:text-6xl">Built for the ecosystem.</h2>
            <p className="mx-auto max-w-2xl linear-muted">One wallet-linked system, three focused experiences for community resilience.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <SpotlightCard as="article" className="p-6">
              <p className="linear-kicker">Action: Manage</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">Admins</h3>
              <p className="mt-3 text-sm leading-6 linear-muted">Monitor users, trigger storm events, and keep payout actions transparent.</p>
              <ul className="mt-5 space-y-2 text-sm text-[color:var(--foreground)]">
                <li>Role-restricted controls</li>
                <li>Payout execution logs</li>
                <li>Wallet-bound operations</li>
              </ul>
            </SpotlightCard>

            <SpotlightCard as="article" className="p-6">
              <p className="linear-kicker">Action: Contribute</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">Users</h3>
              <p className="mt-3 text-sm leading-6 linear-muted">Contribute to the community pool and maintain a verifiable personal contribution history.</p>
              <ul className="mt-5 space-y-2 text-sm text-[color:var(--foreground)]">
                <li>Fast wallet onboarding</li>
                <li>Profile-linked history</li>
                <li>Transparent status updates</li>
              </ul>
            </SpotlightCard>

            <SpotlightCard as="article" className="p-6">
              <p className="linear-kicker">Action: Verify</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">Community</h3>
              <p className="mt-3 text-sm leading-6 linear-muted">Track pool movement and payout events with tamper-resistant, role-based visibility.</p>
              <ul className="mt-5 space-y-2 text-sm text-[color:var(--foreground)]">
                <li>Real-time pool stats</li>
                <li>Payout transparency</li>
                <li>Accountability by design</li>
              </ul>
            </SpotlightCard>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2.2rem] border border-[color:var(--border-accent)] bg-[color:var(--accent)] p-8 text-white shadow-[0_0_0_1px_rgba(94,106,210,0.6),0_24px_60px_rgba(31,41,55,0.4)] sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(186,230,253,0.35),transparent_35%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="linear-kicker !text-white/70">Ready to link the future?</p>
              <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Secure your community trust flow today.</h2>
              <p className="text-sm leading-6 text-white/85">Start with wallet connection, then continue directly into the role-based journey.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={handleConnect} className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-slate-100">
                Connect Wallet
              </button>
              <button type="button" onClick={() => navigate('/roles')} className="inline-flex items-center justify-center rounded-2xl border border-white/50 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Documentation
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 border-t border-[color:var(--border-default)] pt-6 text-sm linear-muted md:flex-row md:items-center">
          <div>
            <p className="font-semibold text-[color:var(--foreground)]">IsdaSure</p>
            <p>© 2026 IsdaSure. Powered by Stellar.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => navigate('/roles')} className="transition hover:text-[color:var(--accent-bright)]">Network Status</button>
            <button type="button" onClick={() => navigate('/roles')} className="transition hover:text-[color:var(--accent-bright)]">Documentation</button>
            <button type="button" onClick={() => navigate('/register')} className="transition hover:text-[color:var(--accent-bright)]">Privacy Policy</button>
            <button type="button" onClick={() => navigate('/register')} className="transition hover:text-[color:var(--accent-bright)]">Terms</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
