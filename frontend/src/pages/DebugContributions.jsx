import React, { useEffect, useState } from 'react';
import { apiRecentContributions } from '../services/api';

export default function DebugContributions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await apiRecentContributions();
        if (mounted) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (mounted) setError(e.message || String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Debug: Recent Contributions</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && (
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-gray-400">No recent contributions found.</p>
          ) : (
            items.map((it) => (
              <div key={it.id || JSON.stringify(it)} className="p-3 border rounded bg-white/5">
                <div className="text-sm font-semibold">{it.user || it.identifier}</div>
                <div className="text-xs text-gray-300">Group: {it.groupName || it.groupId}</div>
                <div className="text-xs">Amount: ₱{it.amount}</div>
                <div className="text-xs text-gray-400">{it.timestamp}</div>
                {it.txHash ? <div className="text-xs"><a href={it.explorerUrl||'#'} target="_blank" rel="noreferrer">View tx</a></div> : null}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
