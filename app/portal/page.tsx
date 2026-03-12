'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { isValidAccessCode } from '@/lib/utils';

export default function PortalLoginPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const router = useRouter();

  const handleCodeInput = (value: string) => {
    // Auto-format: add AX- prefix if not present
    let formatted = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (formatted.length > 0 && !formatted.startsWith('AX-')) {
      if (formatted.startsWith('AX') && formatted.length > 2) {
        formatted = 'AX-' + formatted.slice(2);
      } else if (!formatted.startsWith('A')) {
        formatted = 'AX-' + formatted;
      }
    }
    setCode(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code) {
      toast.error('Please enter your access code');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Invalid access code');
        return;
      }

      toast.success(`Welcome back, ${data.session.name}!`);
      router.push('/portal/dashboard');
      router.refresh();
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 hero-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Back link */}
        <div className="mb-8">
          <Link href="/" className="text-sm text-slate-500 hover:text-cyan transition-colors">
            ← Back to AlphaX
          </Link>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan to-navy flex items-center justify-center font-bold text-white text-2xl font-grotesk mb-4 glow-cyan">
              AX
            </div>
            <h1 className="text-2xl font-bold font-grotesk text-white">Alphanaut Portal</h1>
            <p className="text-slate-400 text-sm mt-1">Enter your 8-digit access code to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Access Code
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Lock size={18} className="text-slate-500" />
                </div>
                <input
                  type={showCode ? 'text' : 'password'}
                  placeholder="AX-XXXXXXXX"
                  value={code}
                  onChange={(e) => handleCodeInput(e.target.value)}
                  className="w-full form-input rounded-xl pl-12 pr-12 py-4 text-base font-mono border border-cyan/20 bg-dark/80 tracking-widest"
                  autoComplete="off"
                  maxLength={11}
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan transition-colors"
                >
                  {showCode ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Format: AX-XXXXXXXX (8 alphanumeric characters)
              </p>
            </div>

            <Button type="submit" loading={loading} size="lg" className="w-full">
              Access Portal
              <ArrowRight size={18} />
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-slate-600">OR</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* New member */}
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-3">Don&apos;t have an access code?</p>
            <Link
              href="/join"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-cyan/30 text-cyan text-sm font-semibold hover:bg-cyan/10 transition-colors"
            >
              Apply to Join AlphaX
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Admin link */}
        <div className="text-center mt-6">
          <Link href="/admin" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
            Admin Access
          </Link>
        </div>
      </div>
    </div>
  );
}
