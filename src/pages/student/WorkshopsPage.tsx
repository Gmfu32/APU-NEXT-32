import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  Play,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DemoAvatar } from '../../components/common/DemoAvatar';

export const WorkshopsPage: React.FC = () => {
  const {
    workshops,
    registeredWorkshopIds,
    toggleWorkshopRegistration,
    focusedEntityId,
    setFocusedEntityId,
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const selectedWorkshop = useMemo(
    () => workshops.find((w) => w.id === focusedEntityId) || null,
    [workshops, focusedEntityId]
  );

  const categories = [
    'All',
    'Career Development',
    'Alumni-Led',
    'Lecturer-Led',
    'Industry Session',
    'Recorded Video',
  ];

  const visibleWorkshops = workshops.filter(
    (w) =>
      w.approvalStatus !== 'Pending Approval' &&
      (categoryFilter === 'All' || w.category === categoryFilter)
  );

  // INDIVIDUAL WORKSHOP DETAIL VIEW
  if (selectedWorkshop) {
    const isRegistered = registeredWorkshopIds.includes(selectedWorkshop.id);
    const isRecorded = selectedWorkshop.category === 'Recorded Video';

    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setFocusedEntityId(null)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Career Workshops & Video Resources</span>
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Video / Session Thumbnail Hero */}
          <div
            className={`bg-gradient-to-r ${selectedWorkshop.themeColor} text-white p-6 sm:p-10 relative`}
          >
            <div className="max-w-3xl space-y-4">
              <p className="text-xs font-semibold text-sky-300">
                {selectedWorkshop.category} · {selectedWorkshop.format} · Demo Session
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-balance">
                {selectedWorkshop.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-200 pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-sky-300" />
                  {selectedWorkshop.date}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-300" />
                  {selectedWorkshop.time} ({selectedWorkshop.duration})
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                  <Users className="w-4 h-4 text-sky-300" />
                  {selectedWorkshop.registeredCount}/{selectedWorkshop.capacity} participants
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Video Thumbnail Preview Card */}
              <div className="rounded-xl bg-slate-900 text-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">
                      {isRecorded
                        ? 'Recorded Workshop Resource Preview (Demo)'
                        : 'Live Session Stream & Calendar Link'}
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {isRecorded
                        ? 'Explore curated public interview/SQL learning videos or watch once backend media storage is connected.'
                        : 'Register to add the Teams/Auditorium pass to your student dashboard.'}
                    </p>
                  </div>
                </div>
                {selectedWorkshop.videoUrl && (
                  <a
                    href={selectedWorkshop.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-white text-slate-900 text-xs font-bold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                  >
                    <span>Open Video Topic</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-2">Session Overview</h2>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedWorkshop.summary}</p>
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-2">Session Agenda & Takeaways</h2>
                <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                  {selectedWorkshop.agenda.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center gap-3">
                  <DemoAvatar
                    seed={selectedWorkshop.speakerAvatarSeed}
                    name={selectedWorkshop.speakerName}
                    size="md"
                    showDemoTag
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {selectedWorkshop.speakerName}
                    </p>
                    <p className="text-[11px] text-slate-500">{selectedWorkshop.speakerRole}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleWorkshopRegistration(selectedWorkshop.id)}
                  className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                    isRegistered
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-[#2563EB] hover:bg-blue-700 text-white'
                  }`}
                >
                  {isRegistered ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Registered (Click to Cancel)</span>
                    </>
                  ) : (
                    <span>{isRecorded ? 'Bookmark Recording' : 'Register for Workshop'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // WORKSHOPS DIRECTORY
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Career Workshops & Events</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Register for live career workshops, alumni panels, lecturer FYP clinics, and on-demand
          video masterclasses.
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-2.5 text-xs text-slate-700">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <span>
          <strong>Demonstration Speakers & Sessions:</strong> All speaker names and workshop
          listings are fictional demonstration examples created for APU NEXT; no real university
          faculty are claimed without confirmation.
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 w-fit">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              categoryFilter === cat
                ? 'bg-[#0D1526] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {visibleWorkshops.map((ws) => {
          const isRegistered = registeredWorkshopIds.includes(ws.id);
          return (
            <article
              key={ws.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-blue-400 transition-colors"
            >
              <div>
                {/* Styled Workshop Thumbnail */}
                <button
                  type="button"
                  onClick={() => setFocusedEntityId(ws.id)}
                  className={`w-full h-36 bg-gradient-to-br ${ws.themeColor} text-white p-4 flex flex-col justify-between text-left relative group`}
                >
                  <div className="flex items-center justify-between w-full text-[11px] text-sky-200 font-medium">
                    <span>{ws.category}</span>
                    <span className="font-mono tabular-nums">{ws.duration}</span>
                  </div>
                  <div className="flex items-end justify-between gap-2 w-full">
                    <span className="text-xs font-semibold text-white/90 line-clamp-2">
                      {ws.format}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-white/15 group-hover:bg-blue-500 flex items-center justify-center shrink-0 transition-colors">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </button>

                <div className="p-5 space-y-3">
                  <button
                    type="button"
                    onClick={() => setFocusedEntityId(ws.id)}
                    className="text-left text-base font-bold text-slate-900 hover:text-blue-600 line-clamp-2"
                  >
                    {ws.title}
                  </button>

                  <div className="flex items-center gap-2.5">
                    <DemoAvatar seed={ws.speakerAvatarSeed} name={ws.speakerName} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{ws.speakerName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{ws.speakerRole}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {ws.summary}
                  </p>

                  <p className="text-xs font-mono tabular-nums text-slate-500">
                    {ws.date} · {ws.time}
                  </p>
                </div>
              </div>

              <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setFocusedEntityId(ws.id)}
                  className="text-xs font-semibold text-slate-700 hover:text-blue-600"
                >
                  Session Details
                </button>

                <button
                  type="button"
                  onClick={() => toggleWorkshopRegistration(ws.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    isRegistered
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-[#2563EB] hover:bg-blue-700 text-white'
                  }`}
                >
                  {isRegistered ? 'Registered ✓' : 'Register'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
