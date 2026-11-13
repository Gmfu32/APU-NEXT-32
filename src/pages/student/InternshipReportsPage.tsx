import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Clock3, FileText, Info, LockKeyhole, MessageSquare, Send, ShieldCheck, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { API_CONFIG, apiRequest } from '../../services/apiClient';

type Phase = 'part1' | 'part2';
type Requirement = { id: string; title: string; description: string; template?: string };
type ReportFile = { id: string; requirementId: string; fileName: string; uploadedAt: string; status: string; reviewerComment: string };
type Report = { id: string; phase: Phase; status: string; note: string; reviewerComment: string; files: ReportFile[]; submittedAt?: string | null };

const part1: Requirement[] = [
  { id: 'part1-cover', title: 'Part 1 cover page', description: 'Use the official Part 1 cover template supplied by APU.', template: '1-01 Part 1 Cover.doc' },
  { id: 'cv', title: 'Approved CV', description: 'Upload the CV reviewed or approved by your academic mentor.', template: '1-3B CV Templete.pdf' },
  { id: 'cover-letter', title: 'Approved cover letter', description: 'Include the personalized cover letter used for your internship applications.', template: '1-3A Sample Cover Letter.docx' },
  { id: 'project-log', title: 'Project log sheet and email communication', description: 'Include your project log sheet and relevant mentor communication.' },
  { id: 'logbooks-1-8', title: 'Weekly logbooks · Weeks 1–8', description: 'Record activities, learning, skills, and supervisor verification.', template: '2-04 Internship Logbook.docx' },
];
const part2: Requirement[] = [
  { id: 'part2-cover', title: 'Part 2 cover page', description: 'Use the official Part 2 cover template supplied by APU.', template: '2-01 Part 2 Cover.doc' },
  { id: 'placement-report', title: 'Industrial placement report', description: 'Approximately 3,000 words covering the company, environment, department, work, skills, and reflection.', template: '2-02 Content Guidelines for Industrial Placement Report.pdf' },
  { id: 'clearance', title: 'Report clearance form', description: 'Obtain the industrial supervisor signature and company stamp.', template: '2-03 Internship Report Clearance Form.docx' },
  { id: 'logbooks-9-16', title: 'Weekly logbooks · Weeks 9–16', description: 'Submit at least eight weekly logbooks with supervisor verification.', template: '2-04 Internship Logbook.docx' },
  { id: 'attendance', title: 'Attendance record · 16 weeks', description: 'Include dates, times, hours served, and supervisor verification.', template: '2-05 Internship Attendance Record.docx' },
  { id: 'assessment', title: 'Company supervisor assessment', description: 'Include technical knowledge, teamwork, communication, productivity, and problem-solving feedback.', template: '2-06 Internship Company Supervisor Assessment Form.docx' },
  { id: 'mentor-visit', title: 'Academic mentor visit report', description: 'Record the site or virtual visit, performance discussion, and issues requiring attention.', template: '2-07 Internship Mentor Visit Report.docx' },
];
const requirements: Record<Phase, Requirement[]> = { part1, part2 };
const emptyReports: Record<Phase, Report | null> = { part1: null, part2: null };

