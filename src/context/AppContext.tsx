import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  AdminCompanyApprovalItem,
  AlumniMember,
  AnyPageId,
  BookingRecord,
  CommunityPost,
  DemoUser,
  DocumentStatus,
  EmployerApplicant,
  EmployerMessageThread,
  InternshipDocument,
  NotificationItem,
  Opportunity,
  ProgressLogEntry,
  StudentProfile,
  UserRole,
  WorkshopItem,
} from '../types';
import { authService } from '../services/authService';
import { getStrongMatches } from '../services/matching';
import { API_CONFIG, apiRequest } from '../services/apiClient';
import { CAREER_WORKSHOPS } from '../data/mentorsAndWorkshops';
import { ALUMNI_DIRECTORY, INITIAL_COMMUNITY_POSTS } from '../data/communityAndAlumni';
import {
  INITIAL_EMPLOYER_APPLICANTS,
  INITIAL_EMPLOYER_MESSAGES,
  INITIAL_INTERNSHIP_DOCUMENTS,
  INITIAL_PROGRESS_LOGS,
} from '../data/internshipAndAdmin';

interface CompanyProfileData {
  name: string;
  tagline: string;
  industry: string;
  headquarters: string;
  companySize: string;
  website: string;
  about: string;
  boothRegistered: boolean;
  preferredBoothZone: string;
}

interface AppContextValue {
  user: DemoUser;
  role: UserRole;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  switchRole: (nextRole: UserRole) => void;
  loginAsUser: (nextUser: DemoUser) => void;
  logoutToAuthScreen: () => void;

  activePage: AnyPageId;
  navigate: (page: AnyPageId, entityId?: string | null) => void;
  focusedEntityId: string | null;
  setFocusedEntityId: (id: string | null) => void;

  toastMessage: string | null;
  showToast: (msg: string) => void;

  studentProfile: StudentProfile;
  updateStudentProfile: (next: StudentProfile) => Promise<void>;

  opportunities: Opportunity[];
  createCareerCentreOpportunity: (opp: Omit<Opportunity, 'id' | 'isDemoListing' | 'approvalStatus' | 'postedByEmployer' | 'matchNotificationsSent'>) => void;
  updateCareerCentreOpportunity: (opp: Opportunity) => void;
  sendOpportunityMatches: (id: string) => void;
  savedOpportunityIds: string[];
  appliedOpportunityMap: Record<string, { appliedAt: string; status: string; note: string }>;
  matchResponses: Record<string, 'interested' | 'passed'>;
  respondToMatch: (id: string, response: 'interested' | 'passed') => void;
  toggleSaveOpportunity: (id: string) => void;
  applyToOpportunity: (id: string, note: string, shareCv: boolean) => Promise<void>;

  savedBoothIds: string[];
  toggleSaveBooth: (id: string) => void;
  savedScholarshipIds: string[];
  toggleSaveScholarship: (id: string) => void;

  bookings: BookingRecord[];
  bookedSlotIds: string[];
  bookMentorSlot: (record: Omit<BookingRecord, 'id' | 'createdAt'>) => BookingRecord | null;
  cancelBooking: (bookingId: string) => void;

  workshops: WorkshopItem[];
  registeredWorkshopIds: string[];
  toggleWorkshopRegistration: (workshopId: string) => void;
  createOrApproveWorkshop: (ws: WorkshopItem) => void;

  joinedCommunityIds: string[];
  toggleCommunityMembership: (communityId: string) => void;
  communityPosts: CommunityPost[];
  addCommunityPost: (communityId: string, title: string, content: string) => void;
  toggleLikeCommunityPost: (postId: string) => void;
  addCommentToPost: (postId: string, content: string) => void;

  alumniList: AlumniMember[];
  connectedAlumniIds: string[];
  referralRequestIds: string[];
  requestedPeerIds: string[];
  toggleConnectAlumni: (alumniId: string) => void;
  submitReferralRequest: (alumniId: string, note: string) => void;
  submitPeerMentorRequest: (peerId: string, note: string) => void;

