# DigiWallet — Frontend

A React + TypeScript digital wallet app built with Vite, Tailwind CSS, and React Router.

---

## Tech Stack

- **React 18** with TypeScript
- **Vite** — bundler & dev server
- **Tailwind CSS** — styling
- **React Router v6** — client-side routing
- **Axios** — HTTP client with auto token refresh
- **React Hook Form** — form validation
- **Lucide React** — icons
- **Razorpay** — payment gateway

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_RAZORPAY_KEY=your_razorpay_key_here
```

### 3. Run the dev server
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
```

---

## Folder Structure

```
src/
├── core/
│   └── api/
│       ├── client.ts          # Axios instance + token refresh interceptor
│       └── services.ts        # All API endpoint functions
├── features/
│   ├── admin/                 # Admin dashboard (users, KYC, catalog)
│   ├── auth/                  # Login, Signup, Forgot Password pages
│   ├── dashboard/             # Main dashboard with balance, graph, transactions
│   ├── landing/               # Public landing page
│   ├── profile/               # User profile & KYC
│   ├── rewards/               # Rewards catalog & redemption
│   ├── transactions/          # Transaction history with filters
│   └── wallet/                # Wallet top-up (Razorpay) & transfer
├── layouts/
│   └── AppLayout.tsx          # Sidebar + header shell for authenticated pages
├── shared/
│   ├── components/
│   │   ├── NoWalletBanner.tsx
│   │   ├── Toast.tsx
│   │   └── UI.tsx             # StatCard, StatusBadge, Modal, etc.
│   ├── hooks/
│   │   ├── useDebounce.ts     # Prevents API spam on search inputs
│   │   └── useWebSocket.ts    # Real-time balance & transaction updates
│   └── utils/
│       ├── format.ts          # formatAmount, fmtDate, fmtDateTime
│       └── wallet.ts          # isWalletNotFound error helper
└── store/
    ├── AuthContext.tsx         # User auth state (login/logout)
    ├── NotificationContext.tsx # In-app notification bell
    └── ThemeContext.tsx        # Dark/light theme toggle
```

---

## Key Features

- **Real-time updates** via WebSocket — balance and transaction notifications update live without page refresh
- **Lazy loading** — each page is a separate JS chunk for faster initial load
- **Debounced search** — search inputs wait 500ms before firing API calls
- **Session expiry warning** — users see a clear message when redirected after token expiry
- **Spending graph** — 7-day bar chart on the dashboard showing credits vs debits
- **Razorpay integration** — wallet top-up via UPI, card, or net banking
