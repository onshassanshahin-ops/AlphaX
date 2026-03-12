import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession, getPortalSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const publicOnly = searchParams.get('public') === 'true';
  const upcoming = searchParams.get('upcoming') === 'true';

  let query = supabaseAdmin
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  if (publicOnly) query = query.eq('is_public', true);
  if (upcoming) query = query.gte('event_date', new Date().toISOString());

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data });
}

export async function POST(request: NextRequest) {
  const adminSession = await getAdminSession();
  const portalSession = await getPortalSession();
  if (!adminSession && !portalSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, type, event_date, end_date, location, link, is_online, is_public, block_slug } = body;

    if (!title || !event_date) {
      return NextResponse.json({ error: 'title and event_date are required' }, { status: 400 });
    }

    const created_by = portalSession?.alphanaut_id || null;

    const { data, error } = await supabaseAdmin
      .from('events')
      .insert({ title, description, type: type || 'other', event_date, end_date, location, link, is_online: is_online || false, is_public: is_public !== false, block_slug, created_by })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ event: data });
  } catch {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
