import { getPortalSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import PortalLayout from '@/components/layout/PortalLayout';
import TasksPanel from '@/components/portal/TasksPanel';
import InitiativesPanel from '@/components/portal/InitiativesPanel';
import SuggestionsPanel from '@/components/portal/SuggestionsPanel';
import BlockMembersPanel from '@/components/portal/BlockMembersPanel';
import { Users, BarChart2 } from 'lucide-react';

async function getBlockMembers(blockSlug: string) {
  const { data: block } = await supabaseAdmin.from('blocks').select('id').eq('slug', blockSlug).single();
  if (!block) return [];
  const { data } = await supabaseAdmin
    .from('alphanaut_blocks')
    .select('alphanauts(id, name)')
    .eq('block_id', block.id);
  return (data || []).map((r: { alphanauts: unknown }) => r.alphanauts).filter(Boolean) as { id: string; name: string }[];
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

  const blockMembers = await getBlockMembers(blockSlug);

  return (
    <PortalLayout session={session}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
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

        {isNavigator ? (
          /* ── NAVIGATOR VIEW ── */
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TasksPanel blockSlug={blockSlug} alphanautId={session.alphanaut_id} isNavigator={true} blockMembers={blockMembers} />
              <SuggestionsPanel blockSlug={blockSlug} alphanautId={session.alphanaut_id} isNavigator={true} />
            </div>
            <InitiativesPanel blockSlug={blockSlug} alphanautId={session.alphanaut_id} isNavigator={true} />
          </>
        ) : (
          /* ── ALPHANAUT VIEW ── */
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BlockMembersPanel blockSlug={blockSlug} currentAlphanautId={session.alphanaut_id} />
              <TasksPanel blockSlug={blockSlug} alphanautId={session.alphanaut_id} isNavigator={false} />
            </div>
            <SuggestionsPanel blockSlug={blockSlug} alphanautId={session.alphanaut_id} isNavigator={false} />
            <InitiativesPanel blockSlug={blockSlug} alphanautId={session.alphanaut_id} isNavigator={false} />
          </>
        )}

        {/* For engineering block */}
        {session.blocks.includes('engineering') && (
          <div className="glass-card rounded-2xl p-6 border-blue-500/20">
            <h2 className="text-lg font-bold font-grotesk text-white mb-4 flex items-center gap-2">
              💻 Engineering Resources
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
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
