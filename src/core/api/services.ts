import api from './client';

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (data: object) => api.post('/api/auth/signup', data),
  login: (data: { email: string; password: string }) => api.post('/api/auth/login', data),
  loginPhone: (data: { phone: string; password: string }) => api.post('/api/auth/login/phone', data),
  sendOtp: (data: object) => api.post('/api/auth/send-otp', data),
  verifyOtp: (data: { email: string; otp: string }) => api.post('/api/auth/verify-otp', data),
  logout: (data: object) => api.post('/api/auth/logout', data),
  refresh: (data: object) => api.post('/api/auth/refresh', data),
  forgotSendOtp: (data: { email: string }) => api.post('/api/auth/forgot-password/send-otp', data),
  forgotVerifyOtp: (data: { email: string; otp: string }) => api.post('/api/auth/forgot-password/verify-otp', data),
  resetPassword: (data: { resetToken: string; newPassword: string }) => api.post('/api/auth/reset-password', data),
};

// ─── Wallet ──────────────────────────────────────────────────────────────────
export const walletApi = {
  balance: () => api.get('/api/wallet/balance'),
  transactions: (page = 0, size = 10) => api.get(`/api/wallet/transactions?page=${page}&size=${size}`),
  ledger: (page = 0, size = 20) => api.get(`/api/wallet/ledger?page=${page}&size=${size}`),
  transfer: (data: object) => api.post('/api/wallet/transfer', data),
  withdraw: (data: object) => api.post('/api/wallet/withdraw', data),
  statement: (from: string, to: string) => api.get(`/api/wallet/statement?from=${from}&to=${to}`),
  downloadStatement: (from: string, to: string) =>
    api.get(`/api/wallet/statement/download?from=${from}&to=${to}`, { responseType: 'blob' }),
  createOrder: (amount: number) => api.post(`/api/payment/create-order?amount=${amount}`),
  verifyPayment: (data: object) => api.post('/api/payment/verify', data),
};

// ─── Rewards ─────────────────────────────────────────────────────────────────
export const rewardsApi = {
  summary: () => api.get('/api/rewards/summary'),
  catalog: () => api.get('/api/rewards/catalog'),
  transactions: () => api.get('/api/rewards/transactions'),
  redeem: (data: object) => api.post('/api/rewards/redeem', data),
  redeemPoints: (points: number) => api.post(`/api/rewards/redeem-points?points=${points}`),
};

// ─── User / KYC ──────────────────────────────────────────────────────────────
export const userApi = {
  profile: () => api.get('/api/users/profile'),
  updateProfile: (data: object) => api.put('/api/users/profile', data),
  kycStatus: () => api.get('/api/kyc/status'),
  kycSubmit: (formData: FormData) =>
    api.post('/api/kyc/submit', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard: () => api.get('/api/admin/dashboard'),
  listUsers: (params: Record<string, string | number> = {}) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return api.get(`/api/admin/users?${q}`);
  },
  getUser: (userId: number) => api.get(`/api/admin/users/${userId}`),
  blockUser: (userId: number) => api.patch(`/api/admin/users/${userId}/block`),
  unblockUser: (userId: number) => api.patch(`/api/admin/users/${userId}/unblock`),
  changeRole: (userId: number, newRole: string) =>
    api.patch(`/api/admin/users/${userId}/role?newRole=${newRole}`),
  searchUsers: (q: string, page = 0, size = 20) =>
    api.get(`/api/admin/users/search?q=${q}&page=${page}&size=${size}`),
  pendingKyc: (page = 0) => api.get(`/api/admin/kyc/pending?page=${page}`),
  approveKycById: (kycId: number) => api.post(`/api/admin/kyc/${kycId}/approve`),
  rejectKycById: (kycId: number, reason: string) =>
    api.post(`/api/admin/kyc/${kycId}/reject?reason=${encodeURIComponent(reason)}`),
  approveKycByUserId: (userId: number) => api.post(`/api/admin/kyc/user/${userId}/approve`),
  rejectKycByUserId: (userId: number, reason: string) =>
    api.post(`/api/admin/kyc/user/${userId}/reject?reason=${encodeURIComponent(reason)}`),
  addCatalogItem: (data: object) => api.post('/api/rewards/catalog/add', data),
};
