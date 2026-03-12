import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ResearchCard } from '@/components/public/ResearchGrid';
import { supabaseAdmin } from '@/lib/supabase';
import { StatusBadge } from '@/components/ui/Badge';
import type { ResearchProject } from '@/types';

const STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'published', label: 'Published' },
];

async function getResearch() {
  const { data, error } = await supabaseAdmin
    .from('research_projects')
    .select(`
      *,
      authors:research_authors (
        author_order,
        alphanaut:alphanaut_id (id, name, role)
      ),
      block:block_slug (id, slug, name, color, icon)
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  return data || [];
}

export default async function ResearchPage() {
  const projects = await getResearch();

  const byStatus = projects.reduce((acc: Record<string, ResearchProject[]>, p: ResearchProject) => {
    if (!acc[p.status]) acc[p.status] = [];
    acc[p.status].push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple/10 to-transparent pointer-events-none" />
        <div className="absolute inset-0 hero-grid opacity-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple/20 border border-purple/30 flex items-center justify-center text-xl">
                🔬
              </div>
              <span className="text-purple text-sm font-semibold uppercase tracking-widest">
                Research & Innovation
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold font-grotesk text-white mb-4">
              Original Research
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              AlphaX researchers are actively publishing original work in international journals —
              from medical AI and neuroscience to STEM fields.
            </p>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section className="px-4 sm:px-6 lg:px-8 pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Projects', value: projects.length, color: '#00B4D8' },
              { label: 'Published', value: byStatus['published']?.length || 0, color: '#10B981' },
              { label: 'In Review', value: (byStatus['under_review']?.length || 0) + (byStatus['submitted']?.length || 0), color: '#F59E0B' },
              { label: 'In Progress', value: byStatus['in_progress']?.length || 0, color: '#9B59B6' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass-card rounded-xl p-5 text-center"
              >
                <p
                  className="text-3xl font-bold font-grotesk mb-1"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="flex-1 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          {projects.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🔬</p>
              <p className="text-xl font-grotesk text-slate-400 mb-2">No public research yet</p>
              <p className="text-sm text-slate-500">
                Our research teams are actively working on exciting projects.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ResearchCard key={project.id} project={project as ResearchProject} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
