import React from 'react';

interface DemoAvatarProps {
  seed: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDemoTag?: boolean;
}

/**
 * Illustrated professional avatar for fictional demonstration profiles
 * (mentors, lecturers, alumni, peer mentors) so demo personas are visually distinct
 * from real individuals and never suffer from broken external URLs.
 */
export const DemoAvatar: React.FC<DemoAvatarProps> = ({
  seed,
  name,
  size = 'md',
  showDemoTag = false,
}) => {
  const palettes = [
    'from-blue-700 to-indigo-800',
    'from-slate-800 to-blue-900',
    'from-indigo-700 to-violet-800',
    'from-teal-700 to-slate-800',
    'from-sky-700 to-blue-900',
  ];
  const code = (seed.charCodeAt(0) + (seed.charCodeAt(1) || 0)) % palettes.length;
  const gradient = palettes[code];

  const sizeClasses = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  }[size];

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" title={`${name} — Fictional Demo Portrait`}>
      <div
        className={`${sizeClasses} rounded-full bg-gradient-to-br ${gradient} text-white font-semibold flex items-center justify-center ring-2 ring-white shadow-xs select-none overflow-hidden relative`}
      >
        <svg
          viewBox="0 0 64 64"
          className="absolute inset-0 w-full h-full opacity-20"
          aria-hidden="true"
        >
          <circle cx="32" cy="24" r="11" fill="currentColor" />
          <path d="M12 58c3-11 11-17 20-17s17 6 20 17" fill="currentColor" />
        </svg>
        <span className="relative z-10 tracking-tight">{seed.slice(0, 2).toUpperCase()}</span>
      </div>
      {showDemoTag && (
        <span className="absolute -bottom-1.5 px-1.5 py-0.5 rounded bg-slate-900 text-[9px] font-medium text-slate-200 leading-none whitespace-nowrap">
          Demo
        </span>
      )}
    </div>
  );
};
