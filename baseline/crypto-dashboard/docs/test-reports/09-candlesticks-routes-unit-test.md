# Unit Test Report: Candlesticks Routes

## Unit
**Source Files Under Test:**
- `backend/src/routes/candlesticks.js`

**Test File:**
- `backend/src/routes/candlesticks.test.js`

## Date
December 7, 2025

## Engineers
- Ajinkya (Development Team)

---

## Test Methodology

### Methodology Used: Black-Box Testing with Boundary Value Analysis

**Rationale:** The candlesticks routes provide OHLCV (Open, High, Low, Close, Volume) data for charting. Testing includes:
1. **Parameter Validation:** Token, timeframe, limit parameters
2. **Data Retrieval:** Correct database queries
3. **Edge Cases:** Empty results, null values, extreme limit values

**Test Categories:**

1. **GET /:token/:timeframe Tests:** Candlestick data retrieval
2. **GET /tokens Tests:** Available tokens listing
3. **Edge Case Tests:** Boundary conditions

---

## Automated Test Code

### Test Cases

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| returns candlestick data successfully | `/BTC/1h` | `{success: true, data: [...candlesticks]}` |
| handles query parameters correctly | `?limit=50&startTime=...` | Correct query construction |
| uses default limit when not provided | No limit param | Default limit applied |
| converts token to uppercase | `/btc/1h` | Query uses "BTC" |
| handles database errors | DB throws | Status 500 |
| returns empty array when no data found | No matching data | `{success: true, data: []}` |
| handles invalid timestamps gracefully | Invalid timestamp | Graceful handling |
| returns list of available tokens | `GET /tokens` | `{success: true, data: ["BTC", "ETH", ...]}` |
| handles database errors for tokens endpoint | DB throws | Status 500 |
| returns empty array when no tokens found | No tokens | `{success: true, data: []}` |
| handles null values in database response | Null in row | Graceful handling |
| handles very large limit values | limit=10000 | Capped or handled |
| handles negative limit values | limit=-1 | Appropriate response |

---

## Actual Outputs

### Test Execution Results

```
PASS src/routes/candlesticks.test.js
  Candlesticks Routes
    GET /:token/:timeframe
      ✓ returns candlestick data successfully (5 ms)
      ✓ handles query parameters correctly (3 ms)
      ✓ uses default limit when not provided (1 ms)
      ✓ converts token to uppercase (1 ms)
      ✓ handles database errors (1 ms)
      ✓ returns empty array when no data found (1 ms)
      ✓ handles invalid timestamps gracefully (1 ms)
    GET /tokens
      ✓ returns list of available tokens (1 ms)
      ✓ handles database errors for tokens endpoint (1 ms)
      ✓ returns empty array when no tokens found (1 ms)
    Edge cases
      ✓ handles null values in database response (1 ms)
      ✓ handles very large limit values (0 ms)
      ✓ handles negative limit values (0 ms)

Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
Time:        0.201 s
```

---

## Test Summary

- **Total Tests:** 13
- **Passed:** 13
- **Failed:** 0

All test cases verify correct candlestick data retrieval and parameter handling.
