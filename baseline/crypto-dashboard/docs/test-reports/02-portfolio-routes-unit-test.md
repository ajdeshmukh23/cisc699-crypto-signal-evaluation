# Unit Test Report: Portfolio Routes

## Unit
**Source Files Under Test:**
- `backend/src/routes/portfolio.js`

**Test File:**
- `backend/src/routes/portfolio.test.js`

## Date
December 7, 2025

## Engineers
- Ajinkya (Development Team)

---

## Test Methodology

### Methodology Used: Black-Box Testing with Equivalence Partitioning and Boundary Value Analysis

**Rationale:** The portfolio routes handle CRUD operations for cryptocurrency holdings. Black-box testing validates:
1. API contract compliance for all endpoints
2. Proper validation of numeric inputs (quantity, price)
3. Authentication requirement enforcement
4. Correct calculation of portfolio values

**Equivalence Classes Identified:**

1. **GET / (Fetch Portfolio)**
   - Valid: Authenticated user with/without holdings
   - Invalid: Unauthenticated request

2. **POST / (Add Holding)**
   - Valid: Supported tokens (BTC, ETH, SOL, ADA) with positive quantity and price
   - Invalid: Unsupported tokens, missing fields, negative/zero values

3. **PUT /:token (Update Holding)**
   - Valid: Existing holding with positive values
   - Invalid: Non-existent holding, missing fields, negative values

4. **DELETE /:token (Delete Holding)**
   - Valid: Existing holding for authenticated user
   - Invalid: Non-existent holding

### Additional Techniques:
- **Boundary Value Analysis:** Zero and negative values for quantity/price
- **State-Based Testing:** Empty portfolio vs portfolio with holdings
- **Integration Testing:** Interaction with authentication middleware

---

## Automated Test Code

### Test Suite Structure

```javascript
describe('Portfolio Routes', () => {
  describe('GET /', () => { /* 5 tests */ });
  describe('POST /', () => { /* 11 tests */ });
  describe('PUT /:token', () => { /* 7 tests */ });
  describe('DELETE /:token', () => { /* 5 tests */ });
});
```

### Test Cases

#### GET / (Fetch Portfolio) Tests

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| returns portfolio holdings with current values | Auth header, holdings exist | Status 200, `{success: true, data: {holdings: [...], summary: {...}}}` |
| returns empty portfolio for new user | Auth header, no holdings | Status 200, `{success: true, data: {holdings: [], summary: {totalValue: 0}}}` |
| requires authentication | No auth header | Status 401, `{success: false}` |
| handles database errors | Auth header, DB error | Status 500, `{success: false, error: "Failed to fetch portfolio"}` |
| handles null current price | Auth header, null price | Status 200, currentPrice defaults to 0 |

#### POST / (Add Holding) Tests

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| adds a new holding successfully | `{token: "BTC", quantity: 0.5, buyPrice: 40000}` | Status 201, `{success: true, data: {...}}` |
| converts token to uppercase | `{token: "btc", quantity: 0.5, buyPrice: 40000}` | Status 201, token stored as "BTC" |
| returns error for invalid token | `{token: "INVALID", quantity: 0.5, buyPrice: 40000}` | Status 400, `{success: false, error: "Invalid token..."}` |
| returns error when token is missing | `{quantity: 0.5, buyPrice: 40000}` | Status 400, `{success: false, error: "Token, quantity, and buy price are required"}` |
| returns error when quantity is missing | `{token: "BTC", buyPrice: 40000}` | Status 400, `{success: false}` |
| returns error when buyPrice is missing | `{token: "BTC", quantity: 0.5}` | Status 400, `{success: false}` |
| returns error for negative quantity | `{token: "BTC", quantity: -0.5, buyPrice: 40000}` | Status 400, `{success: false, error: "Quantity and buy price must be positive numbers"}` |
| returns error for negative buyPrice | `{token: "BTC", quantity: 0.5, buyPrice: -40000}` | Status 400, `{success: false}` |
| returns error for zero quantity | `{token: "BTC", quantity: 0, buyPrice: 40000}` | Status 400, `{success: false}` |
| handles database errors | Valid input, DB error | Status 500, `{success: false, error: "Failed to add holding"}` |
| requires authentication | No auth header | Status 401, `{success: false}` |

