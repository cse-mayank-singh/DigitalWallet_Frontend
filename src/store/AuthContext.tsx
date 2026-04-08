import { useCallback } from 'react';
import { loginSuccess, logoutSuccess } from './authSlice';
import { useAppDispatch, useAppSelector } from './hooks';
import type { Tokens, User } from './authStorage';

interface AuthContextType {
  user: User | null;
  login: (userData: User, tokens: Tokens) => void;
  logout: () => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): AuthContextType {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const login = useCallback((userData: User, tokens: Tokens) => {
    dispatch(loginSuccess({ user: userData, tokens }));
  }, [dispatch]);

  const logout = useCallback(() => {
    dispatch(logoutSuccess());
  }, [dispatch]);

  return {
    user,
    login,
    logout,
    isAdmin: user?.role === 'ADMIN',
    isAuthenticated: !!user,
  };
}
