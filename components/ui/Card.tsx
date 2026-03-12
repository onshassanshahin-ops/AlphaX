import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  neon?: boolean;
}

export default function Card({ children, className, hover = false, glow = false, neon = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl p-6',
        'bg-dark/80 border border-cyan/15',
        hover && 'content-card cursor-pointer',
        glow && 'glow-cyan',
        neon && 'neon-border',
        className
      )}
    >
      {children}
    </div>
  );
}

export function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('glass-card rounded-xl p-6', className)}>
      {children}
    </div>
  );
}

export function StatsCard({
  label,
  value,
  icon,
  color = '#00B4D8',
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="glass-card rounded-xl p-6 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0"
        style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold font-grotesk text-white">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
      </div>
    </div>
  );
}
