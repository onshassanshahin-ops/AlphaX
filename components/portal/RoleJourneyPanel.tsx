import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface JourneyItem {
  title: string;
  desc: string;
}

interface RoleJourneyPanelProps {
  title: string;
  icon: LucideIcon;
  iconClassName?: string;
  items: JourneyItem[];
  containerClassName?: string;
}

export default function RoleJourneyPanel({
  title,
  icon: Icon,
  iconClassName = 'text-cyan',
  items,
  containerClassName = 'border border-cyan/20',
}: RoleJourneyPanelProps) {
  return (
    <div className={`glass-card rounded-2xl p-5 ${containerClassName}`}>
      <h2 className="text-lg font-bold font-grotesk text-white flex items-center gap-2">
        <Icon size={17} className={iconClassName} />
        {title}
      </h2>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.title} className="p-3 rounded-xl border border-white/10 bg-dark/50">
            <p className="text-sm font-semibold text-white">{item.title}</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
