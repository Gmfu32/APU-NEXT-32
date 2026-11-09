import React, { useState } from 'react';
import { ArrowRight, Bot, BookOpen, Send, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StudentPageId } from '../../types';

type GuideMessage = { from: 'student' | 'guide'; text: string; link?: StudentPageId; label?: string };

const QUICK_QUESTIONS = [
  'How do I find an internship?',
  'How do I prepare my CV?',
  'Where do I submit my internship report?',
];

function getGuideReply(question: string): GuideMessage {
  const q = question.toLowerCase();
  if (q.includes('cv') || q.includes('resume') || q.includes('cover letter')) {
    return {
      from: 'guide',
      text: 'Start with the Career Guidance page for CV and cover letter learning paths, then use Career Resources for practical templates. This prototype does not yet use the official APU handbook.',
      link: 'career-guidance',
      label: 'Open Career Guidance',
    };
  }
  if (q.includes('report') || q.includes('offer') || q.includes('supervisor') || q.includes('internship')) {
    return {
      from: 'guide',
      text: 'Explore approved opportunities, log applications from your profile, and use Internship Management to review the sample placement steps. Confirm official deadlines with the Career Centre while handbook links are being connected.',
      link: 'opportunities',
      label: 'Open opportunities',
    };
  }
  return {
    from: 'guide',
    text: 'I can point you to internship opportunities, career guidance, resources, or the sample internship tracker. Official handbook answers will be added when the handbook is connected.',
    link: 'career-guidance',
    label: 'Explore career guidance',
  };
}

export const FloatingAssistant: React.FC = () => {
  const { role, showAuthModal, navigate } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<GuideMessage[]>([
    { from: 'guide', text: 'Hi! I can help you find the right APU NEXT page for your internship journey. Ask me about opportunities, CV preparation, or reports.' },
  ]);

  if (role !== 'student' || showAuthModal) return null;

  const send = (question: string) => {
    const clean = question.trim();
    if (!clean) return;
    setMessages((current) => [...current, { from: 'student', text: clean }, getGuideReply(clean)]);
    setDraft('');
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open && (
        <section className="mb-3 flex h-[min(520px,70vh)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" aria-label="APU NEXT guide">
          <header className="flex items-center justify-between bg-[#0D1526] px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600"><Bot className="h-5 w-5" /></span>
              <div><p className="text-sm font-bold">APU NEXT Guide</p><p className="text-[11px] text-slate-300">Prototype assistant</p></div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Close assistant"><X className="h-4 w-4" /></button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3.5">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-900">Demo guidance only. The official handbook is not connected yet.</div>
            {messages.map((message, index) => (
              <div key={`${message.from}-${index}`} className={`max-w-[92%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed ${message.from === 'student' ? 'ml-auto bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>
                <p>{message.text}</p>
                {message.link && <button type="button" onClick={() => { navigate(message.link!); setOpen(false); }} className="mt-2 inline-flex items-center gap-1 font-bold text-blue-700 hover:underline">{message.label}<ArrowRight className="h-3 w-3" /></button>}
              </div>
            ))}
            {messages.length === 1 && <div className="flex flex-wrap gap-1.5">{QUICK_QUESTIONS.map((question) => <button key={question} type="button" onClick={() => send(question)} className="rounded-full border border-blue-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-50">{question}</button>)}</div>}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); send(draft); }} className="flex gap-2 border-t border-slate-200 bg-white p-3">
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about your internship journey..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-400" />
            <button type="submit" disabled={!draft.trim()} className="rounded-xl bg-blue-600 p-2.5 text-white disabled:opacity-40" aria-label="Send message"><Send className="h-4 w-4" /></button>
          </form>
          <button type="button" onClick={() => { navigate('ai-assistant'); setOpen(false); }} className="flex items-center justify-center gap-1.5 border-t border-slate-100 py-2 text-[11px] font-semibold text-slate-500 hover:text-blue-700"><BookOpen className="h-3.5 w-3.5" /> Open full assistant</button>
        </section>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} className="ml-auto flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-700" aria-label={open ? 'Close APU NEXT assistant' : 'Open APU NEXT assistant'}>
        {open ? <X className="h-5 w-5" /> : <><Bot className="h-5 w-5" /><span>Ask APU NEXT</span></>}
      </button>
    </div>
  );
};
