import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, CalendarDays, Clock3, MapPin, Sparkles, UserRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getStrongMatches } from '../../services/matching';

export const StudentDashboard: React.FC = () => {
  const [campusImageFailed, setCampusImageFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const { studentProfile, opportunities, navigate } = useApp();
  const matches = useMemo(() => getStrongMatches(studentProfile, opportunities), [studentProfile, opportunities]);
  const completed = [studentProfile.name, studentProfile.email, studentProfile.major, studentProfile.skills.length, studentProfile.internshipStartDate && studentProfile.internshipEndDate, studentProfile.preferredLocations.length].filter(Boolean).length;
  const completion = Math.round((completed / 6) * 100);
  const placement = studentProfile.internshipStartDate && studentProfile.internshipEndDate
    ? `${new Date(`${studentProfile.internshipStartDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} – ${new Date(`${studentProfile.internshipEndDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`
    : 'Add your placement dates';
  const placementStart = studentProfile.internshipStartDate
    ? new Date(`${studentProfile.internshipStartDate}T00:00:00`).getTime()
    : null;
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const secondsUntilPlacement = placementStart === null ? null : Math.max(0, Math.floor((placementStart - now) / 1000));
  const countdown = secondsUntilPlacement === null ? null : {
    days: Math.floor(secondsUntilPlacement / 86400),
    hours: Math.floor((secondsUntilPlacement % 86400) / 3600),
    minutes: Math.floor((secondsUntilPlacement % 3600) / 60),
    seconds: secondsUntilPlacement % 60,
  };
  const countdownUnits = countdown ? [
    ['Days', countdown.days],
    ['Hours', countdown.hours],
    ['Minutes', countdown.minutes],
    ['Seconds', countdown.seconds],
  ] as const : [];

  return <div className="mx-auto max-w-6xl space-y-6 pb-8">
    <section className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-[#0D1526] via-[#152c60] to-blue-700 p-6 text-white shadow-sm sm:p-8">
      {!campusImageFailed && <img src="/assets/aistudio/Apu_campus_1e9018be.jpg" alt="APU campus" onError={() => setCampusImageFailed(true)} className="absolute inset-0 z-0 h-full w-full object-cover object-center"/>}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0D1526]/95 via-[#10234b]/85 to-blue-800/65"/>
      <div className="relative z-20"><p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Student workspace</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{studentProfile.name ? `Welcome, ${studentProfile.name}` : 'Welcome to your career workspace'}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-100">Your profile, placement preferences, and relevant internship opportunities—all together so you can take the next step.</p>
        <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => navigate('profile')} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-50"><UserRound className="h-4 w-4"/>{studentProfile.major ? 'Edit profile' : 'Complete profile'}</button><button type="button" onClick={() => navigate('opportunities')} className="inline-flex items-center gap-2 rounded-lg border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20">View opportunities<ArrowRight className="h-4 w-4"/></button></div>
      </div>
    </section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-600">Profile readiness</p><UserRound className="h-5 w-5 text-blue-600"/></div><p className="mt-3 text-3xl font-bold text-slate-900">{completion}<span className="text-base text-slate-400">%</span></p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${completion}%` }}/></div><button onClick={() => navigate('profile')} className="mt-3 text-sm font-bold text-blue-700 hover:underline">{completion < 100 ? 'Finish your profile' : 'Review your profile'}</button></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-600">Strong matches</p><Sparkles className="h-5 w-5 text-amber-500"/></div><p className="mt-3 text-3xl font-bold text-slate-900">{matches.length}</p><p className="mt-1 text-sm text-slate-500">Based on your profile and current listings</p><button onClick={() => navigate('opportunities')} className="mt-3 text-sm font-bold text-blue-700 hover:underline">Review opportunities</button></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-600">Placement window</p><CalendarDays className="h-5 w-5 text-blue-600"/></div><p className="mt-3 text-lg font-bold text-slate-900">{placement}</p><p className="mt-1 text-sm text-slate-500">Your availability for internship roles</p><button onClick={() => navigate('profile')} className="mt-3 text-sm font-bold text-blue-700 hover:underline">Update dates</button></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-600">Preferred locations</p><MapPin className="h-5 w-5 text-blue-600"/></div><p className="mt-3 line-clamp-2 min-h-7 font-bold text-slate-900">{studentProfile.preferredLocations.length ? studentProfile.preferredLocations.join(' · ') : 'Not selected'}</p><p className="mt-1 text-sm text-slate-500">Helps prioritize nearby roles</p><button onClick={() => navigate('profile')} className="mt-3 text-sm font-bold text-blue-700 hover:underline">Choose locations</button></article>
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0D1526] via-[#162e62] to-blue-700 px-5 py-6 text-white sm:px-7">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl"/>
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[.15em] text-blue-200">Placement countdown</p><h2 className="mt-1 text-2xl font-extrabold">Your placement window opens in</h2><p className="mt-2 text-sm text-blue-100">{placementStart === null ? 'Set your placement start date to begin the countdown.' : secondsUntilPlacement === 0 ? 'Your placement window is now open.' : new Date(placementStart).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
          <Clock3 className="h-7 w-7 text-blue-200"/>
        </div>
        {countdown ? <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{countdownUnits.map(([label, value]) => <div key={label} className="rounded-xl border border-white/15 bg-slate-950/35 p-3 text-center shadow-inner"><div className="rounded-lg bg-slate-950/45 py-3 text-3xl font-extrabold tabular-nums tracking-tight sm:text-4xl">{String(value).padStart(2, '0')}</div><p className="mt-2 text-[10px] font-bold uppercase tracking-[.18em] text-blue-100">{label}</p></div>)}</div> : <button onClick={() => navigate('profile')} className="relative mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-blue-800 hover:bg-blue-50">Set placement date <ArrowRight size={15}/></button>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-7"><p className="text-sm text-slate-600"><span className="font-bold text-slate-900">Placement window:</span> {placement}</p><button onClick={() => navigate('profile')} className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:underline">Update dates<ArrowRight size={15}/></button></div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-blue-700">Opportunity matching</p><h2 className="mt-1 text-xl font-bold">Your current strong matches</h2></div>{matches.length>0&&<button onClick={() => navigate('opportunities')} className="text-sm font-bold text-blue-700 hover:underline">See all</button>}</div>
      {matches.length ? <div className="mt-4 divide-y divide-slate-100">{matches.slice(0,3).map(({ opportunity, result })=><article key={opportunity.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h3 className="font-bold text-slate-900">{opportunity.title}</h3><p className="mt-1 text-sm text-slate-600">{opportunity.company} · {opportunity.location}</p><p className="mt-1 text-xs text-slate-500">{result.reasons[0]}</p></div><button onClick={() => navigate('opportunities', opportunity.id)} className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-800 hover:bg-blue-100">{result.score}% fit<ArrowRight size={15}/></button></article>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-7 text-center"><BriefcaseBusiness className="mx-auto h-7 w-7 text-slate-400"/><h3 className="mt-2 font-bold text-slate-800">No strong matches yet</h3><p className="mx-auto mt-1 max-w-lg text-sm text-slate-600">Add skills, programme, placement dates, and preferred locations to your profile. New staff listings are checked against your profile automatically.</p><button onClick={() => navigate('profile')} className="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Update profile</button></div>}
    </section>
  </div>;
};
