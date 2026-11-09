export type UserRole = 'student' | 'employer' | 'admin';

export type StudentPageId =
  | 'dashboard'
  | 'profile'
  | 'opportunities'
  | 'career-fair'
  | 'scholarships'
  | 'student-package'
  | 'interview-practice'
  | 'career-guidance'
  | 'mentor-booking'
  | 'workshops'
  | 'resources'
  | 'communities'
  | 'alumni-network'
  | 'referrals'
  | 'peer-mentoring'
  | 'my-internship'
  | 'internship-documents'
  | 'internship-progress'
  | 'ai-assistant'
  | 'notifications'
  | 'settings'
  | 'help-support';

export type EmployerPageId =
  | 'emp-dashboard'
  | 'emp-profile'
  | 'emp-post-opportunity'
  | 'emp-manage-opportunities'
  | 'emp-applications'
  | 'emp-career-fair'
  | 'emp-messages'
  | 'emp-settings';

export type AdminPageId =
  | 'adm-dashboard'
  | 'adm-company-approvals'
  | 'adm-opportunity-approvals'
  | 'adm-student-directory'
  | 'adm-alumni-verification'
  | 'adm-career-fair'
  | 'adm-workshops'
  | 'adm-internship-monitoring'
  | 'adm-documents'
  | 'adm-analytics'
  | 'adm-content'
  | 'adm-settings';

export type AnyPageId = StudentPageId | EmployerPageId | AdminPageId;

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  subtitle: string;
  initials: string;
  verifiedEmail: boolean;
}

export interface StudentProject {
  id: string;
  title: string;
  role: string;
  techStack: string[];
  summary: string;
  link?: string;
}

export interface StudentExperience {
  id: string;
  role: string;
  organization: string;
  period: string;
  summary: string;
}

export interface StudentProfile {
  name: string;
  studentId: string;
  email: string;
  degree: string;
  major: string;
  yearOfStudy: string;
  graduationStatus: string;
  cgpa: string;
  bio: string;
  skills: string[];
  careerInterests: string[];
  preferredIndustries: string[];
  preferredLocations: string[];
  internshipAvailability: string;
  internshipStartDate?: string;
  internshipEndDate?: string;
  openToMatches?: boolean;
  cvFileName: string | null;
  cvUpdatedDate: string | null;
  projects: StudentProject[];
  certifications: { id: string; name: string; issuer: string; date: string }[];
  education: { id: string; institution: string; qualification: string; period: string; grade: string }[];
  workExperience: StudentExperience[];
}

export interface Opportunity {
  id: string;
  title: string;
  company: string;
  logoKey: string;
  industry: string;
  location: string;
  workMode: 'Hybrid' | 'On-site' | 'Remote';
  roleType: 'Internship' | 'Graduate Role' | 'Industrial Placement';
  degreeTarget: string;
  experienceLevel: string;
  duration: string;
  allowance: string;
  deadline: string;
  matchScore: number;
  matchExplanation: string;
  skills: string[];
  summary: string;
  responsibilities: string[];
  requirements: string[];
  isDemoListing: boolean;
  approvalStatus?: 'Approved' | 'Pending Review' | 'Changes Requested';
  postedByEmployer?: boolean;
  sourceLabel?: string;
  sourceUrl?: string;
  applicationUrl?: string;
  eligibleMajors?: string[];
  internshipStartDate?: string;
  internshipEndDate?: string;
  matchNotificationsSent?: boolean;
}

export interface CareerFairBooth {
  id: string;
  company: string;
  logoKey: string;
  boothNumber: string;
  zone: string;
  industry: string;
  tagline: string;
  description: string;
  hiringFor: string[];
  openRolesCount: number;
  suggestedReason?: string;
  representatives: { name: string; role: string }[];
  talkSlot?: string;
}

export interface ScholarshipItem {
  id: string;
  title: string;
  institution: string;
  country: string;
  category: 'Scholarship' | "Master's Programme" | 'Fellowship & Grant';
  subjectArea: string;
  fundingType: 'Full Funding' | 'Partial Tuition Waiver' | 'Merit Bursary' | 'Stipend + Tuition';
  deadline: string;
  eligibilitySummary: string;
  awardValue: string;
  officialUrl: string;
}

export interface StudentBenefit {
  id: string;
  provider: string;
  title: string;
  logoKey: string;
  category: 'Developer Tools' | 'Cloud & AI' | 'Data & Certifications' | 'Design & Productivity';
  description: string;
  eligibility: string;
  redemptionSteps: string[];
  officialUrl: string;
  requiresUniEmail: boolean;
  verificationNote: string;
}

export interface InterviewerProfile {
  id: string;
  name: string;
  role: string;
  company: string;
  industry: string;
  category: string;
  expertise: string[];
  bio: string;
  availability: string;
  avatarSeed: string;
}

export interface InterviewQuestion {
  id: string;
  category: string;
  difficulty: 'Foundational' | 'Intermediate' | 'Scenario';
  prompt: string;
  keyPointsToCover: string[];
  sampleFeedback: {
    strengths: string;
    improvements: string;
    suggestedStructure: string;
  };
}

