import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import PortalLayout from '@/components/layout/PortalLayout';
import BlockCard from '@/components/portal/BlockCard';
import { BLOCKS_CONFIG } from '@/types';
import { formatRelativeDate, formatRole } from '@/lib/utils';
import { Bell, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import type { Announcement, ActivityLog } from '@/types';

async function getDashboardData(alphanautId: string) {
  const [alphanautRes, activityRes, blocksRes, announcementsRes, tasksRes] = await Promise.all([
    supabaseAdmin
      .from('alphanauts')
      .select(`
        *,
        alphanaut_blocks (
          role, joined_at,
          blocks (slug, name, color, icon)
        )
      `)
      .eq('id', alphanautId)
      .single(),
    supabaseAdmin
      .from('activity_log')
      .select('*')
      .eq('actor_id', alphanautId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabaseAdmin
      .from('blocks')
      .select('slug, name, description, icon, color')
      .eq('is_active', true),
    supabaseAdmin
      .from('announcements')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(5),
    supabaseAdmin
      .from('block_tasks')
      .select('id, title, deadline, priority, status, block_slug')
      .eq('assigned_to', alphanautId)
      .in('status', ['pending', 'in_progress'])
      .order('deadline', { ascending: true })
      .limit(5),
  ]);

  return {
    alphanaut: alphanautRes.data,
    activities: activityRes.data || [],
    blocks: blocksRes.data || [],
    announcements: announcementsRes.data || [],
    pendingTasks: tasksRes.data || [],
  };
}

export default async function PortalDashboardPage() {
  const session = await getPortalSession();
  if (!session) redirect('/portal');

  const { alphanaut, activities, blocks, announcements, pendingTasks } = await getDashboardData(
    session.alphanaut_id
  );

  const memberBlocks = (alphanaut?.alphanaut_blocks || []).reduce(
    (acc: Record<string, string>, ab: { blocks?: { slug?: string }; role?: string }) => {
      if (ab.blocks?.slug) acc[ab.blocks.slug] = ab.role || 'member';
      return acc;
    },
    {}
  );

  const roleColors: Record<string, string> = {
    'co-captain': 'text-gold',
    navigator: 'text-cyan',
    alphanaut: 'text-purple',
  };

  return (
    <PortalLayout session={session}>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl p-7 bg-gradient-to-r from-navy via-dark to-charcoal border border-cyan/20">
          <div className="absolute inset-0 hero-grid opacity-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-cyan/5 to-transparent pointer-events-none" />
          <div className="relative">
            <p className="text-slate-400 text-sm mb-1">Welcome back</p>
            <h1 className="text-3xl font-bold font-grotesk text-white mb-2">
              {alphanaut?.name || session.name}
            </h1>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-semibold ${roleColors[session.role] || 'text-slate-400'}`}
              >
                {formatRole(session.role)}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-sm text-slate-500">
                {session.blocks.length} block{session.blocks.length !== 1 ? 's' : ''}
              </span>
              {alphanaut?.university && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-sm text-slate-500">{alphanaut.university}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Blocks Grid */}
        <div>
          <h2 className="text-lg font-bold font-grotesk text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-cyan/20 flex items-center justify-center text-xs text-cyan font-bold">7</span>
            Your Blocks
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {BLOCKS_CONFIG.map((blockConfig) => {
              const memberRole = memberBlocks[blockConfig.slug];
              // Research blocks: asclepius-lab and neuroscience both go to /research portal
              const hasResearchAccess =
                blockConfig.slug === 'asclepius-lab' || blockConfig.slug === 'neuroscience'
                  ? session.blocks.includes('asclepius-lab') || session.blocks.includes('neuroscience')
                  : false;

              const isUnlocked =
                session.role === 'co-captain' ||
                !!memberBlocks[blockConfig.slug] ||
                (blockConfig.slug === 'neuroscience' && hasResearchAccess);

              return (
                <BlockCard
                  key={blockConfig.slug}
                  slug={blockConfig.slug}
                  name={blockConfig.name}
                  icon={blockConfig.icon}
                  color={blockConfig.color}
                  description={blockConfig.description}
                  portalPath={blockConfig.portalPath}
                  isUnlocked={isUnlocked}
                  memberRole={memberRole}
                />
              );
            })}
          </div>
        </div>

        {/* Pending Tasks Widget */}
        {pendingTasks.length > 0 && (
          <div className="glass-card rounded-2xl p-6 border border-yellow-500/10">
            <h3 className="font-bold font-grotesk text-white mb-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-yellow-400" />
              Pending Tasks
              <span className="ml-auto text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                {pendingTasks.length} open
              </span>
            </h3>
            <div className="space-y-2">
              {pendingTasks.map((task: { id: string; title: string; deadline?: string; priority: string; status: string; block_slug: string }) => {
                const isOverdue = task.deadline && new Date(task.deadline) < new Date();
                const priorityColors: Record<string, string> = { low: '#94a3b8', normal: '#00B4D8', high: '#FFD700', urgent: '#FF4444' };
                return (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-dark/50 border border-white/5">
                    <div className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: priorityColors[task.priority] || '#94a3b8' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{task.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5 capitalize">{task.block_slug.replace(/-/g, ' ')}</p>
                    </div>
                    {task.deadline && (
                      <span className={`text-xs flex items-center gap-1 shrink-0 ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                        <AlertCircle size={11} />
                        {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Announcements */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-bold font-grotesk text-white mb-4 flex items-center gap-2">
              <Bell size={18} className="text-gold" />
              Latest Announcements
            </h3>
            {announcements.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">No announcements yet</p>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 4).map((a: Announcement) => (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-dark/50 border border-white/5 hover:border-cyan/20 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${a.type === 'urgent' ? 'bg-red-400' : a.type === 'volunteer' ? 'bg-green-400' : 'bg-cyan'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{a.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatRelativeDate(a.published_at || a.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-bold font-grotesk text-white mb-4 flex items-center gap-2">
              <Activity size={18} className="text-cyan" />
              Your Activity
            </h3>
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm mb-2">No activity yet</p>
                <p className="text-xs text-slate-600">
                  Your contributions will appear here as you work in your blocks.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 5).map((a: ActivityLog) => (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-dark/50 border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-purple mt-2 shrink-0" />
                    <div>
                      <p className="text-sm text-slate-300 capitalize">
                        {a.action.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatRelativeDate(a.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
