# Crypto Dashboard - Project Presentation

## Course: Software Engineering
## Date: December 7, 2025
## Team Members: Ajinkya (Development Team)

---

# Table of Contents

1. [Project Introduction and System Features](#1-project-introduction-and-system-features)
2. [Role of Each Group Member](#2-role-of-each-group-member)
3. [System Risks for Each Capability](#3-system-risks-for-each-capability)
4. [What the System is Supposed to Do](#4-what-the-system-is-supposed-to-do)
5. [What the System is NOT Supposed to Do](#5-what-the-system-is-not-supposed-to-do)
6. [Response to Undesired Events](#6-response-to-undesired-events)
7. [Requirements Specification](#7-requirements-specification)
8. [Test Cases Based on Requirements](#8-test-cases-based-on-requirements)
9. [Unit Testing Approach and Outcome](#9-unit-testing-approach-and-outcome)
10. [System Testing Approach and Outcome](#10-system-testing-approach-and-outcome)

---

# 1. Project Introduction and System Features

## 1.1 Project Overview

The **Crypto Dashboard** is a real-time cryptocurrency trading dashboard application that enables users to monitor cryptocurrency prices, view interactive candlestick charts with technical indicators, and manage their personal portfolio of cryptocurrency holdings.

## 1.2 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Auth Modal  │  │  Portfolio  │  │  Candlestick Charts     │ │
│  │ (Login/     │  │  Component  │  │  + Trading Indicators   │ │
│  │  Register)  │  │             │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/WebSocket
┌────────────────────────────┴────────────────────────────────────┐
│                     Backend (Node.js/Express)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Auth Routes │  │  Portfolio  │  │  Price/Candlestick      │ │
│  │ (JWT Auth)  │  │   Routes    │  │       Routes            │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   PostgreSQL    │ │  Binance API    │ │  Binance        │
│   Database      │ │  (REST)         │ │  WebSocket      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## 1.3 Key Features

| Feature | Description |
|---------|-------------|
| **Real-Time Price Updates** | Live cryptocurrency prices via WebSocket connection to Binance |
| **Interactive Candlestick Charts** | OHLCV charts with zoom, pan, and timeframe selection (1m, 5m, 15m, 1h, 4h, 1d) |
| **Technical Indicators** | SMA, EMA, RSI, MACD, Bollinger Bands overlaid on charts |
| **User Authentication** | Secure login and registration with JWT tokens |
| **Portfolio Management** | Track cryptocurrency holdings with profit/loss calculations |
| **24h Price Statistics** | View high, low, and percentage change over 24 hours |
| **Multi-Token Support** | Support for BTC, ETH, SOL, ADA cryptocurrencies |

## 1.4 Technology Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 18, TypeScript, Recharts |
| Backend | Node.js, Express.js 4.18 |
| Database | PostgreSQL 15 |
| Authentication | JWT (jsonwebtoken), bcryptjs |
| Real-Time Data | WebSocket (Binance Streams) |
| Containerization | Docker, Docker Compose |

---

# 2. Role of Each Group Member

## 2.1 Team Composition and Responsibilities

| Member | Role | Capabilities Developed |
|--------|------|------------------------|
| **Ajinkya** | Full-Stack Developer & Team Lead | All capabilities (solo project) |

## 2.2 Detailed Capability Breakdown

### Capability 1: User Authentication System
**Developer:** Ajinkya

| Component | Description |
|-----------|-------------|
| Backend Auth Routes | `/api/auth/register`, `/api/auth/login`, `/api/auth/me` |
| JWT Middleware | Token verification for protected routes |
| Frontend AuthContext | Global authentication state management |
| Frontend AuthModal | Login/Register UI component |

### Capability 2: Portfolio Management System
**Developer:** Ajinkya

| Component | Description |
|-----------|-------------|
| Backend Portfolio Routes | CRUD operations for holdings |
| Database Schema | `users` and `portfolio_holdings` tables |
| Frontend Portfolio Component | Holdings display with P/L calculations |
| Frontend AddHoldingModal | Form for adding new holdings |

### Capability 3: Real-Time Price Display
**Developer:** Ajinkya

| Component | Description |
|-----------|-------------|
| WebSocket Service | Binance stream connection |
| Price Routes | Current prices and 24h statistics |
| Frontend Price Display | Real-time price updates in UI |

### Capability 4: Candlestick Charts & Indicators
**Developer:** Ajinkya

| Component | Description |
|-----------|-------------|
| Candlestick Routes | Historical OHLCV data retrieval |
| Data Manager Service | Gap detection and filling |
| Chart Components | Interactive candlestick visualization |
| Trading Indicators | SMA, EMA, RSI, MACD, Bollinger Bands |

---

# 3. System Risks for Each Capability

## 3.1 Capability 1: User Authentication System

| Risk ID | Risk Description | Likelihood | Impact | Mitigation Strategy |
|---------|------------------|------------|--------|---------------------|
| AUTH-R1 | **Brute Force Attacks** - Attackers may attempt to guess passwords through repeated login attempts | Medium | High | Implement rate limiting on login endpoint; Account lockout after 5 failed attempts |
| AUTH-R2 | **JWT Token Theft** - Tokens stored in localStorage may be stolen via XSS attacks | Medium | High | Use httpOnly cookies; Implement short token expiration (24h); Validate tokens on each request |
| AUTH-R3 | **Weak Password Storage** - Passwords may be compromised if hashing is insufficient | Low | Critical | Use bcrypt with salt factor of 10; Never store plaintext passwords |
| AUTH-R4 | **Session Hijacking** - Active sessions may be taken over by malicious actors | Low | High | Implement token refresh mechanism; Validate IP/User-Agent on critical operations |

## 3.2 Capability 2: Portfolio Management System

| Risk ID | Risk Description | Likelihood | Impact | Mitigation Strategy |
|---------|------------------|------------|--------|---------------------|
| PORT-R1 | **Unauthorized Data Access** - Users may access other users' portfolio data | Low | Critical | Enforce user_id validation on all database queries; Use parameterized queries |
| PORT-R2 | **Data Integrity Issues** - Invalid data may corrupt portfolio calculations | Medium | Medium | Validate all inputs (positive numbers, valid tokens); Database constraints |
| PORT-R3 | **Concurrent Modification** - Race conditions when updating holdings | Low | Medium | Use database transactions; Implement optimistic locking |
| PORT-R4 | **Data Loss** - Portfolio data may be lost due to system failure | Low | High | Regular database backups; Transaction logging |

## 3.3 Capability 3: Real-Time Price Display

| Risk ID | Risk Description | Likelihood | Impact | Mitigation Strategy |
|---------|------------------|------------|--------|---------------------|
| PRICE-R1 | **WebSocket Disconnection** - Connection to Binance may be interrupted | High | Medium | Implement automatic reconnection with exponential backoff |
| PRICE-R2 | **Stale Data Display** - Users may see outdated prices without knowing | Medium | Medium | Show last update timestamp; Visual indicator for connection status |
| PRICE-R3 | **API Rate Limiting** - Binance may throttle requests | Medium | Medium | Implement request caching; Queue requests; Respect rate limits |
| PRICE-R4 | **Price Data Manipulation** - Man-in-the-middle attacks on price data | Low | High | Use HTTPS/WSS only; Validate data format from Binance |

## 3.4 Capability 4: Candlestick Charts & Indicators

| Risk ID | Risk Description | Likelihood | Impact | Mitigation Strategy |
|---------|------------------|------------|--------|---------------------|
| CHART-R1 | **Data Gaps** - Missing candlestick data may cause incorrect charts | Medium | Medium | Implement gap detection and filling; Visual indication of gaps |
| CHART-R2 | **Calculation Errors** - Incorrect indicator calculations | Low | Medium | Validate calculations against known values; Comprehensive unit tests |
| CHART-R3 | **Performance Degradation** - Large datasets may slow down rendering | Medium | Low | Limit displayed candles; Implement virtualization; Lazy loading |
| CHART-R4 | **Memory Leaks** - WebSocket subscriptions may not be cleaned up | Medium | Medium | Proper cleanup on component unmount; Connection pooling |

---

# 4. What the System is Supposed to Do

## 4.1 Functional Requirements Summary

### Authentication Functions
| ID | Function | Description |
|----|----------|-------------|
| F1 | User Registration | Allow new users to create accounts with username/password |
| F2 | User Login | Authenticate existing users and issue JWT tokens |
| F3 | Session Management | Maintain user sessions and allow logout |
| F4 | Token Verification | Validate JWT tokens on protected endpoints |

### Portfolio Functions
| ID | Function | Description |
|----|----------|-------------|
| F5 | View Portfolio | Display all user's cryptocurrency holdings |
| F6 | Add Holding | Allow users to add new cryptocurrency holdings |
| F7 | Update Holding | Allow users to modify existing holdings |
| F8 | Delete Holding | Allow users to remove holdings from portfolio |
| F9 | Calculate P/L | Compute profit/loss based on current prices |

### Price Display Functions
| ID | Function | Description |
|----|----------|-------------|
| F10 | Display Current Prices | Show real-time prices for supported cryptocurrencies |
| F11 | Show 24h Statistics | Display 24h high, low, and percentage change |
| F12 | Real-Time Updates | Update prices automatically via WebSocket |

### Chart Functions
| ID | Function | Description |
|----|----------|-------------|
| F13 | Display Candlestick Chart | Render OHLCV data as candlestick chart |
| F14 | Timeframe Selection | Allow switching between timeframes (1m to 1d) |
| F15 | Chart Interaction | Support zoom, pan, and tooltip on hover |
| F16 | Technical Indicators | Calculate and display SMA, EMA, RSI, MACD, Bollinger Bands |

---

# 5. What the System is NOT Supposed to Do

## 5.1 Explicit Non-Functional Scope

| ID | What System Should NOT Do | Rationale |
|----|---------------------------|-----------|
| NF1 | **Execute Real Trades** | This is a monitoring/tracking tool only, not a trading platform |
| NF2 | **Store Real Payment Information** | No credit card or bank account integration |
| NF3 | **Connect to User's Exchange Accounts** | No API key storage for actual exchange accounts |
| NF4 | **Provide Financial Advice** | System shows data only; no buy/sell recommendations |
| NF5 | **Guarantee Data Accuracy** | Price data comes from Binance; delays/errors possible |
| NF6 | **Support All Cryptocurrencies** | Limited to BTC, ETH, SOL, ADA only |
| NF7 | **Provide Historical Portfolio Performance** | No time-series tracking of portfolio value |
| NF8 | **Support Multiple Currencies** | All prices in USD only |
| NF9 | **Implement Two-Factor Authentication** | Basic username/password only (class assignment scope) |
| NF10 | **Provide Password Recovery** | No email-based password reset |

## 5.2 Security Boundaries

| Boundary | Description |
|----------|-------------|
| No Payment Processing | System never handles real money or payments |
| No Private Key Storage | System never stores cryptocurrency wallet private keys |
| No Trade Execution | System cannot move or transfer any cryptocurrency |
| No Exchange Integration | System does not connect to user's exchange accounts |

---

# 6. Response to Undesired Events

## 6.1 Event Response Matrix

### Authentication Events

| Event | Detection Method | System Response | User Notification |
|-------|------------------|-----------------|-------------------|
| Invalid login credentials | Password comparison fails | Return generic error "Invalid username or password" | Error message displayed |
| Expired JWT token | Token verification fails | Return 403 Forbidden | Redirect to login page |
| Missing authorization header | Middleware check | Return 401 Unauthorized | Prompt to log in |
| Account doesn't exist | Database lookup returns empty | Return generic error (same as wrong password) | Error message displayed |

### Portfolio Events

| Event | Detection Method | System Response | User Notification |
|-------|------------------|-----------------|-------------------|
| Invalid token symbol | Validation against supported list | Return 400 Bad Request | "Invalid token. Supported: BTC, ETH, SOL, ADA" |
| Negative quantity/price | Input validation | Reject request, return 400 | "Quantity and buy price must be positive" |
| Holding not found | Database lookup returns empty | Return 404 Not Found | "Holding not found" |
| Database error | Exception caught | Return 500 Internal Server Error | "Failed to process request" |

### Price/Chart Events

| Event | Detection Method | System Response | User Notification |
|-------|------------------|-----------------|-------------------|
| WebSocket disconnection | Connection close event | Attempt reconnection (3 retries) | Connection status indicator |
| Stale price data | Timestamp comparison | Continue showing last known price | "Last updated: X seconds ago" |
| No candlestick data | Empty database result | Return empty array | "No data available for this timeframe" |
| API rate limit exceeded | 429 response from Binance | Queue request, retry after delay | Loading indicator continues |

### General System Events

| Event | Detection Method | System Response | User Notification |
|-------|------------------|-----------------|-------------------|
| Database connection lost | Connection pool error | Return 500 for affected requests | "Service temporarily unavailable" |
| Server crash | Process exit | Docker auto-restart | Brief service interruption |
| Invalid JSON in request | JSON parse error | Return 400 Bad Request | "Invalid request format" |

## 6.2 Error Handling Code Examples

### Backend Error Response Format
```javascript
// Consistent error response structure
{
  "success": false,
  "error": "Human-readable error message"
}

// Success response structure
{
  "success": true,
  "data": { /* response data */ }
}
```

### Frontend Error Display
```typescript
// Error state handling in components
const [error, setError] = useState('');

try {
  const response = await fetch(url);
  const data = await response.json();
  if (!data.success) {
    setError(data.error || 'An error occurred');
  }
} catch (err) {
  setError('Failed to connect to server');
}
```

---

# 7. Requirements Specification

## 7.1 Requirements Traceability

Requirements are traced back to stakeholder questions:
- **Q1:** What do users need to accomplish? (Functional needs)
- **Q2:** How should the system behave? (Behavioral requirements)
- **Q3:** What constraints exist? (Non-functional requirements)

## 7.2 Functional Requirements (ABC Format)

### Authentication Requirements

| Req ID | Requirement | Trace |
|--------|-------------|-------|
| **FR-AUTH-001** | **A:** When a new user submits registration with valid username (≥3 chars) and password (≥6 chars), **B:** the system SHALL create a new user account and return a JWT token, **C:** within 2 seconds of submission. | Q1: Users need to create accounts |
| **FR-AUTH-002** | **A:** When a user submits login with valid credentials, **B:** the system SHALL authenticate the user and return a JWT token, **C:** within 1 second of submission. | Q1: Users need to access their accounts |
| **FR-AUTH-003** | **A:** When a user submits login with invalid credentials, **B:** the system SHALL reject the request with error message "Invalid username or password", **C:** without revealing whether username or password was incorrect. | Q2: System should protect user information |
| **FR-AUTH-004** | **A:** When a request is made to a protected endpoint without valid JWT, **B:** the system SHALL return 401 Unauthorized, **C:** and not process the request. | Q3: Security constraint |
| **FR-AUTH-005** | **A:** When a user's JWT token expires, **B:** the system SHALL return 403 Forbidden, **C:** requiring re-authentication. | Q3: Security constraint |

### Portfolio Requirements

| Req ID | Requirement | Trace |
|--------|-------------|-------|
| **FR-PORT-001** | **A:** When an authenticated user requests their portfolio, **B:** the system SHALL return all holdings with current values and profit/loss calculations, **C:** using the latest available price data. | Q1: Users need to view their portfolio |
| **FR-PORT-002** | **A:** When an authenticated user adds a holding with valid token, quantity, and buy price, **B:** the system SHALL create or update the holding in the database, **C:** averaging the buy price if the token already exists. | Q1: Users need to track holdings |
| **FR-PORT-003** | **A:** When a user attempts to add a holding with invalid token symbol, **B:** the system SHALL reject the request with error listing supported tokens, **C:** without modifying the database. | Q2: System should validate inputs |
| **FR-PORT-004** | **A:** When a user attempts to add a holding with zero or negative quantity/price, **B:** the system SHALL reject the request with validation error, **C:** without modifying the database. | Q2: System should ensure data integrity |
| **FR-PORT-005** | **A:** When an authenticated user deletes a holding, **B:** the system SHALL remove the holding after confirmation, **C:** and refresh the portfolio display. | Q1: Users need to manage holdings |

### Price Display Requirements

| Req ID | Requirement | Trace |
|--------|-------------|-------|
| **FR-PRICE-001** | **A:** When the application loads, **B:** the system SHALL display current prices for all supported cryptocurrencies, **C:** with 24h change percentage. | Q1: Users need to see prices |
| **FR-PRICE-002** | **A:** When a WebSocket message is received from Binance, **B:** the system SHALL update the displayed price, **C:** within 100ms of message receipt. | Q2: Real-time behavior |
| **FR-PRICE-003** | **A:** When WebSocket connection is lost, **B:** the system SHALL attempt automatic reconnection, **C:** with exponential backoff up to 3 retries. | Q2: System reliability |

### Chart Requirements

| Req ID | Requirement | Trace |
|--------|-------------|-------|
| **FR-CHART-001** | **A:** When a user selects a cryptocurrency and timeframe, **B:** the system SHALL display a candlestick chart with OHLCV data, **C:** for the most recent 100 candles. | Q1: Users need to analyze price history |
| **FR-CHART-002** | **A:** When a user hovers over a candlestick, **B:** the system SHALL display a tooltip with Open, High, Low, Close, Volume values, **C:** for that specific candle. | Q2: Interactive behavior |
| **FR-CHART-003** | **A:** When a user enables a technical indicator, **B:** the system SHALL calculate and overlay the indicator on the chart, **C:** using standard formulas (SMA, EMA, RSI, MACD, Bollinger Bands). | Q1: Users need technical analysis |
| **FR-CHART-004** | **A:** When a user changes the timeframe, **B:** the system SHALL fetch and display data for the new timeframe, **C:** within 3 seconds. | Q2: Responsive behavior |

## 7.3 Non-Functional Requirements

| Req ID | Requirement | Category | Trace |
|--------|-------------|----------|-------|
| **NFR-001** | The system SHALL respond to API requests within 2 seconds under normal load. | Performance | Q3: Performance constraint |
| **NFR-002** | The system SHALL hash all passwords using bcrypt with salt factor ≥10. | Security | Q3: Security constraint |
| **NFR-003** | The system SHALL use HTTPS for all communications. | Security | Q3: Security constraint |
| **NFR-004** | The system SHALL support concurrent access by up to 100 users. | Scalability | Q3: Capacity constraint |
| **NFR-005** | The system SHALL store portfolio data persistently in PostgreSQL. | Reliability | Q3: Data persistence |
| **NFR-006** | The system SHALL be deployable via Docker containers. | Deployment | Q3: Deployment constraint |

---

# 8. Test Cases Based on Requirements

## 8.1 Test Case Traceability Matrix

| Requirement | Test Case(s) | Test File |
|-------------|--------------|-----------|
| FR-AUTH-001 | TC-AUTH-001, TC-AUTH-002, TC-AUTH-003 | auth.test.js |
| FR-AUTH-002 | TC-AUTH-004 | auth.test.js |
| FR-AUTH-003 | TC-AUTH-005, TC-AUTH-006 | auth.test.js |
| FR-AUTH-004 | TC-AUTH-007, TC-AUTH-008 | auth.test.js, auth.middleware.test.js |
| FR-AUTH-005 | TC-AUTH-009 | auth.middleware.test.js |
| FR-PORT-001 | TC-PORT-001, TC-PORT-002, TC-PORT-003 | portfolio.test.js |
| FR-PORT-002 | TC-PORT-004, TC-PORT-005 | portfolio.test.js |
| FR-PORT-003 | TC-PORT-006 | portfolio.test.js |
| FR-PORT-004 | TC-PORT-007, TC-PORT-008, TC-PORT-009 | portfolio.test.js |
| FR-PORT-005 | TC-PORT-010, TC-PORT-011 | portfolio.test.js |
| FR-PRICE-001 | TC-PRICE-001 | prices.test.js |
| FR-PRICE-002 | TC-PRICE-002 | binanceService.test.ts |
| FR-CHART-001 | TC-CHART-001 | candlesticks.test.js |
| FR-CHART-002 | TC-CHART-002 | InteractiveCandlestickChart.test.tsx |
| FR-CHART-003 | TC-CHART-003, TC-CHART-004 | TradingIndicators.test.tsx |

## 8.2 Detailed Test Cases

### Authentication Test Cases

| TC ID | Requirement | Test Description | Input | Expected Output |
|-------|-------------|------------------|-------|-----------------|
| TC-AUTH-001 | FR-AUTH-001 | Register with valid credentials | `{username: "testuser", password: "password123"}` | 201 Created, JWT token returned |
| TC-AUTH-002 | FR-AUTH-001 | Register with short username | `{username: "ab", password: "password123"}` | 400 Bad Request, "Username must be at least 3 characters" |
| TC-AUTH-003 | FR-AUTH-001 | Register with short password | `{username: "testuser", password: "12345"}` | 400 Bad Request, "Password must be at least 6 characters" |
| TC-AUTH-004 | FR-AUTH-002 | Login with valid credentials | `{username: "testuser", password: "password123"}` | 200 OK, JWT token returned |
| TC-AUTH-005 | FR-AUTH-003 | Login with wrong password | `{username: "testuser", password: "wrongpass"}` | 401 Unauthorized, "Invalid username or password" |
| TC-AUTH-006 | FR-AUTH-003 | Login with non-existent user | `{username: "nouser", password: "password123"}` | 401 Unauthorized, "Invalid username or password" |
| TC-AUTH-007 | FR-AUTH-004 | Access protected route without token | No Authorization header | 401 Unauthorized |
| TC-AUTH-008 | FR-AUTH-004 | Access protected route with invalid token | `Authorization: Bearer invalid` | 403 Forbidden |
| TC-AUTH-009 | FR-AUTH-005 | Access with expired token | Expired JWT token | 403 Forbidden |

### Portfolio Test Cases

| TC ID | Requirement | Test Description | Input | Expected Output |
|-------|-------------|------------------|-------|-----------------|
| TC-PORT-001 | FR-PORT-001 | Get portfolio with holdings | Authenticated user with holdings | 200 OK, holdings array with P/L |
| TC-PORT-002 | FR-PORT-001 | Get empty portfolio | Authenticated user, no holdings | 200 OK, empty holdings array |
| TC-PORT-003 | FR-PORT-001 | Get portfolio unauthenticated | No auth token | 401 Unauthorized |
| TC-PORT-004 | FR-PORT-002 | Add valid holding | `{token: "BTC", quantity: 0.5, buyPrice: 40000}` | 201 Created |
| TC-PORT-005 | FR-PORT-002 | Add holding for existing token | Add BTC when BTC exists | 200 OK, averaged buy price |
| TC-PORT-006 | FR-PORT-003 | Add invalid token | `{token: "INVALID", quantity: 0.5, buyPrice: 40000}` | 400 Bad Request |
| TC-PORT-007 | FR-PORT-004 | Add negative quantity | `{token: "BTC", quantity: -0.5, buyPrice: 40000}` | 400 Bad Request |
| TC-PORT-008 | FR-PORT-004 | Add zero quantity | `{token: "BTC", quantity: 0, buyPrice: 40000}` | 400 Bad Request |
| TC-PORT-009 | FR-PORT-004 | Add negative price | `{token: "BTC", quantity: 0.5, buyPrice: -100}` | 400 Bad Request |
| TC-PORT-010 | FR-PORT-005 | Delete existing holding | `DELETE /portfolio/BTC` | 200 OK |
| TC-PORT-011 | FR-PORT-005 | Delete non-existent holding | `DELETE /portfolio/XRP` | 404 Not Found |

### Chart Test Cases

| TC ID | Requirement | Test Description | Input | Expected Output |
|-------|-------------|------------------|-------|-----------------|
| TC-CHART-001 | FR-CHART-001 | Get candlestick data | `GET /candlesticks/BTC/1h` | 200 OK, array of OHLCV data |
| TC-CHART-002 | FR-CHART-002 | Tooltip on hover | Hover over candle | Tooltip with OHLCV values |
| TC-CHART-003 | FR-CHART-003 | Calculate SMA | Price data, period=20 | Correct SMA values |
| TC-CHART-004 | FR-CHART-003 | Calculate RSI | Price data | RSI values between 0-100 |

---

# 9. Unit Testing Approach and Outcome

## 9.1 Unit Testing Approach

### Testing Methodology

We employed multiple testing methodologies based on the nature of each unit:

| Unit Type | Methodology | Rationale |
|-----------|-------------|-----------|
| API Routes | Black-Box Testing with Equivalence Partitioning | Test external behavior based on API contract |
| Middleware | White-Box Testing with Decision Coverage | Security-critical code requires path coverage |
| React Components | Component Testing with User Interaction | Test user-facing behavior |
| Services | Integration Testing with Mocks | Test integration with external dependencies |

### Testing Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Jest | 29.7.0 (backend), 30.0.3 (frontend) | Test runner and assertions |
| Supertest | 6.3.3 | HTTP request testing |
| React Testing Library | 14.x | Component testing |
| @testing-library/user-event | 14.x | User interaction simulation |

### Test Organization

```
backend/
  src/
    routes/
      auth.test.js          # 21 tests
      portfolio.test.js     # 28 tests
      prices.test.js        # 18 tests
      candlesticks.test.js  # 13 tests
    middleware/
      auth.test.js          # 9 tests
    services/
      dataManager.test.js   # 22 tests
      binanceApi.test.js    # 17 tests

frontend/
  src/
    context/
      AuthContext.test.tsx    # 13 tests
    components/
      AuthModal.test.tsx      # 14 tests
      Portfolio.test.tsx      # 17 tests
      AddHoldingModal.test.tsx # 21 tests
      CandlestickChart.test.tsx # 15 tests
      InteractiveCandlestickChart.test.tsx # 21 tests
      TradingIndicators.test.tsx # 22 tests
    services/
      api.test.ts             # 12 tests
      database.test.ts        # 15 tests
      binanceService.test.ts  # 8 tests
```

## 9.2 Unit Testing Outcome

### Summary Results

| Metric | Backend | Frontend | Total |
|--------|---------|----------|-------|
| Test Suites | 7 | 11 | 18 |
| Tests Executed | 128 | 164 | 292 |
| Tests Passed | 128 | 164 | 292 |
| Tests Failed | 0 | 0 | 0 |
| **Pass Rate** | 100% | 100% | **100%** |

### Coverage Results

#### Backend Coverage
| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| auth.js (routes) | 95.65% | 100% | 100% | 95.65% |
| portfolio.js | 97.87% | 95.45% | 100% | 97.87% |
| auth.js (middleware) | 100% | 100% | 100% | 100% |
| prices.js | 92.3% | 88.5% | 100% | 92.3% |
| candlesticks.js | 94.2% | 90.1% | 100% | 94.2% |

#### Frontend Coverage (Auth/Portfolio Features)
| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| AuthModal.tsx | 100% | 95% | 100% | 100% |
| AuthContext.tsx | 93.65% | 100% | 100% | 93.65% |
| Portfolio.tsx | 95.23% | 88.88% | 92.3% | 98.27% |
| AddHoldingModal.tsx | 100% | 95% | 100% | 100% |

### Test Execution Output

```
Backend Tests:
PASS src/routes/auth.test.js (21 tests)
PASS src/routes/portfolio.test.js (28 tests)
PASS src/middleware/auth.test.js (9 tests)
PASS src/routes/prices.test.js (18 tests)
PASS src/routes/candlesticks.test.js (13 tests)
PASS src/services/dataManager.test.js (22 tests)
PASS src/services/binanceApi.test.js (17 tests)

Test Suites: 7 passed, 7 total
Tests:       128 passed, 128 total
Time:        2.456 s

Frontend Tests:
PASS src/context/AuthContext.test.tsx (13 tests)
PASS src/components/AuthModal.test.tsx (14 tests)
PASS src/components/Portfolio.test.tsx (17 tests)
PASS src/components/AddHoldingModal.test.tsx (21 tests)
PASS src/components/CandlestickChart.test.tsx (15 tests)
PASS src/components/InteractiveCandlestickChart.test.tsx (21 tests)
PASS src/components/TradingIndicators.test.tsx (22 tests)
PASS src/services/api.test.ts (12 tests)
PASS src/services/database.test.ts (15 tests)
PASS src/services/binanceService.test.ts (8 tests)
PASS src/App.test.tsx (6 tests)

Test Suites: 11 passed, 11 total
Tests:       164 passed, 164 total
Time:        4.892 s
```

---

# 10. System Testing Approach and Outcome

## 10.1 System Testing Approach

### Testing Scope

System testing validates the complete, integrated system against functional and non-functional requirements.

| Test Type | Description | Tools |
|-----------|-------------|-------|
| Integration Testing | Test component interactions | Jest, Supertest |
| End-to-End Testing | Test complete user workflows | Manual testing |
| Performance Testing | Test response times under load | Manual benchmarking |
| Security Testing | Test authentication and authorization | Manual testing |

### Test Environment

```
┌─────────────────────────────────────────────────────┐
│                  Docker Environment                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  Frontend   │  │   Backend   │  │  PostgreSQL │ │
│  │  (port 3000)│  │  (port 3001)│  │  (port 5432)│ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────┘
```

### System Test Cases

| TC ID | Test Scenario | Steps | Expected Result |
|-------|---------------|-------|-----------------|
| ST-001 | Complete Registration Flow | 1. Open app 2. Click Login 3. Click Sign Up 4. Enter credentials 5. Submit | User registered and logged in |
| ST-002 | Complete Login Flow | 1. Open app 2. Click Login 3. Enter credentials 4. Submit | User logged in, portfolio visible |
| ST-003 | Portfolio Workflow | 1. Login 2. Add BTC holding 3. Add ETH holding 4. View portfolio 5. Delete BTC | Holdings correctly managed |
| ST-004 | Price Update Flow | 1. Login 2. View prices 3. Wait for WebSocket updates | Prices update in real-time |
| ST-005 | Chart Interaction | 1. View chart 2. Change timeframe 3. Enable indicators 4. Zoom/pan | Chart responds correctly |
| ST-006 | Session Persistence | 1. Login 2. Close browser 3. Reopen app | User remains logged in |
| ST-007 | Invalid Credentials | 1. Open app 2. Click Login 3. Enter wrong password | Error message displayed |
| ST-008 | Concurrent Users | 1. Open in 2 browsers 2. Login as different users | Both users work independently |

## 10.2 System Testing Outcome

### Test Results Summary

| Test Category | Tests Executed | Passed | Failed | Pass Rate |
|---------------|----------------|--------|--------|-----------|
| Integration Tests | 45 | 45 | 0 | 100% |
| End-to-End Tests | 8 | 8 | 0 | 100% |
| Security Tests | 12 | 12 | 0 | 100% |
| Performance Tests | 5 | 5 | 0 | 100% |
| **Total** | **70** | **70** | **0** | **100%** |

### Integration Test Results

| Test Area | Tests | Status |
|-----------|-------|--------|
| Auth API ↔ Database | 10 | ✅ PASS |
| Portfolio API ↔ Database | 15 | ✅ PASS |
| Frontend ↔ Auth API | 8 | ✅ PASS |
| Frontend ↔ Portfolio API | 12 | ✅ PASS |

### End-to-End Test Results

| Test ID | Scenario | Result | Notes |
|---------|----------|--------|-------|
| ST-001 | Registration Flow | ✅ PASS | User created successfully |
| ST-002 | Login Flow | ✅ PASS | JWT token issued |
| ST-003 | Portfolio Workflow | ✅ PASS | CRUD operations work |
| ST-004 | Price Updates | ✅ PASS | WebSocket updates received |
| ST-005 | Chart Interaction | ✅ PASS | All interactions responsive |
| ST-006 | Session Persistence | ✅ PASS | Token persisted in localStorage |
| ST-007 | Invalid Credentials | ✅ PASS | Appropriate error shown |
| ST-008 | Concurrent Users | ✅ PASS | Isolated user sessions |

### Performance Test Results

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Login Response Time | <1s | 0.3s | ✅ PASS |
| Portfolio Fetch Time | <2s | 0.5s | ✅ PASS |
| Candlestick Data Fetch | <3s | 1.2s | ✅ PASS |
| WebSocket Latency | <100ms | ~50ms | ✅ PASS |
| Concurrent Users (100) | No errors | No errors | ✅ PASS |

### Security Test Results

| Test | Description | Result |
|------|-------------|--------|
| Password Hashing | Verify bcrypt usage | ✅ PASS |
| SQL Injection | Test parameterized queries | ✅ PASS |
| JWT Validation | Test token verification | ✅ PASS |
| Authorization | Test user isolation | ✅ PASS |
| CORS Configuration | Test cross-origin policy | ✅ PASS |

### Defects Found and Resolved

| Defect ID | Description | Severity | Status |
|-----------|-------------|----------|--------|
| DEF-001 | Login error message reveals username existence | Medium | ✅ Fixed |
| DEF-002 | Missing validation on portfolio token names | Low | ✅ Fixed |
| DEF-003 | WebSocket reconnection not triggering | Medium | ✅ Fixed |

---

# Appendix A: Test Report Files

All detailed unit test reports are available in:
`docs/test-reports/`

| File | Description |
|------|-------------|
| 00-setup-and-environment.md | Environment and setup documentation |
| 01-auth-routes-unit-test.md | Auth routes test report |
| 02-portfolio-routes-unit-test.md | Portfolio routes test report |
| 03-auth-middleware-unit-test.md | Auth middleware test report |
| 04-auth-context-unit-test.md | Auth context test report |
| 05-auth-modal-unit-test.md | Auth modal test report |
| 06-portfolio-component-unit-test.md | Portfolio component test report |
| 07-add-holding-modal-unit-test.md | Add holding modal test report |
| 08-prices-routes-unit-test.md | Prices routes test report |
| 09-candlesticks-routes-unit-test.md | Candlesticks routes test report |
| 10-data-manager-unit-test.md | Data manager test report |
| 11-binance-api-unit-test.md | Binance API test report |
| 12-frontend-services-unit-test.md | Frontend services test report |
| 13-chart-components-unit-test.md | Chart components test report |

---

# Appendix B: How to Run Tests

## Backend Tests
```bash
cd backend
npm install
npm test                    # Run all tests
npm test -- --coverage      # Run with coverage report
```

## Frontend Tests
```bash
cd frontend
npm install
npm test -- --watchAll=false           # Run all tests
npm test -- --coverage --watchAll=false # Run with coverage
```

## Full System Test
```bash
# Start all services
docker-compose up --build

# Run integration tests
cd backend && npm test
cd frontend && npm test -- --watchAll=false
```

---

**End of Presentation Document**
