import { apiRequest } from './apiClient';

export type AssistantMode =
  | 'apu_grounded'
  | 'mixed_guidance'
  | 'general_guidance'
  | 'attachment_review'
  | 'greeting'
  | 'knowledge_gap';

export type AssistantSource = {
  title: string;
  document: string;
  location: string;
  version: string | null;
};

export type AssistantHistoryEntry = {
  role: 'user' | 'assistant';
  text: string;
};

export type AssistantReply = {
  answer: string;
  sources: AssistantSource[];
  mode: AssistantMode;
};

export async function askAssistant(
  question: string,
  history: AssistantHistoryEntry[],
  file?: File,
): Promise<AssistantReply> {
  try {
    if (file) {
      const form = new FormData();
      form.append('question', question || 'Please review this file.');
      form.append('history', JSON.stringify(history.slice(-8)));
      form.append('file', file);
      const { data } = await apiRequest<AssistantReply>('/assistant/ask-with-file', {
        method: 'POST',
        body: form,
      });
      return data;
    }

    const { data } = await apiRequest<AssistantReply>('/assistant/ask', {
      method: 'POST',
      body: JSON.stringify({ question, history: history.slice(-8) }),
    });
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/^(Attach a text-based|Attachments must|The attachment could not be read|No readable text was found)/i.test(message)) {
      throw new Error(message);
    }
    throw new Error('I couldn’t prepare an answer just now. Please try again.');
  }
}

export function assistantModeLabel(mode: AssistantMode): string {
  switch (mode) {
    case 'apu_grounded':
      return 'APU document guidance';
    case 'mixed_guidance':
      return 'APU guidance + general advice';
    case 'general_guidance':
      return 'General career advice';
    case 'attachment_review':
      return 'File details';
    case 'knowledge_gap':
      return 'No confirmed APU guidance found';
    case 'greeting':
      return 'APU NEXT';
  }
}

export function assistantSourceLabel(source: AssistantSource): string {
  const location = source.location ? ` · ${source.location}` : '';
  const version = source.version ? ` · ${source.version}` : '';
  const rawTitle = (source.document || source.title).replace(/\.[^.]+$/, '');
  const title = /industry placement briefing/i.test(rawTitle)
    ? 'Industry Placement Student Briefing'
    : /report assessment guideline/i.test(rawTitle)
      ? 'Report Assessment Guidelines'
      : rawTitle.replace(/^\d+(?:-\d+)*\s*/, '').replace(/[_-]+/g, ' ').trim();
  return `${title}${location}${version}`;
}