#### PUT /:token (Update Holding) Tests

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| updates a holding successfully | `PUT /BTC {quantity: 1.0, buyPrice: 45000}` | Status 200, `{success: true, data: {...}}` |
| returns error when holding not found | `PUT /XRP {quantity: 1.0, buyPrice: 45000}` | Status 404, `{success: false, error: "Holding not found"}` |
| returns error when quantity is missing | `PUT /BTC {buyPrice: 45000}` | Status 400, `{success: false, error: "Quantity and buy price are required"}` |
| returns error when buyPrice is missing | `PUT /BTC {quantity: 1.0}` | Status 400, `{success: false}` |
| returns error for negative values | `PUT /BTC {quantity: -1.0, buyPrice: 45000}` | Status 400, `{success: false}` |
| handles database errors | Valid input, DB error | Status 500, `{success: false, error: "Failed to update holding"}` |
| converts token to uppercase | `PUT /btc {quantity: 1.0, buyPrice: 45000}` | Query uses "BTC" |

#### DELETE /:token (Delete Holding) Tests

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| deletes a holding successfully | `DELETE /BTC` | Status 200, `{success: true, message: "Holding deleted successfully"}` |
| returns error when holding not found | `DELETE /XRP` | Status 404, `{success: false, error: "Holding not found"}` |
| handles database errors | DB error | Status 500, `{success: false, error: "Failed to delete holding"}` |
| converts token to uppercase | `DELETE /btc` | Query uses "BTC" |
| requires authentication | No auth header | Status 401, `{success: false}` |

---

## Actual Outputs

### Test Execution Results

```
PASS src/routes/portfolio.test.js
  Portfolio Routes
    GET /
      ✓ returns portfolio holdings with current values (20 ms)
      ✓ returns empty portfolio for new user (8 ms)
      ✓ requires authentication (2 ms)
      ✓ handles database errors (8 ms)
      ✓ handles null current price (2 ms)
    POST /
      ✓ adds a new holding successfully (8 ms)
      ✓ converts token to uppercase (2 ms)
      ✓ returns error for invalid token (1 ms)
      ✓ returns error when token is missing (1 ms)
      ✓ returns error when quantity is missing (2 ms)
      ✓ returns error when buyPrice is missing (1 ms)
      ✓ returns error for negative quantity (1 ms)
      ✓ returns error for negative buyPrice (1 ms)
      ✓ returns error for zero quantity (1 ms)
      ✓ handles database errors (1 ms)
      ✓ requires authentication (1 ms)
    PUT /:token
      ✓ updates a holding successfully (1 ms)
      ✓ returns error when holding not found (1 ms)
      ✓ returns error when quantity is missing (1 ms)
      ✓ returns error when buyPrice is missing (1 ms)
      ✓ returns error for negative values (1 ms)
      ✓ handles database errors (1 ms)
      ✓ converts token to uppercase (1 ms)
    DELETE /:token
      ✓ deletes a holding successfully (1 ms)
      ✓ returns error when holding not found (1 ms)
      ✓ handles database errors (1 ms)
      ✓ converts token to uppercase (1 ms)
      ✓ requires authentication (1 ms)

Test Suites: 1 passed, 1 total
Tests:       28 passed, 28 total
Time:        0.281 s
```

### Coverage Report

| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| portfolio.js | 97.87% | 95.45% | 100% | 97.87% |

---

## Test Summary

- **Total Tests:** 28
- **Passed:** 28
- **Failed:** 0
- **Coverage:** 97.87% statements

All test cases passed successfully, verifying that the portfolio routes correctly handle:
- CRUD operations for portfolio holdings
- Input validation for tokens, quantities, and prices
- Authentication enforcement on all endpoints
- Error handling for database and validation failures
- Case-insensitive token handling (uppercase conversion)
