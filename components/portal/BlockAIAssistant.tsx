'use client';

import { useState } from 'react';
import { Bot, Sparkles, Send, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  blockSlug: string;
  blockName: string;
}

interface AiResponse {
  mode: 'coming_soon' | 'live';
  message: string;
  reply: string;
  context?: {
    completionRate?: number;
    overdueTasks?: number;
    openSuggestions?: number;
    totalTasks?: number;
    prompt?: string;
  };
  suggestedPrompts?: string[];
}

export default function BlockAIAssistant({ blockSlug, blockName }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResponse | null>(null);

  const ask = async (question?: string) => {
    const q = (question ?? input).trim();
    if (!q) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/block-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockSlug, message: q }),
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-cyan/15">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-cyan/15 border border-cyan/20 flex items-center justify-center">
          <Bot size={16} className="text-cyan" />
        </div>
        <div>
          <h3 className="font-bold font-grotesk text-white text-sm">{blockName} AI Navigator</h3>
          <p className="text-xs text-slate-500">Team-aware ideation and planning assistant</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for priorities, ideas, or strategy..."
          className="flex-1 bg-dark border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan/40"
        />
        <button
          onClick={() => ask()}
          disabled={loading}
          className="px-3 py-2 rounded-xl bg-cyan/15 border border-cyan/20 text-cyan hover:bg-cyan/25 transition disabled:opacity-50"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>

      {!result && (
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            'What are this week top priorities?',
            'How to reduce overdue tasks?',
            'Suggest one high-impact initiative',
          ].map((p) => (
            <button
              key={p}
              onClick={() => ask(p)}
              className="text-xs px-2.5 py-1 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-cyan/30 transition"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl bg-dark/50 border border-white/5 p-3">
            <p className="text-xs text-slate-600 uppercase tracking-widest mb-1">Assistant</p>
            <p className="text-sm text-slate-200">{result.reply || result.message}</p>
            {result.mode === 'coming_soon' && (
              <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                <AlertCircle size={12} />
                Coming soon: LLM API integration pending.
              </p>
            )}
          </div>

          {result.context && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-lg bg-dark/50 border border-white/5 p-2 text-center">
                <p className="text-lg font-bold font-grotesk text-cyan">{result.context.completionRate ?? 0}%</p>
                <p className="text-[11px] text-slate-500">Completion</p>
              </div>
              <div className="rounded-lg bg-dark/50 border border-white/5 p-2 text-center">
                <p className="text-lg font-bold font-grotesk text-red-400">{result.context.overdueTasks ?? 0}</p>
                <p className="text-[11px] text-slate-500">Overdue</p>
              </div>
              <div className="rounded-lg bg-dark/50 border border-white/5 p-2 text-center">
                <p className="text-lg font-bold font-grotesk text-purple">{result.context.openSuggestions ?? 0}</p>
                <p className="text-[11px] text-slate-500">Open Ideas</p>
              </div>
              <div className="rounded-lg bg-dark/50 border border-white/5 p-2 text-center">
                <p className="text-lg font-bold font-grotesk text-gold">{result.context.totalTasks ?? 0}</p>
                <p className="text-[11px] text-slate-500">Total Tasks</p>
              </div>
            </div>
          )}

          {result.suggestedPrompts && result.suggestedPrompts.length > 0 && (
            <div>
              <p className="text-xs text-slate-600 uppercase tracking-widest mb-2">Try next</p>
              <div className="flex flex-wrap gap-2">
                {result.suggestedPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => ask(p)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-cyan/20 text-cyan hover:bg-cyan/10 transition"
                  >
                    <Sparkles size={10} className="inline mr-1" />
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