export const InternshipReportsPage: React.FC = () => {
  const { studentProfile, showToast } = useApp();
  const [reports, setReports] = useState(emptyReports);
  const [phase, setPhase] = useState<Phase>('part1');
  const [expanded, setExpanded] = useState<Phase | null>('part1');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (API_CONFIG.useMockData) { setLoading(false); return; }
    void apiRequest<Report[]>('/internship-reports').then(({ data }) => {
      setReports({ part1: data.find(item => item.phase === 'part1') || null, part2: data.find(item => item.phase === 'part2') || null });
    }).catch(error => showToast(`Could not load internship reports: ${error instanceof Error ? error.message : 'API error'}`)).finally(() => setLoading(false));
  }, [showToast]);

  const currentReport = reports[phase];
  const allFiles = useMemo(() => Object.values(reports).flatMap(report => report?.files || []), [reports]);
  const totalRequired = part1.length + part2.length;
  const progress = Math.round((allFiles.length / totalRequired) * 100);
  const placementDates = studentProfile.internshipStartDate && studentProfile.internshipEndDate ? `${studentProfile.internshipStartDate} to ${studentProfile.internshipEndDate}` : 'Placement dates not set';
  const statusLabel = (current: Phase) => reports[current]?.status || 'Draft';

  const updateReport = (report: Report) => setReports(current => ({ ...current, [report.phase]: report }));
  const upload = async (item: Requirement, file: File | undefined) => {
    if (!file) return;
    const body = new FormData();
    body.append('phase', phase);
    body.append('requirement_id', item.id);
    body.append('file', file);
    try {
      const { data } = await apiRequest<Report>('/internship-reports/files', { method: 'POST', body });
      updateReport(data);
      showToast(`${item.title} uploaded securely`);
    } catch (error) { showToast(`Could not upload file: ${error instanceof Error ? error.message : 'Upload failed'}`); }
  };
  const submitFile = async (report: Report, file: ReportFile) => {
    const body = new FormData();
    body.append('note', note);
    try {
      const { data } = await apiRequest<Report>(`/internship-reports/${report.id}/files/${file.id}/submit`, { method: 'PUT', body });
      updateReport(data);
      showToast(`${file.fileName} submitted to the Career Centre`);
    } catch (error) { showToast(`Could not submit report: ${error instanceof Error ? error.message : 'Submission failed'}`); }
  };

  const renderRequirement = (item: Requirement) => {
    const uploaded = currentReport?.files.find(file => file.requirementId === item.id);
    return <article key={item.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">{uploaded ? <CheckCircle2 className="text-emerald-600" size={20} /> : <FileText size={20} />}</div>
      <div className="min-w-0 flex-1"><h3 className="font-bold text-slate-900">{item.title}</h3><p className="mt-1 text-sm leading-5 text-slate-600">{item.description}</p>{item.template && <p className="mt-2 text-xs text-slate-400">Template: {item.template}</p>}{uploaded && <p className="mt-2 truncate text-xs font-semibold text-emerald-700">{uploaded.fileName} · {uploaded.status}</p>}{uploaded?.reviewerComment && <p className="mt-1 text-xs text-amber-700">{uploaded.reviewerComment}</p>}</div>
      <div className="flex shrink-0 flex-wrap gap-2"><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Upload size={15} />{uploaded ? 'Replace file' : 'Upload file'}<input type="file" className="sr-only" accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg" onChange={event => void upload(item, event.target.files?.[0])} /></label>{uploaded && !['Submitted', 'Approved'].includes(uploaded.status) && <button type="button" onClick={() => currentReport && void submitFile(currentReport, uploaded)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"><Send size={14} />Submit</button>}</div>
    </article>;
  };

  return <div className="mx-auto max-w-6xl space-y-6 pb-10">
    <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0D1526] via-[#16336e] to-blue-700 p-6 text-white shadow-sm sm:p-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-200">Student workspace · Internship</p><h1 className="mt-2 text-3xl font-extrabold">Internship Reports</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100">Upload official APU evidence, submit each phase, and continue the conversation with the Career Centre from one secure workspace.</p><div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5"><CalendarDays size={14} />{placementDates}</span><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5"><Clock3 size={14} />Minimum placement: 16 continuous weeks</span></div></header>
    <section className="grid gap-4 sm:grid-cols-3"><article className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Overall readiness</p><p className="mt-2 text-3xl font-extrabold text-slate-900">{progress}%</p><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-xs text-slate-500">{allFiles.length} of {totalRequired} required items uploaded</p></article>{(['part1', 'part2'] as Phase[]).map(item => <article key={item} className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{item === 'part1' ? 'Part 1 status' : 'Part 2 status'}</p><p className="mt-2 text-lg font-extrabold text-slate-900">{statusLabel(item)}</p><p className="mt-1 text-xs text-slate-500">{reports[item]?.files.length || 0} of {requirements[item].length} items uploaded</p></article>)}</section>
    {loading && <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">Loading your secure report workspace...</p>}
    {(['part1', 'part2'] as Phase[]).map(item => <section key={item} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><button type="button" onClick={() => { setPhase(item); setExpanded(expanded === item ? null : item); }} className="flex w-full items-center justify-between gap-4 p-5 text-left"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">{item === 'part1' ? 'Preparation evidence · 50% logbooks' : 'Final placement evidence · 50% logbooks'}</p><h2 className="mt-1 text-lg font-extrabold text-slate-900">{item === 'part1' ? 'Part 1 · Preparation and Weeks 1–8' : 'Part 2 · Final report and Weeks 9–16'}</h2><p className="mt-1 text-sm text-slate-500">{item === 'part1' ? 'Submit each document individually as it becomes ready' : 'Submit each document individually as it becomes ready'}</p></div>{expanded === item ? <ChevronUp className="shrink-0 text-slate-400" /> : <ChevronDown className="shrink-0 text-slate-400" />}</button>{expanded === item && <div className="border-t border-slate-100 p-5"><div className="mb-4"><p className="text-sm font-semibold text-slate-600">{reports[item]?.files.length || 0} of {requirements[item].length} documents uploaded · each can be submitted separately</p></div><div className="space-y-3">{phase === item && requirements[item].map(renderRequirement)}</div>{item === 'part2' && <label className="mt-5 block text-sm font-semibold text-slate-700">Notes for Career Centre<textarea value={phase === item ? note : reports[item]?.note || ''} onChange={event => setNote(event.target.value)} rows={3} placeholder="Add context or confidentiality concerns..." className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm" /></label>}{reports[item]?.reviewerComment && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="flex items-center gap-2 text-sm font-bold text-amber-900"><MessageSquare size={16} /> Career Centre feedback</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-900">{reports[item]?.reviewerComment}</p></div>}</div>}</section>)}
    <section className="grid gap-4 md:grid-cols-3"><article className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><ShieldCheck size={18} className="text-blue-600" /><h2 className="font-bold text-slate-900">Confidentiality</h2></div><p className="mt-2 text-sm leading-6 text-slate-600">Remove confidential company information or obtain approval before including it.</p></article><article className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><LockKeyhole size={18} className="text-blue-600" /><h2 className="font-bold text-slate-900">Secure files</h2></div><p className="mt-2 text-sm leading-6 text-slate-600">Documents are stored under your account and are only available to you and Career Centre staff.</p></article><article className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><Info size={18} className="text-blue-600" /><h2 className="font-bold text-slate-900">Review statuses</h2></div><p className="mt-2 text-sm leading-6 text-slate-600">Draft, Submitted, Approved, or Changes Requested keep both sides aligned.</p></article></section>
  </div>;
};
