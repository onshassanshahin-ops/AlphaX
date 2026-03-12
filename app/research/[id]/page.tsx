import { notFound } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabaseAdmin } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';
import { Calendar, Users, BookOpen, Link2, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await supabaseAdmin
    .from('research_projects')
    .select('title, abstract')
    .eq('id', params.id)
    .single();
  if (!data) return { title: 'Research Not Found' };
  return { title: data.title, description: data.abstract?.slice(0, 160) };
}

export default async function ResearchDetailPage({ params }: Props) {
  const { data: project, error } = await supabaseAdmin
    .from('research_projects')
    .select(`
      *,
      authors:research_authors (
        author_order,
        alphanaut:alphanaut_id (id, name, role, bio, university)
      ),
      block:block_slug (id, slug, name, color, icon)
    `)
    .eq('id', params.id)
    .eq('is_public', true)
    .single();

  if (error || !project) notFound();

  const sortedAuthors = (project.authors || []).sort(
    (a: { author_order: number }, b: { author_order: number }) => a.author_order - b.author_order
  );

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />

      <main className="flex-1 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/research"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Back to Research
          </Link>

          <div className="glass-card rounded-2xl p-8 mb-8">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <StatusBadge status={project.status} />
              {project.field && (
                <span className="text-xs text-slate-500 uppercase tracking-wide">
                  {project.field}
                </span>
              )}
              {project.block && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium border"
                  style={{
                    backgroundColor: `${project.block.color}20`,
                    color: project.block.color,
                    borderColor: `${project.block.color}40`,
                  }}
                >
                  {project.block.icon} {project.block.name}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold font-grotesk text-white mb-8 leading-tight">
              {project.title}
            </h1>

            {/* Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-dark/50 rounded-xl border border-white/5 mb-8">
              <div className="flex items-start gap-2">
                <Calendar size={16} className="text-cyan shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Date</p>
                  <p className="text-sm text-slate-300">
                    {formatDate(project.published_at || project.created_at)}
                  </p>
                </div>
              </div>
              {project.journal && (
                <div className="flex items-start gap-2">
                  <BookOpen size={16} className="text-cyan shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Journal</p>
                    <p className="text-sm text-slate-300 italic">{project.journal}</p>
                  </div>
                </div>
              )}
              {project.doi && (
                <div className="flex items-start gap-2">
                  <Link2 size={16} className="text-cyan shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">DOI</p>
                    <a
                      href={`https://doi.org/${project.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-cyan hover:text-white transition-colors"
                    >
                      {project.doi}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Abstract */}
            {project.abstract && (
              <div className="mb-8">
                <h2 className="text-xl font-bold font-grotesk text-white mb-4">Abstract</h2>
                <div className="bg-dark/30 rounded-xl p-6 border border-white/5">
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {project.abstract}
                  </p>
                </div>
              </div>
            )}

            {/* Authors */}
            {sortedAuthors.length > 0 && (
              <div>
                <h2 className="text-xl font-bold font-grotesk text-white mb-4 flex items-center gap-2">
                  <Users size={20} className="text-cyan" />
                  Authors
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sortedAuthors.map((ra: { alphanaut?: { id: string; name?: string; role?: string; bio?: string; university?: string } }) => (
                    ra.alphanaut && (
                      <div
                        key={ra.alphanaut.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-dark/50 border border-white/5"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-navy to-cyan/20 flex items-center justify-center text-white font-bold font-grotesk shrink-0">
                          {ra.alphanaut.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{ra.alphanaut.name}</p>
                          {ra.alphanaut.university && (
                            <p className="text-xs text-slate-500">{ra.alphanaut.university}</p>
                          )}
                          {ra.alphanaut.role && (
                            <p className="text-xs text-cyan capitalize">{ra.alphanaut.role}</p>
                          )}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
