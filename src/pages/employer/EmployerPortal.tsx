import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  FolderKanban,
  Info,
  MessageSquare,
  PlusCircle,
  Send,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EmployerApplicant, EmployerPageId, Opportunity } from '../../types';
import { DemoAvatar } from '../../components/common/DemoAvatar';
import { Modal } from '../../components/common/Modal';

interface EmployerPortalProps {
  page: EmployerPageId;
}

export const EmployerPortal: React.FC<EmployerPortalProps> = ({ page }) => {
  const {
    companyProfile,
    updateCompanyProfile,
    opportunities,
    postEmployerOpportunity,
    employerApplicants,
    updateApplicantStatus,
    employerMessages,
    sendEmployerReply,
    navigate,
    showToast,
  } = useApp();

  // Company profile draft
  const [profileDraft, setProfileDraft] = useState(companyProfile);

  // Post an Opportunity form state
  const [title, setTitle] = useState('');
  const [roleType, setRoleType] = useState<Opportunity['roleType']>('Internship');
  const [workMode, setWorkMode] = useState<Opportunity['workMode']>('Hybrid');
  const [location, setLocation] = useState('Kuala Lumpur (KLCC), Malaysia');
  const [duration, setDuration] = useState('20 Weeks (Jan – Jun 2027)');
  const [allowance, setAllowance] = useState('RM 2,000 / month (Sample)');
  const [deadline, setDeadline] = useState('15 Dec 2026');
  const [degreeTarget, setDegreeTarget] = useState('Computer Science / Data Science / Software Eng');
  const [skillsText, setSkillsText] = useState('Python, FastAPI, SQL, Cloud');
  const [summary, setSummary] = useState('');
  const [responsibilitiesText, setResponsibilitiesText] = useState(
    'Build internal analytics services and unit tests.\nCollaborate with data engineers in agile two-week sprints.'
  );
  const [requirementsText, setRequirementsText] = useState(
    'Pursuing a relevant Computing or Engineering degree.\nAvailable for 16–20 weeks full-time placement.'
  );

  // Applications state
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [previewCandidate, setPreviewCandidate] = useState<EmployerApplicant | null>(null);

  // Career fair form state
  const [boothZone, setBoothZone] = useState(companyProfile.preferredBoothZone);
  const [repCount, setRepCount] = useState(4);
  const [talkProposal, setTalkProposal] = useState(
    'Applied Machine Learning in Clean-Energy Operations'
  );

  // Messages state
  const [activeThreadId, setActiveThreadId] = useState(employerMessages[0]?.id || 'msg-01');
  const [replyText, setReplyText] = useState('');

  const companyListings = opportunities.filter(
    (o) => o.logoKey === 'petronas' || o.postedByEmployer
  );

  // 1. EMPLOYER DASHBOARD
  if (page === 'emp-dashboard') {
    const shortlistedCount = employerApplicants.filter(
      (a) => a.status === 'Shortlisted' || a.status === 'Interview Scheduled'
    ).length;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-blue-600">
              Company / Employer Demonstration Workspace
            </p>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{companyProfile.name}</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">{companyProfile.tagline}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('emp-post-opportunity')}
            className="px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 self-start whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post an Opportunity</span>
          </button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Vacancies', value: companyListings.length, sub: 'Approved & Live' },
            {
              label: 'Total Candidate Applications',
              value: employerApplicants.length,
              sub: 'Year 3 & Final Year',
            },
            {
              label: 'Shortlisted / Interviewing',
              value: shortlistedCount,
              sub: 'Pipeline in progress',
            },
            { label: 'Career Fair 2026 Booth', value: 'A-02', sub: 'Central Atrium Confirmed' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-1">
                {stat.value}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Candidate Applications */}
          <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Recent Student Applications</h2>
              <button
                type="button"
                onClick={() => navigate('emp-applications')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Manage All ({employerApplicants.length}) →
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {employerApplicants.map((cand) => (
                <div
                  key={cand.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <DemoAvatar
                      seed={cand.studentName.slice(0, 2)}
                      name={cand.studentName}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{cand.studentName}</p>
                      <p className="text-xs text-slate-500">
                        {cand.appliedRole} · {cand.programme} (CGPA {cand.cgpa})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <span className="text-xs font-mono tabular-nums font-bold text-emerald-700">
                      {cand.matchScore}% Fit
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate('emp-applications')}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-500 text-xs font-semibold text-slate-700"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Booth & Quick Links */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Career Fair Booth Summary</h2>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <p className="font-bold text-slate-900">APU Career Fair 2026 (Demo)</p>
              <p className="text-slate-600">Friday, 20 Nov 2026 · 9:30 AM – 5:00 PM</p>
              <p className="font-mono text-blue-700 font-semibold">
                {companyProfile.preferredBoothZone}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('emp-career-fair')}
              className="w-full py-2 px-4 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold transition-colors"
            >
              Manage Booth & Representatives →
            </button>
            <button
              type="button"
              onClick={() => navigate('emp-messages')}
              className="w-full py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              Open Candidate Messages
            </button>
          </section>
        </div>
      </div>
    );
  }

  // 2. COMPANY PROFILE EDITOR
  if (page === 'emp-profile') {
    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company Profile Editor</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Maintain your organisation overview, campus hiring pitch, and verification details.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateCompanyProfile(profileDraft);
          }}
          className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organisation Name *
              </label>
              <input
                type="text"
                required
                value={profileDraft.name}
                onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Industry</label>
              <input
                type="text"
                value={profileDraft.industry}
                onChange={(e) => setProfileDraft({ ...profileDraft, industry: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Headquarters</label>
              <input
                type="text"
                value={profileDraft.headquarters}
                onChange={(e) => setProfileDraft({ ...profileDraft, headquarters: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Digital / Engineering Team Size
              </label>
              <input
                type="text"
                value={profileDraft.companySize}
                onChange={(e) => setProfileDraft({ ...profileDraft, companySize: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Employer Tagline
            </label>
            <input
              type="text"
              value={profileDraft.tagline}
              onChange={(e) => setProfileDraft({ ...profileDraft, tagline: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              About Early Careers & Engineering Culture
            </label>
            <textarea
              rows={4}
              value={profileDraft.about}
              onChange={(e) => setProfileDraft({ ...profileDraft, about: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-emerald-700 font-semibold inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Verified Employer Profile (Demo)
            </span>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold"
            >
              Save Company Profile
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 3. POST AN OPPORTUNITY (VACANCY CREATION FORM & JOB DESCRIPTION EDITOR)
  if (page === 'emp-post-opportunity') {
    const handlePublish = (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim() || !summary.trim()) return;
      postEmployerOpportunity({
        title: title.trim(),
        company: companyProfile.name.replace(' (Employer Demo)', ''),
        logoKey: 'petronas',
        industry: companyProfile.industry,
        location,
        workMode,
        roleType,
        degreeTarget,
        experienceLevel: 'Year 3 / Final Year',
        duration,
        allowance,
        deadline,
        matchScore: 93,
        matchExplanation: 'Newly published employer vacancy matching Python, SQL, and Cloud skills.',
        skills: skillsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        summary: summary.trim(),
        responsibilities: responsibilitiesText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        requirements: requirementsText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setTitle('');
      setSummary('');
      navigate('emp-manage-opportunities');
    };

    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Post a New Opportunity</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Publish an internship, industrial placement, or graduate vacancy. Submitted roles also
            appear in Career Centre Opportunity Approvals and Student discovery!
          </p>
        </div>

        <form
          onSubmit={handlePublish}
          className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vacancy Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cloud Data Engineering Intern (2027 Intake)"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role Type</label>
              <select
                value={roleType}
                onChange={(e) => setRoleType(e.target.value as Opportunity['roleType'])}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              >
                <option value="Internship">Internship</option>
                <option value="Industrial Placement">Industrial Placement</option>
                <option value="Graduate Role">Graduate Role</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Mode</label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value as Opportunity['workMode'])}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              >
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration & Intake Window
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monthly Allowance / Salary
              </label>
              <input
                type="text"
                value={allowance}
                onChange={(e) => setAllowance(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Application Deadline
              </label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Degree Disciplines
              </label>
              <input
                type="text"
                value={degreeTarget}
                onChange={(e) => setDegreeTarget(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Required Technical Skills (comma separated)
              </label>
              <input
                type="text"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Role Summary (Job Description Editor) *
            </label>
            <textarea
              rows={3}
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe the team mission, mentorship structure, and impact..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Responsibilities (one per line)
              </label>
              <textarea
                rows={4}
                value={responsibilitiesText}
                onChange={(e) => setResponsibilitiesText(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Candidate Requirements (one per line)
              </label>
              <textarea
                rows={4}
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold"
            >
              Publish Demonstration Vacancy
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 4. MANAGE OPPORTUNITIES
  if (page === 'emp-manage-opportunities') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Manage Opportunities</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Track approval status and applicant counts for your published listings.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('emp-post-opportunity')}
            className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Listing</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {companyListings.map((opp) => (
            <div
              key={opp.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{opp.roleType}</span>
                  <span aria-hidden="true">·</span>
                  <span>{opp.location}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">Closes {opp.deadline}</span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">{opp.title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{opp.skills.join(' · ')}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                    opp.approvalStatus === 'Pending Review'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  {opp.approvalStatus || 'Approved'}
                </span>
                <button
                  type="button"
                  onClick={() => navigate('emp-applications')}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View Candidates
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 5. APPLICATIONS & CANDIDATE PROFILE PREVIEW
  if (page === 'emp-applications') {
    const statuses: ('All' | EmployerApplicant['status'])[] = [
      'All',
      'New Application',
      'Shortlisted',
      'Interview Scheduled',
      'Offer Extended',
      'Declined',
    ];
    const visibleApplicants = employerApplicants.filter(
      (a) => statusFilter === 'All' || a.status === statusFilter
    );

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Candidate Applications</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Preview candidate profiles and update recruitment pipeline stages in real time.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1 bg-white rounded-xl border border-slate-200 w-fit">
          {statuses.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                statusFilter === st ? 'bg-[#0D1526] text-white' : 'text-slate-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 bg-slate-50/70">
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Applied Vacancy</th>
                <th className="py-3 px-4 text-right">CGPA</th>
                <th className="py-3 px-4 text-right">Fit</th>
                <th className="py-3 px-4">Application Stage</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {visibleApplicants.map((cand) => (
                <tr key={cand.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{cand.studentName}</p>
                    <p className="text-[11px] text-slate-500">{cand.programme}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{cand.appliedRole}</td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold">
                    {cand.cgpa}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-emerald-700">
                    {cand.matchScore}%
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={cand.status}
                      onChange={(e) =>
                        updateApplicantStatus(
                          cand.id,
                          e.target.value as EmployerApplicant['status']
                        )
                      }
                      aria-label={`Application status for ${cand.studentName}`}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                    >
                      <option value="New Application">New Application</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Interview Scheduled">Interview Scheduled</option>
                      <option value="Offer Extended">Offer Extended</option>
                      <option value="Declined">Declined</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setPreviewCandidate(cand)}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Preview Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Candidate Profile Preview Modal */}
        <Modal
          open={Boolean(previewCandidate)}
          onClose={() => setPreviewCandidate(null)}
          title={previewCandidate?.studentName || 'Candidate Profile'}
          subtitle={previewCandidate ? `${previewCandidate.programme} · ${previewCandidate.year}` : ''}
        >
          {previewCandidate && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <p>
                  <strong>University Email:</strong> {previewCandidate.studentEmail}
                </p>
                <p>
                  <strong>Academic Standing:</strong> CGPA {previewCandidate.cgpa} ·{' '}
                  {previewCandidate.matchScore}% Role Alignment
                </p>
                <p>
                  <strong>Skills:</strong> {previewCandidate.skills.join(' · ')}
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-900 mb-1">Portfolio & Assessment Note</p>
                <p className="text-slate-600 leading-relaxed">{previewCandidate.portfolioNote}</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    updateApplicantStatus(previewCandidate.id, 'Interview Scheduled');
                    setPreviewCandidate(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold"
                >
                  Move to Interview Scheduled
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // 6. CAREER FAIR PARTICIPATION
  if (page === 'emp-career-fair') {
    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Career Fair Participation & Booth</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your APU Career Fair 2026 exhibitor registration, booth setup, and stage talk
            proposal.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateCompanyProfile({
              ...companyProfile,
              boothRegistered: true,
              preferredBoothZone: boothZone,
            });
            showToast('Career Fair booth logistics saved');
          }}
          className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
        >
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
            <div>
              <p className="font-bold">Confirmed Exhibitor · APU Career Fair 2026 (20 Nov 2026)</p>
              <p className="mt-0.5">Assigned Location: {boothZone}</p>
            </div>
            <Calendar className="w-5 h-5 text-emerald-700" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned / Preferred Booth Zone
              </label>
              <input
                type="text"
                value={boothZone}
                onChange={(e) => setBoothZone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                On-Campus Recruiter Passes Requested
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={repCount}
                onChange={(e) => setRepCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Auditorium Employer Tech Talk Topic (Optional)
            </label>
            <input
              type="text"
              value={talkProposal}
              onChange={(e) => setTalkProposal(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
            >
              Update Booth Registration
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 7. EMPLOYER MESSAGES
  if (page === 'emp-messages') {
    const activeThread =
      employerMessages.find((t) => t.id === activeThreadId) || employerMessages[0];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Candidate & Coordinator Messages</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Coordinate interview times with shortlisted students and confirm logistics with the
            Career Centre.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {employerMessages.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => setActiveThreadId(thread.id)}
                className={`w-full text-left p-4 transition-colors ${
                  activeThread?.id === thread.id ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                }`}
              >
                <p className="text-xs font-bold text-slate-900">{thread.participantName}</p>
                <p className="text-[11px] text-slate-500">{thread.participantRole}</p>
                <p className="text-xs text-slate-700 mt-1 truncate">{thread.subject}</p>
              </button>
            ))}
          </div>

          {activeThread && (
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 flex flex-col h-[460px]">
              <div className="px-5 py-3.5 border-b border-slate-200">
                <p className="text-sm font-bold text-slate-900">{activeThread.subject}</p>
                <p className="text-xs text-slate-500">{activeThread.participantName}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {activeThread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[82%] p-3.5 rounded-xl text-xs leading-relaxed ${
                      m.sender === 'employer'
                        ? 'ml-auto bg-[#2563EB] text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    <p className="font-bold mb-1 text-[11px] opacity-85">
                      {m.senderName} · {m.time}
                    </p>
                    <p>{m.text}</p>
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!replyText.trim()) return;
                  sendEmployerReply(activeThread.id, replyText.trim());
                  setReplyText('');
                }}
                className="p-3.5 border-t border-slate-200 flex gap-2"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a message..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 8. EMPLOYER SETTINGS
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Employer Workspace Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure recruiter team notifications and application digest alerts.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 text-xs">
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-blue-50/70 border border-blue-200 text-slate-700">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            Recruiter team members receive daily digests when shortlisted candidates accept
            interview slots in the production FastAPI integration.
          </span>
        </div>
        <button
          type="button"
          onClick={() => showToast('Employer settings saved')}
          className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold"
        >
          Save Employer Preferences
        </button>
      </div>
    </div>
  );
};
