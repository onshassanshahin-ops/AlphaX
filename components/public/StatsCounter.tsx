'use client';

import { useEffect, useRef, useState } from 'react';
import type { SiteStats } from '@/types';

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const duration = 2000;
          const steps = 60;
          const stepValue = target / steps;
          let current = 0;
          const interval = setInterval(() => {
            current += stepValue;
            if (current >= target) {
              setValue(target);
              clearInterval(interval);
            } else {
              setValue(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {value.toLocaleString('en-US')}{suffix}
    </span>
  );
}

interface StatsCounterProps {
  stats: SiteStats;
}

const statItems = [
  {
    key: 'papers_translated' as keyof SiteStats,
    label: 'Papers Translated',
    suffix: '+',
    icon: '📄',
    description: 'Global research made accessible in Arabic',
  },
  {
    key: 'members' as keyof SiteStats,
    label: 'Alphanauts',
    suffix: '+',
    icon: '🚀',
    description: 'Researchers and contributors across Syria',
  },
  {
    key: 'publications' as keyof SiteStats,
    label: 'Publications',
    suffix: '',
    icon: '📊',
    description: 'Original research submitted or published',
  },
  {
    key: 'tools' as keyof SiteStats,
    label: 'Tools Built',
    suffix: '',
    icon: '🛠️',
    description: 'Open-source tools for the Arab research community',
  },
];

export default function StatsCounter({ stats }: StatsCounterProps) {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-navy/30 via-dark to-navy/30 pointer-events-none" />
      <div className="section-divider absolute top-0 left-0 right-0 w-full" />
      <div className="section-divider absolute bottom-0 left-0 right-0 w-full" />

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold font-grotesk text-white mb-3">
            AlphaX by the Numbers
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Growing every day, one paper, one researcher, one discovery at a time.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {statItems.map((item) => (
            <div
              key={item.key}
              className="glass-card rounded-2xl p-6 text-center group hover:border-cyan/40 transition-all duration-300"
            >
              <div className="text-4xl mb-3">{item.icon}</div>
              <div className="stat-number text-4xl sm:text-5xl mb-1 font-grotesk">
                <AnimatedNumber target={stats[item.key] as number} suffix={item.suffix} />
              </div>
              <p className="text-white font-semibold mb-1">{item.label}</p>
              <p className="text-xs text-slate-500 leading-relaxed hidden sm:block">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
