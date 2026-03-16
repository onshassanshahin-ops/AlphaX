'use client';

import { useState, useEffect } from 'react';
import PortalLayout from '@/components/layout/PortalLayout';
import Button from '@/components/ui/Button';
import { User, Send, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import type { PortalSession } from '@/types';
import { RoleBadge } from '@/components/ui/Badge';

interface BlockOption {
  id: string;
  slug: string;
  name: string;
  icon?: string;
  color?: string;
}

interface BlockRequest {
  id: string;
  block_slug: string;
  requested_role: 'member' | 'navigator';
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  created_at: string;
  block?: { slug: string; name: string; icon?: string; color?: string };
}

export default function ProfilePortalPage() {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [allBlocks, setAllBlocks] = useState<BlockOption[]>([]);
  const [requests, setRequests] = useState<BlockRequest[]>([]);
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedRole, setSelectedRole] = useState<'member' | 'navigator'>('member');
  const [requestNote, setRequestNote] = useState('');
  const [loadingPage, setLoadingPage] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingPage(true);
      try {
        const [authRes, blocksRes, requestsRes] = await Promise.all([
          fetch('/api/auth/portal'),
          fetch('/api/blocks?active=true'),
          fetch('/api/block-requests?status=all'),
        ]);

        if (authRes.ok) {
          const authData = await authRes.json();
          setSession(authData.session || null);
        }

        if (blocksRes.ok) {
          const blocksData = await blocksRes.json();
          setAllBlocks(blocksData.blocks || []);
        }

        if (requestsRes.ok) {
          const reqData = await requestsRes.json();
          setRequests(reqData.requests || []);
        }
      } finally {
        setLoadingPage(false);
      }
    };

    load();
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlock) {
      toast.error('Please select a block first');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/block-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          block_slug: selectedBlock,
          requested_role: selectedRole,
          note: requestNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to send request');
        return;
      }

      toast.success('Join request sent to admin');
      setSelectedBlock('');
      setSelectedRole('member');
      setRequestNote('');

      const refreshed = await fetch('/api/block-requests?status=all');
      if (refreshed.ok) {
        const refreshedData = await refreshed.json();
        setRequests(refreshedData.requests || []);
      }
    } catch {
      toast.error('Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  if (loadingPage || !session) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan/20 border-t-cyan animate-spin" />
      </div>
    );
  }

  const availableBlocks = allBlocks.filter((b) => !session.blocks.includes(b.slug));

  const statusBadgeClass = (status: BlockRequest['status']) => {
    if (status === 'approved') return 'text-green-300 border-green-500/30 bg-green-500/10';
    if (status === 'rejected') return 'text-red-300 border-red-500/30 bg-red-500/10';
    return 'text-gold border-gold/30 bg-gold/10';
  };

  return (
    <PortalLayout session={session}>
      <div className="space-y-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple/30 to-cyan/20 border border-cyan/20 flex items-center justify-center text-xl">
            👤
          </div>
          <div>
            <h1 className="text-2xl font-bold font-grotesk text-white">My AlphaX Space</h1>
            <p className="text-sm text-slate-400">Identity, blocks, and growth requests</p>
          </div>
        </div>

        {/* Identity */}
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

          <div className="p-4 rounded-xl bg-navy/30 border border-cyan/15">
            <p className="text-xs text-cyan uppercase tracking-widest mb-2">Portal Presence</p>
            <p className="text-sm text-slate-300 leading-relaxed">
              You are currently part of {session.blocks.length} block{session.blocks.length !== 1 ? 's' : ''}.
              Request additional access below and admins can approve you as member or navigator.
            </p>
          </div>
        </div>

        {/* Current blocks */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold font-grotesk text-white mb-4">Current Block Access</h3>
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

        {/* Join request form */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold font-grotesk text-white mb-1 flex items-center gap-2">
            <Sparkles size={16} className="text-cyan" />
            Request New Block Access
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Ask admins to add you to another block as an Alphanaut (member) or Navigator.
          </p>

          {availableBlocks.length === 0 ? (
            <p className="text-sm text-slate-500">You already have access to all active blocks.</p>
          ) : (
            <form onSubmit={handleRequest} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">Block</label>
                  <select
                    value={selectedBlock}
                    onChange={(e) => setSelectedBlock(e.target.value)}
                    className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80"
                  >
                    <option value="">Select block...</option>
                    {availableBlocks.map((block) => (
                      <option key={block.slug} value={block.slug}>
                        {block.icon || '🧩'} {block.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">Requested Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as 'member' | 'navigator')}
                    className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80"
                  >
                    <option value="member">Alphanaut</option>
                    <option value="navigator">Navigator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Note to Admin (optional)</label>
                <textarea
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  rows={3}
                  placeholder="Why this block and how you can contribute..."
                  className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80 resize-none"
                />
              </div>

              <Button type="submit" loading={loading}>
                <Send size={16} />
                Send Join Request
              </Button>
            </form>
          )}
        </div>

        {/* Requests history */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold font-grotesk text-white mb-4">My Block Requests</h3>
          {requests.length === 0 ? (
            <p className="text-sm text-slate-500">No requests yet.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="p-3 rounded-xl border border-white/10 bg-dark/40 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm text-white font-medium">
                      {request.block?.icon || '🧩'} {request.block?.name || request.block_slug}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Requested as {request.requested_role}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadgeClass(request.status)}`}
                  >
                    {request.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
