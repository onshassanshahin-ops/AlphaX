import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AnnouncementCard from '@/components/public/AnnouncementCard';
import { supabaseAdmin } from '@/lib/supabase';
import { getPublicLang } from '@/lib/public-lang.server';
import { t } from '@/lib/public-lang';
import type { Announcement } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getAnnouncements() {
  const { data } = await supabaseAdmin
    .from('announcements')
    .select('*')
    .eq('is_published', true)
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false });
  return data || [];
}

export default async function AnnouncementsPage() {
  const lang = getPublicLang();
  const announcements = await getAnnouncements();

  const pinned = announcements.filter((a: Announcement) => a.is_pinned);
  const regular = announcements.filter((a: Announcement) => !a.is_pinned);

  return (
    <div className="min-h-screen flex flex-col bg-bg" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <span className="text-gold text-sm font-semibold uppercase tracking-widest">{t(lang, 'Updates', 'تحديثات')}</span>
            <h1 className="text-4xl sm:text-5xl font-bold font-grotesk text-white mt-3 mb-4">
              {t(lang, 'Announcements', 'الإعلانات')}
            </h1>
            <p className="text-slate-400 text-lg">
              {t(lang, 'Stay up to date with the latest news, events, and opportunities from AlphaX.', 'ابقَ على اطلاع بآخر الأخبار والفعاليات والفرص من AlphaX.')}
            </p>
          </div>
        </div>
      </section>

      <section className="flex-1 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Pinned */}
          {pinned.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-gold uppercase tracking-widest mb-5 flex items-center gap-2">
                📌 {t(lang, 'Pinned', 'مثبّت')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pinned.map((a: Announcement) => (
                  <AnnouncementCard key={a.id} announcement={a} lang={lang} />
                ))}
              </div>
            </div>
          )}

          {/* Regular */}
          {regular.length > 0 ? (
            <div>
              {pinned.length > 0 && (
                <h2 className="text-lg font-semibold text-slate-400 uppercase tracking-widest mb-5">
                  {t(lang, 'All Announcements', 'كل الإعلانات')}
                </h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regular.map((a: Announcement) => (
                  <AnnouncementCard key={a.id} announcement={a} lang={lang} />
                ))}
              </div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">📢</p>
              <p className="text-xl font-grotesk text-slate-400">{t(lang, 'No announcements yet', 'لا توجد إعلانات حتى الآن')}</p>
            </div>
          ) : null}
        </div>
      </section>

      <Footer lang={lang} />
    </div>
  );
}
