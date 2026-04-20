import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudRainWind, Coins, HandCoins, ShieldCheck, Users, Wallet } from 'lucide-react';
import SiteFooter from '../components/SiteFooter';
import SpotlightCard from '../components/SpotlightCard';
import { useWallet } from '../hooks/useWallet';

export default function HowItWorks() {
  const navigate = useNavigate();
  const { connectWallet } = useWallet();
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const rafId = window.requestAnimationFrame(() => setAnimateIn(true));
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const handleConnect = async () => {
    try {
      await connectWallet();
      navigate('/roles');
    } catch (error) {
      alert(error.message || 'Wallet connection failed');
    }
  };

  const navItems = [
    ['Home', '/'],
    ['How It Works', '/how-it-works'],
    ['about', '/about-us'],
    ['FAQ', '/faq'],
  ];

  const steps = [
    {
      number: '01',
      stage: 'Get Started',
      title: 'Connect to Freighter Wallet',
      icon: Wallet,
      copy: 'Connect your Freighter wallet to unlock your IsdaSure account.',
      detail: 'This links your identity and blockchain activity into one secure profile.',
    },
    {
      number: '02',
      stage: 'Community Setup',
      title: 'Join or Create a Group',
      icon: Users,
      copy: 'Join your fisherfolk group or create one for your barangay.',
      detail: 'Group-based support makes contribution and payout tracking fair for everyone.',
    },
    {
      number: '03',
      stage: 'Daily Routine',
      title: 'Contribute Daily (e.g., P50)',
      icon: Coins,
      copy: 'Contribute your daily amount to keep the group support fund active.',
      detail: 'Small and consistent contributions build stronger emergency protection.',
    },
    {
      number: '04',
      stage: 'Transparency',
      title: 'Recorded on Blockchain',
      icon: ShieldCheck,
      copy: 'Every contribution is recorded transparently on blockchain.',
      detail: 'Anyone in the community can verify records and see that rules are followed.',
    },
    {
      number: '05',
      stage: 'Emergency Action',
      title: 'Admin Triggers Storm Event',
      icon: CloudRainWind,
      copy: 'When storms stop fishing activity, the admin triggers the support event.',
      detail: 'This opens the payout process for members affected by no-fishing days.',
    },
    {
      number: '06',
      stage: 'Payout',
      title: 'Fair Payout',
      icon: HandCoins,
      copy: 'Members receive payout based only on their own contribution record.',
      detail: 'Simple rule: the more you contributed correctly, the stronger your payout basis.',
    },
  ];

  return (
    <div className="relative min-h-screen">
      <header className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div
          className="rounded-2xl px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_10px_36px_rgba(0,0,0,0.35)] sm:px-6"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="h-11 w-11 shrink-0 overflow-visible">
              <img src="/logo.png" alt="IsdaSure logo" className="h-11 w-11 origin-left translate-x-0 scale-[4.5] object-contain" />
            </div>

            <nav className="hidden items-center gap-5 md:flex">
              {navItems.map(([label, path]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigate(path)}
                  className="text-sm font-medium text-[color:var(--foreground-muted)] transition hover:text-[color:var(--foreground)]"
                >
                  {label}
                </button>
              ))}
            </nav>

            <button type="button" onClick={handleConnect} className="linear-button-primary px-4 py-2 text-sm">
              Connect Wallet
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 pb-14 pt-14 sm:px-6 lg:px-8">
        <section className={["space-y-4 transition-all duration-700", animateIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'].join(' ')}>
          <p className="linear-kicker">How It Works</p>
          <h1 className="linear-heading text-4xl sm:text-5xl">Simple steps for everyone</h1>
          <p className="max-w-3xl text-sm leading-7 linear-muted">
            IsdaSure is made for first-time users. Follow the steps from wallet setup to payout, and everything stays transparent for the whole community.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)]/70 px-4 py-3 text-sm">
              <p className="font-semibold text-[color:var(--foreground)]">Clear Rules</p>
              <p className="mt-1 linear-muted">Contribution and payout rules are consistent for all members.</p>
            </div>
            <div className="rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)]/70 px-4 py-3 text-sm">
              <p className="font-semibold text-[color:var(--foreground)]">Visible Records</p>
              <p className="mt-1 linear-muted">Transactions are recorded on-chain for public verification.</p>
            </div>
            <div className="rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)]/70 px-4 py-3 text-sm">
              <p className="font-semibold text-[color:var(--foreground)]">Fair Support</p>
              <p className="mt-1 linear-muted">Payout follows contribution records during storm events.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {steps.map((step) => {
            const StepIcon = step.icon;
            return (
            <SpotlightCard
              key={step.title}
              className={[
                'group space-y-4 border-[color:var(--border-default)] transition-all duration-500 hover:-translate-y-1 hover:border-[color:var(--border-accent)]',
                animateIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
              ].join(' ')}
              style={{ transitionDelay: `${130 + Number(step.number) * 80}ms` }}
            >
              <div className="flex items-center justify-between">
                <p className="linear-kicker">Step {step.number}</p>
                <span className="rounded-full border border-[color:var(--border-accent)] bg-[color:var(--accent-glow)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground)]">
                  {step.stage}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <StepIcon className="h-5 w-5 text-[color:var(--accent-bright)]" />
              </div>
              <h2 className="text-xl font-semibold text-[color:var(--foreground)]">{step.title}</h2>
              <p className="text-sm leading-7 text-[color:var(--foreground)]/90">{step.copy}</p>
              <p className="text-sm leading-7 text-[color:var(--foreground-muted)]">{step.detail}</p>
            </SpotlightCard>
            );
          })}
        </section>

        <section
          className={[
            'rounded-2xl border border-[color:var(--border-accent)] bg-[color:var(--accent-glow)] px-5 py-4 transition-all duration-700 sm:px-6',
            animateIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
          ].join(' ')}
          style={{ transitionDelay: '620ms' }}
        >
          <p className="text-sm font-semibold text-[color:var(--foreground)]">Need help starting?</p>
          <p className="mt-1 text-sm linear-muted">Connect your wallet first, then go to registration so you can join a group and begin contributions.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={handleConnect} className="linear-button-primary px-4 py-2 text-sm">
              Connect Wallet
            </button>
            <button type="button" onClick={() => navigate('/register')} className="linear-button-secondary px-4 py-2 text-sm">
              Register User
            </button>
          </div>
        </section>
      </main>

      <SiteFooter className="mt-16 sm:mt-20 lg:mt-24" />
    </div>
  );
}
