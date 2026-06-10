import { useEffect, useState } from 'react';

export default function StatsCard({ icon: Icon, label, value, prefix = '', suffix = '', trend, color = 'var(--color-primary)', delay = 0 }) {
  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (numValue === 0) return;

    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayValue(Math.round(numValue * eased));
      if (progress < 1) requestAnimationFrame(animate);
      else setDisplayValue(numValue);
    };

    const timer = setTimeout(() => requestAnimationFrame(animate), delay);
    return () => clearTimeout(timer);
  }, [numValue, delay]);

  return (
    <div
      className="glass-card animate-fade-in"
      style={{
        padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 16,
        animationDelay: `${delay}ms`,
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 'var(--radius-md)',
        background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {Icon && <Icon size={22} color={color} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 4, fontWeight: 500 }}>
          {label}
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
          {prefix}{typeof value === 'number' ? displayValue.toLocaleString('en-IN') : value}{suffix}
        </div>
        {trend && (
          <div style={{
            fontSize: 12, marginTop: 6, fontWeight: 500,
            color: trend > 0 ? 'var(--color-success)' : 'var(--color-danger)',
          }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
          </div>
        )}
      </div>
    </div>
  );
}
