import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  getKbAuthContext,
  isSectionNavigator,
  isSubgroupLeader,
  isSubgroupMember,
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
      query = query.eq('assigned_to', userId);
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

    return NextResponse.json({ task: data, success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
