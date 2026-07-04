# GStack Crypto Deposit

A full-stack crypto deposit web application with user and admin dashboards. Built with React, Express, SQLite, and JWT authentication.

## Features

### User Dashboard
- **Secure authentication** — email/password registration with BIP39 12-word seed phrase backup
- **Account recovery** — recover access using your seed phrase
- **Balance overview** — view BTC and USDT balances prominently
- **Deposit crypto** — generate deposit addresses for BTC (Bitcoin network) and USDT (TRC-20, ERC-20)
- **Transaction history** — view all deposits with status indicators (pending / confirmed / failed)

### Admin Dashboard
- **Protected interface** — only accessible to admin role users
- **Pending notifications** — flag system highlights new deposits requiring review
- **Transaction management** — review, confirm, or reject deposits; confirms auto-update user balances
- **User management** — view all users, edit details (email, role, balances), delete accounts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite (better-sqlite3) |
| Auth | JWT + bcrypt |
| Seed Phrases | BIP39 (bip39 npm package) |

## Project Structure

```
crypto-deposit-app/
├── server/                    # Express API backend
│   ├── src/
│   │   ├── index.ts           # Entry point, middleware setup
│   │   ├── db.ts              # SQLite schema + helpers
│   │   ├── auth.ts            # JWT, bcrypt, BIP39
│   │   ├── middleware/        # Auth guards
│   │   └── routes/            # auth, user, admin routes
│   ├── package.json
│   └── tsconfig.json
├── client/                    # React SPA frontend
│   ├── src/
│   │   ├── App.tsx            # Router setup
│   │   ├── api/               # API client
│   │   ├── context/           # Auth context
│   │   ├── pages/             # All page components
│   │   └── types/             # TypeScript interfaces
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Switdeveloper/crypto-deposit-app.git
cd crypto-deposit-app

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### Running Locally

#### Backend setup

The backend uses SQLite, so zero external database setup is needed. The `data/` directory and database file are auto-created on first run.

##### Environment variables (optional)

Create `server/.env` to override defaults:

```env
PORT=3001
JWT_SECRET=your-secure-secret-here
CORS_ORIGIN=http://localhost:4321
NODE_ENV=development
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `JWT_SECRET` | `gstack-dev-secret-change-in-production` | JWT signing key — **required to change in production** |
| `CORS_ORIGIN` | `http://localhost:4321` | Allowed CORS origin (the frontend URL) |
| `NODE_ENV` | `development` | Environment mode |

##### Start the server

```bash
cd server
npm run dev
```

The server will:
1. Auto-create the `data/` directory and SQLite database
2. Create all tables (users, transactions, deposit_addresses, audit_log)
3. Seed test accounts on first run
4. Start on http://localhost:3001

Verify it's running:

```bash
curl http://localhost:3001/api/health
# {"status":"ok","timestamp":"..."}
```

#### Frontend setup

```bash
cd client
npm run dev
```

Starts on http://localhost:4321 with hot reload. The Vite dev server proxies `/api/*` requests to the backend at `http://localhost:3001`.

Open http://localhost:4321 in your browser.

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gstack.com | admin123 |
| User | user@gstack.com | user123 |

## API Endpoints

### Auth (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Create account (returns seed phrase once) |
| POST | `/login` | Sign in with email + password |
| POST | `/recover` | Recover account with seed phrase |

### User (`/api/user`) — requires JWT
| Method | Path | Description |
|--------|------|-------------|
| GET | `/profile` | Get current user profile |
| GET | `/balance` | Get BTC + USDT balances |
| GET | `/transactions` | Get deposit history |
| POST | `/deposit` | Generate deposit address |

### Admin (`/api/admin`) — requires admin JWT
| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | List all users |
| PUT | `/users/:id` | Update user details |
| DELETE | `/users/:id` | Delete user |
| GET | `/transactions` | List all transactions (optional `?status=` filter) |
| POST | `/transactions/:id/confirm` | Confirm pending deposit |
| POST | `/transactions/:id/reject` | Reject pending deposit |

## Security

- Passwords hashed with bcrypt (cost factor 12)
- Seed phrases never stored in plaintext (bcrypt hash only)
- JWT tokens with 24-hour expiry
- Helmet HTTP security headers
- CORS restricted to configured frontend origin
- Rate limiting on auth endpoints (20 requests per 15 minutes)
- Zod validation on all request bodies
- Admin audit logging for sensitive actions
- Admin self-deletion prevention

## Deployment

### Frontend (Vercel)
1. Connect `client/` to Vercel
2. Build command: `npm run build`
3. Output directory: `dist/`

### Backend (Render / Railway / Fly.io)
SQLite requires a persistent filesystem, so use a platform that supports long-running services:
- [Render Web Services](https://render.com/)
- [Railway](https://railway.app/)
- [Fly.io](https://fly.io/)

Set the following environment variables on your server:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |
| `JWT_SECRET` | (dev secret) | JWT signing key — **change in production** |
| `CORS_ORIGIN` | http://localhost:4321 | Allowed CORS origin |

## License

MIT
