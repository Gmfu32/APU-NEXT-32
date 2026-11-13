import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BriefcaseBusiness, CalendarDays, Check, ChevronLeft, ChevronRight, ExternalLink, Heart, MapPin, RotateCcw, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getStrongMatches } from '../../services/matching';

type Tab = 'for-you' | 'interested' | 'passed' | 'applications';
const isUsableExternalUrl = (value: string | undefined): value is string => Boolean(value && /^https:\/\//i.test(value) && !/localhost|127\.0\.0\.1|\/api\/|backend/i.test(value));

export const OpportunitiesPage: React.FC = () => {
  const { studentProfile, opportunities, matchResponses, appliedOpportunityMap, respondToMatch, applyToOpportunity, focusedEntityId } = useApp();
  const [tab, setTab] = useState<Tab>('for-you');
  const [active, setActive] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [shareCvConsent, setShareCvConsent] = useState(false);
  const [applicationSubmitting, setApplicationSubmitting] = useState(false);
  const [applicationError, setApplicationError] = useState('');
  const dragStart = useRef<number | null>(null);
  const matches = useMemo(() => getStrongMatches(studentProfile, opportunities), [studentProfile, opportunities]);
  const visible = matches.filter(({ opportunity }) => {
    const response = matchResponses[opportunity.id];
    const isApplied = Boolean(appliedOpportunityMap[opportunity.id]);
    if (tab === 'applications') return isApplied;
    if (isApplied) return false;
    return tab === 'for-you' ? !response : response === tab;
  });
  const current = visible[active];
  useEffect(() => {
    if (!focusedEntityId) return;
    const match = matches.find(({ opportunity }) => opportunity.id === focusedEntityId);
    if (!match) return;
    const response = matchResponses[focusedEntityId];
    const destinationTab: Tab = appliedOpportunityMap[focusedEntityId] ? 'applications' : response === 'interested' || response === 'passed' ? response : 'for-you';
    const index = matches.filter(({ opportunity }) => {
      const isApplied = Boolean(appliedOpportunityMap[opportunity.id]);
      if (destinationTab === 'applications') return isApplied;
      if (isApplied) return false;
      return destinationTab === 'for-you' ? !matchResponses[opportunity.id] : matchResponses[opportunity.id] === destinationTab;
    }).findIndex(({ opportunity }) => opportunity.id === focusedEntityId);
    if (index >= 0) { setTab(destinationTab); setActive(index); }
  }, [focusedEntityId, matches, matchResponses, appliedOpportunityMap]);
  const companyUrl = (opportunity: (typeof matches)[number]['opportunity']) => {
    const company = opportunity.company.toLowerCase();
    const known: Record<string, string> = {
      'allianz malaysia': 'https://www.allianz.com.my/', allianz: 'https://www.allianz.com.my/',
      petronas: 'https://www.petronas.com/', 'sd guthrie': 'https://www.sdguthrie.com/',
      maybank: 'https://www.maybank.com/', airasia: 'https://www.airasia.com/',
      teleperformance: 'https://careers.teleperformance.com/',
    };
    if (isUsableExternalUrl(opportunity.applicationUrl)) return opportunity.applicationUrl;
    if (isUsableExternalUrl(opportunity.sourceUrl)) return opportunity.sourceUrl;
    const knownCompany = Object.keys(known).find(name => company.includes(name));
    if (knownCompany) return known[knownCompany];
    return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(`${opportunity.company} ${opportunity.title}`)}`;
  };
  const respond = (answer: 'interested' | 'passed') => {
    if (!current) return;
    if (appliedOpportunityMap[current.opportunity.id]) {
      setTab('applications');
      setActive(0);
      return;
    }
    if (answer === 'interested') window.open(companyUrl(current.opportunity), '_blank', 'noopener,noreferrer');
    respondToMatch(current.opportunity.id, answer);
    setTab(answer);
    setActive(0);
  };
  const openExternalApplication = async () => {
    if (!current) return;
    const opportunity = current.opportunity;
    const destination = opportunity.applicationUrl;
    if (!isUsableExternalUrl(destination)) {
      setApplicationError('The original application link is unavailable.');
      return;
    }
    if (appliedOpportunityMap[opportunity.id]) {
      if (!window.open(destination, '_blank', 'noopener,noreferrer')) window.location.assign(destination);
      return;
    }

    const applicationWindow = window.open('about:blank', '_blank');
    if (applicationWindow) applicationWindow.opener = null;
    setApplicationSubmitting(true);
    setApplicationError('');
    try {
      await applyToOpportunity(
        opportunity.id,
        'Opened the external application website from APU NEXT; submission completion cannot be verified.',
        false,
      );
      setDetailsOpen(false);
      setTab('applications');
      setActive(0);
      setShareCvConsent(false);
      if (applicationWindow && !applicationWindow.closed) {
        applicationWindow.location.replace(destination);
      } else if (!applicationWindow) {
        window.location.assign(destination);
      }
    } catch (error) {
      if (applicationWindow && !applicationWindow.closed) applicationWindow.close();
      setApplicationError(error instanceof Error ? error.message : 'The application link could not be recorded.');
    } finally {
      setApplicationSubmitting(false);
    }
  };
  const showDetails = () => { setShareCvConsent(false); setApplicationError(''); setDetailsOpen(true); };
  const goTo = (direction: -1 | 1) => setActive((index) => (index + direction + visible.length) % visible.length);

  return <div className="mx-auto max-w-3xl space-y-6">
    <header className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-100">Opportunity Matches</p>
      <h1 className="mt-2 text-2xl font-extrabold">Roles selected for your profile</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-100">Listings with a strong fit to your profile appear here. Scores reflect keyword relevance and profile details; they do not guarantee an interview or offer.</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-white/15 px-3 py-1.5">{matches.length} strong match{matches.length === 1 ? '' : 'es'}</span><span className="rounded-full bg-white/15 px-3 py-1.5">{studentProfile.internshipStartDate && studentProfile.internshipEndDate ? `${studentProfile.internshipStartDate} – ${studentProfile.internshipEndDate}` : 'Add placement dates in My Profile'}</span></div>
    </header>
    <div className="flex gap-2 rounded-xl border border-slate-200 bg-white p-2">
      {([['for-you', `For you (${matches.filter(({ opportunity }) => !matchResponses[opportunity.id] && !appliedOpportunityMap[opportunity.id]).length})`], ['interested', `Interested (${matches.filter(({ opportunity }) => matchResponses[opportunity.id] === 'interested' && !appliedOpportunityMap[opportunity.id]).length})`], ['passed', `Passed (${matches.filter(({ opportunity }) => matchResponses[opportunity.id] === 'passed' && !appliedOpportunityMap[opportunity.id]).length})`], ['applications', `Applications (${Object.keys(appliedOpportunityMap).length})`]] as [Tab, string][]).map(([key, label]) => <button key={key} onClick={() => { setTab(key); setActive(0); }} className={`rounded-lg px-4 py-2 text-xs font-bold transition ${tab === key ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</button>)}
    </div>
    {!current ? <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-blue-600"><BriefcaseBusiness className="h-5 w-5" /></div><h2 className="mt-4 text-lg font-bold text-slate-900">{tab === 'for-you' ? 'No strong matches right now' : `No ${tab} matches`}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">{tab === 'for-you' ? 'Opportunities appear here when your programme, skills, location and placement timing produce a fit score of at least 80. Update your profile to refresh your matches.' : tab === 'applications' ? 'Applications you submit from an opportunity details page will appear here.' : 'Your choices will appear here when you mark a match interested or pass.'}</p></section> : <article onPointerDown={(event) => { if (event.pointerType !== 'mouse') dragStart.current = event.clientX; }} onPointerUp={(event) => { if (dragStart.current === null) return; const distance = event.clientX - dragStart.current; dragStart.current = null; if (distance > 85) respond('interested'); else if (distance < -85) respond('passed'); }} className="touch-pan-y overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative bg-slate-900 px-6 py-7 text-white sm:px-8"><div className="absolute right-5 top-5 rounded-full bg-emerald-400 px-3 py-1 text-sm font-extrabold text-emerald-950">{current.result.score}% fit</div><div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-white/10"><BriefcaseBusiness className="h-6 w-6" /></div><p className="text-xs font-semibold text-blue-200">{current.opportunity.company}</p><h2 className="mt-1 max-w-[75%] text-2xl font-extrabold">{current.opportunity.title}</h2><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-300"><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{current.opportunity.location}</span><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{current.opportunity.internshipStartDate || 'Dates TBD'} · {current.opportunity.duration}</span></div></div>
      <div className="space-y-5 p-6 sm:p-8"><p className="text-sm leading-relaxed text-slate-600">{current.opportunity.summary}</p>{tab === 'applications' && appliedOpportunityMap[current.opportunity.id] && <div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-sm font-bold text-blue-900">{appliedOpportunityMap[current.opportunity.id].status}</p><p className="mt-1 text-xs leading-relaxed text-blue-800">{current.opportunity.applicationMode === 'external' ? 'The external application website was opened. APU NEXT cannot confirm whether you completed or submitted its form.' : appliedOpportunityMap[current.opportunity.id].note}</p><p className="mt-2 text-xs text-blue-700">Recorded {appliedOpportunityMap[current.opportunity.id].appliedAt}</p></div>}<div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-800">Why this match</p><ul className="mt-2 space-y-1.5 text-xs text-slate-600">{current.result.reasons.map((reason) => <li key={reason} className="flex gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />{reason}</li>)}</ul></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-800">Score components</p><div className="mt-2 space-y-2 text-xs">{Object.entries({ Skills: current.result.components.skills, Programme: current.result.components.programme, Location: current.result.components.location, Timing: current.result.components.timing }).map(([name, score]) => <div key={name} className="flex items-center justify-between text-slate-600"><span>{name}</span><span className="font-bold text-slate-900">{score} pts</span></div>)}</div></div></div><div className="flex flex-wrap gap-2">{current.opportunity.skills.map((skill) => <span key={skill} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{skill}</span>)}</div><div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><button onClick={() => respond('passed')} className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 shadow-sm hover:bg-rose-100" aria-label="Pass this opportunity"><X className="h-6 w-6" /></button><button onClick={() => respond('interested')} className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm hover:bg-emerald-600" aria-label="Interested; open company page"><Heart className="h-6 w-6" fill="currentColor" /></button><span className="self-center text-xs font-semibold text-slate-500">Pass <span className="mx-1">·</span> Interested</span></div><div className="flex flex-wrap justify-end gap-2">{tab === 'passed' && <button onClick={() => respondToMatch(current.opportunity.id, 'interested')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-700"><RotateCcw className="h-3.5 w-3.5" />Undo pass</button>}{tab !== 'applications' && <button onClick={showDetails} className="rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white">More details</button>}{tab === 'applications' && <button onClick={showDetails} className="rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white">More details</button>}</div></div><div className="flex items-center justify-between border-t border-slate-100 pt-4"><button onClick={() => goTo(-1)} disabled={visible.length < 2} className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Previous</button><span className="text-xs font-semibold text-slate-400">{active + 1} of {visible.length}</span><button onClick={() => goTo(1)} disabled={visible.length < 2} className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 disabled:opacity-40">Next <ChevronRight className="h-4 w-4" /></button></div><p className="text-[11px] text-slate-400">Interested saves your response and opens the company’s official site when known. Applications appear here after you submit one from More details.</p></div>
    </article>}
    {detailsOpen && current && <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailsOpen(false); }}>
      <section role="dialog" aria-modal="true" className="mx-auto my-8 max-w-3xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-700">{current.opportunity.company}</p><h2 className="mt-1 text-2xl font-extrabold text-slate-900">{current.opportunity.title}</h2><p className="mt-2 text-sm text-slate-500">{current.opportunity.location} · {current.opportunity.duration} · {current.opportunity.internshipStartDate || 'Dates TBD'} to {current.opportunity.internshipEndDate || 'TBD'}</p></div><button type="button" onClick={() => setDetailsOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close details"><X /></button></div>
        <p className="mt-6 text-sm leading-7 text-slate-700">{current.opportunity.summary}</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2"><div><h3 className="font-bold text-slate-900">Responsibilities</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">{current.opportunity.responsibilities.map(item => <li key={item}>{item}</li>)}</ul></div><div><h3 className="font-bold text-slate-900">Requirements</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">{current.opportunity.requirements.map(item => <li key={item}>{item}</li>)}</ul></div></div>
        {current.opportunity.applicationMode === 'external' ? <p className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">Clicking the application link records this opportunity under Applications. APU NEXT can track that the website was opened, but cannot verify that you completed or submitted its form.</p> : <label className="mt-6 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><input type="checkbox" checked={shareCvConsent} onChange={event => setShareCvConsent(event.target.checked)} className="mt-0.5" /><span><strong>Optional: share my CV with this employer.</strong> The employer may view the CV attached to this application. You can apply without sharing it.</span></label>}
        {applicationError && <p role="alert" className="mt-3 text-sm text-red-700">{applicationError}</p>}
        <div className="mt-7 flex flex-wrap justify-end gap-3">{current.opportunity.applicationMode === 'external' ? (isUsableExternalUrl(current.opportunity.applicationUrl) ? <button type="button" disabled={applicationSubmitting} onClick={() => void openExternalApplication()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{applicationSubmitting ? 'Recording…' : appliedOpportunityMap[current.opportunity.id] ? 'Open website again' : 'Apply on website'} <ExternalLink size={15}/></button> : <p className="text-sm text-slate-600">The original application link is unavailable.</p>) : <><button type="button" disabled={applicationSubmitting || Boolean(appliedOpportunityMap[current.opportunity.id])} onClick={() => {
          setApplicationSubmitting(true);
          setApplicationError('');
          void applyToOpportunity(current.opportunity.id, 'Submitted from opportunity details.', shareCvConsent).then(() => { setDetailsOpen(false); setTab('applications'); setActive(0); setShareCvConsent(false); }).catch(error => setApplicationError(error instanceof Error ? error.message : 'Application could not be submitted.')).finally(() => setApplicationSubmitting(false));
        }} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{applicationSubmitting ? 'Submitting…' : appliedOpportunityMap[current.opportunity.id] ? 'Already applied' : 'Apply now'}</button><a href={companyUrl(current.opportunity)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Open application site <ExternalLink size={15}/></a></>}</div>
      </section>
    </div>}
    <p className="text-center text-[11px] text-slate-400">Fit scores are based on your saved profile and current approved listings.</p>
  </div>;
};
