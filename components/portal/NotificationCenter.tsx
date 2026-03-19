'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CalendarClock, CheckCircle2, Megaphone, ClipboardList } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';

type Kind = 'deadline' | 'approval' | 'announcement' | 'assignment';

interface Item {
  id: string;
  kind: Kind;
  title: string;
  message: string;
  created_at: string;
  href?: string;
}

const kindIcon: Record<Kind, React.ElementType> = {
  deadline: CalendarClock,
  approval: CheckCircle2,
  announcement: Megaphone,
  assignment: ClipboardList,
};

const kindColor: Record<Kind, string> = {
  deadline: '#FFB020',
  approval: '#22c55e',
  announcement: '#00B4D8',
  assignment: '#9B59B6',
};

export default function NotificationCenter() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => (r.ok ? r.json() : { notifications: [] }))
      .then((d) => setItems(d.notifications || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div id="notifications" className="glass-card rounded-2xl p-6 border border-cyan/10">
      <h3 className="font-bold font-grotesk text-white mb-4 flex items-center gap-2">
        <Bell size={18} className="text-cyan" />
        Notification Center
      </h3>
      {loading ? (
        <p className="text-slate-500 text-sm">Loading notifications...</p>
      ) : items.length === 0 ? (
        <p className="text-slate-500 text-sm">No new notifications</p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 8).map((n) => {
            const Icon = kindIcon[n.kind];
            return (
              <div key={n.id} className="p-3 rounded-xl bg-dark/50 border border-white/5 flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${kindColor[n.kind]}20`, border: `1px solid ${kindColor[n.kind]}40` }}
                >
                  <Icon size={14} style={{ color: kindColor[n.kind] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-600 mt-1">{formatRelativeDate(n.created_at)}</p>
                </div>
                {n.href && (
                  <Link href={n.href} className="text-xs text-cyan hover:text-white transition-colors shrink-0">
                    Open
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
