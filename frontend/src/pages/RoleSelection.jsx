import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Landmark, ShieldCheck, UserRound } from 'lucide-react';
import Navbar from '../components/Navbar';
import SpotlightCard from '../components/SpotlightCard';
import { useWallet } from '../hooks/useWallet';

function OptionCard({ title, action, copy, points, onClick, icon: Icon, highlighted = false }) {
  return (
    <SpotlightCard
      as="button"
      type="button"
      onClick={onClick}
      className={[
        'w-full min-h-[255px] p-8 text-left transition-transform duration-300 hover:scale-[1.02] sm:min-h-[270px] [&::before]:hidden',
        highlighted
          ? 'border-[color:var(--border-hover)] bg-[linear-gradient(180deg,rgba(30,58,138,0.46),rgba(15,23,42,0.9))] shadow-[0_0_0_1px_rgba(96,165,250,0.35),0_18px_38px_rgba(30,58,138,0.3)]'
          : 'bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(2,6,23,0.92))]',
      ].join(' ')}
    >
      <div className={[
        'inline-flex h-14 w-14 items-center justify-center rounded-2xl',
        highlighted ? 'bg-indigo-400/20 text-indigo-200' : 'bg-slate-700/35 text-blue-200',
      ].join(' ')}>
        <Icon className="h-7 w-7" strokeWidth={2.2} />
      </div>

      <p className={[
        'mt-5 text-xs font-semibold uppercase tracking-[0.22em]',
        highlighted ? 'text-indigo-300' : 'text-blue-300',
      ].join(' ')}>
        {action}
      </p>

      <p className="mt-3 text-4xl font-semibold tracking-tight text-[color:var(--foreground)]">{title}</p>
      <p className="mt-4 text-sm leading-7 linear-muted">{copy}</p>

      <ul className="mt-6 space-y-3">
        {points.map((point) => (
          <li key={point} className="flex items-center gap-3 text-sm font-semibold text-[color:var(--foreground)]">
            <CheckCircle2 className={['h-5 w-5', highlighted ? 'text-indigo-300' : 'text-blue-300'].join(' ')} strokeWidth={2.2} />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </SpotlightCard>
  );
}

export default function RoleSelection() {
  const navigate = useNavigate();
  const { walletConnected, setSelectedRole } = useWallet();

  useEffect(() => {
    if (!walletConnected) {
      navigate('/');
    }
  }, [navigate, walletConnected]);

  return (
    <div className="isdasure-shell">
      <Navbar />
      <main className="mx-auto max-w-7xl py-8 md:py-12">
        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <OptionCard
            title="Admins"
            action="Action: Manage"
            copy="Monitor users, trigger storm events, and keep payout actions transparent."
            points={['Role-restricted controls', 'Payout execution logs', 'Wallet-bound operations']}
            icon={Landmark}
            onClick={() => {
              setSelectedRole('admin');
              navigate('/login/admin');
            }}
          />
          <OptionCard
            title="Users"
            action="Action: Contribute"
            copy="Contribute to the community pool and maintain a verifiable personal contribution history."
            points={['Fast wallet onboarding', 'Profile-linked history', 'Transparent status updates']}
            icon={UserRound}
            highlighted
            onClick={() => {
              setSelectedRole('user');
              navigate('/login/user');
            }}
          />
          <OptionCard
            title="Community"
            action="Action: Verify"
            copy="Track pool movement and payout events with tamper-resistant, role-based visibility."
            points={['Real-time pool stats', 'Payout transparency', 'Accountability by design']}
            icon={ShieldCheck}
            onClick={() => {
              setSelectedRole('user');
              navigate('/register');
            }}
          />
        </section>
      </main>
    </div>
  );
}
