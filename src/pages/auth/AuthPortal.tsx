import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Info, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { authService, DEMO_ACCOUNTS } from '../../services/authService';
import { UserRole } from '../../types';

type AuthScreenMode = 'login' | 'register' | 'forgot-password' | 'verify-email';

export const AuthPortal: React.FC = () => {
  const { loginAsUser, switchRole, setShowAuthModal } = useApp();

  const [mode, setMode] = useState<AuthScreenMode>('login');
  const [campusImgError, setCampusImgError] = useState(false);
  const [logoImgError, setLogoImgError] = useState(false);

  // Form states
  const [email, setEmail] = useState('tp068421@mail.apu.edu.my');
  const [password, setPassword] = useState('••••••••••••');
  const [regName, setRegName] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDegree, setRegDegree] = useState('BSc (Hons) in Computer Science (AI)');
  const [regPassword, setRegPassword] = useState('');
  const [otpCode, setOtpCode] = useState('482910');
  const [pendingEmail, setPendingEmail] = useState('tp068421@mail.apu.edu.my');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [googleNoticeOpen, setGoogleNoticeOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const oauthMeta = authService.getGoogleOAuthPlaceholderInfo();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!email.trim() || !password.trim()) {
      setFormError('Please enter both your email address and password.');
      return;
    }
    const signedIn = await authService.signInWithEmail({ email, password });
    loginAsUser(signedIn);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!regName.trim() || !regEmail.trim() || !regStudentId.trim() || !regPassword.trim()) {
      setFormError('Please complete all required registration fields.');
      return;
    }
    const res = await authService.registerStudent({
      fullName: regName,
      universityEmail: regEmail,
      studentId: regStudentId,
      degree: regDegree,
      password: regPassword,
    });
    setPendingEmail(res.pendingVerificationEmail);
    setMode('verify-email');
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const res = await authService.verifyEmailCode(pendingEmail, otpCode);
      loginAsUser(res.user);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Invalid verification code.');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!email.trim()) {
      setFormError('Please enter your university or work email address.');
      return;
    }
    await authService.requestPasswordReset(email);
    setResetSuccess(true);
  };

  const demoRoleCards: { role: UserRole; title: string; desc: string }[] = [
    {
      role: 'student',
      title: 'Student Experience',
      desc: 'Ammar Ibrahim · Year 3 CS (AI) — Dashboard, Opportunities, Student Package, Mentoring & Internship',
    },
    {
      role: 'employer',
      title: 'Company / Employer',
      desc: 'Hannah Tan · Recruitment Workspace — Post Vacancies, Review Candidates & Career Fair Booth',
    },
    {
      role: 'admin',
      title: 'Career Centre Admin',
      desc: 'Dr. Nadia Rahman · University Admin — Approvals, Internship Monitoring & Platform Analytics',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col lg:flex-row">
      {/* Left Visual Hero with Authentic APU Campus Photo */}
      <div className="lg:w-1/2 relative bg-[#0B1528] text-white p-8 lg:p-12 flex flex-col justify-between overflow-hidden">
        {!campusImgError && (
          <img
            src="/assets/aistudio/Apu_campus_1e9018be.jpg"
            alt="Asia Pacific University Campus"
            referrerPolicy="no-referrer"
            onError={() => setCampusImgError(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#091224] via-[#0D1B38]/85 to-[#0D1B38]/75" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {!logoImgError ? (
              <div className="bg-white rounded-lg px-2.5 py-1.5 shadow-sm">
                <img
                  src="/assets/aistudio/Apu_Logo_9c651e3c.jpg"
                  alt="Asia Pacific University Logo"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoImgError(true)}
                  className="h-9 w-auto object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
                APU
              </div>
            )}
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-amber-400">APU</span>
                <span className="text-xl font-extrabold italic text-white">NEXT</span>
              </div>
              <p className="text-xs text-slate-300">Your opportunities find you.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAuthModal(false)}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors whitespace-nowrap"
          >
            Return to Workspace →
          </button>
        </div>

        <div className="relative z-10 my-10 max-w-lg">
          <p className="text-xs font-semibold text-blue-300 mb-2">
            University Career & Professional Ecosystem Prototype
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-balance">
            Connecting students, alumni, mentors, and employers in one career platform.
          </h1>
          <p className="text-sm text-slate-300 mt-4 leading-relaxed">
            Discover matched internships, claim verified Student Package developer benefits, practise
            structured interviews, book lecturer consultations, and manage industrial training reports
            seamlessly.
          </p>
        </div>

        <div className="relative z-10 border-t border-white/15 pt-4 text-xs text-slate-300 leading-relaxed">
          <strong className="text-white">Independent Prototype Notice:</strong> APU NEXT is an
          independent student-developed hackathon prototype and is not an officially affiliated or
          approved university production system. Authentication shown here runs in simulated frontend
          mode ready for Python/FastAPI integration.
        </div>
      </div>

      {/* Right Authentication & Role Entry Panel */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mode Tabs */}
          {(mode === 'login' || mode === 'register') && (
            <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setFormError(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${
                  mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setFormError(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${
                  mode === 'register'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Student Registration
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('verify-email');
                  setFormError(null);
                }}
                className="flex-1 py-2 text-xs font-semibold rounded-md text-slate-600 hover:text-slate-900 transition-colors"
              >
                Verify Email
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-xs">
            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {formError}
              </div>
            )}

            {/* 1. LOGIN VIEW */}
            {mode === 'login' && (
              <div>
                <h2 className="text-xl font-bold text-slate-900">Sign in to APU NEXT</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter simulated credentials or use instant Judge Demo Access below.
                </p>

                {/* Google Sign-In Button (Required Product Design Element) */}
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => setGoogleNoticeOpen((prev) => !prev)}
                    className="w-full py-2.5 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold flex items-center justify-center gap-3 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  {googleNoticeOpen && (
                    <div className="mt-3 p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-slate-700 space-y-2">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-900">
                            Simulated Google Sign-In (Frontend Prototype)
                          </p>
                          <p className="mt-0.5 text-slate-600 leading-relaxed">{oauthMeta.note}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => loginAsUser(DEMO_ACCOUNTS.student)}
                        className="w-full py-1.5 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                      >
                        Proceed with Simulated Google Student Session →
                      </button>
                    </div>
                  )}
                </div>

                <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span>or sign in with email</span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      University or Work Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tp068421@mail.apu.edu.my"
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetSuccess(false);
                          setMode('forgot-password');
                        }}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                  >
                    Sign In (Simulated)
                  </button>
                </form>
              </div>
            )}

            {/* 2. STUDENT REGISTRATION VIEW */}
            {mode === 'register' && (
              <div>
                <h2 className="text-xl font-bold text-slate-900">Create Student Account</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Register with your university student email to unlock matched opportunities and Student Package benefits.
                </p>

                <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Sara Al-Mansoor"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Student ID (TP Number) *
                      </label>
                      <input
                        type="text"
                        value={regStudentId}
                        onChange={(e) => setRegStudentId(e.target.value)}
                        placeholder="TP071204"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      University Email Address *
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="tp071204@mail.apu.edu.my"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Academic Programme
                    </label>
                    <select
                      value={regDegree}
                      onChange={(e) => setRegDegree(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:border-blue-600 focus:outline-none"
                    >
                      <option>BSc (Hons) in Computer Science (AI)</option>
                      <option>BSc (Hons) in Software Engineering</option>
                      <option>BSc (Hons) in Computer Science (Cyber Security)</option>
                      <option>BSc (Hons) in Data Analytics</option>
                      <option>BA (Hons) in Business Management / FinTech</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Create Password *
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                  >
                    Continue to Email Verification →
                  </button>
                </form>
              </div>
            )}

            {/* 3. FORGOT PASSWORD VIEW */}
            {mode === 'forgot-password' && (
              <div>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-4"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
                <div className="flex items-center gap-2.5 mb-2">
                  <KeyRound className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">Reset your password</h2>
                </div>
                <p className="text-xs text-slate-500">
                  Enter your registered university or employer email to preview the simulated password recovery flow.
                </p>

                {resetSuccess ? (
                  <div className="mt-5 p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-emerald-900">
                        <p className="font-bold">Simulated Reset Instructions Generated</p>
                        <p className="mt-1">
                          In production, the FastAPI mail worker dispatches a time-limited token to{' '}
                          <span className="font-semibold">{email}</span>.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="w-full py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold"
                    >
                      Return to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotSubmit} className="mt-5 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Registered Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                    >
                      Send Reset Link (Simulated)
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* 4. EMAIL VERIFICATION INTERFACE */}
            {mode === 'verify-email' && (
              <div>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-4"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
                <div className="flex items-center gap-2.5 mb-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">Verify University Email</h2>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Simulated verification step for <span className="font-semibold text-slate-800">{pendingEmail}</span>.
                  Enter any 6-digit demo code below to activate student eligibility.
                </p>

                <form onSubmit={handleVerifySubmit} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      6-Digit Verification Code (Simulated)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full px-4 py-2.5 text-center font-mono tabular-nums tracking-[0.35em] text-lg font-bold rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                  >
                    Verify & Enter Student Workspace
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Role-Based Judge Quick Access */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900">
                1-Click Hackathon Judge Role Access (No Account Needed)
              </h3>
            </div>
            <div className="space-y-2">
              {demoRoleCards.map((item) => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => switchRole(item.role)}
                  className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">{item.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.desc}</p>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 shrink-0">Enter →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
