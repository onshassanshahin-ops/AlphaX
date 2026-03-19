import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabaseAdmin } from '@/lib/supabase';
import { Globe2, BookOpen, FlaskConical, Users, TrendingUp, ShieldCheck } from 'lucide-react';

async function getImpactData() {
  const [membersRes, papersRes, researchRes, tasksRes, suggestionsRes, announcementsRes] =
    await Promise.all([
      supabaseAdmin.from('alphanauts').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('papers').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabaseAdmin
        .from('research_projects')
        .select('id', { count: 'exact', head: true })
        .in('status', ['accepted', 'published']),
      supabaseAdmin.from('block_tasks').select('id, status').limit(5000),
      supabaseAdmin
        .from('block_suggestions')
        .select('id, status')
        .in('status', ['approved', 'implemented'])
        .limit(5000),
      supabaseAdmin
        .from('announcements')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true),
    ]);

  const tasks = tasksRes.data || [];
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return {
    members: membersRes.count || 0,
    translatedPapers: papersRes.count || 0,
    publishedResearch: researchRes.count || 0,
    completedTasks,
    completionRate,
    approvedIdeas: (suggestionsRes.data || []).length,
    publishedAnnouncements: announcementsRes.count || 0,
  };
}

export default async function ImpactPage() {
  const impact = await getImpactData();

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      <main className="flex-1 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-10">
          <section className="relative overflow-hidden rounded-3xl p-8 border border-cyan/20 bg-gradient-to-r from-[#0b1f2b] via-dark to-[#1a2030]">
            <div className="absolute -right-16 -top-14 w-72 h-72 rounded-full bg-cyan/10 blur-3xl" />
            <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-gold/10 blur-3xl" />
            <div className="relative">
              <p className="text-cyan text-sm font-semibold uppercase tracking-widest">Public Impact Dashboard</p>
              <h1 className="text-4xl sm:text-5xl font-bold font-grotesk text-white mt-2">Transparent Outcomes</h1>
              <p className="text-slate-400 max-w-2xl mt-3">
                Live, aggregated, non-sensitive impact metrics from AlphaX initiatives.
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Active Alphanauts', value: impact.members, icon: Users, color: '#00B4D8' },
              { label: 'Translated Papers', value: impact.translatedPapers, icon: BookOpen, color: '#118AB2' },
              { label: 'Published Research', value: impact.publishedResearch, icon: FlaskConical, color: '#9B59B6' },
              { label: 'Approved Ideas', value: impact.approvedIdeas, icon: TrendingUp, color: '#FFD700' },
            ].map((item) => (
              <div key={item.label} className="glass-card rounded-2xl p-5 border border-white/5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">{item.label}</p>
                  <item.icon size={16} style={{ color: item.color }} />
                </div>
                <p className="text-3xl font-bold font-grotesk mt-2" style={{ color: item.color }}>
                  {item.value}
                </p>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="glass-card rounded-2xl p-6 border border-white/5 lg:col-span-2">
              <h2 className="text-lg font-bold font-grotesk text-white mb-4">Execution Health</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-slate-400">Task Completion Rate</span>
                    <span className="text-cyan font-semibold">{impact.completionRate}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-dark border border-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${impact.completionRate}%`, background: 'linear-gradient(90deg,#00B4D8,#118AB2)' }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-dark/50 border border-white/5 p-4">
                    <p className="text-2xl font-bold font-grotesk text-white">{impact.completedTasks}</p>
                    <p className="text-xs text-slate-500">Completed Tasks</p>
                  </div>
                  <div className="rounded-xl bg-dark/50 border border-white/5 p-4">
                    <p className="text-2xl font-bold font-grotesk text-white">{impact.publishedAnnouncements}</p>
                    <p className="text-xs text-slate-500">Published Announcements</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h2 className="text-lg font-bold font-grotesk text-white mb-4">Trust Guarantees</h2>
              <div className="space-y-3 text-sm text-slate-400">
                <p className="flex items-start gap-2"><ShieldCheck size={15} className="text-cyan mt-0.5" /> Aggregated metrics only, no personal data exposure.</p>
                <p className="flex items-start gap-2"><ShieldCheck size={15} className="text-cyan mt-0.5" /> Updated from live operations data.</p>
                <p className="flex items-start gap-2"><ShieldCheck size={15} className="text-cyan mt-0.5" /> Built for transparency with the public and partners.</p>
              </div>
            </div>
          </section>

          <section className="glass-card rounded-2xl p-6 border border-cyan/15">
            <h2 className="text-lg font-bold font-grotesk text-white mb-2 flex items-center gap-2">
              <Globe2 size={18} className="text-cyan" />
              Why this matters
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Impact visibility helps contributors, navigators, and external supporters align around measurable outcomes.
              This dashboard is the first step; richer trend lines and cohort analytics are already enabled in Product Lab.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
