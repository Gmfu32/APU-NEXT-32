import React, { useRef, useState } from 'react';
import { Bot, Mic, Paperclip, RotateCcw, Send, Square, X } from 'lucide-react';
import { AssistantMarkdown } from '../../components/common/AssistantMarkdown';
import { askAssistant, assistantModeLabel, assistantSourceLabel } from '../../services/assistantService';
import type { AssistantMode, AssistantSource } from '../../services/assistantService';

type Message = { id: string; sender: 'user' | 'assistant'; text: string; sources?: AssistantSource[]; mode?: AssistantMode; attachment?: string; failed?: boolean; retryQuestion?: string; retryFile?: File };
type RecognitionEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
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

export const AiAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([{ id: 'welcome', sender: 'assistant', text: 'Hi, I’m APU NEXT. Ask me about internships, CVs, reports, or career preparation.' }]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [listening, setListening] = useState(false);
  const [sending, setSending] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const askQuestion = async (question: string, fileOverride?: File) => {
    const selectedFile = fileOverride ?? file;
    if ((!question && !selectedFile) || sending) return;
    const attachment = selectedFile?.name;
    const history = messages
      .filter(message => message.id !== 'welcome' && !message.failed)
      .slice(-8)
      .map(message => ({ role: message.sender, text: message.text }));
    setMessages(current => [...current, { id: `u-${Date.now()}`, sender: 'user', text: question || 'Please review this file.', attachment }]);
    setInput('');
    setFile(null);
    setFileError('');
    setSending(true);
    try {
      const data = await askAssistant(question || 'Please review this file.', history, selectedFile || undefined);
      setMessages(current => [...current, { id: `a-${Date.now()}`, sender: 'assistant', text: data.answer, sources: data.sources, mode: data.mode }]);
    } catch (error) {
      setMessages(current => [...current, {
        id: `e-${Date.now()}`,
        sender: 'assistant',
        text: error instanceof Error ? error.message : 'I couldn’t prepare an answer just now. Please try again.',
        failed: true,
        retryQuestion: question || 'Please review this file.',
        retryFile: selectedFile || undefined,
      }]);
    } finally {
      setSending(false);
    }
  };

  const ask = () => askQuestion(input.trim());

  const useMic = () => {
    const speechWindow = window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setMessages(current => [...current, { id: `e-${Date.now()}`, sender: 'assistant', text: 'Voice input is not supported by this browser. You can still type your question.' }]);
      return;
    }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = event => {
      const transcript = Array.from({ length: event.results.length }, (_, index) => event.results[index][0].transcript).join(' ').trim();
      if (transcript) setInput(current => `${current} ${transcript}`.trim());
    };
    recognition.onerror = () => {
      setListening(false);
      setMessages(current => [...current, { id: `e-${Date.now()}`, sender: 'assistant', text: 'I could not hear that. Please check microphone permission and try again.' }]);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
      setMessages(current => [...current, { id: `e-${Date.now()}`, sender: 'assistant', text: 'The microphone could not start. Please try again.' }]);
    }
  };

  return <div className="mx-auto max-w-4xl space-y-5">
    <header className="rounded-3xl bg-gradient-to-br from-[#0D1526] via-[#172f68] to-blue-700 p-6 text-white shadow-sm sm:p-8"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/10"><Bot size={24} /></span><div><h1 className="text-2xl font-extrabold">APU NEXT</h1><p className="text-sm text-blue-100">Your career companion</p></div></div></header>
    <section className="flex h-[min(680px,75vh)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50 to-white p-5">{messages.map(message => <div key={message.id} className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.sender === 'user' ? 'ml-auto bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{message.sender === 'assistant' ? <AssistantMarkdown>{message.text}</AssistantMarkdown> : <p className="whitespace-pre-wrap">{message.text}</p>}{message.attachment && <p className="mt-2 text-xs opacity-80">Attached: {message.attachment}</p>}{message.mode && <p className="mt-2 text-[11px] font-semibold text-slate-500">{assistantModeLabel(message.mode)}</p>}{message.sources?.length ? <div className="mt-3 border-t border-slate-200 pt-2 text-xs text-slate-500"><p className="font-bold">Sources</p>{message.sources.map(source => <p key={`${source.document}-${source.location}`}>{assistantSourceLabel(source)}</p>)}</div> : null}{message.retryQuestion && <button type="button" onClick={() => void askQuestion(message.retryQuestion!, message.retryFile)} className="mt-3 rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50">Retry</button>}</div>)}{messages.length === 1 && <div className="flex flex-wrap gap-2">{QUICK_QUESTIONS.map(question => <button key={question} type="button" onClick={() => { setInput(question); void askQuestion(question); }} className="rounded-full border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">{question}</button>)}</div>}{sending && <div className="max-w-[88%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500"><span className="inline-flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" /> Preparing your answer…</span></div>}</div>
      <div className="border-t border-slate-200 p-4"><div className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-slate-50 p-2"><label className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl text-slate-500 hover:bg-white hover:text-blue-600" aria-label="Attach file"><Paperclip size={18} /><input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={event => { const selected = event.target.files?.[0] || null; setFileError(selected && !ACCEPTED_ATTACHMENT.test(selected.name) ? 'Choose a PDF, DOCX, or TXT file.' : selected && selected.size > MAX_ATTACHMENT_BYTES ? 'Attachments must be 5 MB or smaller.' : ''); setFile(selected && ACCEPTED_ATTACHMENT.test(selected.name) && selected.size <= MAX_ATTACHMENT_BYTES ? selected : null); event.target.value = ''; }} /></label><input value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void ask(); }} placeholder="Message APU NEXT..." className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none" /><button type="button" onClick={useMic} className={`grid h-10 w-10 place-items-center rounded-xl ${listening ? 'bg-rose-100 text-rose-600' : 'text-slate-500 hover:bg-white hover:text-blue-600'}`} aria-label="Use microphone">{listening ? <Square size={15} /> : <Mic size={18} />}</button><button type="button" onClick={() => void ask()} disabled={sending || (!input.trim() && !file)} className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white disabled:opacity-40" aria-label="Send"><Send size={17} /></button></div>{file && <div className="mt-2 flex items-center justify-between rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-800">{file.name}<button type="button" onClick={() => setFile(null)} aria-label="Remove file"><X size={14} /></button></div>}{fileError && <p role="alert" className="mt-2 text-xs text-rose-700">{fileError}</p>}{file && <p className="mt-2 text-[11px] text-slate-500">The file is checked locally and is not saved by APU NEXT. Avoid uploading sensitive information.</p>}</div>
    </section>
    <button type="button" onClick={() => setMessages([{ id: 'welcome', sender: 'assistant', text: 'Hi, I’m APU NEXT. Ask me about internships, CVs, reports, or career preparation.' }])} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"><RotateCcw size={14} /> Reset conversation</button>
  </div>;
};
