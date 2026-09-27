# Unit Test Report: Authentication Routes

## Unit
**Source Files Under Test:**
- `backend/src/routes/auth.js`

**Test File:**
- `backend/src/routes/auth.test.js`

## Date
December 7, 2025

## Engineers
- Ajinkya (Development Team)

---

## Test Methodology

### Methodology Used: Black-Box Testing with Equivalence Partitioning

**Rationale:** The authentication routes are API endpoints that accept HTTP requests and return JSON responses. Black-box testing is appropriate because:
1. We test the external behavior without knowledge of internal implementation
2. We validate input/output relationships based on API contract
3. We ensure the API meets functional requirements

**Equivalence Classes Identified:**

1. **Registration Endpoint (`POST /register`)**
   - Valid inputs: username (≥3 chars), password (≥6 chars)
   - Invalid inputs: missing fields, short username, short password, duplicate username

2. **Login Endpoint (`POST /login`)**
   - Valid inputs: existing username with correct password
   - Invalid inputs: non-existent user, wrong password, missing fields

3. **Get User Endpoint (`GET /me`)**
   - Valid inputs: valid JWT token
   - Invalid inputs: missing token, invalid token, expired token

### Additional Techniques:
- **Boundary Value Analysis:** Testing minimum length requirements (3 chars for username, 6 for password)
- **Error Handling Testing:** Database errors, bcrypt errors
- **Security Testing:** Token validation, password hashing verification

---

## Automated Test Code

### Test Suite Structure

```javascript
describe('Auth Routes', () => {
  describe('POST /register', () => { /* 8 tests */ });
  describe('POST /login', () => { /* 7 tests */ });
  describe('GET /me', () => { /* 6 tests */ });
});
```

### Test Cases

#### POST /register Tests

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| registers a new user successfully | `{username: "testuser", password: "password123"}` | Status 201, `{success: true, data: {user, token}}` |
| returns error when username already exists | Existing username | Status 409, `{success: false, error: "Username already exists"}` |
| returns error when username is missing | `{password: "password123"}` | Status 400, `{success: false, error: "Username and password are required"}` |
| returns error when password is missing | `{username: "testuser"}` | Status 400, `{success: false, error: "Username and password are required"}` |
| returns error when username is too short | `{username: "ab", password: "password123"}` | Status 400, `{success: false, error: "Username must be at least 3 characters"}` |
| returns error when password is too short | `{username: "testuser", password: "12345"}` | Status 400, `{success: false, error: "Password must be at least 6 characters"}` |
| handles database errors during registration | Valid input, DB error | Status 500, `{success: false, error: "Failed to register user"}` |
| handles bcrypt hash errors | Valid input, bcrypt error | Status 500, `{success: false}` |

#### POST /login Tests

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| logs in user successfully | Valid credentials | Status 200, `{success: true, data: {user, token}}` |
| returns error for non-existent user | Non-existent username | Status 401, `{success: false, error: "Invalid username or password"}` |
| returns error for wrong password | Wrong password | Status 401, `{success: false, error: "Invalid username or password"}` |
| returns error when username is missing | `{password: "password123"}` | Status 400, `{success: false, error: "Username and password are required"}` |
| returns error when password is missing | `{username: "testuser"}` | Status 400, `{success: false, error: "Username and password are required"}` |
| handles database errors during login | Valid input, DB error | Status 500, `{success: false, error: "Failed to login"}` |
| handles bcrypt compare errors | Valid input, bcrypt error | Status 500, `{success: false}` |

#### GET /me Tests

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| returns current user info with valid token | `Authorization: Bearer valid-token` | Status 200, `{success: true, data: {id, username, created_at}}` |
| returns error without authorization header | No header | Status 401, `{success: false, error: "Access token required"}` |
| returns error with invalid token | Invalid token | Status 403, `{success: false, error: "Invalid or expired token"}` |
| returns error when user not found | Token for deleted user | Status 404, `{success: false, error: "User not found"}` |
| handles database errors when fetching user | Valid token, DB error | Status 500, `{success: false, error: "Failed to fetch user"}` |
| handles malformed authorization header | `Authorization: InvalidFormat` | Status 401, `{success: false}` |

---

## Actual Outputs

### Test Execution Results

```
PASS src/routes/auth.test.js
  Auth Routes
    POST /register
      ✓ registers a new user successfully (9 ms)
      ✓ returns error when username already exists (1 ms)
      ✓ returns error when username is missing (1 ms)
      ✓ returns error when password is missing (0 ms)
      ✓ returns error when username is too short (1 ms)
      ✓ returns error when password is too short (1 ms)
      ✓ handles database errors during registration (3 ms)
      ✓ handles bcrypt hash errors (1 ms)
    POST /login
      ✓ logs in user successfully (1 ms)
      ✓ returns error for non-existent user (2 ms)
      ✓ returns error for wrong password (1 ms)
      ✓ returns error when username is missing (0 ms)
      ✓ returns error when password is missing (0 ms)
      ✓ handles database errors during login (2 ms)
      ✓ handles bcrypt compare errors (1 ms)
    GET /me
      ✓ returns current user info with valid token (1 ms)
      ✓ returns error without authorization header (0 ms)
      ✓ returns error with invalid token (0 ms)
      ✓ returns error when user not found (1 ms)
      ✓ handles database errors when fetching user (1 ms)
      ✓ handles malformed authorization header (1 ms)

Test Suites: 1 passed, 1 total
Tests:       21 passed, 21 total
Time:        0.423 s
```

### Coverage Report

| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| auth.js | 95.65% | 100% | 100% | 95.65% |

---

## Test Summary

- **Total Tests:** 21
- **Passed:** 21
- **Failed:** 0
- **Coverage:** 95.65% statements

All test cases passed successfully, verifying that the authentication routes correctly handle:
- User registration with validation
- User login with credential verification
- Token-based authentication
- Error handling for various failure scenarios
