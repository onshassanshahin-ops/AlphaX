import React from 'react';

interface PulseItem {
  label: string;
  value: string | number;
  tone?: 'cyan' | 'teal' | 'purple' | 'orange' | 'yellow' | 'slate';
}

interface BlockPulseStripProps {
  items: PulseItem[];
}

const toneClass: Record<NonNullable<PulseItem['tone']>, string> = {
  cyan: 'border-cyan/20 bg-cyan/10',
  teal: 'border-teal/20 bg-teal/10',
  purple: 'border-purple/20 bg-purple/10',
  orange: 'border-orange/20 bg-orange/10',
  yellow: 'border-yellow-500/20 bg-yellow-500/10',
  slate: 'border-slate-400/20 bg-slate-500/10',
};

export default function BlockPulseStrip({ items }: BlockPulseStripProps) {
  return (
    <div className="relative mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
      {items.map((item) => {
        const tone = item.tone || 'cyan';
        return (
          <div key={item.label} className={`p-3 rounded-xl border ${toneClass[tone]}`}>
            <p className="text-[11px] text-slate-400">{item.label}</p>
            <p className="text-xl font-bold text-white">{item.value}</p>
          </div>
        );
      })}
    </div>
  );
}
