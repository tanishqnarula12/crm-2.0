// Single authorised advisor account. Sign-in is allowed ONLY with these exact
// credentials — no other email/password combination is accepted.
export const AUTH_EMAIL = 'manish@fintness.in';
export const AUTH_PASSWORD = 'Fintness@2025';

const SESSION_KEY = 'gms:auth';
const SESSION_VALUE = 'authenticated';

export const isAuthenticated = () => localStorage.getItem(SESSION_KEY) === SESSION_VALUE;
export const setAuthenticated = () => localStorage.setItem(SESSION_KEY, SESSION_VALUE);
export const clearAuthentication = () => localStorage.removeItem(SESSION_KEY);
