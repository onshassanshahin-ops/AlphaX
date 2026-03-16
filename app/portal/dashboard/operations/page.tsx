import { getPortalSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import PortalLayout from '@/components/layout/PortalLayout';
import TasksPanel from '@/components/portal/TasksPanel';
import InitiativesPanel from '@/components/portal/InitiativesPanel';
import SuggestionsPanel from '@/components/portal/SuggestionsPanel';
import BlockMembersPanel from '@/components/portal/BlockMembersPanel';
import BlockPulseStrip from '@/components/portal/BlockPulseStrip';
import RoleJourneyPanel from '@/components/portal/RoleJourneyPanel';
import NextActionsCard from '@/components/portal/NextActionsCard';
import { Radar, Briefcase, Route, ShieldCheck } from 'lucide-react';

async function getBlockMembers(blockSlug: string) {
  const { data: block } = await supabaseAdmin.from('blocks').select('id').eq('slug', blockSlug).single();
  if (!block) return [];
  const { data } = await supabaseAdmin
    .from('alphanaut_blocks')
    .select('alphanauts(id, name)')
    .eq('block_id', block.id);
  return (data || []).map((r: { alphanauts: unknown }) => r.alphanauts).filter(Boolean) as { id: string; name: string }[];
}

async function getOpsPulse(blockSlug: string, alphanautId: string) {
  const [myTasksRes, activeTasksRes, activeSuggestionsRes, activeInitiativesRes] = await Promise.all([
    supabaseAdmin
      .from('block_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('block_slug', blockSlug)
      .eq('assigned_to', alphanautId)
      .in('status', ['pending', 'in_progress']),
    supabaseAdmin
      .from('block_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('block_slug', blockSlug)
      .in('status', ['pending', 'in_progress']),
    supabaseAdmin
      .from('block_suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('block_slug', blockSlug)
      .in('status', ['open', 'under_review']),
    supabaseAdmin
      .from('block_initiatives')
      .select('id', { count: 'exact', head: true })
      .eq('block_slug', blockSlug)
      .in('status', ['open', 'in_progress']),
  ]);

  return {
    myQueue: myTasksRes.count || 0,
    blockQueue: activeTasksRes.count || 0,
    openSuggestions: activeSuggestionsRes.count || 0,
    liveInitiatives: activeInitiativesRes.count || 0,
  };
}

export default async function OperationsPortalPage() {
  const session = await getPortalSession();
  if (!session) redirect('/portal');

  const hasAccess =
    session.role === 'co-captain' ||
    session.blocks.includes('operations') ||
    session.blocks.includes('engineering');

  if (!hasAccess) redirect('/portal/dashboard');

  const blockSlug = session.blocks.includes('engineering') ? 'engineering' : 'operations';
  const isNavigator =
    session.role === 'co-captain' ||
    (session.navigatorBlocks || []).includes('operations') ||
    (session.navigatorBlocks || []).includes('engineering');

  const [blockMembers, pulse] = await Promise.all([
    getBlockMembers(blockSlug),
    getOpsPulse(blockSlug, session.alphanaut_id),
  ]);

  return (
    <PortalLayout session={session}>
      <div className="space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl p-7 border border-slate-400/30 bg-gradient-to-r from-[#151c2b] via-dark to-[#121b2a] portal-reveal portal-stagger-1">
          <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-cyan/10 blur-3xl" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-slate-500/10 blur-3xl" />
          <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-500/20 border border-slate-500/30 flex items-center justify-center text-xl">
              ⚙️
            </div>
            <div>
              <h1 className="text-2xl font-bold font-grotesk text-white">
                {session.blocks.includes('engineering') ? 'Engineering & Operations' : 'Operations & Strategy'}
              </h1>
              <p className="text-sm text-slate-400">
                {isNavigator ? 'Navigator Panel — Project Coordination' : 'Project Coordination Portal'}
              </p>
            </div>
          </div>
          {isNavigator && (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
              ⭐ Navigator
            </span>
          )}
          </div>
          <BlockPulseStrip
            items={[
              { label: 'My Queue', value: pulse.myQueue, tone: 'cyan' },
              { label: 'Block Queue', value: pulse.blockQueue, tone: 'slate' },
              { label: 'Open Suggestions', value: pulse.openSuggestions, tone: 'purple' },
              { label: 'Live Initiatives', value: pulse.liveInitiatives, tone: 'yellow' },
            ]}
          />
        </div>

        {isNavigator ? (
          /* ── NAVIGATOR VIEW ── */
          <>
            <RoleJourneyPanel
              title="Navigator Ops Radar"
              icon={Radar}
              iconClassName="text-cyan"
              containerClassName="border border-slate-400/20"
              items={[
                { title: 'Prioritize Bottlenecks', desc: 'Move urgent pending tasks into active owners before day-end.' },
                { title: 'Convert Suggestions', desc: 'Promising ideas should become initiatives with clear deadlines.' },
                { title: 'Stabilize Throughput', desc: 'Balance task load across the team to avoid single-point overload.' },
              ]}
            />

            <NextActionsCard
              title="Navigator Priority Actions"
              icon={ShieldCheck}
              iconClassName="text-cyan"
              containerClassName="border border-cyan/20 bg-cyan/10"
              actions={[
                { title: 'Unblock One Critical Task', hint: 'Resolve one dependency bottleneck before creating new work.', href: '#ops-tasks', actionLabel: 'Open Tasks' },
                { title: 'Promote One Suggestion', hint: 'Move one valuable suggestion into initiative execution.', href: '#ops-suggestions', actionLabel: 'Open Suggestions' },
                { title: 'Update Ownership Map', hint: 'Ensure each active task has one clear accountable owner.', href: '#ops-initiatives', actionLabel: 'Open Initiatives' },
              ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TasksPanel panelId="ops-tasks" blockSlug={blockSlug} alphanautId={session.alphanaut_id} isNavigator={true} blockMembers={blockMembers} />
              <SuggestionsPanel panelId="ops-suggestions" blockSlug={blockSlug} alphanautId={session.alphanaut_id} isNavigator={true} />
            </div>
            <InitiativesPanel panelId="ops-initiatives" blockSlug={blockSlug} alphanautId={session.alphanaut_id} isNavigator={true} />
          </>
        ) : (
          /* ── ALPHANAUT VIEW ── */
          <>
            <RoleJourneyPanel
              title="Your Mission Flow"
              icon={Route}
              iconClassName="text-cyan"
              containerClassName="border border-slate-400/20"
              items={[
                { title: 'Accept Scope', desc: 'Pick one task and clarify acceptance criteria with your navigator early.' },
                { title: 'Deliver Update', desc: 'Use suggestions for blockers and propose process improvements fast.' },
                { title: 'Close Loop', desc: 'When done, summarize result and next dependency for the team.' },
              ]}
            />

            <NextActionsCard
              title="Your Next Ops Steps"
              icon={ShieldCheck}
              iconClassName="text-cyan"
              containerClassName="border border-cyan/20 bg-cyan/10"
              actions={[
                { title: 'Pick Highest Priority Task', hint: 'Start where impact and urgency are both high.', href: '#ops-tasks', actionLabel: 'Go to Tasks' },
                { title: 'Report Blockers Early', hint: 'Use suggestions to flag dependency issues quickly.', href: '#ops-suggestions', actionLabel: 'Go to Suggestions' },
                { title: 'Document Outcome', hint: 'After completion, add a concise handoff note.', href: '#ops-initiatives', actionLabel: 'Go to Initiatives' },
              ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BlockMembersPanel blockSlug={blockSlug} currentAlphanautId={session.alphanaut_id} />
              <TasksPanel panelId="ops-tasks" blockSlug={blockSlug} alphanautId={session.alphanaut_id} isNavigator={false} />
            </div>
            <SuggestionsPanel panelId="ops-suggestions" blockSlug={blockSlug} alphanautId={session.alphanaut_id} isNavigator={false} />
            <InitiativesPanel panelId="ops-initiatives" blockSlug={blockSlug} alphanautId={session.alphanaut_id} isNavigator={false} />
          </>
        )}

        {/* For engineering block */}
        {session.blocks.includes('engineering') && (
          <div className="glass-card rounded-2xl p-6 border-blue-500/20">
            <h2 className="text-lg font-bold font-grotesk text-white mb-4 flex items-center gap-2">
              <Briefcase size={17} className="text-cyan" /> Engineering Resources
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'GitHub Repository', desc: 'AlphaX codebase and project repos', icon: '🐙' },
                { title: 'Tech Stack Docs', desc: 'Next.js, Supabase, Tailwind CSS', icon: '📖' },
                { title: 'Dev Environment', desc: 'Setup guide for local development', icon: '🛠️' },
                { title: 'Deployment Guide', desc: 'Vercel deployment and CI/CD', icon: '🚀' },
              ].map((item) => (
                <div key={item.title} className="p-4 rounded-xl bg-dark/50 border border-white/5">
                  <p className="text-xl mb-2">{item.icon}</p>
                  <p className="font-semibold text-white text-sm">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 rounded-xl border border-cyan/20 bg-cyan/10 flex items-start gap-3">
              <ShieldCheck size={16} className="text-cyan mt-0.5" />
              <p className="text-sm text-slate-300 leading-relaxed">
                Engineering quality gate: each delivery should include impact note, rollback plan, and owner handoff details.
              </p>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
