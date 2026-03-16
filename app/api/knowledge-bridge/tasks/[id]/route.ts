import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  getKbAuthContext,
  isSectionNavigator,
  isSubgroupLeader,
  isSubgroupMember,
} from '../../_utils';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { adminSession, portalSession, userId, isKbPortalUser } = await getKbAuthContext();
  if (!adminSession && !isKbPortalUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: task } = await supabaseAdmin
    .from('kb_subgroup_tasks')
    .select('*, subgroup:subgroup_id(id, section)')
    .eq('id', params.id)
    .single();

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if ('status' in body) updates.status = body.status;
    if ('title' in body) updates.title = body.title;
    if ('description' in body) updates.description = body.description;
    if ('deadline' in body) updates.deadline = body.deadline;

    if (body.status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    if (!adminSession && portalSession && userId) {
      const subgroup = Array.isArray(task.subgroup) ? task.subgroup[0] : task.subgroup;
      const section = ((subgroup?.section as 'translation' | 'simplification' | undefined) || 'translation');
      const isNav = portalSession.role === 'co-captain' || await isSectionNavigator(userId, section);
      const isLeader = await isSubgroupLeader(userId, task.subgroup_id);
      const isAssignee = task.assigned_to === userId;
      const isMember = await isSubgroupMember(userId, task.subgroup_id);

      // Members can only update status on their own tasks
      if (!isNav && !isLeader) {
        if (!isAssignee) {
          return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
        }

        const statusOnly = Object.keys(updates).every((k) => k === 'status' || k === 'completed_at');
        if (!statusOnly) {
          return NextResponse.json({ error: 'You can only update task status' }, { status: 403 });
        }
      }

      if (!isNav && !isLeader && !isMember) {
        return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('kb_subgroup_tasks')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ task: data, success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { adminSession, portalSession, userId, isKbPortalUser } = await getKbAuthContext();
  if (!adminSession && !isKbPortalUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: task } = await supabaseAdmin
    .from('kb_subgroup_tasks')
    .select('subgroup_id, subgroup:subgroup_id(section)')
    .eq('id', params.id)
    .single();

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (!adminSession && portalSession && userId) {
    const subgroup = Array.isArray(task.subgroup) ? task.subgroup[0] : task.subgroup;
    const section = ((subgroup?.section as 'translation' | 'simplification' | undefined) || 'translation');
    const isNav = portalSession.role === 'co-captain' || await isSectionNavigator(userId, section);
    const isLeader = await isSubgroupLeader(userId, task.subgroup_id);

    if (!isNav && !isLeader) {
      return NextResponse.json({ error: 'Only leader or navigator can delete tasks' }, { status: 403 });
    }
  }

  const { error } = await supabaseAdmin.from('kb_subgroup_tasks').delete().eq('id', params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
