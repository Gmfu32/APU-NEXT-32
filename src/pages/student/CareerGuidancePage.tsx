import React, { useState } from 'react';
import { ArrowRight, CalendarCheck, CheckCircle2, Compass } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CAREER_GUIDANCE_PATHS, MENTOR_PROFILES } from '../../data/mentorsAndWorkshops';
import { DemoAvatar } from '../../components/common/DemoAvatar';

export const CareerGuidancePage: React.FC = () => {
  const { navigate } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    'All',
    'CV guidance',
    'Job application preparation',
    'Interview preparation',
    'Career transitions',
    'Professional development',
  ];

  const visiblePaths = CAREER_GUIDANCE_PATHS.filter(
    (p) => selectedCategory === 'All' || p.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Career Guidance & Roadmaps</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Structured career playbooks paired with 1-on-1 guidance sessions hosted by demonstration
          lecturers and alumni mentors.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 w-fit">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-[#0D1526] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {cat === 'All' ? 'All Guidance Areas' : cat}
          </button>
        ))}
      </div>

      {/* Guidance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {visiblePaths.map((path) => {
          const mentor = MENTOR_PROFILES.find((m) => m.id === path.recommendedMentorId);
          return (
            <section
              key={path.id}
              className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                  <Compass className="w-4 h-4" />
                  <span className="capitalize">{path.category}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">{path.title}</h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{path.summary}</p>

                <div className="pt-2 space-y-2">
                  <p className="text-xs font-bold text-slate-800">Actionable Milestones:</p>
                  {path.milestones.map((ms) => (
                    <div key={ms} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{ms}</span>
                    </div>
                  ))}
                </div>
              </div>

              {mentor && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <DemoAvatar seed={mentor.avatarSeed} name={mentor.name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{mentor.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{mentor.sessionType}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('mentor-booking', mentor.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Book Session</span>
                  </button>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Career Paths Comparison Strip */}
      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Popular Graduate Career Pathways
            </h2>
            <p className="text-xs text-slate-500">
              Compare core skill expectations before booking a lecturer or alumni mentor
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('resources')}
            className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            <span>Open Resource Playbooks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <p className="font-bold text-slate-900 text-sm">Software & Cloud Engineering</p>
            <p className="text-slate-600">
              Clean Git workflows, TypeScript/Python APIs, automated testing, and container deployment.
            </p>
            <p className="text-slate-500 pt-1">Typical entry: 16-weekSWE Intern → Associate Engineer</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <p className="font-bold text-slate-900 text-sm">Applied AI & Data Analytics</p>
            <p className="text-slate-600">
              SQL fluency, data hygiene, reproducible ML evaluation, and clear stakeholder dashboards.
            </p>
            <p className="text-slate-500 pt-1">Typical entry: Data / AI Intern → Junior Data Scientist</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <p className="font-bold text-slate-900 text-sm">Technology & Cyber Advisory</p>
            <p className="text-slate-600">
              Structured problem framing, ISO/cloud governance, security controls, and executive writing.
            </p>
            <p className="text-slate-500 pt-1">Typical entry: Risk / Tech Intern → Consulting Analyst</p>
          </div>
        </div>
      </section>
    </div>
  );
};