export interface MentorProfile {
  id: string;
  name: string;
  title: string;
  mentorType: 'University Lecturer' | 'Alumni Mentor';
  departmentOrCompany: string;
  expertise: string[];
  bio: string;
  sessionType: string;
  availableDays: string[];
  slots: { id: string; day: string; time: string }[];
  avatarSeed: string;
}

export interface BookingRecord {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorTitle: string;
  slotId: string;
  day: string;
  time: string;
  topic: string;
  notes: string;
  createdAt: string;
}

export interface WorkshopItem {
  id: string;
  title: string;
  category: 'Career Development' | 'Alumni-Led' | 'Lecturer-Led' | 'Industry Session' | 'Recorded Video';
  speakerName: string;
  speakerRole: string;
  speakerAvatarSeed: string;
  date: string;
  time: string;
  duration: string;
  format: 'Online Live' | 'APU Campus · Auditorium 2' | 'On-Demand Video';
  summary: string;
  agenda: string[];
  videoUrl?: string;
  capacity: number;
  registeredCount: number;
  themeColor: string;
  approvalStatus?: 'Approved' | 'Pending Approval';
}

export interface CareerResource {
  id: string;
  title: string;
  category:
    | 'CV Templates'
    | 'Interview Guides'
    | 'Career Planning'
    | 'Internship Preparation'
    | 'Professional Communication'
    | 'Technical Learning'
    | 'Video Guides';
  format: 'PDF Guide' | 'DOCX Template' | 'Checklist' | 'Video Walkthrough' | 'Interactive Playbook';
  readTime: string;
  summary: string;
  keyTakeaways: string[];
}

export interface CommunityComment {
  id: string;
  author: string;
  authorRole: string;
  timestamp: string;
  content: string;
}

export interface CommunityPost {
  id: string;
  communityId: string;
  author: string;
  authorRole: string;
  timestamp: string;
  title: string;
  content: string;
  likes: number;
  likedByMe?: boolean;
  comments: CommunityComment[];
}

export interface CommunityGroup {
  id: string;
  name: string;
  shortName: string;
  category: string;
  memberCount: number;
  description: string;
  bannerTone: string;
  leadModerator: string;
}

export interface AlumniMember {
  id: string;
  name: string;
  graduationYear: number;
  degree: string;
  company: string;
  logoKey: string;
  jobTitle: string;
  industry: string;
  country: string;
  skills: string[];
  bio: string;
  openToMentoring: boolean;
  hostsWorkshops: boolean;
  openToReferrals: boolean;
  verificationLabel: 'Simulated Alumni Profile (Demo)' | 'Pending Verification (Demo)';
  avatarSeed: string;
  relevantOpenRoles?: string[];
}

export interface PeerMentor {
  id: string;
  name: string;
  programme: string;
  year: string;
  expertise: string[];
  skills: string[];
  bio: string;
  pastInternship: string;
  availability: string;
  avatarSeed: string;
}

export type DocumentStatus =
  | 'Not Submitted'
  | 'Submitted'
  | 'Under Supervisor Review'
  | 'Manager Attested'
  | 'Approved'
  | 'Revision Needed';

export interface InternshipDocument {
  id: string;
  title: string;
  stageOrder: number;
  category: 'Onboarding' | 'Progress Report' | 'Evaluation & Attestation' | 'Final Submission';
  deadline: string;
  submittedFile: string | null;
  submittedAt: string | null;
  status: DocumentStatus;
  reviewerNote: string;
  requiresManagerAttestation?: boolean;
}

export interface ProgressLogEntry {
  id: string;
  weekLabel: string;
  dateRange: string;
  summary: string;
  hoursLogged: number;
  competencies: string[];
  supervisorSignOff: 'Signed Off (Simulated)' | 'Pending Review';
}

export interface NotificationItem {
  id: string;
  category: 'Internships' | 'Deadlines' | 'Events & Workshops' | 'Mentoring' | 'Community' | 'Internship Admin';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetPage: StudentPageId;
}

export interface EmployerApplicant {
  id: string;
  studentName: string;
  studentEmail: string;
  programme: string;
  year: string;
  cgpa: string;
  appliedRole: string;
  appliedDate: string;
  matchScore: number;
  skills: string[];
  status: 'New Application' | 'Shortlisted' | 'Interview Scheduled' | 'Offer Extended' | 'Declined';
  portfolioNote: string;
}

export interface EmployerMessageThread {
  id: string;
  participantName: string;
  participantRole: string;
  subject: string;
  unread: boolean;
  messages: { id: string; sender: 'employer' | 'other'; senderName: string; text: string; time: string }[];
}

export interface AdminCompanyApprovalItem {
  id: string;
  companyName: string;
  industry: string;
  registrationNo: string;
  contactPerson: string;
  contactEmail: string;
  submittedDate: string;
  status: 'Pending Verification' | 'Verified' | 'Changes Requested';
}
