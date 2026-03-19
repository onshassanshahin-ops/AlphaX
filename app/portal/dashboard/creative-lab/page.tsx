import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import PortalLayout from '@/components/layout/PortalLayout';
import TasksPanel from '@/components/portal/TasksPanel';
import InitiativesPanel from '@/components/portal/InitiativesPanel';
import SuggestionsPanel from '@/components/portal/SuggestionsPanel';
import BlockMembersPanel from '@/components/portal/BlockMembersPanel';
import BlockPulseStrip from '@/components/portal/BlockPulseStrip';
import RoleJourneyPanel from '@/components/portal/RoleJourneyPanel';
import NextActionsCard from '@/components/portal/NextActionsCard';
import BlockAIAssistant from '@/components/portal/BlockAIAssistant';
import { Upload, Sparkles, Compass, Target } from 'lucide-react';

async function getBlockMembers(blockSlug: string) {
  const { data: block } = await supabaseAdmin.from('blocks').select('id').eq('slug', blockSlug).single();
  if (!block) return [];
  const { data } = await supabaseAdmin
    .from('alphanaut_blocks')
    .select('alphanauts(id, name)')
    .eq('block_id', block.id);
  return (data || []).map((r: { alphanauts: unknown }) => r.alphanauts).filter(Boolean) as { id: string; name: string }[];
}

