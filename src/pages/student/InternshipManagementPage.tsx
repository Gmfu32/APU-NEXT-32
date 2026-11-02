import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  Info,
  Plus,
  ShieldCheck,
  TrendingUp,
  Upload,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { INTERNSHIP_PLACEMENT_DETAILS } from '../../data/internshipAndAdmin';
import { CompanyLogo } from '../../components/common/CompanyLogo';
import { Modal } from '../../components/common/Modal';
import { DocumentStatus } from '../../types';

type StakeholderPerspective =
  | 'student'
  | 'company-manager'
  | 'university-supervisor'
  | 'career-admin';

interface InternshipManagementPageProps {
  subView: 'overview' | 'documents' | 'progress';
}

export const InternshipManagementPage: React.FC<InternshipManagementPageProps> = ({ subView }) => {
  const {
    internshipDocs,
    progressLogs,
    submitInternshipDoc,
    updateInternshipDocStatus,
    addProgressLogEntry,
    approveProgressLog,
    navigate,
  } = useApp();

  const [perspective, setPerspective] = useState<StakeholderPerspective>('student');
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [weekLabel, setWeekLabel] = useState('Week 4');
  const [dateRange, setDateRange] = useState('01 Feb – 05 Feb 2027 (Sample)');
  const [logSummary, setLogSummary] = useState('');
  const [logHours, setLogHours] = useState(40);
  const [logCompetencies, setLogCompetencies] = useState('FastAPI, Model Monitoring, Sprint Demo');

  const approvedCount = internshipDocs.filter(
    (d) => d.status === 'Approved' || d.status === 'Manager Attested'
  ).length;
  const progressPercent = Math.round((approvedCount / internshipDocs.length) * 100);

  const stages = [
    { step: 1, label: 'Offer & Confirmation', done: true },
    { step: 2, label: 'Onboarding & Logbook', done: true },
    { step: 3, label: 'Interim Report 1', active: true, done: false },
    { step: 4, label: 'Interim Report 2', done: false },
    { step: 5, label: 'Manager Evaluation & Attestation', done: false },
    { step: 6, label: 'Final Report & Credit Clearance', done: false },
  ];

  const handleSimulatedUpload = (docId: string, docTitle: string) => {
    const cleanName = `${docTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Demo.pdf`;
    submitInternshipDoc(docId, cleanName);
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logSummary.trim()) return;
    addProgressLogEntry({
      weekLabel,
      dateRange,
      summary: logSummary.trim(),
      hoursLogged: logHours,
      competencies: logCompetencies
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      supervisorSignOff: 'Pending Review',
    });
    setLogSummary('');
    setLogModalOpen(false);
  };

  const statusColor = (status: DocumentStatus) => {
    switch (status) {
      case 'Approved':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Manager Attested':
        return 'text-teal-700 bg-teal-50 border-teal-200';
      case 'Under Supervisor Review':
      case 'Submitted':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Revision Needed':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + 4-Stakeholder Perspective Switcher (Required by Section 21) */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {subView === 'overview'
              ? 'My Internship Placement'
              : subView === 'documents'
              ? 'Internship Documents & Reports'
              : 'Internship Progress Tracking'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            End-to-end industrial training administration, logbooks, interim reports, and simulated
            stakeholder attestations.
          </p>
        </div>

        {/* Stakeholder Sub-Role Demo Switcher */}
        <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex flex-wrap items-center gap-1 self-start">
          <span className="text-[11px] font-semibold text-slate-500 px-2">
            Stakeholder Demo View:
          </span>
          {(
            [
              { id: 'student', label: 'Student' },
              { id: 'company-manager', label: 'Company Manager' },
              { id: 'university-supervisor', label: 'Uni Supervisor' },
              { id: 'career-admin', label: 'Career Admin' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPerspective(item.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                perspective === item.id
                  ? 'bg-[#2563EB] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Simulated Approval & Non-Binding Attestation Notice */}
      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-2.5 text-xs text-slate-700">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <span>
          <strong>Simulated Approval & Attestation Mode:</strong> Currently viewing as{' '}
          <strong className="capitalize">{perspective.replace('-', ' ')}</strong>. All manager
          attestations and supervisor reviews are simulated frontend interactions—no legally binding
          electronic signatures are performed.
        </span>
      </div>

      {/* Internal Sub-Navigation Tabs synced with Sidebar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => navigate('my-internship')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
            subView === 'overview'
              ? 'bg-[#0D1526] text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Placement Overview</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('internship-documents')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
            subView === 'documents'
              ? 'bg-[#0D1526] text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Documents & Reports ({internshipDocs.length})</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('internship-progress')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
            subView === 'progress'
              ? 'bg-[#0D1526] text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Progress & Logbooks ({progressLogs.length})</span>
        </button>
      </div>

      {/* Visual 6-Stage Progress Tracker (Always Visible at Top of Internship Hub) */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Industrial Placement Milestone Tracker
            </h2>
            <p className="text-xs text-slate-500">
              {INTERNSHIP_PLACEMENT_DETAILS.startDate} – {INTERNSHIP_PLACEMENT_DETAILS.endDate} (
              {INTERNSHIP_PLACEMENT_DETAILS.durationWeeks} Weeks)
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums font-bold text-blue-600">
            {approvedCount}/{internshipDocs.length} Deliverables Approved/Attested ({progressPercent}%)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stages.map((st) => (
            <div
              key={st.step}
              className={`p-3 rounded-xl border text-xs ${
                st.done
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                  : st.active
                  ? 'bg-blue-50/70 border-blue-500 text-blue-950'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between font-mono tabular-nums text-[11px] font-bold mb-1">
                <span>Stage 0{st.step}</span>
                {st.done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <p className="font-semibold leading-snug">{st.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SUBVIEW 1: MY INTERNSHIP OVERVIEW */}
      {subView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-start gap-4 pb-5 border-b border-slate-100">
              <CompanyLogo
                logoKey={INTERNSHIP_PLACEMENT_DETAILS.logoKey}
                companyName={INTERNSHIP_PLACEMENT_DETAILS.company}
                size="lg"
              />
              <div>
                <p className="text-xs font-semibold text-emerald-700">
                  {INTERNSHIP_PLACEMENT_DETAILS.placementStatus}
                </p>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  {INTERNSHIP_PLACEMENT_DETAILS.jobTitle}
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  {INTERNSHIP_PLACEMENT_DETAILS.company}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {INTERNSHIP_PLACEMENT_DETAILS.department} · {INTERNSHIP_PLACEMENT_DETAILS.location}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Host Company Manager
                </p>
                <p className="font-semibold text-slate-800">
                  {INTERNSHIP_PLACEMENT_DETAILS.companyManager.name}
                </p>
                <p className="text-slate-600">{INTERNSHIP_PLACEMENT_DETAILS.companyManager.role}</p>
                <p className="text-slate-500">{INTERNSHIP_PLACEMENT_DETAILS.companyManager.email}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  University Academic Supervisor
                </p>
                <p className="font-semibold text-slate-800">
                  {INTERNSHIP_PLACEMENT_DETAILS.universitySupervisor.name}
                </p>
                <p className="text-slate-600">
                  {INTERNSHIP_PLACEMENT_DETAILS.universitySupervisor.role}
                </p>
                <p className="text-slate-500">
                  {INTERNSHIP_PLACEMENT_DETAILS.universitySupervisor.office}
                </p>
              </div>
            </div>

            {/* Perspective-Specific Action Card */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs space-y-1">
                <p className="font-bold text-sm">
                  {perspective === 'student' && 'Next Deliverable: Interim Internship Report 2'}
                  {perspective === 'company-manager' &&
                    'Company Manager Action: Review & Attest Student Evaluation'}
                  {perspective === 'university-supervisor' &&
                    'Academic Supervisor Action: Grade Interim Report 1'}
                  {perspective === 'career-admin' &&
                    'Career Centre Action: Audit Placement Compliance'}
                </p>
                <p className="text-slate-300">
                  Open Documents & Reports to upload files or simulate stakeholder status changes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('internship-documents')}
                className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-500 text-white text-xs font-semibold shrink-0 whitespace-nowrap"
              >
                Open Documents →
              </button>
            </div>
          </section>

          {/* Summary Deadlines Sidebar Card */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Upcoming Submission Deadlines</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {internshipDocs.slice(2, 8).map((doc) => (
                <div key={doc.id} className="py-2.5 first:pt-0 last:pb-0 flex justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">{doc.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{doc.status}</p>
                  </div>
                  <span className="font-mono tabular-nums text-slate-500 shrink-0">
                    {doc.deadline}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* SUBVIEW 2: DOCUMENTS & REPORTS */}
      {subView === 'documents' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Required Placement Deliverables & Attestations
              </h2>
              <p className="text-xs text-slate-500">
                Switch Stakeholder Demo View above to test Student Upload, Manager Attestation,
                Supervisor Review, and Admin Approval.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {internshipDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono tabular-nums font-bold text-slate-700">
                      0{doc.stageOrder}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{doc.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <Clock className="w-3 h-3" />
                      Due {doc.deadline}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{doc.title}</h3>

                  <p className="text-xs text-slate-600">{doc.reviewerNote}</p>

                  {doc.submittedFile && (
                    <p className="text-xs font-medium text-blue-700">
                      File: {doc.submittedFile} ({doc.submittedAt})
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-md border text-xs font-semibold ${statusColor(
                      doc.status
                    )}`}
                  >
                    {doc.status}
                  </span>

                  {/* Student Upload Action */}
                  {perspective === 'student' && (
                    <button
                      type="button"
                      onClick={() => handleSimulatedUpload(doc.id, doc.title)}
                      className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{doc.submittedFile ? 'Re-upload (Demo)' : 'Submit Demo PDF'}</span>
                    </button>
                  )}

                  {/* Company Manager Simulated Attestation */}
                  {perspective === 'company-manager' && doc.requiresManagerAttestation && (
                    <button
                      type="button"
                      onClick={() =>
                        updateInternshipDocStatus(
                          doc.id,
                          'Manager Attested',
                          'Simulated Host Manager attestation recorded by Ir. Hafizuddin Omar.'
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      <span>Attest (Simulated)</span>
                    </button>
                  )}

                  {/* University Supervisor / Career Admin Review Controls */}
                  {(perspective === 'university-supervisor' || perspective === 'career-admin') && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          updateInternshipDocStatus(
                            doc.id,
                            'Approved',
                            `Approved in simulated ${perspective.replace('-', ' ')} review.`
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateInternshipDocStatus(
                            doc.id,
                            'Revision Needed',
                            'Please expand architectural reflection section and resubmit.'
                          )
                        }
                        className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold"
                      >
                        Request Revision
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBVIEW 3: PROGRESS TRACKING & WEEKLY LOGBOOKS */}
      {subView === 'progress' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Weekly Industrial Training Logbook Entries
            </h2>
            <button
              type="button"
              onClick={() => setLogModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Weekly Progress</span>
            </button>
          </div>

          <div className="space-y-3">
            {progressLogs.map((log) => (
              <article
                key={log.id}
                className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-bold text-slate-900">{log.weekLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{log.dateRange}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{log.hoursLogged} hrs</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{log.summary}</p>
                  <p className="text-xs text-slate-500">
                    Competencies: {log.competencies.join(' · ')}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs font-semibold ${
                      log.supervisorSignOff.includes('Signed')
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {log.supervisorSignOff}
                  </span>
                  {perspective !== 'student' && log.supervisorSignOff === 'Pending Review' && (
                    <button
                      type="button"
                      onClick={() => approveProgressLog(log.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                    >
                      Sign Off (Demo)
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        title="Add Weekly Progress Entry"
        subtitle="Record tasks completed, engineering hours, and competencies practised."
      >
        <form onSubmit={handleAddLog} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Week Label</label>
              <input
                type="text"
                required
                value={weekLabel}
                onChange={(e) => setWeekLabel(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hours Logged</label>
              <input
                type="number"
                min={1}
                max={60}
                value={logHours}
                onChange={(e) => setLogHours(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono tabular-nums"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date Range</label>
            <input
              type="text"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Completed & Reflections *
            </label>
            <textarea
              rows={3}
              required
              value={logSummary}
              onChange={(e) => setLogSummary(e.target.value)}
              placeholder="Summarise technical deliverables, meetings, and lessons learned..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Competencies Practised (comma separated)
            </label>
            <input
              type="text"
              value={logCompetencies}
              onChange={(e) => setLogCompetencies(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setLogModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
            >
              Save Log Entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
