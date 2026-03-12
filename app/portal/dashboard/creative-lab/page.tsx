import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import PortalLayout from '@/components/layout/PortalLayout';
import TasksPanel from '@/components/portal/TasksPanel';
import InitiativesPanel from '@/components/portal/InitiativesPanel';
import SuggestionsPanel from '@/components/portal/SuggestionsPanel';
import BlockMembersPanel from '@/components/portal/BlockMembersPanel';
import { Palette, Upload, CheckSquare, Star } from 'lucide-react';

async function getBlockMembers(blockSlug: string) {
  const { data: block } = await supabaseAdmin.from('blocks').select('id').eq('slug', blockSlug).single();
  if (!block) return [];
  const { data } = await supabaseAdmin
    .from('alphanaut_blocks')
    .select('alphanauts(id, name)')
    .eq('block_id', block.id);
  return (data || []).map((r: { alphanauts: unknown }) => r.alphanauts).filter(Boolean) as { id: string; name: string }[];
}

export default async function CreativeLabPortalPage() {
  const session = await getPortalSession();
  if (!session) redirect('/portal');

  const hasAccess = session.role === 'co-captain' || session.blocks.includes('creative-lab');
  if (!hasAccess) redirect('/portal/dashboard');

  const isNavigator =
    session.role === 'co-captain' ||
    (session.navigatorBlocks || []).includes('creative-lab');

  const blockMembers = isNavigator ? await getBlockMembers('creative-lab') : [];

  return (
    <PortalLayout session={session}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
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

        {isNavigator ? (
          /* ── NAVIGATOR VIEW ── */
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TasksPanel blockSlug="creative-lab" alphanautId={session.alphanaut_id} isNavigator={true} blockMembers={blockMembers} />
              <SuggestionsPanel blockSlug="creative-lab" alphanautId={session.alphanaut_id} isNavigator={true} />
            </div>
            <InitiativesPanel blockSlug="creative-lab" alphanautId={session.alphanaut_id} isNavigator={true} />
          </>
        ) : (
          /* ── ALPHANAUT VIEW ── */
          <>
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
              <TasksPanel blockSlug="creative-lab" alphanautId={session.alphanaut_id} isNavigator={false} />
              <SuggestionsPanel blockSlug="creative-lab" alphanautId={session.alphanaut_id} isNavigator={false} />
            </div>
            <InitiativesPanel blockSlug="creative-lab" alphanautId={session.alphanaut_id} isNavigator={false} />
          </>
        )}

        {/* Brand Guidelines — visible to all */}
        <div className="glass-card rounded-2xl p-6">
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
        </div>
      </div>
    </PortalLayout>
  );
}