async function getCreativePulse(blockSlug: string, alphanautId: string) {
  const [myTasksRes, openTasksRes, openSuggestionsRes, openInitiativesRes] = await Promise.all([
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
    myActiveTasks: myTasksRes.count || 0,
    blockActiveTasks: openTasksRes.count || 0,
    activeSuggestions: openSuggestionsRes.count || 0,
    activeInitiatives: openInitiativesRes.count || 0,
  };
}

export default async function CreativeLabPortalPage() {
  const session = await getPortalSession();
  if (!session) redirect('/portal');

  const hasAccess = session.role === 'co-captain' || session.blocks.includes('creative-lab');
  if (!hasAccess) redirect('/portal/dashboard');

  const isNavigator =
    session.role === 'co-captain' ||
    (session.navigatorBlocks || []).includes('creative-lab');

  const [blockMembers, pulse] = await Promise.all([
    isNavigator ? getBlockMembers('creative-lab') : Promise.resolve([]),
    getCreativePulse('creative-lab', session.alphanaut_id),
  ]);

  return (
    <PortalLayout session={session}>
      <div className="space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl p-7 border border-orange/25 bg-gradient-to-r from-[#2d1812] via-dark to-[#24161f] portal-reveal portal-stagger-1">
          <div className="absolute -right-20 -top-16 w-72 h-72 rounded-full bg-orange/10 blur-3xl" />
          <div className="absolute -left-16 -bottom-20 w-64 h-64 rounded-full bg-yellow-500/10 blur-3xl" />
          <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange/20 border border-orange/30 flex items-center justify-center text-xl">
              🎨
            </div>
            <div>
              <h1 className="text-2xl font-bold font-grotesk text-white">Creative Lab</h1>
              <p className="text-sm text-slate-400">
                {isNavigator ? 'Navigator Panel — Design & Visual Identity' : 'Design & Visual Identity Portal'}
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
              { label: 'My Active Tasks', value: pulse.myActiveTasks, tone: 'orange' },
              { label: 'Block Active Tasks', value: pulse.blockActiveTasks, tone: 'cyan' },
              { label: 'Live Suggestions', value: pulse.activeSuggestions, tone: 'purple' },
              { label: 'Open Initiatives', value: pulse.activeInitiatives, tone: 'yellow' },
            ]}
          />
        </div>

        <BlockAIAssistant blockSlug="creative-lab" blockName="Creative Lab" />

        {isNavigator ? (
          /* ── NAVIGATOR VIEW ── */
          <>
            <RoleJourneyPanel
              title="Navigator Creative Command"
              icon={Compass}
              iconClassName="text-orange"
              containerClassName="border border-orange/20"
              items={[
                { title: 'Creative Direction', desc: 'Set weekly visual theme and mood references for the team.' },
                { title: 'Quality Gate', desc: 'Review suggestions first, then convert strong ideas into initiatives.' },
                { title: 'Delivery Rhythm', desc: 'Assign urgent tasks first to keep output cadence stable.' },
              ]}
            />

            <NextActionsCard
              title="Navigator Next Actions"
              icon={Target}
              iconClassName="text-orange"
              containerClassName="border border-orange/20 bg-orange/10"
              actions={[
                { title: 'Review Top 3 Suggestions', hint: 'Pick high-impact ideas and convert one to an initiative today.', href: '#creative-suggestions', actionLabel: 'Open Suggestions' },
                { title: 'Rebalance Team Tasks', hint: 'Move at least one blocked task to an available contributor.', href: '#creative-tasks', actionLabel: 'Open Tasks' },
                { title: 'Publish One Quality Note', hint: 'Share one concrete design quality criterion for this sprint.', href: '#creative-guidelines', actionLabel: 'Open Guidelines' },
              ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TasksPanel panelId="creative-tasks" blockSlug="creative-lab" alphanautId={session.alphanaut_id} isNavigator={true} blockMembers={blockMembers} />
              <SuggestionsPanel panelId="creative-suggestions" blockSlug="creative-lab" alphanautId={session.alphanaut_id} isNavigator={true} />
            </div>
            <InitiativesPanel panelId="creative-initiatives" blockSlug="creative-lab" alphanautId={session.alphanaut_id} isNavigator={true} />
          </>
        ) : (
          /* ── ALPHANAUT VIEW ── */
          <>
            <RoleJourneyPanel
              title="Creator Journey"
              icon={Sparkles}
              iconClassName="text-orange"
              containerClassName="border border-orange/20"
              items={[
                { title: '1. Pick Mission', desc: 'Start with one active task or one initiative where you can deliver quickly.' },
                { title: '2. Build Draft', desc: 'Create your version, add context in suggestion comments, iterate fast.' },
                { title: '3. Ship + Improve', desc: 'Submit, gather feedback, then propose the next visual upgrade.' },
              ]}
            />

            <NextActionsCard
              title="Your Next Creative Moves"
              icon={Target}
              iconClassName="text-orange"
              containerClassName="border border-orange/20 bg-orange/10"
              actions={[
                { title: 'Claim One Task', hint: 'Start with the most urgent item in your queue.', href: '#creative-tasks', actionLabel: 'Go to Tasks' },
                { title: 'Share One Suggestion', hint: 'Propose a specific visual improvement with context.', href: '#creative-suggestions', actionLabel: 'Go to Suggestions' },
                { title: 'Close One Loop', hint: 'After delivery, post one improvement idea for the next iteration.', href: '#creative-initiatives', actionLabel: 'Go to Initiatives' },
              ]}
            />

            {/* Upload + Team side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-bold font-grotesk text-white mb-4 flex items-center gap-2">
                  <Upload size={18} className="text-orange" />
                  Upload Deliverable
                </h2>
                <div className="flex flex-col items-center gap-3 p-8 rounded-xl border border-dashed border-orange/20 hover:border-orange/40 bg-dark/50 cursor-pointer transition-colors">
                  <Upload size={24} className="text-slate-500" />
                  <div className="text-center">
                    <p className="text-sm text-slate-300">Drop files here or click to upload</p>
                    <p className="text-xs text-slate-500 mt-1">SVG, PNG, JPG, AI, PDF supported</p>
                  </div>
                </div>
              </div>
              <BlockMembersPanel blockSlug="creative-lab" currentAlphanautId={session.alphanaut_id} />
            </div>

            {/* My tasks + Suggestions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TasksPanel panelId="creative-tasks" blockSlug="creative-lab" alphanautId={session.alphanaut_id} isNavigator={false} />
              <SuggestionsPanel panelId="creative-suggestions" blockSlug="creative-lab" alphanautId={session.alphanaut_id} isNavigator={false} />
            </div>
            <InitiativesPanel panelId="creative-initiatives" blockSlug="creative-lab" alphanautId={session.alphanaut_id} isNavigator={false} />
          </>
        )}

        {/* Brand Guidelines — visible to all */}
        <div id="creative-guidelines" className="glass-card rounded-2xl p-6 portal-reveal portal-stagger-4 panel-target">
          <h2 className="text-lg font-bold font-grotesk text-white mb-4">AlphaX Brand Guidelines</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { name: 'Navy', hex: '#0A2463', class: 'bg-[#0A2463]' },
              { name: 'Cyan', hex: '#00B4D8', class: 'bg-[#00B4D8]' },
              { name: 'Teal', hex: '#118AB2', class: 'bg-[#118AB2]' },
              { name: 'Dark', hex: '#1a1f3a', class: 'bg-[#1a1f3a]' },
              { name: 'Gold', hex: '#FFD700', class: 'bg-[#FFD700]' },
              { name: 'Purple', hex: '#9B59B6', class: 'bg-[#9B59B6]' },
              { name: 'Orange', hex: '#FF6B35', class: 'bg-[#FF6B35]' },
              { name: 'Charcoal', hex: '#2B2D42', class: 'bg-[#2B2D42]' },
            ].map((color) => (
              <div key={color.name} className="text-center">
                <div className={`w-full h-12 rounded-xl ${color.class} mb-2 border border-white/10`} />
                <p className="text-xs font-semibold text-white">{color.name}</p>
                <p className="text-xs text-slate-500 font-mono">{color.hex}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-dark/50 border border-white/5">
              <p className="text-sm font-semibold text-white mb-1">Heading Font</p>
              <p className="text-slate-400 text-sm font-grotesk">Space Grotesk</p>
              <p className="text-xs text-slate-600 mt-1">Used for all headings and display text</p>
            </div>
            <div className="p-4 rounded-xl bg-dark/50 border border-white/5">
              <p className="text-sm font-semibold text-white mb-1">Body Font</p>
              <p className="text-slate-400 text-sm font-inter">Inter</p>
              <p className="text-xs text-slate-600 mt-1">Used for body text and UI elements</p>
            </div>
          </div>
          <div className="mt-4 p-4 rounded-xl border border-orange/20 bg-orange/10 flex items-start gap-3">
            <Target size={16} className="text-orange mt-0.5" />
            <p className="text-sm text-slate-300 leading-relaxed">
              Creative Lab standard: every published asset should include one clear intent statement, one evidence source, and one improvement idea for the next iteration.
            </p>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
