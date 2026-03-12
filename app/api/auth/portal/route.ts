import { NextRequest, NextResponse } from 'next/server';
import { validatePortalCode, setPortalSession, clearPortalSession, getPortalSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const session = await getPortalSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  return NextResponse.json({ session });
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Access code is required' }, { status: 400 });
    }

    const { session, error } = await validatePortalCode(code);

    if (error || !session) {
      return NextResponse.json({ error }, { status: 401 });
    }

    await setPortalSession(session);

    // Log activity
    await supabaseAdmin.from('activity_log').insert({
      actor_type: 'alphanaut',
      actor_id: session.alphanaut_id,
      action: 'portal_login',
      details: { timestamp: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      session: {
        name: session.name,
        role: session.role,
        blocks: session.blocks,
      },
    });
  } catch (err) {
    console.error('Portal auth error:', err);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

export async function DELETE() {
  await clearPortalSession();
  return NextResponse.json({ success: true });
}
