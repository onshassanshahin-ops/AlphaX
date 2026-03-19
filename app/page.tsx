import { Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/public/HeroSection';
import type { HeroSettings } from '@/components/public/HeroSection';
import StatsCounter from '@/components/public/StatsCounter';
import PapersGrid from '@/components/public/PapersGrid';
import ResearchGrid from '@/components/public/ResearchGrid';
import { AnnouncementsGrid } from '@/components/public/AnnouncementCard';
import { supabaseAdmin } from '@/lib/supabase';
import { getPublicLang } from '@/lib/public-lang.server';
import { t } from '@/lib/public-lang';
import Link from 'next/link';
import { ArrowRight, Globe, Microscope, GraduationCap } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getHomeData() {
  const [announcementsRes, papersRes, researchRes, settingsRes] = await Promise.all([
    supabaseAdmin
      .from('announcements')
      .select('*')
      .eq('is_published', true)
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(3),
    supabaseAdmin
      .from('papers')
      .select('id, title_ar, title_en, original_authors, description_ar, field, download_count, published_at, created_at, status')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3),
    supabaseAdmin
      .from('research_projects')
      .select(`
        id, title, abstract, field, block_slug, status, journal, published_at, created_at, is_public,
        authors:research_authors (
          author_order,
          alphanaut:alphanaut_id (id, name)
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(3),
    supabaseAdmin.from('site_settings').select('key, value').in('key', ['hero']),
  ]);

  // Get stats
  const [alphanauts, papers, research] = await Promise.all([
    supabaseAdmin.from('alphanauts').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin.from('papers').select('id, download_count').eq('status', 'published'),
    supabaseAdmin.from('research_projects').select('id', { count: 'exact', head: true }),
  ]);

  const totalDownloads = (papers.data || []).reduce((sum, p) => sum + (p.download_count || 0), 0);
  void totalDownloads;

  const heroRow = (settingsRes.data || []).find((r) => r.key === 'hero');
  const heroSettings: HeroSettings = heroRow?.value ?? {};

  return {
    announcements: announcementsRes.data || [],
    papers: papersRes.data || [],
    research: researchRes.data || [],
    heroSettings,
    stats: {
      papers_translated: papers.count || 0,
      members: alphanauts.count || 0,
      publications: research.count || 0,
      tools: 3,
    },
  };
}

const pillars = [
  {
    icon: <Globe size={32} />,
    number: '01',
    title: 'Translation & Access',
    subtitle: 'Knowledge Bridge',
    description:
      'We translate high-impact global research papers from English into Arabic, making cutting-edge science accessible to Arabic-speaking researchers and students.',
    color: '#00B4D8',
    href: '/knowledge-bridge',
    tags: ['Research Papers', 'Arabic Translation', 'Open Access'],
  },
  {
    icon: <Microscope size={32} />,
    number: '02',
    title: 'Research & Innovation',
    subtitle: 'Original Research',
    description:
      'AlphaX researchers conduct and publish original research in international journals — from medical AI to neuroscience and STEM fields.',
    color: '#9B59B6',
    href: '/research',
    tags: ['Publications', 'Med-AI', 'Neuroscience'],
  },
  {
    icon: <GraduationCap size={32} />,
    number: '03',
    title: 'Training & Capacity Building',
    subtitle: 'Growing Researchers',
    description:
      'Through structured training, mentorship, and hands-on projects, we develop the scientific capabilities of Syrian researchers.',
    color: '#FF6B35',
    href: '/orientation',
    tags: ['Workshops', 'Mentorship', 'Skills Development'],
  },
];

export default async function HomePage() {
  const lang = getPublicLang();
  const { announcements, papers, research, stats, heroSettings } = await getHomeData();

  return (
    <div className="min-h-screen flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Navbar />

      {/* Hero */}
      <HeroSection settings={heroSettings} lang={lang} />

      {/* Pillars */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-cyan text-sm font-semibold uppercase tracking-widest">
              {t(lang, 'Our Mission', 'رسالتنا')}
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold font-grotesk text-white mt-3 mb-4">
              {t(lang, 'Three Pillars of ', 'الركائز الثلاث لـ ')}
              <span className="text-gradient">AlphaX</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              {t(
                lang,
                'Everything we do is built on three foundational commitments to advancing Arab scientific knowledge.',
                'كل ما نقوم به مبني على ثلاثة التزامات أساسية لتطوير المعرفة العلمية العربية.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pillars.map((pillar) => (
              <Link key={pillar.number} href={pillar.href}>
                <div className="pillar-card h-full rounded-2xl p-8 bg-dark border border-white/5 hover:border-opacity-50 group relative overflow-hidden"
                  style={{ '--hover-color': pillar.color } as React.CSSProperties}
                >
                  {/* Hover background */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${pillar.color}, transparent 70%)` }}
                  />

                  {/* Number */}
                  <div
                    className="text-6xl font-black font-grotesk opacity-10 mb-4 leading-none"
                    style={{ color: pillar.color }}
                  >
                    {pillar.number}
                  </div>

                  {/* Icon */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300"
                    style={{ backgroundColor: `${pillar.color}15`, color: pillar.color, border: `1px solid ${pillar.color}30` }}
                  >
                    {pillar.icon}
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                    style={{ color: pillar.color }}>
                    {pillar.subtitle}
                  </p>
                  <h3 className="text-2xl font-bold font-grotesk text-white mb-4">
                    {pillar.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed mb-6">{pillar.description}</p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {pillar.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-3 py-1 rounded-full border"
                        style={{
                          backgroundColor: `${pillar.color}10`,
                          color: pillar.color,
                          borderColor: `${pillar.color}30`,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div
                    className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all duration-300"
                    style={{ color: pillar.color }}
                  >
                    Explore
                    {lang === 'ar' ? ' استكشف' : ''}
                    <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <StatsCounter stats={stats} lang={lang} />

      {/* Announcements */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-bg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="text-gold text-sm font-semibold uppercase tracking-widest">Latest</span>
              <h2 className="text-3xl sm:text-4xl font-bold font-grotesk text-white mt-1">
                {t(lang, 'Announcements', 'الإعلانات')}
              </h2>
            </div>
            <Link
              href="/announcements"
              className="hidden sm:flex items-center gap-2 text-sm text-cyan font-semibold hover:text-white transition-colors"
            >
              {t(lang, 'View All', 'عرض الكل')}
              <ArrowRight size={16} />
            </Link>
          </div>
          <AnnouncementsGrid announcements={announcements} showViewAll={false} lang={lang} />
          <div className="sm:hidden mt-6 text-center">
            <Link href="/announcements" className="text-cyan font-semibold text-sm">
              {t(lang, 'View All Announcements →', 'عرض كل الإعلانات ←')}
            </Link>
          </div>
        </div>
      </section>

      {/* Papers */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-dark/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="text-cyan text-sm font-semibold uppercase tracking-widest">Knowledge Bridge</span>
              <h2 className="text-3xl sm:text-4xl font-bold font-grotesk text-white mt-1">
                {t(lang, 'Latest Translations', 'أحدث الترجمات')}
              </h2>
            </div>
            <Link
              href="/knowledge-bridge"
              className="hidden sm:flex items-center gap-2 text-sm text-cyan font-semibold hover:text-white transition-colors"
            >
              {t(lang, 'Browse All', 'تصفح الكل')}
              <ArrowRight size={16} />
            </Link>
          </div>
          <Suspense fallback={<div className="text-slate-500 text-center py-12">Loading papers...</div>}>
            <PapersGrid papers={papers as any[]} showViewAll={true} lang={lang} />
          </Suspense>
        </div>
      </section>

      {/* Research */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-bg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="text-purple text-sm font-semibold uppercase tracking-widest">Research</span>
              <h2 className="text-3xl sm:text-4xl font-bold font-grotesk text-white mt-1">
                {t(lang, 'Latest Publications', 'أحدث المنشورات')}
              </h2>
            </div>
            <Link
              href="/research"
              className="hidden sm:flex items-center gap-2 text-sm text-cyan font-semibold hover:text-white transition-colors"
            >
              {t(lang, 'View All', 'عرض الكل')}
              <ArrowRight size={16} />
            </Link>
          </div>
          <ResearchGrid projects={research as any[]} showViewAll={true} />
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy/40 via-bg to-dark pointer-events-none" />
        <div className="absolute inset-0 hero-grid opacity-20 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <span className="text-gold text-sm font-semibold uppercase tracking-widest">{t(lang, 'Join the Movement', 'انضم إلى الحركة')}</span>
          <h2 className="text-4xl sm:text-5xl font-bold font-grotesk text-white mt-4 mb-6">
            {t(lang, 'Become an ', 'كن ')}
            <span className="text-gradient">Alphanaut</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t(
              lang,
              "Whether you're a researcher, designer, developer, or communicator — there's a place for you in AlphaX. Join us in building the future of Arab science.",
              'سواء كنت باحثًا أو مصممًا أو مطورًا أو صانع محتوى، فمكانك موجود في AlphaX. انضم إلينا لصناعة مستقبل العلم العربي.'
            )}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/join"
              className="btn-primary flex items-center gap-2 text-base px-8 py-4"
            >
              {t(lang, 'Apply Now', 'قدّم الآن')}
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/orientation"
              className="px-8 py-4 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:border-white/30 transition-all font-semibold"
            >
              {t(lang, 'Read Orientation Manual', 'اقرأ الدليل التعريفي')}
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { icon: '📚', label: 'Knowledge Bridge' },
              { icon: '🏥', label: 'Asclepius Lab' },
              { icon: '🧠', label: 'Neuroscience' },
              { icon: '🎨', label: 'Creative Lab' },
            ].map((item) => (
              <div key={item.label} className="glass-card rounded-xl p-4">
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="text-xs text-slate-400 font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer lang={lang} />
    </div>
  );
}
