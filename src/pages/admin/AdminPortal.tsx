import React, { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, CalendarDays, Check, ClipboardCheck, ClipboardList, Download, ExternalLink, Mail, MapPin, MessageSquare, Plus, Users, Building2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdminPageId, Opportunity, StudentProfile } from '../../types';
import { getStrongMatches } from '../../services/matching';
import { API_CONFIG, apiRequest } from '../../services/apiClient';
import { AdminRecordDetail } from './AdminRecordDetail';
import { CareerjetDiscoveryPage } from './CareerjetDiscoveryPage';

interface AdminPortalProps {
  page: AdminPageId;
}

type MatchRow = { id: string; name: string; programme: string; matchedSkills: string[]; score: number; response: string | null };
type CareerRequest = { id: string; requestType: 'cv_review' | 'mock_interview' | 'event_interest'; data: { name?: string; email?: string; programme?: string; details?: string; interviewerType?: string; interviewerName?: string; preferredTime?: string; emailStatus?: string; emailRecipients?: string[] }; fileName?: string | null; hasAttachment?: boolean; createdAt: string; status: string };
type InternshipReport = { id: string; studentId: string; studentName?: string; studentEmail?: string; phase: 'part1' | 'part2'; status: string; note: string; reviewerComment: string; updatedAt: string; files: Array<{ id: string; requirementId: string; fileName: string; status: string; reviewerComment: string }> };
type AdminDashboardStats = { students: number; employers: number; vacancies: number };
type DashboardUser = { id: string; name: string; role: string; email: string };
type EmployerRecord = { id: string; companyName: string; email: string; profile: { companyName?: string; employerCount?: number; location?: string; website?: string; description?: string }; approvalStatus: 'Pending' | 'Approved' | 'Rejected'; createdAt: string; listings: Opportunity[] };

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
  const [expandedListingId, setExpandedListingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [careerRequests, setCareerRequests] = useState<CareerRequest[]>([]);
  const [requestTypeFilter, setRequestTypeFilter] = useState<CareerRequest['requestType']>('mock_interview');
  const [internshipReports, setInternshipReports] = useState<InternshipReport[]>([]);
  const [reportComments, setReportComments] = useState<Record<string, string>>({});
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats>({ students: 0, employers: 0, vacancies: 0 });
  const [dashboardUsers, setDashboardUsers] = useState<DashboardUser[]>([]);
  const [dashboardView, setDashboardView] = useState<'students' | 'employers' | 'vacancies' | null>(null);
  const [employerRecords, setEmployerRecords] = useState<EmployerRecord[]>([]);
  const [companyFilter, setCompanyFilter] = useState<'All' | EmployerRecord['approvalStatus']>('All');
  const [companyListingFilters, setCompanyListingFilters] = useState<Record<string, 'All' | 'Pending Review' | 'Approved' | 'Rejected'>>({});
  const [selectedRecord, setSelectedRecord] = useState<{ kind: 'student' | 'company' | 'vacancy'; id: string } | null>(null);

  const staffListings = useMemo(() => opportunities, [opportunities]);

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

  useEffect(() => {
    if (API_CONFIG.useMockData || page !== 'adm-company-approvals') return;
    void apiRequest<EmployerRecord[]>('/admin/employers')
      .then(({ data }) => setEmployerRecords(data))
      .catch((error) => showToast(`Could not load company registrations: ${error instanceof Error ? error.message : 'API error'}`));
  }, [page, showToast]);

  const decideEmployer = async (employer: EmployerRecord, decision: 'approve' | 'reject') => {
    try {
      await apiRequest(`/admin/employers/${employer.id}/decision`, { method: 'PUT', body: JSON.stringify({ decision }) });
      setEmployerRecords(current => current.map(item => item.id === employer.id ? { ...item, approvalStatus: decision === 'approve' ? 'Approved' : 'Rejected' } : item));
      showToast(decision === 'approve' ? `${employer.companyName} approved.` : `${employer.companyName} rejected.`);
    } catch (error) {
      showToast(`Could not update company approval: ${error instanceof Error ? error.message : 'API error'}`);
    }
  };

  useEffect(() => {
    if (API_CONFIG.useMockData || page !== 'adm-career-requests') return;
    let mounted = true;
    void apiRequest<CareerRequest[]>('/admin/career-guidance/requests')
      .then(({ data }) => { if (mounted) setCareerRequests(data); })
      .catch((error) => { if (mounted) showToast(`Could not load career requests: ${error instanceof Error ? error.message : 'API error'}`); });
    return () => { mounted = false; };
  }, [page, showToast]);

  useEffect(() => {
    if (API_CONFIG.useMockData || page !== 'adm-internship-monitoring') return;
    let mounted = true;
    void apiRequest<InternshipReport[]>('/admin/internship-reports').then(({ data }) => { if (mounted) setInternshipReports(data); }).catch(error => {
      if (mounted) showToast(`Could not load internship reports: ${error instanceof Error ? error.message : 'API error'}`);
    });
    return () => { mounted = false; };
  }, [page, showToast]);

  useEffect(() => {
    if (API_CONFIG.useMockData || page !== 'adm-dashboard') return;
    let mounted = true;
    void Promise.all([
      apiRequest<AdminDashboardStats>('/admin/dashboard/stats'),
      apiRequest<DashboardUser[]>('/community/users'),
    ]).then(([statsResult, usersResult]) => {
        if (mounted) {
          setDashboardStats(statsResult.data);
          setDashboardUsers(usersResult.data);
        }
      })
      .catch(error => { if (mounted) showToast(`Could not load dashboard statistics: ${error instanceof Error ? error.message : 'API error'}`); });
    return () => { mounted = false; };
  }, [page, showToast]);

  const reviewInternshipReport = async (id: string, status: 'Approved' | 'Changes Requested') => {
    try {
      const { data } = await apiRequest<InternshipReport>(`/admin/internship-reports/${encodeURIComponent(id)}/review`, { method: 'PUT', body: JSON.stringify({ status, comment: reportComments[id] || '' }) });
      setInternshipReports(current => current.map(item => item.id === id ? data : item));
      showToast(status === 'Approved' ? 'Internship report approved.' : 'Changes requested from student.');
    } catch (error) { showToast(`Could not review internship report: ${error instanceof Error ? error.message : 'Review failed'}`); }
  };

  const downloadInternshipFile = async (report: InternshipReport, file: InternshipReport['files'][number]) => {
    try {
      const token = localStorage.getItem('apu_next_access_token');
      const response = await fetch(`${API_CONFIG.baseUrl}/internship-reports/${encodeURIComponent(report.id)}/files/${encodeURIComponent(file.id)}`, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      if (!response.ok) throw new Error(`Download failed (${response.status})`);
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) { showToast(`Could not download document: ${error instanceof Error ? error.message : 'Download failed'}`); }
  };

  const viewInternshipFile = async (report: InternshipReport, file: InternshipReport['files'][number]) => {
    try {
      const token = localStorage.getItem('apu_next_access_token');
      const response = await fetch(`${API_CONFIG.baseUrl}/internship-reports/${encodeURIComponent(report.id)}/files/${encodeURIComponent(file.id)}`, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      if (!response.ok) throw new Error(`View failed (${response.status})`);
      const url = URL.createObjectURL(await response.blob());
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) { showToast(`Could not view document: ${error instanceof Error ? error.message : 'View failed'}`); }
  };

  const reviewInternshipFile = async (report: InternshipReport, file: InternshipReport['files'][number], status: 'Approved' | 'Changes Requested') => {
    try {
      const { data } = await apiRequest<InternshipReport>(`/admin/internship-reports/${encodeURIComponent(report.id)}/files/${encodeURIComponent(file.id)}/review`, { method: 'PUT', body: JSON.stringify({ status, comment: reportComments[file.id] || '' }) });
      setInternshipReports(current => current.map(item => item.id === report.id ? data : item));
      showToast(status === 'Approved' ? 'Document approved.' : 'Changes requested from student.');
    } catch (error) { showToast(`Could not review document: ${error instanceof Error ? error.message : 'Review failed'}`); }
  };

  const decideEmployerListing = async (id: string, decision: 'approve' | 'reject') => {
    try {
      const { data } = await apiRequest<{ opportunity: Opportunity; matches: Array<{ studentId: string; score: number }> }>(`/admin/opportunities/${encodeURIComponent(id)}/decision`, { method: 'PUT', body: JSON.stringify({ decision }) });
      setPendingEmployerListings(current => current.filter(item => item.id !== id));
      setEmployerRecords(current => current.map(company => ({
        ...company,
        listings: company.listings.map(listing => listing.id === id ? data.opportunity : listing),
      })));
      showToast(decision === 'approve' ? `Approved listing. ${data.matches.length} student profile(s) met the match threshold.` : 'Employer listing rejected.');
    } catch (error) { showToast(`Could not review listing: ${error instanceof Error ? error.message : 'API error'}`); }
  };

  const emailRequest = async (request: CareerRequest) => {
    try {
      await apiRequest<{ status: string }>(`/admin/career-guidance/requests/${encodeURIComponent(request.id)}/email`, {
        method: 'POST',
        body: JSON.stringify({ action: request.requestType }),
      });
      setCareerRequests(current => current.map(item => item.id === request.id ? { ...item, status: 'sent', data: { ...item.data, emailStatus: 'sent' } } : item));
      showToast(`Email sent to ${request.data.email}.`);
    } catch (error) {
      showToast(`Could not send email: ${error instanceof Error ? error.message : 'Email delivery failed'}`);
    }
  };

  if (selectedRecord) return <AdminRecordDetail
    kind={selectedRecord.kind}
    recordId={selectedRecord.id}
    onBack={() => setSelectedRecord(null)}
    onOpenCompany={id => setSelectedRecord({ kind: 'company', id })}
    onOpenVacancy={id => setSelectedRecord({ kind: 'vacancy', id })}
    onOpenStudent={id => setSelectedRecord({ kind: 'student', id })}
  />;

  const downloadRequestCv = async (request: CareerRequest) => {
    const token = localStorage.getItem('apu_next_access_token');
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/admin/career-guidance/requests/${encodeURIComponent(request.id)}/cv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error(`Download failed (${response.status})`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = request.fileName || 'student-cv';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast(`Could not download CV: ${error instanceof Error ? error.message : 'Download failed'}`);
    }
  };

  const viewRequestCv = async (request: CareerRequest) => {
    const token = localStorage.getItem('apu_next_access_token');
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/admin/career-guidance/requests/${encodeURIComponent(request.id)}/cv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error(`View failed (${response.status})`);
      const url = URL.createObjectURL(await response.blob());
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      showToast(`Could not view CV: ${error instanceof Error ? error.message : 'View failed'}`);
    }
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

  if (page === 'adm-careerjet-discovery') return <CareerjetDiscoveryPage />;

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
    <section className="grid gap-4 sm:grid-cols-3">
      {[
        { label: 'Registered students', value: dashboardStats.students, tone: 'text-blue-700', icon: Users, view: 'students' as const },
        { label: 'Registered employers', value: dashboardStats.employers, tone: 'text-emerald-700', icon: Building2, view: 'employers' as const },
        { label: 'Active vacancies', value: dashboardStats.vacancies, tone: 'text-amber-700', icon: BriefcaseBusiness, view: 'vacancies' as const },
      ].map(stat => { const Icon = stat.icon; return <button type="button" key={stat.label} onClick={() => setDashboardView(stat.view)} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark-stat-card"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-600">{stat.label}</p><Icon size={19} className={stat.tone} /></div><p className={`mt-3 text-3xl font-extrabold ${stat.tone}`}>{stat.value}</p><p className="mt-1 text-xs text-slate-500">Click to view details</p></button>; })}
    </section>
    {dashboardView && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Dashboard details</p><h2 className="mt-1 text-lg font-bold text-slate-900">{dashboardView === 'students' ? 'Registered students' : dashboardView === 'employers' ? 'Registered employers' : 'Active vacancies'}</h2></div><button type="button" onClick={() => setDashboardView(null)} className="text-sm font-bold text-slate-500 hover:text-slate-900">Close</button></div>
      {dashboardView === 'vacancies' ? <div className="mt-4 grid gap-3 md:grid-cols-2">{staffListings.map(item => <button type="button" key={item.id} onClick={() => setSelectedRecord({ kind: 'vacancy', id: item.id })} className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"><p className="text-xs font-semibold text-blue-700">{item.company}</p><h3 className="mt-1 font-bold text-slate-900">{item.title}</h3><p className="mt-1 text-xs text-slate-500">{item.location} · {item.roleType}</p><span className="mt-2 inline-block text-xs font-bold text-blue-700">View vacancy details →</span></button>)}{staffListings.length === 0 && <p className="mt-4 text-sm text-slate-500">No approved vacancies are currently available.</p>}</div> : <div className="mt-4 grid gap-2 md:grid-cols-2">{dashboardUsers.filter(item => dashboardView === 'students' ? item.role === 'Student' : item.role === 'Employer').map(item => <button type="button" key={item.id} onClick={() => setSelectedRecord({ kind: dashboardView === 'students' ? 'student' : 'company', id: item.id })} className="rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"><p className="font-semibold text-slate-900">{item.name}</p><p className="text-xs text-slate-500">{item.email}</p><span className="mt-1 inline-block text-xs font-bold text-blue-700">View profile →</span></button>)}{dashboardUsers.filter(item => dashboardView === 'students' ? item.role === 'Student' : item.role === 'Employer').length === 0 && <p className="text-sm text-slate-500">No registered {dashboardView} are currently in the database.</p>}</div>}
    </section>}
  </div>;

  if (page === 'adm-company-approvals') return <section className="mx-auto max-w-5xl space-y-5">
    <div className="rounded-2xl bg-gradient-to-br from-[#0D1526] via-[#152c60] to-blue-700 p-6 text-white shadow-sm sm:p-8"><p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Company approvals</p><h1 className="mt-2 text-2xl font-bold">Company &amp; listing review</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Review company access first, then track every internship listing submitted by each company.</p></div>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Level 1 · Company access</p><h2 className="mt-1 text-xl font-bold text-slate-900">Company registrations</h2><p className="mt-1 text-sm text-slate-600">Approving a company allows it to sign in; each listing still requires a separate decision.</p></div><div className="flex flex-wrap gap-2">{(['All', 'Pending', 'Approved', 'Rejected'] as const).map(status => <button key={status} type="button" onClick={() => setCompanyFilter(status)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${companyFilter === status ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{status} {status === 'All' ? employerRecords.length : employerRecords.filter(item => item.approvalStatus === status).length}</button>)}</div></div><div className="mt-4 space-y-3">{employerRecords.filter(item => companyFilter === 'All' || item.approvalStatus === companyFilter).map(employer => <article key={employer.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => setSelectedRecord({ kind: 'company', id: employer.id })} className="font-bold text-slate-900 hover:text-blue-700 hover:underline">{employer.companyName}</button><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${employer.approvalStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700' : employer.approvalStatus === 'Rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>{employer.approvalStatus}</span></div><p className="mt-1 text-sm text-slate-600">{employer.email} · {employer.profile.location || 'Kuala Lumpur'} · Registered {new Date(employer.createdAt).toLocaleDateString()}</p><p className="mt-2 text-sm text-slate-700">{employer.profile.description || 'No company description provided.'}</p>{employer.profile.website && <a href={employer.profile.website} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline">{employer.profile.website}<ExternalLink size={13} /></a>}</div>{employer.approvalStatus === 'Pending' && <div className="flex shrink-0 gap-2"><button type="button" onClick={() => void decideEmployer(employer, 'reject')} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Reject</button><button type="button" onClick={() => void decideEmployer(employer, 'approve')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Approve</button></div>}</div></article>)}{employerRecords.filter(item => companyFilter === 'All' || item.approvalStatus === companyFilter).length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{employerRecords.length === 0 ? 'No company accounts registered yet.' : `No ${companyFilter.toLowerCase()} companies.`}</p>}</div></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Level 2 · Listing review</p><h2 className="mt-1 text-xl font-bold text-slate-900">Internship listings by company</h2><p className="mt-1 text-sm text-slate-600">Use each company’s filter to review pending, approved, or rejected listings individually.</p></div><div className="mt-4 space-y-4">{employerRecords.map(employer => { const filter = companyListingFilters[employer.id] || 'All'; const listings = employer.listings.filter(listing => filter === 'All' || listing.approvalStatus === filter); return <article key={employer.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><button type="button" onClick={() => setSelectedRecord({ kind: 'company', id: employer.id })} className="font-bold text-slate-900 hover:text-blue-700 hover:underline">{employer.companyName}</button><p className="text-xs text-slate-500">{employer.listings.length} listing(s)</p></div><div className="flex flex-wrap gap-1.5">{(['All', 'Pending Review', 'Approved', 'Rejected'] as const).map(status => <button key={status} type="button" onClick={() => setCompanyListingFilters(current => ({ ...current, [employer.id]: status }))} className={`rounded-full px-2.5 py-1.5 text-[11px] font-bold ${filter === status ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{status === 'Pending Review' ? 'Pending' : status} {status === 'All' ? employer.listings.length : employer.listings.filter(listing => listing.approvalStatus === status).length}</button>)}</div></div><div className="mt-3 space-y-2">{listings.map(listing => <div key={listing.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold text-blue-700">{listing.company}</p><button type="button" onClick={() => setSelectedRecord({ kind: 'vacancy', id: listing.id })} className="text-left font-bold text-slate-900 hover:text-blue-700 hover:underline">{listing.title}</button><p className="mt-1 text-xs text-slate-600">{listing.location} · {listing.roleType} · {listing.internshipStartDate || 'Dates not set'}{listing.internshipEndDate ? ` to ${listing.internshipEndDate}` : ''}</p><span className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-bold ${listing.approvalStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700' : listing.approvalStatus === 'Rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>{listing.approvalStatus || 'Pending Review'}</span></div>{listing.approvalStatus === 'Pending Review' && <div className="flex gap-2"><button type="button" onClick={() => void decideEmployerListing(listing.id, 'reject')} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Reject</button><button type="button" onClick={() => void decideEmployerListing(listing.id, 'approve')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Approve</button></div>}</div></div>)}{listings.length === 0 && <p className="mt-2 rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">No {filter === 'All' ? '' : `${filter.toLowerCase()} `}listings for this company.</p>}</div></article>; })}{employerRecords.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No company accounts registered yet.</p>}</div></section>
  </section>;

  if (page === 'adm-career-fair') return <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Career Fair Management</p>
    <h1 className="mt-2 text-2xl font-bold text-slate-900">No events added</h1>
    <p className="mt-2 text-sm text-slate-600">Events will appear here after they are added.</p>
  </section>;

  if (page === 'adm-internship-monitoring') return <section className="admin-report-page mx-auto max-w-6xl space-y-5">
    <div className="rounded-2xl bg-gradient-to-br from-[#0D1526] via-[#152c60] to-blue-700 p-6 text-white shadow-sm sm:p-8">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-200"><ClipboardCheck size={15} /> Internship review queue</p>
      <h1 className="mt-2 text-2xl font-bold">Student internship reports</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Review secure Part 1 and Part 2 submissions, leave actionable feedback, and approve or return them to the student.</p>
    </div>
    {internshipReports.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><ClipboardList className="mx-auto text-slate-400" size={30} /><h2 className="mt-3 font-bold text-slate-900">No internship submissions yet</h2><p className="mt-1 text-sm text-slate-500">Submitted student documents will appear here.</p></div> : <div className="space-y-4">{internshipReports.map(report => <article key={report.id} className="admin-report-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">{report.phase === 'part1' ? 'Part 1 · Weeks 1–8' : 'Part 2 · Final placement'}</p><h2 className="mt-1 text-lg font-bold text-slate-900">{report.studentName || 'Student'} <span className="font-normal text-slate-500">· {report.studentEmail}</span></h2><p className="mt-1 text-xs text-slate-500">{report.files.length} document(s) in this phase</p></div></div><div className="mt-4 space-y-3">{report.files.map(file => <div key={file.id} className="admin-report-file rounded-xl border border-slate-100 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-slate-700">{file.fileName} · <span className="text-blue-700">{file.status}</span></p><div className="flex gap-2"><button type="button" onClick={() => void viewInternshipFile(report, file)} className="text-xs font-bold text-blue-700">View</button><button type="button" onClick={() => void downloadInternshipFile(report, file)} className="text-xs font-bold text-blue-700">Download</button></div></div>{file.reviewerComment && <p className="mt-2 text-xs text-amber-700">{file.reviewerComment}</p>}{file.status !== 'Approved' && <><textarea value={reportComments[file.id] ?? file.reviewerComment} onChange={event => setReportComments(current => ({ ...current, [file.id]: event.target.value }))} rows={2} placeholder="Comment for student..." className="admin-report-comment mt-2 w-full rounded-lg border border-slate-300 p-2 text-xs" /><div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => void reviewInternshipFile(report, file, 'Changes Requested')} className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-800">Request changes</button><button type="button" onClick={() => void reviewInternshipFile(report, file, 'Approved')} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">Approve</button></div></>}</div>)}</div></article>)}</div>}
  </section>;

  if (page === 'adm-career-requests') {
    const requestSections: Array<{ type: CareerRequest['requestType']; label: string; description: string }> = [
      { type: 'mock_interview', label: 'Mock interview', description: 'Students asking to practise with the Career Centre.' },
      { type: 'cv_review', label: 'CV review', description: 'Student CVs waiting for review.' },
      { type: 'event_interest', label: 'Event interest', description: 'Students interested in Career Centre events.' },
    ];
    const visibleRequests = careerRequests.filter(request => request.requestType === requestTypeFilter);
    return <section className="mx-auto max-w-6xl space-y-5">
    <div className="rounded-2xl bg-gradient-to-br from-[#0D1526] via-[#152c60] to-blue-700 p-6 text-white shadow-sm sm:p-8">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-200"><ClipboardList size={15}/> Student support queue</p>
      <h1 className="mt-2 text-2xl font-bold">Career Guide requests</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Open a request category to review student submissions and send the appropriate response email.</p>
    </div>
    <div className="grid gap-3 md:grid-cols-3">
      {requestSections.filter(section => section.type !== 'event_interest').map(section => {
        const count = careerRequests.filter(request => request.requestType === section.type).length;
        return <button key={section.type} type="button" onClick={() => setRequestTypeFilter(section.type)} className={`rounded-2xl border p-4 text-left transition ${requestTypeFilter === section.type ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
          <p className="text-sm font-bold text-slate-900">{section.label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{section.description}</p>
          <p className="mt-3 text-2xl font-extrabold text-blue-700">{count}</p>
        </button>;
      })}
    </div>
    {visibleRequests.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><ClipboardList className="mx-auto text-slate-400" size={30}/><h2 className="mt-3 font-bold text-slate-900">No {requestSections.find(section => section.type === requestTypeFilter)?.label.toLowerCase()} requests</h2><p className="mt-1 text-sm text-slate-500">New student requests will appear in this section.</p></div> : <div className="grid gap-4 md:grid-cols-2">{visibleRequests.map((request) => <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">{request.requestType.replace('_', ' ')}</p><h2 className="mt-1 font-bold text-slate-900">{request.data.name || 'Student request'}</h2><p className="text-sm text-slate-500">{request.data.email} · {request.data.programme || 'Programme not provided'}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${request.status === 'sent' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{request.status}</span></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{request.data.details || 'No additional details.'}</p>{request.requestType === 'cv_review' && request.fileName && <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"><span className="truncate text-xs font-semibold text-slate-600">CV: {request.fileName}</span>{request.hasAttachment && <span className="flex shrink-0 gap-2"><button type="button" onClick={() => void viewRequestCv(request)} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900"><ExternalLink size={14}/> View</button><button type="button" onClick={() => void downloadRequestCv(request)} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900"><Download size={14}/> Download</button></span>}</div>}{request.requestType === 'mock_interview' && <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">With: {request.data.interviewerName || request.data.interviewerType || 'Career Centre'} · Preferred: {request.data.preferredTime || 'Not specified'}</p><a href="https://calendar.google.com/calendar/u/0/r" target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900"><CalendarDays size={14}/> Career Centre Schedule</a></div>}<div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3"><p className="text-xs text-slate-400">{new Date(request.createdAt).toLocaleString()}</p><button type="button" onClick={() => void emailRequest(request)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"><Mail size={14}/>{request.status === 'sent' ? 'Send again' : 'Send email'}</button></div></article>)}</div>}
  </section>;
  }

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

    {!API_CONFIG.useMockData && pendingEmployerListings.length > 0 && <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4"><div><h2 className="font-bold text-slate-900">Employer listings awaiting review</h2><p className="text-xs text-slate-600">Review the complete company and internship role before approving or rejecting it.</p></div>{pendingEmployerListings.map(item => { const expanded = expandedListingId === item.id; return <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold text-blue-700">{item.company}</p><div className="mt-1 flex flex-wrap items-center gap-3"><h3 className="text-lg font-bold text-slate-900">{item.title}</h3>{item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-700 hover:underline">Company website</a>}</div><p className="mt-1 text-xs text-slate-500">{item.roleType} · {item.location} · {item.workMode} · {item.internshipStartDate || 'Start date not set'} to {item.internshipEndDate || 'End date not set'}</p><p className="mt-2 text-sm text-slate-700">{item.summary}</p></div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => setExpandedListingId(expanded ? null : item.id)} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700">{expanded ? 'Hide full role' : 'View full role'}</button><button type="button" onClick={() => void decideEmployerListing(item.id,'reject')} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700">Reject</button><button type="button" onClick={() => void decideEmployerListing(item.id,'approve')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Approve & match</button></div></div>{expanded && <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-2"><div><h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Role details</h4><dl className="mt-2 space-y-1 text-sm text-slate-700"><div><dt className="inline font-semibold">Industry: </dt><dd className="inline">{item.industry || 'Not provided'}</dd></div><div><dt className="inline font-semibold">Target programme: </dt><dd className="inline">{item.degreeTarget || 'Not provided'}</dd></div><div><dt className="inline font-semibold">Experience: </dt><dd className="inline">{item.experienceLevel || 'Not provided'}</dd></div><div><dt className="inline font-semibold">Duration: </dt><dd className="inline">{item.duration || 'Not provided'}</dd></div><div><dt className="inline font-semibold">Allowance: </dt><dd className="inline">{item.allowance || 'Not provided'}</dd></div><div><dt className="inline font-semibold">Deadline: </dt><dd className="inline">{item.deadline || 'Not provided'}</dd></div></dl></div><div><h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Skills and requirements</h4><p className="mt-2 text-sm text-slate-700"><span className="font-semibold">Skills:</span> {item.skills.length ? item.skills.join(', ') : 'Not provided'}</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">{(item.responsibilities.length ? item.responsibilities : ['No responsibilities provided.']).map((responsibility, index) => <li key={`${item.id}-responsibility-${index}`}>{responsibility}</li>)}</ul><p className="mt-3 text-sm text-slate-700"><span className="font-semibold">Requirements:</span> {item.requirements.length ? item.requirements.join(' · ') : 'Not provided'}</p>{item.applicationUrl && <a href={item.applicationUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-bold text-blue-700 hover:underline">Open application page</a>}</div></div>}</article>; })}</section>}

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
