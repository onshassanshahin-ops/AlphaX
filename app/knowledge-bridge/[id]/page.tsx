import { notFound } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabaseAdmin } from '@/lib/supabase';
import { formatDate, formatField } from '@/lib/utils';
import { FieldBadge } from '@/components/ui/Badge';
import { Download, Calendar, User, Tag, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublicLang } from '@/lib/public-lang.server';
import { t } from '@/lib/public-lang';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: paper } = await supabaseAdmin
    .from('papers')
    .select('title_ar, title_en, description_en')
    .eq('id', params.id)
    .single();

  if (!paper) return { title: 'Paper Not Found' };

  return {
    title: paper.title_en || paper.title_ar,
    description: paper.description_en || undefined,
  };
}

async function getPaper(id: string) {
  const { data, error } = await supabaseAdmin
    .from('papers')
    .select(`
      *,
      submitter:submitted_by (id, name, role)
    `)
    .eq('id', id)
    .eq('status', 'published')
    .single();

  return { paper: data, error };
}

export default async function PaperDetailPage({ params }: Props) {
  const lang = getPublicLang();
  const { paper } = await getPaper(params.id);

  if (!paper) notFound();

  return (
    <div className="min-h-screen flex flex-col bg-bg" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="flex-1 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back */}
          <Link
            href="/knowledge-bridge"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            {t(lang, 'Back to Knowledge Bridge', 'العودة إلى جسر المعرفة')}
          </Link>

          {/* Paper Card */}
          <div className="glass-card rounded-2xl p-8 mb-8">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              {paper.field && <FieldBadge field={paper.field} />}
            </div>

            {/* Arabic Title */}
            <h1
              className="text-3xl sm:text-4xl font-bold font-grotesk text-white mb-3 leading-tight"
              dir="rtl"
            >
              {paper.title_ar}
            </h1>

            {/* English Title */}
            {paper.title_en && (
              <p className="text-xl text-slate-400 mb-6">{paper.title_en}</p>
            )}

            {/* Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-dark/50 rounded-xl border border-white/5 mb-8">
              {paper.original_authors && (
                <div className="flex items-start gap-2">
                  <User size={16} className="text-cyan shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">
                      {t(lang, 'Original Authors', 'المؤلفون الأصليون')}
                    </p>
                    <p className="text-sm text-slate-300">{paper.original_authors}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Calendar size={16} className="text-cyan shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">{t(lang, 'Published', 'تاريخ النشر')}</p>
                  <p className="text-sm text-slate-300">
                    {formatDate(paper.published_at || paper.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Download size={16} className="text-cyan shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">{t(lang, 'Downloads', 'عدد التحميلات')}</p>
                  <p className="text-sm text-slate-300">{paper.download_count.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Arabic Description */}
            {paper.description_ar && (
              <div className="mb-6">
                <h2 className="text-lg font-bold font-grotesk text-white mb-3" dir="rtl">
                  ملخص البحث
                </h2>
                <p
                  className="text-slate-300 leading-relaxed text-base bg-dark/30 rounded-xl p-5 border border-white/5"
                  dir="rtl"
                >
                  {paper.description_ar}
                </p>
              </div>
            )}

            {/* English Description */}
            {paper.description_en && (
              <div className="mb-6">
                <h2 className="text-lg font-bold font-grotesk text-white mb-3">
                  {t(lang, 'Abstract', 'الملخص')}
                </h2>
                <p className="text-slate-300 leading-relaxed bg-dark/30 rounded-xl p-5 border border-white/5">
                  {paper.description_en}
                </p>
              </div>
            )}

            {/* Tags */}
            {paper.tags && paper.tags.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag size={14} className="text-slate-500" />
                  {paper.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 rounded-full bg-white/5 text-slate-400 border border-white/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Download Button */}
            {paper.file_url && (
              <DownloadButton paperId={paper.id} fileUrl={paper.file_url} lang={lang} />
            )}
          </div>

          {/* PDF Viewer */}
          {paper.file_url && (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h3 className="font-semibold text-white font-grotesk">PDF Preview</h3>
                <a
                  href={paper.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-cyan hover:text-white transition-colors"
                >
                  Open in New Tab
                  <ExternalLink size={14} />
                </a>
              </div>
              <iframe
                src={`${paper.file_url}#toolbar=1&navpanes=0`}
                className="w-full"
                style={{ height: '700px' }}
                title={paper.title_en || paper.title_ar}
              />
            </div>
          )}
        </div>
      </main>

      <Footer lang={lang} />
    </div>
  );
}

// Client component for download tracking
function DownloadButton({ paperId, fileUrl, lang }: { paperId: string; fileUrl: string; lang: 'en' | 'ar' }) {
  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={async () => {
        await fetch(`/api/papers/${paperId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'download' }),
        });
      }}
      className="btn-primary inline-flex items-center gap-2 text-base px-6 py-3"
      download
    >
      <Download size={18} />
      {t(lang, 'Download Paper (PDF)', 'تحميل البحث (PDF)')}
    </a>
  );
}
