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
import { API_CONFIG, apiRequest } from '../../services/apiClient';
import { StudentProfile } from '../../types';

export const MyProfilePage: React.FC = () => {
  const { studentProfile, updateStudentProfile, showToast } = useApp();

  const [editing, setEditing] = useState(false);
  const [profileMethodOpen, setProfileMethodOpen] = useState(false);
  const [reviewNotice, setReviewNotice] = useState('');
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [draft, setDraft] = useState(studentProfile);
  const [newSkill, setNewSkill] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [cvFileUrl, setCvFileUrl] = useState<string | null>(null);
  const cvInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleSave = async () => {
    if (draft.internshipStartDate && draft.internshipEndDate && draft.internshipStartDate > draft.internshipEndDate) { showToast('Placement end date must be after start date'); return; }
    try { await updateStudentProfile(draft); setEditing(false); }
    catch { /* Context displays the API error; keep edits open for retry. */ }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('CV must be 5 MB or smaller'); return; }
    setIsParsingResume(true);
    try {
      const form = new FormData(); form.append('file', file);
      const result = await apiRequest<{ fileName: string; proposedProfile: Partial<StudentProfile>; requiresStudentConfirmation: boolean; notes: string[] }>(`/students/${encodeURIComponent(studentProfile.studentId)}/cv/parse`, { method: 'POST', body: form });
      const parsed = result.data.proposedProfile;
      if (cvFileUrl) URL.revokeObjectURL(cvFileUrl);
      setCvFileUrl(URL.createObjectURL(file));
      const updated: StudentProfile = {
        ...studentProfile, ...parsed,
        studentId: studentProfile.studentId, email: studentProfile.email,
        cvFileName: file.name, cvUpdatedDate: new Date().toLocaleDateString(),
        skills: parsed.skills?.length ? parsed.skills : studentProfile.skills,
        education: parsed.education?.length ? parsed.education as StudentProfile['education'] : studentProfile.education,
        workExperience: parsed.workExperience?.length ? parsed.workExperience as StudentProfile['workExperience'] : studentProfile.workExperience,
        projects: parsed.projects?.length ? parsed.projects as StudentProfile['projects'] : studentProfile.projects,
        certifications: parsed.certifications?.length ? parsed.certifications as StudentProfile['certifications'] : studentProfile.certifications,
      };
      setDraft(updated);
      setEditing(true);
      setProfileMethodOpen(false);
      setReviewNotice(`${result.data.notes?.[0] || 'Review the extracted resume details before saving.'} Nothing has been saved yet.`);
      showToast('Resume parsed. Review every section and save when it looks right.');
    } catch (error) {
      showToast(`Resume could not be parsed: ${error instanceof Error ? error.message : 'check that it is a text-based PDF or DOCX'}`);
    } finally {
      setIsParsingResume(false);
      e.target.value = '';
    }
  };

  const handleAddSkill = () => {
    const clean = newSkill.trim();
    if (!clean) return;
    if (!draft.skills.includes(clean)) {
      setDraft({ ...draft, skills: [...draft.skills, clean] });
    }
    setNewSkill('');
  };

  const handleAddLocation = () => {
    const clean = newLocation.trim().replace(/\s+/g, ' ');
    if (!clean) return;
    if (!draft.preferredLocations.some((place) => place.toLowerCase() === clean.toLowerCase())) {
      setDraft({ ...draft, preferredLocations: [...draft.preferredLocations, clean] });
    }
    setNewLocation('');
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
    const updated = { ...draft, projects: [nextProj, ...draft.projects] };
    setDraft(updated);
    if (!editing) void updateStudentProfile(updated);
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
                ? 'CV attached · Your profile is ready to use for matching'
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
                setProfileMethodOpen(true);
              }}
              className="px-4 py-2 rounded-lg bg-[#0D1526] hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-center whitespace-nowrap"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {reviewNotice && editing && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Review extracted CV details.</strong> {reviewNotice}</div>}
      {isParsingResume && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">Reading your CV and preparing editable profile fields…</div>}
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Placement start</label>
                    <input type="date" value={draft.internshipStartDate || ''} onChange={(e) => setDraft({ ...draft, internshipStartDate: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Placement end</label>
                    <input type="date" value={draft.internshipEndDate || ''} onChange={(e) => setDraft({ ...draft, internshipEndDate: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300" />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input id="open-to-matches" type="checkbox" checked={draft.openToMatches !== false} onChange={(e) => setDraft({ ...draft, openToMatches: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                    <label htmlFor="open-to-matches" className="text-xs font-semibold text-slate-700">Include my profile in opportunity matching</label>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred locations</label>
                    <div className="flex gap-2"><input type="text" list="apu-location-options" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddLocation(); } }} placeholder="Type one location, e.g. Kuala Lumpur" className="min-w-0 flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300"/><datalist id="apu-location-options"><option value="Kuala Lumpur"/><option value="Petaling Jaya"/><option value="Cyberjaya"/><option value="Selangor"/><option value="Putrajaya"/><option value="Remote"/></datalist><button type="button" onClick={handleAddLocation} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">Add</button></div>
                    <p className="mt-1 text-xs text-slate-500">Add each place separately. Choose a suggestion or type another location.</p>
                    {draft.preferredLocations.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{draft.preferredLocations.map((place) => <span key={place} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">{place}<button type="button" onClick={() => setDraft({ ...draft, preferredLocations: draft.preferredLocations.filter((item) => item !== place) })} aria-label={`Remove ${place}`} className="font-bold hover:text-red-700">×</button></span>)}</div>}
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
                    <span className="font-semibold text-slate-900 mt-0.5 block">{studentProfile.internshipStartDate || 'Start date not set'} – {studentProfile.internshipEndDate || 'End date not set'}</span>
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
              {(editing ? draft.projects : studentProfile.projects).map((proj) => (
                <div key={proj.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {editing ? <div className="grid gap-2 sm:grid-cols-2"><input aria-label="Project title" value={proj.title} onChange={e=>setDraft({...draft,projects:draft.projects.map(x=>x.id===proj.id?{...x,title:e.target.value}:x)})} className="rounded border px-2 py-1 text-xs"/><input aria-label="Project role" value={proj.role} onChange={e=>setDraft({...draft,projects:draft.projects.map(x=>x.id===proj.id?{...x,role:e.target.value}:x)})} className="rounded border px-2 py-1 text-xs"/><input aria-label="Project technology stack" value={proj.techStack.join(', ')} onChange={e=>setDraft({...draft,projects:draft.projects.map(x=>x.id===proj.id?{...x,techStack:e.target.value.split(',').map(v=>v.trim()).filter(Boolean)}:x)})} className="rounded border px-2 py-1 text-xs sm:col-span-2"/></div> : <><h3 className="text-sm font-bold text-slate-900">{proj.title}</h3><p className="text-xs text-slate-500 mt-0.5">{proj.role} · {proj.techStack.join(' / ')}</p></>}
                    </div>
                  </div>
                  {editing ? <textarea aria-label="Project summary" value={proj.summary} onChange={e=>setDraft({...draft,projects:draft.projects.map(x=>x.id===proj.id?{...x,summary:e.target.value}:x)})} className="mt-2 w-full rounded border px-2 py-1 text-xs" rows={2}/> : <p className="text-xs text-slate-600 mt-2 leading-relaxed">{proj.summary}</p>}
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
              {(editing ? draft.education : studentProfile.education).map((edu) => (
                <div key={edu.id} className="space-y-1">
                  {editing ? <div className="grid gap-2"><input aria-label="Qualification" value={edu.qualification} onChange={e=>setDraft({...draft,education:draft.education.map(x=>x.id===edu.id?{...x,qualification:e.target.value}:x)})} className="rounded border px-2 py-1 text-xs"/><input aria-label="Institution" value={edu.institution} onChange={e=>setDraft({...draft,education:draft.education.map(x=>x.id===edu.id?{...x,institution:e.target.value}:x)})} className="rounded border px-2 py-1 text-xs"/><div className="grid grid-cols-2 gap-2"><input aria-label="Education period" value={edu.period} onChange={e=>setDraft({...draft,education:draft.education.map(x=>x.id===edu.id?{...x,period:e.target.value}:x)})} className="rounded border px-2 py-1 text-xs"/><input aria-label="Grade" value={edu.grade} onChange={e=>setDraft({...draft,education:draft.education.map(x=>x.id===edu.id?{...x,grade:e.target.value}:x)})} className="rounded border px-2 py-1 text-xs"/></div></div> : <><p className="text-xs font-bold text-slate-900">{edu.qualification}</p><p className="text-xs text-slate-600">{edu.institution}</p><p className="text-xs font-mono tabular-nums text-slate-500">{edu.period} · {edu.grade}</p></>}
                </div>
              ))}
            </section>

            <section className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Work & Campus Experience</h2>
              </div>
              {(editing ? draft.workExperience : studentProfile.workExperience).map((exp) => (
                <div key={exp.id} className="space-y-1">
                  {editing ? <div className="grid gap-2"><input aria-label="Experience role" value={exp.role} onChange={e=>setDraft({...draft,workExperience:draft.workExperience.map(x=>x.id===exp.id?{...x,role:e.target.value}:x)})} className="rounded border px-2 py-1 text-xs"/><input aria-label="Employer" value={exp.organization} onChange={e=>setDraft({...draft,workExperience:draft.workExperience.map(x=>x.id===exp.id?{...x,organization:e.target.value}:x)})} className="rounded border px-2 py-1 text-xs"/><input aria-label="Experience period" value={exp.period} onChange={e=>setDraft({...draft,workExperience:draft.workExperience.map(x=>x.id===exp.id?{...x,period:e.target.value}:x)})} className="rounded border px-2 py-1 text-xs"/><textarea aria-label="Experience details" value={exp.summary} onChange={e=>setDraft({...draft,workExperience:draft.workExperience.map(x=>x.id===exp.id?{...x,summary:e.target.value}:x)})} className="rounded border px-2 py-1 text-xs" rows={2}/></div> : <><p className="text-xs font-bold text-slate-900">{exp.role}</p><p className="text-xs text-slate-600">{exp.organization} · {exp.period}</p><p className="text-xs text-slate-500 leading-relaxed mt-1">{exp.summary}</p></>}
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
              A text-based PDF or DOCX is read to suggest profile fields. Review them before saving. Scanned image-only CVs are not supported.
            </p>

            {studentProfile.cvFileName ? (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{studentProfile.cvFileName}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Updated {studentProfile.cvUpdatedDate} · The CV itself is not stored; only the profile fields and filename are saved.
                  </p>
                  {cvFileUrl && <a href={cvFileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-[11px] font-semibold text-blue-700 hover:underline">Open selected CV</a>}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (cvFileUrl) URL.revokeObjectURL(cvFileUrl);
                    setCvFileUrl(null);
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
              <span>{studentProfile.cvFileName ? 'Replace CV (PDF / DOCX)' : 'Upload CV (PDF / DOCX)'}</span>
              <input
                type="file"
                accept=".pdf,.docx"
                ref={cvInputRef}
                onChange={handleResumeUpload}
                className="hidden"
              />
            </label>
          </section>

          {/* Skills */}
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

          </section>

          {/* Certifications */}
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Certifications</h2>
            </div>
            <div className="space-y-3">
              {(editing ? draft.certifications : studentProfile.certifications).map((cert) => (
                <div key={cert.id} className="text-xs">
                  {editing ? <div className="grid gap-2 sm:grid-cols-3"><input aria-label="Certificate name" value={cert.name} onChange={e=>setDraft({...draft,certifications:draft.certifications.map(x=>x.id===cert.id?{...x,name:e.target.value}:x)})} className="rounded border px-2 py-1"/><input aria-label="Certificate issuer" value={cert.issuer} onChange={e=>setDraft({...draft,certifications:draft.certifications.map(x=>x.id===cert.id?{...x,issuer:e.target.value}:x)})} className="rounded border px-2 py-1"/><input aria-label="Certificate date" value={cert.date} onChange={e=>setDraft({...draft,certifications:draft.certifications.map(x=>x.id===cert.id?{...x,date:e.target.value}:x)})} className="rounded border px-2 py-1"/></div> : <><p className="font-bold text-slate-900">{cert.name}</p><p className="text-slate-500">{cert.issuer} · {cert.date}</p></>}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <Modal open={profileMethodOpen} onClose={() => setProfileMethodOpen(false)} title="Choose how to update your profile" subtitle="Start with your CV or enter details yourself.">
        <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => { setDraft(studentProfile); setEditing(true); setProfileMethodOpen(false); setReviewNotice(''); }} className="rounded-xl border border-slate-200 p-5 text-left hover:border-blue-400 hover:bg-blue-50"><strong className="block text-sm text-slate-900">Enter details manually</strong><span className="mt-1 block text-xs text-slate-600">Edit your education, dates, skills and experience directly.</span></button><button type="button" onClick={() => cvInputRef.current?.click()} className="rounded-xl border border-slate-200 p-5 text-left hover:border-blue-400 hover:bg-blue-50"><strong className="block text-sm text-slate-900">Upload a CV</strong><span className="mt-1 block text-xs text-slate-600">Review extracted fields before anything is saved.</span></button></div>
      </Modal>

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
