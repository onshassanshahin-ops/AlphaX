import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession, getPortalSession } from '@/lib/auth';
import { sendTaskAssignedEmail } from '@/lib/email';

// GET /api/tasks — fetch tasks for current alphanaut (or by block for navigator)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const block = searchParams.get('block');
  const assignedTo = searchParams.get('assigned_to');

  const adminSession = await getAdminSession();
  const portalSession = await getPortalSession();

  if (!adminSession && !portalSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let query = supabaseAdmin
    .from('block_tasks')
    .select(`
      *,
      assigned_to_alphanaut:alphanauts!block_tasks_assigned_to_fkey(id, name, avatar_url),
      assigned_by_alphanaut:alphanauts!block_tasks_assigned_by_fkey(id, name)
    `)
    .order('created_at', { ascending: false });

  if (block) query = query.eq('block_slug', block);
  if (assignedTo) query = query.eq('assigned_to', assignedTo);
  else if (portalSession && !adminSession) query = query.eq('assigned_to', portalSession.alphanaut_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ tasks: data });
}

// POST /api/tasks — create a task (navigator or admin only)
export async function POST(request: NextRequest) {
  const adminSession = await getAdminSession();
  const portalSession = await getPortalSession();

  if (!adminSession && !portalSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, block_slug, assigned_to, deadline, priority } = body;

    if (!title || !block_slug || !assigned_to) {
      return NextResponse.json({ error: 'title, block_slug, and assigned_to are required' }, { status: 400 });
    }

    const assigned_by = portalSession?.alphanaut_id || null;

    const { data, error } = await supabaseAdmin
      .from('block_tasks')
      .insert({ title, description, block_slug, assigned_to, assigned_by, deadline, priority: priority || 'normal' })
      .select(`
        *,
        assigned_to_alphanaut:alphanauts!block_tasks_assigned_to_fkey(id, name, email, avatar_url),
        assigned_by_alphanaut:alphanauts!block_tasks_assigned_by_fkey(id, name)
      `)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Send email notification if alphanaut has an email
    const assignee = data.assigned_to_alphanaut;
    if (assignee?.email) {
      const { data: blockData } = await supabaseAdmin
        .from('blocks')
        .select('name')
        .eq('slug', block_slug)
        .single();

      sendTaskAssignedEmail(
        assignee.email,
        assignee.name,
        title,
        blockData?.name || block_slug,
        deadline,
        description
      ).catch(console.error);
    }

    return NextResponse.json({ task: data });
  } catch {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
