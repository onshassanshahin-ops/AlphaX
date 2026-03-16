import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession, getPortalSession } from '@/lib/auth';

const VALID_ROLES = new Set(['member', 'navigator']);
const VALID_STATUS = new Set(['pending', 'approved', 'rejected']);

export async function GET(request: NextRequest) {
  const adminSession = await getAdminSession();
  const portalSession = await getPortalSession();

  if (!adminSession && !portalSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';

  let query = supabaseAdmin
    .from('block_join_requests')
    .select(`
      *,
      alphanaut:alphanaut_id (id, name, email, role),
      block:block_slug (id, slug, name, color, icon)
    `)
    .order('created_at', { ascending: false });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  if (!adminSession && portalSession) {
    query = query.eq('alphanaut_id', portalSession.alphanaut_id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data || [] });
}

export async function POST(request: NextRequest) {
  const portalSession = await getPortalSession();
  if (!portalSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const blockSlug = body.block_slug;
    const requestedRole = body.requested_role || 'member';
    const note = body.note || null;

    if (!blockSlug) {
      return NextResponse.json({ error: 'Block is required' }, { status: 400 });
    }

    if (!VALID_ROLES.has(requestedRole)) {
      return NextResponse.json({ error: 'Invalid requested role' }, { status: 400 });
    }

    const { data: existingBlock } = await supabaseAdmin
      .from('blocks')
      .select('id, slug, is_active')
      .eq('slug', blockSlug)
      .single();

    if (!existingBlock || !existingBlock.is_active) {
      return NextResponse.json({ error: 'Invalid or inactive block' }, { status: 400 });
    }

    const { data: existingMembership } = await supabaseAdmin
      .from('alphanaut_blocks')
      .select('id, role')
      .eq('alphanaut_id', portalSession.alphanaut_id)
      .eq('block_id', existingBlock.id)
      .single();

    if (existingMembership) {
      return NextResponse.json({ error: 'You are already a member of this block.' }, { status: 409 });
    }

    const { data: pending } = await supabaseAdmin
      .from('block_join_requests')
      .select('id')
      .eq('alphanaut_id', portalSession.alphanaut_id)
      .eq('block_slug', blockSlug)
      .eq('status', 'pending')
      .single();

    if (pending) {
      return NextResponse.json({ error: 'A pending request for this block already exists.' }, { status: 409 });
    }

    const { data, error } = await supabaseAdmin
      .from('block_join_requests')
      .insert({
        alphanaut_id: portalSession.alphanaut_id,
        block_slug: blockSlug,
        requested_role: requestedRole,
        note,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabaseAdmin.from('activity_log').insert({
      actor_type: 'alphanaut',
      actor_id: portalSession.alphanaut_id,
      action: 'request_block_join',
      entity_type: 'block',
      entity_id: blockSlug,
      details: { requested_role: requestedRole },
    });

    return NextResponse.json({ request: data, success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = body.id;
    const status = body.status;
    const adminNotes = body.admin_notes || null;
    const resolvedRole = body.resolved_role || null;

    if (!id || !status || !VALID_STATUS.has(status)) {
      return NextResponse.json({ error: 'ID and valid status are required' }, { status: 400 });
    }

    const { data: requestRow, error: fetchError } = await supabaseAdmin
      .from('block_join_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !requestRow) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (status === 'approved') {
      const roleToAssign = resolvedRole || requestRow.requested_role || 'member';
      if (!VALID_ROLES.has(roleToAssign)) {
        return NextResponse.json({ error: 'Invalid role to assign' }, { status: 400 });
      }

      const { data: block, error: blockError } = await supabaseAdmin
        .from('blocks')
        .select('id, slug')
        .eq('slug', requestRow.block_slug)
        .single();

      if (blockError || !block) {
        return NextResponse.json({ error: 'Block not found' }, { status: 404 });
      }

      const { error: membershipError } = await supabaseAdmin
        .from('alphanaut_blocks')
        .upsert(
          {
            alphanaut_id: requestRow.alphanaut_id,
            block_id: block.id,
            role: roleToAssign,
          },
          { onConflict: 'alphanaut_id,block_id' }
        );

      if (membershipError) {
        return NextResponse.json({ error: membershipError.message }, { status: 500 });
      }

      await supabaseAdmin.from('activity_log').insert({
        actor_type: 'admin',
        action: 'approve_block_join_request',
        entity_type: 'block',
        entity_id: block.slug,
        details: {
          request_id: requestRow.id,
          alphanaut_id: requestRow.alphanaut_id,
          assigned_role: roleToAssign,
          reviewed_by: adminSession.username,
        },
      });
    }

    if (status === 'rejected') {
      await supabaseAdmin.from('activity_log').insert({
        actor_type: 'admin',
        action: 'reject_block_join_request',
        entity_type: 'block',
        entity_id: requestRow.block_slug,
        details: {
          request_id: requestRow.id,
          alphanaut_id: requestRow.alphanaut_id,
          reviewed_by: adminSession.username,
        },
      });
    }

    const { data, error } = await supabaseAdmin
      .from('block_join_requests')
      .update({
        status,
        admin_notes: adminNotes,
        resolved_role: status === 'approved' ? (resolvedRole || requestRow.requested_role || 'member') : null,
        reviewed_by: adminSession.admin_id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ request: data, success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
