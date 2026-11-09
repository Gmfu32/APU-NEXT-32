import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Globe,
  GraduationCap,
  Info,
  MessageSquare,
  Search,
  Send,
  Video,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CompanyLogo } from '../../components/common/CompanyLogo';
import { DemoAvatar } from '../../components/common/DemoAvatar';
import { Modal } from '../../components/common/Modal';
import { AlumniMember } from '../../types';

export const AlumniNetworkPage: React.FC = () => {
  const {
    alumniList,
    connectedAlumniIds,
    toggleConnectAlumni,
    focusedEntityId,
    setFocusedEntityId,
    navigate,
    showToast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [expertiseFilter, setExpertiseFilter] = useState('All');

  const [guidanceModalAlumni, setGuidanceModalAlumni] = useState<AlumniMember | null>(null);
  const [guidanceMessage, setGuidanceMessage] = useState('');

  const selectedAlumni = useMemo(
    () => alumniList.find((a) => a.id === focusedEntityId) || null,
    [alumniList, focusedEntityId]
  );

  const industries = useMemo(
    () => ['All', ...Array.from(new Set(alumniList.map((a) => a.industry)))],
    [alumniList]
  );
  const countries = useMemo(
    () => ['All', ...Array.from(new Set(alumniList.map((a) => a.country)))],
    [alumniList]
  );
  const companies = useMemo(
    () => ['All', ...Array.from(new Set(alumniList.map((a) => a.company)))],
    [alumniList]
  );

  const filtered = useMemo(() => {
    return alumniList.filter((alm) => {
      if (industryFilter !== 'All' && alm.industry !== industryFilter) return false;
      if (countryFilter !== 'All' && alm.country !== countryFilter) return false;
      if (companyFilter !== 'All' && alm.company !== companyFilter) return false;
      if (
        roleFilter !== 'All' &&
        !alm.jobTitle.toLowerCase().includes(roleFilter.toLowerCase())
      ) {
        return false;
      }
      if (
        expertiseFilter !== 'All' &&
        !alm.skills.some((s) => s.toLowerCase().includes(expertiseFilter.toLowerCase()))
      ) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          alm.name.toLowerCase().includes(q) ||
          alm.company.toLowerCase().includes(q) ||
          alm.degree.toLowerCase().includes(q) ||
          alm.skills.some((s) => s.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [
    alumniList,
    industryFilter,
    countryFilter,
    companyFilter,
    roleFilter,
    expertiseFilter,
    search,
  ]);

  // DEDICATED ALUMNI PROFILE EXPERIENCE
  if (selectedAlumni) {
    const isConnected = connectedAlumniIds.includes(selectedAlumni.id);

    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setFocusedEntityId(null)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Alumni Network Directory</span>
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <DemoAvatar
                seed={selectedAlumni.avatarSeed}
                name={selectedAlumni.name}
                size="xl"
                showDemoTag
              />
              <div>
                <p className="text-xs font-semibold text-amber-700">
                  {selectedAlumni.verificationLabel}
                </p>
                <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{selectedAlumni.name}</h1>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  {selectedAlumni.jobTitle} · {selectedAlumni.company}
                </p>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 mt-2">
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    Class of {selectedAlumni.graduationYear} · {selectedAlumni.degree}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    {selectedAlumni.country}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => toggleConnectAlumni(selectedAlumni.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isConnected
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-[#2563EB] hover:bg-blue-700 text-white'
                }`}
              >
                {isConnected ? 'Connected (Demo) ✓' : 'Connect with Alumni'}
              </button>
              <button
                type="button"
                onClick={() => setGuidanceModalAlumni(selectedAlumni)}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700"
              >
                Request Professional Guidance
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-2">Alumni Biography</h2>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedAlumni.bio}</p>
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-2">Professional Expertise</h2>
                <p className="text-sm text-slate-700">{selectedAlumni.skills.join(' · ')}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CalendarCheck className="w-4 h-4 text-blue-600" />
                    Mentoring Availability
                  </p>
                  <p className="text-slate-600">
                    {selectedAlumni.openToMentoring
                      ? 'Open to 30-min student career consultations.'
                      : 'Currently at mentoring capacity.'}
                  </p>
                  {selectedAlumni.openToMentoring && (
                    <button
                      type="button"
                      onClick={() => navigate('mentor-booking')}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Book Mentoring →
                    </button>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-indigo-600" />
                    Workshop Participation
                  </p>
                  <p className="text-slate-600">
                    {selectedAlumni.hostsWorkshops
                      ? 'Hosts alumni career talks & portfolio clinics.'
                      : 'Active in Q&A community threads.'}
                  </p>
                  {selectedAlumni.hostsWorkshops && (
                    <button
                      type="button"
                      onClick={() => navigate('workshops')}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Explore Alumni Workshops →
                    </button>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-emerald-600" />
                    Referral Discussions
                  </p>
                  <p className="text-slate-600">
                    {selectedAlumni.openToReferrals
                      ? 'Open to reviewing aligned portfolios (non-guaranteed).'
                      : 'Not accepting referral inquiries right now.'}
                  </p>
                  {selectedAlumni.openToReferrals && (
                    <button
                      type="button"
                      onClick={() => navigate('referrals')}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Open Referrals Hub →
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  <CompanyLogo
                    logoKey={selectedAlumni.logoKey}
                    companyName={selectedAlumni.company}
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{selectedAlumni.company}</p>
                    <p className="text-[11px] text-slate-500">{selectedAlumni.industry}</p>
                  </div>
                </div>
                {selectedAlumni.relevantOpenRoles && (
                  <div className="pt-2 border-t border-slate-200 text-xs">
                    <p className="font-semibold text-slate-800 mb-1">Related Sample Roles:</p>
                    {selectedAlumni.relevantOpenRoles.map((r) => (
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
            </div>
          </div>
        </div>

        <Modal
          open={Boolean(guidanceModalAlumni)}
          onClose={() => setGuidanceModalAlumni(null)}
          title={`Request Guidance from ${guidanceModalAlumni?.name}`}
          subtitle="Simulated Alumni Career Advice Request"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              showToast(`Guidance message sent to ${guidanceModalAlumni?.name} (Demo)`);
              setGuidanceMessage('');
              setGuidanceModalAlumni(null);
            }}
            className="space-y-4"
          >
            <textarea
              rows={4}
              required
              value={guidanceMessage}
              onChange={(e) => setGuidanceMessage(e.target.value)}
              placeholder="Introduce your degree, career goal, and one specific question..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setGuidanceModalAlumni(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
              >
                Send Demo Request
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // ALUMNI NETWORK DIRECTORY
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Alumni Network</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Connect with graduate mentors across Malaysia, Singapore, and the UK for career guidance,
          alumni workshops, and industry perspective.
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <span>
          <strong>Simulated Alumni Notice:</strong> Every alumni profile in this prototype is a
          clearly marked fictional demonstration profile created for hackathon evaluation and does
          not represent real individuals without consent.
        </span>
      </div>

      {/* Search + 5 Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alumni by name, graduation degree, company, or skill..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            aria-label="Industry"
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50"
          >
            {industries.map((i) => (
              <option key={i} value={i}>
                {i === 'All' ? 'Industry: All' : i}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Job Role"
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50"
          >
            <option value="All">Job Role: All</option>
            <option value="Engineer">Software / Cloud / ML Engineer</option>
            <option value="Manager">Manager / Product Lead</option>
            <option value="Analyst">Consulting / Analytics</option>
          </select>

          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            aria-label="Country"
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50"
          >
            {countries.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'Country: All' : c}
              </option>
            ))}
          </select>

          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            aria-label="Company"
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50"
          >
            {companies.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'Company: All' : c}
              </option>
            ))}
          </select>

          <select
            value={expertiseFilter}
            onChange={(e) => setExpertiseFilter(e.target.value)}
            aria-label="Expertise"
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50"
          >
            <option value="All">Expertise: All</option>
            <option value="Python">Python & AI</option>
            <option value="Cloud">Cloud & DevSecOps</option>
            <option value="SQL">SQL & FinTech</option>
            <option value="Go">Distributed Backend</option>
          </select>
        </div>
      </div>

      {/* Alumni Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((alm) => {
          const isConnected = connectedAlumniIds.includes(alm.id);
          return (
            <article
              key={alm.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:border-blue-400 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <DemoAvatar seed={alm.avatarSeed} name={alm.name} size="lg" showDemoTag />
                    <div>
                      <p className="text-[11px] font-medium text-amber-700">
                        {alm.verificationLabel}
                      </p>
                      <button
                        type="button"
                        onClick={() => setFocusedEntityId(alm.id)}
                        className="text-left text-base font-bold text-slate-900 hover:text-blue-600 mt-0.5"
                      >
                        {alm.name}
                      </button>
                      <p className="text-xs font-medium text-slate-700">
                        {alm.jobTitle} · {alm.company}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Class of {alm.graduationYear} · {alm.degree} · {alm.country}
                      </p>
                    </div>
                  </div>
                  <CompanyLogo logoKey={alm.logoKey} companyName={alm.company} size="sm" />
                </div>

                <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                  {alm.bio}
                </p>

                <p className="text-xs text-slate-500 mt-2.5">
                  <strong className="text-slate-700">Skills:</strong> {alm.skills.join(' · ')}
                </p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 mt-2.5">
                  {alm.openToMentoring && <span>Mentoring Open</span>}
                  {alm.hostsWorkshops && <span>· Workshop Speaker</span>}
                  {alm.openToReferrals && <span>· Open to Referral Chats</span>}
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setFocusedEntityId(alm.id)}
                  className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Open Alumni Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleConnectAlumni(alm.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isConnected
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-[#2563EB] hover:bg-blue-700 text-white'
                  }`}
                >
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Connected
                    </span>
                  ) : (
                    'Connect'
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
