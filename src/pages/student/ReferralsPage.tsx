import React, { useState } from 'react';
import { CheckCircle2, FileCheck, HelpCircle, Send, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DemoAvatar } from '../../components/common/DemoAvatar';
import { CompanyLogo } from '../../components/common/CompanyLogo';
import { Modal } from '../../components/common/Modal';
import { AlumniMember } from '../../types';

export const ReferralsPage: React.FC = () => {
  const { alumniList, referralRequestIds, submitReferralRequest, navigate } = useApp();

  const [activeTab, setActiveTab] = useState<'referrals' | 'references-guide'>('referrals');
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniMember | null>(null);
  const [pitchNote, setPitchNote] = useState('');

  const referralOpenAlumni = alumniList.filter((a) => a.openToReferrals);

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlumni || !pitchNote.trim()) return;
    submitReferralRequest(selectedAlumni.id, pitchNote);
    setPitchNote('');
    setSelectedAlumni(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Professional Referrals & Academic/Employer References
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Connect respectfully with alumni open to referral discussions, and learn how to request
            formal professional or academic references.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-slate-200 self-start">
          <button
            type="button"
            onClick={() => setActiveTab('referrals')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
              activeTab === 'referrals' ? 'bg-[#0D1526] text-white' : 'text-slate-600'
            }`}
          >
            Referral Connections ({referralOpenAlumni.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('references-guide')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
              activeTab === 'references-guide' ? 'bg-[#0D1526] text-white' : 'text-slate-600'
            }`}
          >
            Professional Reference Guide
          </button>
        </div>
      </div>

      {/* Explicit Non-Guarantee Principle */}
      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 text-xs text-amber-950 leading-relaxed">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong>Important Professional Etiquette:</strong> Neither a company referral nor a
          professional reference is ever guaranteed. Alumni and lecturers assess alignment, work
          ethic, and demonstrated coursework/project quality at their own discretion.
        </div>
      </div>

      {activeTab === 'referrals' ? (
        <div className="space-y-6">
          {/* How Referrals Work Explanation */}
          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                How Employee Referrals Work
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <p className="font-bold text-slate-900">01. Match Role & Portfolio First</p>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Identify a specific open internship or graduate role and ensure your CV and
                  projects meet its stated technical requirements before reaching out.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <p className="font-bold text-slate-900">02. Request an Exploratory Connection</p>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Share a concise 3–4 sentence summary of your projects, target role ID, and why
                  you are interested in their engineering or business team.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <p className="font-bold text-slate-900">03. Independent Hiring Assessment</p>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Even if an alum chooses to refer your application internally, you still complete
                  the same merit-based technical and behavioural interviews.
                </p>
              </div>
            </div>
          </section>

          {/* Alumni Open to Referral Discussions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {referralOpenAlumni.map((alm) => {
              const requested = referralRequestIds.includes(alm.id);
              return (
                <article
                  key={alm.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <DemoAvatar seed={alm.avatarSeed} name={alm.name} size="md" showDemoTag />
                        <div>
                          <p className="text-[11px] text-amber-700 font-medium">
                            {alm.verificationLabel}
                          </p>
                          <h3 className="text-base font-bold text-slate-900">{alm.name}</h3>
                          <p className="text-xs text-slate-600">
                            {alm.jobTitle} · {alm.company} ({alm.industry})
                          </p>
                        </div>
                      </div>
                      <CompanyLogo logoKey={alm.logoKey} companyName={alm.company} size="sm" />
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{alm.bio}</p>

                    {alm.relevantOpenRoles && (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                        <span className="font-semibold text-slate-800 block mb-1">
                          Relevant Demonstration Vacancies:
                        </span>
                        {alm.relevantOpenRoles.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => navigate('opportunities')}
                            className="text-blue-600 hover:underline block text-left"
                          >
                            {r} →
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => navigate('alumni-network', alm.id)}
                      className="text-xs font-semibold text-slate-700 hover:text-blue-600"
                    >
                      View Full Profile
                    </button>

                    {requested ? (
                      <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Inquiry Sent (Demo)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedAlumni(alm)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Request Connection</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        /* SEPARATE PROFESSIONAL REFERENCE INFORMATION SECTION */
        <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                How to Request a Formal Professional or Academic Reference
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Scholarships, Master’s programmes, and graduate employers frequently ask for 1–2
                formal referees (a university lecturer who supervised your coursework/FYP, or an
                internship manager). Follow these guidelines to request a reference respectfully.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <h3 className="text-sm font-bold text-slate-900">
                1. Academic Reference (University Lecturer / FYP Supervisor)
              </h3>
              <ul className="space-y-2 text-slate-700 list-disc pl-4 leading-relaxed">
                <li>
                  Ask a lecturer who knows your individual technical or analytical work well (e.g.,
                  FYP supervisor or module lead where you actively contributed).
                </li>
                <li>
                  Request permission at least <strong>3 to 4 weeks before</strong> the scholarship
                  or employer deadline—never list a lecturer’s email without prior consent.
                </li>
                <li>
                  Attach your updated CV, unofficial academic transcript, and a bulleted reminder
                  of the project/grade you completed in their module.
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <h3 className="text-sm font-bold text-slate-900">
                2. Employer Reference (Internship Host Supervisor)
              </h3>
              <ul className="space-y-2 text-slate-700 list-disc pl-4 leading-relaxed">
                <li>
                  During the final two weeks of your placement, ask your host manager if they would
                  feel comfortable serving as a future employment referee.
                </li>
                <li>
                  Confirm their preferred corporate email and note company policy (some MNCs issue
                  standard HR verification letters rather than narrative references).
                </li>
                <li>
                  Keep them updated politely when you apply to roles where background checks may
                  contact them.
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}

      <Modal
        open={Boolean(selectedAlumni)}
        onClose={() => setSelectedAlumni(null)}
        title={`Request Referral Discussion — ${selectedAlumni?.name}`}
        subtitle={`${selectedAlumni?.company} · Non-guaranteed exploratory connection`}
      >
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Share which demonstration role you are targeting and highlight 1–2 relevant projects.
            Remember that alumni review inquiries voluntarily and referrals are never guaranteed.
          </p>
          <textarea
            rows={4}
            required
            value={pitchNote}
            onChange={(e) => setPitchNote(e.target.value)}
            placeholder="Hi, I am a Year 3 CS (AI) student interested in the Data & ML Internship..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedAlumni(null)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
            >
              Send Connection Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
