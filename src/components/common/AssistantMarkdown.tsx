import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  children: string;
  dark?: boolean;
};

export const AssistantMarkdown: React.FC<Props> = ({ children, dark = false }) => {
  const muted = dark ? 'text-slate-300' : 'text-slate-600';
  const heading = dark ? 'text-white' : 'text-slate-900';
  const border = dark ? 'border-white/15' : 'border-slate-200';
  const components: Components = {
    p: ({ children: content }) => <p className="mb-2 last:mb-0">{content}</p>,
    h1: ({ children: content }) => <h2 className={`mb-2 text-base font-bold ${heading}`}>{content}</h2>,
    h2: ({ children: content }) => <h2 className={`mb-2 text-base font-bold ${heading}`}>{content}</h2>,
    h3: ({ children: content }) => <h3 className={`mb-1 font-bold ${heading}`}>{content}</h3>,
    ul: ({ children: content }) => <ul className="my-2 list-disc space-y-1 pl-5">{content}</ul>,
    ol: ({ children: content }) => <ol className="my-2 list-decimal space-y-1 pl-5">{content}</ol>,
    li: ({ children: content }) => <li className="pl-0.5">{content}</li>,
    a: ({ children: content, href }) => <a href={href} target="_blank" rel="noreferrer" className="break-all font-medium text-blue-400 underline">{content}</a>,
    table: ({ children: content }) => <div className={`my-3 max-w-full overflow-x-auto rounded-lg border ${border}`}><table className="min-w-full border-collapse text-left text-xs">{content}</table></div>,
    th: ({ children: content }) => <th className={`border-b ${border} px-3 py-2 font-semibold ${heading}`}>{content}</th>,
    td: ({ children: content }) => <td className={`border-b ${border} px-3 py-2 align-top ${muted}`}>{content}</td>,
    blockquote: ({ children: content }) => <blockquote className={`my-2 border-l-2 ${border} pl-3 ${muted}`}>{content}</blockquote>,
  };

  return <div className="break-words [overflow-wrap:anywhere]">
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{children}</ReactMarkdown>
  </div>;
};
