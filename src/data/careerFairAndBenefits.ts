import { CareerFairBooth, ScholarshipItem, StudentBenefit } from '../types';

export const CAREER_FAIR_EVENT = {
  id: 'cf-2026-nov',
  title: 'APU Career & Industrial Placement Fair 2026 (Demo Event)',
  date: 'Friday, 20 November 2026',
  time: '9:30 AM – 5:00 PM MYT',
  venue: 'Technology Park Malaysia Campus · Central Atrium & Spine Level 3',
  expectedEmployers: 42,
  openPositions: 280,
  summary:
    'Meet engineering managers, graduate recruiters, and alumni hiring leads across Technology, FinTech, Energy, Semiconductors, and Advisory. Bring digital or printed CVs and build your booth itinerary ahead of time.',
};

export const CAREER_FAIR_BOOTHS: CareerFairBooth[] = [
  {
    id: 'booth-01',
    company: 'Google Malaysia',
    logoKey: 'google',
    boothNumber: 'A-01',
    zone: 'Central Atrium · Tech Zone',
    industry: 'Technology',
    tagline: 'Cloud, Developer Relations & Regional Engineering',
    description:
      'Explore 2027 software engineering internships, cloud customer engineering pathways, and tips on technical problem-solving interviews.',
    hiringFor: ['Software Engineering Intern', 'Cloud Technical Solutions Intern', 'STEP / Graduate Prep'],
    openRolesCount: 6,
    suggestedReason: 'Matches your AI & Python profile (96% fit)',
    representatives: [
      { name: 'Kelvin Lim (Demo)', role: 'Staff Cloud Architect' },
      { name: 'Aisyah Zainal (Demo)', role: 'University Programs Specialist' },
    ],
    talkSlot: '11:00 AM · Auditorium 1 — "How We Review Intern Portfolios"',
  },
  {
    id: 'booth-02',
    company: 'PETRONAS Digital',
    logoKey: 'petronas',
    boothNumber: 'A-02',
    zone: 'Central Atrium · Energy & AI Zone',
    industry: 'Energy & Engineering Tech',
    tagline: 'AI, Data Science & Industrial Digitalisation',
    description:
      'Meet data scientists and software leads building predictive analytics, autonomous plant inspection, and clean-energy platforms.',
    hiringFor: ['Data Science Intern', 'Full-Stack Developer Intern', 'Cybersecurity Trainee'],
    openRolesCount: 14,
    suggestedReason: 'Top match for Year 3 Industrial Placement (20 weeks)',
    representatives: [
      { name: 'Ir. Hafizuddin Omar (Demo)', role: 'Principal Data Scientist' },
      { name: 'Nurin Sofia (Demo)', role: 'Early Careers Partner' },
    ],
    talkSlot: '2:00 PM · Auditorium 2 — "Applied Machine Learning in Energy Systems"',
  },
  {
    id: 'booth-03',
    company: 'Microsoft Malaysia',
    logoKey: 'microsoft',
    boothNumber: 'A-04',
    zone: 'Central Atrium · Tech Zone',
    industry: 'Technology',
    tagline: 'Azure Cloud, Data & Enterprise Copilot Ecosystems',
    description:
      'Discover commercial analytics internships, Microsoft Aspire graduate roles, and student Azure certification pathways.',
    hiringFor: ['Data & Analytics Intern', 'Solution Specialist Intern', 'Aspire Graduate Track'],
    openRolesCount: 8,
    suggestedReason: 'Matches your SQL, Analytics & Cloud skills',
    representatives: [
      { name: 'Rachel Wong (Demo)', role: 'Data & AI Lead' },
      { name: 'Danial Hakim (Demo)', role: 'Talent Acquisition' },
    ],
    talkSlot: '12:15 PM · Spine Stage — "Building Resilient Cloud Architectures"',
  },
  {
    id: 'booth-04',
    company: 'Grab Malaysia',
    logoKey: 'grab',
    boothNumber: 'A-06',
    zone: 'Central Atrium · Tech Zone',
    industry: 'Technology & Superapp',
    tagline: 'Real-Time Mobility, FinTech & Geo-Engineering',
    description:
      'Chat directly with backend, mobile, and machine learning engineers from Grab’s Petaling Jaya R&D centre.',
    hiringFor: ['Backend Engineering Intern', 'Mobile iOS/Android Intern', 'Product Analytics Intern'],
    openRolesCount: 11,
    suggestedReason: 'High fit for Distributed Systems & Backend Python/Go',
    representatives: [
      { name: 'Jason Teoh (Demo)', role: 'Engineering Manager' },
      { name: 'Priya Nair (Demo)', role: 'Campus Recruiter' },
    ],
  },
  {
    id: 'booth-05',
    company: 'Maybank Group',
    logoKey: 'maybank',
    boothNumber: 'B-01',
    zone: 'Level 3 Spine · FinTech & Banking Zone',
    industry: 'Banking & FinTech',
    tagline: 'Digital Banking, Quantitative Risk & MAE Engineering',
    description:
      'Learn about the Maybank Go Ahead. Challenge, Technology Associate rotations, and 16–20 week industrial placements.',
    hiringFor: ['Graduate Technology Associate', 'FinTech Engineering Intern', 'Cyber Defence Intern'],
    openRolesCount: 18,
    suggestedReason: 'Matches your React/TypeScript & FinTech interest',
    representatives: [
      { name: 'Farah Nadia (Demo)', role: 'VP Digital Engineering' },
      { name: 'Marcus Chong (Demo)', role: 'Graduate Talent Lead' },
    ],
  },
  {
    id: 'booth-06',
    company: 'Deloitte Southeast Asia',
    logoKey: 'deloitte',
    boothNumber: 'B-03',
    zone: 'Level 3 Spine · Advisory Zone',
    industry: 'Consulting & Advisory',
    tagline: 'Cyber Risk, AI Strategy & Cloud Transformation',
    description:
      'Explore consulting internships across Cyber Risk, Technology Strategy, and Data Modernisation.',
    hiringFor: ['Cyber Risk Intern', 'Technology Consulting Analyst', 'Data Engineering Intern'],
    openRolesCount: 15,
    representatives: [
      { name: 'Evelyn Khor (Demo)', role: 'Senior Manager, Cyber' },
      { name: 'Arif Zulkifli (Demo)', role: 'Associate Director' },
    ],
  },
  {
    id: 'booth-07',
    company: 'Intel Microelectronics',
    logoKey: 'intel',
    boothNumber: 'C-02',
    zone: 'Engineering Concourse · Silicon & Edge AI',
    industry: 'Semiconductors & Hardware',
    tagline: 'Silicon Validation, Edge AI & Embedded Systems',
    description:
      'Connect with Penang engineering leads hiring 20–24 week industrial trainees across AI validation, firmware, and SoC design.',
    hiringFor: ['AI Validation Intern', 'Embedded Linux Intern', 'Silicon Design Trainee'],
    openRolesCount: 22,
    representatives: [
      { name: 'Dr. Tan Wei Ming (Demo)', role: 'Principal Validation Engineer' },
    ],
  },
  {
    id: 'booth-08',
    company: 'Accenture Malaysia',
    logoKey: 'accenture',
    boothNumber: 'B-05',
    zone: 'Level 3 Spine · Advisory Zone',
    industry: 'Consulting & Advisory',
    tagline: 'Generative AI Studios & Cloud First Engineering',
    description:
      'Discover how multidisciplinary squads prototype enterprise GenAI solutions and cloud-native platforms at TRX.',
    hiringFor: ['AI & Digital Analyst Intern', 'Custom Software Engineering Associate'],
    openRolesCount: 12,
    suggestedReason: '91% fit with your React + FastAPI prototyping stack',
    representatives: [
      { name: 'Shalini Menon (Demo)', role: 'Managing Director, Data & AI' },
    ],
  },
  {
    id: 'booth-09',
    company: 'Shopee Malaysia',
    logoKey: 'shopee',
    boothNumber: 'A-08',
    zone: 'Central Atrium · Tech Zone',
    industry: 'E-Commerce & Tech',
    tagline: 'High-Scale Commerce Product & Data Engineering',
    description:
      'Speak with product managers and data analysts powering high-concurrency marketplace campaigns.',
    hiringFor: ['Product Management Intern', 'Business Intelligence Intern', 'QA Automation Intern'],
    openRolesCount: 9,
    representatives: [
      { name: 'lucas Ng (Demo)', role: 'Senior Product Manager' },
    ],
  },
  {
    id: 'booth-10',
    company: 'Shell Business Operations',
    logoKey: 'shell',
    boothNumber: 'C-05',
    zone: 'Engineering Concourse · Cloud & Energy',
    industry: 'Energy & Engineering Tech',
    tagline: 'Global DevSecOps, Cloud Engineering & Digital Energy',
    description:
      'Meet Cyberjaya technology leads recruiting graduates and interns in cloud automation, cybersecurity, and data engineering.',
    hiringFor: ['Cloud & DevSecOps Graduate', 'IT Engineering Intern'],
    openRolesCount: 10,
    representatives: [
      { name: 'Zarina Binti Ismail (Demo)', role: 'Cloud Platform Lead' },
    ],
  },
];

