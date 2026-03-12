'use client';

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const BLOCKS = [
  { value: 'knowledge-bridge', label: '📚 Knowledge Bridge', desc: 'Translate research into Arabic' },
  { value: 'asclepius-lab', label: '🏥 Asclepius Lab', desc: 'Medical AI research' },
  { value: 'neuroscience', label: '🧠 Neuroscience Research', desc: 'Brain science & mental health' },
  { value: 'creative-lab', label: '🎨 Creative Lab', desc: 'Design & visual identity' },
  { value: 'science-comm', label: '📡 Science Communication', desc: 'Outreach & social media' },
  { value: 'operations', label: '⚙️ Operations & Strategy', desc: 'Coordination & planning' },
  { value: 'engineering', label: '💻 Engineering & Systems', desc: 'Technical infrastructure' },
];

const HOW_HEARD = [
  'Social Media (Instagram/Twitter)',
  'Friend or Colleague',
  'University',
  'Online Forum',
  'Search Engine',
  'Other',
];

export default function JoinPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    university: '',
    field_of_study: '',
    motivation: '',
    skills: '',
    how_heard: '',
  });

  const toggleBlock = (value: string) => {
    setSelectedBlocks((prev) =>
      prev.includes(value) ? prev.filter((b) => b !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }
    if (selectedBlocks.length === 0) {
      toast.error('Please select at least one preferred block');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, preferred_blocks: selectedBlocks }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setSubmitted(true);
      toast.success('Application submitted!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full form-input rounded-xl px-4 py-3 text-sm border border-cyan/20 bg-dark/80 focus:outline-none focus:border-cyan transition-colors placeholder-slate-500';
  const labelClass = 'block text-sm font-medium text-slate-300 mb-1.5';

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-bg">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-lg w-full text-center">
            <div className="w-24 h-24 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-8">
              <CheckCircle size={48} className="text-green-400" />
            </div>
            <h1 className="text-4xl font-bold font-grotesk text-white mb-4">
              Application Submitted!
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              Thank you for applying to AlphaX! Your application has been received and is
              under review. We&apos;ll be in touch soon with your access code.
            </p>
            <div className="glass-card rounded-2xl p-6 mb-8 text-left">
              <p className="text-sm font-semibold text-cyan mb-3">What happens next?</p>
              <ol className="space-y-3 text-sm text-slate-400">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan/20 text-cyan text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">1</span>
                  Our team reviews your application (usually within 1–3 days)
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan/20 text-cyan text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">2</span>
                  If accepted, you&apos;ll receive your unique 8-digit Alphanaut access code
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan/20 text-cyan text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">3</span>
                  Use your code to access the Alphanaut Portal and your assigned blocks
                </li>
              </ol>
            </div>
            <Button onClick={() => setSubmitted(false)} variant="secondary">
              Submit Another Application
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange/10 to-transparent pointer-events-none" />
        <div className="absolute inset-0 hero-grid opacity-20 pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative">
          <span className="text-orange text-sm font-semibold uppercase tracking-widest">Join AlphaX</span>
          <h1 className="text-4xl sm:text-5xl font-bold font-grotesk text-white mt-3 mb-4">
            Become an Alphanaut
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Join a growing collective of Syrian researchers, designers, developers, and communicators
            working to advance Arab science. No matter your background — there&apos;s a block for you.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="flex-1 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Info */}
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-xl font-bold font-grotesk text-white mb-6">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <input type="text" required placeholder="Your full name" className={inputClass}
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Email Address *</label>
                  <input type="email" required placeholder="your@email.com" className={inputClass}
                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input type="tel" placeholder="+963..." className={inputClass}
                    value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>University / Institution</label>
                  <input type="text" placeholder="Your university" className={inputClass}
                    value={formData.university} onChange={(e) => setFormData({ ...formData, university: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Field of Study</label>
                  <input type="text" placeholder="e.g., Medicine, Computer Science, Biology" className={inputClass}
                    value={formData.field_of_study} onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Preferred Blocks */}
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-xl font-bold font-grotesk text-white mb-2">
                Preferred Blocks *
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Select the blocks you&apos;re most interested in joining (you can select multiple).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BLOCKS.map((block) => (
                  <button
                    key={block.value}
                    type="button"
                    onClick={() => toggleBlock(block.value)}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200 ${
                      selectedBlocks.includes(block.value)
                        ? 'bg-cyan/15 border-cyan/40 text-white'
                        : 'bg-transparent border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      selectedBlocks.includes(block.value)
                        ? 'bg-cyan border-cyan'
                        : 'border-slate-600'
                    }`}>
                      {selectedBlocks.includes(block.value) && (
                        <svg className="w-3 h-3 text-bg" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{block.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{block.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Motivation */}
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-xl font-bold font-grotesk text-white mb-6">
                Tell Us About Yourself
              </h2>
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Why do you want to join AlphaX?</label>
                  <textarea rows={4} placeholder="Tell us about your motivation, goals, and why AlphaX interests you..."
                    className={`${inputClass} resize-none`}
                    value={formData.motivation} onChange={(e) => setFormData({ ...formData, motivation: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>What skills do you bring?</label>
                  <textarea rows={3} placeholder="Languages, technical skills, research experience, software tools..."
                    className={`${inputClass} resize-none`}
                    value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>How did you hear about AlphaX?</label>
                  <select className={inputClass}
                    value={formData.how_heard} onChange={(e) => setFormData({ ...formData, how_heard: e.target.value })}>
                    <option value="" className="bg-dark">Select an option</option>
                    {HOW_HEARD.map((h) => (
                      <option key={h} value={h} className="bg-dark">{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="text-center">
              <Button type="submit" loading={loading} size="lg" className="px-12">
                Submit Application
                <ArrowRight size={18} />
              </Button>
              <p className="text-xs text-slate-500 mt-4">
                We review all applications within 1–3 business days.
              </p>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
