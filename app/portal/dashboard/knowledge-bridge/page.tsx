import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import PortalLayout from '@/components/layout/PortalLayout';
import PaperUploadForm from '@/components/portal/PaperUploadForm';
import TasksPanel from '@/components/portal/TasksPanel';
import InitiativesPanel from '@/components/portal/InitiativesPanel';
import SuggestionsPanel from '@/components/portal/SuggestionsPanel';
import { StatusBadge, FieldBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import BlockMembersPanel from '@/components/portal/BlockMembersPanel';
import { Plus, FileText, Download, ClipboardList, Lightbulb, Star } from 'lucide-react';
import type { Paper } from '@/types';

async function getBlockMembers(blockSlug: string) {
  const { data: blockData } = await supabaseAdmin.from('blocks').select('id').eq('slug', blockSlug).single();
  if (!blockData) return [];
  const { data } = await supabaseAdmin
    .from('alphanaut_blocks')
    .select('alphanauts(id, name)')
    .eq('block_id', blockData.id);
  return (data || []).map((r: { alphanauts: unknown }) => r.alphanauts).filter(Boolean) as { id: string; name: string }[];
}

async function getKBData(alphanautId: string, isNavigator: boolean) {
  const [myPapersRes, allPapersRes] = await Promise.all([
    supabaseAdmin
      .from('papers')
      .select('id, title_ar, title_en, field, status, download_count, created_at, published_at, navigator_notes')
      .eq('submitted_by', alphanautId)
      .order('created_at', { ascending: false }),
    isNavigator
      ? supabaseAdmin
          .from('papers')
          .select('id, title_ar, title_en, field, status, download_count, created_at, submitted_by, submitter:submitted_by(name)')
          .in('status', ['under_review', 'published'])
          .order('created_at', { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] }),
  ]);

  return {
    myPapers: myPapersRes.data || [],
    allPapers: (allPapersRes as any).data || [],
  };
}

