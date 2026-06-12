# StrongHold: Non-Custodial Escrow & Sacco Engine

A production-grade, decentralized Bitcoin escrow platform designed to enforce clinical recovery milestones and optimize community savings (Sacco) collateralization without central counterparty dependencies.

## 🚀 Project Overview

StrongHold combines cryptographic accountability with community-based finance:

- **2-of-3 Multisig Escrow Vaults** - Recovery funding locked on-chain, disbursed only after verified clinical milestones
- **SACCO Collateral Management** - Dynamic 65% Loan-to-Value safeguards for community savings pools
- **Lightning Network Payouts** - Instant micro-payments to survey respondents (near-zero fees)
- **Volunteer Vesting** - Earn Bitcoin through contributions with 14-day warranty locks

## 📦 Technology Stack

### Backend
- **Node.js + Express** - RESTful API server with middleware
- **PostgreSQL (Supabase)** - User accounts, vault state, oracle logs
- **bitcoinjs-lib** - Bitcoin multisig script building & transaction crafting
- **tiny-secp256k1** - ECDSA signing & key management

### Frontend
- **Vanilla JavaScript** - No framework overhead, cryptographic UI state
- **Tailwind CSS + Custom CSS** - Dark theme responsive dashboard
- **localStorage** - Client-side session persistence

### Blockchain
- **Bitcoin Layer 1** - P2WSH (Pay-to-Witness-Script-Hash) multisig contracts
- **Lightning Network** - Alby WebLN API for instant payments
- **Mempool.space API** - Transaction tracking & confirmation monitoring

## 📂 Folder Structure

\\\
stronghold/
├── .github/                  # CI/CD workflows
├── backend/
│   └── src/
│       ├── controllers/      # Route handlers
│       ├── middleware/       # Auth, rate limiting
│       ├── services/         # Bitcoin & multisig coordination
│       ├── errors.js         # Centralized error handling
│       ├── server.js         # Express API server
│       └── testCrypto.js     # Bitcoin crypto testing
├── frontend/
│   ├── public/               # Static assets
│   ├── static/
│   │   └── style.css         # Dashboard stylesheet
│   ├── templates/
│   │   ├── home.html         # Landing page
│   │   ├── about.html        # Engineering spec
│   │   ├── login.html        # Authentication UI
│   │   └── index.html        # Main dashboard
│   └── components/           # React components (future)
├── contracts/                # Bitcoin minscript & descriptors
├── database_schema.sql       # PostgreSQL schema
└── package.json              # Dependencies
\\\

## ⚙️ Prerequisites

Before getting started, ensure you have installed:

- **Node.js** (v16+) - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **npm** - Comes with Node.js

## 🔧 Installation & Setup

### 1. Clone the Repository

\\\ash
git clone https://github.com/Musaamanipeace/Stronghold.git
cd Stronghold
\\\

### 2. Switch to Development Branch

\\\ash
git checkout amani
\\\

### 3. Install Backend Dependencies

\\\ash
npm install
\\\

This installs:
- **express** - Web server framework
- **cors** - Cross-origin resource sharing
- **bitcoinjs-lib** - Bitcoin utilities
- **ecpair** - Key pair management
- **tiny-secp256k1** - Elliptic curve cryptography

### 4. Verify Installation

\\\ash
npm list
\\\

You should see all packages installed without errors.

## 🏃 Running the Project Locally

### Option 1: Start the Backend Server

\\\ash
node backend/src/server.js
\\\

Expected output:
\\\
[StrongHold Backend] Server running at http://localhost:5000
[StrongHold Backend] Health check: GET /api/health
[StrongHold Backend] Authentication: POST /api/auth/session
\\\

### Option 2: Open the Frontend Home Page

1. **Open in your default browser:**
   \\\ash
   # On Windows (PowerShell)
   Start-Process "frontend/templates/home.html"
   
   # On macOS
   open frontend/templates/home.html
   
   # On Linux
   xdg-open frontend/templates/home.html
   \\\

2. **Or manually navigate:**
   - Open your browser and go to: \ile:///path/to/Stronghold/frontend/templates/home.html\

