import SpotlightCard from './SpotlightCard';
import { buildStellarExpertTxUrl } from '../services/stellar';

function typeLabel(type) {
  return type === 'payout' ? 'Payout received' : 'Contribution sent';
}

function actionLabel(item) {
  if (item?.actionLabel) {
    return item.actionLabel;
  }

  if (item?.type === 'payout') {
    return 'Payout Release';
  }

  if (item?.type === 'contribution') {
    return 'Contribute';
  }

  return 'Activity';
}

function txStatusClass(status) {
  if (status === 'FAILED') {
    return 'bg-rose-500/15 text-rose-200 border border-rose-400/30';
  }
  if (status === 'CONFIRMED') {
    return 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30';
  }
  return 'bg-amber-500/15 text-amber-200 border border-amber-400/30';
}

function typeBadge(type) {
  return type === 'payout'
    ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30'
    : 'bg-[color:var(--accent-glow)] text-[color:var(--accent-bright)] border border-[color:var(--border-accent)]';
}

function formatTimestamp(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString();
}

export default function TransactionHistoryList({ title, items = [], emptyText = 'No transactions yet' }) {
  return (
    <SpotlightCard>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-[color:var(--foreground)]">{title}</h3>
        <span className="text-xs text-[color:var(--foreground-muted)]">Scroll to view more</span>
      </div>

      {items.length ? (
        <ul className="mt-4 max-h-[320px] space-y-3 overflow-y-auto pr-1">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)]/85 px-4 py-4 shadow-sm transition hover:border-[color:var(--border-hover)] hover:bg-[color:var(--surface-hover)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[color:var(--foreground)]">{item.user}</p>
                  <p className="text-xs font-semibold text-[color:var(--accent-bright)]">{actionLabel(item)}</p>
                  <p className="text-xs linear-muted">{formatTimestamp(item.timestamp)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${typeBadge(item.type)}`}>
                  {typeLabel(item.type)}
                </span>
              </div>
              <p className="mt-2 text-lg font-semibold text-[color:var(--accent-bright)]">₱{item.amount}</p>
              {item.txStatus ? <p className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${txStatusClass(item.txStatus)}`}>{item.txStatus}</p> : null}
              {item.explorerUrl || item.txHash ? (
                <p className="mt-2">
                  <a
                    href={item.explorerUrl || buildStellarExpertTxUrl(item.txHash || '')}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[color:var(--accent-bright)] underline"
                  >
                    View on Stellar Expert
                  </a>
                </p>
              ) : null}
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