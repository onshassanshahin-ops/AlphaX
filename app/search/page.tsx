import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabaseAdmin } from '@/lib/supabase';
import { Search, FileText, FlaskConical, Bell, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  type: 'paper' | 'research' | 'announcement';
  href: string;
  tag?: string;
}

async function runSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const q = query.trim();

  const [papers, research, announcements] = await Promise.all([
    supabaseAdmin
      .from('papers')
      .select('id, title_ar, title_en, description_ar, field')
      .eq('status', 'published')
      .or(`title_ar.ilike.%${q}%,title_en.ilike.%${q}%,description_ar.ilike.%${q}%`)
      .limit(8),
    supabaseAdmin
      .from('research_projects')
      .select('id, title, abstract, field')
      .eq('is_public', true)
      .or(`title.ilike.%${q}%,abstract.ilike.%${q}%`)
      .limit(8),
    supabaseAdmin
      .from('announcements')
      .select('id, title, content, type')
      .eq('is_published', true)
      .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
      .limit(6),
  ]);

  const results: SearchResult[] = [];

  (papers.data || []).forEach(p => {
    results.push({
      id: p.id,
      title: p.title_ar || p.title_en || '',
      excerpt: p.description_ar?.slice(0, 120) || '',
      type: 'paper',
      href: `/knowledge-bridge/${p.id}`,
      tag: p.field,
    });
  });

  (research.data || []).forEach(r => {
    results.push({
      id: r.id,
      title: r.title,
      excerpt: r.abstract?.slice(0, 120) || '',
      type: 'research',
      href: `/research/${r.id}`,
      tag: r.field,
    });
  });

  (announcements.data || []).forEach(a => {
    results.push({
      id: a.id,
      title: a.title,
      excerpt: a.content?.slice(0, 120) || '',
      type: 'announcement',
      href: `/announcements/${a.id}`,
      tag: a.type,
    });
  });

  return results;
}

const typeConfig = {
  paper: { label: 'Paper', icon: FileText, color: '#00B4D8' },
  research: { label: 'Research', icon: FlaskConical, color: '#9B59B6' },
  announcement: { label: 'Announcement', icon: Bell, color: '#FFD700' },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q || '';
  const results = await runSearch(query);

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />

      <section className="pt-24 pb-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 hero-grid opacity-10 pointer-events-none" />
        <div className="max-w-3xl mx-auto relative">
          <h1 className="text-4xl font-bold font-grotesk text-white mb-8 text-center">
            Search <span className="text-gradient">AlphaX</span>
          </h1>

          <form method="GET" action="/search" className="relative">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search papers, research, announcements..."
              autoFocus
              className="w-full form-input rounded-2xl pl-14 pr-5 py-4 text-base border border-cyan/20 bg-dark/80 focus:border-cyan/50 outline-none transition-colors"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan to-teal text-white text-sm font-semibold hover:-translate-y-[55%] transition-transform"
            >
              Search
            </button>
          </form>

          {!query && (
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {['AI', 'Neuroscience', 'Medical', 'STEM', 'Research', 'Recruitment'].map(term => (
                <a key={term} href={`/search?q=${term}`}
                  className="px-3 py-1.5 rounded-full text-xs text-slate-400 border border-white/10 hover:border-cyan/30 hover:text-cyan transition-colors">
                  {term}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20 flex-1">
        <div className="max-w-3xl mx-auto">
          {query && (
            <p className="text-sm text-slate-500 mb-6">
              {results.length === 0
                ? `No results for "${query}"`
                : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
            </p>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              {results.map(result => {
                const cfg = typeConfig[result.type];
                const Icon = cfg.icon;
                return (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={result.href}
                    className="glass-card rounded-2xl p-5 flex gap-4 items-start hover:border-cyan/20 border border-white/5 transition-all hover:-translate-y-0.5 group"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cfg.color}15`, border: `1px solid ${cfg.color}25` }}>
                      <Icon size={18} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}>
                          {cfg.label}
                        </span>
                        {result.tag && (
                          <span className="text-xs text-slate-600 capitalize">{result.tag}</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-white group-hover:text-cyan transition-colors mb-1 line-clamp-1">
                        {result.title}
                      </h3>
                      {result.excerpt && (
                        <p className="text-sm text-slate-500 line-clamp-2">{result.excerpt}</p>
                      )}
                    </div>
                    <ArrowRight size={16} className="text-slate-600 group-hover:text-cyan transition-colors shrink-0 mt-1" />
                  </Link>
                );
              })}
            </div>
          )}

          {query && results.length === 0 && (
            <div className="text-center py-20">
              <Search size={48} className="text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 font-semibold mb-2">Nothing found</p>
              <p className="text-slate-600 text-sm">Try different keywords or browse the sections directly.</p>
              <div className="flex flex-wrap gap-3 justify-center mt-8">
                <Link href="/knowledge-bridge" className="text-sm text-cyan hover:text-white border border-cyan/20 px-4 py-2 rounded-lg transition-colors">Browse Papers</Link>
                <Link href="/research" className="text-sm text-cyan hover:text-white border border-cyan/20 px-4 py-2 rounded-lg transition-colors">Browse Research</Link>
                <Link href="/announcements" className="text-sm text-cyan hover:text-white border border-cyan/20 px-4 py-2 rounded-lg transition-colors">See Announcements</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
