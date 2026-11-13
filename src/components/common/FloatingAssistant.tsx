import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bot, BookOpen, Mic, Plus, Send, Square, X } from 'lucide-react';
import { AssistantMarkdown } from './AssistantMarkdown';
import { useApp } from '../../context/AppContext';
import { StudentPageId } from '../../types';
import { askAssistant, assistantModeLabel, assistantSourceLabel } from '../../services/assistantService';
import type { AssistantMode, AssistantSource } from '../../services/assistantService';

type GuideMessage = { from: 'student' | 'guide'; text: string; link?: StudentPageId; label?: string; sources?: AssistantSource[]; mode?: AssistantMode; attachment?: string; failed?: boolean; retryQuestion?: string; retryFile?: File };
type RecognitionEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const QUICK_QUESTIONS = [
  'Does internship count towards my CGPA?',
  'What documents do I need to submit for Part 2?',
  'Who signs the Internship Placement Agreement?',
];
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ACCEPTED_ATTACHMENT = /\.(pdf|docx|txt)$/i;

export const FloatingAssistant: React.FC = () => {
  const { role, showAuthModal, navigate } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState('');
  const [listening, setListening] = useState(false);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<GuideMessage[]>([
    { from: 'guide', text: 'Hi, I’m APU NEXT. I can help with internships, CVs, reports, and career questions.' },
  ]);
  const fileInput = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => () => recognitionRef.current?.stop(), []);
  if (role !== 'student' || showAuthModal) return null;

  const send = async (question: string, fileOverride?: File) => {
    const clean = question.trim();
    const selectedFile = fileOverride ?? attachment;
    if ((!clean && !selectedFile) || sending) return;
    const attachedName = selectedFile?.name;
    const history = messages
      .filter(message => message !== messages[0] && !message.failed)
      .slice(-8)
      .map(message => ({ role: message.from === 'student' ? 'user' as const : 'assistant' as const, text: message.text }));
    setMessages(current => [...current, { from: 'student', text: clean || 'Please review this file.', attachment: attachedName }]);
    setDraft('');
    setAttachment(null);
    setAttachmentError('');
    setSending(true);
    try {
      const data = await askAssistant(clean || 'Please review this file.', history, selectedFile || undefined);
      setMessages(current => [...current, { from: 'guide', text: data.answer, sources: data.sources, mode: data.mode }]);
    } catch (error) {
      setMessages(current => [...current, {
        from: 'guide',
        text: error instanceof Error ? error.message : 'I couldn’t prepare an answer just now. Please try again.',
        failed: true,
        retryQuestion: clean || 'Please review this file.',
        retryFile: selectedFile || undefined,
      }]);
    } finally {
      setSending(false);
    }
  };

  const toggleMicrophone = () => {
    const speechWindow = window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages(current => [...current, { from: 'guide', text: 'Voice input is not supported by this browser. You can still type your question.' }]);
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = event => {
      const transcript = Array.from({ length: event.results.length }, (_, index) => event.results[index][0].transcript).join(' ').trim();
      if (transcript) setDraft(current => `${current} ${transcript}`.trim());
    };
    recognition.onerror = () => {
      setListening(false);
      setMessages(current => [...current, { from: 'guide', text: 'I could not hear that. Please check microphone permission and try again.' }]);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
      setMessages(current => [...current, { from: 'guide', text: 'The microphone could not start. Please try again.' }]);
    }
  };

  return <div className="fixed inset-0 z-50 pointer-events-none">
    {open && <aside className="pointer-events-auto absolute right-0 top-0 flex h-full w-full max-w-[390px] flex-col border-l border-slate-700 bg-[#242424] text-white shadow-2xl">
      <header className="flex items-center justify-between border-b border-white/10 bg-[#242424] px-5 py-4 text-white">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/10"><Bot size={21} /></span><div><p className="font-bold">APU NEXT</p><p className="text-xs text-slate-300">Your career companion</p></div></div>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Close APU NEXT"><X size={20} /></button>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto bg-[#242424] p-5">
        {messages.map((message, index) => <div key={`${message.from}-${index}`} className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.from === 'student' ? 'ml-auto bg-blue-600 text-white' : 'border border-white/10 bg-[#303030] text-slate-100 shadow-sm'}`}>
          {message.from === 'guide' ? <AssistantMarkdown dark>{message.text}</AssistantMarkdown> : <p className="whitespace-pre-wrap">{message.text}</p>}{message.attachment && <p className="mt-2 text-xs opacity-80">Attached: {message.attachment}</p>}
          {message.mode && <p className="mt-2 text-[11px] font-semibold text-slate-400">{assistantModeLabel(message.mode)}</p>}
          {message.sources && message.sources.length > 0 && <div className="mt-3 border-t border-white/10 pt-2 text-xs text-slate-400"><p className="font-bold text-slate-300">Sources</p>{message.sources.map(source => <p key={`${source.document}-${source.location}`} className="truncate">{assistantSourceLabel(source)}</p>)}</div>}
          {message.retryQuestion && <button type="button" onClick={() => void send(message.retryQuestion ?? '', message.retryFile)} className="mt-3 rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-blue-200 hover:bg-white/10">Retry</button>}
          {message.link && <button type="button" onClick={() => { navigate(message.link!); setOpen(false); }} className="mt-2 inline-flex items-center gap-1 font-bold text-blue-700">{message.label}<ArrowRight size={14} /></button>}
        </div>)}
        {sending && <div className="max-w-[92%] rounded-2xl border border-white/10 bg-[#303030] px-4 py-3 text-sm text-slate-300"><span className="inline-flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" /> APU NEXT is thinking…</span></div>}
        {messages.length === 1 && <div className="flex flex-wrap gap-2">{QUICK_QUESTIONS.map(question => <button key={question} type="button" onClick={() => void send(question)} className="rounded-full border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">{question}</button>)}</div>}
      </div>
      <form onSubmit={event => { event.preventDefault(); void send(draft); }} className="border-t border-white/10 bg-[#242424] p-4">
        {attachment && <div className="mb-3 flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-xs text-slate-200"><span className="truncate">{attachment.name}</span><button type="button" onClick={() => setAttachment(null)} aria-label="Remove attachment"><X size={14} /></button></div>}
        {attachment && <p className="mb-2 text-[11px] text-slate-300">The file is checked locally and is not saved by APU NEXT. Avoid uploading sensitive information.</p>}
        {attachmentError && <p role="alert" className="mb-2 text-xs text-rose-300">{attachmentError}</p>}
        <div className="flex items-center gap-2 rounded-2xl border border-slate-600 bg-[#2d2d2d] p-2 focus-within:border-blue-400">
          <button type="button" onClick={() => fileInput.current?.click()} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Attach file"><Plus size={19} /><input ref={fileInput} type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={event => { const selected = event.target.files?.[0] || null; setAttachmentError(selected && !ACCEPTED_ATTACHMENT.test(selected.name) ? 'Choose a PDF, DOCX, or TXT file.' : selected && selected.size > MAX_ATTACHMENT_BYTES ? 'Attachments must be 5 MB or smaller.' : ''); setAttachment(selected && ACCEPTED_ATTACHMENT.test(selected.name) && selected.size <= MAX_ATTACHMENT_BYTES ? selected : null); event.target.value = ''; }} /></button>
          <input value={draft} onChange={event => setDraft(event.target.value)} placeholder="Message APU NEXT..." className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-white outline-none placeholder:text-slate-400" />
          <button type="button" onClick={toggleMicrophone} className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${listening ? 'bg-rose-500/20 text-rose-300' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`} aria-label={listening ? 'Stop microphone' : 'Use microphone'}>{listening ? <Square size={15} /> : <Mic size={18} />}</button>
          <button type="submit" disabled={sending || (!draft.trim() && !attachment)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white disabled:opacity-40" aria-label="Send message"><Send size={17} /></button>
        </div>
      </form>
      <button type="button" onClick={() => { navigate('ai-assistant'); setOpen(false); }} className="flex items-center justify-center gap-2 border-t border-slate-100 py-3 text-xs font-semibold text-slate-500 hover:text-blue-700"><BookOpen size={15} /> Open full assistant</button>
    </aside>}
    <button type="button" onClick={() => setOpen(value => !value)} className="pointer-events-auto fixed bottom-6 right-6 grid h-16 w-16 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-900/30 transition hover:scale-105" aria-label={open ? 'Close APU NEXT' : 'Open APU NEXT'}>{open ? <X size={25} /> : <Bot size={29} />} {!open && <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />}</button>
  </div>;
};
