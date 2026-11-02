import React from 'react';

interface CompanyLogoProps {
  logoKey: string;
  companyName: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Crisp inline SVG brand emblems & wordmarks for demonstration listings.
 * Self-contained with zero external image dependencies so nothing ever breaks offline.
 */
export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  logoKey,
  companyName,
  size = 'md',
}) => {
  const dim =
    size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-base' : 'w-10 h-10 text-sm';

  const key = logoKey.toLowerCase();

  if (key === 'google') {
    return (
      <div
        className={`${dim} rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0`}
        title={`${companyName} (Demo)`}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
          />
        </svg>
      </div>
    );
  }

  if (key === 'microsoft') {
    return (
      <div
        className={`${dim} rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0`}
        title={`${companyName} (Demo)`}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
          <rect x="2" y="2" width="9.2" height="9.2" fill="#F25022" />
          <rect x="12.8" y="2" width="9.2" height="9.2" fill="#7FBA00" />
          <rect x="2" y="12.8" width="9.2" height="9.2" fill="#00A4EF" />
          <rect x="12.8" y="12.8" width="9.2" height="9.2" fill="#FFB900" />
        </svg>
      </div>
    );
  }

  if (key === 'petronas') {
    return (
      <div
        className={`${dim} rounded-lg bg-[#00A19C]/10 border border-[#00A19C]/30 flex items-center justify-center shrink-0`}
        title={`${companyName} (Demo)`}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
          <path
            d="M12 2L6.5 12.2a5.8 5.8 0 1011 0L12 2zm0 14.3a2.6 2.6 0 110-5.2 2.6 2.6 0 010 5.2z"
            fill="#00A19C"
          />
        </svg>
      </div>
    );
  }

  if (key === 'github') {
    return (
      <div className={`${dim} rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.42 7.86 10.95.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.07 11.07 0 015.8 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.77.12 3.06.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.42.36.79 1.07.79 2.16v3.2c0 .31.21.67.8.56A11.53 11.53 0 0023.5 12.02C23.5 5.74 18.27.5 12 .5z" />
        </svg>
      </div>
    );
  }

  const paletteMap: Record<string, { bg: string; text: string; label: string }> = {
    maybank: { bg: 'bg-amber-400/20 border-amber-500/40', text: 'text-amber-900', label: 'MBB' },
    deloitte: { bg: 'bg-slate-900 border-slate-800', text: 'text-emerald-400', label: 'D.' },
    grab: { bg: 'bg-emerald-600 border-emerald-700', text: 'text-white', label: 'Grab' },
    shopee: { bg: 'bg-orange-600 border-orange-700', text: 'text-white', label: 'S' },
    intel: { bg: 'bg-sky-600 border-sky-700', text: 'text-white', label: 'intel' },
    shell: { bg: 'bg-amber-500/15 border-red-500/40', text: 'text-red-700', label: 'SHL' },
    cimb: { bg: 'bg-red-700 border-red-800', text: 'text-white', label: 'CIMB' },
    accenture: { bg: 'bg-purple-700 border-purple-800', text: 'text-white', label: '>' },
    maxis: { bg: 'bg-lime-500/20 border-lime-600/40', text: 'text-emerald-900', label: 'MXS' },
    pwc: { bg: 'bg-orange-500/15 border-orange-500/40', text: 'text-orange-900', label: 'PwC' },
    airasia: { bg: 'bg-red-600 border-red-700', text: 'text-white', label: 'MOVE' },
    huawei: { bg: 'bg-rose-700 border-rose-800', text: 'text-white', label: 'HW' },
    datacamp: { bg: 'bg-emerald-950 border-emerald-800', text: 'text-emerald-400', label: 'DC' },
    aws: { bg: 'bg-slate-900 border-slate-800', text: 'text-amber-400', label: 'AWS' },
    jetbrains: { bg: 'bg-slate-950 border-slate-800', text: 'text-fuchsia-400', label: 'JB' },
    figma: { bg: 'bg-slate-900 border-slate-800', text: 'text-violet-300', label: 'Fg' },
  };

  const preset = paletteMap[key] || {
    bg: 'bg-blue-600/10 border-blue-600/30',
    text: 'text-blue-800',
    label: companyName.slice(0, 2).toUpperCase(),
  };

  return (
    <div
      className={`${dim} rounded-lg border ${preset.bg} ${preset.text} font-bold tracking-tight flex items-center justify-center shrink-0`}
      title={`${companyName} (Demo)`}
    >
      <span className="text-[11px] leading-none">{preset.label}</span>
    </div>
  );
};
