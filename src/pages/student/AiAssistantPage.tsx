import React, { useState } from 'react';
import { Bot, BookOpen, Info, RotateCcw, Send, ThumbsDown, ThumbsUp } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: { title: string; section: string }[];
  feedback?: 'helpful' | 'unhelpful' | null;
}

const SUGGESTED_QUESTIONS = [
  'What are the steps to confirm my Year 3 internship placement?',
  'How do I prepare for APU Career Fair 2026 booths?',
  'Which Student Package developer benefits require university email verification?',
  'What documents are required during my 16–20 week industrial training?',
  'How can I book a CV or FYP alignment session with a lecturer?',
  'Where can I check postgraduate Master’s scholarships?',
];

function buildSimulatedReply(prompt: string): {
  text: string;
  sources: { title: string; section: string }[];
} {
  const q = prompt.toLowerCase();

  if (q.includes('internship') || q.includes('confirm') || q.includes('document')) {
    return {
      text:
        '[Demonstration Response] In the APU NEXT prototype workflow, securing and completing industrial training follows 6 structured stages:\n\n1. Upload your provisional Offer Letter for scope and duration verification.\n2. Submit the signed Confirmation & Indemnity Form before Week 1.\n3. Record weekly hours in Progress Tracking and submit Interim Report 1 & Report 2.\n4. Complete Host Company Manager Evaluation, Attestation, and your Final Report (excluding any confidential employer code).',
      sources: [
        {
          title: 'Simulated Industrial Training Guide (Prototype Sample)',
          section: 'Section 4.2 · Placement Confirmation & Interim Deliverables',
        },
        {
          title: 'APU NEXT Internship Management Module',
          section: 'Documents & Reports Checklist',
        },
      ],
    };
  }

  if (q.includes('fair') || q.includes('booth')) {
    return {
      text:
        '[Demonstration Response] For the sample APU Career Fair 2026 showcase (20 Nov 2026):\n\n• Open the Career Fair page to filter the 10 demonstration booths by campus zone.\n• Click "Add to Itinerary" on companies aligned with your skills (such as Google Malaysia Booth A-01 or PETRONAS Digital Booth A-02).\n• Bring an ATS-clean 1-page CV from the Career Resources library with a scannable link to your GitHub portfolio.',
      sources: [
        {
          title: 'APU NEXT Career Fair 2026 Event Guide (Demo)',
          section: 'Central Atrium & Level 3 Spine Exhibitor Directory',
        },
      ],
    };
  }

  if (q.includes('package') || q.includes('github') || q.includes('benefit')) {
    return {
      text:
        '[Demonstration Response] Visit the Student Package page in the Main sidebar to explore developer and cloud benefits such as the GitHub Student Developer Pack, Azure for Students, Microsoft Learn Student Hub, DataCamp, and JetBrains licences.\n\nImportant: Promotional terms change over time—always click "Check Eligibility" on the official provider page and verify with your university email.',
      sources: [
        {
          title: 'APU NEXT Student Package Directory',
          section: 'Eligibility & Institutional Email Verification Notes',
        },
      ],
    };
  }

  if (q.includes('scholarship') || q.includes('master')) {
    return {
      text:
        '[Demonstration Response] You can filter Master’s programmes and full/partial scholarships by Country, University, Subject, and Funding Type on the Scholarships & Master’s page (including sample entries for Chevening, SINGA, Khazanah, Erasmus Mundus, and MEXT). Remember to request academic references from lecturers at least 3–4 weeks ahead of deadlines.',
      sources: [
        {
          title: 'Scholarships & Master’s Discovery Module (Demo)',
          section: 'Postgraduate Funding & Academic Reference Etiquette',
        },
      ],
    };
  }

  return {
    text:
      '[Demonstration Response] I can help you navigate APU NEXT modules including Internship Opportunities, Student Handbook & Placement Checklists (simulated), Lecturer & Mentor Booking, Career Workshops, Scholarships, and CV preparation.\n\nNote: Live LLM inference, SharePoint document indexing, and Retrieval-Augmented Generation (RAG) will be connected via the independent Python/FastAPI backend in the next development phase.',
    sources: [
      {
        title: 'APU NEXT Prototype Architecture Notes',
        section: 'Frontend RAG Interface Specification (Simulated Mode)',
      },
      {
        title: 'Career Centre Services Overview (Demo)',
        section: 'Student Support & Consultation Workflows',
      },
    ],
  };
}

