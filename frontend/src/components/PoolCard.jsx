import SpotlightCard from './SpotlightCard';

export default function PoolCard({ title, value, suffix = '', hint }) {
  return (
    <SpotlightCard className="min-h-[126px]">
      <p className="linear-kicker">{title}</p>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-4xl font-semibold tracking-tight text-[color:var(--foreground)]">{value}</span>
        {suffix ? <span className="pb-1 text-sm font-semibold text-[color:var(--accent-bright)]">{suffix}</span> : null}
      </div>
      {hint ? <p className="mt-3 text-sm linear-muted">{hint}</p> : null}
    </SpotlightCard>
  );
}