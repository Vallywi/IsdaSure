import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Info, ShieldCheck, Wallet } from 'lucide-react';
import adminImage from '../../images/Admin.jpg';
import userImage from '../../images/User.jpg';
import communityImage from '../../images/Community.jpg';
import SpotlightCard from '../components/SpotlightCard';
import SiteFooter from '../components/SiteFooter';
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

  const homepageNavItems = [
    ['Home', '/'],
    ['How It Works', '/how-it-works'],
    ['about', '/about-us'],
    ['FAQ', '/faq'],
  ];

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
      image: adminImage,
    },
    {
      action: 'Action: Contribute',
      title: 'Users',
      description: 'Contribute to the community pool and maintain a verifiable personal contribution history.',
      points: ['Fast wallet onboarding', 'Profile-linked history', 'Transparent status updates'],
      image: userImage,
    },
    {
      action: 'Action: Verify',
      title: 'Community',
      description: 'Track pool movement and payout events with tamper-resistant, role-based visibility.',
      points: ['Real-time pool stats', 'Payout transparency', 'Accountability by design'],
      image: communityImage,
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
            <div className="group flex items-center gap-2">
              <div className="h-11 w-11 shrink-0 overflow-visible">
                <img src="/logo.png" alt="IsdaSure logo" className="h-11 w-11 origin-left translate-x-0 scale-[4.5] object-contain" />
              </div>
            </div>

            <nav className="hidden items-center gap-5 md:flex">
              {homepageNavItems.map(([label, path]) => (
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

            <div className="hidden items-center gap-2 md:flex">
              <button type="button" onClick={handleConnect} className="linear-button-primary px-4 py-2 text-sm">
                Connect Wallet
              </button>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <button type="button" onClick={handleConnect} className="linear-button-primary px-4 py-2 text-sm">
                Freighter
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
                Connect Wallet
              </button>
              <button type="button" onClick={() => navigate('/register')} className="linear-button-secondary w-full sm:w-auto">
                Register User
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-60 px-4 pb-10 pt-32 sm:px-6 lg:px-8 lg:space-y-40 lg:pb-14 lg:pt-36">

        <section ref={ecosystemRef} className="space-y-12 sm:space-y-14">
          <div
            className={[
              'space-y-2 text-center transition-all duration-700 ease-out',
              ecosystemVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
            ].join(' ')}
          >
            <h2 className="linear-heading text-4xl sm:text-5xl md:text-6xl">Built to Protect Fisherfolk Livelihoods🐟</h2>
            <p className="mx-auto max-w-2xl linear-muted">One wallet-linked system, three focused experiences for community resilience.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {ecosystemCards.map((card, index) => {
              return (
              <div
                key={card.title}
                className={[
                  'transition-all duration-700 ease-out',
                  ecosystemVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0',
                ].join(' ')}
                style={!reduceMotion ? { transitionDelay: `${140 + index * 120}ms` } : undefined}
              >
                <SpotlightCard as="article" className="flex h-full min-h-[460px] flex-col overflow-hidden !p-0 text-center sm:min-h-[500px]">
                  <div className="relative h-44 w-full overflow-hidden border-b border-white/12 shadow-[0_16px_30px_rgba(2,6,23,0.42)] sm:h-52">
                    <img src={card.image} alt={`${card.title} role`} className="h-full w-full object-cover opacity-95" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-900/10 via-transparent to-slate-950/35" />
                  </div>
                  <div className="flex w-full flex-col items-center gap-3 px-6 pb-6 pt-4 sm:px-7 sm:pb-7 sm:pt-5">
                    <p className="linear-kicker">{card.action}</p>
                    <h3 className="text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">{card.title}</h3>
                    <p className="max-w-[34ch] text-sm leading-7 linear-muted">{card.description}</p>
                    <ul className="mt-2 space-y-3 text-sm text-[color:var(--foreground)]">
                      {card.points.map((point) => (
                        <li key={point} className="flex items-center justify-center gap-2 font-semibold">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-300" strokeWidth={2.2} />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </SpotlightCard>
              </div>
              );
            })}
          </div>
        </section>

        <section
          ref={ctaRef}
          className={[
            'relative mt-20 min-h-[300px] overflow-hidden rounded-[2.2rem] border border-[color:var(--border-accent)] bg-[color:var(--accent)] p-10 text-white shadow-[0_0_0_1px_rgba(94,106,210,0.6),0_24px_60px_rgba(31,41,55,0.4)] transition-all duration-700 ease-out sm:mt-24 sm:min-h-[320px] sm:p-12 lg:mt-28',
            ctaVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0',
          ].join(' ')}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(186,230,253,0.35),transparent_35%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="linear-kicker !text-white/70">Ready to link the future?</p>
              <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Secure your community trust flow today.</h2>
              <p className="text-sm leading-6 text-white/85">Start with wallet connection, then continue directly into the role-based journey.</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-white/90">
                  <Wallet className="h-3.5 w-3.5" />
                  <span>Wallet-approved transactions</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-white/90">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Group-based protection flow</span>
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={handleConnect} className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-slate-100">
                <span className="inline-flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span>Connect Now</span>
                </span>
              </button>
              <button type="button" onClick={() => navigate('/about-us')} className="inline-flex items-center justify-center rounded-2xl border border-white/50 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                <span className="inline-flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>About Us</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter className="mt-16 sm:mt-20 lg:mt-24" />
    </div>
  );
}
