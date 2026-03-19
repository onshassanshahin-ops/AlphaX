import Link from 'next/link';
import { Pin, Calendar, ExternalLink } from 'lucide-react';
import { AnnouncementTypeBadge } from '@/components/ui/Badge';
import { formatRelativeDate, truncate } from '@/lib/utils';
import type { Announcement } from '@/types';
import { cn } from '@/lib/utils';
import { t, type PublicLang } from '@/lib/public-lang';

interface AnnouncementCardProps {
  announcement: Announcement;
  compact?: boolean;
  lang?: PublicLang;
}

export default function AnnouncementCard({ announcement, compact = false, lang = 'en' }: AnnouncementCardProps) {
  const isUrgent = announcement.type === 'urgent';

  return (
    <div
      className={cn(
        'content-card rounded-2xl p-5 flex flex-col gap-3 group',
        announcement.is_pinned && 'pinned-announcement border-l-gold',
        isUrgent && 'border-red-500/30 bg-red-900/10'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <AnnouncementTypeBadge type={announcement.type} />
          {announcement.is_pinned && (
            <span className="flex items-center gap-1 text-xs text-gold">
              <Pin size={10} />
              {t(lang, 'Pinned', 'مثبّت')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
          <Calendar size={11} />
          {formatRelativeDate(announcement.published_at || announcement.created_at)}
        </div>
      </div>

      {/* Title */}
      <h3 className={cn(
        'font-bold font-grotesk text-white group-hover:text-cyan transition-colors leading-snug',
        compact ? 'text-base line-clamp-2' : 'text-lg'
      )}>
        {announcement.title}
      </h3>

      {/* Content */}
      {!compact && (
        <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
          {truncate(announcement.content, 250)}
        </p>
      )}

      {/* Footer */}
      <div className="mt-auto pt-2 border-t border-white/5">
        <Link
          href={`/announcements/${announcement.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-cyan font-semibold hover:text-white transition-colors"
        >
          {t(lang, 'Read More', 'اقرأ المزيد')}
          <ExternalLink size={13} />
        </Link>
      </div>
    </div>
  );
}

export function AnnouncementsGrid({
  announcements,
  showViewAll = false,
  lang = 'en',
}: {
  announcements: Announcement[];
  showViewAll?: boolean;
  lang?: PublicLang;
}) {
  if (!announcements.length) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-4xl mb-3">📢</p>
        <p className="text-lg font-grotesk text-slate-400">{t(lang, 'No announcements yet', 'لا توجد إعلانات حتى الآن')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {announcements.map((a) => (
          <AnnouncementCard key={a.id} announcement={a} lang={lang} />
        ))}
      </div>
      {showViewAll && (
        <div className="text-center mt-6">
          <Link
            href="/announcements"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-cyan/30 text-cyan hover:bg-cyan/10 transition-colors font-semibold"
          >
            {t(lang, 'View All Announcements', 'عرض كل الإعلانات')}
            <ExternalLink size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
