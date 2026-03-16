'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Users,
  Copy,
  Check,
  Search,
  UserCheck,
  UserX,
  RefreshCw,
  Pencil,
  BellRing,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const BLOCKS = [
  { id: 'knowledge-bridge', label: 'Knowledge Bridge', icon: '📚' },
  { id: 'asclepius-lab', label: 'Asclepius Lab', icon: '🏥' },
  { id: 'neuroscience', label: 'Neuroscience', icon: '🧠' },
  { id: 'creative-lab', label: 'Creative Lab', icon: '🎨' },
  { id: 'science-comm', label: 'Science Comm', icon: '📡' },
  { id: 'operations', label: 'Operations', icon: '⚙️' },
  { id: 'engineering', label: 'Engineering', icon: '💻' },
];

const ROLES = ['alphanaut', 'navigator', 'co-captain'];

interface Alphanaut {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  university?: string;
  field_of_study?: string;
  role: string;
  access_code: string;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  alphanaut_blocks?: {
    role?: 'member' | 'navigator';
    blocks?: { slug: string; name: string; color: string; icon: string };
  }[];
}

interface BlockJoinRequest {
  id: string;
  block_slug: string;
  requested_role: 'member' | 'navigator';
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  alphanaut?: { id: string; name: string; email?: string; role?: string };
  block?: { slug: string; name: string; color?: string; icon?: string };
}

