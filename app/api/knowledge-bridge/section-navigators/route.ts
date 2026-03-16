import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getKbAuthContext } from '../_utils';

export async function GET() {
  const { adminSession, isKbPortalUser } = await getKbAuthContext();

  if (!adminSession && !isKbPortalUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('kb_section_navigators')
    .select('section, alphanaut_id, alphanaut:alphanaut_id(id, name, email)')
    .order('section', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sectionNavigators: data || [] });
}

export async function PATCH(request: NextRequest) {
  const { adminSession } = await getKbAuthContext();
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const section = body.section as 'translation' | 'simplification';
    const alphanautId = body.alphanaut_id || null;

    if (!section || !['translation', 'simplification'].includes(section)) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('kb_section_navigators')
      .upsert(
        {
          section,
          alphanaut_id: alphanautId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'section' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sectionNavigator: data, success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update section navigator' }, { status: 500 });
  }
}
