export type LoginResp = {
  token: string;
};

export function saveToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('admin_jwt', token);
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_jwt');
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('admin_jwt');
}
