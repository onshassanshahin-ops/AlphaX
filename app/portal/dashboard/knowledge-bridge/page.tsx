'use client';

import { useEffect, useMemo, useState } from 'react';
import PortalLayout from '@/components/layout/PortalLayout';
import SuggestionsPanel from '@/components/portal/SuggestionsPanel';
import BlockPulseStrip from '@/components/portal/BlockPulseStrip';
import NextActionsCard from '@/components/portal/NextActionsCard';
import BlockAIAssistant from '@/components/portal/BlockAIAssistant';
import type { PortalSession } from '@/types';
import { FileText, Users, Workflow, Send, CheckCircle2, ArrowRightLeft, Target } from 'lucide-react';
import toast from 'react-hot-toast';

type Section = 'translation' | 'simplification';

interface SectionNavigator {
  section: Section;
  alphanaut_id: string | null;
  alphanaut?: { id: string; name: string };
}

interface Subgroup {
  id: string;
  section: Section;
  name: string;
  leader_id?: string | null;
  description?: string | null;
}

interface WorkflowCard {
  id: string;
  title_ar: string;
  title_en?: string | null;
  translation_subgroup_id?: string | null;
  simplification_subgroup_id?: string | null;
  status:
    | 'translation_in_progress'
    | 'translation_review'
    | 'simplification_in_progress'
    | 'simplification_review'
    | 'admin_review'
    | 'published'
    | 'changes_requested'
    | 'rejected';
  paper_id?: string | null;
}

interface Member {
  id: string;
  name: string;
}

interface KbTask {
  id: string;
  title: string;
  deadline?: string | null;
  assigned_to?: string | null;
  assignee?: { id: string; name: string } | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  subgroup_id: string;
}

const statusLabel: Record<WorkflowCard['status'], string> = {
  translation_in_progress: 'Translation In Progress',
  translation_review: 'Translation Review',
  simplification_in_progress: 'Simplification In Progress',
  simplification_review: 'Simplification Review',
  admin_review: 'Admin Review',
  published: 'Published',
  changes_requested: 'Changes Requested',
  rejected: 'Rejected',
};

