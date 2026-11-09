import React, { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, CalendarDays, Check, ExternalLink, MapPin, Plus, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdminPageId, Opportunity, StudentProfile } from '../../types';
import { getStrongMatches } from '../../services/matching';
import { API_CONFIG, apiRequest } from '../../services/apiClient';

interface AdminPortalProps {
  page: AdminPageId;
}

type MatchRow = { id: string; name: string; programme: string; matchedSkills: string[]; score: number; response: string | null };

export const AdminPortal: React.FC<AdminPortalProps> = ({ page }) => {
  const [campusImageFailed, setCampusImageFailed] = useState(false);
  const {
    opportunities, studentProfile, matchResponses, createCareerCentreOpportunity,
    navigate, showToast,
  } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [programme, setProgramme] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [skills, setSkills] = useState('');
  const [summary, setSummary] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [databaseMatches, setDatabaseMatches] = useState<Record<string, MatchRow[]>>({});
  const [pendingEmployerListings, setPendingEmployerListings] = useState<Opportunity[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const staffListings = useMemo(
    () => opportunities.filter((item) => item.sourceLabel?.startsWith('Career Centre listing') || item.sourceLabel?.startsWith('Career Centre entry')),
    [opportunities],
  );

  useEffect(() => {
    if (API_CONFIG.useMockData) return;
    let mounted = true;
    void apiRequest<Array<{ opportunity: Opportunity; matches: Array<{ studentId: string; studentName: string; programme: string; matchedSkills: string[]; score: number; response: string | null }> }>>('/admin/opportunities/summary')
      .then(({ data }) => {
        if (mounted) setDatabaseMatches(Object.fromEntries(data.map((row) => [
          row.opportunity.id,
          row.matches.map((match) => ({ id: match.studentId, name: match.studentName, programme: match.programme, matchedSkills: match.matchedSkills, score: match.score, response: match.response })),
        ])));
      })
      .catch((error) => {
        if (mounted) showToast(`Could not load matches: ${error instanceof Error ? error.message : 'API error'}`);
      });
    return () => { mounted = false; };
  }, [opportunities, matchResponses, studentProfile]);

  useEffect(() => {
    if (API_CONFIG.useMockData) return;
    let mounted = true;
    void apiRequest<Opportunity[]>('/admin/opportunities/pending').then(({ data }) => { if (mounted) setPendingEmployerListings(data); }).catch(() => { if (mounted) setPendingEmployerListings([]); });
    return () => { mounted = false; };
  }, [page]);

  const decideEmployerListing = async (id: string, decision: 'approve' | 'reject') => {
    try {
      const { data } = await apiRequest<{ opportunity: Opportunity; matches: Array<{ studentId: string; score: number }> }>(`/admin/opportunities/${encodeURIComponent(id)}/decision`, { method: 'PUT', body: JSON.stringify({ decision }) });
      setPendingEmployerListings(current => current.filter(item => item.id !== id));
      showToast(decision === 'approve' ? `Approved listing. ${data.matches.length} student profile(s) met the match threshold.` : 'Employer listing rejected.');
    } catch (error) { showToast(`Could not review listing: ${error instanceof Error ? error.message : 'API error'}`); }
  };

  const matchesFor = (opportunity: Opportunity): MatchRow[] => {
    if (!API_CONFIG.useMockData) return databaseMatches[opportunity.id] || [];
    const profiles = new Map<string, StudentProfile>();
    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key?.startsWith('apu-next-profile-')) continue;
        const profile = JSON.parse(localStorage.getItem(key) || 'null') as StudentProfile | null;
        if (profile?.studentId && profile.name) profiles.set(profile.studentId, profile);
      }
    } catch { /* Ignore malformed local demo records. */ }
    if (studentProfile.studentId && studentProfile.name) profiles.set(studentProfile.studentId, studentProfile);
    return [...profiles.entries()].flatMap(([id, profile]) => getStrongMatches(profile, [opportunity]).map(({ result }) => ({
      id, name: profile.name, programme: [profile.degree, profile.major].filter(Boolean).join(' · '),
      matchedSkills: result.matchedSkills, score: result.score, response: id === studentProfile.studentId ? matchResponses[opportunity.id] || null : null,
    })));
  };

  if (page === 'adm-dashboard') return <div className="mx-auto max-w-4xl space-y-5">
    <section className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-[#0D1526] via-[#152c60] to-blue-700 p-6 text-white shadow-sm sm:p-8">
      {!campusImageFailed && <img src="/assets/aistudio/Apu_campus_1e9018be.jpg" alt="APU campus" onError={() => setCampusImageFailed(true)} className="absolute inset-0 z-0 h-full w-full object-cover object-center" />}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0D1526]/95 via-[#10234b]/85 to-blue-800/65" />
      <div className="relative z-20">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Career Centre</p>
        <h1 className="mt-2 text-2xl font-bold">Opportunity matching</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-100">Add a listing. The system checks the student profile and shows it only when the fit score is 80 or higher.</p>
        <button type="button" onClick={() => navigate('adm-opportunity-approvals')} className="mt-5 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-50">Create or manage listings</button>
      </div>
    </section>
  </div>;

  if (page === 'adm-company-approvals') return <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Company approvals</p>
    <h1 className="mt-2 text-2xl font-bold text-slate-900">No company submissions</h1>
    <p className="mt-2 text-sm text-slate-600">External company onboarding is not connected in this prototype.</p>
  </section>;

  if (page === 'adm-career-fair') return <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Career Fair Management</p>
    <h1 className="mt-2 text-2xl font-bold text-slate-900">No events added</h1>
    <p className="mt-2 text-sm text-slate-600">Events will appear here after they are added.</p>
  </section>;

  if (page !== 'adm-opportunity-approvals') return <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6">
    <h1 className="text-xl font-bold text-slate-900">This screen is not part of the current prototype</h1>
  </section>;

  const resetForm = () => {
    setTitle(''); setCompany(''); setLocation(''); setProgramme(''); setStartDate(''); setEndDate(''); setDeadline(''); setSkills(''); setSummary(''); setSourceUrl(''); setApplicationUrl('');
  };

  const publish = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (endDate < startDate) { showToast('Internship end date must be after its start date.'); return; }
    const keywordList = skills.split(',').map((item) => item.trim()).filter(Boolean);
    if (keywordList.length < 1 || keywordList.length > 3) { showToast('Enter one to three required keywords for matching.'); return; }
    const opportunity: Omit<Opportunity, 'id' | 'isDemoListing' | 'approvalStatus' | 'postedByEmployer' | 'matchNotificationsSent'> = {
      title: title.trim(), company: company.trim(), logoKey: '', industry: '', location: location.trim(),
      workMode: 'Hybrid', roleType: 'Internship', degreeTarget: programme.trim(), experienceLevel: 'Student placement',
      duration: 'Internship placement', allowance: 'Not specified', deadline, matchScore: 0,
      matchExplanation: 'Calculated from confirmed student skills, eligibility, location and placement dates.', skills: keywordList,
      summary: summary.trim(), responsibilities: [], requirements: [`Placement dates: ${startDate} to ${endDate}`, `Eligible programme: ${programme.trim()}`],
      sourceLabel: 'Career Centre listing', sourceUrl: sourceUrl.trim() || undefined, applicationUrl: applicationUrl.trim() || undefined,
      internshipStartDate: startDate, internshipEndDate: endDate,
    };
    createCareerCentreOpportunity(opportunity);
    setPreviewId(null);
    resetForm();
    setFormOpen(false);
  };

  const selected = staffListings.find((item) => item.id === previewId);
  const selectedMatches = selected ? matchesFor(selected) : [];

  return <div className="mx-auto max-w-4xl space-y-5">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Career Centre</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Opportunity Matching</h1>
        <p className="mt-1 text-sm text-slate-600">Create a listing. Only profiles scoring 80% or higher are shown to students.</p>
      </div>
      <button type="button" onClick={() => setFormOpen((open) => !open)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
        {formOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{formOpen ? 'Cancel' : 'Add listing'}
      </button>
    </header>

    {!API_CONFIG.useMockData && pendingEmployerListings.length > 0 && <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4"><div><h2 className="font-bold text-slate-900">Employer listings awaiting review</h2><p className="text-xs text-slate-600">Approval publishes the listing and calculates 80%+ matches.</p></div>{pendingEmployerListings.map(item=><article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4"><div><p className="text-xs font-semibold text-blue-700">{item.company} · {item.sourceLabel}</p><h3 className="font-bold">{item.title}</h3><p className="mt-1 text-xs text-slate-500">{item.location} · {item.internshipStartDate} to {item.internshipEndDate} · Keywords: {item.skills.join(', ')}</p><p className="mt-1 text-xs text-slate-600">{item.summary}</p></div><div className="flex gap-2"><button onClick={()=>void decideEmployerListing(item.id,'reject')} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700">Reject</button><button onClick={()=>void decideEmployerListing(item.id,'approve')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Approve & match</button></div></article>)}</section>}

    {formOpen && <form onSubmit={publish} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-bold text-slate-900">New internship listing</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {[[title, setTitle, 'Role title', 'e.g. Software Engineering Intern'], [company, setCompany, 'Company', 'Company name'], [location, setLocation, 'Location', 'City or work area'], [programme, setProgramme, 'Eligible programme(s)', 'e.g. Software Engineering']].map(([value, setter, label, placeholder]) => <label key={label as string} className="text-xs font-semibold text-slate-700">{label as string}<input required value={value as string} onChange={(event) => (setter as (next: string) => void)(event.target.value)} placeholder={placeholder as string} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>)}
        <label className="text-xs font-semibold text-slate-700">Internship starts<input required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-slate-700">Internship ends<input required type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-slate-700">Application deadline<input required type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-slate-700">Required keywords (1–3)<input required value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Python, SQL, React" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal" /><span className="mt-1 block font-normal text-slate-500">Use specific skills students can confirm in their profile.</span></label>
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Role details<textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} placeholder="Describe the role" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-slate-700">Source URL (optional)<input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://..." className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-slate-700">Application URL (optional)<input type="url" value={applicationUrl} onChange={(event) => setApplicationUrl(event.target.value)} placeholder="https://..." className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">Publishing recalculates matches and emails students at 80%+ when server SMTP is configured.</p>
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Publish listing</button>
      </div>
    </form>}

    <section className="space-y-3">
      {staffListings.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <BriefcaseBusiness className="mx-auto h-8 w-8 text-slate-400" />
        <h2 className="mt-3 font-bold text-slate-900">No listings yet</h2>
        <p className="mt-1 text-sm text-slate-500">Add the first listing to start the matching flow.</p>
      </div> : staffListings.map((item) => {
        const rows = matchesFor(item);
        return <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-xs font-semibold text-blue-700">{item.company}</p><h2 className="mt-1 text-lg font-bold text-slate-900">{item.title}</h2><div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{item.location}</span><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{item.internshipStartDate} to {item.internshipEndDate}</span><span>{item.degreeTarget}</span></div></div>
            <button type="button" onClick={() => setPreviewId((current) => current === item.id ? null : item.id)} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">{rows.length} strong match{rows.length === 1 ? '' : 'es'}</button>
          </div>
          {previewId === item.id && <div className="mt-4 border-t border-slate-100 pt-4">
            {rows.length === 0 ? <p className="text-sm text-slate-500">No current student profile meets the 80% threshold and placement date rules.</p> : <div className="space-y-2">{rows.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-3 text-sm"><div><p className="font-semibold text-slate-900">{row.name || 'Student profile'}</p><p className="text-xs text-slate-500">{row.programme || row.id} · {row.matchedSkills.join(', ') || 'Programme, location and timing fit'}</p></div><div className="flex items-center gap-3"><span className="font-bold text-emerald-700">{row.score}%</span><span className="text-xs text-slate-600">{row.response === 'interested' ? 'Interested' : row.response === 'passed' ? 'Passed' : 'Not responded'}</span></div></div>)}</div>}
          </div>}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">{item.applicationUrl && <a href={item.applicationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-700 hover:underline">Application link <ExternalLink className="h-3 w-3" /></a>}{item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-700 hover:underline">Source <ExternalLink className="h-3 w-3" /></a>}<span>{rows.length ? `${rows.length} qualifying profile${rows.length === 1 ? '' : 's'}` : 'No qualifying matches'}</span></div>
        </article>;
      })}
    </section>
    <p className="text-center text-xs text-slate-400">The role switcher is for local presentation only; account access is handled by the sign-in flow.</p>
  </div>;
};