export const AiAssistantPage: React.FC = () => {
  const initialGreeting: ChatMessage = {
    id: 'msg-welcome',
    sender: 'assistant',
    timestamp: 'Just now',
    text:
      'Hello! I am the APU NEXT AI Career & Handbook Assistant (Frontend Prototype Mode). Ask me about internship procedures, career fairs, scholarships, lecturer consultations, or application preparation.',
    sources: [
      {
        title: 'Simulated Knowledge Base Index (Demo Only)',
        section: 'Ready for future FastAPI + RAG / SharePoint backend connection',
      },
    ],
    feedback: null,
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);
  const [input, setInput] = useState('');
  const [selectedSourceMessageId, setSelectedSourceMessageId] = useState<string>('msg-welcome');

  const sendQuestion = (questionText: string) => {
    const clean = questionText.trim();
    if (!clean) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: clean,
      timestamp: 'Just now',
    };

    const reply = buildSimulatedReply(clean);
    const botId = `b-${Date.now() + 1}`;
    const botMsg: ChatMessage = {
      id: botId,
      sender: 'assistant',
      text: reply.text,
      timestamp: 'Just now',
      sources: reply.sources,
      feedback: null,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setSelectedSourceMessageId(botId);
    setInput('');
  };

  const setFeedback = (msgId: string, vote: 'helpful' | 'unhelpful') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedback: m.feedback === vote ? null : vote } : m))
    );
  };

  const activeSourceMsg =
    messages.find((m) => m.id === selectedSourceMessageId && m.sources) ||
    [...messages].reverse().find((m) => m.sources);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">APU NEXT AI Assistant</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Interactive career, placement procedure, and student handbook Q&A interface.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMessages([initialGreeting]);
            setSelectedSourceMessageId('msg-welcome');
          }}
          className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 self-start"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Conversation</span>
        </button>
      </div>

      {/* Honest RAG / Internal Document Disclaimer */}
      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <span>
          <strong>Prototype Demonstration Responses:</strong> This frontend interface uses clearly
          labelled local demonstration answers and sample citation cards. It is{' '}
          <strong>not</strong> connected to real university internal documents, SharePoint, or a
          live LLM API yet.
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Chat Interface */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 flex flex-col h-[580px]">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-slate-50 border border-slate-200 text-slate-800'
                  }`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 mb-1.5">
                      <Bot className="w-4 h-4" />
                      <span>APU NEXT Assistant (Demo)</span>
                    </div>
                  )}

                  <p className="whitespace-pre-line">{msg.text}</p>

                  {msg.sender === 'assistant' && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                      <button
                        type="button"
                        onClick={() => setSelectedSourceMessageId(msg.id)}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        View {msg.sources?.length || 0} Reference Card(s)
                      </button>

                      <div className="flex items-center gap-2">
                        <span>Helpful?</span>
                        <button
                          type="button"
                          onClick={() => setFeedback(msg.id, 'helpful')}
                          className={`p-1 rounded hover:bg-slate-200 ${
                            msg.feedback === 'helpful' ? 'text-emerald-600 bg-emerald-50' : ''
                          }`}
                          aria-label="Mark response helpful"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeedback(msg.id, 'unhelpful')}
                          className={`p-1 rounded hover:bg-slate-200 ${
                            msg.feedback === 'unhelpful' ? 'text-red-600 bg-red-50' : ''
                          }`}
                          aria-label="Mark response unhelpful"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Suggested Prompts + Input Box */}
          <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-50/60">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {SUGGESTED_QUESTIONS.slice(0, 3).map((sq) => (
                <button
                  key={sq}
                  type="button"
                  onClick={() => sendQuestion(sq)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors"
                >
                  {sq}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendQuestion(input);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about internship reports, career fairs, scholarships, or Student Package..."
                className="flex-1 px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>Ask</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel: Suggested Questions & Source-Reference Display Area */}
        <div className="space-y-5">
          <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Source-Reference Display (Simulated RAG)
              </h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              When connected to the planned Python/FastAPI RAG pipeline, verified handbook passages
              will render here with exact page numbers.
            </p>
            <div className="space-y-2.5 pt-1">
              {activeSourceMsg?.sources?.map((src) => (
                <div
                  key={src.title + src.section}
                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <p className="font-bold text-slate-900">{src.title}</p>
                  <p className="text-slate-500 mt-0.5">{src.section}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-2.5">
            <h2 className="text-sm font-bold text-slate-900">More Suggested Topics</h2>
            <div className="space-y-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendQuestion(q)}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-xs font-medium text-slate-700 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