3. **Navigation Flow:**
   - **Home** - Landing page with feature overview
   - **About Me** - Engineering specification & tech stack
   - **Login / Access App** - Authentication (test credentials below)
   - **Dashboard** - Role-based panels (Sponsor or Member)

## 🔐 Test Credentials

### For Development/Testing:

**Sacco Member:**
- Email: \member@stronghold.local\
- Password: \password123\
- Role: Member (SACCO collateral management)

**Sponsor/Donor:**
- Email: \sponsor@stronghold.local\
- Password: \password123\
- Role: Sponsor (Escrow initialization)

*Note: Credentials are mocked for testing. Production auth connects to Supabase.*

## 🧪 Testing Cryptography

Test the Bitcoin multisig script generation:

\\\ash
node testCrypto.js
\\\

Expected output:
\\\
--- Starting StrongHold Cryptographic Pre-flight Test ---
Server PubKey Generated: 0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798
✔ CRYPTO SCRIPT SUCCESSFUL!
Generated Multisig Address: 2N...
Redeem Script Hex: 52...
\\\

## 📊 Database Setup

To initialize the PostgreSQL schema:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the schema:
   \\\ash
   psql -U your_user -d your_db -f database_schema.sql
   \\\

This creates tables for:
- Users (students, patients, donors, admins)
- Escrow Vaults (2-of-3 multisig accounts)
- Surveys (Lightning micro-payments)
- Volunteer Tasks & Vesting

## 🌐 API Endpoints

### Health Check
\\\
GET /api/health
\\\

### Authentication
\\\
POST /api/auth/session
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "requestedRole": "member"
}
\\\

Response:
\\\json
{
  "success": true,
  "session": {
    "userId": "usr-abc1234567",
    "role": "member",
    "token": "sh_token_eyJ1c2VySWQiOiJ...",
    "expiresInSeconds": 3600
  }
}
\\\

## 🔒 Security Features

- **JWT Tokens** - Stateless session authentication
- **Role-Based Access Control (RBAC)** - Sponsor vs Member panels
- **localStorage Session Guard** - Auto-redirect on missing auth
- **CORS Protection** - Cross-origin request filtering
- **Error Handling** - Centralized exception management with semantic codes

## 📝 File Descriptions

| File | Purpose |
|------|---------|
| \database_schema.sql\ | PostgreSQL schema for users, vaults, surveys, tasks |
| \	estCrypto.js\ | Bitcoin 2-of-3 multisig address generation test |
| \ackend/src/errors.js\ | Custom error classes & HTTP responses |
| \ackend/src/server.js\ | Express server with auth endpoint |
| \rontend/static/style.css\ | Dark theme dashboard styles |
| \rontend/templates/home.html\ | Landing page with features |
| \rontend/templates/about.html\ | Engineering spec & tech stack |
| \rontend/templates/login.html\ | Authentication UI with role selection |
| \rontend/templates/index.html\ | Main dashboard (session-protected) |

## 🚀 Next Steps

- [ ] Connect to live Supabase database
- [ ] Implement real JWT token signing
- [ ] Add Bitcoin transaction builder UI
- [ ] Deploy backend to Heroku/Railway
- [ ] Set up GitHub Actions CI/CD
- [ ] Add Lightning Network payment integration
- [ ] Build patient recovery tracking views

## 🐛 Troubleshooting

### Port 5000 Already in Use
\\\ash
# Change port
PORT=5001 node backend/src/server.js
\\\

### CORS Errors
Ensure backend is running and accessible at \http://localhost:5000\

### Frontend Not Loading CSS
Check browser dev tools (F12) and verify \rontend/static/style.css\ path is correct

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (\git checkout -b feature/amazing-feature\)
3. Commit changes (\git commit -m 'Add amazing feature'\)
4. Push to branch (\git push origin feature/amazing-feature\)
5. Open a Pull Request

## 📧 Contact

For questions or support, reach out to the development team.

---

**Built with ❤️ using Bitcoin, Lightning Network & PostgreSQL**
