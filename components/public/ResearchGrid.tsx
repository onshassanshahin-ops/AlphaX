import Link from 'next/link';
import { ExternalLink, Users, BookOpen } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate, truncate } from '@/lib/utils';
import type { ResearchProject } from '@/types';

interface ResearchGridProps {
  projects: ResearchProject[];
  showViewAll?: boolean;
  columns?: 2 | 3;
}

export default function ResearchGrid({ projects, showViewAll = false, columns = 3 }: ResearchGridProps) {
  if (!projects.length) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-4xl mb-3">🔬</p>
        <p className="text-lg font-grotesk text-slate-400">No research projects yet</p>
        <p className="text-sm mt-1">Our research teams are actively working on exciting projects.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`grid gap-6 ${columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {projects.map((project) => (
          <ResearchCard key={project.id} project={project} />
        ))}
      </div>
      {showViewAll && (
        <div className="text-center mt-8">
          <Link
            href="/research"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-cyan/30 text-cyan hover:bg-cyan/10 transition-colors font-semibold"
          >
            View All Research
            <ExternalLink size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}

export function ResearchCard({ project }: { project: ResearchProject }) {
  const blockColors: Record<string, string> = {
    'asclepius-lab': 'border-teal/30 hover:border-teal/60',
    neuroscience: 'border-purple/30 hover:border-purple/60',
    default: 'border-cyan/15 hover:border-cyan/40',
  };

  const borderClass = project.block_slug
    ? (blockColors[project.block_slug] || blockColors.default)
    : blockColors.default;

  return (
    <div className={`content-card rounded-2xl p-6 flex flex-col gap-4 group border ${borderClass}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <StatusBadge status={project.status} />
        {project.field && (
          <span className="text-xs text-slate-500 uppercase tracking-wide">{project.field}</span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-white font-grotesk text-lg leading-snug line-clamp-2">
        {project.title}
      </h3>

      {/* Abstract */}
      {project.abstract && (
        <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
          {truncate(project.abstract, 200)}
        </p>
      )}

      {/* Authors */}
      {project.authors && project.authors.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Users size={14} />
          <span className="line-clamp-1">
            {project.authors
              .sort((a, b) => a.author_order - b.author_order)
              .map((a) => a.alphanaut?.name)
              .filter(Boolean)
              .join(', ')}
          </span>
        </div>
      )}

      {/* Journal */}
      {project.journal && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <BookOpen size={12} />
          <span className="italic">{project.journal}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
        <span className="text-xs text-slate-500">
          {formatDate(project.published_at || project.created_at)}
        </span>
        <Link
          href={`/research/${project.id}`}
          className="flex items-center gap-1.5 text-sm text-cyan font-semibold hover:text-white transition-colors"
        >
          Details
          <ExternalLink size={13} />
        </Link>
      </div>
    </div>
  );
}
