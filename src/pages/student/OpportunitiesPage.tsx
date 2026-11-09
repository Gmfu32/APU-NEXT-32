import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BriefcaseBusiness, CalendarDays, Check, ExternalLink, Heart, MapPin, RotateCcw, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getStrongMatches } from '../../services/matching';

type Tab = 'for-you' | 'interested' | 'passed';

export const OpportunitiesPage: React.FC = () => {
  const { studentProfile, opportunities, matchResponses, respondToMatch, focusedEntityId } = useApp();
  const [tab, setTab] = useState<Tab>('for-you');
  const [active, setActive] = useState(0);
  const dragStart = useRef<number | null>(null);
  const matches = useMemo(() => getStrongMatches(studentProfile, opportunities), [studentProfile, opportunities]);
  const visible = matches.filter(({ opportunity }) => {
    const response = matchResponses[opportunity.id];
    return tab === 'for-you' ? !response : response === tab;
  });
  const current = visible[active];
  useEffect(() => {
    if (!focusedEntityId) return;
    const match = matches.find(({ opportunity }) => opportunity.id === focusedEntityId);
    if (!match) return;
    const response = matchResponses[focusedEntityId];
    const destinationTab: Tab = response === 'interested' || response === 'passed' ? response : 'for-you';
    const index = matches.filter(({ opportunity }) => destinationTab === 'for-you' ? !matchResponses[opportunity.id] : matchResponses[opportunity.id] === destinationTab).findIndex(({ opportunity }) => opportunity.id === focusedEntityId);
    if (index >= 0) { setTab(destinationTab); setActive(index); }
  }, [focusedEntityId, matches, matchResponses]);
  const companyUrl = (opportunity: (typeof matches)[number]['opportunity']) => {
    const company = opportunity.company.toLowerCase();
    const known: Record<string, string> = {
      'allianz malaysia': 'https://www.allianz.com.my/', allianz: 'https://www.allianz.com.my/',
      petronas: 'https://www.petronas.com/', 'sd guthrie': 'https://www.sdguthrie.com/',
      maybank: 'https://www.maybank.com/', airasia: 'https://www.airasia.com/',
    };
    const knownCompany = Object.keys(known).find(name => company.includes(name));
    if (knownCompany) return known[knownCompany];
    if (opportunity.applicationUrl) return opportunity.applicationUrl;
    if (opportunity.sourceUrl && /^https?:\/\//i.test(opportunity.sourceUrl)) return opportunity.sourceUrl;
    return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(`${opportunity.company} ${opportunity.title}`)}`;
  };
  const respond = (answer: 'interested' | 'passed') => {
    if (!current) return;
    if (answer === 'interested') window.open(companyUrl(current.opportunity), '_blank', 'noopener,noreferrer');
    respondToMatch(current.opportunity.id, answer);
    setTab(answer);
    setActive(0);
  };

  return <div className="mx-auto max-w-3xl space-y-6">
    <header className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-100">Opportunity Matches</p>
      <h1 className="mt-2 text-2xl font-extrabold">Roles selected for your profile</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-100">Listings with a strong fit to your profile appear here. Scores reflect keyword relevance and profile details; they do not guarantee an interview or offer.</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-white/15 px-3 py-1.5">{matches.length} strong match{matches.length === 1 ? '' : 'es'}</span><span className="rounded-full bg-white/15 px-3 py-1.5">{studentProfile.internshipStartDate && studentProfile.internshipEndDate ? `${studentProfile.internshipStartDate} – ${studentProfile.internshipEndDate}` : 'Add placement dates in My Profile'}</span></div>
    </header>
    <div className="flex gap-2 rounded-xl border border-slate-200 bg-white p-2">
      {([['for-you', 'For you'], ['interested', `Interested (${Object.values(matchResponses).filter((x) => x === 'interested').length})`], ['passed', 'Passed']] as [Tab, string][]).map(([key, label]) => <button key={key} onClick={() => { setTab(key); setActive(0); }} className={`rounded-lg px-4 py-2 text-xs font-bold transition ${tab === key ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</button>)}
    </div>
    {!current ? <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-blue-600"><BriefcaseBusiness className="h-5 w-5" /></div><h2 className="mt-4 text-lg font-bold text-slate-900">{tab === 'for-you' ? 'No strong matches right now' : `No ${tab} matches`}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">{tab === 'for-you' ? 'Career Centre listings appear here only when your programme, skills, location and placement timing produce a fit score of at least 80. Update your profile to refresh your matches.' : 'Your choices will appear here when you mark a match interested or pass.'}</p></section> : <article onPointerDown={(event) => { if (event.pointerType !== 'mouse') dragStart.current = event.clientX; }} onPointerUp={(event) => { if (dragStart.current === null) return; const distance = event.clientX - dragStart.current; dragStart.current = null; if (distance > 85) respond('interested'); else if (distance < -85) respond('passed'); }} className="touch-pan-y overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative bg-slate-900 px-6 py-7 text-white sm:px-8"><div className="absolute right-5 top-5 rounded-full bg-emerald-400 px-3 py-1 text-sm font-extrabold text-emerald-950">{current.result.score}% fit</div><div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-white/10"><BriefcaseBusiness className="h-6 w-6" /></div><p className="text-xs font-semibold text-blue-200">{current.opportunity.company} · {'Career Centre listing'}</p><h2 className="mt-1 max-w-[75%] text-2xl font-extrabold">{current.opportunity.title}</h2><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-300"><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{current.opportunity.location}</span><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{current.opportunity.internshipStartDate || 'Dates TBD'} · {current.opportunity.duration}</span></div></div>
      <div className="space-y-5 p-6 sm:p-8"><p className="text-sm leading-relaxed text-slate-600">{current.opportunity.summary}</p><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-800">Why this match</p><ul className="mt-2 space-y-1.5 text-xs text-slate-600">{current.result.reasons.map((reason) => <li key={reason} className="flex gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />{reason}</li>)}</ul></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-800">Score components</p><div className="mt-2 space-y-2 text-xs">{Object.entries({ Skills: current.result.components.skills, Programme: current.result.components.programme, Location: current.result.components.location, Timing: current.result.components.timing }).map(([name, score]) => <div key={name} className="flex items-center justify-between text-slate-600"><span>{name}</span><span className="font-bold text-slate-900">{score} pts</span></div>)}</div></div></div><div className="flex flex-wrap gap-2">{current.opportunity.skills.map((skill) => <span key={skill} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{skill}</span>)}</div><div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><button onClick={() => respond('passed')} className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 shadow-sm hover:bg-rose-100" aria-label="Pass this opportunity"><X className="h-6 w-6" /></button><button onClick={() => respond('interested')} className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm hover:bg-emerald-600" aria-label="Interested; open company page"><Heart className="h-6 w-6" fill="currentColor" /></button><span className="self-center text-xs font-semibold text-slate-500">Pass <span className="mx-1">·</span> Interested</span></div><div className="flex gap-2">{tab === 'passed' && <button onClick={() => respondToMatch(current.opportunity.id, 'interested')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-700"><RotateCcw className="h-3.5 w-3.5" />Undo pass</button>}</div></div><p className="text-[11px] text-slate-400">Interested saves your response and opens the company’s official site when known; otherwise it opens a LinkedIn jobs search.</p></div>
    </article>}
    <p className="text-center text-[11px] text-slate-400">Fit scores are based on your saved profile and current approved listings.</p>
  </div>;
};
