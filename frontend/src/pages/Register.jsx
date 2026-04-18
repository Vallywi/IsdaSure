import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SpotlightCard from '../components/SpotlightCard';
import { useWallet } from '../hooks/useWallet';

export default function Register() {
  const navigate = useNavigate();
  const { walletConnected, walletAddress, register } = useWallet();
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!walletConnected) {
      navigate('/');
    }
  }, [navigate, walletConnected]);

  const handlePictureUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setProfilePicture(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register({ fullName, identifier, password, age, profilePicture });
      navigate('/dashboard', { replace: true });
    } catch (registerError) {
      setError(registerError.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="isdasure-shell">
      <Navbar />
      <main className="mx-auto grid max-w-7xl gap-10 py-6 md:py-10 lg:grid-cols-[1fr_0.96fr] lg:items-start">
        <section className="space-y-7">
          <div className="linear-pill">Register</div>
          <h1 className="linear-display max-w-3xl">
            Create your profile.
          </h1>
          <p className="linear-lead max-w-xl">
            Your profile will be linked to the connected wallet address: {walletAddress}
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Profile data', 'Name, contact, and age stay with the account.'],
              ['Wallet linked', 'Identity is anchored to the connected wallet.'],
              ['Ready to use', 'Register once, then open the dashboard.'],
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
            <p className="linear-kicker">Registration panel</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">User Registration</h2>
          </div>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--foreground)]">Full Name</span>
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="linear-input" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--foreground)]">Email or Phone Number</span>
              <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="linear-input" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--foreground)]">Password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="linear-input" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--foreground)]">Age</span>
              <input type="number" min="1" value={age} onChange={(event) => setAge(event.target.value)} className="linear-input" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--foreground)]">Upload Profile Picture</span>
              <input type="file" accept="image/*" onChange={handlePictureUpload} className="linear-input" />
            </label>

            {profilePicture ? (
              <img src={profilePicture} alt="Profile preview" className="h-36 w-36 rounded-xl border border-[color:var(--border-default)] object-cover shadow-[0_8px_24px_rgba(0,0,0,0.35)]" />
            ) : null}

            {error ? <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200">{error}</p> : null}

            <button type="submit" disabled={loading} className="linear-button-primary w-full disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        </SpotlightCard>
      </main>
    </div>
  );
}
