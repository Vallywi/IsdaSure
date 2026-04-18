import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SpotlightCard from '../components/SpotlightCard';
import { useWallet } from '../hooks/useWallet';

function OptionCard({ title, copy, onClick }) {
  return (
    <SpotlightCard as="button" type="button" onClick={onClick} className="w-full text-left">
      <p className="linear-kicker">Path</p>
      <p className="mt-3 text-xl font-semibold tracking-tight text-[color:var(--foreground)]">{title}</p>
      <p className="mt-2 text-sm leading-6 linear-muted">{copy}</p>
    </SpotlightCard>
  );
}

export default function RoleSelection() {
  const navigate = useNavigate();
  const { walletConnected, walletAddress, setSelectedRole } = useWallet();

  useEffect(() => {
    if (!walletConnected) {
      navigate('/');
    }
  }, [navigate, walletConnected]);

  return (
    <div className="isdasure-shell">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-10 py-6 md:py-10">
        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div className="space-y-4">
            <div className="linear-pill">Verified wallet linked</div>
            <h1 className="linear-display max-w-3xl">
              Built for the ecosystem.
            </h1>
            <p className="linear-lead max-w-2xl">
              One wallet, three distinct paths tailored for access, contribution, and administration.
            </p>
            <p className="linear-kicker !tracking-[0.16em]">Wallet linked: {walletAddress}</p>
          </div>

          <SpotlightCard>
            <p className="linear-kicker">Choose how to continue</p>
            <p className="mt-3 text-sm leading-6 linear-muted">
              Pick the experience that matches your access level.
            </p>
          </SpotlightCard>
        </section>

        <div className="linear-divider" />

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <OptionCard title="Admin Login" copy="Access the admin dashboard and trigger storm day actions." onClick={() => { setSelectedRole('admin'); navigate('/login/admin'); }} />
          <OptionCard title="User Login" copy="Log in to contribute and view your profile dashboard." onClick={() => { setSelectedRole('user'); navigate('/login/user'); }} />
          <OptionCard title="Register" copy="Create a user profile and link it to your wallet address." onClick={() => { setSelectedRole('user'); navigate('/register'); }} />
        </section>
      </main>
    </div>
  );
}
