import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getPortalSession, getAdminSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const field = searchParams.get('field');
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  const search = searchParams.get('search');

  // Check if admin is requesting (can see all statuses)
  const adminSession = await getAdminSession();
  const portalSession = await getPortalSession();
  const isAuthenticated = !!(adminSession || portalSession);

  let query = supabaseAdmin
    .from('papers')
    .select(`
      id, title_ar, title_en, original_authors, description_ar, description_en,
      field, tags, file_url, cover_image_url, download_count, status,
      navigator_notes, published_at, created_at,
      submitter:submitted_by (id, name)
    `)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Public endpoint only sees published papers
  if (!isAuthenticated) {
    query = query.eq('status', 'published');
  } else if (status) {
    query = query.eq('status', status);
  }

  if (field && field !== 'all') {
    query = query.eq('field', field);
  }

  if (search) {
    query = query.or(
      `title_ar.ilike.%${search}%,title_en.ilike.%${search}%,description_ar.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ papers: data, total: count });
}

export async function POST(request: NextRequest) {
  const portalSession = await getPortalSession();
  const adminSession = await getAdminSession();

  if (!portalSession && !adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (portalSession && !adminSession) {
    const isKbNavigator =
      portalSession.role === 'co-captain' ||
      (portalSession.navigatorBlocks || []).includes('knowledge-bridge');

    if (!isKbNavigator) {
      return NextResponse.json(
        { error: 'Only Knowledge Bridge navigators can submit papers.' },
        { status: 403 }
      );
    }
  }

  try {
    const formData = await request.formData();
    const title_ar = formData.get('title_ar') as string;
    const title_en = formData.get('title_en') as string;
    const original_authors = formData.get('original_authors') as string;
    const description_ar = formData.get('description_ar') as string;
    const description_en = formData.get('description_en') as string;
    const field = formData.get('field') as string;
    const tagsRaw = formData.get('tags') as string;
    const file = formData.get('file') as File | null;

    if (!title_ar) {
      return NextResponse.json({ error: 'Arabic title is required' }, { status: 400 });
    }

    const tags = tagsRaw
      ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    let file_url = null;
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('papers')
        .upload(fileName, buffer, { contentType: 'application/pdf', upsert: true });

      if (!uploadError && uploadData) {
        const { data: urlData } = supabaseAdmin.storage.from('papers').getPublicUrl(fileName);
        file_url = urlData.publicUrl;
      }
    }

    const submittedBy = portalSession?.alphanaut_id;

    const { data: paper, error: createError } = await supabaseAdmin
      .from('papers')
      .insert({
        title_ar,
        title_en: title_en || null,
        original_authors: original_authors || null,
        description_ar: description_ar || null,
        description_en: description_en || null,
        field: field || 'other',
        tags,
        file_url,
        status: adminSession ? 'published' : 'under_review',
        submitted_by: submittedBy || null,
        published_at: adminSession ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json({ paper });
  } catch (err) {
    console.error('Paper creation error:', err);
    return NextResponse.json({ error: 'Failed to create paper' }, { status: 500 });
  }
}
