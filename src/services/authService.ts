import { DemoUser, UserRole } from '../types';
import { apiRequest } from './apiClient';

const USER_KEY = 'apu_next_user';
const TOKEN_KEY = 'apu_next_access_token';
type AuthResponse = { token: string; user: DemoUser; approvalStatus?: string; message?: string };

export const authService = {
  currentUser(): DemoUser | null {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') as DemoUser | null; }
    catch { localStorage.removeItem(USER_KEY); return null; }
  },
  async signInWithEmail(email: string, password: string): Promise<DemoUser> {
    return this.complete(await apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }));
  },
  async register(input: { name: string; email: string; password: string; role: UserRole; staffCode?: string; programmeId?: string }): Promise<DemoUser> {
    if (!input.name.trim() || !input.email.includes('@')) throw new Error('Enter your name and a valid email address.');
    if (input.password.length < 8) throw new Error('Use a password with at least 8 characters.');
    if (input.role === 'student' && !input.programmeId) throw new Error('Select your academic programme from the catalogue.');
    const { data } = await apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ name: input.name, email: input.email, password: input.password, role: input.role, staff_code: input.staffCode, programme_id: input.programmeId }) });
    if (data.approvalStatus === 'Pending') throw new Error(data.message || 'Company registration submitted for Career Centre approval.');
    return this.complete({ data });
  },
  complete(response: { data: AuthResponse }): DemoUser {
    localStorage.setItem(TOKEN_KEY, response.data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
    return response.data.user;
  },
  signOut() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); },
};
