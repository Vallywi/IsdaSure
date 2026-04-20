import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, CreditCard, Lock, Code, Wallet, Users } from 'lucide-react';
import SiteFooter from '../components/SiteFooter';
import { useWallet } from '../hooks/useWallet';

export default function FAQ() {
  const navigate = useNavigate();
  const { connectWallet } = useWallet();
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
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

  const faqItems = [
    {
      question: 'What is IsdaSure?',
      icon: HelpCircle,
      answer:
        'IsdaSure is a blockchain-based community support platform designed specifically for fisherfolk in the Philippines. It enables groups to build a shared emergency fund through regular contributions and distributes support fairly when fishing is disrupted by storms. Every transaction is recorded transparently on blockchain, so the community can verify that funds are handled correctly and support reaches those who need it most.',
    },
    {
      question: 'How do I receive payouts?',
      icon: CreditCard,
      answer:
        'Payouts are released automatically when the admin triggers a storm event in response to weather conditions affecting fishing. Your payout amount is calculated based solely on your recorded contribution history in the group. The smart contract processes payouts fairly and transparently—the more you contributed correctly, the stronger your payout basis. Everyone in the group can verify the calculation.',
    },
    {
      question: 'Is my money safe?',
      icon: Lock,
      answer:
        'Yes. All contributions and payouts are recorded permanently on blockchain, which means they cannot be altered or hidden. The community can audit and verify all transactions at any time. Additionally, smart contracts enforce the contribution and payout rules automatically, eliminating delays and reducing the risk of mishandling funds. Your money is protected by the transparency and immutability of blockchain technology.',
    },
    {
      question: 'What is a smart contract?',
      icon: Code,
      answer:
        'A smart contract is a self-executing program that runs on blockchain. It automatically applies the contribution and payout rules without needing a middleman or manual intervention. For IsdaSure, the smart contract handles when funds are collected, how much members can receive, and when payouts are distributed. This automation reduces delays, prevents errors, and ensures fair treatment for everyone in the group.',
    },
    {
      question: 'Do I need a bank account?',
      icon: Wallet,
      answer:
        'No. IsdaSure only requires a Freighter wallet connection—you do not need a traditional bank account. Your Freighter wallet serves as your identity and transaction record on blockchain. This makes IsdaSure accessible to anyone with a smartphone and internet connection, regardless of their banking history or location. Simply connect your wallet to get started.',
    },
    {
      question: 'How do I join a group?',
      icon: Users,
      answer:
        'First, connect your Freighter wallet to unlock your IsdaSure account. Then, complete user registration with basic information and a profile picture. Once registered, you can browse existing groups and join one that matches your barangay or fishing community, or create a new group if one does not exist. Your group admin will guide you on the daily contribution amount and payout rules.',
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
        <section className={["space-y-3 transition-all duration-700", animateIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'].join(' ')}>
          <p className="linear-kicker">FAQ</p>
          <h1 className="linear-heading text-4xl sm:text-5xl">Common questions</h1>
          <p className="max-w-3xl text-sm leading-7 linear-muted">
            Simple answers to help first-time users understand IsdaSure quickly and confidently.
          </p>
        </section>

        <section className="space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openFaqIndex === index;
            const IconComponent = item.icon;
            return (
              <div
                key={item.question}
                className={[
                  'overflow-hidden rounded-2xl border border-[color:var(--border-default)] bg-[color:var(--surface)] transition-all duration-500 hover:border-[color:var(--border-hover)]',
                  animateIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
                ].join(' ')}
                style={{ transitionDelay: `${100 + index * 90}ms` }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <IconComponent className="h-5 w-5 shrink-0 text-[color:var(--accent-bright)]" />
                    <span className="text-sm font-semibold text-[color:var(--foreground)] sm:text-base">{item.question}</span>
                  </div>
                  <span className={[
                    'text-xl font-semibold text-[color:var(--accent-bright)] shrink-0 transition-transform duration-300',
                    isOpen ? 'rotate-180' : 'rotate-0',
                  ].join(' ')}>{isOpen ? '−' : '+'}</span>
                </button>
                <div className={[
                  'grid overflow-hidden transition-all duration-300 ease-out',
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                ].join(' ')}>
                  <div className="min-h-0">
                    <p className="px-5 pb-5 pl-14 text-sm leading-7 linear-muted">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </main>

      <SiteFooter className="mt-16 sm:mt-20 lg:mt-24" />
    </div>
  );
}
