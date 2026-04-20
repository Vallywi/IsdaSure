import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, Upload, UserRound, Wallet } from 'lucide-react';
import Navbar from '../components/Navbar';
import SpotlightCard from '../components/SpotlightCard';
import { useWallet } from '../hooks/useWallet';
import registerImage from '../../images/register.jpg';

const REGISTER_DRAFT_KEY = 'isdasure-register-draft';

export default function Register() {
  const navigate = useNavigate();
  const { walletConnected, register } = useWallet();
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [age, setAge] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);

  useEffect(() => {
    if (!walletConnected) {
      navigate('/');
    }
  }, [navigate, walletConnected]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const rawDraft = window.localStorage.getItem(REGISTER_DRAFT_KEY);
    if (!rawDraft) {
      return;
    }

    try {
      const draft = JSON.parse(rawDraft);
      setFullName(draft.fullName || '');
      setIdentifier(draft.identifier || '');
      setPassword(draft.password || '');
      setAge(draft.age || '');
    } catch {
      window.localStorage.removeItem(REGISTER_DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const draft = { fullName, identifier, password, age };
    window.localStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify(draft));
    setDraftSaved(true);
  }, [fullName, identifier, password, age]);

  const handlePictureUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const source = String(reader.result || '');

      const image = new Image();
      image.onload = () => {
        const maxSize = 1024;
        let { width, height } = image;

        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height >= width && height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) {
          setProfilePicture(source);
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        setProfilePicture(canvas.toDataURL('image/jpeg', 0.82));
      };

      image.onerror = () => setProfilePicture(source);
      image.src = source;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register({ fullName, identifier, password, age, profilePicture });
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(REGISTER_DRAFT_KEY);
      }
      navigate('/dashboard', { replace: true });
    } catch (registerError) {
      setError(registerError.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <img
        src={registerImage}
        alt="Fisherfolk registration backdrop"
        className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-slate-950/38" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Navbar className="!bg-slate-900/28" />
        <main className="grid gap-10 py-6 md:py-10 lg:grid-cols-[1fr_0.96fr] lg:items-start">
          <section className="space-y-7">
          <div className="linear-pill">Register</div>
          <h1 className="linear-display max-w-3xl text-slate-200 [text-shadow:0_1px_2px_rgba(255,255,255,0.12)]">
            Create your profile.
          </h1>
          <p className="text-sm font-medium text-slate-950/95 text-blue-950 [text-shadow:0_1px_2px_rgba(255,255,255,0.08)]">
            {draftSaved ? 'Auto-save on: your profile draft is being saved while you type.' : 'Auto-save is preparing...'}
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: 'Mangingisda Profile', copy: 'Keep fisherfolk identity, contact details, and age in one trusted profile.', icon: UserRound },
              { title: 'Storm-Ready Access', copy: 'Wallet-linked identity helps unlock secure storm support workflows.', icon: Wallet },
              { title: 'Community Security', copy: 'Your account is protected by role checks and wallet-based verification.', icon: ShieldCheck },
            ].map(({ title, copy, icon: CardIcon }) => (
              <SpotlightCard key={title} className="p-5 [&::before]:hidden">
                <p className="linear-kicker flex items-center gap-2">
                  <CardIcon className="h-4 w-4 text-[color:var(--accent-bright)]" />
                  <span>{title}</span>
                </p>
                <p className="mt-3 text-sm leading-6 linear-muted">{copy}</p>
              </SpotlightCard>
            ))}
          </div>

          <div className="rounded-2xl border border-[color:var(--border-default)] bg-[color:var(--surface)]/60 px-4 py-3 backdrop-blur-xl">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--foreground-subtle)]">
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--accent-bright)]" />
              <span>Functionality highlights</span>
            </p>
            <p className="mt-2 text-sm linear-muted">Auto-save draft, wallet-linked verification, profile photo preview, and secure registration flow built for coastal fisherfolk communities.</p>
          </div>
          </section>

          <SpotlightCard className="space-y-5 [&::before]:hidden">
          <div>
            <p className="linear-kicker">Registration panel</p>
            <h2 className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">
              <UserRound className="h-6 w-6 text-[color:var(--accent-bright)]" />
              <span>User Registration</span>
            </h2>
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
              <div className="mb-2 flex items-center justify-between">
                <span className="block text-sm font-semibold text-[color:var(--foreground)]">Password</span>
                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-bright)] transition hover:text-[color:var(--foreground)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className="linear-input" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--foreground)]">Age</span>
              <input type="number" min="1" value={age} onChange={(event) => setAge(event.target.value)} className="linear-input" />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)]">
                <Upload className="h-4 w-4 text-[color:var(--accent-bright)]" />
                <span>Upload Profile Picture</span>
              </span>
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
    </div>
  );
}
