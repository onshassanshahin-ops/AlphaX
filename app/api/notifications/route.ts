import { NextResponse } from 'next/server';
import { getPortalSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

interface NotificationItem {
  id: string;
  kind: 'deadline' | 'approval' | 'announcement' | 'assignment';
  title: string;
  message: string;
  created_at: string;
  href?: string;
}

export async function GET() {
  const session = await getPortalSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const [tasksRes, suggestionsRes, announcementsRes, assignmentActivitiesRes] = await Promise.all([
    supabaseAdmin
      .from('block_tasks')
      .select('id, title, deadline, block_slug')
      .eq('assigned_to', session.alphanaut_id)
      .neq('status', 'done')
      .not('deadline', 'is', null)
      .lte('deadline', in7Days)
      .order('deadline', { ascending: true })
      .limit(6),
    supabaseAdmin
      .from('block_suggestions')
      .select('id, title, status, updated_at, block_slug')
      .eq('created_by', session.alphanaut_id)
      .in('status', ['approved', 'implemented'])
      .order('updated_at', { ascending: false })
      .limit(5),
    supabaseAdmin
      .from('announcements')
      .select('id, title, published_at, created_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(5),
    supabaseAdmin
      .from('activity_log')
      .select('id, action, details, created_at')
      .eq('action', 'block_task_created')
      .eq('details->>assigned_to', session.alphanaut_id)
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  const notifications: NotificationItem[] = [];

  for (const t of tasksRes.data || []) {
    notifications.push({
      id: `deadline-${t.id}`,
      kind: 'deadline',
      title: 'Task deadline approaching',
      message: `${t.title} is due by ${new Date(t.deadline).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })}`,
      created_at: t.deadline,
      href: '/portal/dashboard',
    });
  }

  for (const s of suggestionsRes.data || []) {
    notifications.push({
      id: `suggestion-${s.id}`,
      kind: 'approval',
      title: 'Suggestion updated',
      message: `${s.title} is now ${String(s.status).replace('_', ' ')}`,
      created_at: s.updated_at || new Date().toISOString(),
      href: '/portal/dashboard',
    });
  }

  for (const a of announcementsRes.data || []) {
    notifications.push({
      id: `announcement-${a.id}`,
      kind: 'announcement',
      title: 'New announcement',
      message: a.title,
      created_at: a.published_at || a.created_at,
      href: '/announcements',
    });
  }

  for (const ac of assignmentActivitiesRes.data || []) {
    const details = (ac.details || {}) as Record<string, string>;
    notifications.push({
      id: `assignment-${ac.id}`,
      kind: 'assignment',
      title: 'New task assignment',
      message: details.title || 'A new task was assigned to you',
      created_at: ac.created_at,
      href: '/portal/dashboard',
    });
  }

  notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ notifications: notifications.slice(0, 20) });
}
