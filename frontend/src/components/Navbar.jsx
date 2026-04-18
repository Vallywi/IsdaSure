import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useWallet } from '../hooks/useWallet';

function navClass({ isActive }) {
  return [
    'linear-button-ghost rounded-lg px-3 py-2 text-sm',
    isActive
      ? 'bg-[color:var(--accent)] text-white shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3)]'
      : '',
  ].join(' ');
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const {
    walletConnected,
    shortWalletAddress,
    userRole,
    isAuthenticated,
    connectWallet,
    disconnectWallet,
    logout,
  } = useWallet();

  const handleWalletAction = async () => {
    try {
      if (walletConnected) {
        disconnectWallet();
        return;
      }
      await connectWallet();
      navigate('/roles');
    } catch (error) {
      alert(error.message || 'Wallet connection failed');
    }
  };

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-4 z-30 mb-8 rounded-2xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_10px_36px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--border-accent)] bg-[color:var(--accent)] text-white shadow-[0_4px_14px_rgba(94,106,210,0.35)]">
            <span className="text-lg font-semibold">I</span>
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-[color:var(--foreground)]">IsdaSure</p>
            <p className="linear-kicker !tracking-[0.16em] !text-[10px]">Wallet-first community access</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 md:hidden">
          <button type="button" onClick={toggleTheme} className="linear-button-secondary px-3 py-2 text-sm">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button type="button" onClick={() => setOpen((previous) => !previous)} className="linear-button-secondary min-w-[72px] px-3 py-2 text-sm">
            {open ? 'X' : 'Menu'}
          </button>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <nav className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className={navClass}>
                  Dashboard
                </NavLink>
                {userRole === 'admin' ? (
                  <NavLink to="/admin" className={navClass}>
                    Admin
                  </NavLink>
                ) : null}
              </>
            ) : (
              <NavLink to="/roles" className={navClass}>
                Get Started
              </NavLink>
            )}
          </nav>
          <button type="button" onClick={toggleTheme} className="linear-button-secondary gap-2 px-4 py-2 text-sm">
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
          </button>
          <button type="button" onClick={handleWalletAction} className="linear-button-secondary px-4 py-2 text-sm">
            {walletConnected ? 'Disconnect Wallet' : 'Connect Wallet'}
          </button>
          {isAuthenticated ? (
            <button type="button" onClick={handleLogout} className="linear-button-primary px-4 py-2 text-sm">
              Logout
            </button>
          ) : (
            <button type="button" onClick={() => navigate('/roles')} className="linear-button-primary px-4 py-2 text-sm">
              Login
            </button>
          )}
        </div>
      </div>

      {open ? (
        <div className="fade-in mt-4 space-y-3 rounded-2xl border border-[color:var(--border-default)] bg-[color:var(--bg-elevated)] p-4 backdrop-blur-xl md:hidden">
          <nav className="grid gap-2">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className={navClass} onClick={() => setOpen(false)}>
                  Dashboard
                </NavLink>
                {userRole === 'admin' ? (
                  <NavLink to="/admin" className={navClass} onClick={() => setOpen(false)}>
                    Admin
                  </NavLink>
                ) : null}
              </>
            ) : (
              <NavLink to="/roles" className={navClass} onClick={() => setOpen(false)}>
                Get Started
              </NavLink>
            )}
          </nav>
          <div className="grid gap-2">
            <button type="button" onClick={toggleTheme} className="linear-button-secondary w-full text-sm">
              Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </button>
            <button type="button" onClick={handleWalletAction} className="linear-button-secondary w-full text-sm">
              {walletConnected ? `Disconnect ${shortWalletAddress}` : 'Connect Wallet'}
            </button>
            {isAuthenticated ? (
              <button type="button" onClick={handleLogout} className="linear-button-primary w-full text-sm">
                Logout
              </button>
            ) : (
              <button type="button" onClick={() => navigate('/roles')} className="linear-button-primary w-full text-sm">
                Login
              </button>
            )}
          </div>
        </div>
      ) : null}

    </header>
  );
}
