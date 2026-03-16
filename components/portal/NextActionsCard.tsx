'use client';

import React, { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

interface NextActionItem {
  title: string;
  hint: string;
  href?: string;
  actionLabel?: string;
}

interface NextActionsCardProps {
  title: string;
  icon: LucideIcon;
  iconClassName?: string;
  actions: NextActionItem[];
  containerClassName?: string;
}

export default function NextActionsCard({
  title,
  icon: Icon,
  iconClassName = 'text-cyan',
  actions,
  containerClassName = 'border border-cyan/20 bg-cyan/10',
}: NextActionsCardProps) {
  const [activeHash, setActiveHash] = useState('');

  useEffect(() => {
    const updateHash = () => setActiveHash(window.location.hash || '');
    updateHash();
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);

  return (
    <div className={`rounded-2xl p-4 ${containerClassName}`}>
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <Icon size={14} className={iconClassName} />
        {title}
      </h3>
      <div className="mt-3 space-y-2">
        {actions.map((action) => (
          <div key={action.title} className="p-2.5 rounded-xl border border-white/10 bg-dark/40">
            <p className="text-xs font-semibold text-white">{action.title}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{action.hint}</p>
            {action.href && (
              <a
                href={action.href}
                onClick={() => setActiveHash(action.href || '')}
                className={`inline-flex items-center mt-2 text-[11px] font-semibold transition-colors ${
                  activeHash === action.href ? 'text-white' : 'text-cyan hover:text-white'
                }`}
              >
                {activeHash === action.href ? 'Active' : (action.actionLabel || 'Open')}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
