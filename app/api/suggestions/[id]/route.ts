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
    'rate_limit:suggestion_update',
    adminSession ? 'admin' : 'alphanaut',
    adminSession?.admin_id || portalSession?.alphanaut_id || null,
    60,
    10
  );
  if (!limiter.allowed) return limiter.response!;

  try {
    const { data: currentSuggestion } = await supabaseAdmin
      .from('block_suggestions')
      .select('id, block_slug, suggested_by')
      .eq('id', params.id)
      .single();

    if (!currentSuggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    const body = await request.json();
    const allowed = ['status', 'title', 'description'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (!adminSession && portalSession) {
      const navigator = isBlockNavigator(portalSession, currentSuggestion.block_slug);
      const isOwner = currentSuggestion.suggested_by === portalSession.alphanaut_id;

      if (!navigator) {
        if (!isOwner) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const nonStatusOnly = Object.keys(updates).some((k) => k === 'status');
        if (nonStatusOnly) {
          return NextResponse.json({ error: 'Only navigators can change suggestion status.' }, { status: 403 });
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('block_suggestions')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logActivity({
      actorType: adminSession ? 'admin' : 'alphanaut',
      actorId: adminSession?.admin_id || portalSession?.alphanaut_id || null,
      action: 'suggestion_updated',
      entityType: 'block_suggestion',
      entityId: params.id,
      details: updates,
    });

    return NextResponse.json({ suggestion: data });
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
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
    'rate_limit:suggestion_delete',
    adminSession ? 'admin' : 'alphanaut',
    adminSession?.admin_id || portalSession?.alphanaut_id || null,
    30,
    10
  );
  if (!limiter.allowed) return limiter.response!;

  if (!adminSession && portalSession) {
    const { data: currentSuggestion } = await supabaseAdmin
      .from('block_suggestions')
      .select('id, block_slug, suggested_by')
      .eq('id', params.id)
      .single();

    if (!currentSuggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    const navigator = isBlockNavigator(portalSession, currentSuggestion.block_slug);
    const isOwner = currentSuggestion.suggested_by === portalSession.alphanaut_id;
    if (!navigator && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const { error } = await supabaseAdmin.from('block_suggestions').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logActivity({
    actorType: adminSession ? 'admin' : 'alphanaut',
    actorId: adminSession?.admin_id || portalSession?.alphanaut_id || null,
    action: 'suggestion_deleted',
    entityType: 'block_suggestion',
    entityId: params.id,
  });

  return NextResponse.json({ success: true });
}
