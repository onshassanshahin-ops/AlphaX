import { cn } from '@/lib/utils';
import {
  getFieldColor,
  getStatusColor,
  getAnnouncementTypeColor,
  formatField,
  formatStatus,
  formatAnnouncementType,
} from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'field' | 'status' | 'announcement' | 'role' | 'custom';
  value?: string;
}

export default function Badge({ children, className, variant, value }: BadgeProps) {
  let colorClass = '';

  if (variant === 'field' && value) {
    colorClass = getFieldColor(value);
  } else if (variant === 'status' && value) {
    colorClass = getStatusColor(value);
  } else if (variant === 'announcement' && value) {
    colorClass = getAnnouncementTypeColor(value);
  } else if (variant === 'role') {
    colorClass = 'bg-navy/50 text-cyan border-cyan/30';
  }

  return (
    <span
      className={cn(
        'badge text-xs font-semibold uppercase tracking-wide',
        colorClass,
        className
      )}
    >
      {children}
    </span>
  );
}

export function FieldBadge({ field }: { field: string }) {
  return (
    <Badge variant="field" value={field}>
      {formatField(field)}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="status" value={status}>
      {formatStatus(status)}
    </Badge>
  );
}

export function AnnouncementTypeBadge({ type }: { type: string }) {
  return (
    <Badge variant="announcement" value={type}>
      {formatAnnouncementType(type)}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const roleColors: Record<string, string> = {
    'co-captain': 'bg-gold/20 text-gold border-gold/30',
    navigator: 'bg-cyan/20 text-cyan border-cyan/30',
    alphanaut: 'bg-purple/20 text-purple border-purple/30',
  };

  const labels: Record<string, string> = {
    'co-captain': 'Co-Captain',
    navigator: 'Navigator',
    alphanaut: 'Alphanaut',
  };

  return (
    <span className={cn('badge', roleColors[role] || 'bg-slate-500/20 text-slate-400 border-slate-500/30')}>
      {labels[role] || role}
    </span>
  );
}
