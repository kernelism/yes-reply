# YesReply Setup Guide

## Prerequisites

- **Python**: 3.10+
- **Node.js**: 16+ and npm
- **Poetry**: Python package manager ([install](https://python-poetry.org/docs/#installation))

## Backend Setup

### 1. Navigate to Backend
```bash
cd backend
```

### 2. Install Dependencies
```bash
poetry install
```

### 3. Configure Environment Variables
Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL=sqlite:///./yesreply.db

# JWT Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# AWS SES (for email sending)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_SES_FROM_DOMAIN=yesreply.tech

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Payment Configuration
MIN_CASHOUT_AMOUNT=10.00
EMAIL_RECEIVE_PAYMENT=0.20
BASE_PRICE_LIMIT=2.0
LINKEDIN_VERIFIED_PRICE_LIMIT=5.0
```

### 4. Initialize Database
```bash
poetry run alembic upgrade head
```

### 5. Start Backend Server
```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or use the convenience script:
```bash
chmod +x run.sh
./run.sh
```

Backend will run at: `http://localhost:8000`  
API docs at: `http://localhost:8000/docs`

---

## Frontend Setup

### 1. Navigate to Frontend
```bash
cd frontend/yesreply
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment (Optional)
Create `.env` file in `frontend/yesreply/`:

```env
REACT_APP_BACKEND_API_PATH=http://localhost:8000
```

### 4. Start Frontend Server
```bash
npm start
```

Frontend will run at: `http://localhost:3000`

---

## Quick Start (Both Services)

```bash
# Terminal 1 - Backend
cd backend
poetry install
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend/yesreply
npm install
npm start
```

---

## Development Notes

### Database
- SQLite is used by default (`yesreply.db`)
- Migrations managed via Alembic
- To create a new migration: `poetry run alembic revision --autogenerate -m "description"`

### Dummy Data
Populate test data:
```bash
cd backend
poetry run python populate_dummy_data.py
```

### Email Threading
Replies are properly threaded using RFC 822 standards with `Message-ID`, `In-Reply-To`, and `References` headers.

### CORS
Backend configured to accept requests from `http://localhost:3000` during development.

---

## Production Deployment

1. **Backend**:
   - Set `DEBUG=False` in environment
   - Use PostgreSQL instead of SQLite
   - Configure production-grade secret key
   - Set up proper AWS SES domain verification
   - Configure Stripe production keys

2. **Frontend**:
   - Run `npm run build`
   - Set `REACT_APP_BACKEND_API_PATH` to production API URL
   - Serve static files via nginx/CDN

3. **Security**:
   - Enable HTTPS
   - Configure proper CORS origins
   - Set strong JWT secret keys
   - Enable rate limiting

