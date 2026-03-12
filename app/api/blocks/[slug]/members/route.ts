import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession, getPortalSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const adminSession = await getAdminSession();
  const portalSession = await getPortalSession();
  if (!adminSession && !portalSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: block } = await supabaseAdmin
    .from('blocks')
    .select('id')
    .eq('slug', params.slug)
    .single();

  if (!block) return NextResponse.json({ members: [] });

  const { data } = await supabaseAdmin
    .from('alphanaut_blocks')
    .select('role, alphanauts(id, name, university, field_of_study)')
    .eq('block_id', block.id);

  const members = (data || [])
    .filter((r: any) => r.alphanauts)
    .map((r: any) => ({ ...r.alphanauts, blockRole: r.role as 'member' | 'navigator' }));

  return NextResponse.json({ members });
}
