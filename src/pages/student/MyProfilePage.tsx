import React, { useMemo, useState } from 'react';
import {
  Award,
  Briefcase,
  CheckCircle2,
  Edit3,
  FileText,
  FolderGit2,
  GraduationCap,
  Mail,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DemoAvatar } from '../../components/common/DemoAvatar';
import { Modal } from '../../components/common/Modal';

export const MyProfilePage: React.FC = () => {
  const { studentProfile, updateStudentProfile, showToast } = useApp();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(studentProfile);
  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');

  // Add project modal
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projTitle, setProjTitle] = useState('');
  const [projRole, setProjRole] = useState('');
  const [projStack, setProjStack] = useState('');
  const [projSummary, setProjSummary] = useState('');

  const completeness = useMemo(() => {
    let score = 0;
    if (studentProfile.name && studentProfile.email) score += 20;
    if (studentProfile.bio.length > 30) score += 15;
    if (studentProfile.skills.length >= 4) score += 15;
    if (studentProfile.projects.length >= 1) score += 15;
    if (studentProfile.certifications.length >= 1) score += 10;
    if (studentProfile.workExperience.length >= 1) score += 10;
    if (studentProfile.cvFileName) score += 15;
    return Math.min(100, score);
  }, [studentProfile]);

  const handleSave = () => {
    updateStudentProfile(draft);
    setEditing(false);
  };

  const handleSimulatedCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const updated = {
      ...studentProfile,
      cvFileName: file.name,
      cvUpdatedDate: '02 Nov 2026',
    };
    setDraft(updated);
    updateStudentProfile(updated);
  };

  const handleAddSkill = () => {
    const clean = newSkill.trim();
    if (!clean) return;
    if (!draft.skills.includes(clean)) {
      setDraft({ ...draft, skills: [...draft.skills, clean] });
    }
    setNewSkill('');
  };

  const handleAddInterest = () => {
    const clean = newInterest.trim();
    if (!clean) return;
    if (!draft.careerInterests.includes(clean)) {
      setDraft({ ...draft, careerInterests: [...draft.careerInterests, clean] });
    }
    setNewInterest('');
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim() || !projSummary.trim()) return;
    const nextProj = {
      id: `prj-${Date.now()}`,
      title: projTitle.trim(),
      role: projRole.trim() || 'Student Developer',
      techStack: projStack
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      summary: projSummary.trim(),
    };
    const updated = {
      ...studentProfile,
      projects: [nextProj, ...studentProfile.projects],
    };
    setDraft(updated);
    updateStudentProfile(updated);
    setProjTitle('');
    setProjRole('');
    setProjStack('');
    setProjSummary('');
    setProjectModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Completeness Indicator */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <DemoAvatar seed="AI" name={studentProfile.name} size="xl" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{studentProfile.name}</h1>
            <p className="text-sm text-slate-600 mt-0.5">
              {studentProfile.degree} · {studentProfile.major}
            </p>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 mt-2">
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {studentProfile.email}
              </span>
              <span aria-hidden="true">·</span>
              <span>{studentProfile.yearOfStudy}</span>
              <span aria-hidden="true">·</span>
              <span>{studentProfile.graduationStatus}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="sm:w-56">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">Profile Completeness</span>
              <span className="font-mono tabular-nums font-bold text-blue-600">{completeness}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-[#2563EB] rounded-full transition-all"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {studentProfile.cvFileName
                ? 'CV attached (optional) · Ready for 1-click demo apply'
                : 'CV upload is optional — add anytime'}
            </p>
          </div>

          {editing ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setDraft(studentProfile);
                  setEditing(false);
                }}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraft(studentProfile);
                setEditing(true);
              }}
              className="px-4 py-2 rounded-lg bg-[#0D1526] hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-center whitespace-nowrap"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Editable Core Information & Career Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Summary & Academic Details */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Academic & Career Summary</h2>

            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      University Email
                    </label>
                    <input
                      type="email"
                      value={draft.email}
                      onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Degree</label>
                    <input
                      type="text"
                      value={draft.degree}
                      onChange={(e) => setDraft({ ...draft, degree: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Specialisation / Major
                    </label>
                    <input
                      type="text"
                      value={draft.major}
                      onChange={(e) => setDraft({ ...draft, major: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Year of Study
                    </label>
                    <input
                      type="text"
                      value={draft.yearOfStudy}
                      onChange={(e) => setDraft({ ...draft, yearOfStudy: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Internship Availability
                    </label>
                    <input
                      type="text"
                      value={draft.internshipAvailability}
                      onChange={(e) =>
                        setDraft({ ...draft, internshipAvailability: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Personal Statement / Bio
                  </label>
                  <textarea
                    rows={3}
                    value={draft.bio}
                    onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-700 leading-relaxed">{studentProfile.bio}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block">Internship Availability</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                      {studentProfile.internshipAvailability}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Current CGPA</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5 block">
                      {studentProfile.cgpa}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Preferred Locations</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                      {studentProfile.preferredLocations.join(' · ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Preferred Industries</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                      {studentProfile.preferredIndustries.join(' · ')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Projects Section */}
          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Academic & Personal Projects</h2>
              </div>
              <button
                type="button"
                onClick={() => setProjectModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-xs font-semibold text-slate-700 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {studentProfile.projects.map((proj) => (
                <div key={proj.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{proj.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {proj.role} · {proj.techStack.join(' / ')}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{proj.summary}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Education & Work Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Education</h2>
              </div>
              {studentProfile.education.map((edu) => (
                <div key={edu.id} className="space-y-1">
                  <p className="text-xs font-bold text-slate-900">{edu.qualification}</p>
                  <p className="text-xs text-slate-600">{edu.institution}</p>
                  <p className="text-xs font-mono tabular-nums text-slate-500">
                    {edu.period} · {edu.grade}
                  </p>
                </div>
              ))}
            </section>

            <section className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Work & Campus Experience</h2>
              </div>
              {studentProfile.workExperience.map((exp) => (
                <div key={exp.id} className="space-y-1">
                  <p className="text-xs font-bold text-slate-900">{exp.role}</p>
                  <p className="text-xs text-slate-600">
                    {exp.organization} · {exp.period}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">{exp.summary}</p>
                </div>
              ))}
            </section>
          </div>
        </div>

        {/* Right Column: Optional CV Upload, Skills, Interests, Certifications */}
        <div className="space-y-6">
          {/* Optional CV Upload Card */}
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Resume / CV (Optional)</h2>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Uploading a CV is optional—you can explore and save opportunities without one, or attach
              a PDF for simulated 1-click applications.
            </p>

            {studentProfile.cvFileName ? (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{studentProfile.cvFileName}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Updated {studentProfile.cvUpdatedDate} (Simulated Local File)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const cleared = { ...studentProfile, cvFileName: null, cvUpdatedDate: null };
                    setDraft(cleared);
                    updateStudentProfile(cleared);
                    showToast('CV removed from profile');
                  }}
                  className="p-1.5 rounded text-slate-400 hover:text-red-600"
                  aria-label="Remove CV"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : null}

            <label className="w-full py-2.5 px-4 rounded-lg border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>{studentProfile.cvFileName ? 'Replace CV (PDF / DOCX)' : 'Upload Optional CV'}</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleSimulatedCvUpload}
                className="hidden"
              />
            </label>
          </section>

          {/* Skills & Career Interests */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-2">Technical & Professional Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {(editing ? draft.skills : studentProfile.skills).map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-800"
                  >
                    <span>{skill}</span>
                    {editing && (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            skills: draft.skills.filter((s) => s !== skill),
                          })
                        }
                        className="text-slate-400 hover:text-red-600"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {editing && (
                <div className="mt-2.5 flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add skill (e.g. Docker)"
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Career Interests</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {(editing ? draft.careerInterests : studentProfile.careerInterests).join(' · ')}
              </p>
              {editing && (
                <div className="mt-2.5 flex gap-2">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    placeholder="Add career track..."
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={handleAddInterest}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Certifications */}
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Certifications</h2>
            </div>
            <div className="space-y-3">
              {studentProfile.certifications.map((cert) => (
                <div key={cert.id} className="text-xs">
                  <p className="font-bold text-slate-900">{cert.name}</p>
                  <p className="text-slate-500">
                    {cert.issuer} · {cert.date}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Add Project Modal */}
      <Modal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        title="Add Portfolio Project"
        subtitle="Showcase capstone, hackathon, or open-source engineering work."
      >
        <form onSubmit={handleAddProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Title *</label>
            <input
              type="text"
              required
              value={projTitle}
              onChange={(e) => setProjTitle(e.target.value)}
              placeholder="e.g. Smart Campus Crowd Occupancy Predictor"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Your Role</label>
              <input
                type="text"
                value={projRole}
                onChange={(e) => setProjRole(e.target.value)}
                placeholder="Backend & ML Lead"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tech Stack (comma separated)
              </label>
              <input
                type="text"
                value={projStack}
                onChange={(e) => setProjStack(e.target.value)}
                placeholder="Python, FastAPI, React"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project Summary & Measurable Outcome *
            </label>
            <textarea
              rows={3}
              required
              value={projSummary}
              onChange={(e) => setProjSummary(e.target.value)}
              placeholder="Describe what you built and the outcome..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setProjectModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
            >
              Save Project
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
