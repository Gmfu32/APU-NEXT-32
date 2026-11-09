import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  Pause,
  Play,
  Square,
} from 'lucide-react';
import {
  INTERVIEW_CATEGORIES,
  INTERVIEW_QUESTION_BANK,
  INTERVIEWER_PROFILES,
} from '../../data/mentorsAndWorkshops';
import { DemoAvatar } from '../../components/common/DemoAvatar';
import { InterviewerProfile } from '../../types';

export const InterviewPracticePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'mentors' | 'question-bank'>('mentors');

  const [activeSessionMentor, setActiveSessionMentor] = useState<InterviewerProfile | null>(null);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  useEffect(() => {
    if (!timerRunning) return;
    const handle = window.setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(handle);
  }, [timerRunning]);

  const sessionQuestions = useMemo(() => {
    if (!activeSessionMentor) return INTERVIEW_QUESTION_BANK;
    const catMatches = INTERVIEW_QUESTION_BANK.filter(
      (q) => q.category === activeSessionMentor.category
    );
    const generalMatches = INTERVIEW_QUESTION_BANK.filter(
      (q) => q.category === 'General graduate interviews' && q.category !== activeSessionMentor.category
    );
    return [...catMatches, ...generalMatches];
  }, [activeSessionMentor]);

  const startSession = (mentor: InterviewerProfile) => {
    setActiveSessionMentor(mentor);
    setSessionIndex(0);
    setAnswers({});
    setSecondsElapsed(0);
    setSessionCompleted(false);
    setTimerRunning(true);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (activeSessionMentor && sessionCompleted) {
    const answeredCount = sessionQuestions.filter(
      (q) => (answers[q.id] || '').trim().length > 0
    ).length;

    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => {
            setActiveSessionMentor(null);
            setSessionCompleted(false);
            setTimerRunning(false);
          }}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Interview Practice Hub</span>
        </button>

        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Practice Session Completed</span>
              </p>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">
                {activeSessionMentor.category} — Practice Summary
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Simulated Persona: {activeSessionMentor.name} · Duration:{' '}
                <span className="font-mono tabular-nums">{formatTimer(secondsElapsed)}</span> ·
                Responses drafted: {answeredCount}/{sessionQuestions.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => startSession(activeSessionMentor)}
              className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold self-start sm:self-center"
            >
              Practise Again
            </button>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Demonstration Feedback Notice:</strong> Automated LLM grading is not yet
              connected in this standalone frontend prototype. Below are curated rubric benchmarks
              so you can self-evaluate your drafted answers before FastAPI backend integration.
            </span>
          </div>

          <div className="space-y-5">
            {sessionQuestions.map((q, idx) => {
              const userDraft = answers[q.id] || '';
              return (
                <div key={q.id} className="rounded-xl border border-slate-200 p-5 space-y-3">
                  <p className="text-xs font-mono tabular-nums text-slate-500">
                    Question {idx + 1} · {q.difficulty}
                  </p>
                  <h2 className="text-sm font-bold text-slate-900">{q.prompt}</h2>

                  <div className="p-3.5 rounded-lg bg-slate-50 text-xs">
                    <p className="font-bold text-slate-700 mb-1">Your Drafted Response:</p>
                    <p className="text-slate-600 whitespace-pre-wrap">
                      {userDraft.trim() || '(No written response recorded during session)'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                    <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                      <p className="font-bold text-emerald-900">What Hiring Leads Look For</p>
                      <p className="text-slate-700 mt-1">{q.sampleFeedback.strengths}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100">
                      <p className="font-bold text-blue-900">Common Coaching Refinement</p>
                      <p className="text-slate-700 mt-1">{q.sampleFeedback.improvements}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="font-bold text-slate-900">Recommended Timing Structure</p>
                      <p className="text-slate-700 mt-1">{q.sampleFeedback.suggestedStructure}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (activeSessionMentor) {
    const currentQ = sessionQuestions[sessionIndex];

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl border border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <DemoAvatar seed={activeSessionMentor.avatarSeed} name={activeSessionMentor.name} size="sm" />
            <div>
              <p className="text-xs font-bold text-slate-900">{activeSessionMentor.name}</p>
              <p className="text-[11px] text-slate-500">
                {activeSessionMentor.category} Mock Session · Question {sessionIndex + 1} of{' '}
                {sessionQuestions.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-mono tabular-nums font-bold text-slate-900">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{formatTimer(secondsElapsed)}</span>
              <button
                type="button"
                onClick={() => setTimerRunning((prev) => !prev)}
                className="ml-1 text-slate-600 hover:text-slate-900"
                aria-label={timerRunning ? 'Pause timer' : 'Resume timer'}
              >
                {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setTimerRunning(false);
                setSessionCompleted(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>End Session</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div>
            <p className="text-xs font-medium text-blue-600">
              Question {sessionIndex + 1} · {currentQ.difficulty} Prompt
            </p>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-2 leading-relaxed">
              {currentQ.prompt}
            </h1>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <p className="font-bold text-slate-800">Checklist to Address in Your Answer:</p>
            <ul className="list-disc pl-5 text-slate-600 space-y-1">
              {currentQ.keyPointsToCover.map((pt) => (
                <li key={pt}>{pt}</li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Your Structured Answer / Speaking Notes
            </label>
            <textarea
              rows={7}
              value={answers[currentQ.id] || ''}
              onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
              placeholder="Structure your answer using Situation -> Task -> Action -> Result or Problem -> Architecture -> Trade-offs..."
              className="w-full p-4 text-sm rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={sessionIndex === 0}
              onClick={() => setSessionIndex((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2 rounded-lg border border-slate-300 disabled:opacity-40 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous Question</span>
            </button>

            {sessionIndex < sessionQuestions.length - 1 ? (
              <button
                type="button"
                onClick={() => setSessionIndex((prev) => prev + 1)}
                className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <span>Next Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setSessionCompleted(true);
                }}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                Finish & View Sample Rubric →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const visibleInterviewerCards = INTERVIEWER_PROFILES.filter(
    (p) => selectedCategory === 'All' || p.category === selectedCategory
  );
  const visibleQuestions = INTERVIEW_QUESTION_BANK.filter(
    (q) => selectedCategory === 'All' || q.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Interview Practice Studio</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Practise timed technical, analytical, consulting, and graduate competency interviews
            with structured rubric benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-slate-200 self-start">
          <button
            type="button"
            onClick={() => setActiveTab('mentors')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
              activeTab === 'mentors' ? 'bg-[#0D1526] text-white' : 'text-slate-600'
            }`}
          >
            Practice Tracks ({INTERVIEWER_PROFILES.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('question-bank')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
              activeTab === 'question-bank' ? 'bg-[#0D1526] text-white' : 'text-slate-600'
            }`}
          >
            Question Bank ({INTERVIEW_QUESTION_BANK.length})
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => setSelectedCategory('All')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
            selectedCategory === 'All' ? 'bg-[#2563EB] text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Categories
        </button>
        {INTERVIEW_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              selectedCategory === cat ? 'bg-[#2563EB] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {activeTab === 'mentors' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleInterviewerCards.map((card) => (
            <article
              key={card.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:border-blue-400 transition-colors"
            >
              <div>
                <div className="flex items-start gap-3.5">
                  <DemoAvatar seed={card.avatarSeed} name={card.name} size="lg" showDemoTag />
                  <div>
                    <p className="text-xs font-medium text-blue-600">{card.category}</p>
                    <h2 className="text-base font-bold text-slate-900 mt-0.5">{card.name}</h2>
                    <p className="text-xs text-slate-500">
                      {card.role} · {card.industry}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-3.5 leading-relaxed">{card.bio}</p>

                <p className="text-xs text-slate-500 mt-3">
                  <strong className="text-slate-700">Focus areas:</strong>{' '}
                  {card.expertise.join(' · ')}
                </p>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">{card.availability}</span>
                <button
                  type="button"
                  onClick={() => startSession(card)}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap transition-colors"
                >
                  Start Practice →
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleQuestions.map((q) => (
            <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {q.category} · {q.difficulty}
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-900">{q.prompt}</h2>
              <div className="p-3.5 rounded-lg bg-slate-50 text-xs space-y-1">
                <p className="font-bold text-slate-800">Sample Evaluation Rubric (Demo):</p>
                <p className="text-slate-600">{q.sampleFeedback.suggestedStructure}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
