'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/knowledge-bridge', label: 'Knowledge Bridge' },
  { href: '/research', label: 'Research' },
  { href: '/events', label: 'Events' },
  { href: '/team', label: 'Team' },
  { href: '/announcements', label: 'Announcements' },
  { href: '/about', label: 'About' },
  { href: '/orientation', label: 'Orientation' },
  { href: '/join', label: 'Join Us' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        scrolled
          ? 'bg-dark/95 backdrop-blur-md border-b border-cyan/10 shadow-lg'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-navy flex items-center justify-center font-bold text-white text-sm font-grotesk">
              AX
            </div>
            <span className="font-bold text-lg font-grotesk text-white group-hover:text-cyan transition-colors">
              AlphaX
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname === link.href
                    ? 'text-cyan bg-cyan/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/5',
                  link.href === '/join' &&
                    'bg-cyan/20 text-cyan border border-cyan/30 hover:bg-cyan/30 hover:border-cyan/50 ml-2'
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/search"
              className="ml-1 w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Search"
            >
              <Search size={17} />
            </Link>
            <Link
              href="/portal"
              className="ml-1 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan to-teal text-white hover:shadow-glow-cyan hover:-translate-y-0.5 transition-all duration-200"
            >
              Alphanaut Portal
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="lg:hidden bg-dark/98 backdrop-blur-md border-t border-cyan/10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'text-cyan bg-cyan/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/5',
                  link.href === '/join' && 'border border-cyan/30 text-cyan'
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/portal"
              className="mt-2 px-4 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan to-teal text-white text-center"
            >
              Alphanaut Portal
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
