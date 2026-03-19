import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession, getPortalSession } from '@/lib/auth';
import { checkWriteRateLimit, logActivity } from '@/lib/api-guard';

const BLOCK_SLUG_ALIASES: Record<string, string> = {
  communication: 'science-comm',
  'science-communication': 'science-comm',
  science_comm: 'science-comm',
  operation: 'operations',
  ops: 'operations',
  creative: 'creative-lab',
  creative_lab: 'creative-lab',
};

function normalizeBlockSlug(slug?: string | null): string {
  const normalized = (slug || '').trim().toLowerCase();
  return BLOCK_SLUG_ALIASES[normalized] || normalized;
}

function isBlockNavigator(session: NonNullable<Awaited<ReturnType<typeof getPortalSession>>>, blockSlug: string) {
  const normalized = normalizeBlockSlug(blockSlug);
  if (session.role === 'co-captain') return true;
  if (normalized === 'asclepius-lab') {
    return session.navigatorBlocks.includes('asclepius-lab') || session.navigatorBlocks.includes('neuroscience');
  }
  return session.navigatorBlocks.includes(normalized);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const adminSession = await getAdminSession();
  const portalSession = await getPortalSession();

  if (!adminSession && !portalSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limiter = await checkWriteRateLimit(
    request,
    'rate_limit:block_task_update',
    adminSession ? 'admin' : 'alphanaut',
    adminSession?.admin_id || portalSession?.alphanaut_id || null,
    60,
    10
  );
  if (!limiter.allowed) return limiter.response!;

  try {
    const { data: task } = await supabaseAdmin
      .from('block_tasks')
      .select('id, block_slug, assigned_to')
      .eq('id', params.id)
      .single();

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await request.json();
    const allowed = ['status', 'title', 'description', 'deadline', 'priority'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (!adminSession && portalSession) {
      const navigator = isBlockNavigator(portalSession, task.block_slug);
      const isAssignee = task.assigned_to === portalSession.alphanaut_id;

      if (!navigator) {
        if (!isAssignee) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const statusOnly = Object.keys(updates).every((k) => k === 'status');
        if (!statusOnly) {
          return NextResponse.json({ error: 'You can only update your task status.' }, { status: 403 });
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('block_tasks')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logActivity({
      actorType: adminSession ? 'admin' : 'alphanaut',
      actorId: adminSession?.admin_id || portalSession?.alphanaut_id || null,
      action: 'block_task_updated',
      entityType: 'block_task',
      entityId: params.id,
      details: updates,
    });

    return NextResponse.json({ task: data });
  } catch {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const adminSession = await getAdminSession();
  const portalSession = await getPortalSession();

  if (!adminSession && !portalSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limiter = await checkWriteRateLimit(
    request,
    'rate_limit:block_task_delete',
    adminSession ? 'admin' : 'alphanaut',
    adminSession?.admin_id || portalSession?.alphanaut_id || null,
    30,
    10
  );
  if (!limiter.allowed) return limiter.response!;

  if (!adminSession && portalSession) {
    const { data: task } = await supabaseAdmin
      .from('block_tasks')
      .select('id, block_slug')
      .eq('id', params.id)
      .single();

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (!isBlockNavigator(portalSession, task.block_slug)) {
      return NextResponse.json({ error: 'Only navigators can delete tasks.' }, { status: 403 });
    }
  }

  const { error } = await supabaseAdmin.from('block_tasks').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logActivity({
    actorType: adminSession ? 'admin' : 'alphanaut',
    actorId: adminSession?.admin_id || portalSession?.alphanaut_id || null,
    action: 'block_task_deleted',
    entityType: 'block_task',
    entityId: params.id,
  });

  return NextResponse.json({ success: true });
}
