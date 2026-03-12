import Link from 'next/link';
import { Download, ExternalLink, Calendar } from 'lucide-react';
import { FieldBadge } from '@/components/ui/Badge';
import { formatDate, formatNumber } from '@/lib/utils';
import type { Paper } from '@/types';

interface PapersGridProps {
  papers: Paper[];
  showViewAll?: boolean;
  columns?: 2 | 3;
}

export default function PapersGrid({ papers, showViewAll = false, columns = 3 }: PapersGridProps) {
  if (!papers.length) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-4xl mb-3">📚</p>
        <p className="text-lg font-grotesk text-slate-400">No papers available yet</p>
        <p className="text-sm mt-1">Check back soon — our Knowledge Bridge team is hard at work.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`grid gap-6 ${columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {papers.map((paper) => (
          <PaperCard key={paper.id} paper={paper} />
        ))}
      </div>
      {showViewAll && (
        <div className="text-center mt-8">
          <Link
            href="/knowledge-bridge"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-cyan/30 text-cyan hover:bg-cyan/10 transition-colors font-semibold"
          >
            View All Papers
            <ExternalLink size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}

export function PaperCard({ paper }: { paper: Paper }) {
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
        <h3 className="font-bold text-white font-grotesk text-lg leading-snug mb-1 line-clamp-2" dir="rtl">
          {paper.title_ar}
        </h3>
        {paper.title_en && (
          <p className="text-sm text-slate-400 line-clamp-1">{paper.title_en}</p>
        )}
      </div>

      {/* Description */}
      {paper.description_ar && (
        <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed" dir="rtl">
          {paper.description_ar}
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
          Read More
          <ExternalLink size={13} />
        </Link>
      </div>
    </div>
  );
}