  internshipDocs: InternshipDocument[];
  progressLogs: ProgressLogEntry[];
  submitInternshipDoc: (docId: string, fileName: string) => void;
  updateInternshipDocStatus: (docId: string, status: DocumentStatus, reviewerNote?: string) => void;
  addProgressLogEntry: (entry: Omit<ProgressLogEntry, 'id'>) => void;
  approveProgressLog: (logId: string) => void;

  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  companyProfile: CompanyProfileData;
  updateCompanyProfile: (data: CompanyProfileData) => void;
  employerApplicants: EmployerApplicant[];
  updateApplicantStatus: (applicantId: string, status: EmployerApplicant['status']) => void;
  employerMessages: EmployerMessageThread[];
  sendEmployerReply: (threadId: string, text: string) => void;
  postEmployerOpportunity: (opp: Omit<Opportunity, 'id' | 'isDemoListing'>) => Promise<Opportunity>;

  adminCompanies: AdminCompanyApprovalItem[];
  updateAdminCompanyStatus: (id: string, status: AdminCompanyApprovalItem['status']) => void;
  moderateOpportunityListing: (id: string, approvalStatus: 'Approved' | 'Changes Requested') => void;
  verifyAlumniMember: (alumniId: string) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const DEFAULT_PAGE_BY_ROLE: Record<UserRole, AnyPageId> = {
  student: 'dashboard',
  employer: 'emp-dashboard',
  admin: 'adm-dashboard',
};
const EMPTY_STUDENT_PROFILE: StudentProfile = {
  name: '', studentId: '', email: '', degree: '', major: '', yearOfStudy: '',
  graduationStatus: '', cgpa: '', bio: '', skills: [], careerInterests: [], preferredIndustries: [],
  preferredLocations: [], internshipAvailability: '', internshipStartDate: '', internshipEndDate: '',
  openToMatches: true, cvFileName: null, cvUpdatedDate: null, projects: [], certifications: [], education: [], workExperience: [],
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<DemoUser>(() => authService.currentUser() || { id: '', name: '', email: '', role: 'student', subtitle: 'Signed out', initials: 'A', verifiedEmail: false });
  const [role, setRole] = useState<UserRole>(user.role);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(() => !authService.currentUser());

  const [activePage, setActivePage] = useState<AnyPageId>(() => {
    const restoredUser = authService.currentUser();
    return restoredUser ? DEFAULT_PAGE_BY_ROLE[restoredUser.role] : 'dashboard';
  });
  const [focusedEntityId, setFocusedEntityId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [studentProfile, setStudentProfile] = useState<StudentProfile>(EMPTY_STUDENT_PROFILE);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [matchResponses, setMatchResponses] = useState<Record<string, 'interested' | 'passed'>>({});
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('page') === 'opportunities' && authService.currentUser()?.role === 'student') {
      setActivePage('opportunities');
      setFocusedEntityId(params.get('opportunity'));
    }
  }, []);
  useEffect(() => {
    if (!API_CONFIG.useMockData) return;
    if (user.id && role === 'student') localStorage.setItem(`apu-next-profile-${user.id}`, JSON.stringify(studentProfile));
    localStorage.setItem('apu-next-demo-opportunities', JSON.stringify(opportunities));
    localStorage.setItem('apu-next-demo-match-responses', JSON.stringify(matchResponses));
  }, [studentProfile, opportunities, matchResponses, user.id, role]);
  useEffect(() => {
    if (API_CONFIG.useMockData || !user.id) return;
    let active = true;
    void (async () => {
      try {
        let profile: StudentProfile | undefined;
        if (role === 'student') {
          try { profile = (await apiRequest<StudentProfile>(`/students/${encodeURIComponent(user.id)}/profile`)).data; }
          catch (error) {
            if (!(error instanceof Error) || !error.message.includes('not found')) throw error;
            const initial = { ...EMPTY_STUDENT_PROFILE, studentId: user.id, name: user.name, email: user.email };
            profile = (await apiRequest<{ profile: StudentProfile; matchesUpdated: boolean }>(`/students/${encodeURIComponent(user.id)}/profile`, { method: 'PUT', body: JSON.stringify({ profile: initial }) })).data.profile;
          }
        }
        if (role === 'employer') {
          const ownListings = (await apiRequest<Opportunity[]>('/employer/opportunities')).data;
          if (!active) return;
          setOpportunities(ownListings);
          return;
        }
        const listings = (await apiRequest<Opportunity[]>('/opportunities')).data;
        const matchRows = role === 'student' ? (await apiRequest<Array<{ opportunity: Opportunity; response: 'interested' | 'passed' | null }>>(`/students/${encodeURIComponent(user.id)}/matches`)).data : [];
        const applications = role === 'student' ? (await apiRequest<Array<{ opportunityId: string; appliedAt: string; status: string; note: string; applicationMode?: 'internal' | 'external' }>>(`/students/${encodeURIComponent(user.id)}/applications`)).data : [];
        if (!active) return;
        if (profile) setStudentProfile(profile);
        setOpportunities(listings);
        const appliedOpportunityIds = new Set(applications.map((application) => application.opportunityId));
        setMatchResponses(Object.fromEntries(matchRows.filter((row) => row.response && !appliedOpportunityIds.has(row.opportunity.id)).map((row) => [row.opportunity.id, row.response as 'interested' | 'passed'])));
        setAppliedOpportunityMap(Object.fromEntries(applications.map(application => [application.opportunityId, {
          appliedAt: new Date(application.appliedAt).toLocaleDateString(),
          status: application.status,
          note: application.note,
          applicationMode: application.applicationMode,
        }])));
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : '';
        if (message.includes('Session is invalid or has expired') || message.includes('Account no longer exists') || message.includes('company registration is awaiting Career Centre approval') || message.includes('company registration was rejected by the Career Centre')) {
          logoutToAuthScreen();
          showToast(message.includes('company registration') ? message : 'Your session expired. Please sign in again.');
        } else {
          showToast(`Backend unavailable: ${message || 'check API and database setup'}`);
        }
      }
    })();
    return () => { active = false; };
  }, [user.id, role]);
  const [savedOpportunityIds, setSavedOpportunityIds] = useState<string[]>([]);
  const [appliedOpportunityMap, setAppliedOpportunityMap] = useState<Record<string, { appliedAt: string; status: string; note: string; applicationMode?: 'internal' | 'external' }>>({});
  useEffect(() => {
    if (!user.id) return;
    const key = `apu-next-applications-${user.id}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) setAppliedOpportunityMap(JSON.parse(saved) as Record<string, { appliedAt: string; status: string; note: string; applicationMode?: 'internal' | 'external' }>);
    } catch {
      localStorage.removeItem(key);
    }
  }, [user.id]);
  useEffect(() => {
    if (user.id) localStorage.setItem(`apu-next-applications-${user.id}`, JSON.stringify(appliedOpportunityMap));
  }, [appliedOpportunityMap, user.id]);

  const [savedBoothIds, setSavedBoothIds] = useState<string[]>(['booth-01', 'booth-02', 'booth-03']);
  const [savedScholarshipIds, setSavedScholarshipIds] = useState<string[]>(['sch-01', 'sch-03']);

  const [bookings, setBookings] = useState<BookingRecord[]>([
    {
      id: 'bk-init-01',
      mentorId: 'mnt-01',
      mentorName: 'Dr. Amirul Haziq (Demo Lecturer)',
      mentorTitle: 'Senior Lecturer · School of Computing (Fictional Demo)',
      slotId: 'slot-m1-1',
      day: 'Tue, 10 Nov',
      time: '2:30 PM – 3:00 PM',
      topic: 'AI Capstone & Industrial Training Alignment',
      notes: 'Reviewing time-series forecasting repository before interviews.',
      createdAt: '30 Oct 2026',
    },
  ]);

  const [workshops, setWorkshops] = useState<WorkshopItem[]>(CAREER_WORKSHOPS);
  const [registeredWorkshopIds, setRegisteredWorkshopIds] = useState<string[]>(['ws-01']);

  const [joinedCommunityIds, setJoinedCommunityIds] = useState<string[]>([
    'com-tech',
    'com-ai',
    'com-se',
  ]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(INITIAL_COMMUNITY_POSTS);

  const [alumniList, setAlumniList] = useState<AlumniMember[]>(ALUMNI_DIRECTORY);
  const [connectedAlumniIds, setConnectedAlumniIds] = useState<string[]>(['alm-01', 'alm-03']);
  const [referralRequestIds, setReferralRequestIds] = useState<string[]>([]);
  const [requestedPeerIds, setRequestedPeerIds] = useState<string[]>([]);

  const [internshipDocs, setInternshipDocs] = useState<InternshipDocument[]>(INITIAL_INTERNSHIP_DOCUMENTS);
  const [progressLogs, setProgressLogs] = useState<ProgressLogEntry[]>(INITIAL_PROGRESS_LOGS);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [companyProfile, setCompanyProfile] = useState<CompanyProfileData>({
    name: 'PETRONAS Digital Sdn Bhd (Employer Demo)',
    tagline: 'Accelerating clean-energy transition through Applied AI, Cloud & Data Engineering.',
    industry: 'Energy & Engineering Tech',
    headquarters: 'PETRONAS Twin Towers, Kuala Lumpur',
    companySize: '1,500+ Digital Specialists (Demo)',
    website: 'https://www.petronas.com',
    about:
      'Demonstration employer workspace representing an enterprise technology recruitment team hiring Year 3 industrial trainees and graduate software/data engineers.',
    boothRegistered: true,
    preferredBoothZone: 'Central Atrium · Booth A-02',
  });

  const [employerApplicants, setEmployerApplicants] = useState<EmployerApplicant[]>(INITIAL_EMPLOYER_APPLICANTS);
  const [employerMessages, setEmployerMessages] = useState<EmployerMessageThread[]>(INITIAL_EMPLOYER_MESSAGES);
  const [adminCompanies, setAdminCompanies] = useState<AdminCompanyApprovalItem[]>([]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  const switchRole = (nextRole: UserRole) => {
    if (nextRole !== role) showToast('Sign out and sign in with an account for that workspace.');
  };

  const loginAsUser = (nextUser: DemoUser) => {
    const previousId = user.id;
    setRole(nextUser.role);
    setUser(nextUser);
    if (nextUser.id !== previousId && nextUser.role === 'student') setStudentProfile({ ...EMPTY_STUDENT_PROFILE, studentId: nextUser.id, name: nextUser.name, email: nextUser.email });
    const params = new URLSearchParams(window.location.search);
    const pageTarget = params.get('page') === 'opportunities' && nextUser.role === 'student' ? 'opportunities' : DEFAULT_PAGE_BY_ROLE[nextUser.role];
    setActivePage(pageTarget);
    setFocusedEntityId(pageTarget === 'opportunities' ? params.get('opportunity') : null);
    setShowAuthModal(false);
    showToast(`Signed in as ${nextUser.name}`);
  };

  const logoutToAuthScreen = () => {
    authService.signOut();
    setUser({ id: '', name: '', email: '', role: 'student', subtitle: 'Signed out', initials: 'A', verifiedEmail: false });
    setRole('student');
    setShowAuthModal(true);
  };

  const navigate = (page: AnyPageId, entityId: string | null = null) => {
    setActivePage(page);
    setFocusedEntityId(entityId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateStudentProfile = async (next: StudentProfile) => {
    if (!API_CONFIG.useMockData) {
      try {
        await apiRequest(`/students/${encodeURIComponent(next.studentId)}/profile`, { method: 'PUT', body: JSON.stringify({ profile: next }) });
      } catch (error) { showToast(`Could not save profile: ${error instanceof Error ? error.message : 'API error'}`); throw error; }
    }
    setStudentProfile(next);
    showToast(API_CONFIG.useMockData ? 'Profile saved on this device.' : 'Profile saved. Matches have been refreshed.');
  };

  const createCareerCentreOpportunity = (
    opportunity: Omit<Opportunity, 'id' | 'isDemoListing' | 'approvalStatus' | 'postedByEmployer' | 'matchNotificationsSent'>
  ) => {
    const created: Opportunity = {
      ...opportunity,
      id: `apu-${Date.now()}`,
      isDemoListing: false,
      approvalStatus: 'Approved',
      postedByEmployer: false,
      matchNotificationsSent: false,
    };
    if (!API_CONFIG.useMockData) {
      void apiRequest<{ opportunity: Opportunity; matches: unknown[] }>('/opportunities', { method: 'POST', body: JSON.stringify({ opportunity: created }) })
        .then(({ data }) => { setOpportunities((current) => [data.opportunity, ...current.filter((item) => item.id !== data.opportunity.id)]); showToast(`Listing published. ${data.matches.length} strong match(es) found.`); })
        .catch((error) => showToast(`Could not publish listing: ${error instanceof Error ? error.message : 'API error'}`));
      return;
    }
    setOpportunities((current) => [created, ...current]);
    const matches = getStrongMatches(studentProfile, [created]);
    showToast(`Listing published. ${matches.length} strong profile match(es) found.`);
  };

  const updateCareerCentreOpportunity = (opportunity: Opportunity) => {
    if (!API_CONFIG.useMockData) {
      void apiRequest<{ opportunity: Opportunity; matches: unknown[] }>(`/opportunities/${encodeURIComponent(opportunity.id)}`, { method: 'PUT', body: JSON.stringify({ opportunity }) })
        .then(({ data }) => { setOpportunities((current) => current.map((item) => item.id === opportunity.id ? data.opportunity : item)); showToast('Listing updated. Strong matches recalculated.'); })
        .catch((error) => showToast(`Could not update listing: ${error instanceof Error ? error.message : 'API error'}`));
      return;
    }
    setOpportunities((current) => current.map((item) => item.id === opportunity.id ? opportunity : item));
    showToast('Listing updated. Strong matches recalculated.');
  };

  const respondToMatch = (id: string, response: 'interested' | 'passed') => {
    if (!API_CONFIG.useMockData) {
      void apiRequest(`/students/${encodeURIComponent(studentProfile.studentId)}/matches/${encodeURIComponent(id)}/response`, { method: 'POST', body: JSON.stringify({ response }) })
        .then(() => setMatchResponses((current) => ({ ...current, [id]: response })))
        .catch((error) => showToast(`Could not save response: ${error instanceof Error ? error.message : 'API error'}`));
      return;
    }
    setMatchResponses((current) => ({ ...current, [id]: response }));
    showToast(response === 'interested' ? 'Interested saved. Use the application link to apply.' : 'Passed saved. This match is hidden from your active feed.');
  };

  const sendOpportunityMatches = (id: string) => {
    const opportunity = opportunities.find((item) => item.id === id);
    if (!opportunity || opportunity.approvalStatus !== 'Approved' || opportunity.matchNotificationsSent) {
      showToast('Approve the listing first, or notifications have already been queued.');
      return;
    }
    setOpportunities((current) => current.map((item) => item.id === id ? { ...item, matchNotificationsSent: true } : item));
    setNotifications((current) => [{
      id: `match-${id}`,
      category: 'Internships',
      title: `New opportunity match: ${opportunity.title}`,
      message: `${opportunity.company} · ${opportunity.location}. Review the demo listing and application deadline.`,
      timestamp: 'Just now',
      read: false,
      targetPage: 'opportunities',
    }, ...current]);
    showToast('Demo Power Automate step: student notification queued. No email was sent.');
  };

  const toggleSaveOpportunity = (id: string) => {
    setSavedOpportunityIds((prev) => {
      const exists = prev.includes(id);
      showToast(exists ? 'Removed from Saved Opportunities' : 'Saved to Your Opportunities');
      return exists ? prev.filter((item) => item !== id) : [...prev, id];
    });
  };

  const applyToOpportunity = async (id: string, note: string, shareCv: boolean) => {
    const opp = opportunities.find((o) => o.id === id);
    if (!opp) throw new Error('This vacancy is no longer available.');
    if (!API_CONFIG.useMockData) {
      const { data } = await apiRequest<{ opportunityId: string; appliedAt: string; status: string; note: string; applicationMode?: 'internal' | 'external' }>('/applications/' + encodeURIComponent(id), {
        method: 'POST',
        body: JSON.stringify({ note, share_cv: shareCv }),
      });
      setAppliedOpportunityMap(prev => ({
        ...prev,
        [id]: { appliedAt: new Date(data.appliedAt).toLocaleDateString(), status: data.status, note: data.note, applicationMode: data.applicationMode },
      }));
      setMatchResponses((current) => {
        const remaining = { ...current };
        delete remaining[id];
        return remaining;
      });
      showToast(data.applicationMode === 'external'
        ? `External application link recorded for ${opp.company}; submission is not verified.`
        : `Application submitted to ${opp.company}.`);
      return;
    }
    setAppliedOpportunityMap((prev) => ({
      ...prev,
      [id]: {
        appliedAt: '02 Nov 2026',
        status: opp.applicationMode === 'external' ? 'External Application Started' : 'Submitted (Demo)',
        note: opp.applicationMode === 'external'
          ? 'External application website opened from APU NEXT; completion is not confirmed.'
          : note || 'Submitted with profile CV.',
        applicationMode: opp.applicationMode || 'internal',
      },
    }));
    setMatchResponses((current) => {
      const remaining = { ...current };
      delete remaining[id];
      return remaining;
    });
    showToast(opp.applicationMode === 'external'
      ? `External application link recorded for ${opp.company}; submission is not verified.`
      : `Demonstration application submitted to ${opp.company}`);
  };

  const toggleSaveBooth = (id: string) => {
    setSavedBoothIds((prev) => {
      const exists = prev.includes(id);
      showToast(exists ? 'Removed booth from Career Fair Itinerary' : 'Added booth to Career Fair Itinerary');
      return exists ? prev.filter((b) => b !== id) : [...prev, id];
    });
  };

  const toggleSaveScholarship = (id: string) => {
    setSavedScholarshipIds((prev) => {
      const exists = prev.includes(id);
      showToast(exists ? 'Removed from Saved Scholarships' : 'Saved Scholarship / Master’s programme');
      return exists ? prev.filter((s) => s !== id) : [...prev, id];
    });
  };

  const bookedSlotIds = bookings.map((b) => b.slotId);

  const bookMentorSlot = (record: Omit<BookingRecord, 'id' | 'createdAt'>): BookingRecord | null => {
    if (bookedSlotIds.includes(record.slotId)) {
      showToast('This time slot is already booked in your session.');
      return null;
    }
    const created: BookingRecord = {
      ...record,
      id: `bk-${Date.now()}`,
      createdAt: '02 Nov 2026',
    };
    setBookings((prev) => [created, ...prev]);
    showToast(`Confirmed session with ${record.mentorName}`);
    return created;
  };

  const cancelBooking = (bookingId: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    showToast('Demonstration booking cancelled and slot released');
  };

  const toggleWorkshopRegistration = (workshopId: string) => {
    const isReg = registeredWorkshopIds.includes(workshopId);
    setRegisteredWorkshopIds((prev) =>
      isReg ? prev.filter((id) => id !== workshopId) : [...prev, workshopId]
    );
    setWorkshops((prev) =>
      prev.map((ws) =>
        ws.id === workshopId
          ? { ...ws, registeredCount: ws.registeredCount + (isReg ? -1 : 1) }
          : ws
      )
    );
    showToast(isReg ? 'Workshop registration cancelled' : 'Registered for workshop (Demo)');
  };

  const createOrApproveWorkshop = (ws: WorkshopItem) => {
    setWorkshops((prev) => {
      const exists = prev.some((item) => item.id === ws.id);
      if (exists) {
        return prev.map((item) => (item.id === ws.id ? ws : item));
      }
      return [ws, ...prev];
    });
    showToast(`Workshop "${ws.title}" updated`);
  };

  const toggleCommunityMembership = (communityId: string) => {
    setJoinedCommunityIds((prev) => {
      const joined = prev.includes(communityId);
      showToast(joined ? 'Left community' : 'Joined community');
      return joined ? prev.filter((c) => c !== communityId) : [...prev, communityId];
    });
  };

  const addCommunityPost = (communityId: string, title: string, content: string) => {
    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      communityId,
      author: `${studentProfile.name} (Demo)`,
      authorRole: studentProfile.yearOfStudy,
      timestamp: 'Just now',
      title,
      content,
      likes: 1,
      likedByMe: true,
      comments: [],
    };
    setCommunityPosts((prev) => [newPost, ...prev]);
    showToast('Discussion post published to community');
  };

  const toggleLikeCommunityPost = (postId: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const nextLiked = !p.likedByMe;
        return {
          ...p,
          likedByMe: nextLiked,
          likes: p.likes + (nextLiked ? 1 : -1),
        };
      })
    );
  };

  const addCommentToPost = (postId: string, content: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                {
                  id: `cm-${Date.now()}`,
                  author: studentProfile.name,
                  authorRole: 'Student',
                  timestamp: 'Just now',
                  content,
                },
              ],
            }
          : p
      )
    );
    showToast('Comment added');
  };

  const toggleConnectAlumni = (alumniId: string) => {
    setConnectedAlumniIds((prev) => {
      const exists = prev.includes(alumniId);
      showToast(exists ? 'Connection request withdrawn' : 'Connection request sent (Simulated)');
      return exists ? prev.filter((id) => id !== alumniId) : [...prev, alumniId];
    });
  };

  const submitReferralRequest = (alumniId: string, _note: string) => {
    if (!referralRequestIds.includes(alumniId)) {
      setReferralRequestIds((prev) => [...prev, alumniId]);
    }
    showToast('Referral discussion request recorded (Simulated — non-guaranteed)');
  };

  const submitPeerMentorRequest = (peerId: string, _note: string) => {
    if (!requestedPeerIds.includes(peerId)) {
      setRequestedPeerIds((prev) => [...prev, peerId]);
    }
    showToast('Peer mentoring request sent (Demo)');
  };

  const submitInternshipDoc = (docId: string, fileName: string) => {
    setInternshipDocs((prev) =>
      prev.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              submittedFile: fileName,
              submittedAt: '02 Nov 2026 (Demo Upload)',
              status: 'Submitted',
              reviewerNote: 'Uploaded in prototype session; awaiting supervisor/admin review.',
            }
          : doc
      )
    );
    showToast(`Uploaded ${fileName} (Simulated)`);
  };

  const updateInternshipDocStatus = (
    docId: string,
    status: DocumentStatus,
    reviewerNote?: string
  ) => {
    setInternshipDocs((prev) =>
      prev.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              status,
              reviewerNote: reviewerNote ?? doc.reviewerNote,
            }
          : doc
      )
    );
    showToast(`Document status updated to "${status}"`);
  };

  const addProgressLogEntry = (entry: Omit<ProgressLogEntry, 'id'>) => {
    setProgressLogs((prev) => [{ ...entry, id: `log-${Date.now()}` }, ...prev]);
    showToast('Weekly progress log saved');
  };

  const approveProgressLog = (logId: string) => {
    setProgressLogs((prev) =>
      prev.map((l) => (l.id === logId ? { ...l, supervisorSignOff: 'Signed Off (Simulated)' } : l))
    );
    showToast('Progress log attested (Simulated)');
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read');
  };

  const updateCompanyProfile = (data: CompanyProfileData) => {
    setCompanyProfile(data);
    showToast('Company profile updated');
  };

  const updateApplicantStatus = (applicantId: string, status: EmployerApplicant['status']) => {
    setEmployerApplicants((prev) =>
      prev.map((a) => (a.id === applicantId ? { ...a, status } : a))
    );
    showToast(`Candidate status updated to "${status}"`);
  };

  const sendEmployerReply = (threadId: string, text: string) => {
    setEmployerMessages((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              unread: false,
              messages: [
                ...t.messages,
                {
                  id: `m-${Date.now()}`,
                  sender: 'employer',
                  senderName: user.name,
                  text,
                  time: 'Just now',
                },
              ],
            }
          : t
      )
    );
    showToast('Message sent (Demo)');
  };

  const postEmployerOpportunity = async (opp: Omit<Opportunity, 'id' | 'isDemoListing'>): Promise<Opportunity> => {
    const created: Opportunity = {
      ...opp,
      id: `opp-${Date.now()}`,
      isDemoListing: false,
      postedByEmployer: true,
      approvalStatus: 'Pending Review',
      sourceLabel: `Employer listing · ${user.id}`,
    };
    if (!API_CONFIG.useMockData) {
      const { data } = await apiRequest<{ opportunity: Opportunity; status: string }>('/employer/opportunities', { method: 'POST', body: JSON.stringify({ opportunity: created }) });
      setOpportunities(current => [data.opportunity, ...current.filter(item => item.id !== data.opportunity.id)]);
      showToast('Listing submitted to Career Centre review. It will match students after approval.');
      return data.opportunity;
    }
    setOpportunities((current) => [created, ...current]);
    showToast('Listing submitted for Career Centre review.');
    return created;
  };

  const updateAdminCompanyStatus = (id: string, status: AdminCompanyApprovalItem['status']) => {
    setAdminCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    showToast(`Employer verification status set to "${status}"`);
  };

  const moderateOpportunityListing = (
    id: string,
    approvalStatus: 'Approved' | 'Changes Requested'
  ) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, approvalStatus } : o))
    );
    showToast(`Opportunity listing marked "${approvalStatus}"`);
  };

  const verifyAlumniMember = (alumniId: string) => {
    setAlumniList((prev) =>
      prev.map((a) =>
        a.id === alumniId ? { ...a, verificationLabel: 'Simulated Alumni Profile (Demo)' } : a
      )
    );
    showToast('Alumni demonstration record verified');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        role,
        showAuthModal,
        setShowAuthModal,
        switchRole,
        loginAsUser,
        logoutToAuthScreen,
        activePage,
        navigate,
        focusedEntityId,
        setFocusedEntityId,
        toastMessage,
        showToast,
        studentProfile,
        updateStudentProfile,
        opportunities,
        createCareerCentreOpportunity,
        updateCareerCentreOpportunity,
        sendOpportunityMatches,
        savedOpportunityIds,
        appliedOpportunityMap,
        matchResponses,
        respondToMatch,
        toggleSaveOpportunity,
        applyToOpportunity,
        savedBoothIds,
        toggleSaveBooth,
        savedScholarshipIds,
        toggleSaveScholarship,
        bookings,
        bookedSlotIds,
        bookMentorSlot,
        cancelBooking,
        workshops,
        registeredWorkshopIds,
        toggleWorkshopRegistration,
        createOrApproveWorkshop,
        joinedCommunityIds,
        toggleCommunityMembership,
        communityPosts,
        addCommunityPost,
        toggleLikeCommunityPost,
        addCommentToPost,
        alumniList,
        connectedAlumniIds,
        referralRequestIds,
        requestedPeerIds,
        toggleConnectAlumni,
        submitReferralRequest,
        submitPeerMentorRequest,
        internshipDocs,
        progressLogs,
        submitInternshipDoc,
        updateInternshipDocStatus,
        addProgressLogEntry,
        approveProgressLog,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        companyProfile,
        updateCompanyProfile,
        employerApplicants,
        updateApplicantStatus,
        employerMessages,
        sendEmployerReply,
        postEmployerOpportunity,
        adminCompanies,
        updateAdminCompanyStatus,
        moderateOpportunityListing,
        verifyAlumniMember,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
