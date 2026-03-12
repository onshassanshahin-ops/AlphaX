import { NextRequest, NextResponse } from 'next/server';
import { validateAdminCredentials, setAdminSession, clearAdminSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const { session, error } = await validateAdminCredentials(username, password);

    if (error || !session) {
      return NextResponse.json({ error }, { status: 401 });
    }

    await setAdminSession(session);

    return NextResponse.json({
      success: true,
      session: {
        username: session.username,
        name: session.name,
      },
    });
  } catch (err) {
    console.error('Admin auth error:', err);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ success: true });
}
