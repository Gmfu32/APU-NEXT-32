import React, { useMemo, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, Menu, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface TopHeaderProps {
  onOpenMobileMenu: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenMobileMenu }) => {
  const {
    user,
    role,
    logoutToAuthScreen,
    navigate,
    opportunities,
    notifications,
  } = useApp();

  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const blurTimeout = useRef<number | null>(null);

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return opportunities
      .filter((item) => !item.approvalStatus || item.approvalStatus === 'Approved')
      .filter((item) => item.title.toLowerCase().includes(q) || item.company.toLowerCase().includes(q) || item.skills.some((skill) => skill.toLowerCase().includes(q)))
      .slice(0, 6)
      .map((item) => ({
        id: `opp-${item.id}`,
        title: item.title,
        subtitle: `${item.company} · ${item.location}`,
        category: 'Internship opportunity',
        onSelect: () => {
          navigate('opportunities', item.id);
        },
      }));
  }, [query, opportunities, navigate]);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-xl relative">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (blurTimeout.current) window.clearTimeout(blurTimeout.current);
                setSearchFocused(true);
              }}
              onBlur={() => {
                blurTimeout.current = window.setTimeout(() => setSearchFocused(false), 180);
              }}
              placeholder="Search internship opportunities"
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white rounded-lg border border-transparent focus:border-blue-500 focus:outline-none transition-colors text-slate-900 placeholder:text-slate-400"
            />

            {searchFocused && query.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-50">
                {searchResults.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-500">
                    No internship opportunities found for "{query}".
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {searchResults.map((res) => (
                      <li key={res.id}>
                        <button
                          type="button"
                          onMouseDown={() => {
                            res.onSelect();
                            setQuery('');
                            setSearchFocused(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">{res.title}</p>
                            <p className="text-[11px] text-slate-500 truncate">{res.subtitle}</p>
                          </div>
                          <span className="text-[11px] text-blue-600 font-medium shrink-0">
                            {res.category}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {role === 'student' && <button
            type="button"
            onClick={() => {
              navigate('notifications');
            }}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Open notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-mono tabular-nums font-bold flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </button>}

          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((prev) => !prev)}
              className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#0D1526] text-white text-xs font-bold flex items-center justify-center shrink-0">
                {user.initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight whitespace-nowrap">
                  {user.name}
                </p>
                <p className="text-[11px] text-slate-500 leading-tight max-w-[140px] truncate">
                  {user.subtitle}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {accountOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAccountOpen(false);
                    logoutToAuthScreen();
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
