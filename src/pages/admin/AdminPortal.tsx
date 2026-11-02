import React, { useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Plus,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdminPageId } from '../../types';
import { CAREER_FAIR_BOOTHS, STUDENT_BENEFITS } from '../../data/careerFairAndBenefits';
import { CAREER_RESOURCES } from '../../data/mentorsAndWorkshops';
import { INTERNSHIP_PLACEMENT_DETAILS } from '../../data/internshipAndAdmin';

interface AdminPortalProps {
  page: AdminPageId;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ page }) => {
  const {
    adminCompanies,
    updateAdminCompanyStatus,
    opportunities,
    moderateOpportunityListing,
    alumniList,
    verifyAlumniMember,
    workshops,
    createOrApproveWorkshop,
    internshipDocs,
    updateInternshipDocStatus,
    studentProfile,
    navigate,
    showToast,
  } = useApp();

  const [studentQuery, setStudentQuery] = useState('');
  const [wsTitle, setWsTitle] = useState('');
  const [wsSpeaker, setWsSpeaker] = useState('Career Centre Guest Speaker (Demo)');
  const [wsDate, setWsDate] = useState('27 Nov 2026');

  const pendingCompanies = adminCompanies.filter((c) => c.status === 'Pending Verification');
  const pendingOpps = opportunities.filter((o) => o.approvalStatus === 'Pending Review');
  const pendingDocs = internshipDocs.filter(
    (d) => d.status === 'Submitted' || d.status === 'Under Supervisor Review'
  );

  const sampleStudents = [
    {
      id: studentProfile.studentId,
      name: studentProfile.name,
      programme: `${studentProfile.degree} (${studentProfile.major})`,
      year: 'Year 3',
      cgpa: studentProfile.cgpa,
      readiness: 82,
      placement: 'Placed · PETRONAS Digital (Demo)',
    },
    {
      id: 'TP069104',
      name: 'Nurul Izzah Binti Kamal (Demo)',
      programme: 'BSc (Hons) Software Engineering',
      year: 'Year 3',
      cgpa: '3.84',
      readiness: 88,
      placement: 'Interviewing · 2 Shortlists',
    },
    {
      id: 'TP067882',
      name: 'Kavin Raj Subramaniam (Demo)',
      programme: 'BSc (Hons) CS (Intelligent Systems)',
      year: 'Year 3',
      cgpa: '3.66',
      readiness: 79,
      placement: 'Actively Applying',
    },
    {
      id: 'TP070215',
      name: 'Liam Chen Wei (Demo)',
      programme: 'BSc (Hons) CS (Cyber Security)',
      year: 'Year 3',
      cgpa: '3.59',
      readiness: 75,
      placement: 'Actively Applying',
    },
    {
      id: 'TP071090',
      name: 'Eshwari Krishnan (Demo)',
      programme: 'BA (Hons) Accounting & Finance (FinTech)',
      year: 'Year 3',
      cgpa: '3.72',
      readiness: 84,
      placement: 'Placed · Maybank Group (Demo)',
    },
  ];

  // 1. ADMIN DASHBOARD
  if (page === 'adm-dashboard') {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold text-blue-600">
            Career Centre Administrator Governance Console (Demo)
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            University Career Ecosystem Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor employer verifications, internship approvals, student placement progress, and
            campus events.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Pending Company Approvals',
              value: pendingCompanies.length,
              sub: 'Employer verification queue',
              target: 'adm-company-approvals' as AdminPageId,
            },
            {
              label: 'Active Opportunity Listings',
              value: opportunities.length,
              sub: `${pendingOpps.length} awaiting moderation`,
              target: 'adm-opportunity-approvals' as AdminPageId,
            },
            {
              label: 'Pending Document Reviews',
              value: pendingDocs.length,
              sub: 'Offer letters & interim reports',
              target: 'adm-documents' as AdminPageId,
            },
            {
              label: 'Cohort Placement Rate (Demo)',
              value: '84.6%',
              sub: 'Year 3 Industrial Training',
              target: 'adm-analytics' as AdminPageId,
            },
          ].map((kpi) => (
            <button
              key={kpi.label}
              type="button"
              onClick={() => navigate(kpi.target)}
              className="bg-white hover:border-blue-400 rounded-xl border border-slate-200 p-5 text-left transition-colors"
            >
              <p className="text-xs text-slate-500">{kpi.label}</p>
              <p className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-1">
                {kpi.value}
              </p>
              <p className="text-[11px] text-blue-600 font-medium mt-1">{kpi.sub} →</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Company Verification Preview */}
          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Employer Verification Queue</h2>
              <button
                type="button"
                onClick={() => navigate('adm-company-approvals')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Open Queue →
              </button>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {adminCompanies.map((co) => (
                <div
                  key={co.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-bold text-slate-900">{co.companyName}</p>
                    <p className="text-slate-500">
                      {co.industry} · {co.registrationNo}
                    </p>
                  </div>
                  <span
                    className={`font-semibold ${
                      co.status === 'Verified'
                        ? 'text-emerald-700'
                        : co.status === 'Pending Verification'
                        ? 'text-amber-700'
                        : 'text-red-700'
                    }`}
                  >
                    {co.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Platform Governance Activity */}
          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Recent Ecosystem Activity</h2>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <p className="font-bold text-slate-900">
                  APU Career Fair 2026 Booth Map Confirmed
                </p>
                <p className="text-slate-500 mt-0.5">
                  10 demonstration employers assigned across Central Atrium & Spine Level 3.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <p className="font-bold text-slate-900">
                  Interim Report 1 Submitted — {studentProfile.name}
                </p>
                <p className="text-slate-500 mt-0.5">
                  Assigned academic supervisor: Dr. Amirul Haziq (Demo).
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <p className="font-bold text-slate-900">
                  Alumni Verification Queue: 1 Profile Awaiting Check
                </p>
                <p className="text-slate-500 mt-0.5">
                  Faris Danial (Class of 2023 · Data Analytics) pending admin review.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // 2. COMPANY APPROVALS
  if (page === 'adm-company-approvals') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Company Approvals & Profile Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Verify employer SSM registration records before enabling campus job postings.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {adminCompanies.map((co) => (
            <div
              key={co.id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1 text-xs">
                <p className="text-sm font-bold text-slate-900">{co.companyName}</p>
                <p className="text-slate-600">
                  {co.industry} · Reg No: <span className="font-mono">{co.registrationNo}</span>
                </p>
                <p className="text-slate-500">
                  Contact: {co.contactPerson} ({co.contactEmail}) · Submitted {co.submittedDate}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-slate-700 mr-2">{co.status}</span>
                <button
                  type="button"
                  onClick={() => updateAdminCompanyStatus(co.id, 'Verified')}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Verify Company
                </button>
                <button
                  type="button"
                  onClick={() => updateAdminCompanyStatus(co.id, 'Changes Requested')}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                >
                  Request Clarification
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. OPPORTUNITY APPROVALS
  if (page === 'adm-opportunity-approvals') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Opportunity Listing Moderation</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review internship durations, learning outcomes, and allowance transparency before
            publishing to students.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {opportunities.slice(0, 8).map((opp) => (
            <div
              key={opp.id}
              className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1 text-xs max-w-2xl">
                <p className="text-sm font-bold text-slate-900">
                  {opp.title} — {opp.company}
                </p>
                <p className="text-slate-600">
                  {opp.roleType} · {opp.duration} · {opp.allowance} · {opp.location}
                </p>
                <p className="text-slate-500 line-clamp-1">{opp.summary}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                    opp.approvalStatus === 'Changes Requested'
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : opp.approvalStatus === 'Pending Review'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  {opp.approvalStatus || 'Approved'}
                </span>
                <button
                  type="button"
                  onClick={() => moderateOpportunityListing(opp.id, 'Approved')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => moderateOpportunityListing(opp.id, 'Changes Requested')}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Flag
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. STUDENT DIRECTORY
  if (page === 'adm-student-directory') {
    const filteredStudents = sampleStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(studentQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(studentQuery.toLowerCase()) ||
        s.programme.toLowerCase().includes(studentQuery.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Directory</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search undergraduate career readiness and industrial placement status across schools.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              placeholder="Search student name, TP number, or degree..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 bg-slate-50">
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Programme</th>
                <th className="py-3 px-4 text-right">CGPA</th>
                <th className="py-3 px-4 text-right">Readiness</th>
                <th className="py-3 px-4">Placement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.map((stu) => (
                <tr key={stu.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-slate-700">
                    {stu.id}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{stu.name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{stu.programme}</td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums">{stu.cgpa}</td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-blue-600">
                    {stu.readiness}%
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{stu.placement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 5. ALUMNI VERIFICATION
  if (page === 'adm-alumni-verification') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alumni Verification Queue</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Confirm graduation cohorts before enabling alumni mentoring and referral badges.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {alumniList.map((alm) => (
            <div
              key={alm.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
            >
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {alm.name} · Class of {alm.graduationYear}
                </p>
                <p className="text-slate-600">
                  {alm.degree} → {alm.jobTitle} at {alm.company}
                </p>
                <p className="text-amber-700 font-medium mt-0.5">{alm.verificationLabel}</p>
              </div>
              <div>
                {alm.verificationLabel.includes('Pending') ? (
                  <button
                    type="button"
                    onClick={() => verifyAlumniMember(alm.id)}
                    className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold"
                  >
                    Verify Graduation Record (Demo)
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Verified Demo Record
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 6. CAREER FAIR MANAGEMENT
  if (page === 'adm-career-fair') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Career Fair Management</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              APU Career Fair 2026 (20 Nov 2026) — Exhibitor booth allocations & capacity.
            </p>
          </div>
          <button
            type="button"
            onClick={() => showToast('Exported booth floorplan CSV (Demo)')}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold"
          >
            Export Exhibitor List
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-500">
                <th className="py-3 px-4">Booth</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Campus Zone</th>
                <th className="py-3 px-4 text-right">Open Roles</th>
                <th className="py-3 px-4">Talk Slot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CAREER_FAIR_BOOTHS.map((b) => (
                <tr key={b.id}>
                  <td className="py-3 px-4 font-mono tabular-nums font-bold text-blue-600">
                    {b.boothNumber}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{b.company}</td>
                  <td className="py-3 px-4 text-slate-600">{b.zone}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    {b.openRolesCount}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{b.talkSlot || 'Booth Only'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 7. WORKSHOP MANAGEMENT
  if (page === 'adm-workshops') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workshop & Event Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Publish new career development sessions or approve alumni/employer masterclasses.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!wsTitle.trim()) return;
            createOrApproveWorkshop({
              id: `ws-${Date.now()}`,
              title: `${wsTitle.trim()} (Demo)`,
              category: 'Career Development',
              speakerName: wsSpeaker,
              speakerRole: 'Career Centre Hosted Session',
              speakerAvatarSeed: 'CC',
              date: wsDate,
              time: '3:00 PM – 4:30 PM',
              duration: '90 mins',
              format: 'Online Live',
              summary: 'Newly published Career Centre workshop session.',
              agenda: ['Core career readiness briefing', 'Live student Q&A'],
              capacity: 150,
              registeredCount: 1,
              themeColor: 'from-blue-900 via-indigo-900 to-slate-900',
              approvalStatus: 'Approved',
            });
            setWsTitle('');
          }}
          className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col md:flex-row gap-3 items-end"
        >
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Workshop Title
            </label>
            <input
              type="text"
              required
              value={wsTitle}
              onChange={(e) => setWsTitle(e.target.value)}
              placeholder="e.g. Industrial Placement Briefing — Jan 2027 Cohort"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
          </div>
          <div className="w-full md:w-56">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Speaker</label>
            <input
              type="text"
              value={wsSpeaker}
              onChange={(e) => setWsSpeaker(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
          </div>
          <div className="w-full md:w-36">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
            <input
              type="text"
              value={wsDate}
              onChange={(e) => setWsDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish</span>
          </button>
        </form>

        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {workshops.map((w) => (
            <div
              key={w.id}
              className="p-4 flex items-center justify-between gap-4 text-xs"
            >
              <div>
                <p className="font-bold text-slate-900 text-sm">{w.title}</p>
                <p className="text-slate-500">
                  {w.category} · {w.speakerName} · {w.date}
                </p>
              </div>
              <span className="font-mono tabular-nums text-slate-600 shrink-0">
                {w.registeredCount}/{w.capacity} registered
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 8. INTERNSHIP MONITORING
  if (page === 'adm-internship-monitoring') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Internship Monitoring</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track active student placements, assigned university supervisors, and milestone health.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <ClipboardCheck className="w-4 h-4 text-blue-600" />
            <span>Active Industrial Placements (Sample Cohort)</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {studentProfile.name} ({studentProfile.studentId})
                </p>
                <p className="text-slate-600">
                  {INTERNSHIP_PLACEMENT_DETAILS.jobTitle} · {INTERNSHIP_PLACEMENT_DETAILS.company}
                </p>
                <p className="text-slate-500">
                  Academic Supervisor: {INTERNSHIP_PLACEMENT_DETAILS.universitySupervisor.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('adm-documents')}
                className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] text-white font-semibold self-start sm:self-center"
              >
                Review Deliverables →
              </button>
            </div>

            <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">Eshwari Krishnan (TP071090 · Demo)</p>
                <p className="text-slate-600">FinTech Analytics Trainee · Maybank Group (Demo)</p>
                <p className="text-slate-500">Academic Supervisor: Ms. Cheryl Tan (Demo)</p>
              </div>
              <span className="text-emerald-700 font-semibold">On Track · Stage 3/6</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 9. DOCUMENTS & REPORTS REVIEW
  if (page === 'adm-documents') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Pending Placement Documents & Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Approve or request revisions on student offer letters, confirmations, and reports.
            Changes sync immediately with the Student Internship view!
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {internshipDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
            >
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {doc.title} — {studentProfile.name}
                </p>
                <p className="text-slate-500 mt-0.5">
                  Deadline: {doc.deadline} · File: {doc.submittedFile || 'Not uploaded yet'}
                </p>
                <p className="text-slate-600 mt-1">Current Status: {doc.status}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    updateInternshipDocStatus(
                      doc.id,
                      'Approved',
                      'Verified and approved by Career Centre Administrator (Demo).'
                    )
                  }
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold inline-flex items-center gap-1"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateInternshipDocStatus(
                      doc.id,
                      'Revision Needed',
                      'Career Centre requested updated signature/date alignment.'
                    )
                  }
                  className="px-3.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 font-semibold"
                >
                  Request Revision
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 10. ANALYTICS
  if (page === 'adm-analytics') {
    const schoolRates = [
      { school: 'School of Computing & AI', rate: 89, placed: 412 },
      { school: 'Cybersecurity & Cloud Programmes', rate: 87, placed: 238 },
      { school: 'School of Engineering', rate: 83, placed: 194 },
      { school: 'School of Business, Accounting & FinTech', rate: 81, placed: 310 },
    ];

    const industrySplit = [
      { sector: 'Technology, Cloud & Superapps', share: 38 },
      { sector: 'Banking, FinTech & Financial Services', share: 24 },
      { sector: 'Consulting, Cyber & Risk Advisory', share: 19 },
      { sector: 'Energy, Semiconductors & Telecoms', share: 19 },
    ];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Platform & Employability Analytics (Sample Metrics)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Demonstration cohort metrics across industrial placement conversion, hiring sectors, and
            workshop attendance.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Industrial Placement Rate by Academic Cluster (Demo)
              </h2>
            </div>
            <div className="space-y-4 text-xs">
              {schoolRates.map((row) => (
                <div key={row.school} className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-800">{row.school}</span>
                    <span className="font-mono tabular-nums font-bold text-slate-900">
                      {row.rate}% ({row.placed} students)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-[#2563EB] rounded-full"
                      style={{ width: `${row.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Top Host Placement Industries (2026 Demo Cohort)
            </h2>
            <div className="space-y-4 text-xs">
              {industrySplit.map((sec) => (
                <div key={sec.sector} className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-800">{sec.sector}</span>
                    <span className="font-mono tabular-nums font-bold text-indigo-700">
                      {sec.share}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${sec.share * 2}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // 11. CONTENT MANAGEMENT
  if (page === 'adm-content') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Portal Content Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Curate Student Package benefit cards, Career Resources templates, and campus notices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
            <h2 className="text-sm font-bold text-slate-900">
              Student Package Cards ({STUDENT_BENEFITS.length} Active)
            </h2>
            <div className="divide-y divide-slate-100">
              {STUDENT_BENEFITS.slice(0, 5).map((b) => (
                <div key={b.id} className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{b.title}</span>
                  <span className="text-emerald-700 font-medium">Published</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
            <h2 className="text-sm font-bold text-slate-900">
              Career Resources Library ({CAREER_RESOURCES.length} Guides)
            </h2>
            <div className="divide-y divide-slate-100">
              {CAREER_RESOURCES.slice(0, 5).map((r) => (
                <div key={r.id} className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 truncate pr-2">{r.title}</span>
                  <span className="text-slate-500 shrink-0">{r.format}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // 12. ADMIN SETTINGS
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Career Centre Governance Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure minimum industrial placement duration rules and automated supervisor reminders.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 text-xs">
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div>
            <p className="font-bold text-slate-900 text-sm">Minimum Bachelor Placement Duration</p>
            <p className="text-slate-500">Enforced during Offer Letter verification</p>
          </div>
          <span className="font-mono tabular-nums font-bold text-slate-900">16 Weeks</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div>
            <p className="font-bold text-slate-900 text-sm">Require University Email Verification</p>
            <p className="text-slate-500">Required for Student Package & Mentoring bookings</p>
          </div>
          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
            <ShieldCheck className="w-4 h-4" /> Enabled
          </span>
        </div>
        <button
          type="button"
          onClick={() => showToast('Governance configuration saved')}
          className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold"
        >
          Save Governance Rules
        </button>
      </div>
    </div>
  );
};
