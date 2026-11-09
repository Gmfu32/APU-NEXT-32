import React, { useMemo, useState } from 'react';
import { Heart, MessageSquare, Plus, Send, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { COMMUNITIES } from '../../data/communityAndAlumni';
import { Modal } from '../../components/common/Modal';

export const CommunitiesPage: React.FC = () => {
  const {
    joinedCommunityIds,
    toggleCommunityMembership,
    communityPosts,
    addCommunityPost,
    toggleLikeCommunityPost,
    addCommentToPost,
    focusedEntityId,
    setFocusedEntityId,
  } = useApp();

  const [selectedCommunityId, setSelectedCommunityId] = useState<string>(
    focusedEntityId && COMMUNITIES.some((c) => c.id === focusedEntityId) ? focusedEntityId : 'All'
  );
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [postCommunityId, setPostCommunityId] = useState('com-tech');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');

  const activeCommunity = useMemo(
    () => COMMUNITIES.find((c) => c.id === selectedCommunityId) || null,
    [selectedCommunityId]
  );

  const visiblePosts = useMemo(
    () =>
      communityPosts.filter(
        (p) => selectedCommunityId === 'All' || p.communityId === selectedCommunityId
      ),
    [communityPosts, selectedCommunityId]
  );

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;
    addCommunityPost(postCommunityId, postTitle.trim(), postContent.trim());
    setPostTitle('');
    setPostContent('');
    setNewPostOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academic & Career Communities</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Join peer study guilds, share hackathon insights, and discuss internship preparation
            across 8 specialised communities.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (selectedCommunityId !== 'All') setPostCommunityId(selectedCommunityId);
            setNewPostOpen(true);
          }}
          className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 self-start whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Start Discussion</span>
        </button>
      </div>

      {/* 8 Community Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {COMMUNITIES.map((com) => {
          const isJoined = joinedCommunityIds.includes(com.id);
          const isSelected = selectedCommunityId === com.id;
          const displayCount = com.memberCount + (isJoined ? 1 : 0);

          return (
            <div
              key={com.id}
              className={`bg-white rounded-xl border overflow-hidden flex flex-col justify-between transition-colors ${
                isSelected ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'
              }`}
            >
              <div>
                <button
                  type="button"
                  onClick={() => {
                    const next = isSelected ? 'All' : com.id;
                    setSelectedCommunityId(next);
                    setFocusedEntityId(null);
                  }}
                  className={`w-full h-20 bg-gradient-to-r ${com.bannerTone} text-white px-4 py-3 text-left flex flex-col justify-between`}
                >
                  <span className="text-[10px] font-medium text-sky-200">{com.category}</span>
                  <span className="text-sm font-bold leading-snug line-clamp-1">{com.name}</span>
                </button>

                <div className="p-4 space-y-2">
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {com.description}
                  </p>
                  <p className="text-[11px] font-mono tabular-nums text-slate-500 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{displayCount.toLocaleString()} members</span>
                  </p>
                </div>
              </div>

              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCommunityId(isSelected ? 'All' : com.id)}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  {isSelected ? 'Showing Feed' : 'Open Feed'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleCommunityMembership(com.id)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    isJoined
                      ? 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-700'
                      : 'bg-[#0D1526] text-white hover:bg-blue-700'
                  }`}
                >
                  {isJoined ? 'Joined · Leave' : 'Join'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Community Banner & Discussion Feed */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {activeCommunity ? `${activeCommunity.name} — Discussions` : 'All Community Discussions'}
            </h2>
            <p className="text-xs text-slate-500">
              {activeCommunity
                ? `Moderated by ${activeCommunity.leadModerator}`
                : 'Showing recent student discussions across all 8 communities'}
            </p>
          </div>
          {activeCommunity && (
            <button
              type="button"
              onClick={() => setSelectedCommunityId('All')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Show All Communities
            </button>
          )}
        </div>

        <div className="space-y-4">
          {visiblePosts.map((post) => {
            const communityObj = COMMUNITIES.find((c) => c.id === post.communityId);
            const draftText = commentDrafts[post.id] || '';

            return (
              <article
                key={post.id}
                className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-bold text-slate-800">{post.author}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.authorRole}</span>
                    {communityObj && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-blue-600 font-medium">{communityObj.name}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{post.timestamp}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-2">{post.title}</h3>
                  <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">{post.content}</p>
                </div>

                {/* Likes & Comment Count */}
                <div className="flex items-center gap-5 pt-2 border-t border-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => toggleLikeCommunityPost(post.id)}
                    className={`inline-flex items-center gap-1.5 font-semibold transition-colors ${
                      post.likedByMe ? 'text-rose-600' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${post.likedByMe ? 'fill-current' : ''}`} />
                    <span className="font-mono tabular-nums">{post.likes} Helpful</span>
                  </button>
                  <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                    <MessageSquare className="w-4 h-4" />
                    <span className="font-mono tabular-nums">{post.comments.length} Comments</span>
                  </span>
                </div>

                {/* Comments Thread */}
                {post.comments.length > 0 && (
                  <div className="space-y-2.5 pl-4 border-l border-slate-200">
                    {post.comments.map((cm) => (
                      <div key={cm.id} className="text-xs bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-500">
                          <strong className="text-slate-900">{cm.author}</strong> · {cm.timestamp}
                        </p>
                        <p className="text-slate-700 mt-1">{cm.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Composer */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!draftText.trim()) return;
                    addCommentToPost(post.id, draftText.trim());
                    setCommentDrafts({ ...commentDrafts, [post.id]: '' });
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={draftText}
                    onChange={(e) =>
                      setCommentDrafts({ ...commentDrafts, [post.id]: e.target.value })
                    }
                    placeholder="Write a constructive reply..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      </section>

      {/* New Post Modal */}
      <Modal
        open={newPostOpen}
        onClose={() => setNewPostOpen(false)}
        title="Publish Community Discussion"
        subtitle="Share study notes, hackathon team searches, or internship preparation questions."
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Community</label>
            <select
              value={postCommunityId}
              onChange={(e) => setPostCommunityId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
            >
              {COMMUNITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Discussion Title *
            </label>
            <input
              type="text"
              required
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="e.g. Looking for 1 UI/UX & 1 Backend teammate for Campus Hackathon"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Details *</label>
            <textarea
              rows={4}
              required
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Write your question or community resource summary..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setNewPostOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
            >
              Publish Post
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
