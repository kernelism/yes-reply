
<div align="center">

# YesReply 💌

**A premium email platform where your inbox has a price tag**

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Documentation](#-documentation) • [API](#-api-reference)

</div>

---

## 📖 Overview

**YesReply** is a revolutionary email platform that puts a price on reaching your inbox. Users set their own email price (starting at $2, up to $5 for verified profiles), and senders pay to reach them. Recipients earn money for every email received and responded to.

### 🎯 How It Works

1. **Set Your Price**: Users create a profile with a custom `username@yesreply.tech` email address and set their inbox price
2. **Get Paid to Receive**: Earn $0.20 immediately when someone sends you an email
3. **Earn More by Responding**: Get the remaining payment (e.g., $1.80 more if sender paid $2) when you reply
4. **Automatic Refunds**: If you don't respond within 48 hours, the sender gets an automatic refund
5. **Cash Out**: Withdraw your earnings to your bank account (minimum $10)

### 🌟 Perfect For

- 🎓 Industry experts and consultants
- 💼 Busy professionals managing inbox overload
- 🚀 Founders and executives
- 📱 Content creators and influencers
- 💡 Anyone who values their time and attention

---

## ✨ Features

### Core Features

- **💰 Monetized Inbox**: Charge $2-$5 per email based on verification level
- **👤 Professional Profiles**: Showcase your expertise, job title, company, and interests
- **🔐 LinkedIn Verification**: Increase your price limit to $5 with LinkedIn verification
- **💳 Stripe Integration**: Secure payments and cashouts via Stripe
- **📧 AWS SES Integration**: Professional email delivery with full threading support
- **⚡ Real-time Notifications**: Get notified of payments and new emails
- **📊 Wallet Management**: Track earnings, transactions, and cash out anytime
- **🔄 Automatic Refunds**: 48-hour response window with automatic refund processing
- **📬 Email Threading**: Proper RFC 822 email threading with Message-ID support
- **🔒 JWT Authentication**: Secure token-based authentication
- **💾 Transaction History**: Complete audit trail of all financial activities

### Technical Features

- **🚀 Fast API**: High-performance async Python backend with FastAPI
- **⚛️ Modern Frontend**: React 18 with TailwindCSS for beautiful UI
- **🗄️ Flexible Database**: PostgreSQL for production, SQLite for development
- **📝 Auto-generated API Docs**: Interactive Swagger/OpenAPI documentation
- **🔧 Simple DB Management**: No migrations - tables auto-create from models
- **☁️ Azure Ready**: Optimized for Azure PostgreSQL deployment
- **🎨 Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **🧪 Type Safety**: Full TypeScript support and Pydantic validation

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 16+** and npm
- **Poetry** (Python package manager)
- **PostgreSQL** (production) or SQLite (development)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/yesreply.git
cd yesreply

# Backend Setup
cd backend
poetry install
cp .env.example .env  # Configure your environment variables
poetry run python init_db.py  # Initialize database

# Frontend Setup
cd ../frontend/yesreply
npm install

# Start Development Servers
# Terminal 1 - Backend
cd backend
poetry run uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend/yesreply
npm start
```

Your app will be running at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

For detailed setup instructions, see [SETUP.md](SETUP.md)

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         YesReply Platform                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   React Frontend │◄───────►│  FastAPI Backend │◄───────►│   PostgreSQL     │
│                  │  REST    │                  │  SQL    │    Database      │
│  - Dashboard     │   API    │  - Auth          │         │                  │
│  - Profile       │          │  - Emails        │         │  - Users         │
│  - Payments      │          │  - Payments      │         │  - Emails        │
│  - Settings      │          │  - Webhooks      │         │  - Transactions  │
└──────────────────┘         └──────────────────┘         └──────────────────┘
         │                            │                             │
         │                            ├─────────────────────────────┤
         │                            │                             │
         │                   ┌────────▼──────────┐         ┌────────▼─────────┐
         │                   │  Stripe API       │         │   AWS SES        │
         │                   │                   │         │                  │
         │                   │  - Payments       │         │  - Email Send    │
         │                   │  - Refunds        │         │  - Email Receive │
         │                   │  - Cashouts       │         │  - Webhooks      │
         └──────────────────►│  - Webhooks       │         │  - Threading     │
              Stripe.js       └───────────────────┘         └──────────────────┘
```

### Technology Stack

#### Backend

- **Framework**: FastAPI (Python 3.10+)
- **Database**: PostgreSQL 14+ / SQLite (dev)
- **ORM**: SQLAlchemy 2.0
- **Authentication**: JWT (JSON Web Tokens)
- **Payment Processing**: Stripe API
- **Email Service**: AWS SES
- **Validation**: Pydantic v2
- **API Documentation**: OpenAPI/Swagger

#### Frontend

- **Framework**: React 18
- **Routing**: React Router v6
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **HTTP Client**: Fetch API
- **Payment UI**: Stripe Elements

#### Infrastructure

- **Database**: Azure Database for PostgreSQL
- **Email**: AWS SES
- **Payments**: Stripe
- **Deployment**: Docker-ready (Azure, AWS, or any cloud)

---

## 📁 Project Structure

```
yesreply/
├── backend/
│   ├── app/
│   │   ├── api/                    # API endpoints
│   │   │   ├── auth.py            # Authentication (login, signup, token)
│   │   │   ├── verification.py    # LinkedIn verification
│   │   │   ├── emails.py          # Email management
│   │   │   ├── payments.py        # Stripe payments & cashouts
│   │   │   ├── notifications.py   # User notifications
│   │   │   ├── ses_webhook.py     # AWS SES webhook handler
│   │   │   └── schemas.py         # Pydantic schemas
│   │   ├── core/
│   │   │   ├── config.py          # Configuration settings
│   │   │   └── security.py        # JWT & password hashing
│   │   ├── db/
│   │   │   ├── base.py            # SQLAlchemy base
│   │   │   ├── models.py          # Database models
│   │   │   └── session.py         # Database session
│   │   ├── utils/
│   │   │   ├── ses.py             # AWS SES email utilities
│   │   │   ├── payment_processor.py # Stripe payment logic
│   │   │   ├── refund_scheduler.py  # Automatic refund system
│   │   │   └── notification_manager.py # Notification system
│   │   └── main.py                # FastAPI application
│   ├── init_db.py                 # Database initialization
│   ├── populate_dummy_data.py     # Test data generator
│   ├── pyproject.toml             # Python dependencies
│   └── .env                       # Environment variables
│
├── frontend/
│   └── yesreply/
│       ├── public/
│       ├── src/
│       │   ├── pages/
│       │   │   ├── Login.js       # Login page
│       │   │   ├── SignUp.js      # Signup page
│       │   │   ├── Dashboard.js   # Main dashboard
│       │   │   ├── Profile.js     # User profile
│       │   │   ├── Payments.js    # Wallet & payments
│       │   │   └── ProfileCreation.js # Onboarding
│       │   ├── index.js           # React entry point
│       │   └── index.css          # Global styles
│       ├── package.json           # Node dependencies
│       └── tailwind.config.js     # TailwindCSS config
│
├── SETUP.md                       # Detailed setup guide
├── AZURE_POSTGRES_SETUP.md        # Azure PostgreSQL guide
├── QUICKSTART_POSTGRES.md         # Quick PostgreSQL reference
└── README.md                      # This file
```

---

## 💾 Database Schema

### Core Tables

#### Users
- User accounts with authentication
- Profile information (name, job, company, bio)
- LinkedIn verification status
- Price limits and wallet balance
- Stripe customer and bank account IDs

#### Emails
- Email messages with threading support
- Payment tracking (initial + response payments)
- Refund status and timestamps
- Message metadata (read, starred, archived)
- AWS SES Message-IDs for threading

#### Transactions
- Complete financial audit trail
- Types: credit purchase, email received, email responded, cashout, refund
- Links to emails, payments, and cashouts
- Stripe payment intent and transfer IDs

#### Payments
- Credit purchases via Stripe
- Payment status and failure reasons
- Card information (last 4 digits, brand)

#### Cashouts
- Withdrawal requests
- Bank account details
- Processing status
- Stripe payout IDs

#### Notifications
- Payment received notifications
- Response opportunity alerts
- Refund processed notifications

#### LinkedInVerifications
- OAuth state management
- Verification status tracking

### Database Relationships

```
User ─┬─ Emails (sent)
      ├─ Emails (received)
      ├─ Transactions
      ├─ Payments
      ├─ Cashouts
      └─ Notifications

Email ─┬─ Transactions
       ├─ Notifications
       └─ Replies (self-referencing)
```

---

## 🔌 API Reference

### Base URL

```
Development: http://localhost:8000
Production: https://api.yesreply.tech
```

### Authentication

All authenticated endpoints require a Bearer token:

```bash
Authorization: Bearer <your_jwt_token>
```

### API Endpoints

#### Authentication

```http
POST   /api/auth/signup          # Create new account
POST   /api/auth/login           # Login and get JWT token
GET    /api/auth/me              # Get current user info
PUT    /api/auth/profile         # Update profile
```

#### Verification

```http
GET    /api/verification/linkedin/authorize     # Start LinkedIn verification
GET    /api/verification/linkedin/callback      # LinkedIn OAuth callback
```

#### Emails

```http
GET    /api/emails                # List user's emails
POST   /api/emails/send           # Send a paid email
GET    /api/emails/{email_id}     # Get email details
POST   /api/emails/{email_id}/reply   # Reply to email
PUT    /api/emails/{email_id}/read    # Mark as read
DELETE /api/emails/{email_id}     # Delete email
```

#### Payments

```http
POST   /api/payments/create-payment-intent    # Create Stripe payment
POST   /api/payments/add-credits              # Add credits to wallet
POST   /api/payments/create-cashout           # Request cashout
GET    /api/payments/transactions             # List transactions
GET    /api/payments/wallet-balance           # Get wallet balance
POST   /api/payments/setup-bank-account       # Add bank account
```

#### Notifications

```http
GET    /api/notifications                   # List notifications
PUT    /api/notifications/{id}/read         # Mark notification as read
DELETE /api/notifications/{id}              # Delete notification
```

#### Webhooks

```http
POST   /api/ses/webhook          # AWS SES webhook (internal)
POST   /api/payments/webhook     # Stripe webhook (internal)
```

### Interactive API Documentation

Visit `http://localhost:8000/docs` for the full interactive Swagger UI documentation with request/response examples and the ability to test endpoints directly.

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/yesreply?sslmode=require

# JWT Authentication
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# AWS SES (Email Delivery)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_SES_FROM_DOMAIN=yesreply.tech

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Payment Configuration
MIN_CASHOUT_AMOUNT=10.00
EMAIL_RECEIVE_PAYMENT=0.20
BASE_PRICE_LIMIT=2.0
LINKEDIN_VERIFIED_PRICE_LIMIT=5.0
```

### Frontend Configuration

Create `.env` in `frontend/yesreply/`:

```env
REACT_APP_BACKEND_API_PATH=http://localhost:8000
```

---

## 🔐 Security Features

- **🔒 JWT Authentication**: Secure token-based auth with configurable expiration
- **🔑 Password Hashing**: Bcrypt with automatic salt generation
- **💳 PCI Compliance**: Stripe handles all payment card data
- **🛡️ SQL Injection Protection**: SQLAlchemy ORM with parameterized queries
- **🔐 CORS Configuration**: Configurable origin allowlist
- **✅ Input Validation**: Pydantic models validate all inputs
- **🚫 Rate Limiting**: Built-in FastAPI rate limiting (configurable)
- **🔒 SSL/TLS**: Required for Azure PostgreSQL connections
- **🔑 Environment Variables**: Sensitive data stored securely

---

## 💡 Key Concepts

### Payment Flow

1. **Sender pays**: User pays (e.g., $2) to send an email
2. **Instant credit**: Recipient receives $0.20 immediately
3. **Response reward**: Recipient gets remaining $1.80 when they reply
4. **48-hour window**: If no reply within 48 hours, sender gets automatic refund
5. **Transaction logging**: Every step is tracked in the transactions table

### Email Threading

YesReply implements proper RFC 822 email threading:

- **Message-ID**: Unique identifier for each email
- **In-Reply-To**: Links reply to original message
- **References**: Complete thread history
- **Thread Root ID**: Groups related messages

This ensures replies are properly threaded in the YesReply interface and in users' external email clients.

### Verification Levels

| Level | Requirements | Price Limit | Benefits |
|-------|-------------|-------------|----------|
| **Basic** | Email + password | $2.00 | Basic profile |
| **LinkedIn Verified** | LinkedIn OAuth | $5.00 | Higher earnings, verified badge |

---

## 🚀 Deployment

### Azure Deployment (Recommended)

1. **Database**: Azure Database for PostgreSQL (Flexible Server)
2. **Backend**: Azure App Service or Azure Container Instances
3. **Frontend**: Azure Static Web Apps or Azure Blob Storage + CDN
4. **Secrets**: Azure Key Vault for environment variables

See [AZURE_POSTGRES_SETUP.md](AZURE_POSTGRES_SETUP.md) for detailed Azure PostgreSQL setup.

### Docker Deployment

```bash
# Build images
docker build -t yesreply-backend ./backend
docker build -t yesreply-frontend ./frontend

# Run with docker-compose
docker-compose up -d
```

### Manual Deployment

1. Set up PostgreSQL database
2. Configure environment variables
3. Run database initialization: `poetry run python init_db.py`
4. Start backend: `poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000`
5. Build frontend: `npm run build`
6. Serve frontend static files via nginx/CDN

---

<div align="center">

**Built with ❤️ by developers who value their time**

[⬆ Back to Top](#yesreply-)

</div>

