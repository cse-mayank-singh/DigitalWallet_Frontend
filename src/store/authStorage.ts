export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: 'USER' | 'ADMIN' | 'MERCHANT';
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export function readStoredUser(): User | null {
  try {
    const user = sessionStorage.getItem('user');
    return user ? (JSON.parse(user) as User) : null;
  } catch {
    return null;
  }
}

export function persistAuth(user: User, tokens: Tokens) {
  sessionStorage.setItem('accessToken', tokens.accessToken);
  sessionStorage.setItem('refreshToken', tokens.refreshToken);
  sessionStorage.setItem('userId', String(user.id));
  sessionStorage.setItem('userRole', user.role);
  sessionStorage.setItem('userEmail', user.email);
  sessionStorage.setItem('user', JSON.stringify(user));
}

export function clearStoredAuth() {
  sessionStorage.clear();
}
