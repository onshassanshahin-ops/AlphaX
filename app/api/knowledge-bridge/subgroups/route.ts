import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getKbAuthContext, isSectionNavigator } from '../_utils';

export async function GET(request: NextRequest) {
  const { adminSession, isKbPortalUser } = await getKbAuthContext();
  if (!adminSession && !isKbPortalUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const section = searchParams.get('section');

  let query = supabaseAdmin
    .from('kb_subgroups')
    .select(`
      *,
      leader:leader_id(id, name, email),
      members:kb_subgroup_members(count)
    `)
    .order('created_at', { ascending: false });

  if (section) {
    query = query.eq('section', section);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ subgroups: data || [] });
}

export async function POST(request: NextRequest) {
  const { adminSession, portalSession, userId, isKbPortalUser } = await getKbAuthContext();
  if (!adminSession && !isKbPortalUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const section = body.section as 'translation' | 'simplification';
    const name = body.name as string;
    const description = body.description || null;
    const leaderId = body.leader_id || null;
    const memberIds = Array.isArray(body.member_ids) ? body.member_ids : [];

    if (!section || !['translation', 'simplification'].includes(section)) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!adminSession && portalSession) {
      const allowed =
        portalSession.role === 'co-captain' ||
        (userId ? await isSectionNavigator(userId, section) : false);
      if (!allowed) {
        return NextResponse.json({ error: 'Only section navigators can create subgroups' }, { status: 403 });
      }
    }

    const { data: subgroup, error } = await supabaseAdmin
      .from('kb_subgroups')
      .insert({
        section,
        name,
        description,
        leader_id: leaderId,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const membershipRows: Array<{ subgroup_id: string; alphanaut_id: string; role: 'leader' | 'member' }> = [];

    if (leaderId) {
      membershipRows.push({ subgroup_id: subgroup.id, alphanaut_id: leaderId, role: 'leader' });
    }

    memberIds.forEach((id: string) => {
      if (id && id !== leaderId) {
        membershipRows.push({ subgroup_id: subgroup.id, alphanaut_id: id, role: 'member' });
      }
    });

    if (membershipRows.length > 0) {
      await supabaseAdmin.from('kb_subgroup_members').upsert(membershipRows, {
        onConflict: 'subgroup_id,alphanaut_id',
      });
    }

    return NextResponse.json({ subgroup, success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to create subgroup' }, { status: 500 });
  }
}