export default function KnowledgeBridgePortalPage() {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [sectionNavigators, setSectionNavigators] = useState<SectionNavigator[]>([]);
  const [subgroups, setSubgroups] = useState<Subgroup[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowCard[]>([]);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>('');
  const [tasks, setTasks] = useState<KbTask[]>([]);

  const [newSubgroup, setNewSubgroup] = useState({ section: 'translation' as Section, name: '', leader_id: '' });
  const [newWorkflow, setNewWorkflow] = useState({ title_ar: '', title_en: '', translation_subgroup_id: '' });
  const [newTask, setNewTask] = useState({ title: '', subgroup_id: '', assigned_to: '', deadline: '' });
  const [subgroupMemberMap, setSubgroupMemberMap] = useState<Record<string, string[]>>({});
  const [subgroupLeaderMap, setSubgroupLeaderMap] = useState<Record<string, string>>({});
  const [savingSubgroupId, setSavingSubgroupId] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [authRes, membersRes, navRes, subgroupRes, workflowRes] = await Promise.all([
        fetch('/api/auth/portal'),
        fetch('/api/blocks/knowledge-bridge/members'),
        fetch('/api/knowledge-bridge/section-navigators'),
        fetch('/api/knowledge-bridge/subgroups'),
        fetch('/api/knowledge-bridge/workflows?limit=60'),
      ]);

      if (authRes.ok) {
        const authData = await authRes.json();
        setSession(authData.session || null);
      }
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers((membersData.members || []).map((m: any) => ({ id: m.id, name: m.name })));
      }
      if (navRes.ok) {
        const navData = await navRes.json();
        setSectionNavigators(navData.sectionNavigators || []);
      }
      if (subgroupRes.ok) {
        const subgroupData = await subgroupRes.json();
        setSubgroups(subgroupData.subgroups || []);
      }
      if (workflowRes.ok) {
        const workflowData = await workflowRes.json();
        setWorkflows(workflowData.workflows || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (subgroups.length === 0) {
        setSubgroupMemberMap({});
        setSubgroupLeaderMap({});
        return;
      }

      const results = await Promise.all(
        subgroups.map(async (subgroup) => {
          const res = await fetch(`/api/knowledge-bridge/subgroups/${subgroup.id}`);
          if (!res.ok) return { id: subgroup.id, leaderId: subgroup.leader_id || '', memberIds: [] as string[] };
          const data = await res.json();
          const rows = data.subgroup?.members || [];
          const leaderId = data.subgroup?.leader_id || subgroup.leader_id || '';
          const memberIds = rows
            .map((row: any) => row?.alphanaut?.id)
            .filter(Boolean) as string[];
          return { id: subgroup.id, leaderId, memberIds };
        })
      );

      const nextLeaderMap: Record<string, string> = {};
      const nextMemberMap: Record<string, string[]> = {};
      results.forEach((result) => {
        nextLeaderMap[result.id] = result.leaderId;
        nextMemberMap[result.id] = Array.from(new Set(result.memberIds));
      });
      setSubgroupLeaderMap(nextLeaderMap);
      setSubgroupMemberMap(nextMemberMap);
    };

    run();
  }, [subgroups]);

  useEffect(() => {
    const run = async () => {
      if (!activeWorkflowId) {
        setTasks([]);
        return;
      }
      const res = await fetch(`/api/knowledge-bridge/tasks?workflowId=${activeWorkflowId}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    };
    run();
  }, [activeWorkflowId]);

  const userId = session?.alphanaut_id || '';
  const isCoCaptain = session?.role === 'co-captain';

  const translationNavigatorId = sectionNavigators.find((s) => s.section === 'translation')?.alphanaut_id;
  const simplificationNavigatorId = sectionNavigators.find((s) => s.section === 'simplification')?.alphanaut_id;

  const isTranslationNavigator = isCoCaptain || (!!userId && translationNavigatorId === userId);
  const isSimplificationNavigator = isCoCaptain || (!!userId && simplificationNavigatorId === userId);

  const leaderSubgroupIds = useMemo(
    () => subgroups.filter((s) => s.leader_id === userId).map((s) => s.id),
    [subgroups, userId]
  );

  const activeWorkflow = workflows.find((w) => w.id === activeWorkflowId);
  const workflowSubgroupOptions = subgroups.filter(
    (s) =>
      s.id === activeWorkflow?.translation_subgroup_id ||
      s.id === activeWorkflow?.simplification_subgroup_id
  );
  const inReviewWorkflows = workflows.filter((w) => w.status === 'translation_review' || w.status === 'simplification_review' || w.status === 'admin_review').length;
  const publishedWorkflows = workflows.filter((w) => w.status === 'published').length;
  const activeWorkflowTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;

  const canCreateSubgroup = isTranslationNavigator || isSimplificationNavigator;
  const canCreateWorkflow = isTranslationNavigator || subgroups.some((s) => s.section === 'translation' && s.leader_id === userId);
  const canManageTasks = !!activeWorkflow && (
    isTranslationNavigator ||
    isSimplificationNavigator ||
    leaderSubgroupIds.includes(activeWorkflow.translation_subgroup_id || '') ||
    leaderSubgroupIds.includes(activeWorkflow.simplification_subgroup_id || '')
  );
  const canManageSubgroups = canCreateSubgroup || leaderSubgroupIds.length > 0;

  const canManageSubgroup = (subgroup: Subgroup) => (
    isCoCaptain ||
    (subgroup.section === 'translation' && isTranslationNavigator) ||
    (subgroup.section === 'simplification' && isSimplificationNavigator) ||
    subgroup.leader_id === userId
  );

  const createSubgroup = async () => {
    if (!newSubgroup.name || !newSubgroup.leader_id) {
      toast.error('Subgroup name and leader are required');
      return;
    }
    const res = await fetch('/api/knowledge-bridge/subgroups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSubgroup),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Failed to create subgroup');
      return;
    }
    toast.success('Subgroup created');
    setNewSubgroup({ section: 'translation', name: '', leader_id: '' });
    fetchAll();
  };

  const toggleSubgroupMember = (subgroupId: string, memberId: string) => {
    setSubgroupMemberMap((prev) => {
      const existing = prev[subgroupId] || [];
      const next = existing.includes(memberId)
        ? existing.filter((id) => id !== memberId)
        : [...existing, memberId];
      return { ...prev, [subgroupId]: next };
    });
  };

  const saveSubgroupTeam = async (subgroup: Subgroup) => {
    const leaderId = subgroupLeaderMap[subgroup.id] || '';
    if (!leaderId) {
      toast.error('Select a subgroup leader before saving');
      return;
    }

    const memberIds = subgroupMemberMap[subgroup.id] || [];
    setSavingSubgroupId(subgroup.id);
    try {
      const res = await fetch(`/api/knowledge-bridge/subgroups/${subgroup.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leader_id: leaderId,
          member_ids: Array.from(new Set([leaderId, ...memberIds])),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update subgroup team');
        return;
      }

      toast.success('Subgroup team updated');
      fetchAll();
    } finally {
      setSavingSubgroupId(null);
    }
  };

  const createWorkflow = async () => {
    if (!newWorkflow.title_ar || !newWorkflow.translation_subgroup_id) {
      toast.error('Arabic title and translation subgroup are required');
      return;
    }
    const res = await fetch('/api/knowledge-bridge/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newWorkflow),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Failed to create workflow card');
      return;
    }
    toast.success('Workflow card created');
    setNewWorkflow({ title_ar: '', title_en: '', translation_subgroup_id: '' });
    fetchAll();
  };

  const runAction = async (workflowId: string, action: string, payload: Record<string, unknown> = {}) => {
    const res = await fetch(`/api/knowledge-bridge/workflows/${workflowId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Action failed');
      return;
    }
    toast.success('Workflow updated');
    fetchAll();
  };

  const createTask = async () => {
    if (!activeWorkflow || !newTask.title || !newTask.assigned_to || !newTask.subgroup_id) {
      toast.error('Task title, subgroup and assignee are required');
      return;
    }
    const res = await fetch('/api/knowledge-bridge/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_id: activeWorkflow.id,
        subgroup_id: newTask.subgroup_id,
        title: newTask.title,
        assigned_to: newTask.assigned_to,
        deadline: newTask.deadline || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Failed to create task');
      return;
    }
    toast.success('Task created');
    setNewTask({ title: '', subgroup_id: '', assigned_to: '', deadline: '' });
    const tasksRes = await fetch(`/api/knowledge-bridge/tasks?workflowId=${activeWorkflow.id}`);
    if (tasksRes.ok) {
      const tasksData = await tasksRes.json();
      setTasks(tasksData.tasks || []);
    }
  };

  const setTaskStatus = async (taskId: string, status: KbTask['status']) => {
    const res = await fetch(`/api/knowledge-bridge/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Failed to update task');
      return;
    }
    const tasksRes = await fetch(`/api/knowledge-bridge/tasks?workflowId=${activeWorkflowId}`);
    if (tasksRes.ok) {
      const tasksData = await tasksRes.json();
      setTasks(tasksData.tasks || []);
    }
  };

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan/20 border-t-cyan animate-spin" />
      </div>
    );
  }

  const translationSubgroups = subgroups.filter((s) => s.section === 'translation');
  const simplificationSubgroups = subgroups.filter((s) => s.section === 'simplification');

  return (
    <PortalLayout session={session}>
      <div className="space-y-8">
        <div className="glass-card rounded-2xl p-6 portal-reveal portal-stagger-1">
          <h1 className="text-2xl font-bold font-grotesk text-white">Knowledge Bridge Workflow</h1>
          <p className="text-sm text-slate-400 mt-1">
            Translation teams -&gt; Translation navigator -&gt; Simplification teams -&gt; Simplification navigator -&gt; Admin publish.
          </p>
          <BlockPulseStrip
            items={[
              { label: 'Workflow Cards', value: workflows.length, tone: 'cyan' },
              { label: 'In Review', value: inReviewWorkflows, tone: 'yellow' },
              { label: 'Published', value: publishedWorkflows, tone: 'purple' },
              { label: 'Active Tasks', value: activeWorkflowTasks, tone: 'orange' },
            ]}
          />
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-cyan/20 bg-cyan/10">
              <p className="text-xs text-slate-400">Translation Navigator</p>
              <p className="text-sm font-semibold text-white">{sectionNavigators.find((s) => s.section === 'translation')?.alphanaut?.name || 'Not set'}</p>
            </div>
            <div className="p-3 rounded-xl border border-purple/20 bg-purple/10">
              <p className="text-xs text-slate-400">Simplification Navigator</p>
              <p className="text-sm font-semibold text-white">{sectionNavigators.find((s) => s.section === 'simplification')?.alphanaut?.name || 'Not set'}</p>
            </div>
            <div className="p-3 rounded-xl border border-gold/20 bg-gold/10">
              <p className="text-xs text-slate-400">Your Role</p>
              <p className="text-sm font-semibold text-white">
                {isTranslationNavigator || isSimplificationNavigator || leaderSubgroupIds.length > 0
                  ? 'Navigator / Leader'
                  : 'Alphanaut'}
              </p>
            </div>
          </div>
        </div>

        <NextActionsCard
          title={(isTranslationNavigator || isSimplificationNavigator || leaderSubgroupIds.length > 0)
            ? 'Workflow Leadership Next Actions'
            : 'Your Knowledge Bridge Next Actions'}
          icon={Target}
          iconClassName="text-cyan"
          containerClassName="border border-cyan/20 bg-cyan/10"
          actions={(isTranslationNavigator || isSimplificationNavigator || leaderSubgroupIds.length > 0)
            ? [
                { title: 'Advance One Workflow Stage', hint: 'Push one card from current stage to next review checkpoint.', href: '#kb-stage-actions', actionLabel: 'Open Stage Actions' },
                { title: 'Resolve One Task Bottleneck', hint: 'Reassign or clarify one blocked subgroup task today.', href: '#kb-tasks', actionLabel: 'Open Tasks' },
                { title: 'Capture Review Notes', hint: 'Leave one concrete quality note before stage approval.', href: '#kb-workflows', actionLabel: 'Open Workflow Cards' },
              ]
            : [
                { title: 'Follow One Workflow Card', hint: 'Track one topic and understand its current stage owner.', href: '#kb-workflows', actionLabel: 'Open Workflow Cards' },
                { title: 'Contribute One Suggestion', hint: 'Add a meaningful idea to improve translation or simplification quality.', href: '#kb-suggestions', actionLabel: 'Open Suggestions' },
                { title: 'Complete One Assigned Task', hint: 'Close one pending task to boost subgroup momentum.', href: '#kb-tasks', actionLabel: 'Open Tasks' },
              ]}
        />

        {(canCreateSubgroup || canCreateWorkflow) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {canCreateSubgroup && (
              <div className="glass-card rounded-2xl p-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Users size={17} className="text-cyan" />Create Subgroup</h2>
                <div className="mt-3 space-y-2">
                  <select
                    value={newSubgroup.section}
                    onChange={(e) => setNewSubgroup((p) => ({ ...p, section: e.target.value as Section }))}
                    className="w-full form-input rounded-xl px-3 py-2 text-sm border border-cyan/20 bg-dark/80"
                  >
                    <option value="translation">Translation</option>
                    <option value="simplification">Simplification</option>
                  </select>
                  <input
                    value={newSubgroup.name}
                    onChange={(e) => setNewSubgroup((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Subgroup name"
                    className="w-full form-input rounded-xl px-3 py-2 text-sm border border-cyan/20 bg-dark/80"
                  />
                  <select
                    value={newSubgroup.leader_id}
                    onChange={(e) => setNewSubgroup((p) => ({ ...p, leader_id: e.target.value }))}
                    className="w-full form-input rounded-xl px-3 py-2 text-sm border border-cyan/20 bg-dark/80"
                  >
                    <option value="">Select leader...</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <button onClick={createSubgroup} className="px-4 py-2 rounded-lg bg-cyan/20 text-cyan border border-cyan/30 text-sm font-semibold">Create Subgroup</button>
                </div>
              </div>
            )}

            {canCreateWorkflow && (
              <div className="glass-card rounded-2xl p-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><FileText size={17} className="text-cyan" />Create Workflow Card</h2>
                <div className="mt-3 space-y-2">
                  <input
                    value={newWorkflow.title_ar}
                    onChange={(e) => setNewWorkflow((p) => ({ ...p, title_ar: e.target.value }))}
                    placeholder="Arabic title"
                    className="w-full form-input rounded-xl px-3 py-2 text-sm border border-cyan/20 bg-dark/80"
                    dir="rtl"
                  />
                  <input
                    value={newWorkflow.title_en}
                    onChange={(e) => setNewWorkflow((p) => ({ ...p, title_en: e.target.value }))}
                    placeholder="English title (optional)"
                    className="w-full form-input rounded-xl px-3 py-2 text-sm border border-cyan/20 bg-dark/80"
                  />
                  <select
                    value={newWorkflow.translation_subgroup_id}
                    onChange={(e) => setNewWorkflow((p) => ({ ...p, translation_subgroup_id: e.target.value }))}
                    className="w-full form-input rounded-xl px-3 py-2 text-sm border border-cyan/20 bg-dark/80"
                  >
                    <option value="">Translation subgroup...</option>
                    {translationSubgroups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button onClick={createWorkflow} className="px-4 py-2 rounded-lg bg-cyan/20 text-cyan border border-cyan/30 text-sm font-semibold">Create Workflow</button>
                </div>
              </div>
            )}
          </div>
        )}

        {canManageSubgroups && subgroups.length > 0 && (
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Users size={17} className="text-cyan" />Subgroup Team Management</h2>
            <p className="text-xs text-slate-500 mt-1">Assign each subgroup leader and members. Leaders can manage their subgroup; section navigators can manage all subgroups in their section.</p>

            <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-3">
              {subgroups.map((subgroup) => {
                const canEdit = canManageSubgroup(subgroup);
                const leaderId = subgroupLeaderMap[subgroup.id] || '';
                const selectedMembers = subgroupMemberMap[subgroup.id] || [];

                return (
                  <div key={subgroup.id} className="p-4 rounded-xl border border-white/10 bg-dark/50">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-white">{subgroup.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide border ${subgroup.section === 'translation' ? 'text-cyan border-cyan/30 bg-cyan/10' : 'text-purple border-purple/30 bg-purple/10'}`}>
                        {subgroup.section}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <BlockAIAssistant blockSlug="knowledge-bridge" blockName="Knowledge Bridge" />

                      <select
                        value={leaderId}
                        onChange={(e) => setSubgroupLeaderMap((prev) => ({ ...prev, [subgroup.id]: e.target.value }))}
                        disabled={!canEdit}
                        className="w-full form-input rounded-xl px-3 py-2 text-sm border border-cyan/20 bg-dark/80 disabled:opacity-60"
                      >
                        <option value="">Select leader...</option>
                        {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>

                      <div className="max-h-36 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {members.map((member) => {
                          const checked = selectedMembers.includes(member.id);
                          return (
                            <label key={member.id} className="flex items-center gap-2 text-xs text-slate-300 p-2 rounded-lg border border-white/10 bg-dark/40">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={!canEdit}
                                onChange={() => toggleSubgroupMember(subgroup.id, member.id)}
                                className="w-3.5 h-3.5 rounded border-cyan/30 bg-dark"
                              />
                              <span className="truncate">{member.name}</span>
                            </label>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => saveSubgroupTeam(subgroup)}
                        disabled={!canEdit || savingSubgroupId === subgroup.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-cyan/30 text-cyan hover:bg-cyan/10 disabled:opacity-50"
                      >
                        {savingSubgroupId === subgroup.id ? 'Saving...' : 'Save Team'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div id="kb-workflows" className="glass-card rounded-2xl p-5 portal-reveal portal-stagger-2 panel-target">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Workflow size={17} className="text-cyan" />Workflow Cards</h2>
            <div className="mt-3 space-y-2 max-h-[28rem] overflow-y-auto pr-1">
              {workflows.length === 0 ? (
                <p className="text-sm text-slate-500">No workflow cards yet.</p>
              ) : (
                workflows.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setActiveWorkflowId(w.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${activeWorkflowId === w.id ? 'border-cyan/40 bg-cyan/10' : 'border-white/10 bg-dark/50 hover:border-white/20'}`}
                  >
                    <p className="text-sm font-semibold text-white" dir="rtl">{w.title_ar}</p>
                    <p className="text-xs text-slate-500 mt-1">{statusLabel[w.status]}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div id="kb-stage-actions" className="glass-card rounded-2xl p-5 portal-reveal portal-stagger-2 panel-target">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><ArrowRightLeft size={17} className="text-cyan" />Stage Actions</h2>
            {!activeWorkflow ? (
              <p className="mt-3 text-sm text-slate-500">Select a workflow card to view actions.</p>
            ) : (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-white" dir="rtl">{activeWorkflow.title_ar}</p>
                <p className="text-xs text-slate-500">Current: {statusLabel[activeWorkflow.status]}</p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {(isTranslationNavigator || leaderSubgroupIds.includes(activeWorkflow.translation_subgroup_id || '')) && (
                    <button onClick={() => runAction(activeWorkflow.id, 'submit_translation')} className="px-3 py-1.5 rounded-lg border border-cyan/30 text-cyan text-xs font-semibold hover:bg-cyan/10">Submit Translation</button>
                  )}

                  {isTranslationNavigator && (
                    <>
                      <button onClick={() => runAction(activeWorkflow.id, 'approve_translation')} className="px-3 py-1.5 rounded-lg border border-green-500/30 text-green-300 text-xs font-semibold hover:bg-green-500/10">Approve Translation</button>
                      <button onClick={() => runAction(activeWorkflow.id, 'request_translation_changes')} className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-500/10">Request Translation Changes</button>
                    </>
                  )}

                  {(isSimplificationNavigator || leaderSubgroupIds.includes(activeWorkflow.simplification_subgroup_id || '')) && (
                    <button onClick={() => runAction(activeWorkflow.id, 'submit_simplification')} className="px-3 py-1.5 rounded-lg border border-purple/30 text-purple text-xs font-semibold hover:bg-purple/10">Submit Simplification</button>
                  )}

                  {isSimplificationNavigator && (
                    <>
                      <button onClick={() => runAction(activeWorkflow.id, 'approve_simplification')} className="px-3 py-1.5 rounded-lg border border-green-500/30 text-green-300 text-xs font-semibold hover:bg-green-500/10">Approve Simplification</button>
                      <button onClick={() => runAction(activeWorkflow.id, 'request_simplification_changes')} className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-500/10">Request Simplification Changes</button>
                    </>
                  )}
                </div>

                {activeWorkflow.paper_id && (
                  <a href={`/knowledge-bridge/${activeWorkflow.paper_id}`} target="_blank" className="inline-flex items-center gap-2 text-xs text-cyan hover:underline mt-3">
                    <CheckCircle2 size={13} /> View published paper
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {activeWorkflow && (
          <div id="kb-tasks" className="glass-card rounded-2xl p-5 portal-reveal portal-stagger-3 panel-target">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Send size={16} className="text-cyan" />Subgroup Tasks</h2>
            {canManageTasks && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-2">
                <input
                  value={newTask.title}
                  onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Task title"
                  className="form-input rounded-xl px-3 py-2 text-sm border border-cyan/20 bg-dark/80"
                />
                <select
                  value={newTask.subgroup_id}
                  onChange={(e) => setNewTask((p) => ({ ...p, subgroup_id: e.target.value }))}
                  className="form-input rounded-xl px-3 py-2 text-sm border border-cyan/20 bg-dark/80"
                >
                  <option value="">Subgroup...</option>
                  {workflowSubgroupOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask((p) => ({ ...p, assigned_to: e.target.value }))}
                  className="form-input rounded-xl px-3 py-2 text-sm border border-cyan/20 bg-dark/80"
                >
                  <option value="">Assign to...</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <input
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask((p) => ({ ...p, deadline: e.target.value }))}
                  className="form-input rounded-xl px-3 py-2 text-sm border border-cyan/20 bg-dark/80"
                />
                <button onClick={createTask} className="px-3 py-2 rounded-lg bg-cyan/20 text-cyan border border-cyan/30 text-sm font-semibold md:col-span-5">Create</button>
              </div>
            )}

            <div className="mt-3 space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-slate-500">No tasks for this workflow card.</p>
              ) : (
                tasks.map((t) => (
                  <div key={t.id} className="p-3 rounded-xl border border-white/10 bg-dark/50 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-white">{t.title}</p>
                      <p className="text-xs text-slate-500">
                        {t.status}
                        {t.assignee?.name ? ` · ${t.assignee.name}` : ''}
                        {t.deadline ? ` · due ${new Date(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                      </p>
                    </div>
                    <select
                      value={t.status}
                      onChange={(e) => setTaskStatus(t.id, e.target.value as KbTask['status'])}
                      className="form-input rounded-lg px-2 py-1 text-xs border border-white/10 bg-dark/80"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <SuggestionsPanel panelId="kb-suggestions" blockSlug="knowledge-bridge" alphanautId={session.alphanaut_id} isNavigator={isTranslationNavigator || isSimplificationNavigator || isCoCaptain} />
      </div>
    </PortalLayout>
  );
}
