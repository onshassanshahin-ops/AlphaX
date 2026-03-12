import { notFound } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabaseAdmin } from '@/lib/supabase';
import { AnnouncementTypeBadge } from '@/components/ui/Badge';
import { formatDate, formatRelativeDate } from '@/lib/utils';
import { Calendar, Clock, Pin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await supabaseAdmin.from('announcements').select('title, content').eq('id', params.id).single();
  if (!data) return { title: 'Announcement Not Found' };
  return { title: data.title, description: data.content.slice(0, 160) };
}

export default async function AnnouncementDetailPage({ params }: Props) {
  const { data: announcement } = await supabaseAdmin
    .from('announcements')
    .select('*')
    .eq('id', params.id)
    .eq('is_published', true)
    .single();

  if (!announcement) notFound();

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      <main className="flex-1 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/announcements" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan transition-colors mb-8">
            <ArrowLeft size={16} />
            Back to Announcements
          </Link>

          <div className="glass-card rounded-2xl p-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <AnnouncementTypeBadge type={announcement.type} />
              {announcement.is_pinned && (
                <span className="flex items-center gap-1 text-xs text-gold">
                  <Pin size={11} /> Pinned
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold font-grotesk text-white mb-6 leading-tight">
              {announcement.title}
            </h1>

            <div className="flex items-center gap-6 text-sm text-slate-500 mb-8 pb-6 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                {formatDate(announcement.published_at || announcement.created_at)}
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} />
                {formatRelativeDate(announcement.published_at || announcement.created_at)}
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-slate-300 leading-relaxed text-base whitespace-pre-wrap">
                {announcement.content}
              </p>
            </div>

            {announcement.expires_at && (
              <div className="mt-8 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-400">
                  This announcement expires on {formatDate(announcement.expires_at)}.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
