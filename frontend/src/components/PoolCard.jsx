import { useEffect, useRef, useState } from 'react';
import SpotlightCard from './SpotlightCard';

export default function PoolCard({ title, value, suffix = '', hint }) {
  const [animatedValue, setAnimatedValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      setAnimatedValue(value);
      previousValue.current = value;
      return;
    }

    const startValue = typeof previousValue.current === 'number' ? previousValue.current : value;
    const delta = value - startValue;

    if (delta === 0) {
      setAnimatedValue(value);
      return;
    }

    const startedAt = performance.now();
    const durationMs = 520;
    let frameId = null;

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / durationMs, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      const next = startValue + delta * eased;
      setAnimatedValue(Number.isInteger(value) ? Math.round(next) : Number(next.toFixed(2)));

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    previousValue.current = value;

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [value]);

  return (
    <SpotlightCard className="min-h-[126px]">
      <p className="linear-kicker">{title}</p>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-4xl font-semibold tracking-tight text-[color:var(--foreground)]">{animatedValue}</span>
        {suffix ? <span className="pb-1 text-sm font-semibold text-[color:var(--accent-bright)]">{suffix}</span> : null}
      </div>
      {hint ? <p className="mt-3 text-sm linear-muted">{hint}</p> : null}
    </SpotlightCard>
  );
}