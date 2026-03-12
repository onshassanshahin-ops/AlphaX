'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Settings, RefreshCw, Users, Star, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Block {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active: boolean;
  navigator_id?: string;
  created_at: string;
  navigator?: { id: string; name: string };
  member_count?: number;
}

interface Alphanaut {
  id: string;
  name: string;
  role: string;
}

const BLOCK_COLORS: Record<string, string> = {
  'knowledge-bridge': '#00B4D8',
  'asclepius-lab': '#118AB2',
  'neuroscience': '#9B59B6',
  'creative-lab': '#FF6B35',
  'science-comm': '#FFD700',
  'operations': '#EDF2F4',
  'engineering': '#4FC3F7',
};

export default function AdminBlocks() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [alphanauts, setAlphanauts] = useState<Alphanaut[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ navigator_id: string; description: string }>({ navigator_id: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [blocksRes, alphanauts0Res] = await Promise.all([
        fetch('/api/blocks'),
        fetch('/api/alphanauts?active=true'),
      ]);
      if (blocksRes.ok) {
        const data = await blocksRes.json();
        setBlocks(data.blocks || []);
      }
      if (alphanauts0Res.ok) {
        const data = await alphanauts0Res.json();
        setAlphanauts(data.alphanauts || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const startEdit = (block: Block) => {
    setEditingId(block.id);
    setEditForm({
      navigator_id: block.navigator_id || '',
      description: block.description || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ navigator_id: '', description: '' });
  };

  const saveBlock = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/blocks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          navigator_id: editForm.navigator_id || null,
          description: editForm.description || null,
        }),
      });
      if (res.ok) {
        toast.success('Block updated');
        cancelEdit();
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Update failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch('/api/blocks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    });
    if (res.ok) {
      toast.success(current ? 'Block deactivated' : 'Block activated');
      fetchData();
    } else {
      toast.error('Update failed');
    }
  };

  // Group alphanauts by role for navigator selection
  const captains = alphanauts.filter(a => a.role === 'co-captain');
  const navigators = alphanauts.filter(a => a.role === 'navigator');

  return (
    <div className="min-h-screen bg-bg">
      <nav className="bg-dark border-b border-cyan/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-slate-400 hover:text-cyan transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-navy flex items-center justify-center font-bold text-white text-sm font-grotesk">
            AX
          </div>
          <div>
            <span className="font-bold font-grotesk text-white">Manage Blocks</span>
            <span className="text-slate-500 text-xs ml-2">{blocks.length} blocks</span>
          </div>
        </div>
        <button onClick={fetchData} className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors">
          <RefreshCw size={16} />
        </button>
      </nav>

      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <div className="glass-card rounded-2xl p-4 border border-cyan/10">
          <p className="text-sm text-slate-400">
            <span className="text-cyan font-semibold">Blocks</span> are the teams within AlphaX.
            Assign Navigators to lead each block. Navigators can review submissions and manage their block members.
            Members are assigned to blocks through the <Link href="/admin/dashboard/alphanauts" className="text-cyan hover:underline">Alphanauts</Link> page.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blocks.map(block => {
              const color = BLOCK_COLORS[block.slug] || block.color || '#00B4D8';
              const isEditing = editingId === block.id;

              return (
                <div
                  key={block.id}
                  className="glass-card rounded-2xl overflow-hidden border transition-all"
                  style={{ borderColor: `${color}30` }}
                >
                  {/* Header */}
                  <div className="p-5" style={{ background: `linear-gradient(135deg, ${color}10, transparent)` }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                          style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
                        >
                          {block.icon || '📦'}
                        </div>
                        <div>
                          <h3 className="font-bold font-grotesk text-white">{block.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{block.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          block.is_active ? 'text-green-400 bg-green-500/10 border-green-500/30' : 'text-slate-500 bg-slate-700/30 border-slate-600/30'
                        }`}>
                          {block.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {isEditing ? (
                          <button onClick={cancelEdit} className="text-slate-500 hover:text-white transition-colors">
                            <X size={16} />
                          </button>
                        ) : (
                          <button onClick={() => startEdit(block)} className="p-1.5 rounded-lg text-slate-500 hover:text-white border border-white/10 hover:border-white/30 transition-colors">
                            <Edit2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-5 pb-5 space-y-3">
                    {/* Description */}
                    {isEditing ? (
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Description</label>
                        <textarea
                          value={editForm.description}
                          onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                          rows={2}
                          className="w-full form-input rounded-xl px-3 py-2 text-sm border border-white/10 bg-dark/80 resize-none"
                        />
                      </div>
                    ) : (
                      block.description && (
                        <p className="text-sm text-slate-400">{block.description}</p>
                      )
                    )}

                    {/* Navigator */}
                    <div className="flex items-center gap-2">
                      <Star size={14} className="text-yellow-400 shrink-0" />
                      {isEditing ? (
                        <select
                          value={editForm.navigator_id}
                          onChange={e => setEditForm(f => ({ ...f, navigator_id: e.target.value }))}
                          className="flex-1 form-input rounded-xl px-3 py-1.5 text-sm border border-white/10 bg-dark/80"
                        >
                          <option value="">No Navigator assigned</option>
                          {captains.length > 0 && (
                            <optgroup label="Co-Captains">
                              {captains.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </optgroup>
                          )}
                          {navigators.length > 0 && (
                            <optgroup label="Navigators">
                              {navigators.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </optgroup>
                          )}
                          <optgroup label="All Alphanauts">
                            {alphanauts.filter(a => a.role === 'alphanaut').map(a => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                          </optgroup>
                        </select>
                      ) : (
                        <span className="text-sm text-slate-400">
                          {block.navigator?.name
                            ? <span className="text-yellow-400 font-semibold">{block.navigator.name}</span>
                            : <span className="text-slate-600">No Navigator assigned</span>
                          }
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    {isEditing ? (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => saveBlock(block.id)}
                          disabled={saving}
                          className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50"
                          style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => toggleActive(block.id, block.is_active)}
                          className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                            block.is_active ? 'text-red-400 border-red-500/30 hover:bg-red-500/10' : 'text-green-400 border-green-500/30 hover:bg-green-500/10'
                          }`}
                        >
                          {block.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Users size={12} />
                          <span>Active block</span>
                        </div>
                        <Settings size={12} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
