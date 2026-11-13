import React, { useEffect, useState } from 'react';
import { ArrowLeft, BriefcaseBusiness, Building2, Download, ExternalLink, GraduationCap, LoaderCircle, UserRound } from 'lucide-react';
import { API_CONFIG, apiRequest } from '../../services/apiClient';
import { Opportunity, StudentProfile } from '../../types';

type DetailKind = 'student' | 'company' | 'vacancy';
type StudentDetail = {
  account: { id: string; name: string; email: string; createdAt: string; status: string };
  profile: StudentProfile;
  resume: { fileName: string | null; uploadedAt: string | null; available: boolean };
  applications: Array<{ id: string; opportunityId: string; title: string; company: string; status: string; appliedAt: string; resumeShared: boolean }>;
  reports: Array<{ id: string; phase: string; status: string; updatedAt: string; files: Array<{ id: string; fileName: string; status: string; reviewerComment: string }> }>;
};
type CompanyDetail = {
  id: string; companyName: string; email: string; profile: { companyName?: string; employerCount?: number; location?: string; website?: string; description?: string; industry?: string };
  approvalStatus: string; createdAt: string; approvalReviewedAt: string | null; reviewNotes: string | null;
  listings: Array<{ opportunity: Opportunity; status: string; submittedAt: string }>;
};
type VacancyDetail = {
  opportunity: Opportunity; status: string; submittedAt: string;
  company: { id: string; name: string; email: string; profile: CompanyDetail['profile']; approvalStatus: string } | null;
  applicationCount: number; approvalHistory: Array<{ action: string; actor: string; createdAt: string }>;
  applicants: Array<{ applicationId: string; studentId: string; name: string; status: string; appliedAt: string; resumeShared: boolean }>;
};

interface AdminRecordDetailProps {
  kind: DetailKind;
  recordId: string;
  onBack: () => void;
  onOpenCompany?: (id: string) => void;
  onOpenVacancy?: (id: string) => void;
  onOpenStudent?: (id: string) => void;
}

const dateLabel = (value: string | null | undefined) => value ? new Date(value).toLocaleString() : 'Not available';

