import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EmployerPageId, Opportunity } from '../../types';
import { API_CONFIG, apiRequest } from '../../services/apiClient';

type EmployerProfile = { companyName: string; employerCount: number; location: string; website: string; description: string; approvalStatus?: string; createdAt?: string };
type EmployerApplicant = {
  id: string; status: string; note: string; appliedAt: string; resumeShared: boolean; resumeAvailable: boolean;
  student: { name: string; degree: string; major: string; yearOfStudy: string; bio: string; skills: string[]; careerInterests: string[]; languages: string[]; internshipAvailability: string; projects: Array<{ id: string; title: string; summary: string; role: string; techStack: string[] }>; certifications: Array<{ id: string; name: string; issuer: string; date: string }>; workExperience: Array<{ id: string; role: string; organization: string; period: string; summary: string }> };
};
const EMPTY_PROFILE: EmployerProfile = { companyName: '', employerCount: 1, location: 'Kuala Lumpur', website: '', description: '' };

export const EmployerPortal: React.FC<{ page: EmployerPageId }> = ({ page }) => {
  const { user, opportunities, postEmployerOpportunity, navigate, showToast } = useApp();
  const [profile, setProfile] = useState<EmployerProfile>(EMPTY_PROFILE);
  const [profileSaving, setProfileSaving] = useState(false);
  const [title, setTitle] = useState(''); const [location, setLocation] = useState('Kuala Lumpur');
  const [programme, setProgramme] = useState(''); const [keywords, setKeywords] = useState(''); const [start, setStart] = useState(''); const [end, setEnd] = useState(''); const [deadline, setDeadline] = useState(''); const [summary, setSummary] = useState('');
  const [serverListings, setServerListings] = useState<Opportunity[] | null>(null);
  const [applicantsByListing, setApplicantsByListing] = useState<Record<string, EmployerApplicant[]>>({});
  const [loadingApplicants, setLoadingApplicants] = useState<string | null>(null);
  const [expandedApplicant, setExpandedApplicant] = useState<string | null>(null);
  const [expandedListing, setExpandedListing] = useState<string | null>(null);
  const myListings = serverListings ?? opportunities.filter((entry) => entry.sourceLabel === `Employer listing · ${user.id}`);
  useEffect(() => {
    void apiRequest<EmployerProfile>('/employer/profile')
      .then(({ data }) => { setProfile(data); setLocation(data.location || 'Kuala Lumpur'); })
      .catch(error => showToast(error instanceof Error ? error.message : 'Company profile could not be loaded'));
  }, [page, showToast]);
  useEffect(() => {
    if (page !== 'emp-manage-opportunities' && page !== 'emp-applications') return;
    void apiRequest<Opportunity[]>('/employer/opportunities')
      .then(({ data }) => setServerListings(data))
      .catch(error => showToast(error instanceof Error ? error.message : 'Company listings could not be loaded'));
  }, [page, showToast]);
  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileSaving(true);
    try {
      const { data } = await apiRequest<EmployerProfile>('/employer/profile', { method: 'PUT', body: JSON.stringify({ profile }) });
      setProfile(data);
      showToast('Company profile saved.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Company profile could not be saved');
    } finally {
      setProfileSaving(false);
    }
  };
  const loadApplicants = async (listingId: string) => {
    setLoadingApplicants(listingId);
    try {
      const { data } = await apiRequest<EmployerApplicant[]>(`/employer/opportunities/${encodeURIComponent(listingId)}/applications`);
      setApplicantsByListing(current => ({ ...current, [listingId]: data }));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Applicants could not be loaded');
    } finally {
      setLoadingApplicants(null);
    }
  };
  const updateApplicationStatus = async (applicationId: string, listingId: string, status: 'Under Review' | 'Shortlisted' | 'Interview' | 'Rejected' | 'Placed') => {
    try {
      await apiRequest(`/employer/applications/${encodeURIComponent(applicationId)}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      setApplicantsByListing(current => ({ ...current, [listingId]: (current[listingId] || []).map(item => item.id === applicationId ? { ...item, status } : item) }));
      showToast(`Application moved to ${status}.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Application status could not be updated');
    }
  };
  const openApplicantCv = async (applicationId: string) => {
    try {
      const token = localStorage.getItem('apu_next_access_token');
      const response = await fetch(`${API_CONFIG.baseUrl}/employer/applications/${encodeURIComponent(applicationId)}/cv`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!response.ok) throw new Error(response.status === 403 ? 'The student has not consented to share this CV.' : `CV could not be opened (${response.status}).`);
      const url = URL.createObjectURL(await response.blob());
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'CV could not be opened');
    }
  };
  const publish = async (event: React.FormEvent) => {
    event.preventDefault();
    const skills = keywords.split(',').map((term) => term.trim()).filter(Boolean);
    if (skills.length < 1 || skills.length > 3) { showToast('Enter one to three required matching keywords.'); return; }
    if (end < start) { showToast('Placement end date must follow its start date.'); return; }
    const listing: Omit<Opportunity, 'id' | 'isDemoListing'> = {
      title: title.trim(), company: profile.companyName || user.name, logoKey: '', industry: '', location: location.trim(), workMode: 'Hybrid', roleType: 'Internship',
      degreeTarget: programme.trim(), experienceLevel: 'Student placement', duration: 'Internship placement', allowance: 'Not specified', deadline,
      matchScore: 0, matchExplanation: 'Fit score calculated from profile and listing criteria.', skills, summary: summary.trim(), responsibilities: [], requirements: [],
      approvalStatus: 'Pending Review', postedByEmployer: true, sourceLabel: `Employer listing · ${user.id}`, internshipStartDate: start, internshipEndDate: end,
    };
    try {
      const saved = await postEmployerOpportunity(listing);
      setServerListings(current => [saved, ...(current || []).filter(item => item.id !== saved.id)]);
      setTitle(''); setProgramme(''); setKeywords(''); setStart(''); setEnd(''); setDeadline(''); setSummary('');
    } catch (error) {
      showToast(`Could not submit listing: ${error instanceof Error ? error.message : 'API error'}`);
      return;
    }
    navigate('emp-manage-opportunities');
  };
  if (page === 'emp-profile') return <div className="mx-auto max-w-3xl space-y-5"><header><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Employer workspace</p><h1 className="mt-1 text-2xl font-bold">Company profile</h1><p className="mt-2 text-sm text-slate-600">Keep your company information clear so students and the Career Centre understand who is offering each internship.</p></header><section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm"><div><p className="font-semibold">Company account status</p><p className="mt-1 text-slate-600">{profile.approvalStatus || 'Status unavailable'}{profile.createdAt ? ` · Registered ${new Date(profile.createdAt).toLocaleDateString()}` : ''}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${profile.approvalStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{profile.approvalStatus || 'Unknown'}</span></section><form onSubmit={saveProfile} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2"><label className="text-sm font-semibold">Company name<input required value={profile.companyName} onChange={event => setProfile(current => ({ ...current, companyName: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label><label className="text-sm font-semibold">Number of employers<input required min={1} type="number" value={profile.employerCount} onChange={event => setProfile(current => ({ ...current, employerCount: Number(event.target.value) }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label><label className="text-sm font-semibold">Location<input required value={profile.location} onChange={event => setProfile(current => ({ ...current, location: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label><label className="text-sm font-semibold">Company website<input type="url" value={profile.website} onChange={event => setProfile(current => ({ ...current, website: event.target.value }))} placeholder="https://example.com" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label><label className="text-sm font-semibold sm:col-span-2">Company description<textarea required value={profile.description} onChange={event => setProfile(current => ({ ...current, description: event.target.value }))} rows={5} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label><div className="flex justify-end border-t border-slate-100 pt-4 sm:col-span-2"><button disabled={profileSaving} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{profileSaving ? 'Saving…' : 'Save company profile'}</button></div></form></div>;
  if (page === 'emp-post-opportunity') return <div className="mx-auto max-w-3xl space-y-5">
    <header><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Employer workspace</p><h1 className="mt-1 text-2xl font-bold">Post an internship listing</h1><p className="mt-2 text-sm text-slate-600">Provide eligibility, up to three required keywords, and placement dates. Career Centre review is required before a listing is published and matched.</p></header>
    <form onSubmit={publish} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
      <label className="text-sm font-semibold">Role title<input required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
      <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Posting as <strong className="text-slate-900">{profile.companyName || user.name}</strong>. Your approved company profile supplies the company name.</p>
      <label className="text-sm font-semibold">Location<input required value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
      <label className="text-sm font-semibold">Eligible programmes<input required value={programme} onChange={(e) => setProgramme(e.target.value)} placeholder="e.g. Software Engineering, Computer Science" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
      <label className="text-sm font-semibold sm:col-span-2">Required keywords (up to 3)<input required value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Python, SQL, React" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /><span className="mt-1 block text-xs font-normal text-slate-500">Choose concrete skills students can confirm in their profile; aliases such as JS → JavaScript are supported.</span></label>
      <label className="text-sm font-semibold">Placement starts<input required type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
      <label className="text-sm font-semibold">Placement ends<input required type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
      <label className="text-sm font-semibold">Application deadline<input required type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
      <label className="text-sm font-semibold sm:col-span-2">Role summary<textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:col-span-2"><span className="text-xs text-slate-500">Your listing is saved for Career Centre review. Strong-match emails require server email settings.</span><button className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">Submit for review</button></div>
    </form></div>;
  if (page === 'emp-manage-opportunities' || page === 'emp-applications') return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="flex items-end justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Employer workspace</p><h1 className="mt-1 text-2xl font-bold">My listings &amp; applicants</h1></div>
        <button onClick={() => navigate('emp-post-opportunity')} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Add listing</button>
      </header>
      {myListings.length ? myListings.map(item => (
        <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-bold">{item.title} · {item.company}</p>
          <p className="mt-1 text-xs text-slate-500">{item.location} · {item.internshipStartDate} to {item.internshipEndDate} · {item.skills.join(', ')}</p>
          <p className={`mt-2 text-xs font-semibold ${item.approvalStatus === 'Approved' ? 'text-emerald-700' : item.approvalStatus === 'Rejected' ? 'text-red-700' : 'text-amber-700'}`}>{item.approvalStatus === 'Approved' ? 'Approved and published' : item.approvalStatus === 'Rejected' ? 'Rejected by Career Centre' : 'Pending Career Centre review'}</p>
          <button type="button" onClick={() => setExpandedListing(expandedListing === item.id ? null : item.id)} className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">{expandedListing === item.id ? 'Hide full details' : 'View full details'}</button>
          {expandedListing === item.id && <section className="mt-3 rounded-lg bg-slate-50 p-4 text-sm">
            <dl className="grid gap-3 sm:grid-cols-2">{[['Work arrangement', item.workMode], ['Role type', item.roleType], ['Eligible programmes', item.degreeTarget], ['Experience level', item.experienceLevel], ['Duration', item.duration], ['Allowance', item.allowance], ['Application deadline', item.deadline], ['Placement starts', item.internshipStartDate], ['Placement ends', item.internshipEndDate], ['Required skills', item.skills.join(', ')]].map(([label, value]) => value ? <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="font-medium text-slate-800">{value}</dd></div> : null)}</dl>
            <h3 className="mt-4 font-semibold">Role description</h3><p className="mt-1 whitespace-pre-wrap text-slate-700">{item.summary || 'No description provided.'}</p>
            {item.responsibilities.length > 0 && <><h3 className="mt-4 font-semibold">Responsibilities</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700">{item.responsibilities.map((entry, index) => <li key={`${item.id}-responsibility-${index}`}>{entry}</li>)}</ul></>}
            {item.requirements.length > 0 && <><h3 className="mt-4 font-semibold">Requirements</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700">{item.requirements.map((entry, index) => <li key={`${item.id}-requirement-${index}`}>{entry}</li>)}</ul></>}
          </section>}
          {item.approvalStatus === 'Approved' && <button type="button" onClick={() => void loadApplicants(item.id)} className="mt-4 rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700">{loadingApplicants === item.id ? 'Loading applicants…' : `View applicants${applicantsByListing[item.id] ? ` (${applicantsByListing[item.id].length})` : ''}`}</button>}
          {applicantsByListing[item.id] && <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">{applicantsByListing[item.id].length ? applicantsByListing[item.id].map(applicant => (
            <section key={applicant.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><button type="button" onClick={() => setExpandedApplicant(expandedApplicant === applicant.id ? null : applicant.id)} className="font-bold text-blue-700 hover:underline">{applicant.student.name}</button><p className="text-xs text-slate-500">{[applicant.student.degree, applicant.student.major, applicant.student.yearOfStudy].filter(Boolean).join(' · ') || 'Academic profile not provided'}</p><p className="mt-1 text-xs text-slate-500">Applied {new Date(applicant.appliedAt).toLocaleDateString()} · {applicant.status}</p></div>
                <div className="flex flex-wrap gap-2"><select aria-label={`Update status for ${applicant.student.name}`} value={applicant.status} onChange={event => void updateApplicationStatus(applicant.id, item.id, event.target.value as 'Under Review' | 'Shortlisted' | 'Interview' | 'Rejected' | 'Placed')} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"><option>Under Review</option><option>Shortlisted</option><option>Interview</option><option>Rejected</option><option>Placed</option></select>{applicant.resumeAvailable && applicant.resumeShared && <button type="button" onClick={() => void openApplicantCv(applicant.id)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white">View shared CV</button>}</div>
              </div>
              {expandedApplicant === applicant.id && <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm"><p className="whitespace-pre-wrap">{applicant.student.bio || 'No professional summary provided.'}</p>{applicant.student.skills.length > 0 && <p><strong>Skills:</strong> {applicant.student.skills.join(', ')}</p>}{applicant.student.careerInterests.length > 0 && <p><strong>Career interests:</strong> {applicant.student.careerInterests.join(', ')}</p>}{applicant.student.languages.length > 0 && <p><strong>Languages:</strong> {applicant.student.languages.join(', ')}</p>}{applicant.student.internshipAvailability && <p><strong>Availability:</strong> {applicant.student.internshipAvailability}</p>}{applicant.student.workExperience.length > 0 && <div><strong>Experience</strong>{applicant.student.workExperience.map(experience => <p key={experience.id} className="mt-1 text-slate-600">{experience.role} · {experience.organization}{experience.summary ? ` — ${experience.summary}` : ''}</p>)}</div>}{applicant.student.projects.length > 0 && <p><strong>Projects:</strong> {applicant.student.projects.map(project => project.title).join(', ')}</p>}{applicant.student.certifications.length > 0 && <p><strong>Certifications:</strong> {applicant.student.certifications.map(certification => certification.name).join(', ')}</p>}{applicant.note && <p><strong>Application note:</strong> {applicant.note}</p>}{!applicant.resumeShared && <p className="text-xs text-slate-500">The student did not consent to share their CV with this application.</p>}</div>}
            </section>
          )) : <p className="text-sm text-slate-500">No applicants yet.</p>}</div>}
        </article>
      )) : <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No listings yet. Create one to begin matching.</div>}
    </div>
  );
  return <div className="mx-auto max-w-5xl space-y-5"><section className="relative isolate min-h-[280px] overflow-hidden rounded-2xl bg-[#0D1526] shadow-sm"><img src="/assets/aistudio/Apu_campus_1e9018be.jpg" alt="Asia Pacific University campus" className="absolute inset-0 -z-10 h-full w-full object-cover"/><div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0D1526]/95 via-[#0D1526]/75 to-[#0D1526]/25"/><div className="max-w-2xl px-7 py-9 text-white sm:px-10 sm:py-12"><p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-200">Employer workspace</p><h1 className="mt-3 text-3xl font-bold">Welcome, {user.name}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-200">Submit internship listings for Career Centre review. Approved listings are matched against eligible student profiles.</p><button onClick={() => navigate('emp-post-opportunity')} className="mt-6 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-500">Post a listing</button></div></section></div>;
};
