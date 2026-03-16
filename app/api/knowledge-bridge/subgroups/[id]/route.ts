import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getKbAuthContext, isSectionNavigator, isSubgroupLeader } from '../../_utils';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { adminSession, isKbPortalUser } = await getKbAuthContext();
  if (!adminSession && !isKbPortalUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('kb_subgroups')
    .select(`
      *,
      leader:leader_id(id, name, email),
      members:kb_subgroup_members(
        role,
        alphanaut:alphanaut_id(id, name, email)
      )
    `)
    .eq('id', params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ subgroup: data });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { adminSession, portalSession, userId, isKbPortalUser } = await getKbAuthContext();
  if (!adminSession && !isKbPortalUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: current, error: currentError } = await supabaseAdmin
      .from('kb_subgroups')
      .select('*')
      .eq('id', params.id)
      .single();

    if (currentError || !current) {
      return NextResponse.json({ error: 'Subgroup not found' }, { status: 404 });
    }

    if (!adminSession && portalSession) {
      const allowed =
        portalSession.role === 'co-captain' ||
        (userId ? await isSectionNavigator(userId, current.section) : false) ||
        (userId ? await isSubgroupLeader(userId, current.id) : false);
      if (!allowed) {
        return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
      }
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (typeof body.name === 'string') updates.name = body.name;
    if ('description' in body) updates.description = body.description || null;
    if ('leader_id' in body) updates.leader_id = body.leader_id || null;
    if ('is_active' in body) updates.is_active = !!body.is_active;

    const { data: subgroup, error } = await supabaseAdmin
      .from('kb_subgroups')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (Array.isArray(body.member_ids) || 'leader_id' in body) {
      const memberIds = Array.isArray(body.member_ids) ? body.member_ids : [];
      const leaderId = body.leader_id || subgroup.leader_id;

      await supabaseAdmin.from('kb_subgroup_members').delete().eq('subgroup_id', params.id);

      const rows: Array<{ subgroup_id: string; alphanaut_id: string; role: 'leader' | 'member' }> = [];
      if (leaderId) rows.push({ subgroup_id: params.id, alphanaut_id: leaderId, role: 'leader' });
      memberIds.forEach((id: string) => {
        if (id && id !== leaderId) rows.push({ subgroup_id: params.id, alphanaut_id: id, role: 'member' });
      });

      if (rows.length > 0) {
        await supabaseAdmin.from('kb_subgroup_members').insert(rows);
      }
    }

    return NextResponse.json({ subgroup, success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update subgroup' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { adminSession, portalSession, userId } = await getKbAuthContext();
  if (!adminSession && !portalSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: subgroup } = await supabaseAdmin
    .from('kb_subgroups')
    .select('id, section')
    .eq('id', params.id)
    .single();

  if (!subgroup) {
    return NextResponse.json({ error: 'Subgroup not found' }, { status: 404 });
  }

  if (!adminSession && portalSession) {
    const allowed =
      portalSession.role === 'co-captain' ||
      (userId ? await isSectionNavigator(userId, subgroup.section) : false);
    if (!allowed) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }
  }

  const { error } = await supabaseAdmin.from('kb_subgroups').delete().eq('id', params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
