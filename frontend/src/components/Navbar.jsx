import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';

function navClass({ isActive }) {
  return [
    'linear-button-ghost rounded-lg px-3 py-2 text-sm',
    isActive
      ? 'bg-[color:var(--accent)] text-white shadow-[0_0_0_1px_rgba(59,130,246,0.45),0_6px_16px_rgba(30,58,138,0.3)]'
      : '',
  ].join(' ');
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const {
    walletConnected,
    shortWalletAddress,
    userRole,
    isAuthenticated,
    poolState,
    connectWallet,
    disconnectWallet,
    logout,
  } = useWallet();

  const chainMode = String(poolState?.chainMode || 'mock').toLowerCase();
  const isRpcMode = chainMode === 'rpc';

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
          <div className="h-11 w-11 shrink-0 overflow-visible">
            <img src="/logo.png" alt="IsdaSure logo" className="h-11 w-11 origin-left translate-x-0 scale-[4.5] object-contain" />
          </div>
        </Link>

        <div className="flex items-center gap-2 md:hidden">
          <button type="button" onClick={() => setOpen((previous) => !previous)} className="linear-button-secondary min-w-[72px] px-3 py-2 text-sm">
            {open ? 'X' : 'Menu'}
          </button>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <div
            className={[
              'rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]',
              isRpcMode
                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                : 'border-amber-400/40 bg-amber-500/15 text-amber-200',
            ].join(' ')}
            title={isRpcMode ? 'Real on-chain Soroban RPC mode' : 'Mock mode - set SOROBAN_RPC_URL for on-chain mode'}
          >
            {isRpcMode ? 'On-chain RPC' : 'Mock Chain'}
          </div>
          <nav className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className={navClass}>
                  Dashboard
                </NavLink>
                {userRole === 'user' ? (
                  <NavLink to="/contribution-history" className={navClass}>
                    Contribution History
                  </NavLink>
                ) : null}
                {userRole === 'admin' ? (
                  <NavLink to="/admin" className={navClass}>
                    Admin
                  </NavLink>
                ) : null}
              </>
            ) : null}
          </nav>
          <button type="button" onClick={handleWalletAction} className="linear-button-secondary px-4 py-2 text-sm">
            {walletConnected ? 'Disconnect Wallet' : 'Connect Wallet'}
          </button>
          {isAuthenticated ? (
            <button type="button" onClick={handleLogout} className="linear-button-primary px-4 py-2 text-sm">
              Logout
            </button>
          ) : walletConnected ? (
            <button type="button" onClick={() => navigate('/roles')} className="linear-button-primary px-4 py-2 text-sm">
              Login
            </button>
          ) : null}
        </div>
      </div>

      {open ? (
        <div className="fade-in mt-4 space-y-3 rounded-2xl border border-[color:var(--border-default)] bg-[color:var(--bg-elevated)] p-4 backdrop-blur-xl md:hidden">
          <div
            className={[
              'inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]',
              isRpcMode
                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                : 'border-amber-400/40 bg-amber-500/15 text-amber-200',
            ].join(' ')}
            title={isRpcMode ? 'Real on-chain Soroban RPC mode' : 'Mock mode - set SOROBAN_RPC_URL for on-chain mode'}
          >
            {isRpcMode ? 'On-chain RPC' : 'Mock Chain'}
          </div>
          <nav className="grid gap-2">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className={navClass} onClick={() => setOpen(false)}>
                  Dashboard
                </NavLink>
                {userRole === 'user' ? (
                  <NavLink to="/contribution-history" className={navClass} onClick={() => setOpen(false)}>
                    Contribution History
                  </NavLink>
                ) : null}
                {userRole === 'admin' ? (
                  <NavLink to="/admin" className={navClass} onClick={() => setOpen(false)}>
                    Admin
                  </NavLink>
                ) : null}
              </>
            ) : null}
          </nav>
          <div className="grid gap-2">
            <button type="button" onClick={handleWalletAction} className="linear-button-secondary w-full text-sm">
              {walletConnected ? `Disconnect ${shortWalletAddress}` : 'Connect Wallet'}
            </button>
            {isAuthenticated ? (
              <button type="button" onClick={handleLogout} className="linear-button-primary w-full text-sm">
                Logout
              </button>
            ) : walletConnected ? (
              <button type="button" onClick={() => navigate('/roles')} className="linear-button-primary w-full text-sm">
                Login
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

    </header>
  );
}
