import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getPortalSession } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getPortalSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Toggle vote
  const { data: existing } = await supabaseAdmin
    .from('suggestion_votes')
    .select()
    .eq('suggestion_id', params.id)
    .eq('alphanaut_id', session.alphanaut_id)
    .single();

  if (existing) {
    await supabaseAdmin
      .from('suggestion_votes')
      .delete()
      .eq('suggestion_id', params.id)
      .eq('alphanaut_id', session.alphanaut_id);
    return NextResponse.json({ voted: false });
  } else {
    await supabaseAdmin
      .from('suggestion_votes')
      .insert({ suggestion_id: params.id, alphanaut_id: session.alphanaut_id });
    return NextResponse.json({ voted: true });
  }
}
