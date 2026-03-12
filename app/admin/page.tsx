'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Shield, Eye, EyeOff, ArrowRight, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Username and password are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Invalid credentials');
        return;
      }

      toast.success('Welcome, Admin!');
      router.push('/admin/dashboard');
      router.refresh();
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 hero-grid opacity-10 pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-48 h-48 bg-navy/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="mb-6">
          <Link href="/" className="text-sm text-slate-500 hover:text-cyan transition-colors">
            ← Back to AlphaX
          </Link>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-navy/60 border border-cyan/20 flex items-center justify-center mb-4">
              <Shield size={28} className="text-cyan" />
            </div>
            <h1 className="text-2xl font-bold font-grotesk text-white">Admin Panel</h1>
            <p className="text-slate-400 text-sm mt-1">AlphaX Dashboard Access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="admin"
                  autoComplete="username"
                  className="w-full form-input rounded-xl pl-11 pr-4 py-3 text-sm border border-cyan/20 bg-dark/80"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full form-input rounded-xl pl-11 pr-11 py-3 text-sm border border-cyan/20 bg-dark/80"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
              Access Dashboard
              <ArrowRight size={16} />
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}