export default async function KnowledgeBridgePortalPage() {
  const session = await getPortalSession();
  if (!session) redirect('/portal');

  const hasAccess =
    session.role === 'co-captain' || session.blocks.includes('knowledge-bridge');
  if (!hasAccess) redirect('/portal/dashboard');

  const isNavigator =
    session.role === 'co-captain' ||
    (session.navigatorBlocks || []).includes('knowledge-bridge');

  const [{ myPapers, allPapers }, blockMembers] = await Promise.all([
    getKBData(session.alphanaut_id, isNavigator),
    getBlockMembers('knowledge-bridge'),
  ]);

  const pendingReview = allPapers.filter((p: Paper) => p.status === 'under_review');

  return (
    <PortalLayout session={session}>
      <div className="space-y-8">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan/20 border border-cyan/30 flex items-center justify-center text-xl">📚</div>
            <div>
              <h1 className="text-2xl font-bold font-grotesk text-white">Knowledge Bridge</h1>
              <p className="text-sm text-slate-400">
                {isNavigator ? 'Navigator Panel — Review & Coordinate' : 'Translation & Contribution Portal'}
              </p>
            </div>
          </div>
          {isNavigator && (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
              <Star size={11} /> Navigator
            </span>
          )}
        </div>

        {isNavigator ? (
          /* ══════════════════════════════════════
             NAVIGATOR VIEW
             Focus: review queue, task assignment,
             suggestion management
          ══════════════════════════════════════ */
          <>
            {/* Review Queue — primary focus */}
            <div className="glass-card rounded-2xl p-6 border border-yellow-500/15">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold font-grotesk text-white flex items-center gap-2">
                  <ClipboardList size={18} className="text-yellow-400" />
                  Review Queue
                  {pendingReview.length > 0 && (
                    <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                      {pendingReview.length} pending
                    </span>
                  )}
                </h2>
              </div>
              {pendingReview.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">✅</p>
                  <p className="text-slate-400 text-sm">All caught up — no papers pending review.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingReview.map((paper: Paper & { submitter?: { name: string } }) => (
                    <div key={paper.id} className="flex items-center gap-4 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/15">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate" dir="rtl">{paper.title_ar}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          by {paper.submitter?.name || 'Unknown'} · {formatDate(paper.created_at)}
                        </p>
                      </div>
                      <NavigatorPaperActions paperId={paper.id} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Task Assignment + Suggestion Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TasksPanel blockSlug="knowledge-bridge" alphanautId={session.alphanaut_id} isNavigator={true} blockMembers={blockMembers} />
              <SuggestionsPanel blockSlug="knowledge-bridge" alphanautId={session.alphanaut_id} isNavigator={true} />
            </div>
            <InitiativesPanel blockSlug="knowledge-bridge" alphanautId={session.alphanaut_id} isNavigator={true} />

            {/* Navigator's own submissions (secondary) */}
            {myPapers.length > 0 && (
              <details className="glass-card rounded-2xl">
                <summary className="p-5 cursor-pointer text-sm font-semibold text-slate-400 hover:text-white flex items-center gap-2">
                  <FileText size={15} /> My Submissions ({myPapers.length})
                </summary>
                <div className="px-5 pb-5 space-y-3">
                  {myPapers.map((paper: Paper) => <PaperRow key={paper.id} paper={paper} />)}
                </div>
              </details>
            )}
          </>
        ) : (
          /* ══════════════════════════════════════
             ALPHANAUT VIEW
             Focus: submitting, my work, team
          ══════════════════════════════════════ */
          <>
            {/* Submit new translation — primary */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-bold font-grotesk text-white mb-5 flex items-center gap-2">
                <Plus size={18} className="text-cyan" />
                Submit New Translation
              </h2>
              <PaperUploadForm />
            </div>

            {/* My submissions */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-bold font-grotesk text-white mb-5 flex items-center gap-2">
                <FileText size={18} className="text-cyan" />
                My Submissions ({myPapers.length})
              </h2>
              {myPapers.length === 0 ? (
                <p className="text-slate-500 text-sm py-6 text-center">You haven&apos;t submitted any papers yet.</p>
              ) : (
                <div className="space-y-3">
                  {myPapers.map((paper: Paper) => <PaperRow key={paper.id} paper={paper} showNotes />)}
                </div>
              )}
            </div>

            {/* Team + Tasks side-by-side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BlockMembersPanel blockSlug="knowledge-bridge" currentAlphanautId={session.alphanaut_id} />
              <TasksPanel blockSlug="knowledge-bridge" alphanautId={session.alphanaut_id} isNavigator={false} />
            </div>

            {/* Suggestions + Initiatives */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SuggestionsPanel blockSlug="knowledge-bridge" alphanautId={session.alphanaut_id} isNavigator={false} />
              <div className="space-y-0">
                <InitiativesPanel blockSlug="knowledge-bridge" alphanautId={session.alphanaut_id} isNavigator={false} />
              </div>
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
}

function PaperRow({ paper, showNotes }: { paper: Paper; showNotes?: boolean }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-dark/50 border border-white/5">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate" dir="rtl">{paper.title_ar}</p>
        {paper.title_en && <p className="text-xs text-slate-500 truncate mt-0.5">{paper.title_en}</p>}
        {showNotes && paper.navigator_notes && (
          <p className="text-xs text-yellow-400 mt-1 bg-yellow-500/10 px-2 py-1 rounded">
            Navigator note: {paper.navigator_notes}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {paper.field && <FieldBadge field={paper.field} />}
        <StatusBadge status={paper.status} />
        <div className="flex items-center gap-1 text-xs text-slate-500"><Download size={12} />{paper.download_count}</div>
        <span className="text-xs text-slate-600">{formatDate(paper.created_at)}</span>
      </div>
    </div>
  );
}

function NavigatorPaperActions({ paperId }: { paperId: string }) {
  return (
    <div className="flex items-center gap-2">
      <a href={`/knowledge-bridge/${paperId}`} target="_blank"
        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan border border-cyan/30 hover:bg-cyan/10 transition-colors">
        View
      </a>
      <PublishPaperButton paperId={paperId} />
    </div>
  );
}

function PublishPaperButton({ paperId }: { paperId: string }) {
  return (
    <form
      action={async () => {
        'use server';
        await supabaseAdmin
          .from('papers')
          .update({ status: 'published', published_at: new Date().toISOString() })
          .eq('id', paperId);
      }}
    >
      <button
        type="submit"
        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-green-400 border border-green-500/30 hover:bg-green-500/10 transition-colors"
      >
        Publish
      </button>
    </form>
  );
}
