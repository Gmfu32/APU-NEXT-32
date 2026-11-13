import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Search, Send, ThumbsUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../services/apiClient';

type Contact = { id: string; name: string; role: string; email: string };
type Message = { id: string; senderId: string; recipientId: string; body: string; createdAt: string; read: boolean };
type Reply = { id: string; author: string; role: string; body: string; createdAt: string };
type Post = { id: string; author: string; role: string; title: string; body: string; createdAt: string; likes: number; replies: Reply[] };

export const MessagesPage: React.FC = () => {
  const { user, showToast } = useApp();
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [message, setMessage] = useState('');
  const [thread, setThread] = useState<Message[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<Contact[]>('/community/users')
      .then(result => setContacts(result.data.filter(contact => contact.role === 'Student' || contact.role === 'Career Centre staff')))
      .catch(() => showToast('Registered users could not be loaded'))
      .finally(() => setLoading(false));
  }, [showToast]);
  useEffect(() => {
    apiRequest<{ count: number }>('/community/messages/unread')
      .then(result => setUnread(result.data.count))
      .catch(() => undefined);
  }, [showToast]);
  useEffect(() => {
    if (!selected) return;
    apiRequest<Message[]>(`/community/messages/${encodeURIComponent(selected.id)}`)
      .then(result => { setThread(result.data); setUnread(0); })
      .catch(() => showToast('Conversation could not be loaded'));
  }, [selected, showToast]);

  const filtered = contacts.filter(contact => contact.name.toLowerCase().includes(query.toLowerCase()) || contact.role.toLowerCase().includes(query.toLowerCase()));
  const send = () => {
    if (!selected || !message.trim()) return;
    apiRequest<Message>('/community/messages', { method: 'POST', body: JSON.stringify({ recipient_id: selected.id, body: message.trim() }) })
      .then(result => { setThread(current => [...current, result.data]); setMessage(''); })
      .catch(() => showToast('Message could not be sent'));
  };
  return <div className="community-page mx-auto max-w-5xl space-y-6">
    <header><p className="community-eyebrow text-xs font-bold uppercase tracking-[.16em] text-blue-700">Community workspace</p><h1 className="community-heading mt-1 flex items-center gap-3 text-2xl font-bold text-slate-900">Messages {unread > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{unread}</span>}</h1><p className="community-description mt-1 text-sm text-slate-500">Message registered students and Career Centre staff. Employer messaging is not available.</p></header>
    <div className="community-surface grid min-h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-[280px_1fr]">
      <aside className="border-b border-slate-200 p-4 md:border-b-0 md:border-r"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search registered users" className="community-input w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"/></div><p className="community-muted mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">{loading ? 'Loading registered users…' : filtered.length ? 'Select a person to start a conversation.' : 'No matching registered users found.'}</p><div className="mt-2 space-y-1">{filtered.map(contact => <button key={contact.id} type="button" onClick={() => setSelected(contact)} className={`community-contact w-full rounded-lg p-3 text-left ${selected?.id === contact.id ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50'}`}><p className="community-contact-name text-sm font-bold">{contact.name}</p><p className="community-contact-role mt-1 text-xs text-slate-500">{contact.role}</p></button>)}</div></aside>
      <section className="flex flex-col"><div className="border-b border-slate-200 p-5"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-blue-700"><MessageCircle size={18}/></div><div><h2 className="community-heading font-bold text-slate-900">{selected?.name || 'Select a person'}</h2><p className="community-muted text-xs text-slate-500">{selected ? `${selected.role} · ${selected.email}` : 'Search results will appear here'}</p></div></div></div><div className="flex-1 space-y-3 overflow-y-auto p-5">{!selected ? <p className="community-muted rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Select a registered account to begin.</p> : thread.length === 0 ? <p className="community-muted rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Start a private conversation about careers, projects, mentoring, or opportunities.</p> : thread.map(item => <div key={item.id} className={`max-w-md rounded-xl p-3 text-sm ${item.senderId === user.id ? 'ml-auto bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>{item.body}</div>)}</div><div className="border-t border-slate-200 p-4"><textarea disabled={!selected} value={message} onChange={event => setMessage(event.target.value)} rows={3} placeholder={selected ? `Message ${selected.name}` : 'Select a person first'} className="w-full rounded-lg border border-slate-200 p-3 text-sm disabled:bg-slate-50"/><button type="button" disabled={!selected} onClick={send} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Send size={15}/> Send message</button><p className="community-muted mt-2 text-xs text-slate-400">Signed in as {user.name}. Only you and the recipient can see this conversation.</p></div></section>
    </div>
  </div>;
};

