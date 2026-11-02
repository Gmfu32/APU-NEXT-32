import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Clock,
  Info,
  MapPin,
  Search,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CompanyLogo } from '../../components/common/CompanyLogo';
import { Modal } from '../../components/common/Modal';
import { Opportunity } from '../../types';

export const OpportunitiesPage: React.FC = () => {
  const {
    opportunities,
    savedOpportunityIds,
    toggleSaveOpportunity,
    appliedOpportunityMap,
    applyToOpportunity,
    focusedEntityId,
    setFocusedEntityId,
    studentProfile,
  } = useApp();

  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [roleTypeFilter, setRoleTypeFilter] = useState('All');
  const [degreeFilter, setDegreeFilter] = useState('All');
  const [experienceFilter, setExperienceFilter] = useState('All');
  const [savedOnly, setSavedOnly] = useState(false);

  const [applyingOpp, setApplyingOpp] = useState<Opportunity | null>(null);
  const [coverNote, setCoverNote] = useState('');

  // Only show Approved listings to students (plus employer-posted ones if approved)
  const visibleOpportunities = useMemo(
    () => opportunities.filter((o) => o.approvalStatus !== 'Changes Requested'),
    [opportunities]
  );

  const selectedOpportunity = useMemo(
    () => visibleOpportunities.find((o) => o.id === focusedEntityId) || null,
    [visibleOpportunities, focusedEntityId]
  );

  const industries = useMemo(
    () => ['All', ...Array.from(new Set(visibleOpportunities.map((o) => o.industry)))],
    [visibleOpportunities]
  );

  const filtered = useMemo(() => {
    return visibleOpportunities.filter((opp) => {
      if (savedOnly && !savedOpportunityIds.includes(opp.id)) return false;
      if (industryFilter !== 'All' && opp.industry !== industryFilter) return false;
      if (
        locationFilter !== 'All' &&
        !opp.location.toLowerCase().includes(locationFilter.toLowerCase()) &&
        opp.workMode !== locationFilter
      ) {
        return false;
      }
      if (roleTypeFilter !== 'All' && opp.roleType !== roleTypeFilter) return false;
      if (
        degreeFilter !== 'All' &&
        !opp.degreeTarget.toLowerCase().includes(degreeFilter.toLowerCase())
      ) {
        return false;
      }
      if (
        experienceFilter !== 'All' &&
        !opp.experienceLevel.toLowerCase().includes(experienceFilter.toLowerCase())
      ) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const hit =
          opp.title.toLowerCase().includes(q) ||
          opp.company.toLowerCase().includes(q) ||
          opp.skills.some((s) => s.toLowerCase().includes(q)) ||
          opp.summary.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [
    visibleOpportunities,
    savedOnly,
    savedOpportunityIds,
    industryFilter,
    locationFilter,
    roleTypeFilter,
    degreeFilter,
    experienceFilter,
    search,
  ]);

  const handleConfirmApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingOpp) return;
    applyToOpportunity(applyingOpp.id, coverNote);
    setApplyingOpp(null);
    setCoverNote('');
  };

  // INDIVIDUAL OPPORTUNITY DETAIL VIEW
  if (selectedOpportunity) {
    const isSaved = savedOpportunityIds.includes(selectedOpportunity.id);
    const appliedInfo = appliedOpportunityMap[selectedOpportunity.id];

    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setFocusedEntityId(null)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Opportunities</span>
        </button>

        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <CompanyLogo
                logoKey={selectedOpportunity.logoKey}
                companyName={selectedOpportunity.company}
                size="lg"
              />
              <div>
                <p className="text-xs font-medium text-slate-500">
                  {selectedOpportunity.company} · Sample Demonstration Listing
                </p>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  {selectedOpportunity.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600 mt-2">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedOpportunity.location} ({selectedOpportunity.workMode})
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedOpportunity.roleType}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedOpportunity.duration}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{selectedOpportunity.allowance}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => toggleSaveOpportunity(selectedOpportunity.id)}
                className={`px-4 py-2.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-2 transition-colors ${
                  isSaved
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                <span>{isSaved ? 'Saved' : 'Save Opportunity'}</span>
              </button>

              {appliedInfo ? (
                <div className="px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{appliedInfo.status}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setApplyingOpp(selectedOpportunity)}
                  className="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                >
                  Apply Now (Demo)
                </button>
              )}
            </div>
          </div>

          {/* Match Explanation Box */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Why this role matches your profile ({selectedOpportunity.matchScore}% Fit)
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {selectedOpportunity.matchExplanation}
                </p>
              </div>
            </div>
            <p className="text-xs font-mono tabular-nums text-slate-600 shrink-0">
              Deadline: <strong>{selectedOpportunity.deadline}</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-2">Role Overview</h2>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selectedOpportunity.summary}
                </p>
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-2">Key Responsibilities</h2>
                <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                  {selectedOpportunity.responsibilities.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-2">Candidate Requirements</h2>
                <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                  {selectedOpportunity.requirements.map((req) => (
                    <li key={req}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <h3 className="font-bold text-slate-900 text-sm">Listing Details</h3>
                <div>
                  <span className="text-slate-400 block">Target Degree</span>
                  <span className="font-semibold text-slate-800">
                    {selectedOpportunity.degreeTarget}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Academic Level</span>
                  <span className="font-semibold text-slate-800">
                    {selectedOpportunity.experienceLevel}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Placement Duration</span>
                  <span className="font-semibold text-slate-800">
                    {selectedOpportunity.duration}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Core Skills</span>
                  <span className="font-semibold text-slate-800">
                    {selectedOpportunity.skills.join(' · ')}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 leading-relaxed">
                <strong>Demonstration Disclaimer:</strong> This sample vacancy is created solely to
                demonstrate APU NEXT discovery and matching workflows. It does not represent an
                official university partnership or active employer vacancy.
              </div>
            </div>
          </div>
        </div>

        <Modal
          open={Boolean(applyingOpp)}
          onClose={() => setApplyingOpp(null)}
          title={applyingOpp ? `Apply to ${applyingOpp.company} (Demo)` : 'Apply'}
          subtitle={applyingOpp?.title}
        >
          <form onSubmit={handleConfirmApply} className="space-y-4">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">Applicant Snapshot</p>
              <p className="text-slate-600">
                {studentProfile.name} · {studentProfile.degree} ({studentProfile.cgpa})
              </p>
              <p className="text-slate-500">
                Attached CV: {studentProfile.cvFileName || 'Profile Summary Only (No PDF attached)'}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Short Note to Hiring Team (Optional)
              </label>
              <textarea
                rows={3}
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Highlight your relevant project or placement availability dates..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setApplyingOpp(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
              >
                Submit Demo Application
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // DIRECTORY VIEW
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Internship & Graduate Opportunities
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Explore {visibleOpportunities.length} realistic demonstration placements and graduate
            programmes matched to your profile.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-slate-200 self-start">
          <button
            type="button"
            onClick={() => setSavedOnly(false)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              !savedOnly ? 'bg-[#0D1526] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Listings ({visibleOpportunities.length})
          </button>
          <button
            type="button"
            onClick={() => setSavedOnly(true)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              savedOnly ? 'bg-[#0D1526] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Saved ({savedOpportunityIds.length})
          </button>
        </div>
      </div>

      {/* Clear Demo Disclaimer */}
      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-2.5 text-xs text-slate-700">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <span>
          <strong>Demonstration Listings:</strong> All company vacancies below are realistic sample
          listings built for prototype evaluation. Named organisations have not published these
          sample listings or endorsed this independent student prototype.
        </span>
      </div>

      {/* Search & Multi-Faceted Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by role title, company (e.g. Google, PETRONAS, Maybank), or skill (Python, SQL, React)..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            aria-label="Filter by Industry"
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
          >
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind === 'All' ? 'Industry: All' : ind}
              </option>
            ))}
          </select>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            aria-label="Filter by Location"
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="All">Location: All</option>
            <option value="Kuala Lumpur">Kuala Lumpur</option>
            <option value="Selangor">Selangor / PJ / Cyberjaya</option>
            <option value="Penang">Penang</option>
            <option value="Hybrid">Hybrid Work Mode</option>
          </select>

          <select
            value={roleTypeFilter}
            onChange={(e) => setRoleTypeFilter(e.target.value)}
            aria-label="Filter by Role Type"
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="All">Role Type: All</option>
            <option value="Internship">Internship</option>
            <option value="Industrial Placement">Industrial Placement</option>
            <option value="Graduate Role">Graduate Role</option>
          </select>

          <select
            value={degreeFilter}
            onChange={(e) => setDegreeFilter(e.target.value)}
            aria-label="Filter by Degree"
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="All">Degree: All Disciplines</option>
            <option value="Computer Science">Computer Science / AI</option>
            <option value="Software">Software Engineering</option>
            <option value="Data">Data Science & Analytics</option>
            <option value="Cyber">Cybersecurity & Cloud</option>
            <option value="FinTech">Finance / Accounting / FinTech</option>
          </select>

          <select
            value={experienceFilter}
            onChange={(e) => setExperienceFilter(e.target.value)}
            aria-label="Filter by Experience"
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="All">Experience: All Years</option>
            <option value="Year 2">Year 2 Undergraduate</option>
            <option value="Year 3">Year 3 Industrial Training</option>
            <option value="Final">Final Year / Graduate</option>
          </select>
        </div>
      </div>

      {/* Results List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-3">
          <p className="text-sm font-bold text-slate-900">No matching demonstration listings</p>
          <p className="text-xs text-slate-500">
            Try clearing one or more filters to view all 15 sample internships and graduate roles.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setIndustryFilter('All');
              setLocationFilter('All');
              setRoleTypeFilter('All');
              setDegreeFilter('All');
              setExperienceFilter('All');
              setSavedOnly(false);
            }}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((opp) => {
            const isSaved = savedOpportunityIds.includes(opp.id);
            const applied = appliedOpportunityMap[opp.id];

            return (
              <article
                key={opp.id}
                className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:border-blue-400 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <CompanyLogo logoKey={opp.logoKey} companyName={opp.company} />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">
                          {opp.company} · Demo Listing
                        </p>
                        <button
                          type="button"
                          onClick={() => setFocusedEntityId(opp.id)}
                          className="text-left text-base font-bold text-slate-900 hover:text-blue-600 mt-0.5 line-clamp-1"
                        >
                          {opp.title}
                        </button>
                      </div>
                    </div>
                    <span className="text-xs font-mono tabular-nums font-bold text-emerald-700 shrink-0">
                      {opp.matchScore}% Match
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mt-3">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {opp.location} ({opp.workMode})
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{opp.roleType}</span>
                    <span aria-hidden="true">·</span>
                    <span>{opp.duration}</span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                    {opp.summary}
                  </p>

                  <p className="text-[11px] text-blue-700 bg-blue-50/70 rounded-lg px-3 py-1.5 mt-3">
                    <strong>Match reason:</strong> {opp.matchExplanation}
                  </p>

                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mt-3">
                    <span className="truncate">{opp.skills.join(' · ')}</span>
                    <span className="font-mono tabular-nums inline-flex items-center gap-1 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {opp.deadline}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSaveOpportunity(opp.id)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        isSaved ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                      <span>{isSaved ? 'Saved' : 'Save'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFocusedEntityId(opp.id)}
                      className="text-xs font-semibold text-slate-700 hover:text-blue-600"
                    >
                      View Details
                    </button>
                  </div>

                  {applied ? (
                    <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {applied.status}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setApplyingOpp(opp)}
                      className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                      Apply (Demo)
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Quick Apply Modal from Directory */}
      <Modal
        open={Boolean(applyingOpp)}
        onClose={() => setApplyingOpp(null)}
        title={applyingOpp ? `Apply to ${applyingOpp.company} (Demo)` : 'Apply'}
        subtitle={applyingOpp?.title}
      >
        <form onSubmit={handleConfirmApply} className="space-y-4">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
            <p className="font-bold text-slate-900">Profile & CV Attached</p>
            <p className="text-slate-600">
              {studentProfile.name} · {studentProfile.degree} · CGPA {studentProfile.cgpa}
            </p>
            <p className="text-slate-500">
              CV: {studentProfile.cvFileName || 'Using APU NEXT Profile (Optional CV not attached)'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Application Note (Optional)
            </label>
            <textarea
              rows={3}
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              placeholder="Briefly introduce your relevant projects and placement dates..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setApplyingOpp(null)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
            >
              Confirm Demo Application
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
