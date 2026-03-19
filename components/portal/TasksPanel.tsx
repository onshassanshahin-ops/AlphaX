'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Circle, Clock, AlertCircle, Plus, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRelativeDate } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  deadline?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  assigned_by_alphanaut?: { name: string };
}

interface Alphanaut {
  id: string;
  name: string;
}

interface TasksPanelProps {
  blockSlug: string;
  alphanautId: string;
  isNavigator: boolean;
  blockMembers?: Alphanaut[];
  panelId?: string;
}

const priorityConfig = {
  low: { color: '#94a3b8', label: 'Low' },
  normal: { color: '#00B4D8', label: 'Normal' },
  high: { color: '#FFD700', label: 'High' },
  urgent: { color: '#FF4444', label: 'Urgent' },
};

const statusConfig = {
  pending: { icon: Circle, color: '#94a3b8', label: 'Pending' },
  in_progress: { icon: Clock, color: '#FFD700', label: 'In Progress' },
  completed: { icon: CheckCircle, color: '#22c55e', label: 'Done' },
  cancelled: { icon: X, color: '#ef4444', label: 'Cancelled' },
};

export default function TasksPanel({ blockSlug, alphanautId, isNavigator, blockMembers = [], panelId }: TasksPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '', deadline: '', priority: 'normal' });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ block: blockSlug });
      if (!isNavigator) params.set('assigned_to', alphanautId);
      const res = await fetch(`/api/tasks?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } finally {
      setLoading(false);
    }
  }, [blockSlug, alphanautId, isNavigator]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.assigned_to) { toast.error('Title and assignee are required'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, block_slug: blockSlug }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); return; }
      toast.success('Task assigned');
      setForm({ title: '', description: '', assigned_to: '', deadline: '', priority: 'normal' });
      setShowCreate(false);
      fetchTasks();
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (taskId: string, status: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: status as Task['status'] } : t));
      toast.success('Task updated');
    }
  };

  const filtered = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus);

  const memberLoad = blockMembers
    .map((m) => ({
      ...m,
      openTasks: tasks.filter(
        (t: Task & { assigned_to?: string }) =>
          (t as Task & { assigned_to?: string }).assigned_to === m.id &&
          t.status !== 'completed' &&
          t.status !== 'cancelled'
      ).length,
    }))
    .sort((a, b) => a.openTasks - b.openTasks);

  const recommendedAssignees = memberLoad.slice(0, 3);

  return (
    <div id={panelId} className={`glass-card rounded-2xl overflow-hidden portal-reveal portal-stagger-2 ${panelId ? 'panel-target' : ''}`}>
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <div>
          <h3 className="font-bold font-grotesk text-white flex items-center gap-2">
            <CheckCircle size={16} className="text-cyan" />
            Tasks
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isNavigator ? 'All block tasks' : 'Your assigned tasks'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-xs border border-white/10 bg-dark/80 text-slate-400 rounded-lg px-2 py-1.5"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Done</option>
          </select>
          {isNavigator && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-cyan/20 text-cyan border border-cyan/20 hover:bg-cyan/30 transition-colors"
            >
              <Plus size={13} />
              Assign Task
            </button>
          )}
        </div>
      </div>

      {/* Create form (navigator only) */}
      {showCreate && isNavigator && (
        <div className="p-5 border-b border-white/5 bg-navy/30">
          <form onSubmit={handleCreate} className="space-y-3">
            {recommendedAssignees.length > 0 && (
              <div className="rounded-xl bg-cyan/5 border border-cyan/15 p-3">
                <p className="text-xs text-cyan mb-2 font-medium">Smart Assignment Assistant</p>
                <div className="flex flex-wrap gap-2">
                  {recommendedAssignees.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, assigned_to: m.id }))}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                        form.assigned_to === m.id
                          ? 'border-cyan/40 text-cyan bg-cyan/10'
                          : 'border-white/10 text-slate-400 hover:text-white hover:border-cyan/30'
                      }`}
                    >
                      {m.name} · {m.openTasks} open
                    </button>
                  ))}
                </div>
              </div>
            )}
            <input
              required
              placeholder="Task title..."
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full form-input rounded-xl px-3 py-2 text-sm border border-cyan/20 bg-dark/80"
            />
            <textarea
              placeholder="Description (optional)..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full form-input rounded-xl px-3 py-2 text-sm border border-cyan/20 bg-dark/80 resize-none"
              rows={2}
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                required
                value={form.assigned_to}
                onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                className="form-input col-span-1 rounded-xl px-3 py-2 text-sm border border-cyan/20 bg-dark/80"
              >
                <option value="">Assign to...</option>
                {blockMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="form-input rounded-xl px-3 py-2 text-sm border border-cyan/20 bg-dark/80"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                className="form-input rounded-xl px-3 py-2 text-sm border border-cyan/20 bg-dark/80"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={creating}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan to-teal text-white disabled:opacity-50">
                {creating ? 'Assigning...' : 'Assign Task'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="text-sm text-slate-500 hover:text-slate-300 px-3">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks list */}
      <div className="divide-y divide-white/5">
        {loading ? (
          <div className="text-center py-10 text-slate-500 text-sm">Loading tasks...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            {filterStatus === 'all' ? 'No tasks yet' : `No ${filterStatus} tasks`}
          </div>
        ) : (
          filtered.map(task => {
            const StatusIcon = statusConfig[task.status]?.icon || Circle;
            const pColor = priorityConfig[task.priority]?.color || '#94a3b8';
            const sColor = statusConfig[task.status]?.color || '#94a3b8';
            const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';

            return (
              <div key={task.id} className="p-4 flex items-start gap-3 hover:bg-white/2 transition-colors">
                <StatusIcon size={18} style={{ color: sColor }} className="mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-white'}`}>
                      {task.title}
                    </p>
                    <span className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${pColor}15`, color: pColor }}>
                      {priorityConfig[task.priority]?.label}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {task.deadline && (
                      <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-slate-600'}`}>
                        <AlertCircle size={11} />
                        {isOverdue ? 'Overdue · ' : ''}
                        {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    {task.assigned_by_alphanaut && (
                      <span className="text-xs text-slate-600">by {task.assigned_by_alphanaut.name}</span>
                    )}
                    <span className="text-xs text-slate-700">{formatRelativeDate(task.created_at)}</span>
                  </div>
                </div>

                {/* Status toggle (own tasks only) */}
                {!isNavigator && task.status !== 'completed' && (
                  <div className="relative group/status">
                    <button className="text-xs px-2 py-1 rounded-lg border border-white/10 text-slate-500 hover:border-cyan/30 hover:text-cyan transition-colors flex items-center gap-1">
                      {statusConfig[task.status]?.label} <ChevronDown size={11} />
                    </button>
                    <div className="absolute right-0 top-full mt-1 bg-dark border border-white/10 rounded-xl overflow-hidden shadow-lg z-10 hidden group-hover/status:block min-w-28">
                      {(['pending', 'in_progress', 'completed'] as const).map(s => (
                        <button key={s} onClick={() => updateStatus(task.id, s)}
                          className="block w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
                          {statusConfig[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
