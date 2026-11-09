import React, { useMemo, useState } from 'react';
import { Bookmark, Clock, ExternalLink, GraduationCap, Info, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SCHOLARSHIPS_AND_MASTERS } from '../../data/careerFairAndBenefits';

export const ScholarshipsPage: React.FC = () => {
  const { savedScholarshipIds, toggleSaveScholarship } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [universityFilter, setUniversityFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [fundingFilter, setFundingFilter] = useState('All');

  const countries = useMemo(
    () => ['All', ...Array.from(new Set(SCHOLARSHIPS_AND_MASTERS.map((s) => s.country)))],
    []
  );
  const institutions = useMemo(
    () => ['All', ...Array.from(new Set(SCHOLARSHIPS_AND_MASTERS.map((s) => s.institution)))],
    []
  );

  const filtered = useMemo(() => {
    return SCHOLARSHIPS_AND_MASTERS.filter((item) => {
      if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
      if (countryFilter !== 'All' && item.country !== countryFilter) return false;
      if (universityFilter !== 'All' && item.institution !== universityFilter) return false;
      if (
        subjectFilter !== 'All' &&
        !item.subjectArea.toLowerCase().includes(subjectFilter.toLowerCase())
      ) {
        return false;
      }
      if (fundingFilter !== 'All' && item.fundingType !== fundingFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hit =
          item.title.toLowerCase().includes(q) ||
          item.institution.toLowerCase().includes(q) ||
          item.subjectArea.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [categoryFilter, countryFilter, universityFilter, subjectFilter, fundingFilter, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Scholarships & Master’s Programmes</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Discover postgraduate Master’s pathways, international fellowships, and merit funding
          options for high-achieving graduates.
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-2.5 text-xs text-slate-700">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <span>
          <strong>Demonstration Directory:</strong> Deadlines, stipend figures, and eligibility
          summaries below are curated sample references. Always verify current intake terms directly
          on each scholarship body’s official website.
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Chevening, SINGA, Khazanah, AI, Cybersecurity..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200"
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
            {['All', 'Scholarship', "Master's Programme"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
                  categoryFilter === cat ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            aria-label="Filter by Country"
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
          >
            {countries.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'Country: All' : c}
              </option>
            ))}
          </select>

          <select
            value={universityFilter}
            onChange={(e) => setUniversityFilter(e.target.value)}
            aria-label="Filter by University"
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
          >
            {institutions.map((u) => (
              <option key={u} value={u}>
                {u === 'All' ? 'University / Body: All' : u}
              </option>
            ))}
          </select>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            aria-label="Filter by Subject"
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="All">Subject: All Fields</option>
            <option value="AI">Artificial Intelligence & Computing</option>
            <option value="Data">Data Science & Analytics</option>
            <option value="Cybersecurity">Cybersecurity</option>
            <option value="FinTech">Finance & FinTech</option>
          </select>

          <select
            value={fundingFilter}
            onChange={(e) => setFundingFilter(e.target.value)}
            aria-label="Filter by Funding Type"
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="All">Funding Type: All</option>
            <option value="Full Funding">Full Funding</option>
            <option value="Stipend + Tuition">Stipend + Tuition</option>
            <option value="Partial Tuition Waiver">Partial Tuition Waiver</option>
            <option value="Merit Bursary">Merit Bursary</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((item) => {
          const isSaved = savedScholarshipIds.includes(item.id);
          return (
            <article
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:border-blue-400 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">
                        {item.category} · {item.country} · {item.fundingType}
                      </p>
                      <h2 className="text-base font-bold text-slate-900 mt-0.5">{item.title}</h2>
                      <p className="text-xs font-medium text-slate-600 mt-0.5">
                        {item.institution}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-3 rounded-lg bg-slate-50 text-xs text-slate-700">
                  <p>
                    <strong>Coverage:</strong> {item.awardValue}
                  </p>
                  <p className="mt-1 text-slate-600">
                    <strong>Eligibility:</strong> {item.eligibilitySummary}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Field: {item.subjectArea}</span>
                  <span className="font-mono tabular-nums inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Deadline: {item.deadline}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => toggleSaveScholarship(item.id)}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                    isSaved ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                  <span>{isSaved ? 'Saved' : 'Save Opportunity'}</span>
                </button>

                <a
                  href={item.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <span>Official Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
