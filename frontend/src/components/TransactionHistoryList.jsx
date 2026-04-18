import SpotlightCard from './SpotlightCard';

function typeLabel(type) {
  return type === 'payout' ? 'Payout received' : 'Contribution sent';
}

function typeBadge(type) {
  return type === 'payout'
    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
    : 'bg-[color:var(--accent-glow)] text-indigo-100 border border-[color:var(--border-accent)]';
}

function formatTimestamp(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString();
}

export default function TransactionHistoryList({ title, items = [], emptyText = 'No transactions yet' }) {
  return (
    <SpotlightCard>
      <h3 className="text-lg font-semibold text-[color:var(--foreground)]">{title}</h3>

      {items.length ? (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[color:var(--foreground)]">{item.user}</p>
                  <p className="text-xs linear-muted">{formatTimestamp(item.timestamp)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${typeBadge(item.type)}`}>
                  {typeLabel(item.type)}
                </span>
              </div>
              <p className="mt-2 text-lg font-semibold text-[color:var(--accent-bright)]">₱{item.amount}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-[color:var(--border-default)] px-4 py-6 text-center text-sm linear-muted">
          {emptyText}
        </p>
      )}
    </SpotlightCard>
  );
}