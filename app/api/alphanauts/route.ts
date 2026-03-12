import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession } from '@/lib/auth';
import { generateAccessCode } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const active = searchParams.get('active');
  const isPublic = searchParams.get('public');

  let query = supabaseAdmin
    .from('alphanauts')
    .select(`
      *,
      alphanaut_blocks (
        id, role, joined_at,
        blocks (id, slug, name, color, icon)
      )
    `)
    .order('created_at', { ascending: false });

  if (active === 'true') query = query.eq('is_active', true);
  if (isPublic === 'true') query = query.eq('is_public', true);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alphanauts: data });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, phone, university, field_of_study, role, blocks, navigatorBlockIds, bio, is_public } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Generate unique access code
    let accessCode = generateAccessCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabaseAdmin
        .from('alphanauts')
        .select('id')
        .eq('access_code', accessCode)
        .single();
      if (!existing) break;
      accessCode = generateAccessCode();
      attempts++;
    }

    // Create alphanaut
    const { data: alphanaut, error: createError } = await supabaseAdmin
      .from('alphanauts')
      .insert({
        name,
        email,
        phone,
        university,
        field_of_study,
        access_code: accessCode,
        role: role || 'alphanaut',
        bio,
        is_public: is_public || false,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Assign to blocks with per-block roles
    if (blocks && blocks.length > 0) {
      const blockRecords = blocks.map((blockId: string) => ({
        alphanaut_id: alphanaut.id,
        block_id: blockId,
        role: (navigatorBlockIds || []).includes(blockId) ? 'navigator' : 'member',
      }));

      await supabaseAdmin.from('alphanaut_blocks').insert(blockRecords);
    }

    // Log activity
    await supabaseAdmin.from('activity_log').insert({
      actor_type: 'admin',
      action: 'create_alphanaut',
      entity_type: 'alphanaut',
      entity_id: alphanaut.id,
      details: { name, role, created_by: session.username },
    });

    return NextResponse.json({ alphanaut, accessCode });
  } catch (err) {
    console.error('Create alphanaut error:', err);
    return NextResponse.json({ error: 'Failed to create Alphanaut' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('alphanauts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ alphanaut: data });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
