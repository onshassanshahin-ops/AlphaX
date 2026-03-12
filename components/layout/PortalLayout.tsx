'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  FlaskConical,
  Palette,
  Radio,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PortalSession } from '@/types';
import toast from 'react-hot-toast';

interface PortalLayoutProps {
  children: React.ReactNode;
  session: PortalSession;
}

const navItems = [
  { href: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard, slug: null },
  { href: '/portal/dashboard/knowledge-bridge', label: 'Knowledge Bridge', icon: BookOpen, slug: 'knowledge-bridge' },
  { href: '/portal/dashboard/research', label: 'Research Lab', icon: FlaskConical, slug: 'asclepius-lab' },
  { href: '/portal/dashboard/creative-lab', label: 'Creative Lab', icon: Palette, slug: 'creative-lab' },
  { href: '/portal/dashboard/science-comm', label: 'Science Comm', icon: Radio, slug: 'science-comm' },
  { href: '/portal/dashboard/operations', label: 'Operations', icon: Settings, slug: 'operations' },
  { href: '/portal/dashboard/profile', label: 'My Profile', icon: User, slug: null },
];

export default function PortalLayout({ children, session }: PortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/portal', { method: 'DELETE' });
      router.push('/portal');
      toast.success('Logged out successfully');
    } catch {
      toast.error('Failed to log out');
    }
  };

  const hasBlockAccess = (slug: string | null) => {
    if (!slug) return true;
    return session.blocks.includes(slug) ||
      (slug === 'asclepius-lab' && (session.blocks.includes('asclepius-lab') || session.blocks.includes('neuroscience')));
  };

  const roleColor = {
    'co-captain': 'text-gold',
    navigator: 'text-cyan',
    alphanaut: 'text-purple',
  }[session.role] || 'text-slate-300';

  const roleLabel = {
    'co-captain': 'Co-Captain',
    navigator: 'Navigator',
    alphanaut: 'Alphanaut',
  }[session.role] || session.role;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-cyan/10">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan to-navy flex items-center justify-center font-bold text-white font-grotesk text-sm">
            AX
          </div>
          <div>
            <p className="font-bold font-grotesk text-white text-sm">AlphaX Portal</p>
            <p className="text-xs text-slate-500">Member Dashboard</p>
          </div>
        </Link>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-cyan/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-cyan/5 border border-cyan/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy to-cyan/20 flex items-center justify-center text-white font-bold font-grotesk">
            {session.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{session.name}</p>
            <p className={cn('text-xs font-medium', roleColor)}>{roleLabel}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const hasAccess = hasBlockAccess(item.slug);
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <div key={item.href}>
              {hasAccess ? (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-cyan/15 text-cyan border border-cyan/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={18} className={isActive ? 'text-cyan' : ''} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight size={14} className="text-cyan" />}
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 cursor-not-allowed">
                  <Icon size={18} />
                  <span className="flex-1">{item.label}</span>
                  <Lock size={12} className="text-slate-600" />
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-cyan/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-dark border-r border-cyan/10 flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-dark border-r border-cyan/10 flex flex-col z-10">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X size={16} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar (mobile) */}
        <header className="lg:hidden flex items-center gap-4 px-4 h-14 bg-dark border-b border-cyan/10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold font-grotesk text-white">AlphaX Portal</span>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
