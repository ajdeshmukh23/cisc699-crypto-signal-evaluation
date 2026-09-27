# Test Environment Setup and Software Documentation

## Date
December 7, 2025

## Engineers
- Ajinkya (Development Team)

---

## 1. Development Software

### Backend Technologies
| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18.x+ | Runtime environment |
| Express.js | 4.18.2 | Web application framework |
| PostgreSQL | 15.x | Database |
| pg | 8.11.3 | PostgreSQL client for Node.js |
| bcryptjs | 2.4.3 | Password hashing |
| jsonwebtoken | 9.0.2 | JWT authentication |
| ws | 8.14.2 | WebSocket implementation |
| cors | 2.8.5 | Cross-origin resource sharing |
| dotenv | 16.3.1 | Environment variable management |

### Frontend Technologies
| Software | Version | Purpose |
|----------|---------|---------|
| React | 18.2.0 | UI library |
| TypeScript | 4.9.0 | Type-safe JavaScript |
| Recharts | 2.x | Charting library |
| Create React App | 5.x | Build tooling |

### Infrastructure
| Software | Version | Purpose |
|----------|---------|---------|
| Docker | 20.x+ | Containerization |
| Docker Compose | 2.x | Multi-container orchestration |

---

## 2. Testing Software

### Backend Testing
| Software | Version | Purpose |
|----------|---------|---------|
| Jest | 29.7.0 | Test runner and assertion library |
| Supertest | 6.3.3 | HTTP assertions for Express testing |

### Frontend Testing
| Software | Version | Purpose |
|----------|---------|---------|
| Jest | 30.0.3 | Test runner (via react-scripts) |
| @testing-library/react | 14.x | React component testing |
| @testing-library/jest-dom | 6.x | Custom Jest matchers for DOM |
| @testing-library/user-event | 14.x | User interaction simulation |

---

## 3. Application Setup Instructions

### Prerequisites
1. Node.js 18.x or higher
2. npm 9.x or higher
3. Docker and Docker Compose (for database)
4. Git

### Backend Setup

```bash
# 1. Navigate to backend directory
cd crypto-dashboard/backend

# 2. Install dependencies
npm install

# 3. Create environment file
cat > .env << EOF
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crypto_dashboard
JWT_SECRET=your-secret-key-here
EOF

# 4. Start PostgreSQL database (using Docker)
docker-compose up -d db

# 5. Initialize database schema
# The schema is automatically created when the container starts

# 6. Start the backend server
npm start
```

### Frontend Setup

```bash
# 1. Navigate to frontend directory
cd crypto-dashboard/frontend

# 2. Install dependencies
npm install

# 3. Create environment file (optional)
cat > .env << EOF
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
EOF

# 4. Start the development server
npm start
```

### Full Stack Setup (Docker)

```bash
# From project root directory
docker-compose up --build
```

This starts:
- PostgreSQL database on port 5432
- Backend API server on port 3001
- Frontend development server on port 3000

---

## 4. Test Environment Setup

### Backend Test Setup

```bash
# Navigate to backend directory
cd crypto-dashboard/backend

# Install dependencies (if not already done)
npm install

# Run tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- --testPathPattern="auth.test"

# Run tests in watch mode
npm test -- --watch
```

### Frontend Test Setup

```bash
# Navigate to frontend directory
cd crypto-dashboard/frontend

# Install dependencies (if not already done)
npm install

# Run tests
npm test

# Run tests without watch mode
npm test -- --watchAll=false

# Run tests with coverage
npm test -- --coverage --watchAll=false

# Run specific test file
npm test -- --testPathPattern="Portfolio"
```

### Test Configuration Files

**Backend Jest Configuration** (in `package.json`):
```json
{
  "jest": {
    "testEnvironment": "node",
    "coverageDirectory": "./coverage",
    "collectCoverageFrom": [
      "src/**/*.js",
      "!src/index.js"
    ]
  }
}
```

**Frontend Jest Configuration** (via Create React App):
- Uses react-scripts test runner
- Coverage thresholds configured in package.json
- Test files: `*.test.tsx` or `*.test.ts`

---

## 5. Test Summary

### Backend Tests
| Test Suite | Tests | Status |
|------------|-------|--------|
| Auth Routes | 21 | PASS |
| Portfolio Routes | 28 | PASS |
| Auth Middleware | 9 | PASS |
| Prices Routes | 18 | PASS |
| Candlesticks Routes | 13 | PASS |
| Data Manager | 22 | PASS |
| Binance API | 17 | PASS |
| **Total** | **128** | **PASS** |

### Frontend Tests
| Test Suite | Tests | Status |
|------------|-------|--------|
| AuthContext | 13 | PASS |
| AuthModal | 14 | PASS |
| Portfolio | 17 | PASS |
| AddHoldingModal | 21 | PASS |
| CandlestickChart | 15 | PASS |
| InteractiveCandlestickChart | 21 | PASS |
| TradingIndicators | 22 | PASS |
| API Service | 12 | PASS |
| Database Service | 15 | PASS |
| Binance Service | 8 | PASS |
| App | 6 | PASS |
| **Total** | **164** | **PASS** |

### Overall
- **Total Tests: 292**
- **Passed: 292**
- **Failed: 0**

---

## 6. Continuous Integration

For CI/CD integration, use the following commands:

```bash
# Backend CI
cd backend && npm ci && npm test -- --ci --coverage

# Frontend CI
cd frontend && npm ci && npm test -- --ci --coverage --watchAll=false
```

---

## 7. Troubleshooting

### Common Issues

1. **Database connection errors**
   - Ensure PostgreSQL is running: `docker-compose up -d db`
   - Check DATABASE_URL in .env file

2. **Port conflicts**
   - Backend default: 3001
   - Frontend default: 3000
   - Database default: 5432

3. **Test timeout errors**
   - Increase Jest timeout: `jest.setTimeout(30000)`
   - Check for unresolved promises in tests

4. **Missing dependencies**
   - Run `npm install` in both backend and frontend directories
