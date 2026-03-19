import Link from 'next/link';
import { Download, ExternalLink, Calendar } from 'lucide-react';
import { FieldBadge } from '@/components/ui/Badge';
import { formatDate, formatNumber } from '@/lib/utils';
import type { Paper } from '@/types';
import { t, type PublicLang } from '@/lib/public-lang';

interface PapersGridProps {
  papers: Paper[];
  showViewAll?: boolean;
  columns?: 2 | 3;
  lang?: PublicLang;
}

export default function PapersGrid({ papers, showViewAll = false, columns = 3, lang = 'en' }: PapersGridProps) {
  if (!papers.length) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-4xl mb-3">📚</p>
        <p className="text-lg font-grotesk text-slate-400">{t(lang, 'No papers available yet', 'لا توجد أبحاث متاحة بعد')}</p>
        <p className="text-sm mt-1">{t(lang, 'Check back soon — our Knowledge Bridge team is hard at work.', 'عد لاحقًا — فريق جسر المعرفة يعمل بنشاط.')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`grid gap-6 ${columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {papers.map((paper) => (
          <PaperCard key={paper.id} paper={paper} lang={lang} />
        ))}
      </div>
      {showViewAll && (
        <div className="text-center mt-8">
          <Link
            href="/knowledge-bridge"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-cyan/30 text-cyan hover:bg-cyan/10 transition-colors font-semibold"
          >
            {t(lang, 'View All Papers', 'عرض كل الأبحاث')}
            <ExternalLink size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}

export function PaperCard({ paper, lang = 'en' }: { paper: Paper; lang?: PublicLang }) {
  const title = lang === 'ar' ? paper.title_ar : (paper.title_en || paper.title_ar);
  const secondaryTitle = lang === 'ar' ? paper.title_en : undefined;
  const description = lang === 'ar' ? paper.description_ar : (paper.description_en || paper.description_ar);
  return (
    <div className="content-card rounded-2xl p-6 flex flex-col gap-4 group">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {paper.field && <FieldBadge field={paper.field} />}
        </div>
        <div className="flex items-center gap-1 text-slate-500 text-xs shrink-0">
          <Download size={12} />
          <span>{formatNumber(paper.download_count)}</span>
        </div>
      </div>

      {/* Titles */}
      <div>
        <h3 className="font-bold text-white font-grotesk text-lg leading-snug mb-1 line-clamp-2" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          {title}
        </h3>
        {secondaryTitle && (
          <p className="text-sm text-slate-400 line-clamp-1">{secondaryTitle}</p>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          {description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar size={12} />
          {formatDate(paper.published_at || paper.created_at)}
        </div>
        <Link
          href={`/knowledge-bridge/${paper.id}`}
          className="flex items-center gap-1.5 text-sm text-cyan font-semibold hover:text-white transition-colors"
        >
          {t(lang, 'Read More', 'اقرأ المزيد')}
          <ExternalLink size={13} />
        </Link>
      </div>
    </div>
  );
}
