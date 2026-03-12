'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface ResearchFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  blockSlug: string;
}

const STATUSES = [
  { value: 'in_progress', label: 'In Progress' },
  { value: 'submitted', label: 'Submitted to Journal' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'published', label: 'Published' },
];

export default function ResearchForm({ onSuccess, onCancel, blockSlug }: ResearchFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    field: '',
    journal: '',
    doi: '',
    status: 'in_progress',
    is_public: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.abstract) {
      toast.error('Title and abstract are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, block_slug: blockSlug }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create research project');

      toast.success('Research project created!');
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full form-input rounded-xl px-4 py-3 text-sm placeholder-slate-500 border border-cyan/20 bg-dark/80 focus:outline-none focus:border-cyan transition-colors';
  const labelClass = 'block text-sm font-medium text-slate-300 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelClass}>Research Title *</label>
        <input
          type="text"
          required
          placeholder="Full title of the research paper"
          className={inputClass}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>Field</label>
          <input
            type="text"
            placeholder="e.g., Medical AI, Neuroscience"
            className={inputClass}
            value={formData.field}
            onChange={(e) => setFormData({ ...formData, field: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select
            className={inputClass}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value} className="bg-dark">
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Abstract *</label>
        <textarea
          required
          rows={5}
          placeholder="Provide a detailed abstract of the research..."
          className={`${inputClass} resize-none`}
          value={formData.abstract}
          onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>Journal / Conference</label>
          <input
            type="text"
            placeholder="Target or published journal"
            className={inputClass}
            value={formData.journal}
            onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>DOI (if published)</label>
          <input
            type="text"
            placeholder="10.xxxx/xxxxx"
            className={inputClass}
            value={formData.doi}
            onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_public"
          checked={formData.is_public}
          onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
          className="w-4 h-4 rounded border-cyan/30 bg-dark checked:bg-cyan"
        />
        <label htmlFor="is_public" className="text-sm text-slate-300 cursor-pointer">
          Make this research visible on the public Research page
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading}>
          Create Project
        </Button>
      </div>
    </form>
  );
}
