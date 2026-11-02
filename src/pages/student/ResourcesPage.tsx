import React, { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, FileText, PlayCircle, Search } from 'lucide-react';
import { CAREER_RESOURCES } from '../../data/mentorsAndWorkshops';
import { Modal } from '../../components/common/Modal';
import { CareerResource } from '../../types';
import { useApp } from '../../context/AppContext';

export const ResourcesPage: React.FC = () => {
  const { showToast } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [activeResource, setActiveResource] = useState<CareerResource | null>(null);

  const categories = [
    'All',
    'CV Templates',
    'Interview Guides',
    'Career Planning',
    'Internship Preparation',
    'Professional Communication',
    'Technical Learning',
    'Video Guides',
  ];

  const filtered = useMemo(() => {
    return CAREER_RESOURCES.filter((res) => {
      if (category !== 'All' && res.category !== category) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          res.title.toLowerCase().includes(q) ||
          res.summary.toLowerCase().includes(q) ||
          res.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [category, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Career Resources Library</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Searchable CV templates, technical interview guides, internship checklists, outreach
          scripts, and career videos.
        </p>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search CV templates, STAR guides, outreach emails, Python Git playbook..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                category === cat
                  ? 'bg-[#0D1526] text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((res) => (
          <article
            key={res.id}
            className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:border-blue-400 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>
                  {res.category} · {res.format}
                </span>
                <span className="font-mono tabular-nums">{res.readTime}</span>
              </div>
              <h2 className="text-base font-bold text-slate-900">{res.title}</h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{res.summary}</p>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setActiveResource(res)}
                className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1.5"
              >
                {res.format === 'Video Walkthrough' ? (
                  <PlayCircle className="w-4 h-4" />
                ) : (
                  <BookOpen className="w-4 h-4" />
                )}
                <span>Preview Guide</span>
              </button>

              <button
                type="button"
                onClick={() => showToast(`Downloaded ${res.title} (Demo Template)`)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 inline-flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Resource Reader Modal */}
      <Modal
        open={Boolean(activeResource)}
        onClose={() => setActiveResource(null)}
        title={activeResource?.title || 'Resource'}
        subtitle={activeResource ? `${activeResource.category} · ${activeResource.format}` : ''}
      >
        {activeResource && (
          <div className="space-y-4 text-xs">
            <p className="text-sm text-slate-700 leading-relaxed">{activeResource.summary}</p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <p className="font-bold text-slate-900">Key Checklist & Takeaways:</p>
              {activeResource.keyTakeaways.map((item) => (
                <div key={item} className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveResource(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 font-semibold text-slate-700"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast(`Saved ${activeResource.title} copy`);
                  setActiveResource(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold"
              >
                Download Sample Copy
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
