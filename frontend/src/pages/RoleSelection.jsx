import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Landmark, ShieldCheck, UserRound } from 'lucide-react';
import Navbar from '../components/Navbar';
import SpotlightCard from '../components/SpotlightCard';
import { useWallet } from '../hooks/useWallet';
import gandaImage from '../../images/ganda.jpg';

function OptionCard({ title, action, copy, points, onClick, icon: Icon, highlighted = false }) {
  return (
    <SpotlightCard
      as="button"
      type="button"
      onClick={onClick}
      className={[
        'flex w-full min-h-[470px] flex-col items-center justify-center p-8 text-center transition-transform duration-300 hover:scale-[1.02] sm:min-h-[540px] [&::before]:hidden',
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
      <p className="mt-4 max-w-[34ch] text-sm leading-7 linear-muted">{copy}</p>

      <ul className="mt-6 space-y-3 text-center">
        {points.map((point) => (
          <li key={point} className="mx-auto flex w-fit items-center gap-3 text-sm font-semibold text-[color:var(--foreground)]">
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
    <div className="relative min-h-screen overflow-hidden">
      <img
        src={gandaImage}
        alt="Fisherfolk community"
        className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-slate-950/35" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Navbar className="!bg-slate-900/28" />
        <main className="py-6 md:py-8">
          <section className="grid min-h-[78vh] content-center gap-5 md:min-h-[82vh] md:grid-cols-2 lg:min-h-[86vh] lg:grid-cols-3">
            <OptionCard
              title="Barangay Officials"
              action="Action: Manage"
              copy="Barangay officials in small islands monitor members, trigger storm actions, and keep payout activity transparent."
              points={['Storm trigger control', 'Payout execution logs', 'Wallet-bound governance actions']}
              icon={Landmark}
              onClick={() => {
                setSelectedRole('admin');
                navigate('/login/admin');
              }}
            />
            <OptionCard
              title="Log In / Sign In"
              action="Already have an account?"
              copy="Access your existing account through a secure wallet-linked sign-in flow."
              points={['Existing account access', 'Role-based sign in', 'Secure wallet session']}
              icon={UserRound}
              highlighted
              onClick={() => {
                setSelectedRole('user');
                navigate('/login/user');
              }}
            />
            <OptionCard
              title="Sign Up / Register"
              action="New to IsdaSure?"
              copy="Create an account to join the community and start with wallet-linked registration."
              points={['Quick account creation', 'Wallet-linked registration', 'Ready for contribution tracking']}
              icon={ShieldCheck}
              onClick={() => {
                setSelectedRole('user');
                navigate('/register');
              }}
            />
          </section>
        </main>
      </div>
    </div>
  );
}
