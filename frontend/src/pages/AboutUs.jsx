import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CloudRainWind, HandCoins, ShieldCheck, Users, Waves, Umbrella, HeartHandshake, Lightbulb, Apple, TrendingDown } from 'lucide-react';
import SpotlightCard from '../components/SpotlightCard';
import { useWallet } from '../hooks/useWallet';
import typhoonGif from '../../gif/typhoon.gif';
import nasalantaImage from '../../images/nasalanta.jpg';

export default function AboutUs() {
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

  const impactHighlights = [
    'Frequent typhoons and rough seas interrupt fishing work.',
    'Coastal communities face higher safety risks during storms.',
    'No fishing days mean immediate loss of daily income.',
  ];

  const solutionPoints = [
    {
      title: 'Bayanihan-style support',
      copy: 'Fisherfolk contribute together to build a community fund that can help when storms arrive.',
      icon: Users,
    },
    {
      title: 'Transparent blockchain records',
      copy: 'Every contribution and payout record is visible, so trust is built through clear history.',
      icon: ShieldCheck,
    },
    {
      title: 'Automated payouts',
      copy: 'Smart contracts handle the process faster and reduce delays that usually happen with manual aid.',
      icon: HandCoins,
    },
    {
      title: 'No middleman',
      copy: 'Support moves directly through the system, making the process simpler and more reliable.',
      icon: ArrowRight,
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
        <section
          className={[
            'grid gap-4 transition-all duration-700 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch',
            animateIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
          ].join(' ')}
        >
          <div className="space-y-4">
            <p className="linear-kicker">About Us</p>
            <h1 className="linear-heading text-4xl sm:text-5xl">Why IsdaSure exists</h1>
            <p className="max-w-3xl text-sm leading-7 linear-muted">
              IsdaSure is a blockchain-based community support platform for fisherfolk in the Philippines. It was built to respond to the real effects of typhoons, lost fishing days, and delayed assistance.
            </p>
            <p className="max-w-3xl text-sm leading-7 linear-muted">
              The goal is simple: help coastal families understand the problem, see the need for a better system, and trust that support can be delivered fairly when weather disruptions happen.
            </p>
          </div>

          <SpotlightCard className="space-y-4">
            <p className="linear-kicker">Key focus</p>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)]">
                  <Umbrella className="h-4 w-4 text-[color:var(--accent-bright)]" />
                  Risk
                </p>
                <p className="mt-1 text-sm leading-6 linear-muted">Typhoons and storms make fishing unsafe.</p>
              </div>
              <div className="rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)]">
                  <Waves className="h-4 w-4 text-[color:var(--accent-bright)]" />
                  Need
                </p>
                <p className="mt-1 text-sm leading-6 linear-muted">Families need support when income stops.</p>
              </div>
              <div className="rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)]">
                  <HeartHandshake className="h-4 w-4 text-[color:var(--accent-bright)]" />
                  Solution
                </p>
                <p className="mt-1 text-sm leading-6 linear-muted">IsdaSure makes support transparent and fair.</p>
              </div>
            </div>
          </SpotlightCard>
        </section>

        <section
          className={[
            'grid gap-4 transition-all duration-700 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch',
            animateIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
          ].join(' ')}
          style={{ transitionDelay: '120ms' }}
        >
          <SpotlightCard className="overflow-hidden !p-0">
            <div className="relative h-full min-h-[280px] w-full">
              <img src={typhoonGif} alt="Typhoon moving across the Philippines" className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-slate-950/20" />
            </div>
          </SpotlightCard>

          <SpotlightCard className="space-y-4">
            <p className="linear-kicker">Section 1</p>
            <div className="flex justify-start">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--border-default)] bg-[color:var(--surface)] shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                <CloudRainWind className="h-5 w-5 text-[color:var(--accent-bright)]" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">Typhoon impact in the Philippines</h2>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--foreground-muted)]">Research-style overview</p>
              </div>
            </div>
            <p className="text-sm leading-7 linear-muted">
              The Philippines faces frequent typhoons and strong storms every year. Coastal communities are highly vulnerable because rough seas, heavy winds, and sudden weather changes make fishing dangerous.
            </p>
            <p className="text-sm leading-7 linear-muted">
              During bad weather, fishing activities are suspended. Fisherfolk cannot safely go out to sea, and the risk to life, boats, and equipment becomes too high.
            </p>
            <p className="text-sm leading-7 linear-muted">
              The result is not only a weather problem. It becomes a real livelihood problem for families who depend on the sea every single day.
            </p>
            <div className="space-y-2 rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] p-4">
              <p className="text-sm font-semibold text-[color:var(--foreground)]">What this means</p>
              <ul className="space-y-2 text-sm leading-6 linear-muted">
                {impactHighlights.map((item) => (
                  <li key={item} className="flex gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] p-4">
              <p className="text-sm font-semibold text-[color:var(--foreground)]">Why it matters</p>
              <p className="mt-1 text-sm leading-7 linear-muted">
                Storms are not abstract events for coastal families. They interrupt work, create danger, and put the next meal at risk.
              </p>
            </div>
          </SpotlightCard>
        </section>

        <section
          className={[
            'grid gap-4 transition-all duration-700 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch',
            animateIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
          ].join(' ')}
          style={{ transitionDelay: '220ms' }}
        >
          <SpotlightCard className="space-y-4">
            <p className="linear-kicker">Section 2</p>
            <div className="flex justify-start">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--border-default)] bg-[color:var(--surface)] shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                <Users className="h-5 w-5 text-[color:var(--accent-bright)]" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">Impact on fisherfolk</h2>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--foreground-muted)]">Real-life struggle</p>
              </div>
            </div>
            <p className="text-sm leading-7 linear-muted">
              Fisherfolk depend on daily income from fishing. When the sea is unsafe, there is no fishing, and when there is no fishing, there is no income for the day.
            </p>
            <p className="text-sm leading-7 linear-muted">
              Many families have little to no savings. A few days without income can quickly mean less food, less money for daily needs, and more pressure at home.
            </p>
            <p className="text-sm leading-7 linear-muted">
              In difficult moments, some are forced to borrow money with high interest just to survive until the weather improves.
            </p>
            <div className="rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] p-4">
              <p className="text-sm font-semibold text-[color:var(--foreground)]">Common effect on families</p>
              <p className="mt-1 text-sm leading-7 linear-muted">
                No fishing often means no income, and no income can quickly turn into food shortages, debt, and delayed recovery for the household.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { icon: AlertTriangle, label: 'Income loss' },
                { icon: Apple, label: 'Food pressure' },
                { icon: TrendingDown, label: 'Debt risk' },
              ].map(({ icon: BadgeIcon, label }) => (
                <span key={label} className="flex items-center gap-1.5 rounded-full border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--foreground-muted)]">
                  <BadgeIcon className="h-3 w-3" />
                  {label}
                </span>
              ))}
            </div>
          </SpotlightCard>

          <SpotlightCard className="overflow-hidden !p-0">
            <div className="relative h-full min-h-[280px] w-full">
              <img src={nasalantaImage} alt="Damaged fishing boats and coastal life after a storm" className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-slate-950/20" />
            </div>
          </SpotlightCard>
        </section>

        <section
          className={[
            'grid gap-4 transition-all duration-700 md:grid-cols-2',
            animateIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
          ].join(' ')}
          style={{ transitionDelay: '320ms' }}
        >
          <SpotlightCard className="space-y-4">
            <p className="linear-kicker">Section 3</p>
            <div className="flex justify-start">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--border-default)] bg-[color:var(--surface)] shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                <ShieldCheck className="h-5 w-5 text-[color:var(--accent-bright)]" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[color:var(--accent-bright)]" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--foreground-muted)]">Transition to the solution</p>
            </div>
            <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Transition to the solution</h2>
            <p className="text-sm leading-7 linear-muted">
              Current systems often fail fisherfolk in their time of greatest need. Traditional loans require lengthy approval processes, collateral, and credit history that most coastal families do not have. Government aid, while well-intentioned, is frequently delayed by bureaucracy and logistics. Private charitable assistance arrives sporadically and irregularly. The result is that emergency support often comes weeks or months after a crisis, long after families have already sold assets, borrowed at high interest, or reduced food consumption to survive.
            </p>
            <p className="text-sm leading-7 linear-muted">
              Fisherfolk need a system that works differently: one that is ready before the storm, activated immediately when needed, and responds within hours rather than weeks. The solution must be community-controlled rather than dependent on external institutions. It must be transparent so members can trust the process and see where their contributions go. And it must be fast because when families have no income, even a few days without support creates real hardship.
            </p>
            <p className="text-sm leading-7 linear-muted">
              This is where a fundamentally better model becomes essential. The system must be simple enough for first-time users to understand and join without confusion. It must be fair, ensuring that those who contribute more do not subsidize free-riders, and those who fall on hard times receive support based on clear, verifiable rules. And it must be deeply trusted by the community because fisherfolk will only participate if they believe their money is safe, the process is honest, and support will truly arrive when promised.
            </p>
          </SpotlightCard>

          <SpotlightCard className="space-y-4">
            <p className="linear-kicker">Section 4</p>
            <div className="flex justify-start">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--border-default)] bg-[color:var(--surface)] shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                <Lightbulb className="h-5 w-5 text-[color:var(--accent-bright)]" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[color:var(--foreground)]">IsdaSure as the solution</h2>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--foreground-muted)]">Hopeful and empowering</p>
              </div>
            </div>
            <p className="text-sm leading-7 linear-muted">
              IsdaSure introduces bayanihan-style community contributions so fisherfolk can build a shared support fund that is ready when storms arrive.
            </p>
            <p className="text-sm leading-7 linear-muted">
              Blockchain keeps the process transparent, smart contracts automate payouts, and no middleman is needed. That means support can move faster, be checked more easily, and stay fair for everyone.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {solutionPoints.map((point) => {
                const PointIcon = point.icon;
                return (
                  <div key={point.title} className="rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] p-4">
                    <div className="flex items-center gap-2">
                      <PointIcon className="h-4 w-4 text-[color:var(--accent-bright)]" />
                      <p className="text-sm font-semibold text-[color:var(--foreground)]">{point.title}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 linear-muted">{point.copy}</p>
                  </div>
                );
              })}
            </div>
          </SpotlightCard>
        </section>
      </main>

      <section
        className={[
          'border-t border-[color:var(--border-default)] bg-[color:var(--accent-glow)] pt-8 pb-8 transition-all duration-700',
          animateIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
        ].join(' ')}
        style={{ transitionDelay: '420ms' }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-[color:var(--foreground)]">The goal</p>
          <p className="mt-2 max-w-4xl text-sm leading-7 linear-muted">
            Build a strong problem narrative that explains the reality of typhoons, the daily hardship of fisherfolk, and why IsdaSure offers a more transparent and community-led way forward.
          </p>
        </div>
      </section>
    </div>
  );
}
