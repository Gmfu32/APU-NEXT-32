import React, { useEffect, useState } from 'react';
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Briefcase,
  Building2,
  CalendarCheck,
  Globe2,
  ClipboardList,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  FileCheck2,
  FileText,
  FolderKanban,
  Gift,
  GraduationCap,
  HelpCircle,
  Home,
  Layers,
  MessageSquare,
  PlusCircle,
  Send,
  Settings,
  ShieldCheck,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdminPageId, AnyPageId, EmployerPageId, StudentPageId } from '../../types';
import { apiRequest } from '../../services/apiClient';

interface NavGroup {
  label: string;
  items: { id: AnyPageId; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[];
}

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { role, activePage, navigate, user } = useApp();
  const [logoError, setLogoError] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  useEffect(() => {
    if (!user.id || role === 'employer') return;
    const load = () => apiRequest<{ count: number }>('/community/messages/unread').then(result => setUnreadMessages(result.data.count)).catch(() => undefined);
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, [user.id, role]);

  const studentGroups: NavGroup[] = [
    {
      label: 'Student Workspace',
      items: [
        { id: 'dashboard' as StudentPageId, label: 'Dashboard', icon: Home },
        { id: 'profile' as StudentPageId, label: 'My Profile', icon: User },
        { id: 'opportunities' as StudentPageId, label: 'Internship Opportunities', icon: Briefcase },
        { id: 'career-guidance' as StudentPageId, label: 'Career Guidance', icon: Compass },
        { id: 'internship-reports' as StudentPageId, label: 'Internship Reports', icon: ClipboardCheck },
        { id: 'messages' as StudentPageId, label: 'Messages', icon: MessageSquare, badge: unreadMessages },
        { id: 'posts' as StudentPageId, label: 'Posts', icon: FileText },
        { id: 'settings' as StudentPageId, label: 'Settings', icon: Settings },
        { id: 'help-support' as StudentPageId, label: 'Help & Support', icon: HelpCircle },
      ],
    },
  ];

  const adminGroups: NavGroup[] = [
    {
      label: 'Career Centre',
      items: [
        { id: 'adm-dashboard' as AdminPageId, label: 'Dashboard', icon: Home },
        { id: 'adm-company-approvals' as AdminPageId, label: 'Company Approvals', icon: ShieldCheck },
        { id: 'adm-careerjet-discovery' as AdminPageId, label: 'Careerjet Discovery', icon: Globe2 },
        { id: 'adm-opportunity-approvals' as AdminPageId, label: 'Opportunity Matching', icon: CheckCircle2 },
        { id: 'adm-career-requests' as AdminPageId, label: 'Requests', icon: ClipboardList },
        { id: 'adm-internship-monitoring' as AdminPageId, label: 'Internship Reports', icon: ClipboardCheck },
        { id: 'adm-messages' as AdminPageId, label: 'Messages', icon: MessageSquare, badge: unreadMessages },
        { id: 'adm-posts' as AdminPageId, label: 'Posts', icon: FileText },
        { id: 'adm-settings' as AdminPageId, label: 'Settings', icon: Settings },
        { id: 'adm-help-support' as AdminPageId, label: 'Help & Support', icon: HelpCircle },
      ],
    },
  ];

  const employerGroups: NavGroup[] = [{ label: 'Employer Workspace', items: [
    { id: 'emp-dashboard' as EmployerPageId, label: 'Dashboard', icon: Home },
    { id: 'emp-profile' as EmployerPageId, label: 'Company Profile', icon: User },
    { id: 'emp-post-opportunity' as EmployerPageId, label: 'Post a Listing', icon: Briefcase },
    { id: 'emp-manage-opportunities' as EmployerPageId, label: 'My Listings', icon: Building2 },
    { id: 'emp-applications' as EmployerPageId, label: 'Applicants', icon: Users },
    { id: 'emp-settings' as EmployerPageId, label: 'Settings', icon: Settings },
    { id: 'emp-help-support' as EmployerPageId, label: 'Help & Support', icon: HelpCircle },
  ] }];

  const activeGroups = role === 'student' ? studentGroups : role === 'admin' ? adminGroups : employerGroups;
  const handleSelect = (id: AnyPageId) => {
    navigate(id, null);
    onCloseMobile();
  };

  const sidebarContent = (
    <aside className="w-64 bg-[#0D1526] text-slate-200 flex flex-col h-full select-none border-r border-slate-800/80">
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {!logoError ? (
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#0D1526]">
                <img
                  src="/assets/aistudio/Apu_Logo_9c651e3c.jpg"
                  alt="APU"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                  className="h-full w-full object-cover"
                />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-extrabold tracking-[0.22em] text-white">A·P·U</p>
                  <p className="text-[7px] font-semibold uppercase leading-tight tracking-wide text-slate-300">Asia Pacific University<br />of Technology &amp; Innovation</p>
                </div>
              </div>
            ) : (
              <div className="w-12 h-12 mb-2 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                APU
              </div>
            )}
            <div className="mt-1 flex items-baseline gap-1 leading-none">
              <span className="text-sm font-extrabold italic tracking-tight text-amber-400">APU NEXT</span>
            </div>
            <p className="text-[10px] font-semibold tracking-wide text-slate-300">Your Career. Our Support.</p>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-4 space-y-5" aria-label="Sidebar Navigation">
        {activeGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-1.5 text-[11px] font-semibold tracking-wider text-slate-400/90">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                        isActive
                          ? 'bg-[#2563EB] text-white shadow-xs'
                          : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span
                          className={`text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : 'bg-blue-600/30 text-blue-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

      </nav>

      <div className="px-4 py-3 border-t border-white/10 text-[11px] text-slate-400 leading-snug">
        Your Career. Our Support.
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block shrink-0 h-screen sticky top-0">{sidebarContent}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
