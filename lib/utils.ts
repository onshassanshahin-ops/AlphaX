import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate 8-character alphanumeric code (format: AX-XXXXXXXX)
export function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
  let code = 'AX-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Format date for display
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    return format(new Date(date), 'MMM d, yyyy');
  } catch {
    return 'Invalid date';
  }
}

// Format relative date
export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return 'Invalid date';
  }
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length).trimEnd() + '...';
}

// Get badge color for paper field
export function getFieldColor(field: string): string {
  const colors: Record<string, string> = {
    medical: 'bg-red-500/20 text-red-400 border-red-500/30',
    ai: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    stem: 'bg-green-500/20 text-green-400 border-green-500/30',
    neuroscience: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  return colors[field] || colors.other;
}

// Get badge color for research status
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    submitted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    under_review: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    accepted: 'bg-green-500/20 text-green-400 border-green-500/30',
    published: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  return colors[status] || colors.draft;
}

// Get badge color for announcement type
export function getAnnouncementTypeColor(type: string): string {
  const colors: Record<string, string> = {
    general: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    volunteer: 'bg-green-500/20 text-green-400 border-green-500/30',
    event: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    research: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return colors[type] || colors.general;
}

// Format status for display
export function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    in_progress: 'In Progress',
    under_review: 'Under Review',
    published: 'Published',
    accepted: 'Accepted',
    rejected: 'Rejected',
    submitted: 'Submitted',
    draft: 'Draft',
    pending: 'Pending',
    waitlisted: 'Waitlisted',
  };
  return labels[status] || status.replace('_', ' ');
}

// Format field for display
export function formatField(field: string): string {
  const labels: Record<string, string> = {
    medical: 'Medical',
    ai: 'AI & Technology',
    stem: 'STEM',
    neuroscience: 'Neuroscience',
    other: 'Other',
  };
  return labels[field] || field;
}

// Format announcement type
export function formatAnnouncementType(type: string): string {
  const labels: Record<string, string> = {
    general: 'General',
    volunteer: 'Volunteer',
    event: 'Event',
    research: 'Research',
    urgent: 'Urgent',
  };
  return labels[type] || type;
}

// Validate email
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate AX code format
export function isValidAccessCode(code: string): boolean {
  return /^AX-[A-Z0-9]{8}$/.test(code.toUpperCase().trim());
}

// Format number with commas
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

// Get role display name
export function formatRole(role: string): string {
  const labels: Record<string, string> = {
    alphanaut: 'Alphanaut',
    navigator: 'Navigator',
    'co-captain': 'Co-Captain',
    member: 'Member',
  };
  return labels[role] || role;
}

// Slugify text
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
