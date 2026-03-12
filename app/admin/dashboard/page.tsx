import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';
import { Users, FileText, FlaskConical, ClipboardList, Bell, Activity, Settings, ArrowRight, Shield, Calendar } from 'lucide-react';
import AdminStatsCard from '@/components/admin/StatsCard';
import SignOutButton from '@/components/admin/SignOutButton';
import { formatRelativeDate } from '@/lib/utils';

async function getAdminStats() {
  const [alphanauts, papers, research, applications, activities] = await Promise.all([
    supabaseAdmin.from('alphanauts').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin.from('papers').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabaseAdmin.from('research_projects').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('volunteer_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('activity_log').select('*').order('created_at', { ascending: false }).limit(10),
  ]);

  return {
    alphanauts: alphanauts.count || 0,
    papers: papers.count || 0,
    research: research.count || 0,
    pendingApps: applications.count || 0,
    activities: activities.data || [],
  };
}

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin');

  const stats = await getAdminStats();

  const quickLinks = [
    { href: '/admin/dashboard/alphanauts', icon: Users, label: 'Manage Alphanauts', color: '#00B4D8', desc: 'Add, edit, and manage members' },
    { href: '/admin/dashboard/applications', icon: ClipboardList, label: 'Applications', color: '#FFD700', desc: `${stats.pendingApps} pending review`, badge: stats.pendingApps },
    { href: '/admin/dashboard/knowledge-bridge', icon: FileText, label: 'Knowledge Bridge', color: '#118AB2', desc: 'Review and publish papers' },
    { href: '/admin/dashboard/research', icon: FlaskConical, label: 'Research', color: '#9B59B6', desc: 'Manage research projects' },
    { href: '/admin/dashboard/announcements', icon: Bell, label: 'Announcements', color: '#FF6B35', desc: 'Create and publish news' },
    { href: '/admin/dashboard/blocks', icon: Settings, label: 'Blocks', color: '#4FC3F7', desc: 'Manage blocks and navigators' },
    { href: '/admin/dashboard/admins', icon: Shield, label: 'Admin Accounts', color: '#9B59B6', desc: 'Add or remove admin users' },
    { href: '/admin/dashboard/events', icon: Calendar, label: 'Events', color: '#FFD700', desc: 'Manage workshops and talks' },
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top Bar */}
      <nav className="bg-dark border-b border-cyan/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-navy flex items-center justify-center font-bold text-white text-sm font-grotesk">
            AX
          </div>
          <div>
            <span className="font-bold font-grotesk text-white">AlphaX Admin</span>
            <span className="text-slate-500 text-xs ml-2">/{session.username}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" target="_blank" className="text-sm text-slate-400 hover:text-cyan transition-colors">
            View Site ↗
          </Link>
          <SignOutButton />
        </div>
      </nav>

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome */}
          <div>
            <h1 className="text-3xl font-bold font-grotesk text-white mb-1">
              Dashboard
            </h1>
            <p className="text-slate-400">Welcome back, {session.name || session.username}.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminStatsCard label="Active Alphanauts" value={stats.alphanauts} icon={Users} color="#00B4D8" />
            <AdminStatsCard label="Papers Published" value={stats.papers} icon={FileText} color="#118AB2" />
            <AdminStatsCard label="Research Projects" value={stats.research} icon={FlaskConical} color="#9B59B6" />
            <AdminStatsCard
              label="Pending Applications"
              value={stats.pendingApps}
              icon={ClipboardList}
              color="#FFD700"
              change={stats.pendingApps > 0 ? `${stats.pendingApps} new` : undefined}
              changePositive={false}
            />
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-xl font-bold font-grotesk text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="glass-card rounded-xl p-5 flex items-center gap-4 hover:border-cyan/30 transition-all duration-200 group"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${link.color}20`, border: `1px solid ${link.color}40` }}
                  >
                    <link.icon size={22} style={{ color: link.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{link.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{link.desc}</p>
                  </div>
                  {link.badge ? (
                    <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold flex items-center justify-center">
                      {link.badge}
                    </span>
                  ) : (
                    <ArrowRight size={16} className="text-slate-600 group-hover:text-cyan transition-colors" />
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-bold font-grotesk text-white mb-5 flex items-center gap-2">
              <Activity size={20} className="text-cyan" />
              Recent Activity
            </h2>
            {stats.activities.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {stats.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-dark/50 border border-white/5"
                  >
                    <div className="w-2 h-2 rounded-full bg-cyan shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 capitalize">
                        {activity.action.replace(/_/g, ' ')}
                        {activity.details && typeof activity.details === 'object' &&
                          'name' in activity.details &&
                          <span className="text-white"> — {String(activity.details.name)}</span>
                        }
                      </p>
                    </div>
                    <span className="text-xs text-slate-600 shrink-0">
                      {formatRelativeDate(activity.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
