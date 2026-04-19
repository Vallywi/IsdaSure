import { useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';

function toastClass(type) {
  if (type === 'error') {
    return 'border-rose-400/40 bg-rose-500/15 text-rose-100';
  }
  if (type === 'success') {
    return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100';
  }
  return 'border-[color:var(--border-accent)] bg-[color:var(--accent-glow)] text-[color:var(--foreground)]';
}

export default function ToastStack() {
  const { toasts, dismissToast } = useWallet();

  useEffect(() => {
    if (!toasts.length) {
      return undefined;
    }

    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        dismissToast(toast.id);
      }, 3600),
    );

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [dismissToast, toasts]);

  if (!toasts.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-[0_12px_28px_rgba(2,6,23,0.35)] backdrop-blur-xl ${toastClass(toast.type)}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