export default function AdminAlphanauts() {
  const [alphanauts, setAlphanauts] = useState<Alphanaut[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allBlocks, setAllBlocks] = useState<{ id: string; slug: string; name: string; icon?: string; color?: string }[]>([]);
  const [pendingRequests, setPendingRequests] = useState<BlockJoinRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [decisionRoles, setDecisionRoles] = useState<Record<string, 'member' | 'navigator'>>({});

  const [editTarget, setEditTarget] = useState<Alphanaut | null>(null);
  const [editMemberBlocks, setEditMemberBlocks] = useState<string[]>([]);
  const [editNavigatorBlocks, setEditNavigatorBlocks] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', university: '',
    field_of_study: '', role: 'alphanaut', bio: '', is_public: false,
    memberBlocks: [] as string[],    // block slugs assigned as member
    navigatorBlocks: [] as string[], // block slugs assigned as navigator
  });

  const fetchAlphanauts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/alphanauts');
      const data = await res.json();
      setAlphanauts(data.alphanauts || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBlocks = useCallback(async () => {
    const res = await fetch('/api/blocks');
    if (res.ok) {
      const data = await res.json();
      setAllBlocks(data.blocks || []);
    }
  }, []);

  const fetchPendingRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const res = await fetch('/api/block-requests?status=pending');
      const data = await res.json();
      const requests = data.requests || [];
      setPendingRequests(requests);
      const nextRoles: Record<string, 'member' | 'navigator'> = {};
      requests.forEach((r: BlockJoinRequest) => {
        nextRoles[r.id] = (r.requested_role || 'member') as 'member' | 'navigator';
      });
      setDecisionRoles(nextRoles);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlphanauts();
    fetchBlocks();
    fetchPendingRequests();
  }, [fetchAlphanauts, fetchBlocks, fetchPendingRequests]);

  const blockChoices = allBlocks.length > 0
    ? allBlocks.map((b) => ({ id: b.slug, label: b.name, icon: b.icon || '🧩' }))
    : BLOCKS;

  const cycleBlockRole = (
    memberBlocks: string[],
    navigatorBlocks: string[],
    blockSlug: string
  ) => {
    if (navigatorBlocks.includes(blockSlug)) {
      return {
        memberBlocks,
        navigatorBlocks: navigatorBlocks.filter((slug) => slug !== blockSlug),
      };
    }
    if (memberBlocks.includes(blockSlug)) {
      return {
        memberBlocks: memberBlocks.filter((slug) => slug !== blockSlug),
        navigatorBlocks: [...navigatorBlocks, blockSlug],
      };
    }
    return {
      memberBlocks: [...memberBlocks, blockSlug],
      navigatorBlocks,
    };
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setCreating(true);
    try {
      const allSelectedSlugs = [...form.memberBlocks, ...form.navigatorBlocks];
      const blockIds = allSelectedSlugs
        .map(slug => allBlocks.find(b => b.slug === slug)?.id)
        .filter(Boolean) as string[];
      const navigatorBlockIds = form.navigatorBlocks
        .map(slug => allBlocks.find(b => b.slug === slug)?.id)
        .filter(Boolean) as string[];

      const res = await fetch('/api/alphanauts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, blocks: blockIds, navigatorBlockIds }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); return; }
      setNewCode(data.accessCode);
      toast.success(`Alphanaut created! Code: ${data.accessCode}`);
      setForm({ name: '', email: '', phone: '', university: '', field_of_study: '', role: 'alphanaut', bio: '', is_public: false, memberBlocks: [], navigatorBlocks: [] });
      fetchAlphanauts();
    } catch {
      toast.error('Failed to create Alphanaut');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch('/api/alphanauts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    });
    if (res.ok) {
      toast.success(current ? 'Deactivated' : 'Activated');
      fetchAlphanauts();
    } else {
      toast.error('Update failed');
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Code copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = alphanauts.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.access_code.toLowerCase().includes(search.toLowerCase())
  );

  const roleColor: Record<string, string> = {
    'co-captain': 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30',
    'navigator': 'text-cyan-400 bg-cyan/15 border-cyan/30',
    'alphanaut': 'text-purple-400 bg-purple/15 border-purple/30',
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Top Bar */}
      <nav className="bg-dark border-b border-cyan/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-slate-400 hover:text-cyan transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-navy flex items-center justify-center font-bold text-white text-sm font-grotesk">
            AX
          </div>
          <div>
            <span className="font-bold font-grotesk text-white">Manage Alphanauts</span>
            <span className="text-slate-500 text-xs ml-2">{alphanauts.length} total</span>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setNewCode(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan to-teal text-white hover:-translate-y-0.5 transition-all"
        >
          <Plus size={16} />
          Add Alphanaut
        </button>
      </nav>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* New Code Banner */}
        {newCode && (
          <div className="glass-card rounded-2xl p-5 border border-green-500/30 bg-green-500/5">
            <p className="text-sm text-green-400 font-semibold mb-1">✅ Alphanaut created successfully!</p>
            <p className="text-slate-400 text-sm mb-3">Share this access code with the new member:</p>
            <div className="flex items-center gap-3">
              <code className="text-xl font-mono font-bold text-green-300 bg-dark/80 px-4 py-2 rounded-xl border border-green-500/30 tracking-widest">
                {newCode}
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(newCode); toast.success('Copied!'); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-green-400 border border-green-500/30 hover:bg-green-500/10 transition-colors"
              >
                <Copy size={14} /> Copy
              </button>
              <button onClick={() => setNewCode(null)} className="text-slate-500 hover:text-slate-300 text-sm">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Add Form */}
        {showForm && (
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-bold font-grotesk text-white mb-5 flex items-center gap-2">
              <Plus size={18} className="text-cyan" />
              New Alphanaut
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Name"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Phone</label>
                  <input
                    type="text"
                    placeholder="+963..."
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Role</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">University</label>
                  <input
                    type="text"
                    placeholder="University name"
                    value={form.university}
                    onChange={e => setForm(f => ({ ...f, university: e.target.value }))}
                    className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Field of Study</label>
                  <input
                    type="text"
                    placeholder="e.g. Medicine, Computer Science"
                    value={form.field_of_study}
                    onChange={e => setForm(f => ({ ...f, field_of_study: e.target.value }))}
                    className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Bio</label>
                <textarea
                  placeholder="Short bio..."
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80 resize-none"
                  rows={2}
                />
              </div>

              {/* Block assignment */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Assign to Blocks</label>
                <p className="text-xs text-slate-600 mb-2">Click to cycle: None → Member → Navigator → None</p>
                <div className="flex flex-wrap gap-2">
                  {blockChoices.map(b => {
                    const isMember = form.memberBlocks.includes(b.id);
                    const isNav = form.navigatorBlocks.includes(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setForm((f) => {
                          const next = cycleBlockRole(f.memberBlocks, f.navigatorBlocks, b.id);
                          return { ...f, memberBlocks: next.memberBlocks, navigatorBlocks: next.navigatorBlocks };
                        })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          isNav
                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                            : isMember
                            ? 'bg-cyan/20 text-cyan border-cyan/40'
                            : 'bg-transparent text-slate-400 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {b.icon} {b.label} {isNav ? '⭐' : isMember ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
                {(form.navigatorBlocks.length > 0) && (
                  <p className="text-xs text-yellow-400/70 mt-1.5">⭐ = Navigator of this block &nbsp;·&nbsp; ✓ = Member</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={form.is_public}
                  onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="is_public" className="text-sm text-slate-400">
                  Show on public About page
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan to-teal text-white disabled:opacity-50 hover:-translate-y-0.5 transition-all"
                >
                  {creating ? 'Creating...' : 'Create Alphanaut & Generate Code'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-300">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email, or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full form-input rounded-xl pl-9 pr-4 py-2.5 text-sm border border-cyan/20 bg-dark/80"
            />
          </div>
          <button onClick={fetchAlphanauts} className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Pending Join Requests */}
        <div className="glass-card rounded-2xl p-5 border border-gold/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-grotesk text-white flex items-center gap-2">
              <BellRing size={17} className="text-gold" />
              Block Join Requests
            </h2>
            <button
              onClick={fetchPendingRequests}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Refresh
            </button>
          </div>
          {requestsLoading ? (
            <p className="text-sm text-slate-500">Loading pending requests...</p>
          ) : pendingRequests.length === 0 ? (
            <p className="text-sm text-slate-500">No pending join requests.</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-xl border border-white/10 bg-dark/40 p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white font-semibold">
                      {request.alphanaut?.name || 'Unknown Alphanaut'}
                      <span className="text-slate-500 font-normal"> requests </span>
                      {request.block?.name || request.block_slug}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Requested role: {request.requested_role}
                    </p>
                    {request.note && (
                      <p className="text-xs text-slate-400 mt-1">"{request.note}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={decisionRoles[request.id] || 'member'}
                      onChange={(e) =>
                        setDecisionRoles((prev) => ({
                          ...prev,
                          [request.id]: e.target.value as 'member' | 'navigator',
                        }))
                      }
                      className="form-input rounded-lg px-3 py-1.5 text-xs border border-cyan/20 bg-dark/80"
                    >
                      <option value="member">Approve as Alphanaut</option>
                      <option value="navigator">Approve as Navigator</option>
                    </select>

                    <button
                      onClick={async () => {
                        setProcessingRequestId(request.id);
                        try {
                          const res = await fetch('/api/block-requests', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              id: request.id,
                              status: 'approved',
                              resolved_role: decisionRoles[request.id] || 'member',
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            toast.error(data.error || 'Failed to approve request');
                            return;
                          }
                          toast.success('Request approved');
                          fetchPendingRequests();
                          fetchAlphanauts();
                        } finally {
                          setProcessingRequestId(null);
                        }
                      }}
                      disabled={processingRequestId === request.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-green-300 border border-green-500/30 hover:bg-green-500/10 disabled:opacity-50"
                    >
                      Approve
                    </button>

                    <button
                      onClick={async () => {
                        setProcessingRequestId(request.id);
                        try {
                          const res = await fetch('/api/block-requests', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: request.id, status: 'rejected' }),
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            toast.error(data.error || 'Failed to reject request');
                            return;
                          }
                          toast.success('Request rejected');
                          fetchPendingRequests();
                        } finally {
                          setProcessingRequestId(null);
                        }
                      }}
                      disabled={processingRequestId === request.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-300 border border-red-500/30 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-slate-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">No Alphanauts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Access Code</th>
                    <th>Role</th>
                    <th>Blocks</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div>
                          <p className="font-semibold text-white">{a.name}</p>
                          {a.email && <p className="text-xs text-slate-500">{a.email}</p>}
                          {a.university && <p className="text-xs text-slate-600">{a.university}</p>}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-cyan bg-cyan/10 px-2 py-0.5 rounded">
                            {a.access_code}
                          </code>
                          <button
                            onClick={() => copyCode(a.access_code, a.id)}
                            className="text-slate-500 hover:text-cyan transition-colors"
                          >
                            {copiedId === a.id ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${roleColor[a.role] || 'text-slate-400'}`}>
                          {a.role}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {(a.alphanaut_blocks || []).slice(0, 3).map((ab, i) => ab.blocks && (
                            <span
                              key={i}
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: `${ab.blocks.color}15`, color: ab.blocks.color }}
                            >
                              {ab.blocks.icon}
                            </span>
                          ))}
                          {(a.alphanaut_blocks || []).length === 0 && (
                            <span className="text-xs text-slate-600">None</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          a.is_active ? 'text-green-400 bg-green-500/10 border-green-500/30' : 'text-slate-500 bg-slate-700/30 border-slate-600/30'
                        }`}>
                          {a.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditTarget(a);
                              const memberships = a.alphanaut_blocks || [];
                              setEditMemberBlocks(
                                memberships
                                  .filter((ab) => ab.role === 'member' && ab.blocks?.slug)
                                  .map((ab) => ab.blocks!.slug)
                              );
                              setEditNavigatorBlocks(
                                memberships
                                  .filter((ab) => ab.role === 'navigator' && ab.blocks?.slug)
                                  .map((ab) => ab.blocks!.slug)
                              );
                            }}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-cyan/30 text-cyan hover:bg-cyan/10"
                          >
                            <Pencil size={12} />
                            Edit Blocks
                          </button>
                          <button
                            onClick={() => toggleActive(a.id, a.is_active)}
                            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                              a.is_active
                                ? 'text-red-400 border-red-500/30 hover:bg-red-500/10'
                                : 'text-green-400 border-green-500/30 hover:bg-green-500/10'
                            }`}
                          >
                            {a.is_active ? <><UserX size={12} /> Deactivate</> : <><UserCheck size={12} /> Activate</>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {editTarget && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-cyan/20 bg-dark p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold font-grotesk text-white">Edit Block Memberships</h3>
                  <p className="text-sm text-slate-500">{editTarget.name}</p>
                </div>
                <button
                  onClick={() => setEditTarget(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-3">Click each block to cycle: None -&gt; Member -&gt; Navigator -&gt; None</p>
              <div className="flex flex-wrap gap-2">
                {blockChoices.map((b) => {
                  const isMember = editMemberBlocks.includes(b.id);
                  const isNav = editNavigatorBlocks.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        const next = cycleBlockRole(editMemberBlocks, editNavigatorBlocks, b.id);
                        setEditMemberBlocks(next.memberBlocks);
                        setEditNavigatorBlocks(next.navigatorBlocks);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isNav
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                          : isMember
                          ? 'bg-cyan/20 text-cyan border-cyan/40'
                          : 'bg-transparent text-slate-400 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {b.icon} {b.label} {isNav ? '⭐' : isMember ? '✓' : ''}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 border border-white/10 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={async () => {
                    if (!editTarget) return;
                    setSavingEdit(true);
                    try {
                      const allSelectedSlugs = [...editMemberBlocks, ...editNavigatorBlocks];
                      const blockIds = allSelectedSlugs
                        .map((slug) => allBlocks.find((b) => b.slug === slug)?.id)
                        .filter(Boolean) as string[];
                      const navigatorBlockIds = editNavigatorBlocks
                        .map((slug) => allBlocks.find((b) => b.slug === slug)?.id)
                        .filter(Boolean) as string[];

                      const res = await fetch('/api/alphanauts', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          id: editTarget.id,
                          blocks: blockIds,
                          navigatorBlockIds,
                        }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        toast.error(data.error || 'Failed to update blocks');
                        return;
                      }
                      toast.success('Block memberships updated');
                      setEditTarget(null);
                      fetchAlphanauts();
                    } finally {
                      setSavingEdit(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan to-teal text-white disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
