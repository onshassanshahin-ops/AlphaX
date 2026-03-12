'use client';

import { useState, useEffect } from 'react';
import PortalLayout from '@/components/layout/PortalLayout';
import Button from '@/components/ui/Button';
import { User, Save, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import type { PortalSession } from '@/types';
import { RoleBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

const MOCK_SESSION: PortalSession = {
  alphanaut_id: '',
  name: 'Alphanaut',
  role: 'alphanaut',
  blocks: [],
};

export default function ProfilePortalPage() {
  const [session, setSession] = useState<PortalSession>(MOCK_SESSION);
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // In a real implementation, we'd fetch the profile from an API
    // For now, use placeholder data
  }, []);

  const copyCode = () => {
    // Would copy the alphanaut's access code
    navigator.clipboard.writeText('AX-XXXXXXXX');
    setCopied(true);
    toast.success('Access code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full form-input rounded-xl px-4 py-3 text-sm border border-cyan/20 bg-dark/80 focus:outline-none focus:border-cyan transition-colors placeholder-slate-500';
  const labelClass = 'block text-sm font-medium text-slate-300 mb-1.5';

  return (
    <PortalLayout session={session}>
      <div className="space-y-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple/20 border border-purple/30 flex items-center justify-center text-xl">
            👤
          </div>
          <div>
            <h1 className="text-2xl font-bold font-grotesk text-white">My Profile</h1>
            <p className="text-sm text-slate-400">Manage your Alphanaut profile</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-5 mb-6 pb-6 border-b border-white/5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-navy to-cyan/30 flex items-center justify-center text-3xl font-bold font-grotesk text-white">
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-grotesk">{session.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <RoleBadge role={session.role} />
              </div>
            </div>
          </div>

          {/* Access Code */}
          <div className="p-4 rounded-xl bg-navy/30 border border-cyan/15 mb-6">
            <p className="text-xs text-cyan uppercase tracking-widest mb-2">Your Access Code</p>
            <div className="flex items-center gap-3">
              <code className="text-lg font-mono text-cyan tracking-widest font-bold">
                AX-••••••••
              </code>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 border border-white/10 hover:text-cyan hover:border-cyan/30 transition-colors"
              >
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Keep this code private. It&apos;s your key to the portal.
            </p>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <h3 className="font-semibold text-white font-grotesk">Edit Profile</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Display Name</label>
                <input
                  type="text"
                  placeholder={session.name}
                  className={inputClass}
                  value={profile.name || ''}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>University</label>
                <input
                  type="text"
                  placeholder="Your university"
                  className={inputClass}
                  value={profile.university || ''}
                  onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Field of Study</label>
                <input
                  type="text"
                  placeholder="e.g., Medicine, Computer Science"
                  className={inputClass}
                  value={profile.field_of_study || ''}
                  onChange={(e) => setProfile({ ...profile, field_of_study: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Bio</label>
                <textarea
                  rows={3}
                  placeholder="A brief bio about yourself..."
                  className={`${inputClass} resize-none`}
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_public"
                checked={profile.is_public === 'true'}
                onChange={(e) => setProfile({ ...profile, is_public: e.target.checked ? 'true' : 'false' })}
                className="w-4 h-4 rounded border-cyan/30 bg-dark"
              />
              <label htmlFor="is_public" className="text-sm text-slate-300 cursor-pointer">
                Show my profile on the public About page
              </label>
            </div>

            <Button type="submit" loading={loading}>
              <Save size={16} />
              Save Changes
            </Button>
          </form>
        </div>

        {/* Blocks */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold font-grotesk text-white mb-4">My Blocks</h3>
          {session.blocks.length === 0 ? (
            <p className="text-slate-500 text-sm">You haven&apos;t been assigned to any blocks yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {session.blocks.map((slug) => (
                <span
                  key={slug}
                  className="px-3 py-1.5 rounded-xl text-sm font-medium bg-cyan/10 text-cyan border border-cyan/20"
                >
                  {slug}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
