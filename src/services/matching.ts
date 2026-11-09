import { Opportunity, StudentProfile } from '../types';

export interface MatchResult {
  score: number;
  components: { skills: number; programme: number; location: number; timing: number };
  reasons: string[];
  matchedSkills: string[];
  missingSkills: string[];
}

// Lightweight NLP normalization: canonicalize common CV/listing variants and
// compare skill phrases against profile text. This is explainable keyword matching,
// not a probability or a hosted AI model.
const aliasGroups: Record<string, string[]> = {
  javascript: ['js', 'javascript', 'ecmascript'], react: ['react', 'reactjs', 'react.js'],
  'node.js': ['node', 'nodejs', 'node.js', 'node js'], python: ['py', 'python'],
  sql: ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite'],
  'power bi': ['power bi', 'powerbi', 'microsoft power bi'],
  excel: ['excel', 'ms excel', 'microsoft excel', 'spreadsheet'],
  'machine learning': ['machine learning', 'ml', 'scikit-learn', 'scikit learn', 'sklearn'],
  'data analysis': ['data analysis', 'data analytics', 'analytics', 'data analyst'],
  'c++': ['c++', 'c plus plus'], 'c#': ['c#', 'c sharp'],
  'ui/ux': ['ui ux', 'ui/ux', 'user experience', 'user interface'],
  communication: ['communication', 'presentation', 'public speaking'],
};
const normalize = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9+#./\s-]/g, ' ').replace(/[./-]+/g, ' ').replace(/\s+/g, ' ').trim();
const canonical = (value: string) => {
  const n = normalize(value);
  return Object.entries(aliasGroups).find(([, aliases]) => aliases.some((alias) => normalize(alias) === n))?.[0] || n;
};
const date = (value?: string) => value ? new Date(`${value.slice(0, 10)}T00:00:00`).getTime() : NaN;
const eligible = (profile: StudentProfile, opportunity: Opportunity) => {
  const targets = [opportunity.degreeTarget, ...(opportunity.eligibleMajors || [])].map(normalize).filter(Boolean);
  if (!targets.length || targets.some((target) => /all (program|programme|discipline)|any (program|programme)|related discipline/.test(target))) return true;
  const program = normalize(`${profile.degree} ${profile.major}`);
  return targets.some((target) => program.includes(target) || target.includes(program) || target.split(' ').some((word) => word.length > 3 && program.includes(word)));
};

export function scoreOpportunity(profile: StudentProfile, opportunity: Opportunity): MatchResult | null {
  if (opportunity.approvalStatus && opportunity.approvalStatus !== 'Approved') return null;
  if (profile.openToMatches === false) return null;
  const deadline = date(opportunity.deadline);
  if (Number.isFinite(deadline) && deadline < new Date().setHours(0, 0, 0, 0)) return null;

  const profileText = [profile.bio, ...profile.skills, ...profile.careerInterests,
    ...profile.projects.flatMap((item) => [item.title, item.summary, ...item.techStack]),
    ...profile.workExperience.flatMap((item) => [item.role, item.summary, item.organization])].join(' ');
  const required = [...new Set(opportunity.skills.map(canonical).filter(Boolean))];
  const candidateTerms = new Set([...profile.skills, ...profile.careerInterests].map(canonical));
  const matchedSkills = required.filter((skill) => candidateTerms.has(skill) || normalize(profileText).includes(skill));
  const missingSkills = required.filter((skill) => !matchedSkills.includes(skill));

  // One relevant required keyword is enough to be considered; multiple keywords
  // strengthen the score. Programme, place, and timing are signals, not brittle blockers.
  const coverage = required.length ? matchedSkills.length / required.length : 0;
  const skills = required.length ? (matchedSkills.length ? Math.round(35 + 35 * coverage) : 0) : 25;
  const programmeMatches = eligible(profile, opportunity);
  const programme = programmeMatches ? 15 : 5;
  const locations = profile.preferredLocations.map(normalize).filter(Boolean);
  const jobLocation = normalize(opportunity.location || '');
  const locationMatches = !locations.length || !jobLocation || locations.some((place) => jobLocation.includes(place) || place.includes(jobLocation));
  const location = locationMatches ? 10 : 4;
  const studentStart = date(profile.internshipStartDate), studentEnd = date(profile.internshipEndDate);
  const jobStart = date(opportunity.internshipStartDate), jobEnd = date(opportunity.internshipEndDate);
  const datesKnown = [studentStart, studentEnd, jobStart, jobEnd].every(Number.isFinite);
  const timingMatches = datesKnown && studentStart <= jobEnd && studentEnd >= jobStart;
  const timing = timingMatches ? 5 : datesKnown ? 1 : 3;
  const score = Math.min(100, skills + programme + location + timing);

  return {
    score, components: { skills, programme, location, timing }, matchedSkills, missingSkills,
    reasons: [
      required.length ? `${matchedSkills.length}/${required.length} listing keywords found${matchedSkills.length ? `: ${matchedSkills.join(', ')}` : ''}${missingSkills.length ? `; still to develop: ${missingSkills.join(', ')}` : ''}` : 'Listing has no required keyword list; profile relevance contributes a starter score',
      programmeMatches ? 'Your programme appears eligible' : 'Programme eligibility may need Career Centre review',
      locationMatches ? 'Location fits your preferences or no preference was set' : 'Location differs from your preferred locations',
      timingMatches ? 'Your placement dates overlap the listing' : datesKnown ? 'Placement dates do not overlap; check the listing details' : 'Add placement dates to refine this result',
    ],
  };
}

export function getStrongMatches(profile: StudentProfile, opportunities: Opportunity[]) {
  return opportunities.map((opportunity) => ({ opportunity, result: scoreOpportunity(profile, opportunity) }))
    .filter((entry): entry is { opportunity: Opportunity; result: MatchResult } => Boolean(entry.result && entry.result.score >= 80))
    .sort((a, b) => b.result.score - a.result.score);
}
