import { useCallback, useRef } from 'react';

export default function SpotlightCard({ as: Component = 'div', className = '', children, ...props }) {
  const cardRef = useRef(null);

  const handleMouseMove = useCallback((event) => {
    const element = cardRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    element.style.setProperty('--spot-x', `${x}%`);
    element.style.setProperty('--spot-y', `${y}%`);
  }, []);

  return (
    <Component
      ref={cardRef}
      className={`linear-card spotlight-card linear-card-interactive ${className}`.trim()}
      onMouseMove={handleMouseMove}
      {...props}
    >
      {children}
    </Component>
  );
}
