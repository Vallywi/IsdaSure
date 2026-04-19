import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Landmark, ShieldCheck, UserRound } from 'lucide-react';
import SpotlightCard from '../components/SpotlightCard';
import { useWallet } from '../hooks/useWallet';

export default function ConnectWallet() {
  const navigate = useNavigate();
  const { connectWallet } = useWallet();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [ecosystemVisible, setEcosystemVisible] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);
  const ecosystemRef = useRef(null);
  const ctaRef = useRef(null);

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

  useEffect(() => {
    if (reduceMotion) {
      setHeroVisible(true);
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const rafId = window.requestAnimationFrame(() => setHeroVisible(true));
    return () => window.cancelAnimationFrame(rafId);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      setEcosystemVisible(true);
      return;
    }

    const section = ecosystemRef.current;
    if (!section || typeof window === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setEcosystemVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -8% 0px',
      },
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      setCtaVisible(true);
      return;
    }

    const section = ctaRef.current;
    if (!section || typeof window === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setCtaVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.22,
        rootMargin: '0px 0px -10% 0px',
      },
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, [reduceMotion]);

  const heroTextStyle = useMemo(() => {
    if (reduceMotion) {
      return undefined;
    }

    const entryOffsetY = heroVisible ? 0 : 30;
    const entryScale = heroVisible ? 1 : 0.975;
    const scrollScale = 1 - scrollProgress * 0.028;

    return {
      opacity: Math.max(0, 1 - scrollProgress * 0.56) * (heroVisible ? 1 : 0),
      transform: `translate3d(0, ${scrollProgress * 52 + entryOffsetY}px, 0) scale(${scrollScale * entryScale})`,
      transformOrigin: 'top left',
      transition: heroVisible ? undefined : 'transform 820ms cubic-bezier(0.22,1,0.36,1), opacity 820ms ease-out',
      willChange: 'transform, opacity',
    };
  }, [heroVisible, reduceMotion, scrollProgress]);

  const handleConnect = async () => {
    try {
      await connectWallet();
      navigate('/roles');
    } catch (error) {
      alert(error.message || 'Wallet connection failed');
    }
  };

  const ecosystemCards = [
    {
      action: 'Action: Manage',
      title: 'Admins',
      description: 'Monitor users, trigger storm events, and keep payout actions transparent.',
      points: ['Role-restricted controls', 'Payout execution logs', 'Wallet-bound operations'],
      icon: Landmark,
    },
    {
      action: 'Action: Contribute',
      title: 'Users',
      description: 'Contribute to the community pool and maintain a verifiable personal contribution history.',
      points: ['Fast wallet onboarding', 'Profile-linked history', 'Transparent status updates'],
      icon: UserRound,
    },
    {
      action: 'Action: Verify',
      title: 'Community',
      description: 'Track pool movement and payout events with tamper-resistant, role-based visibility.',
      points: ['Real-time pool stats', 'Payout transparency', 'Accountability by design'],
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="relative min-h-screen">
      <header className="absolute inset-x-0 top-0 z-30 mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
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
            <div className="flex items-center gap-2">
              <div className="h-11 w-11 shrink-0 overflow-visible">
                <img src="/logo.png" alt="IsdaSure logo" className="h-11 w-11 scale-[1.45] object-contain" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight text-[color:var(--foreground)]">IsdaSure</p>
                <p className="linear-kicker !tracking-[0.16em] !text-[10px]">Digital marine resilience platform</p>
              </div>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <button type="button" onClick={() => navigate('/roles')} className="linear-button-ghost rounded-lg px-4 py-2 text-sm">
                Login
              </button>
              <button type="button" onClick={handleConnect} className="linear-button-primary px-4 py-2 text-sm">
                Connect Wallet
              </button>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <button type="button" onClick={handleConnect} className="linear-button-primary px-4 py-2 text-sm">
                Connect
              </button>
            </div>
          </div>
        </div>
      </header>

      <section
        id="hero"
        className="relative isolate left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] min-h-[145vh] w-screen overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-right-center bg-no-repeat"
          style={{
            backgroundImage: "linear-gradient(rgba(15,23,42,0.75), rgba(15,23,42,0.85)), url('/fisherman.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'right center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        <div className="relative mx-auto flex min-h-[145vh] w-full max-w-[90rem] items-center px-4 pb-12 pt-32 sm:px-6 lg:px-10">
          <div className="max-w-3xl space-y-7 stagger-enter" style={heroTextStyle}>
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
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-60 px-4 pb-10 pt-32 sm:px-6 lg:px-8 lg:space-y-40 lg:pb-14 lg:pt-36">

        <section ref={ecosystemRef} className="space-y-8">
          <div
            className={[
              'space-y-2 text-center transition-all duration-700 ease-out',
              ecosystemVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
            ].join(' ')}
          >
            <h2 className="linear-heading text-4xl sm:text-5xl md:text-6xl">Built for the ecosystem.🐟</h2>
            <p className="mx-auto max-w-2xl linear-muted">One wallet-linked system, three focused experiences for community resilience.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {ecosystemCards.map((card, index) => {
              const Icon = card.icon;

              return (
              <div
                key={card.title}
                className={[
                  'transition-all duration-700 ease-out',
                  ecosystemVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0',
                ].join(' ')}
                style={!reduceMotion ? { transitionDelay: `${140 + index * 120}ms` } : undefined}
              >
                <SpotlightCard as="article" className="p-6">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-200">
                    <Icon className="h-6 w-6" strokeWidth={2.2} />
                  </div>
                  <p className="linear-kicker">{card.action}</p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">{card.title}</h3>
                  <p className="mt-3 text-sm leading-6 linear-muted">{card.description}</p>
                  <ul className="mt-5 space-y-2 text-sm text-[color:var(--foreground)]">
                    {card.points.map((point) => (
                      <li key={point} className="flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-300" strokeWidth={2.2} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </SpotlightCard>
              </div>
              );
            })}
          </div>
        </section>

        <section
          ref={ctaRef}
          className={[
            'relative mt-20 overflow-hidden rounded-[2.2rem] border border-[color:var(--border-accent)] bg-[color:var(--accent)] p-8 text-white shadow-[0_0_0_1px_rgba(94,106,210,0.6),0_24px_60px_rgba(31,41,55,0.4)] transition-all duration-700 ease-out sm:mt-24 sm:p-10 lg:mt-28',
            ctaVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0',
          ].join(' ')}
        >
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

      <footer className="mx-auto mt-16 max-w-7xl px-4 pb-2 sm:mt-20 sm:px-6 sm:pb-3 lg:mt-24 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-1 border-t border-[color:var(--border-default)] pt-2 text-xs linear-muted md:flex-row md:items-center sm:text-sm">
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
