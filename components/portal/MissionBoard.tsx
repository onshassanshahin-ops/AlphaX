import { supabaseAdmin } from '@/lib/supabase';
import { Trophy, Target, Lightbulb, Star, Zap, BookOpen, CheckCircle2 } from 'lucide-react';

interface Props {
  alphanautId: string;
  blockSlugs: string[];
}

interface MissionStats {
  tasksCompleted: number;
  tasksTotal: number;
  suggestionsApproved: number;
  suggestionsTotal: number;
  kbTasksCompleted: number;
  researchContributions: number;
}

interface Achievement {
  id: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  unlocked: boolean;
}

function computeScore(s: MissionStats): number {
  return (
    s.tasksCompleted * 10 +
    s.suggestionsApproved * 25 +
    s.kbTasksCompleted * 15 +
    s.researchContributions * 50
  );
}

function getRank(score: number): { label: string; color: string; next: number; nextLabel: string } {
  if (score >= 500) return { label: 'Alpha Pioneer', color: '#FFD700', next: 9999, nextLabel: '' };
  if (score >= 300) return { label: 'Core Researcher', color: '#00B4D8', next: 500, nextLabel: 'Alpha Pioneer' };
  if (score >= 150) return { label: 'Alpha Builder', color: '#9B59B6', next: 300, nextLabel: 'Core Researcher' };
  if (score >= 50) return { label: 'Contributor', color: '#4FC3F7', next: 150, nextLabel: 'Alpha Builder' };
  return { label: 'Explorer', color: '#94a3b8', next: 50, nextLabel: 'Contributor' };
}

async function getMissionStats(alphanautId: string): Promise<MissionStats> {
  const [tasksRes, tasksAllRes, suggestionsRes, suggestionsAllRes, kbTasksRes, researchRes] =
    await Promise.all([
      supabaseAdmin
        .from('block_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', alphanautId)
        .eq('status', 'done'),
      supabaseAdmin
        .from('block_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', alphanautId),
      supabaseAdmin
        .from('block_suggestions')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', alphanautId)
        .in('status', ['approved', 'implemented']),
      supabaseAdmin
        .from('block_suggestions')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', alphanautId),
      supabaseAdmin
        .from('kb_subgroup_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', alphanautId)
        .eq('status', 'done'),
      supabaseAdmin
        .from('research_authors')
        .select('id', { count: 'exact', head: true })
        .eq('alphanaut_id', alphanautId),
    ]);

  return {
    tasksCompleted: tasksRes.count || 0,
    tasksTotal: tasksAllRes.count || 0,
    suggestionsApproved: suggestionsRes.count || 0,
    suggestionsTotal: suggestionsAllRes.count || 0,
    kbTasksCompleted: kbTasksRes.count || 0,
    researchContributions: researchRes.count || 0,
  };
}

export default async function MissionBoard({ alphanautId }: Props) {
  const stats = await getMissionStats(alphanautId);
  const score = computeScore(stats);
  const rank = getRank(score);
  const progressPct =
    rank.next === 9999 ? 100 : Math.min(100, Math.round((score / rank.next) * 100));

  const achievements: Achievement[] = [
    {
      id: 'first_task',
      label: 'First Step',
      desc: 'Completed your first task',
      icon: CheckCircle2,
      color: '#00B4D8',
      unlocked: stats.tasksCompleted >= 1,
    },
    {
      id: 'taskmaster',
      label: 'Taskmaster',
      desc: 'Completed 5+ tasks',
      icon: Target,
      color: '#FFD700',
      unlocked: stats.tasksCompleted >= 5,
    },
    {
      id: 'idea_spark',
      label: 'Idea Spark',
      desc: 'Submitted your first suggestion',
      icon: Lightbulb,
      color: '#FF6B35',
      unlocked: stats.suggestionsTotal >= 1,
    },
    {
      id: 'approved',
      label: 'Approved!',
      desc: 'Got a suggestion approved',
      icon: Star,
      color: '#9B59B6',
      unlocked: stats.suggestionsApproved >= 1,
    },
    {
      id: 'kb_hero',
      label: 'KB Hero',
      desc: 'Completed 3+ KB workflow tasks',
      icon: BookOpen,
      color: '#118AB2',
      unlocked: stats.kbTasksCompleted >= 3,
    },
    {
      id: 'researcher',
      label: 'Researcher',
      desc: 'Co-authored a research paper',
      icon: Zap,
      color: '#4FC3F7',
      unlocked: stats.researchContributions >= 1,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="glass-card rounded-2xl p-6 border border-yellow-500/10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center border border-yellow-500/20">
          <Trophy size={20} className="text-yellow-400" />
        </div>
        <div>
          <h3 className="font-bold font-grotesk text-white">Mission Board</h3>
          <p className="text-xs text-slate-500">Your AlphaX contribution record</p>
        </div>
        <div className="ml-auto text-right">
          <p
            className="text-lg font-bold font-grotesk"
            style={{ color: rank.color }}
          >
            {rank.label}
          </p>
          <p className="text-xs text-slate-500">{score} XP</p>
        </div>
      </div>

      {/* XP Progress Bar */}
      {rank.next !== 9999 && (
        <div className="mb-5">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>{score} XP</span>
            <span>
              {rank.next} XP · {rank.nextLabel}
            </span>
          </div>
          <div className="h-2 rounded-full bg-dark border border-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${rank.color}80, ${rank.color})`,
              }}
            />
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Tasks Done', value: stats.tasksCompleted, total: stats.tasksTotal, color: '#00B4D8' },
          { label: 'Approved Ideas', value: stats.suggestionsApproved, total: stats.suggestionsTotal, color: '#9B59B6' },
          { label: 'KB Tasks Done', value: stats.kbTasksCompleted, total: null, color: '#118AB2' },
          { label: 'Research Papers', value: stats.researchContributions, total: null, color: '#FFD700' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-dark/50 border border-white/5 p-3 text-center"
          >
            <p className="text-2xl font-bold font-grotesk" style={{ color: stat.color }}>
              {stat.value}
              {stat.total !== null && (
                <span className="text-sm font-normal text-slate-600">/{stat.total}</span>
              )}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div>
        <p className="text-xs text-slate-600 uppercase tracking-widest font-medium mb-3">
          Achievements · {unlockedCount}/{achievements.length}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                a.unlocked
                  ? 'border-white/10 bg-dark/50'
                  : 'border-white/5 bg-dark/20 opacity-40'
              }`}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: a.unlocked ? `${a.color}20` : '#ffffff08',
                  border: `1px solid ${a.unlocked ? a.color + '40' : '#ffffff10'}`,
                }}
              >
                <a.icon
                  size={15}
                  style={{ color: a.unlocked ? a.color : '#475569' }}
                />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-xs font-semibold truncate ${
                    a.unlocked ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {a.label}
                </p>
                <p className="text-xs text-slate-600 truncate">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