export const SCHOLARSHIPS_AND_MASTERS: ScholarshipItem[] = [
  {
    id: 'sch-01',
    title: 'Chevening Master’s Scholarship (Malaysia Track — Sample Listing)',
    institution: 'UK Partner Universities',
    country: 'United Kingdom',
    category: 'Scholarship',
    subjectArea: 'Computer Science, AI, Public Policy & STEM',
    fundingType: 'Full Funding',
    deadline: '05 Nov 2026',
    awardValue: 'Full tuition + monthly living stipend + return flights',
    eligibilitySummary:
      'Malaysian citizens completing an undergraduate degree with strong leadership record and relevant work/internship hours (check annual work-experience rules on official portal).',
    officialUrl: 'https://www.chevening.org',
  },
  {
    id: 'sch-02',
    title: 'MSc in Artificial Intelligence & Machine Learning (Postgraduate Progression)',
    institution: 'Imperial College London (Sample Reference)',
    country: 'United Kingdom',
    category: "Master's Programme",
    subjectArea: 'Artificial Intelligence',
    fundingType: 'Merit Bursary',
    deadline: '15 Jan 2027',
    awardValue: 'Departmental Computing Merit Bursaries up to £10,000',
    eligibilitySummary:
      'First-class honours equivalent (CGPA >= 3.70) in Computer Science, Mathematics, or Engineering with strong linear algebra and Python foundations.',
    officialUrl: 'https://www.imperial.ac.uk/computing',
  },
  {
    id: 'sch-03',
    title: 'SINGA — Singapore International Graduate Award',
    institution: 'NUS / NTU / A*STAR / SUTD',
    country: 'Singapore',
    category: 'Scholarship',
    subjectArea: 'Computing, AI, Biomedical & Physical Sciences',
    fundingType: 'Stipend + Tuition',
    deadline: '01 Dec 2026',
    awardValue: 'Full tuition fees + S$2,700/month stipend + settling-in allowance',
    eligibilitySummary:
      'Open to international graduates with strong academic honours, research passion, and strong academic referee letters.',
    officialUrl: 'https://www.a-star.edu.sg/Scholarships',
  },
  {
    id: 'sch-04',
    title: 'Yayasan Khazanah Global & Watan Postgraduate Scholarship (Demo Summary)',
    institution: 'Leading Malaysian & Global Universities',
    country: 'Malaysia',
    category: 'Scholarship',
    subjectArea: 'Data Science, Engineering, Finance & Economics',
    fundingType: 'Full Funding',
    deadline: '30 Mar 2027',
    awardValue: 'Full tuition + living allowance + leadership development',
    eligibilitySummary:
      'Consistent First-Class / CGPA >= 3.50 academic track record and active extracurricular or community leadership.',
    officialUrl: 'https://www.yayasankhazanah.com.my',
  },
  {
    id: 'sch-05',
    title: 'Erasmus Mundus Joint Master in Cybersecurity & Dependable Systems',
    institution: 'European University Consortium',
    country: 'European Union',
    category: "Master's Programme",
    subjectArea: 'Cybersecurity',
    fundingType: 'Stipend + Tuition',
    deadline: '10 Feb 2027',
    awardValue: 'Full consortium tuition waiver + €1,400/month mobility grant',
    eligibilitySummary:
      'Bachelor’s degree in Computer Science, Cybersecurity, or Software Engineering; study across two European partner universities.',
    officialUrl: 'https://erasmus-plus.ec.europa.eu',
  },
  {
    id: 'sch-06',
    title: 'Master of Data Science & Decisions',
    institution: 'UNSW Sydney (Sample Reference)',
    country: 'Australia',
    category: "Master's Programme",
    subjectArea: 'Data Science & Analytics',
    fundingType: 'Partial Tuition Waiver',
    deadline: '31 Jan 2027',
    awardValue: 'International Scientia Coursework Award (15% – 50% tuition)',
    eligibilitySummary:
      'Bachelor’s degree with quantitative coursework in statistics, calculus, and programming; English proficiency satisfied via English-medium degree assessment.',
    officialUrl: 'https://www.unsw.edu.au',
  },
  {
    id: 'sch-07',
    title: 'MEXT Research & Master’s Postgraduate Scholarship',
    institution: 'Japanese National Universities (UTokyo, Kyoto, Tokyo Tech)',
    country: 'Japan',
    category: 'Scholarship',
    subjectArea: 'Robotics, AI, Software Systems & Engineering',
    fundingType: 'Full Funding',
    deadline: '20 May 2027',
    awardValue: '100% tuition exemption + ¥144,000/month stipend + airfare',
    eligibilitySummary:
      'International applicants under age 35 with strong undergraduate CGPA and a clear research proposal.',
    officialUrl: 'https://www.studyinjapan.go.jp',
  },
  {
    id: 'sch-08',
    title: 'MSc in Financial Technology & Quantitative Analytics (Postgraduate Demo)',
    institution: 'Local & Dual-Award Malaysian Pathway',
    country: 'Malaysia',
    category: "Master's Programme",
    subjectArea: 'FinTech & Business Analytics',
    fundingType: 'Partial Tuition Waiver',
    deadline: '28 Feb 2027',
    awardValue: 'Alumni & High-Achiever Merit Rebate (Check eligibility)',
    eligibilitySummary:
      'Graduating Bachelor’s students in Computing, Finance, Banking, or Actuarial Studies seeking accelerated Master’s progression.',
    officialUrl: 'https://www.apu.edu.my',
  },
];

