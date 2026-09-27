# Implementation Plan: Portfolio & User Authentication (Class Assignment)

## Overview
Add simple user login and portfolio tracking to the crypto dashboard.

---

## Phase 1: Database Schema

**New Tables:**

```sql
-- Users table (simple username/password)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Portfolio holdings
CREATE TABLE portfolio_holdings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(10) NOT NULL,
    quantity DECIMAL(20, 8) NOT NULL,
    buy_price DECIMAL(20, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, token)
);
```

---

## Phase 2: Backend - Authentication

**New Dependencies:** `bcryptjs`, `jsonwebtoken`

**API Endpoints:**
- `POST /api/auth/register` - Create user (username, password)
- `POST /api/auth/login` - Login, returns JWT token
- `GET /api/auth/me` - Get current user info (protected)

---

## Phase 3: Backend - Portfolio

**API Endpoints:**
- `GET /api/portfolio` - Get user's holdings with current values
- `POST /api/portfolio` - Add a holding (token, quantity, buy_price)
- `PUT /api/portfolio/:token` - Update a holding
- `DELETE /api/portfolio/:token` - Remove a holding

---

## Phase 4: Frontend - Auth Components

- Login form (username + password)
- Register form
- User menu in header (shows username, logout button)
- Auth context for state management

---

## Phase 5: Frontend - Portfolio Section

- Portfolio summary (total value, profit/loss)
- Holdings table with current prices
- Add holding form
- Delete holding button

---

## Files to Create/Modify

### Backend
1. `database/init.sql` - Add users & portfolio_holdings tables
2. `backend/package.json` - Add bcryptjs, jsonwebtoken
3. `backend/src/middleware/auth.js` - JWT verification
4. `backend/src/routes/auth.js` - Login/register endpoints
5. `backend/src/routes/portfolio.js` - Portfolio CRUD
6. `backend/src/index.js` - Register new routes

### Frontend
1. `frontend/src/context/AuthContext.tsx` - Auth state
2. `frontend/src/components/LoginForm.tsx`
3. `frontend/src/components/RegisterForm.tsx`
4. `frontend/src/components/Portfolio.tsx` - Holdings display
5. `frontend/src/components/AddHolding.tsx` - Add holding form
6. `frontend/src/services/authService.ts` - Auth API calls
7. `frontend/src/services/portfolioService.ts` - Portfolio API calls
8. `frontend/src/App.tsx` - Integrate auth & portfolio
9. `frontend/src/App.css` - Styles for new components
