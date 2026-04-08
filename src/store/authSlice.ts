import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { clearStoredAuth, persistAuth, readStoredUser, Tokens, User } from './authStorage';

interface AuthState {
  user: User | null;
}

const initialState: AuthState = {
  user: readStoredUser(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<{ user: User; tokens: Tokens }>) {
      state.user = action.payload.user;
      persistAuth(action.payload.user, action.payload.tokens);
    },
    logoutSuccess(state) {
      state.user = null;
      clearStoredAuth();
    },
  },
});

export const { loginSuccess, logoutSuccess } = authSlice.actions;
export default authSlice.reducer;
