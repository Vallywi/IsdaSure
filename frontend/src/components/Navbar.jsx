import { useMemo, useState } from 'react';
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

export default function Navbar({ className = '' }) {
  const [open, setOpen] = useState(false);
  const [openUsersNav, setOpenUsersNav] = useState(false);
  const [usersSearchTerm, setUsersSearchTerm] = useState('');
  const [usersGroupFilter, setUsersGroupFilter] = useState('');
  const navigate = useNavigate();
  const {
    walletConnected,
    shortWalletAddress,
    userRole,
    isAuthenticated,
    poolState,
    users,
    groups,
    connectWallet,
    disconnectWallet,
    logout,
  } = useWallet();

  const chainMode = String(poolState?.chainMode || 'mock').toLowerCase();
  const isRpcMode = chainMode === 'rpc';

  const usersWithStats = useMemo(() => {
    return (users || [])
      .filter((user) => user.role === 'user')
      .map((user) => {
        const totalContributions = (user.activityHistory || [])
          .filter((entry) => entry.type === 'contribution')
          .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

        const userGroupNames = (groups || [])
          .filter((group) =>
            (group.members || []).some((member) => {
              const identifierMatch =
                String(member.identifier || '').trim().toLowerCase() === String(user.identifier || '').trim().toLowerCase();
              const walletMatch =
                String(member.walletAddress || '').trim().toUpperCase() &&
                String(member.walletAddress || '').trim().toUpperCase() === String(user.walletAddress || '').trim().toUpperCase();
              const fullNameMatch =
                String(member.fullName || '').trim().toLowerCase() === String(user.fullName || '').trim().toLowerCase();

              return identifierMatch || walletMatch || fullNameMatch;
            }),
          )
          .map((group) => group.name);

        return {
          ...user,
          totalContributions,
          userGroupNames,
          avatarInitials: String(user.fullName || 'U')
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() || '')
            .join(''),
        };
      });
  }, [groups, users]);

  const allGroupNames = useMemo(() => {
    return (groups || []).map((group) => String(group.name || '').trim()).filter(Boolean);
  }, [groups]);

  const filteredUsers = useMemo(() => {
    const query = String(usersSearchTerm || '').trim().toLowerCase();
    const groupFilter = String(usersGroupFilter || '').trim().toLowerCase();

    return usersWithStats.filter((user) => {
      const matchesGroup =
        !groupFilter ||
        (user.userGroupNames || []).some((groupName) => String(groupName || '').trim().toLowerCase() === groupFilter);

      if (!matchesGroup) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        user.fullName,
        user.identifier,
        user.walletAddress,
        (user.userGroupNames || []).join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [usersGroupFilter, usersSearchTerm, usersWithStats]);

  const handleWalletAction = async () => {
    try {
      if (walletConnected) {
        disconnectWallet();
        setOpenUsersNav(false);
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
    setOpenUsersNav(false);
    navigate('/');
  };

  return (
    <header
      className={[
        'relative sticky top-4 z-30 mb-8 rounded-2xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_10px_36px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-5',
        className,
      ].join(' ')}
    >
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
                {userRole === 'admin' ? (
                  <button
                    type="button"
                    onClick={() => setOpenUsersNav((previous) => !previous)}
                    className={[
                      'linear-button-ghost rounded-lg px-3 py-2 text-sm',
                      openUsersNav ? 'bg-[color:var(--accent)] text-white shadow-[0_0_0_1px_rgba(59,130,246,0.45),0_6px_16px_rgba(30,58,138,0.3)]' : '',
                    ].join(' ')}
                  >
                    Users
                  </button>
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
                {userRole === 'admin' ? (
                  <button
                    type="button"
                    onClick={() => setOpenUsersNav((previous) => !previous)}
                    className="linear-button-ghost rounded-lg px-3 py-2 text-left text-sm"
                  >
                    Users
                  </button>
                ) : null}
              </>
            ) : null}
          </nav>
          {isAuthenticated && userRole === 'admin' && openUsersNav ? (
            <div className="space-y-2 rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] p-3">
              <input
                type="text"
                value={usersSearchTerm}
                onChange={(event) => setUsersSearchTerm(event.target.value)}
                placeholder="Search user"
                className="linear-input w-full"
              />
              <select value={usersGroupFilter} onChange={(event) => setUsersGroupFilter(event.target.value)} className="linear-input w-full">
                <option value="">All groups</option>
                {allGroupNames.map((groupName) => (
                  <option key={`mobile-user-nav-${groupName}`} value={groupName}>
                    {groupName}
                  </option>
                ))}
              </select>
              <nav className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
                {filteredUsers.map((user) => (
                  <div key={`mobile-user-item-${user.id}`} className="rounded-lg border border-[color:var(--border-default)] bg-[color:var(--surface)] p-2 text-sm">
                    <div className="flex items-center gap-2">
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt={`${user.fullName} profile`} className="h-8 w-8 rounded-full border border-[color:var(--border-default)] object-cover" />
                      ) : (
                        <div className="grid h-8 w-8 place-items-center rounded-full border border-[color:var(--border-default)] bg-[color:var(--surface-muted)] text-xs font-semibold text-[color:var(--foreground)]">
                          {user.avatarInitials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[color:var(--foreground)]">{user.fullName}</p>
                        <p className="truncate text-xs linear-muted">{user.userGroupNames.join(', ') || 'No group'}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {!filteredUsers.length ? <p className="text-xs linear-muted">No users found.</p> : null}
              </nav>
            </div>
          ) : null}
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

      {isAuthenticated && userRole === 'admin' && openUsersNav ? (
        <div className="absolute right-5 top-[calc(100%+10px)] z-40 hidden w-[360px] rounded-2xl border border-[color:var(--border-default)] bg-[color:var(--surface)] p-4 shadow-[0_10px_36px_rgba(0,0,0,0.35)] md:block">
          <p className="mb-3 text-sm font-semibold text-[color:var(--foreground)]">Users</p>
          <div className="space-y-2">
            <input
              type="text"
              value={usersSearchTerm}
              onChange={(event) => setUsersSearchTerm(event.target.value)}
              placeholder="Search name, email, wallet"
              className="linear-input w-full"
            />
            <select value={usersGroupFilter} onChange={(event) => setUsersGroupFilter(event.target.value)} className="linear-input w-full">
              <option value="">All groups</option>
              {allGroupNames.map((groupName) => (
                <option key={`desktop-user-nav-${groupName}`} value={groupName}>
                  {groupName}
                </option>
              ))}
            </select>
          </div>

          <nav className="mt-3 max-h-[340px] space-y-2 overflow-y-auto pr-1">
            {filteredUsers.map((user) => (
              <div key={`desktop-user-item-${user.id}`} className="rounded-lg border border-[color:var(--border-default)] bg-[color:var(--surface)] p-2 text-sm">
                <div className="flex items-center gap-2">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={`${user.fullName} profile`} className="h-8 w-8 rounded-full border border-[color:var(--border-default)] object-cover" />
                  ) : (
                    <div className="grid h-8 w-8 place-items-center rounded-full border border-[color:var(--border-default)] bg-[color:var(--surface-muted)] text-xs font-semibold text-[color:var(--foreground)]">
                      {user.avatarInitials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[color:var(--foreground)]">{user.fullName}</p>
                    <p className="truncate text-xs linear-muted">{user.identifier}</p>
                    <p className="truncate text-xs linear-muted">{user.userGroupNames.join(', ') || 'No group'}</p>
                  </div>
                </div>
              </div>
            ))}
            {!filteredUsers.length ? <p className="text-xs linear-muted">No users found for this filter.</p> : null}
          </nav>
        </div>
      ) : null}

    </header>
  );
}
