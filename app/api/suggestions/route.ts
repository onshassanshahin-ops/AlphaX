import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession, getPortalSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const block = searchParams.get('block');

  const adminSession = await getAdminSession();
  const portalSession = await getPortalSession();
  if (!adminSession && !portalSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let query = supabaseAdmin
    .from('block_suggestions')
    .select(`
      *,
      author:alphanauts!block_suggestions_suggested_by_fkey(id, name, avatar_url),
      suggestion_votes(alphanaut_id)
    `)
    .order('created_at', { ascending: false });

  if (block) query = query.eq('block_slug', block);

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

  try {
    const body = await request.json();
    const { title, description, type, block_slug } = body;

    if (!title || !block_slug) {
      return NextResponse.json({ error: 'title and block_slug are required' }, { status: 400 });
    }

    const suggested_by = portalSession?.alphanaut_id || null;

    const { data, error } = await supabaseAdmin
      .from('block_suggestions')
      .insert({ title, description, type: type || 'idea', block_slug, suggested_by })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ suggestion: data });
  } catch {
    return NextResponse.json({ error: 'Failed to create suggestion' }, { status: 500 });
  }
}
