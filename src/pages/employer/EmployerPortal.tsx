import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EmployerPageId, Opportunity } from '../../types';

export const EmployerPortal: React.FC<{ page: EmployerPageId }> = ({ page }) => {
  const { user, opportunities, postEmployerOpportunity, navigate, showToast } = useApp();
  const [title, setTitle] = useState(''); const [company, setCompany] = useState(''); const [location, setLocation] = useState('Kuala Lumpur');
  const [programme, setProgramme] = useState(''); const [keywords, setKeywords] = useState(''); const [start, setStart] = useState(''); const [end, setEnd] = useState(''); const [deadline, setDeadline] = useState(''); const [summary, setSummary] = useState('');
  const myListings = opportunities.filter((entry) => entry.sourceLabel === `Employer listing · ${user.id}`);
  const publish = (event: React.FormEvent) => {
    event.preventDefault();
    const skills = keywords.split(',').map((term) => term.trim()).filter(Boolean);
    if (skills.length < 1 || skills.length > 3) { showToast('Enter one to three required matching keywords.'); return; }
    if (end < start) { showToast('Placement end date must follow its start date.'); return; }
    const listing: Omit<Opportunity, 'id' | 'isDemoListing'> = {
      title: title.trim(), company: company.trim(), logoKey: '', industry: '', location: location.trim(), workMode: 'Hybrid', roleType: 'Internship',
      degreeTarget: programme.trim(), experienceLevel: 'Student placement', duration: 'Internship placement', allowance: 'Not specified', deadline,
      matchScore: 0, matchExplanation: 'Fit score calculated from profile and listing criteria.', skills, summary: summary.trim(), responsibilities: [], requirements: [],
      approvalStatus: 'Pending Review', postedByEmployer: true, sourceLabel: `Employer listing · ${user.id}`, internshipStartDate: start, internshipEndDate: end,
    };
    postEmployerOpportunity(listing); setTitle(''); setCompany(''); setProgramme(''); setKeywords(''); setStart(''); setEnd(''); setDeadline(''); setSummary('');
    navigate('emp-manage-opportunities');
  };
  if (page === 'emp-post-opportunity') return <div className="mx-auto max-w-3xl space-y-5">
    <header><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Employer workspace</p><h1 className="mt-1 text-2xl font-bold">Post an internship listing</h1><p className="mt-2 text-sm text-slate-600">Provide eligibility, up to three required keywords, and placement dates. Career Centre review is required before a listing is published and matched.</p></header>
    <form onSubmit={publish} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
      <label className="text-sm font-semibold">Role title<input required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
      <label className="text-sm font-semibold">Company<input required value={company} onChange={(e) => setCompany(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
      <label className="text-sm font-semibold">Location<input required value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
      <label className="text-sm font-semibold">Eligible programmes<input required value={programme} onChange={(e) => setProgramme(e.target.value)} placeholder="e.g. Software Engineering, Computer Science" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
      <label className="text-sm font-semibold sm:col-span-2">Required keywords (up to 3)<input required value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Python, SQL, React" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /><span className="mt-1 block text-xs font-normal text-slate-500">Choose concrete skills students can confirm in their profile; aliases such as JS → JavaScript are supported.</span></label>
      <label className="text-sm font-semibold">Placement starts<input required type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
      <label className="text-sm font-semibold">Placement ends<input required type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
      <label className="text-sm font-semibold">Application deadline<input required type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
      <label className="text-sm font-semibold sm:col-span-2">Role summary<textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:col-span-2"><span className="text-xs text-slate-500">Your listing is saved for Career Centre review. Strong-match emails require server email settings.</span><button className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">Submit for review</button></div>
    </form></div>;
  if (page === 'emp-manage-opportunities') return <div className="mx-auto max-w-3xl space-y-4"><header className="flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Employer workspace</p><h1 className="mt-1 text-2xl font-bold">My listings</h1></div><button onClick={() => navigate('emp-post-opportunity')} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Add listing</button></header>{myListings.length ? myListings.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm font-bold">{item.title} · {item.company}</p><p className="mt-1 text-xs text-slate-500">{item.location} · {item.internshipStartDate} to {item.internshipEndDate} · {item.skills.join(', ')}</p><p className={`mt-2 text-xs font-semibold ${item.approvalStatus === 'Approved' ? 'text-emerald-700' : 'text-amber-700'}`}>{item.approvalStatus === 'Approved' ? 'Approved and published' : 'Pending Career Centre review'}</p></article>) : <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No listings yet. Create one to begin matching.</div>}</div>;
  return <div className="mx-auto max-w-5xl space-y-5"><section className="relative isolate min-h-[280px] overflow-hidden rounded-2xl bg-[#0D1526] shadow-sm"><img src="/assets/aistudio/Apu_campus_1e9018be.jpg" alt="Asia Pacific University campus" className="absolute inset-0 -z-10 h-full w-full object-cover"/><div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0D1526]/95 via-[#0D1526]/75 to-[#0D1526]/25"/><div className="max-w-2xl px-7 py-9 text-white sm:px-10 sm:py-12"><p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-200">Employer workspace</p><h1 className="mt-3 text-3xl font-bold">Welcome, {user.name}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-200">Submit internship listings for Career Centre review. Approved listings are matched against eligible student profiles.</p><button onClick={() => navigate('emp-post-opportunity')} className="mt-6 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-500">Post a listing</button></div></section></div>;
};
