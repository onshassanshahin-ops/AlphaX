'use client';

import { useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface PaperUploadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const FIELDS = [
  { value: 'medical', label: 'Medical' },
  { value: 'ai', label: 'AI & Technology' },
  { value: 'stem', label: 'STEM' },
  { value: 'neuroscience', label: 'Neuroscience' },
  { value: 'other', label: 'Other' },
];

export default function PaperUploadForm({ onSuccess, onCancel }: PaperUploadFormProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title_ar: '',
    title_en: '',
    original_authors: '',
    description_ar: '',
    description_en: '',
    field: 'medical',
    tags: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title_ar) {
      toast.error('Arabic title is required');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('file', file);

      const res = await fetch('/api/papers', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit paper');

      toast.success('Paper submitted for review!');
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Arabic Title */}
        <div className="md:col-span-2">
          <label className={labelClass}>Arabic Title *</label>
          <input
            type="text"
            required
            dir="rtl"
            placeholder="عنوان الورقة البحثية بالعربية"
            className={inputClass}
            value={formData.title_ar}
            onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
          />
        </div>

        {/* English Title */}
        <div className="md:col-span-2">
          <label className={labelClass}>English Title</label>
          <input
            type="text"
            placeholder="Paper title in English"
            className={inputClass}
            value={formData.title_en}
            onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
          />
        </div>

        {/* Original Authors */}
        <div>
          <label className={labelClass}>Original Authors</label>
          <input
            type="text"
            placeholder="Smith J., Jones A., ..."
            className={inputClass}
            value={formData.original_authors}
            onChange={(e) => setFormData({ ...formData, original_authors: e.target.value })}
          />
        </div>

        {/* Field */}
        <div>
          <label className={labelClass}>Field</label>
          <select
            className={inputClass}
            value={formData.field}
            onChange={(e) => setFormData({ ...formData, field: e.target.value })}
          >
            {FIELDS.map((f) => (
              <option key={f.value} value={f.value} className="bg-dark">
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Arabic Description */}
        <div className="md:col-span-2">
          <label className={labelClass}>Arabic Description</label>
          <textarea
            dir="rtl"
            rows={3}
            placeholder="وصف مختصر للورقة البحثية بالعربية..."
            className={`${inputClass} resize-none`}
            value={formData.description_ar}
            onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
          />
        </div>

        {/* English Description */}
        <div className="md:col-span-2">
          <label className={labelClass}>English Description</label>
          <textarea
            rows={3}
            placeholder="Brief description of the paper in English..."
            className={`${inputClass} resize-none`}
            value={formData.description_en}
            onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
          />
        </div>

        {/* Tags */}
        <div className="md:col-span-2">
          <label className={labelClass}>Tags (comma separated)</label>
          <input
            type="text"
            placeholder="machine-learning, cancer, diagnosis"
            className={inputClass}
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />
        </div>

        {/* PDF Upload */}
        <div className="md:col-span-2">
          <label className={labelClass}>PDF File</label>
          {file ? (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-cyan/30 bg-cyan/5">
              <FileText size={20} className="text-cyan" />
              <span className="flex-1 text-sm text-slate-300 truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-slate-400 hover:text-red-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center gap-3 p-8 rounded-xl border border-dashed border-cyan/20 hover:border-cyan/40 bg-dark/50 cursor-pointer transition-colors">
              <Upload size={24} className="text-slate-500" />
              <div className="text-center">
                <p className="text-sm text-slate-300">Drop PDF here or click to upload</p>
                <p className="text-xs text-slate-500 mt-1">PDF files only, max 50MB</p>
              </div>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading}>
          Submit for Review
        </Button>
      </div>
    </form>
  );
}
