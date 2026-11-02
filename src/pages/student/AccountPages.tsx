import React, { useState } from 'react';
import { CheckCircle2, HelpCircle, Lock, Mail, Send, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { API_CONFIG } from '../../services/apiClient';

export const SettingsPage: React.FC = () => {
  const { user, showToast, setShowAuthModal } = useApp();

  const [matchAlerts, setMatchAlerts] = useState(true);
  const [deadlineReminders, setDeadlineReminders] = useState(true);
  const [alumniVisibility, setAlumniVisibility] = useState(true);
  const [employerRecruiterSearch, setEmployerRecruiterSearch] = useState(true);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account & Workspace Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage notification preferences, recruiter visibility, and authentication configuration.
        </p>
      </div>

      {/* Account Identity & Auth */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Session & Authentication</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Open Auth & OAuth Demo Screens →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block">Signed-in Demo Account</span>
            <span className="font-bold text-slate-900 mt-0.5 block">{user.name}</span>
            <span className="text-slate-500">{user.email}</span>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block">Backend API Mode</span>
            <span className="font-bold text-slate-900 mt-0.5 block">
              {API_CONFIG.useMockData ? 'Standalone Local Mock Mode' : 'Connected FastAPI Mode'}
            </span>
            <span className="font-mono text-[11px] text-slate-500">Target: {API_CONFIG.baseUrl}</span>
          </div>
        </div>
      </section>

      {/* Notification & Privacy Toggles */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Notifications & Profile Privacy</h2>

        <div className="divide-y divide-slate-100 text-xs">
          {[
            {
              label: 'High-Alignment Internship Match Alerts',
              desc: 'Notify me when new sample roles exceed 85% skill and degree alignment.',
              checked: matchAlerts,
              toggle: () => setMatchAlerts(!matchAlerts),
            },
            {
              label: 'Scholarship & Placement Report Deadlines',
              desc: 'Send 7-day and 48-hour reminders before submission cut-offs.',
              checked: deadlineReminders,
              toggle: () => setDeadlineReminders(!deadlineReminders),
            },
            {
              label: 'Visible to Verified Employers in Candidate Search',
              desc: 'Allow approved Career Fair employers to preview your skills and portfolio.',
              checked: employerRecruiterSearch,
              toggle: () => setEmployerRecruiterSearch(!employerRecruiterSearch),
            },
            {
              label: 'Allow Alumni Mentors to View Academic Projects',
              desc: 'Share project summaries automatically when booking mentoring slots.',
              checked: alumniVisibility,
              toggle: () => setAlumniVisibility(!alumniVisibility),
            },
          ].map((row) => (
            <div key={row.label} className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-slate-900 text-sm">{row.label}</p>
                <p className="text-slate-500 mt-0.5">{row.desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={row.checked}
                onClick={row.toggle}
                className={`w-11 h-6 rounded-full transition-colors p-0.5 shrink-0 ${
                  row.checked ? 'bg-[#2563EB]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    row.checked ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => showToast('Preferences saved in local demonstration state')}
            className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold"
          >
            Save Settings
          </button>
        </div>
      </section>
    </div>
  );
};

export const HelpSupportPage: React.FC = () => {
  const { showToast } = useApp();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      q: 'Is APU NEXT an official university system?',
      a: 'No. APU NEXT is an independent, student-developed hackathon prototype inspired by the APU student career ecosystem. All profiles, employer listings, and approvals are demonstration data.',
    },
    {
      q: 'Do I have to upload a CV to browse opportunities?',
      a: 'No—uploading a CV on My Profile is completely optional. You can browse, filter, save, and test simulated applications with or without attaching a PDF.',
    },
    {
      q: 'How can judges test the Employer and Career Centre Admin dashboards?',
      a: 'Use the "Demo View: Student | Employer | Career Admin" switcher in the top header bar at any time without needing separate login accounts.',
    },
    {
      q: 'Can this frontend project be exported to VS Code and connected to FastAPI?',
      a: 'Yes. The project uses standard React, TypeScript, Vite, and Tailwind CSS with zero proprietary SDK lock-in. Configure VITE_API_BASE_URL in .env.local to connect a Python/FastAPI backend.',
    },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Help, Support & Prototype FAQ</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Guidance on using APU NEXT modules, industrial training procedures, and hackathon demo
          controls.
        </p>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Frequently Asked Questions</h2>
        </div>

        <div className="divide-y divide-slate-100">
          {faqs.map((f) => (
            <div key={f.q} className="py-3.5 first:pt-0 last:pb-0">
              <h3 className="text-sm font-bold text-slate-900">{f.q}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Career & Placement Advisory Desk (Sample Info)
            </h2>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Consultation Hours: Monday – Friday, 9:00 AM – 5:30 PM MYT
          </p>
          <p className="text-slate-600 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>support-demo@apunext-prototype.example</span>
          </p>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Submit Support Inquiry (Demo)</h2>
          {submitted ? (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Support ticket logged in prototype session.</span>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!subject.trim() || !message.trim()) return;
                setSubmitted(true);
                showToast('Support inquiry submitted (Demo)');
              }}
              className="space-y-3"
            >
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject (e.g. Placement Duration Query)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe how we can help..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Inquiry</span>
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};
