import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect portal dashboard routes
  if (pathname.startsWith('/portal/dashboard')) {
    const portalSession = request.cookies.get('portal_session');

    if (!portalSession?.value) {
      const loginUrl = new URL('/portal', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const session = JSON.parse(portalSession.value);
      if (!session.alphanaut_id) {
        const loginUrl = new URL('/portal', request.url);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL('/portal', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect admin dashboard routes
  if (pathname.startsWith('/admin/dashboard')) {
    const adminSession = request.cookies.get('admin_session');

    if (!adminSession?.value) {
      const loginUrl = new URL('/admin', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const session = JSON.parse(adminSession.value);
      if (!session.admin_id) {
        const loginUrl = new URL('/admin', request.url);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL('/admin', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/portal/dashboard/:path*',
    '/admin/dashboard/:path*',
  ],
};
