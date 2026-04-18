import SpotlightCard from './SpotlightCard';

export default function ProfileCard({ name, picture, walletAddress, age, description }) {
  const shortWallet = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not connected';

  return (
    <SpotlightCard className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] text-2xl font-semibold text-[color:var(--accent-bright)]">
        {picture ? <img src={picture} alt={name} className="h-full w-full object-cover" /> : <span>{name?.slice(0, 1) || 'I'}</span>}
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-[color:var(--foreground)]">{name}</p>
        <p className="text-sm linear-muted">{description || 'Community member of IsdaSure'}</p>
        {age ? <p className="linear-kicker !tracking-[0.12em] !text-[10px]">Age {age}</p> : null}
        <p className="text-sm font-semibold text-[color:var(--accent-bright)]">{shortWallet}</p>
      </div>
    </SpotlightCard>
  );
}
