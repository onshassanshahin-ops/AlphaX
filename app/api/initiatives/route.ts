import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession, getPortalSession } from '@/lib/auth';
import { sendInitiativeEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const block = searchParams.get('block');

  const adminSession = await getAdminSession();
  const portalSession = await getPortalSession();
  if (!adminSession && !portalSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let query = supabaseAdmin
    .from('block_initiatives')
    .select(`
      *,
      creator:alphanauts!block_initiatives_created_by_fkey(id, name, avatar_url),
      initiative_participants(alphanaut_id, response)
    `)
    .order('created_at', { ascending: false });

  if (block) query = query.eq('block_slug', block);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ initiatives: data });
}

export async function POST(request: NextRequest) {
  const adminSession = await getAdminSession();
  const portalSession = await getPortalSession();
  if (!adminSession && !portalSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, block_slug, deadline } = body;

    if (!title || !block_slug) {
      return NextResponse.json({ error: 'title and block_slug are required' }, { status: 400 });
    }

    const created_by = portalSession?.alphanaut_id || null;

    const { data, error } = await supabaseAdmin
      .from('block_initiatives')
      .insert({ title, description, block_slug, created_by, deadline })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Notify all block members
    const { data: members } = await supabaseAdmin
      .from('alphanaut_blocks')
      .select('alphanaut_id, alphanauts(name, email)')
      .eq('block_id', (await supabaseAdmin.from('blocks').select('id').eq('slug', block_slug).single()).data?.id)
      .neq('alphanaut_id', created_by || '');

    const { data: blockData } = await supabaseAdmin.from('blocks').select('name').eq('slug', block_slug).single();

    if (members) {
      for (const m of members) {
        const a = m.alphanauts as { name?: string; email?: string } | null;
        if (a?.email && a?.name) {
          sendInitiativeEmail(a.email, a.name, title, blockData?.name || block_slug, description || '', deadline).catch(console.error);
        }
      }
    }

    return NextResponse.json({ initiative: data });
  } catch {
    return NextResponse.json({ error: 'Failed to create initiative' }, { status: 500 });
  }
}
