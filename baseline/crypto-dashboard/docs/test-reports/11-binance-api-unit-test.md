# Unit Test Report: Binance API Service

## Unit
**Source Files Under Test:**
- `backend/src/services/binanceApi.js`

**Test File:**
- `backend/src/services/binanceApi.test.js`

## Date
December 7, 2025

## Engineers
- Ajinkya (Development Team)

---

## Test Methodology

### Methodology Used: Black-Box Testing with Mock External API

**Rationale:** The Binance API service wraps external API calls. Testing includes:
1. **API Call Verification:** Correct endpoint construction
2. **Response Parsing:** Transform Binance format to internal format
3. **Error Handling:** Network failures, rate limiting, invalid responses

**Test Categories:**

1. **getKlines Tests:** Candlestick data fetching
2. **getTickerPrice Tests:** Current price fetching
3. **Error Handling Tests:** Various failure scenarios

---

## Automated Test Code

### Test Cases

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| fetches klines data successfully | symbol: BTCUSDT, interval: 1h | Array of candlestick objects |
| transforms Binance response format | Raw Binance array | `{openTime, open, high, low, close, volume, closeTime}` |
| handles API errors | API returns error | Throws or returns error |
| handles rate limiting | 429 response | Appropriate retry or error |
| handles invalid symbol | Invalid symbol | Error response |
| fetches current ticker price | symbol: BTCUSDT | `{symbol, price}` |
| handles network timeout | Timeout | Throws timeout error |
| validates required parameters | Missing symbol | Throws validation error |

---

## Actual Outputs

### Test Execution Results

```
PASS src/services/binanceApi.test.js
  BinanceApi
    getKlines
      ✓ fetches klines data successfully (5 ms)
      ✓ transforms Binance response format (2 ms)
      ✓ handles optional parameters (1 ms)
      ✓ constructs correct API URL (1 ms)
      ✓ handles API errors (2 ms)
      ✓ handles rate limiting (1 ms)
    getTickerPrice
      ✓ fetches current ticker price (1 ms)
      ✓ handles invalid symbol (1 ms)
    Error scenarios
      ✓ handles network timeout (1 ms)
      ✓ handles malformed JSON response (1 ms)
      [additional tests...]

Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
Time:        0.245 s
```

---

## Test Summary

- **Total Tests:** 17
- **Passed:** 17
- **Failed:** 0

All test cases verify correct Binance API integration and error handling.
