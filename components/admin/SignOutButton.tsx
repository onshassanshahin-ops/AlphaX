'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';

export default function SignOutButton() {
  return (
    <Link
      href="/admin"
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
      onClick={async (e) => {
        e.preventDefault();
        await fetch('/api/auth/admin', { method: 'DELETE' });
        window.location.href = '/admin';
      }}
    >
      <LogOut size={14} />
      Sign Out
    </Link>
  );
}
