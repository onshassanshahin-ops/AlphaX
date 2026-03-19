'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { PaperCard } from '@/components/public/PapersGrid';
import { Search, Filter, BookOpen, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Paper } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { normalizePublicLang, t, type PublicLang } from '@/lib/public-lang';

const FIELDS = [
  { value: 'all', label: 'All Fields' },
  { value: 'medical', label: 'Medical' },
  { value: 'ai', label: 'AI & Technology' },
  { value: 'stem', label: 'STEM' },
  { value: 'neuroscience', label: 'Neuroscience' },
  { value: 'other', label: 'Other' },
];

const LIMIT = 12;

export default function KnowledgeBridgePage() {
  const [lang, setLang] = useState<PublicLang>('en');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [field, setField] = useState('all');

  const fetchPapers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: LIMIT.toString(),
        offset: (page * LIMIT).toString(),
        field,
      });
      if (search) params.set('search', search);

      const res = await fetch(`/api/papers?${params}`);
      const data = await res.json();
      setPapers(data.papers || []);
      setTotal(data.total || data.papers?.length || 0);
    } catch {
      setPapers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, field]);

  useEffect(() => {
    const fromCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('public_lang='))
      ?.split('=')[1];
    setLang(normalizePublicLang(fromCookie));
  }, []);

  useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen flex flex-col bg-bg" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-navy/30 to-transparent pointer-events-none" />
        <div className="absolute inset-0 hero-grid opacity-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan/20 border border-cyan/30 flex items-center justify-center text-xl">
                📚
              </div>
              <span className="text-cyan text-sm font-semibold uppercase tracking-widest">
                {t(lang, 'Knowledge Bridge', 'جسر المعرفة')}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold font-grotesk text-white mb-4">
              {t(lang, 'Research in Arabic', 'أبحاث باللغة العربية')}
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              {t(
                lang,
                "We translate the world's most impactful research papers into Arabic — making global science accessible to every Arabic-speaking researcher and student.",
                'نترجم أكثر الأوراق البحثية تأثيرًا في العالم إلى العربية، لنُتيح العلم العالمي لكل باحث وطالب ناطق بالعربية.'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Search + Filters */}
      <section className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder={t(lang, 'Search papers by title or keyword...', 'ابحث عن الأبحاث حسب العنوان أو الكلمات المفتاحية...')}
                    className="w-full form-input rounded-xl pl-11 pr-4 py-3 text-sm border border-cyan/20 bg-dark/80"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
              </form>

              {/* Field filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter size={16} className="text-slate-500 shrink-0" />
                <div className="flex gap-2 flex-wrap">
                  {FIELDS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => { setField(f.value); setPage(0); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        field === f.value
                          ? 'bg-cyan/20 text-cyan border-cyan/40'
                          : 'bg-transparent text-slate-400 border-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {lang === 'ar'
                        ? ({
                            all: 'كل المجالات',
                            medical: 'الطب',
                            ai: 'الذكاء الاصطناعي والتقنية',
                            stem: 'العلوم والتقنية والهندسة والرياضيات',
                            neuroscience: 'علوم الأعصاب',
                            other: 'أخرى',
                          }[f.value] || f.label)
                        : f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Papers Grid */}
      <section className="flex-1 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Count */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <BookOpen size={16} />
              {loading
                ? t(lang, 'Loading...', 'جاري التحميل...')
                : lang === 'ar'
                  ? `تم العثور على ${papers.length} بحث`
                  : `${papers.length} paper${papers.length !== 1 ? 's' : ''} found`}
            </div>
            {search && (
              <button
                onClick={() => { setSearch(''); setSearchInput(''); setPage(0); }}
                className="text-xs text-slate-500 hover:text-cyan transition-colors"
              >
                {t(lang, 'Clear search ×', 'مسح البحث ×')}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : papers.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">📭</p>
              <p className="text-xl font-grotesk text-slate-400 mb-2">{t(lang, 'No papers found', 'لم يتم العثور على أبحاث')}</p>
              <p className="text-sm text-slate-500">
                {search
                  ? t(lang, 'Try adjusting your search terms.', 'جرّب تعديل كلمات البحث.')
                  : t(lang, 'Our team is actively working on translations.', 'فريقنا يعمل حاليًا على المزيد من الترجمات.')}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {papers.map((paper) => (
                  <PaperCard key={paper.id} paper={paper} lang={lang} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`w-10 h-10 rounded-xl text-sm font-semibold border transition-all ${
                        page === i
                          ? 'bg-cyan/20 text-cyan border-cyan/40'
                          : 'border-white/10 text-slate-400 hover:text-white hover:border-white/30'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer lang={lang} />
    </div>
  );
}
