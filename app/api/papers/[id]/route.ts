import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession, getPortalSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminSession = await getAdminSession();
  const portalSession = await getPortalSession();

  let query = supabaseAdmin
    .from('papers')
    .select(`
      *,
      submitter:submitted_by (id, name, role),
      reviewer:reviewed_by (id, name, role)
    `)
    .eq('id', params.id)
    .single();

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
  }

  // Only allow viewing non-published papers if authenticated
  if (data.status !== 'published' && !adminSession && !portalSession) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ paper: data });
}

// Increment download count
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { action } = await request.json();

  if (action === 'download') {
    const { error } = await supabaseAdmin.rpc('increment_download', {
      paper_id: params.id,
    });

    // Fallback if RPC not available
    if (error) {
      const { data: paper } = await supabaseAdmin
        .from('papers')
        .select('download_count')
        .eq('id', params.id)
        .single();

      if (paper) {
        await supabaseAdmin
          .from('papers')
          .update({ download_count: (paper.download_count || 0) + 1 })
          .eq('id', params.id);
      }
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminSession = await getAdminSession();
  const portalSession = await getPortalSession();

  if (!adminSession && !portalSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { status, navigator_notes, ...updates } = body;

    const finalUpdates: Record<string, unknown> = { ...updates };

    if (status) {
      finalUpdates.status = status;
      if (status === 'published') {
        finalUpdates.published_at = new Date().toISOString();
        if (adminSession) {
          finalUpdates.reviewed_by = null; // admin published
        }
      }
    }

    if (navigator_notes !== undefined) {
      finalUpdates.navigator_notes = navigator_notes;
    }

    const { data, error } = await supabaseAdmin
      .from('papers')
      .update(finalUpdates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ paper: data });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update paper' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabaseAdmin
    .from('papers')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
