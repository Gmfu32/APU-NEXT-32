import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { AuthPortal } from './pages/auth/AuthPortal';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { MyProfilePage } from './pages/student/MyProfilePage';
import { OpportunitiesPage } from './pages/student/OpportunitiesPage';
import { CareerFairPage } from './pages/student/CareerFairPage';
import { ScholarshipsPage } from './pages/student/ScholarshipsPage';
import { StudentPackagePage } from './pages/student/StudentPackagePage';
import { InterviewPracticePage } from './pages/student/InterviewPracticePage';
import { CareerGuidancePage } from './pages/student/CareerGuidancePage';
import { InternshipReportsPage } from './pages/student/InternshipReportsPage';
import { MentorBookingPage } from './pages/student/MentorBookingPage';
import { WorkshopsPage } from './pages/student/WorkshopsPage';
import { ResourcesPage } from './pages/student/ResourcesPage';
import { CommunitiesPage } from './pages/student/CommunitiesPage';
import { AlumniNetworkPage } from './pages/student/AlumniNetworkPage';
import { ReferralsPage } from './pages/student/ReferralsPage';
import { PeerMentoringPage } from './pages/student/PeerMentoringPage';
import { InternshipManagementPage } from './pages/student/InternshipManagementPage';
import { AiAssistantPage } from './pages/student/AiAssistantPage';
import { NotificationsPage } from './pages/student/NotificationsPage';
import { HelpSupportPage, SettingsPage } from './pages/student/AccountPages';
import { MessagesPage, PostsPage } from './pages/shared/CommunityPages';
import { EmployerPortal } from './pages/employer/EmployerPortal';
import { AdminPortal } from './pages/admin/AdminPortal';
import { FloatingAssistant } from './components/common/FloatingAssistant';
import { AdminPageId, EmployerPageId } from './types';

const WorkspaceContent: React.FC = () => {
  const { role, activePage, showAuthModal, toastMessage } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (showAuthModal) {
    return (
      <>
        <AuthPortal />
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-[#0D1526] text-white px-4 py-2.5 rounded-xl shadow-lg border border-white/10 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  const renderPage = () => {
    if ((activePage === 'messages' || activePage === 'adm-messages') && role !== 'employer') return <MessagesPage />;
    if ((activePage === 'posts' || activePage === 'adm-posts') && role !== 'employer') return <PostsPage />;
    if (role === 'employer' && (activePage === 'messages' || activePage === 'posts' || activePage === 'adm-messages' || activePage === 'adm-posts')) {
      return <EmployerPortal page="emp-dashboard" />;
    }
    if (activePage === 'settings' || activePage === 'adm-settings' || activePage === 'emp-settings') return <SettingsPage />;
    if (activePage === 'help-support' || activePage === 'adm-help-support' || activePage === 'emp-help-support') return <HelpSupportPage />;
    if (role === 'employer' && activePage.startsWith('emp-')) {
      return <EmployerPortal page={activePage as EmployerPageId} />;
    }

    if (role === 'admin' && activePage.startsWith('adm-')) {
      return <AdminPortal page={activePage as AdminPageId} />;
    }

    switch (activePage) {
      case 'dashboard':
        return <StudentDashboard />;
      case 'profile':
        return <MyProfilePage />;
      case 'opportunities':
        return <OpportunitiesPage />;
      case 'career-fair':
        return <CareerFairPage />;
      case 'scholarships':
        return <ScholarshipsPage />;
      case 'student-package':
        return <StudentPackagePage />;
      case 'interview-practice':
        return <InterviewPracticePage />;
      case 'career-guidance':
        return <CareerGuidancePage />;
      case 'internship-reports':
        return <InternshipReportsPage />;
      case 'mentor-booking':
        return <MentorBookingPage />;
      case 'workshops':
        return <WorkshopsPage />;
      case 'resources':
        return <ResourcesPage />;
      case 'communities':
        return <CommunitiesPage />;
      case 'alumni-network':
        return <AlumniNetworkPage />;
      case 'referrals':
        return <ReferralsPage />;
      case 'peer-mentoring':
        return <PeerMentoringPage />;
      case 'my-internship':
        return <InternshipManagementPage subView="overview" />;
      case 'internship-documents':
        return <InternshipManagementPage subView="documents" />;
      case 'internship-progress':
        return <InternshipManagementPage subView="progress" />;
      case 'ai-assistant':
        return <AiAssistantPage />;
      case 'notifications':
        return <NotificationsPage />;
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F6F8FC] text-slate-900">
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1360px] w-full mx-auto">
          {renderPage()}
        </main>

        <footer className="px-4 sm:px-6 lg:px-8 py-4 border-t border-slate-200/80 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2 max-w-[1360px] w-full mx-auto">
          <span>
            APU NEXT · Student Career Workspace
          </span>
        </footer>
      </div>

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 bg-[#0D1526] text-white px-4 py-2.5 rounded-xl shadow-lg border border-white/10 text-xs font-semibold flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
      <FloatingAssistant />
    </div>
  );
};

export function App() {
  useEffect(() => {
    document.body.classList.toggle('dark-theme', localStorage.getItem('apu-next-theme') === 'dark');
  }, []);
  return (
    <AppProvider>
      <WorkspaceContent />
    </AppProvider>
  );
}

export default App;
