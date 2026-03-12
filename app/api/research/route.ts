import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getPortalSession, getAdminSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const blockSlug = searchParams.get('block');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  const adminSession = await getAdminSession();
  const portalSession = await getPortalSession();
  const isAuthenticated = !!(adminSession || portalSession);

  let query = supabaseAdmin
    .from('research_projects')
    .select(`
      *,
      authors:research_authors (
        author_order,
        alphanaut:alphanaut_id (id, name, role)
      ),
      block:block_slug (id, slug, name, color, icon)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (!isAuthenticated) {
    query = query.eq('is_public', true);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (blockSlug) {
    query = query.eq('block_slug', blockSlug);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projects: data });
}

export async function PATCH(request: NextRequest) {
  const adminSession = await getAdminSession();
  const portalSession = await getPortalSession();

  if (!adminSession && !portalSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (updates.status === 'published' && !updates.published_at) {
      updates.published_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('research_projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ project: data });
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const portalSession = await getPortalSession();
  const adminSession = await getAdminSession();

  if (!portalSession && !adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      abstract,
      field,
      block_slug,
      status,
      journal,
      doi,
      is_public,
      author_ids,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const createdBy = portalSession?.alphanaut_id;

    const { data: project, error: createError } = await supabaseAdmin
      .from('research_projects')
      .insert({
        title,
        abstract,
        field,
        block_slug,
        status: status || 'in_progress',
        journal,
        doi,
        is_public: is_public || false,
        created_by: createdBy,
        published_at: status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Add authors
    const authorsToAdd = author_ids || (createdBy ? [createdBy] : []);
    if (authorsToAdd.length > 0) {
      await supabaseAdmin.from('research_authors').insert(
        authorsToAdd.map((authorId: string, idx: number) => ({
          research_id: project.id,
          alphanaut_id: authorId,
          author_order: idx,
        }))
      );
    }

    return NextResponse.json({ project });
  } catch (err) {
    console.error('Research creation error:', err);
    return NextResponse.json({ error: 'Failed to create research project' }, { status: 500 });
  }
}
