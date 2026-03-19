import { supabaseAdmin } from '@/lib/supabase';
import { Users, AlertTriangle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

interface Props {
  blockSlug: string;
  blockName: string;
  blockColor: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  tasksTotal: number;
  tasksDone: number;
  lastActive: string | null;
}

interface OverdueTask {
  id: string;
  title: string;
  deadline: string;
  assignee: string | null;
  priority: string;
}

async function getTeamHealth(blockSlug: string) {
  const blockRes = await supabaseAdmin
    .from('blocks')
    .select('id')
    .eq('slug', blockSlug)
    .single();

  if (!blockRes.data) return null;
  const blockId = blockRes.data.id;

  const [membersRes, tasksRes, overdueRes] = await Promise.all([
    supabaseAdmin
      .from('alphanaut_blocks')
      .select('role, alphanaut:alphanaut_id (id, name)')
      .eq('block_id', blockId),
    supabaseAdmin
      .from('block_tasks')
      .select('id, assigned_to, status, deadline, title, priority')
      .eq('block_slug', blockSlug),
    supabaseAdmin
      .from('block_tasks')
      .select(
        `id, title, deadline, priority,
         assignee:assigned_to (name)`
      )
      .eq('block_slug', blockSlug)
      .neq('status', 'done')
      .lt('deadline', new Date().toISOString())
      .order('deadline', { ascending: true })
      .limit(8),
  ]);

  const tasks = tasksRes.data || [];
  const members = membersRes.data || [];

  // Build per-member stats
  const memberStats: TeamMember[] = members
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((m: any) => {
      const alphanaut = Array.isArray(m.alphanaut) ? m.alphanaut[0] : m.alphanaut;
      if (!alphanaut) return null;
      const myTasks = tasks.filter((t) => t.assigned_to === alphanaut.id);
      const doneTasks = myTasks.filter((t) => t.status === 'done');

      // Last activity proxy: most recent deadline of a done task
      const lastDone = doneTasks
        .filter((t) => t.deadline)
        .sort((a, b) => new Date(b.deadline!).getTime() - new Date(a.deadline!).getTime())[0];

      return {
        id: alphanaut.id,
        name: alphanaut.name,
        role: m.role,
        tasksTotal: myTasks.length,
        tasksDone: doneTasks.length,
        lastActive: lastDone?.deadline ?? null,
      } satisfies TeamMember;
    })
    .filter(Boolean) as TeamMember[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overdueItems: OverdueTask[] = (overdueRes.data || []).map((t: any) => ({
    id: t.id,
    title: t.title,
    deadline: t.deadline,
    assignee: Array.isArray(t.assignee) ? t.assignee[0]?.name ?? null : t.assignee?.name ?? null,
    priority: t.priority,
  }));

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const inactiveDays = 14;
  const cutoff = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000);
  const inactiveMembers = memberStats.filter(
    (m) => m.tasksDone === 0 && (!m.lastActive || new Date(m.lastActive) < cutoff)
  );

  return {
    memberStats,
    overdueItems,
    totalTasks,
    doneTasks,
    completionRate,
    inactiveMembers,
    totalMembers: members.length,
  };
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#FF4444',
  high: '#FFD700',
  normal: '#00B4D8',
  low: '#94a3b8',
};

export default async function TeamHealthPanel({ blockSlug, blockName, blockColor }: Props) {
  const health = await getTeamHealth(blockSlug);

  if (!health) return null;

  const { memberStats, overdueItems, totalTasks, doneTasks, completionRate, inactiveMembers } =
    health;

  return (
    <div
      className="glass-card rounded-2xl p-6 border space-y-6"
      style={{ borderColor: `${blockColor}20` }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center border"
          style={{ backgroundColor: `${blockColor}15`, borderColor: `${blockColor}30` }}
        >
          <TrendingUp size={18} style={{ color: blockColor }} />
        </div>
        <div>
          <h3 className="font-bold font-grotesk text-white">Team Health</h3>
          <p className="text-xs text-slate-500">{blockName} · Navigator view</p>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-dark/50 border border-white/5 p-3 text-center">
          <p
            className="text-xl font-bold font-grotesk"
            style={{ color: blockColor }}
          >
            {completionRate}%
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Task Completion</p>
        </div>
        <div className="rounded-xl bg-dark/50 border border-white/5 p-3 text-center">
          <p className="text-xl font-bold font-grotesk text-white">
            {doneTasks}/{totalTasks}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Tasks Done</p>
        </div>
        <div className="rounded-xl bg-dark/50 border border-white/5 p-3 text-center">
          <p
            className={`text-xl font-bold font-grotesk ${
              overdueItems.length > 0 ? 'text-red-400' : 'text-green-400'
            }`}
          >
            {overdueItems.length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Overdue</p>
        </div>
      </div>

      {/* Completion bar */}
      <div>
        <div className="h-2 rounded-full bg-dark border border-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${completionRate}%`,
              background: `linear-gradient(90deg, ${blockColor}80, ${blockColor})`,
            }}
          />
        </div>
      </div>

      {/* Overdue tasks */}
      {overdueItems.length > 0 && (
        <div>
          <p className="text-xs text-red-400 uppercase tracking-widest font-medium mb-2 flex items-center gap-1.5">
            <AlertTriangle size={11} />
            Overdue Tasks ({overdueItems.length})
          </p>
          <div className="space-y-2">
            {overdueItems.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-dark/50 border border-red-500/10"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: PRIORITY_COLORS[task.priority] || '#94a3b8' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{task.title}</p>
                  {task.assignee && (
                    <p className="text-xs text-slate-500">{task.assignee}</p>
                  )}
                </div>
                <span className="text-xs text-red-400 shrink-0 flex items-center gap-1">
                  <Clock size={11} />
                  {new Date(task.deadline).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member activity */}
      <div>
        <p className="text-xs text-slate-600 uppercase tracking-widest font-medium mb-2 flex items-center gap-1.5">
          <Users size={11} />
          Team Members ({memberStats.length})
        </p>
        <div className="space-y-2">
          {memberStats.slice(0, 8).map((m) => {
            const pct = m.tasksTotal > 0 ? Math.round((m.tasksDone / m.tasksTotal) * 100) : 0;
            const isInactive = inactiveMembers.some((im) => im.id === m.id);
            return (
              <div
                key={m.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                  isInactive
                    ? 'bg-yellow-500/5 border-yellow-500/10'
                    : 'bg-dark/50 border-white/5'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-dark border border-white/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-slate-400">
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white truncate">{m.name}</p>
                    {m.role === 'navigator' && (
                      <span className="text-xs text-cyan bg-cyan/10 px-1.5 py-0.5 rounded-md font-medium">
                        nav
                      </span>
                    )}
                    {isInactive && (
                      <span className="text-xs text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded-md">
                        idle
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 rounded-full bg-dark border border-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isInactive ? '#EAB308' : blockColor,
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 shrink-0">
                      {m.tasksDone}/{m.tasksTotal}
                    </span>
                  </div>
                </div>
                {m.tasksDone > 0 ? (
                  <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                ) : (
                  <Clock size={14} className="text-slate-600 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
