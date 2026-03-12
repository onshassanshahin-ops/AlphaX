import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getPortalSession } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getPortalSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { response } = await request.json();
    if (!['yes', 'no'].includes(response)) {
      return NextResponse.json({ error: 'response must be yes or no' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('initiative_participants')
      .upsert(
        { initiative_id: params.id, alphanaut_id: session.alphanaut_id, response },
        { onConflict: 'initiative_id,alphanaut_id' }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ participant: data });
  } catch {
    return NextResponse.json({ error: 'Failed to respond' }, { status: 500 });
  }
}
