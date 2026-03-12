import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminStatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  change?: string;
  changePositive?: boolean;
}

export default function AdminStatsCard({
  label,
  value,
  icon: Icon,
  color,
  change,
  changePositive,
}: AdminStatsCardProps) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
        >
          <Icon size={22} style={{ color }} />
        </div>
        {change && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              changePositive
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            )}
          >
            {change}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold font-grotesk text-white mb-1">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}
