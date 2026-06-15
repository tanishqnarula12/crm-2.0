// Authorised accounts. Access is ONLY allowed with one of these two credentials.
// admin  — full read/write access
// viewer — read-only, no add / edit / delete actions
export const ACCOUNTS = [
  { email: 'manish@fintness.in',   password: 'Fintness@2025', role: 'admin'  },
  { email: 'services@fintness.in', password: 'Fintness@4321', role: 'viewer' },
];

const SESSION_KEY  = 'gms:auth';
const SESSION_ROLE = 'gms:role';

export const findAccount = (email, password) =>
  ACCOUNTS.find(
    a => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password
  ) || null;

export const isAuthenticated = () => !!localStorage.getItem(SESSION_KEY);
export const getRole         = () => localStorage.getItem(SESSION_ROLE) || 'viewer';
export const isViewerRole    = () => getRole() === 'viewer';

export const setAuthenticated = (role) => {
  localStorage.setItem(SESSION_KEY, 'authenticated');
  localStorage.setItem(SESSION_ROLE, role);
};

export const clearAuthentication = () => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_ROLE);
};
