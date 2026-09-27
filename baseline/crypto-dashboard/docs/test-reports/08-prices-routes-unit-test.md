# Unit Test Report: Prices Routes

## Unit
**Source Files Under Test:**
- `backend/src/routes/prices.js`

**Test File:**
- `backend/src/routes/prices.test.js`

## Date
December 7, 2025

## Engineers
- Ajinkya (Development Team)

---

## Test Methodology

### Methodology Used: Black-Box Testing with Boundary Value Analysis

**Rationale:** The prices routes provide real-time cryptocurrency price data. Testing approach includes:
1. **Functional Testing:** Verify correct price data retrieval
2. **Boundary Testing:** Handle edge cases in price calculations
3. **Error Handling:** Database errors and missing data scenarios

**Test Categories:**

1. **GET /current Tests:** Current prices with 24h change
2. **GET /stats/:token Tests:** Token-specific statistics
3. **Error Scenario Tests:** Database failures, malformed data

### Calculation Verification:
- 24h percentage change = ((current - old) / old) * 100
- Handle division by zero for old price = 0

---

## Automated Test Code

### Test Suite Structure

```javascript
describe('Prices Routes', () => {
  describe('GET /current', () => { /* 7 tests */ });
  describe('GET /stats/:token', () => { /* 9 tests */ });
  describe('Error scenarios', () => { /* 2 tests */ });
});
```

### Test Cases

#### GET /current Tests

| Test Case | Database Response | Expected Output |
|-----------|-------------------|-----------------|
| returns current prices with 24h change | Prices for BTC, ETH with 24h data | `{success: true, data: {BTC: {price, change24h}, ETH: {...}}}` |
| handles missing 24h data | Current prices, no historical | `{success: true, data: {...}}` with null change24h |
| handles partial 24h data | Some tokens missing history | Correct handling per token |
| handles database errors | DB throws error | Status 500 |
| returns empty object when no price data | Empty result set | `{success: true, data: {}}` |
| handles null values in price data | Null in database | Graceful handling |
| calculates percentage change correctly for edge cases | Various price combinations | Correct percentage calculation |

#### GET /stats/:token Tests

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| returns 24h stats for a token | `/stats/BTC` | `{success: true, data: {currentPrice, change24h, high24h, low24h}}` |
| converts token to uppercase | `/stats/btc` | Query uses "BTC" |
| handles missing current price | No current price | Appropriate response |
| handles missing 24h ago price | No historical price | change24h = null |
| handles database errors | DB throws | Status 500 |
| calculates negative percentage change correctly | Price dropped | Negative percentage |
| handles zero old price | oldPrice = 0 | No division by zero error |
| handles null values | Null in response | Graceful handling |
| handles very small percentage changes | Minimal change | Precise calculation |

---

## Actual Outputs

### Test Execution Results

```
PASS src/routes/prices.test.js
  Prices Routes
    GET /current
      ✓ returns current prices with 24h change (7 ms)
      ✓ handles missing 24h data (1 ms)
      ✓ handles partial 24h data (1 ms)
      ✓ handles database errors (2 ms)
      ✓ returns empty object when no price data (1 ms)
      ✓ handles null values in price data (1 ms)
      ✓ calculates percentage change correctly for edge cases (1 ms)
    GET /stats/:token
      ✓ returns 24h stats for a token (1 ms)
      ✓ converts token to uppercase (1 ms)
      ✓ handles missing current price (1 ms)
      ✓ handles missing 24h ago price (1 ms)
      ✓ handles database errors (1 ms)
      ✓ calculates negative percentage change correctly (1 ms)
      ✓ handles zero old price (0 ms)
      ✓ handles null values (1 ms)
      ✓ handles very small percentage changes (1 ms)
    Error scenarios
      ✓ handles database connection errors gracefully (3 ms)
      ✓ handles malformed database responses (1 ms)

Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
Time:        0.298 s
```

---

## Test Summary

- **Total Tests:** 18
- **Passed:** 18
- **Failed:** 0

All test cases verify correct price data retrieval, calculation accuracy, and error handling.
