import React, { useState } from 'react';
import { ArrowRight, Bell, CheckCheck, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead, navigate } = useApp();
  const [filter, setFilter] = useState<string>('All');

  const categories = [
    'All',
    'Unread',
    'Internships',
    'Deadlines',
    'Events & Workshops',
    'Mentoring',
    'Community',
    'Internship Admin',
  ];

  const visible = notifications.filter((n) => {
    if (filter === 'All') return true;
    if (filter === 'Unread') return !n.read;
    return n.category === filter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notification Centre</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Stay updated on matched internships, approaching deadlines, workshop seats, mentor
            bookings, and placement document reviews.
          </p>
        </div>

        <button
          type="button"
          disabled={unreadCount === 0}
          onClick={markAllNotificationsRead}
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 self-start whitespace-nowrap"
        >
          <CheckCheck className="w-4 h-4 text-blue-600" />
          <span>Mark All as Read ({unreadCount})</span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-white rounded-xl border border-slate-200 w-fit">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              filter === cat
                ? 'bg-[#0D1526] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
        {visible.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Bell className="w-6 h-6 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-900">No notifications in this category</p>
            <p className="text-xs text-slate-500">You are all caught up.</p>
          </div>
        ) : (
          visible.map((notif) => (
            <div
              key={notif.id}
              className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                notif.read ? 'bg-white' : 'bg-blue-50/40'
              }`}
            >
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-blue-700">{notif.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {notif.timestamp}
                  </span>
                  {!notif.read && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-blue-600">Unread</span>
                    </>
                  )}
                </div>
                <h2
                  className={`text-sm ${
                    notif.read ? 'font-semibold text-slate-800' : 'font-bold text-slate-900'
                  }`}
                >
                  {notif.title}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                {!notif.read && (
                  <button
                    type="button"
                    onClick={() => markNotificationRead(notif.id)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Mark Read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    markNotificationRead(notif.id);
                    navigate(notif.targetPage);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
