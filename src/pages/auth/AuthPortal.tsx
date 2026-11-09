import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { authService } from '../../services/authService';
import { UserRole } from '../../types';

export const AuthPortal: React.FC = () => {
  const { loginAsUser } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    try {
      const user = mode === 'login' ? await authService.signInWithEmail(email, password) : await authService.register({ name, email, password, role, staffCode });
      loginAsUser(user);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not sign in.'); }
  };
  return <main className="grid min-h-screen bg-slate-100 lg:grid-cols-2">
    <aside className="relative hidden overflow-hidden bg-[#0D1526] text-white lg:flex lg:flex-col lg:justify-end lg:p-12">
      <img src="/assets/aistudio/Apu_campus_1e9018be.jpg" alt="APU campus" className="absolute inset-0 h-full w-full object-cover opacity-35" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#091224] via-[#0D1B38]/70 to-[#0D1B38]/40" />
      <div className="relative"><p className="text-sm font-extrabold tracking-[.18em] text-amber-300">APU NEXT</p><h2 className="mt-4 max-w-lg text-4xl font-bold">Your Career. Our Support.</h2><p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-200">Find career resources, manage your profile, and explore relevant internship opportunities.</p></div>
    </aside>
    <div className="flex items-center justify-center p-4 sm:p-8">
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="mb-6 text-center"><p className="text-sm font-extrabold tracking-[.18em] text-amber-500">APU NEXT</p><h1 className="mt-3 text-2xl font-bold text-slate-900">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1><p className="mt-2 text-sm text-slate-500">Sign in to your career workspace</p></div>
      <div className="mb-5 grid grid-cols-2 rounded-lg bg-slate-100 p-1">{(['login', 'register'] as const).map((tab) => <button key={tab} type="button" onClick={() => { setMode(tab); setError(''); }} className={`rounded-md py-2 text-sm font-semibold ${mode === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{tab === 'login' ? 'Sign in' : 'Sign up'}</button>)}</div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <form onSubmit={submit} className="space-y-4">
        {mode === 'register' && <><label className="block text-sm font-medium text-slate-700">Name<input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label><label className="block text-sm font-medium text-slate-700">I am a<select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"><option value="student">Student</option><option value="admin">Career Centre staff</option><option value="employer">Employer</option></select></label>{role === 'admin' && <label className="block text-sm font-medium text-slate-700">Career Centre invite code<input required autoComplete="off" type="password" value={staffCode} onChange={(e) => setStaffCode(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5"/><span className="mt-1 block text-xs text-slate-500">Ask the system administrator for the staff code.</span></label>}</>}
        <label className="block text-sm font-medium text-slate-700">Email<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
        <label className="block text-sm font-medium text-slate-700">Password<input required type="password" minLength={mode === 'register' ? 8 : undefined} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" />{mode === 'register' && <span className="mt-1 block text-xs text-slate-500">Use at least 8 characters.</span>}</label>
        <button className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">{mode === 'login' ? 'Sign in' : 'Create account and continue'}</button>
      </form>
    </section>
    </div>
  </main>;
};