export const PostsPage: React.FC = () => {
  const { user, showToast } = useApp();
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [liked, setLiked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiRequest<Post[]>('/community/posts').then(result => setPosts(result.data)).catch(() => showToast('Posts could not be loaded')).finally(() => setLoading(false));
  }, [showToast]);
  const visiblePosts = useMemo(() => posts, [posts]);
  const publish = async () => {
    if (!title.trim() || !body.trim()) return;
    try {
      const result = await apiRequest<Post>('/community/posts', { method: 'POST', body: JSON.stringify({ title: title.trim(), body: body.trim() }) });
      setPosts(current => [result.data, ...current]); setTitle(''); setBody(''); showToast('Post published to the APU NEXT community');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Post could not be published'); }
  };
  const like = async (post: Post) => {
    if (liked.includes(post.id)) return;
    try {
      const result = await apiRequest<{ likes: number }>(`/community/posts/${post.id}/like`, { method: 'POST' });
      setLiked(current => [...current, post.id]); setPosts(current => current.map(item => item.id === post.id ? { ...item, likes: result.data.likes } : item));
    } catch { showToast('Like could not be saved'); }
  };
  const reply = async (post: Post) => {
    const text = replyText[post.id]?.trim();
    if (!text) return;
    try {
      const result = await apiRequest<{ replies: Reply[] }>(`/community/posts/${post.id}/replies`, { method: 'POST', body: JSON.stringify({ body: text }) });
      setPosts(current => current.map(item => item.id === post.id ? { ...item, replies: result.data.replies } : item)); setReplyText(current => ({ ...current, [post.id]: '' }));
    } catch { showToast('Reply could not be saved'); }
  };
  return <div className="community-page mx-auto max-w-5xl space-y-6">
    <header><p className="community-eyebrow text-xs font-bold uppercase tracking-[.16em] text-blue-700">APU NEXT community</p><h1 className="community-heading mt-1 text-2xl font-bold text-slate-900">Posts</h1><p className="community-description mt-1 text-sm text-slate-500">Share project updates, internship lessons, advice, and useful career resources.</p></header>
    <section className="community-compose rounded-2xl border border-blue-100 bg-blue-50 p-5"><h2 className="community-heading font-bold text-slate-900">Create a post</h2><input value={title} onChange={event => setTitle(event.target.value)} placeholder="Post title" className="community-input mt-3 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm"/><textarea value={body} onChange={event => setBody(event.target.value)} rows={4} placeholder="Share an update, project, internship experience, or advice..." className="community-input mt-3 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm"/><button type="button" onClick={publish} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">Publish post</button></section>
    {loading ? <p className="text-sm text-slate-500">Loading posts…</p> : visiblePosts.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No posts yet. Be the first to share something useful.</p> : <div className="space-y-4">{visiblePosts.map(post => <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-900">{post.author}</p><p className="text-xs text-slate-500">{post.role} · {new Date(post.createdAt).toLocaleString()}</p><h2 className="mt-4 text-lg font-bold text-slate-900">{post.title}</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{post.body}</p><div className="mt-4 flex items-center gap-4"><button type="button" onClick={() => like(post)} className={`inline-flex items-center gap-2 text-sm font-bold ${liked.includes(post.id) ? 'text-blue-700' : 'text-slate-500'}`}><ThumbsUp size={15} fill={liked.includes(post.id) ? 'currentColor' : 'none'}/> {post.likes} likes</button><span className="text-sm text-slate-500">{post.replies.length} replies</span></div><div className="mt-3 flex gap-2"><input value={replyText[post.id] || ''} onChange={event => setReplyText(current => ({ ...current, [post.id]: event.target.value }))} placeholder="Write a reply…" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"/><button type="button" onClick={() => reply(post)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700"><MessageCircle size={15}/> Reply</button></div>{post.replies.length > 0 && <div className="mt-3 space-y-2 border-l-2 border-slate-100 pl-3">{post.replies.map(item => <div key={item.id}><p className="text-xs font-bold text-slate-700">{item.author} <span className="font-normal text-slate-400">· {item.role}</span></p><p className="text-sm text-slate-600">{item.body}</p></div>)}</div>}</article>)}</div>}
  </div>;
};