export const STUDENT_BENEFITS: StudentBenefit[] = [
  {
    id: 'ben-01',
    provider: 'GitHub Education',
    title: 'GitHub Student Developer Pack',
    logoKey: 'github',
    category: 'Developer Tools',
    description:
      'Access GitHub Pro, GitHub Copilot student eligibility, cloud credits, domain names, and dozens of developer workflow tools curated for verified university students.',
    eligibility:
      'Currently enrolled degree/diploma students aged 18+ with a valid university email address and proof of current academic enrolment.',
    redemptionSteps: [
      'Sign in to your GitHub account and add your university student email address under Email Settings.',
      'Visit education.github.com/pack and submit academic verification (student ID or enrolment confirmation).',
      'Once verified, activate individual partner tools directly from the Student Developer Pack dashboard.',
    ],
    officialUrl: 'https://education.github.com/pack',
    requiresUniEmail: true,
    verificationNote: 'Check eligibility — partner offers and Copilot quotas are subject to GitHub Education verification.',
  },
  {
    id: 'ben-02',
    provider: 'GitHub Certifications',
    title: 'GitHub Foundations Pathway & Student Offers',
    logoKey: 'github',
    category: 'Data & Certifications',
    description:
      'Structured learning modules covering Git, repositories, collaboration workflows, and GitHub Actions—plus periodic student exam vouchers or discounted pathways through GitHub Education.',
    eligibility:
      'Students who have completed GitHub Education verification; voucher availability varies by cohort and promotional window.',
    redemptionSteps: [
      'Complete the official GitHub Foundations learning path on Microsoft Learn / GitHub Skills.',
      'Check your GitHub Global Campus dashboard for active certification voucher campaigns or student discounts.',
      'Schedule your assessment via the official GitHub Certification portal.',
    ],
    officialUrl: 'https://education.github.com',
    requiresUniEmail: true,
    verificationNote: 'Check eligibility — free or discounted exam vouchers change periodically by region.',
  },
  {
    id: 'ben-03',
    provider: 'Google',
    title: 'Google Gemini & Cloud Skills Boost Student Offers',
    logoKey: 'google',
    category: 'Cloud & AI',
    description:
      'Explore regional Google Gemini student plans, NotebookLM study workflows, and Google Cloud Skills Boost labs where currently eligible for higher-education students.',
    eligibility:
      'Eligibility depends on country availability, age (18+), and student status verification (such as SheerID or institutional email check).',
    redemptionSteps: [
      'Visit the official Google Gemini Students or Google Cloud Innovators/Skills Boost portal.',
      'Check current regional student offer availability for Malaysia before subscribing.',
      'Verify student enrolment using your university email where supported.',
    ],
    officialUrl: 'https://gemini.google/students',
    requiresUniEmail: true,
    verificationNote: 'Check eligibility — regional promotional windows and terms vary over time.',
  },
  {
    id: 'ben-04',
    provider: 'DataCamp',
    title: 'DataCamp Student & GitHub Pack Learning Access',
    logoKey: 'datacamp',
    category: 'Data & Certifications',
    description:
      'Interactive Python, SQL, R, Power BI, and Machine Learning tracks. Eligible students can unlock complimentary multi-month access via GitHub Student Developer Pack or lecturer DataCamp Classrooms.',
    eligibility:
      'Verified GitHub Student Developer Pack members or students enrolled in an active lecturer-hosted DataCamp Classroom.',
    redemptionSteps: [
      'Verify your GitHub Student Developer Pack status first, or request a Classroom invite link from participating faculty.',
      'Connect your GitHub account on the DataCamp student activation page.',
      'Review renewal terms carefully so no unexpected billing occurs after promotional months end.',
    ],
    officialUrl: 'https://www.datacamp.com/github-students',
    requiresUniEmail: true,
    verificationNote: 'Check eligibility — complimentary access duration depends on active GitHub Pack terms.',
  },
  {
    id: 'ben-05',
    provider: 'Microsoft Learn',
    title: 'Microsoft Student Hub & Developer Benefits',
    logoKey: 'microsoft',
    category: 'Developer Tools',
    description:
      'Guided cloud, AI, and cybersecurity role-based learning paths, practice assessments, and student certification discounts for eligible university learners.',
    eligibility:
      'Enrolled higher-education students who verify academic status inside their Microsoft Learn profile.',
    redemptionSteps: [
      'Sign in to Microsoft Learn with a personal Microsoft account and link your university email for academic verification.',
      'Navigate to the Student Hub to browse role-based tracks (AZ-900, AI-900, DP-900, SC-900).',
      'Check active student exam pricing for Malaysia during checkout.',
    ],
    officialUrl: 'https://learn.microsoft.com/training/student-hub',
    requiresUniEmail: true,
    verificationNote: 'Check eligibility — academic exam discounts require verified student status.',
  },
  {
    id: 'ben-06',
    provider: 'Microsoft Azure',
    title: 'Azure for Students (Cloud Starter Credits)',
    logoKey: 'microsoft',
    category: 'Cloud & AI',
    description:
      'Deploy virtual machines, PostgreSQL databases, web apps, and AI services for capstone projects using starter cloud credits without requiring a credit card where eligible.',
    eligibility:
      'Full-time degree students aged 18+ at accredited institutions verifying via institutional university email.',
    redemptionSteps: [
      'Open the official Azure for Students page and sign in.',
      'Verify academic status using your university email address.',
      'Configure budget alerts inside Azure Cost Management immediately after activation.',
    ],
    officialUrl: 'https://azure.microsoft.com/free/students',
    requiresUniEmail: true,
    verificationNote: 'Check eligibility — credit amounts and renewable terms are determined by Microsoft.',
  },
  {
    id: 'ben-07',
    provider: 'Amazon Web Services',
    title: 'AWS Educate & AWS Skill Builder Cloud Labs',
    logoKey: 'aws',
    category: 'Cloud & AI',
    description:
      'Self-paced cloud computing labs, architecture badges, and entry-level cloud practitioner preparation without needing a personal AWS billing card for sandbox labs.',
    eligibility:
      'Open to learners aged 16+ globally; registering with your university email streamlines student community access.',
    redemptionSteps: [
      'Register on AWS Educate using your university email address.',
      'Select your target career pathway (Cloud Support, Software Development, Data, or Cybersecurity).',
      'Complete hands-on lab badges and add verified digital credentials to your profile.',
    ],
    officialUrl: 'https://aws.amazon.com/education/awseducate',
    requiresUniEmail: false,
    verificationNote: 'Check eligibility — free self-paced labs; official AWS Certification exams are billed separately unless discounted.',
  },
  {
    id: 'ben-08',
    provider: 'JetBrains',
    title: 'JetBrains Educational Licences (PyCharm, IntelliJ, WebStorm)',
    logoKey: 'jetbrains',
    category: 'Developer Tools',
    description:
      'Professional IDEs for Python, Java, Kotlin, C++, Rust, and TypeScript development—renewable annually while you remain an active student.',
    eligibility:
      'Students enrolled in an accredited university programme with a recognised institutional email or GitHub Student Pack.',
    redemptionSteps: [
      'Visit jetbrains.com/community/education/#students and apply using your university email.',
      'Confirm the verification link sent to your student inbox.',
      'Sign in to JetBrains Toolbox App to install PyCharm Professional, IntelliJ IDEA Ultimate, or DataGrip.',
    ],
    officialUrl: 'https://www.jetbrains.com/community/education/#students',
    requiresUniEmail: true,
    verificationNote: 'Check eligibility — strictly for non-commercial learning and academic coursework.',
  },
  {
    id: 'ben-09',
    provider: 'Figma',
    title: 'Figma for Education (UI/UX & FigJam)',
    logoKey: 'figma',
    category: 'Design & Productivity',
    description:
      'Collaborate on hackathons, design systems, interactive prototypes, and architecture diagrams with education-tier team features.',
    eligibility:
      'Higher-education students able to verify enrolment status via Figma’s academic verification workflow.',
    redemptionSteps: [
      'Create or log in to your Figma account with your university email.',
      'Complete the Figma Education status verification form at figma.com/education.',
      'Upgrade your student project team workspace once approved.',
    ],
    officialUrl: 'https://www.figma.com/education',
    requiresUniEmail: true,
    verificationNote: 'Check eligibility — verification required prior to unlocking education team features.',
  },
];
