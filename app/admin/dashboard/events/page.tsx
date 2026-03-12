'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Plus, Trash2, RefreshCw, X, Globe, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
  description?: string;
  type: string;
  event_date: string;
  location?: string;
  link?: string;
  is_online: boolean;
  is_public: boolean;
  block_slug?: string;
}

const typeOptions = ['workshop', 'talk', 'webinar', 'meeting', 'hackathon', 'other'];

const emptyForm = { title: '', description: '', type: 'workshop', event_date: '', end_date: '', location: '', link: '', is_online: false, is_public: true, block_slug: '' };

export default function EventsAdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.event_date) { toast.error('Title and date are required'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, event_date: new Date(form.event_date).toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); return; }
      toast.success('Event created');
      setForm(emptyForm);
      setShowForm(false);
      fetchEvents();
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (event: Event) => {
    if (!confirm(`Delete "${event.title}"?`)) return;
    setDeletingId(event.id);
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Event deleted'); fetchEvents(); }
      else toast.error('Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const upcoming = events.filter(e => new Date(e.event_date) >= new Date());
  const past = events.filter(e => new Date(e.event_date) < new Date());

  return (
    <div className="min-h-screen bg-bg">
      <nav className="bg-dark border-b border-cyan/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-slate-400 hover:text-cyan transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-navy flex items-center justify-center font-bold text-white text-sm font-grotesk">AX</div>
          <div>
            <span className="font-bold font-grotesk text-white">Events</span>
            <span className="text-slate-500 text-xs ml-2">{events.length} total</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchEvents} className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan to-teal text-white hover:-translate-y-0.5 transition-all">
            <Plus size={16} />
            Add Event
          </button>
        </div>
      </nav>

      <div className="p-6 max-w-4xl mx-auto space-y-5">
        {/* Create Form */}
        {showForm && (
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold font-grotesk text-white flex items-center gap-2">
                <Calendar size={18} className="text-cyan" />
                New Event
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs text-slate-400 mb-1.5">Title *</label>
                  <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Event title" className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80 capitalize">
                    {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Date & Time *</label>
                  <input required type="datetime-local" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                    className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Location (or Online)</label>
                  <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Zoom, Damascus" className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Link (registration / join)</label>
                  <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                    placeholder="https://..." className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-400 mb-1.5">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="What will happen at this event..." rows={3}
                    className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80 resize-none" />
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={form.is_online} onChange={e => setForm(f => ({ ...f, is_online: e.target.checked }))} className="w-4 h-4" />
                    Online event
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={form.is_public} onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))} className="w-4 h-4" />
                    Publicly visible
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={creating}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan to-teal text-white disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create Event'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-300">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Upcoming */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h2 className="font-bold font-grotesk text-white">Upcoming ({upcoming.length})</h2>
          </div>
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading...</div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-12 text-slate-600">No upcoming events</div>
          ) : (
            <div className="divide-y divide-white/5">
              {upcoming.map(e => <EventRow key={e.id} event={e} onDelete={handleDelete} deletingId={deletingId} />)}
            </div>
          )}
        </div>

        {/* Past */}
        {past.length > 0 && (
          <div className="glass-card rounded-2xl overflow-hidden opacity-70">
            <div className="p-5 border-b border-white/5">
              <h2 className="font-bold font-grotesk text-slate-400">Past ({past.length})</h2>
            </div>
            <div className="divide-y divide-white/5">
              {past.slice(0, 5).map(e => <EventRow key={e.id} event={e} onDelete={handleDelete} deletingId={deletingId} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EventRow({ event, onDelete, deletingId }: { event: Event; onDelete: (e: Event) => void; deletingId: string | null }) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-white/2 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-white truncate">{event.title}</p>
          {event.is_public ? <Globe size={12} className="text-cyan shrink-0" /> : <Lock size={12} className="text-slate-600 shrink-0" />}
          <span className="text-xs text-slate-500 capitalize bg-white/5 px-2 py-0.5 rounded-full">{event.type}</span>
        </div>
        <p className="text-xs text-slate-500">
          {new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          {(event.location || event.is_online) && ` · ${event.is_online ? 'Online' : event.location}`}
        </p>
      </div>
      <button onClick={() => onDelete(event)} disabled={deletingId === event.id}
        className="text-xs px-3 py-1.5 rounded-lg text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors disabled:opacity-50 flex items-center gap-1.5">
        <Trash2 size={12} />
        {deletingId === event.id ? '...' : 'Delete'}
      </button>
    </div>
  );
}
