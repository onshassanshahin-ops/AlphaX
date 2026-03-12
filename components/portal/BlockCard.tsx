'use client';

import Link from 'next/link';
import { Lock, ChevronRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockCardProps {
  slug: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  portalPath: string;
  isUnlocked: boolean;
  memberRole?: string;
  memberCount?: number;
}

export default function BlockCard({
  slug,
  name,
  icon,
  color,
  description,
  portalPath,
  isUnlocked,
  memberRole,
  memberCount,
}: BlockCardProps) {
  const content = (
    <div
      className={cn(
        'rounded-2xl p-6 border transition-all duration-300 relative overflow-hidden',
        isUnlocked
          ? 'block-card-unlocked cursor-pointer'
          : 'block-card-locked cursor-not-allowed',
        isUnlocked
          ? 'bg-dark border-cyan/20 hover:border-opacity-70 hover:shadow-xl'
          : 'bg-dark/60 border-white/5'
      )}
      style={isUnlocked ? { borderColor: `${color}40` } : {}}
    >
      {/* Background glow for unlocked */}
      {isUnlocked && (
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${color}, transparent 70%)`,
          }}
        />
      )}

      {/* Lock overlay */}
      {!isUnlocked && (
        <div className="absolute top-4 right-4">
          <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
            <Lock size={14} className="text-slate-500" />
          </div>
        </div>
      )}

      {/* Icon + Role badge */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
          style={{
            backgroundColor: isUnlocked ? `${color}20` : 'rgba(100,100,100,0.1)',
            border: `1px solid ${isUnlocked ? `${color}40` : 'rgba(100,100,100,0.2)'}`,
          }}
        >
          {icon}
        </div>
        {isUnlocked && memberRole && (
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: `${color}20`, color: color, border: `1px solid ${color}40` }}
          >
            {memberRole === 'navigator' && <Star size={10} />}
            {memberRole === 'navigator' ? 'Navigator' : 'Member'}
          </div>
        )}
      </div>

      {/* Name & description */}
      <h3
        className={cn(
          'font-bold font-grotesk text-lg mb-1.5',
          isUnlocked ? 'text-white' : 'text-slate-500'
        )}
      >
        {name}
      </h3>
      <p className={cn('text-sm leading-relaxed', isUnlocked ? 'text-slate-400' : 'text-slate-600')}>
        {description}
      </p>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
        {isUnlocked ? (
          <>
            <span className="text-xs text-slate-500">
              {memberCount ? `${memberCount} members` : 'Open'}
            </span>
            <div
              className="flex items-center gap-1 text-sm font-semibold"
              style={{ color }}
            >
              Enter
              <ChevronRight size={14} />
            </div>
          </>
        ) : (
          <>
            <span className="text-xs text-slate-600">No access</span>
            <span className="text-xs text-slate-600 flex items-center gap-1">
              <Lock size={11} />
              Locked
            </span>
          </>
        )}
      </div>
    </div>
  );

  if (isUnlocked) {
    return <Link href={portalPath}>{content}</Link>;
  }

  return <div>{content}</div>;
}