export const AdminRecordDetail: React.FC<AdminRecordDetailProps> = ({ kind, recordId, onBack, onOpenCompany, onOpenVacancy, onOpenStudent }) => {
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [vacancy, setVacancy] = useState<VacancyDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const request = kind === 'student'
      ? apiRequest<StudentDetail>(`/admin/students/${encodeURIComponent(recordId)}`)
      : kind === 'company'
        ? apiRequest<CompanyDetail>(`/admin/employers/${encodeURIComponent(recordId)}`)
        : apiRequest<VacancyDetail>(`/admin/opportunities/${encodeURIComponent(recordId)}`);
    void request.then(({ data }) => {
      if (!active) return;
      if (kind === 'student') setStudent(data as StudentDetail);
      else if (kind === 'company') setCompany(data as CompanyDetail);
      else setVacancy(data as VacancyDetail);
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : 'Could not load this record.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [kind, recordId]);

  const openStudentCv = async () => {
    try {
      const token = localStorage.getItem('apu_next_access_token');
      const response = await fetch(`${API_CONFIG.baseUrl}/students/${encodeURIComponent(recordId)}/cv`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!response.ok) throw new Error(response.status === 404 ? 'This student has not uploaded a CV.' : `CV could not be opened (${response.status}).`);
      const url = URL.createObjectURL(await response.blob());
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not open the CV.');
    }
  };

  const openReportFile = async (reportId: string, fileId: string) => {
    try {
      const token = localStorage.getItem('apu_next_access_token');
      const response = await fetch(`${API_CONFIG.baseUrl}/internship-reports/${encodeURIComponent(reportId)}/files/${encodeURIComponent(fileId)}`, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      if (!response.ok) throw new Error(`Report document could not be opened (${response.status}).`);
      const url = URL.createObjectURL(await response.blob());
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Report document could not be opened.');
    }
  };

  if (loading) return <section className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-10 text-center"><LoaderCircle className="mx-auto animate-spin text-blue-600" /><p className="mt-3 text-sm text-slate-600">Loading record details…</p></section>;
  if (error && !student && !company && !vacancy) return <section className="mx-auto max-w-5xl space-y-4 rounded-2xl border border-red-200 bg-white p-6"><button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-blue-700"><ArrowLeft size={16} /> Back</button><p role="alert" className="text-sm text-red-700">{error}</p></section>;

  if (kind === 'student' && student) {
    const profile = student.profile;
    return <main className="mx-auto max-w-5xl space-y-5">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900"><ArrowLeft size={16} /> Back to Career Centre</button>
      <header className="rounded-2xl bg-gradient-to-br from-[#0D1526] to-blue-700 p-6 text-white"><p className="text-xs font-bold uppercase tracking-wider text-blue-200">Student profile</p><h1 className="mt-2 text-2xl font-extrabold">{student.account.name}</h1><p className="mt-1 text-sm text-blue-100">{profile.degree || 'Programme not provided'}{profile.major ? ` · ${profile.major}` : ''}</p></header>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 font-bold"><UserRound size={17} /> Personal &amp; academic information</h2><dl className="mt-4 space-y-2 text-sm">{[['Email', student.account.email], ['Student ID', profile.studentId], ['Account status', student.account.status], ['Registered', dateLabel(student.account.createdAt)], ['University', 'Asia Pacific University'], ['Programme', profile.degree], ['Major / school', profile.major], ['Year of study', profile.yearOfStudy], ['Graduation', profile.graduationStatus]].map(([label, value]) => value ? <div key={label} className="flex justify-between gap-3"><dt className="text-slate-500">{label}</dt><dd className="text-right font-medium text-slate-800">{value}</dd></div> : null)}</dl></section>
        <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 font-bold"><GraduationCap size={17} /> Internship &amp; professional profile</h2><dl className="mt-4 space-y-2 text-sm">{[['Availability', profile.internshipAvailability], ['Placement starts', profile.internshipStartDate], ['Placement ends', profile.internshipEndDate], ['Interests', profile.careerInterests?.join(', ')], ['Preferred fields', profile.preferredIndustries?.join(', ')], ['Skills', profile.skills?.join(', ')], ['Languages', profile.languages?.join(', ')], ['Summary', profile.bio]].map(([label, value]) => value ? <div key={label}><dt className="text-slate-500">{label}</dt><dd className="mt-0.5 whitespace-pre-wrap text-slate-800">{value}</dd></div> : null)}</dl>{(profile.workExperience || []).length > 0 && <div className="mt-4"><h3 className="text-sm font-bold">Experience</h3>{(profile.workExperience || []).map(item => <article key={item.id} className="mt-2 rounded-lg bg-slate-50 p-3 text-sm"><p className="font-semibold">{item.role}{item.organization ? ` · ${item.organization}` : ''}</p>{item.period && <p className="text-xs text-slate-500">{item.period}</p>}{item.summary && <p className="mt-1 text-slate-700">{item.summary}</p>}</article>)}</div>}{(profile.projects || []).length > 0 && <div className="mt-4"><h3 className="text-sm font-bold">Projects</h3>{(profile.projects || []).map(item => <article key={item.id} className="mt-2 rounded-lg bg-slate-50 p-3 text-sm"><p className="font-semibold">{item.title}</p><p className="text-slate-600">{item.summary}</p></article>)}</div>}{(profile.certifications || []).length > 0 && <div className="mt-4"><h3 className="text-sm font-bold">Certifications</h3><p className="mt-1 text-sm text-slate-700">{(profile.certifications || []).map(item => item.name).join(', ')}</p></div>}</section>
      </div>
      <section className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Resume / CV</h2><p className="mt-1 text-sm text-slate-600">{student.resume.fileName || 'No CV uploaded'}{student.resume.uploadedAt ? ` · uploaded ${dateLabel(student.resume.uploadedAt)}` : ''}</p></div>{student.resume.available && <button onClick={() => void openStudentCv()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white"><Download size={15} /> View / download CV</button>}</div></section>
      <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Applications</h2>{student.applications.length ? <div className="mt-3 space-y-2">{student.applications.map(item => <article key={item.id} className="rounded-lg bg-slate-50 p-3"><div className="flex flex-wrap justify-between gap-2"><button onClick={() => onOpenVacancy?.(item.opportunityId)} className="text-left font-semibold text-blue-700 hover:underline">{item.title} · {item.company}</button><span className="text-xs font-bold text-slate-600">{item.status}</span></div><p className="mt-1 text-xs text-slate-500">Applied {dateLabel(item.appliedAt)} · CV shared: {item.resumeShared ? 'Yes' : 'No'}</p></article>)}</div> : <p className="mt-2 text-sm text-slate-500">No applications recorded.</p>}</section>
      <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Internship reports</h2>{student.reports.length ? <div className="mt-3 space-y-3">{student.reports.map(report => <article key={report.id} className="rounded-lg bg-slate-50 p-3"><div className="flex justify-between gap-3"><p className="font-semibold">{report.phase === 'part1' ? 'Part 1' : 'Part 2'} · {report.status}</p><time className="text-xs text-slate-500">{dateLabel(report.updatedAt)}</time></div>{report.files.map(file => <div key={file.id} className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700"><span>{file.fileName} · {file.status}{file.reviewerComment ? ` · ${file.reviewerComment}` : ''}</span><button type="button" onClick={() => void openReportFile(report.id, file.id)} className="font-bold text-blue-700 hover:underline">View document</button></div>)}</article>)}</div> : <p className="mt-2 text-sm text-slate-500">No internship reports recorded.</p>}</section>
    </main>;
  }

  if (kind === 'company' && company) return <main className="mx-auto max-w-5xl space-y-5">
    <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900"><ArrowLeft size={16} /> Back to Career Centre</button>
    <header className="rounded-2xl bg-gradient-to-br from-[#0D1526] to-blue-700 p-6 text-white"><p className="text-xs font-bold uppercase tracking-wider text-blue-200">Company profile</p><h1 className="mt-2 text-2xl font-extrabold">{company.companyName}</h1><p className="mt-1 text-sm text-blue-100">{company.profile.industry || 'Industry not provided'} · {company.profile.location || 'Location not provided'}</p></header>
    <div className="grid gap-4 md:grid-cols-2"><section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 font-bold"><Building2 size={17} /> Company information</h2><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-slate-500">Description</dt><dd className="mt-1 whitespace-pre-wrap text-slate-800">{company.profile.description || 'Not provided'}</dd></div><div><dt className="text-slate-500">Website</dt><dd>{company.profile.website ? <a href={company.profile.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-700">{company.profile.website}<ExternalLink size={13} /></a> : 'Not provided'}</dd></div><div><dt className="text-slate-500">Company size</dt><dd className="text-slate-800">{company.profile.employerCount ?? 'Not provided'}</dd></div></dl></section><section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Registration &amp; verification</h2><dl className="mt-4 space-y-2 text-sm">{[['Business email', company.email], ['Account created', dateLabel(company.createdAt)], ['Access approval', company.approvalStatus], ['Review date', dateLabel(company.approvalReviewedAt)], ['Review notes', company.reviewNotes || 'No review notes stored']].map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd className="text-slate-800">{value}</dd></div>)}</dl></section></div>
    <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Company vacancies</h2>{company.listings.length ? <div className="mt-3 space-y-2">{company.listings.map(item => <button key={item.opportunity.id} onClick={() => onOpenVacancy?.(item.opportunity.id)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 text-left hover:border-blue-300 hover:bg-blue-50"><span><span className="block font-semibold text-slate-900">{item.opportunity.title}</span><span className="text-xs text-slate-500">{item.opportunity.location} · submitted {dateLabel(item.submittedAt)}</span></span><span className="text-xs font-bold text-slate-600">{item.status}</span></button>)}</div> : <p className="mt-2 text-sm text-slate-500">No vacancies submitted by this company.</p>}</section>
  </main>;

  if (kind === 'vacancy' && vacancy) return <main className="mx-auto max-w-5xl space-y-5">
    <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900"><ArrowLeft size={16} /> Back to Career Centre</button>
    <header className="rounded-2xl bg-gradient-to-br from-[#0D1526] to-blue-700 p-6 text-white"><p className="text-xs font-bold uppercase tracking-wider text-blue-200">Internship vacancy</p><h1 className="mt-2 text-2xl font-extrabold">{vacancy.opportunity.title}</h1><button onClick={() => vacancy.company && onOpenCompany?.(vacancy.company.id)} className="mt-1 text-sm text-blue-100 hover:underline">{vacancy.opportunity.company}</button></header>
    <div className="grid gap-4 md:grid-cols-2"><section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 font-bold"><BriefcaseBusiness size={17} /> Vacancy details</h2><dl className="mt-4 space-y-2 text-sm">{[['Status', vacancy.status], ['Location', vacancy.opportunity.location], ['Work arrangement', vacancy.opportunity.workMode], ['Category', vacancy.opportunity.industry], ['Start', vacancy.opportunity.internshipStartDate], ['End', vacancy.opportunity.internshipEndDate], ['Duration', vacancy.opportunity.duration], ['Deadline', vacancy.opportunity.deadline], ['Allowance', vacancy.opportunity.allowance], ['Programmes', vacancy.opportunity.degreeTarget], ['Skills', vacancy.opportunity.skills.join(', ')], ['Submitted', dateLabel(vacancy.submittedAt)], ['Applicants', String(vacancy.applicationCount)]].map(([label, value]) => value ? <div key={label} className="flex justify-between gap-3"><dt className="text-slate-500">{label}</dt><dd className="text-right font-medium text-slate-800">{value}</dd></div> : null)}</dl></section><section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Company</h2>{vacancy.company ? <><button onClick={() => onOpenCompany?.(vacancy.company!.id)} className="mt-2 font-semibold text-blue-700 hover:underline">{vacancy.company.name}</button><p className="mt-1 text-sm text-slate-600">{vacancy.company.email} · {vacancy.company.approvalStatus}</p><p className="mt-3 text-sm text-slate-700">{vacancy.company.profile.description || 'No description available.'}</p></> : <p className="mt-2 text-sm text-slate-500">Career Centre listing; no employer account linked.</p>}<h3 className="mt-5 font-bold">Required skills</h3><p className="mt-1 text-sm text-slate-700">{vacancy.opportunity.skills.join(', ') || 'Not specified'}</p></section></div>
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-bold">Role description</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{vacancy.opportunity.summary || 'No description provided.'}</p>
      {vacancy.opportunity.responsibilities.length > 0 && <><h3 className="mt-4 font-semibold">Responsibilities</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">{vacancy.opportunity.responsibilities.map(item => <li key={item}>{item}</li>)}</ul></>}
      {vacancy.opportunity.requirements.length > 0 && <><h3 className="mt-4 font-semibold">Requirements</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">{vacancy.opportunity.requirements.map(item => <li key={item}>{item}</li>)}</ul></>}
    </section>
    <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Applicants ({vacancy.applicants.length})</h2>{vacancy.applicants.length ? <div className="mt-3 space-y-2">{vacancy.applicants.map(item => <article key={item.applicationId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3"><button onClick={() => onOpenStudent?.(item.studentId)} className="text-left font-semibold text-blue-700 hover:underline">{item.name}</button><span className="text-xs text-slate-600">{item.status} · {dateLabel(item.appliedAt)} · CV shared: {item.resumeShared ? 'Yes' : 'No'}</span></article>)}</div> : <p className="mt-2 text-sm text-slate-500">No applications recorded.</p>}</section>
    <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Approval history</h2>{vacancy.approvalHistory.length ? vacancy.approvalHistory.map((item, index) => <p key={`${item.action}-${index}`} className="mt-2 text-sm text-slate-600">{item.action} · {dateLabel(item.createdAt)}</p>) : <p className="mt-2 text-sm text-slate-500">No review history is available.</p>}</section>
  </main>;

  return <section className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-8 text-center"><button onClick={onBack} className="mx-auto inline-flex items-center gap-2 text-sm font-bold text-blue-700"><ArrowLeft size={16} /> Back</button><p className="mt-3 text-sm text-slate-500">This record is unavailable.</p></section>;
};
