import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkWriteRateLimit, logActivity } from '@/lib/api-guard';
import {
  getKbAuthContext,
  isSectionNavigator,
  isSubgroupLeader,
} from '../_utils';

export async function GET(request: NextRequest) {
  const { adminSession, portalSession, userId, isKbPortalUser } = await getKbAuthContext();
  if (!adminSession && !isKbPortalUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workflowId = searchParams.get('workflowId');
  const subgroupId = searchParams.get('subgroupId');

  let query = supabaseAdmin
    .from('kb_subgroup_tasks')
    .select(`
      *,
      assignee:assigned_to(id, name),
      assigner:assigned_by(id, name),
      subgroup:subgroup_id(id, name, section)
    `)
    .order('created_at', { ascending: false });

  if (workflowId) query = query.eq('workflow_id', workflowId);
  if (subgroupId) query = query.eq('subgroup_id', subgroupId);

  if (!adminSession && portalSession && userId && portalSession.role !== 'co-captain') {
    const isTranslationNav = await isSectionNavigator(userId, 'translation');
    const isSimplificationNav = await isSectionNavigator(userId, 'simplification');

    if (!isTranslationNav && !isSimplificationNav) {
      // Leaders should see tasks for their subgroup(s); members see their own assigned tasks.
      if (subgroupId) {
        const canLeadSubgroup = await isSubgroupLeader(userId, subgroupId);
        if (!canLeadSubgroup) {
          query = query.eq('assigned_to', userId);
        }
      } else if (workflowId) {
        const { data: workflow } = await supabaseAdmin
          .from('kb_workflows')
          .select('translation_subgroup_id, simplification_subgroup_id')
          .eq('id', workflowId)
          .single();

        const leaderChecks = await Promise.all([
          workflow?.translation_subgroup_id ? isSubgroupLeader(userId, workflow.translation_subgroup_id) : Promise.resolve(false),
          workflow?.simplification_subgroup_id ? isSubgroupLeader(userId, workflow.simplification_subgroup_id) : Promise.resolve(false),
        ]);

        const canLeadWorkflowSubgroup = leaderChecks.some(Boolean);
        if (!canLeadWorkflowSubgroup) {
          query = query.eq('assigned_to', userId);
        }
      } else {
        const { data: leadRows } = await supabaseAdmin
          .from('kb_subgroups')
          .select('id')
          .eq('leader_id', userId);

        const leaderSubgroupIds = (leadRows || []).map((row: { id: string }) => row.id);
        if (leaderSubgroupIds.length > 0) {
          query = query.in('subgroup_id', leaderSubgroupIds);
        } else {
          query = query.eq('assigned_to', userId);
        }
      }
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: data || [] });
}

export async function POST(request: NextRequest) {
  const { adminSession, portalSession, userId, isKbPortalUser } = await getKbAuthContext();
  if (!adminSession && !isKbPortalUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limiter = await checkWriteRateLimit(
    request,
    'rate_limit:kb_task_create',
    adminSession ? 'admin' : 'alphanaut',
    adminSession?.admin_id || userId,
    40,
    10
  );
  if (!limiter.allowed) return limiter.response!;

  try {
    const body = await request.json();
    const workflowId = body.workflow_id as string;
    const subgroupId = body.subgroup_id as string;
    const title = body.title as string;
    const description = body.description || null;
    const assignedTo = body.assigned_to as string;
    const deadline = body.deadline || null;

    if (!workflowId || !subgroupId || !title || !assignedTo) {
      return NextResponse.json({ error: 'workflow_id, subgroup_id, title, assigned_to are required' }, { status: 400 });
    }

    if (!adminSession && portalSession && userId) {
      const { data: subgroup } = await supabaseAdmin
        .from('kb_subgroups')
        .select('section')
        .eq('id', subgroupId)
        .single();

      const section = (subgroup?.section || 'translation') as 'translation' | 'simplification';
      const isNav = portalSession.role === 'co-captain' || await isSectionNavigator(userId, section);
      const isLeader = await isSubgroupLeader(userId, subgroupId);

      if (!isNav && !isLeader) {
        return NextResponse.json({ error: 'Only subgroup leader or section navigator can assign tasks.' }, { status: 403 });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('kb_subgroup_tasks')
      .insert({
        workflow_id: workflowId,
        subgroup_id: subgroupId,
        title,
        description,
        assigned_to: assignedTo,
        assigned_by: userId,
        deadline,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity({
      actorType: adminSession ? 'admin' : 'alphanaut',
      actorId: adminSession?.admin_id || userId,
      action: 'kb_task_created',
      entityType: 'kb_subgroup_task',
      entityId: data.id,
      details: {
        workflow_id: workflowId,
        subgroup_id: subgroupId,
        assigned_to: assignedTo,
        deadline: deadline || null,
      },
    });

    return NextResponse.json({ task: data, success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
