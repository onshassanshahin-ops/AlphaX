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

function accessibleBlocks(session: NonNullable<Awaited<ReturnType<typeof getPortalSession>>>) {
  const base = new Set(session.blocks.map((b) => normalizeBlockSlug(b)));
  if (base.has('asclepius-lab') || base.has('neuroscience')) {
    base.add('asclepius-lab');
    base.add('neuroscience');
  }
  return Array.from(base);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const block = searchParams.get('block');

  const adminSession = await getAdminSession();
  const portalSession = await getPortalSession();
  if (!adminSession && !portalSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const normalizedBlock = normalizeBlockSlug(block);

  let query = supabaseAdmin
    .from('block_suggestions')
    .select(`
      *,
      author:alphanauts!block_suggestions_suggested_by_fkey(id, name, avatar_url),
      suggestion_votes(alphanaut_id)
    `)
    .order('created_at', { ascending: false });

  if (block) query = query.eq('block_slug', normalizedBlock);

  if (!adminSession && portalSession && portalSession.role !== 'co-captain') {
    const allowedBlocks = accessibleBlocks(portalSession);
    if (block && !allowedBlocks.includes(normalizedBlock)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    query = query.in('block_slug', allowedBlocks.length > 0 ? allowedBlocks : ['knowledge-bridge']);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ suggestions: data });
}

export async function POST(request: NextRequest) {
  const adminSession = await getAdminSession();
  const portalSession = await getPortalSession();
  if (!adminSession && !portalSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limiter = await checkWriteRateLimit(
    request,
    'rate_limit:suggestion_create',
    adminSession ? 'admin' : 'alphanaut',
    adminSession?.admin_id || portalSession?.alphanaut_id || null,
    40,
    10
  );
  if (!limiter.allowed) return limiter.response!;

  try {
    const body = await request.json();
    const { title, description, type, block_slug } = body;

    if (!title || !block_slug) {
      return NextResponse.json({ error: 'title and block_slug are required' }, { status: 400 });
    }

    const normalizedBlockSlug = normalizeBlockSlug(block_slug);

    if (!adminSession && portalSession && portalSession.role !== 'co-captain') {
      const allowedBlocks = accessibleBlocks(portalSession);
      if (!allowedBlocks.includes(normalizedBlockSlug)) {
        return NextResponse.json({ error: 'You are not a member of this block.' }, { status: 403 });
      }
    }

    const suggested_by = portalSession?.alphanaut_id || null;

    const { data, error } = await supabaseAdmin
      .from('block_suggestions')
      .insert({ title, description, type: type || 'idea', block_slug: normalizedBlockSlug, suggested_by })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logActivity({
      actorType: adminSession ? 'admin' : 'alphanaut',
      actorId: adminSession?.admin_id || portalSession?.alphanaut_id || null,
      action: 'suggestion_created',
      entityType: 'block_suggestion',
      entityId: data.id,
      details: {
        block_slug: normalizedBlockSlug,
        type: type || 'idea',
      },
    });

    return NextResponse.json({ suggestion: data });
  } catch {
    return NextResponse.json({ error: 'Failed to create suggestion' }, { status: 500 });
  }
}
