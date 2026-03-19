import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession, getPortalSession } from '@/lib/auth';
import { sendTaskAssignedEmail } from '@/lib/email';
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

function canAccessBlock(session: NonNullable<Awaited<ReturnType<typeof getPortalSession>>>, blockSlug: string) {
  const normalized = normalizeBlockSlug(blockSlug);
  if (session.role === 'co-captain') return true;
  if (normalized === 'asclepius-lab') {
    return session.blocks.includes('asclepius-lab') || session.blocks.includes('neuroscience');
  }
  return session.blocks.includes(normalized);
}

function canManageBlockTasks(session: NonNullable<Awaited<ReturnType<typeof getPortalSession>>>, blockSlug: string) {
  const normalized = normalizeBlockSlug(blockSlug);
  if (session.role === 'co-captain') return true;
  if (normalized === 'asclepius-lab') {
    return session.navigatorBlocks.includes('asclepius-lab') || session.navigatorBlocks.includes('neuroscience');
  }
  return session.navigatorBlocks.includes(normalized);
}

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

  if (!adminSession && portalSession && block && !canAccessBlock(portalSession, block)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!adminSession && portalSession && block && assignedTo && assignedTo !== portalSession.alphanaut_id) {
    if (!canManageBlockTasks(portalSession, block)) {
      return NextResponse.json({ error: 'Only navigators can query other assignees in this block.' }, { status: 403 });
    }
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

  const limiter = await checkWriteRateLimit(
    request,
    'rate_limit:block_task_create',
    adminSession ? 'admin' : 'alphanaut',
    adminSession?.admin_id || portalSession?.alphanaut_id || null,
    30,
    10
  );
  if (!limiter.allowed) return limiter.response!;

  try {
    const body = await request.json();
    const { title, description, block_slug, assigned_to, deadline, priority } = body;

    if (!title || !block_slug || !assigned_to) {
      return NextResponse.json({ error: 'title, block_slug, and assigned_to are required' }, { status: 400 });
    }

    const normalizedBlockSlug = normalizeBlockSlug(block_slug);

    if (!adminSession && portalSession) {
      if (!canManageBlockTasks(portalSession, normalizedBlockSlug)) {
        return NextResponse.json({ error: 'Only block navigators can assign tasks.' }, { status: 403 });
      }
    }

    const { data: assigneeMembership } = await supabaseAdmin
      .from('alphanaut_blocks')
      .select('block_id, blocks!inner(slug)')
      .eq('alphanaut_id', assigned_to)
      .eq('blocks.slug', normalizedBlockSlug)
      .limit(1);

    if (!assigneeMembership || assigneeMembership.length === 0) {
      return NextResponse.json({ error: 'Assignee must be a member of the selected block.' }, { status: 400 });
    }

    const assigned_by = portalSession?.alphanaut_id || null;

    const { data, error } = await supabaseAdmin
      .from('block_tasks')
      .insert({ title, description, block_slug: normalizedBlockSlug, assigned_to, assigned_by, deadline, priority: priority || 'normal' })
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
        .eq('slug', normalizedBlockSlug)
        .single();

      sendTaskAssignedEmail(
        assignee.email,
        assignee.name,
        title,
        blockData?.name || normalizedBlockSlug,
        deadline,
        description
      ).catch(console.error);
    }

    await logActivity({
      actorType: adminSession ? 'admin' : 'alphanaut',
      actorId: adminSession?.admin_id || portalSession?.alphanaut_id || null,
      action: 'block_task_created',
      entityType: 'block_task',
      entityId: data.id,
      details: {
        block_slug: normalizedBlockSlug,
        assigned_to: assigned_to,
        priority: priority || 'normal',
        deadline: deadline || null,
      },
    });

    return NextResponse.json({ task: data });
  } catch {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
