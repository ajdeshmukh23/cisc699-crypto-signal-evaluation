# Test Cases - Crypto Trading Dashboard

## Test Case Format
- **Test Case ID**: Unique identifier
- **Test Case Name**: Descriptive name
- **Module**: Component/Module being tested
- **Priority**: High/Medium/Low
- **Preconditions**: Setup requirements
- **Test Steps**: Detailed steps to execute
- **Expected Results**: Expected outcome
- **Actual Results**: To be filled during execution
- **Status**: Pass/Fail
- **Comments**: Additional notes

---

## 1. Frontend Test Cases

### Test Case TC001
- **Test Case ID**: TC001
- **Test Case Name**: Dashboard Initial Load
- **Module**: App Component
- **Priority**: High
- **Preconditions**: 
  - Application server is running
  - Database contains historical data
  - Browser has network access
- **Test Steps**:
  1. Navigate to http://localhost:3000
  2. Wait for page to load completely
  3. Observe the dashboard interface
- **Expected Results**:
  - Dashboard loads within 3 seconds
  - Default BTC token is selected
  - Default 1D timeframe is selected
  - Price chart displays with data
  - Current price shows in header
  - No error messages appear
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Critical path test

### Test Case TC002
- **Test Case ID**: TC002
- **Test Case Name**: Token Selection
- **Module**: Token Selector Component
- **Priority**: High
- **Preconditions**: Dashboard is loaded
- **Test Steps**:
  1. Click on ETH token button
  2. Wait for chart to update
  3. Click on SOL token button
  4. Click on ADA token button
  5. Return to BTC token
- **Expected Results**:
  - Each token selection updates chart immediately
  - Current price updates for selected token
  - 24h change percentage updates
  - Chart data corresponds to selected token
  - No loading delays > 2 seconds
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Test all supported tokens

### Test Case TC003
- **Test Case ID**: TC003
- **Test Case Name**: Timeframe Selection
- **Module**: Timeframe Selector
- **Priority**: High
- **Preconditions**: Dashboard loaded with BTC selected
- **Test Steps**:
  1. Click "1W" timeframe button
  2. Observe chart update
  3. Click "1M" timeframe button
  4. Click "1Y" timeframe button
  5. Click "YTD" timeframe button
- **Expected Results**:
  - Chart updates with appropriate date range
  - X-axis labels adjust to timeframe
  - Candlestick/line density appropriate
  - Loading indicator shows during fetch
  - Data points match selected range
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Verify time calculations

### Test Case TC004
- **Test Case ID**: TC004
- **Test Case Name**: Chart View Mode Toggle
- **Module**: Chart Component
- **Priority**: Medium
- **Preconditions**: Dashboard loaded with data
- **Test Steps**:
  1. Verify default line chart view
  2. Click "Candlestick" view button
  3. Observe chart transformation
  4. Click "Line" view button
  5. Verify return to line chart
- **Expected Results**:
  - Line chart shows closing prices only
  - Candlestick shows OHLC data
  - Volume bars appear in candlestick mode
  - Smooth transition between modes
  - Data remains consistent
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Visual regression test

### Test Case TC005
- **Test Case ID**: TC005
- **Test Case Name**: Real-time Price Updates
- **Module**: WebSocket Service
- **Priority**: High
- **Preconditions**: Dashboard loaded, WebSocket connected
- **Test Steps**:
  1. Note current BTC price
  2. Wait 5 seconds
  3. Observe price update
  4. Wait another 5 seconds
  5. Verify continuous updates
- **Expected Results**:
  - Price updates every 5 seconds
  - Green flash on price increase
  - Red flash on price decrease
  - No connection errors
  - Updates for all tokens simultaneously
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Test WebSocket stability

### Test Case TC006
- **Test Case ID**: TC006
- **Test Case Name**: Chart Zoom and Pan
- **Module**: InteractiveCandlestickChart
- **Priority**: Medium
- **Preconditions**: Candlestick view active
- **Test Steps**:
  1. Scroll mouse wheel up on chart
  2. Observe zoom in effect
  3. Scroll mouse wheel down
  4. Click and drag to pan
  5. Double-click to reset zoom
- **Expected Results**:
  - Zoom centers on cursor position
  - Smooth zoom animation
  - Pan moves chart horizontally
  - Y-axis auto-scales to visible data
  - Reset returns to full view
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Test on different browsers

### Test Case TC007
- **Test Case ID**: TC007
- **Test Case Name**: Trading Indicators Display
- **Module**: TradingIndicators Component
- **Priority**: High
- **Preconditions**: Dashboard loaded with sufficient data
- **Test Steps**:
  1. Observe RSI indicator value
  2. Check MACD indicator
  3. Verify Moving Average signals
  4. Check Bollinger Bands status
  5. Observe overall sentiment
- **Expected Results**:
  - RSI shows value 0-100
  - MACD shows crossover signals
  - MA signals show BUY/SELL/NEUTRAL
  - All 10 indicators display values
  - Overall sentiment aggregates correctly
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Verify calculations

### Test Case TC008
- **Test Case ID**: TC008
- **Test Case Name**: Chart Tooltip Information
- **Module**: Chart Tooltip
- **Priority**: Low
- **Preconditions**: Candlestick chart displayed
- **Test Steps**:
  1. Hover over a candlestick
  2. Read tooltip information
  3. Move to different candlestick
  4. Move cursor off chart
  5. Test on volume bars
- **Expected Results**:
  - Tooltip shows Date/Time
  - Displays O, H, L, C values
  - Shows volume
  - Follows cursor smoothly
  - Disappears when off chart
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: UI/UX test

### Test Case TC009
- **Test Case ID**: TC009
- **Test Case Name**: Offline Data Caching
- **Module**: IndexedDB Service
- **Priority**: Medium
- **Preconditions**: Dashboard used previously
- **Test Steps**:
  1. Load dashboard normally
  2. Disable network connection
  3. Refresh the page
  4. Navigate between timeframes
  5. Re-enable network
- **Expected Results**:
  - Cached data displays offline
  - "Offline mode" indicator shows
  - Previously viewed data available
  - Graceful degradation
  - Auto-sync when online
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: PWA functionality

### Test Case TC010
- **Test Case ID**: TC010
- **Test Case Name**: Mobile Responsive Design
- **Module**: All UI Components
- **Priority**: Medium
- **Preconditions**: Dashboard loaded
- **Test Steps**:
  1. Resize browser to 375px width
  2. Check layout adjustments
  3. Test touch interactions
  4. Rotate to landscape
  5. Test all controls
- **Expected Results**:
  - Layout stacks vertically
  - Buttons remain clickable
  - Chart fills viewport
  - No horizontal scroll
  - Touch zoom works
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Test on actual devices

## 2. Backend API Test Cases

### Test Case TC011
- **Test Case ID**: TC011
- **Test Case Name**: Health Check Endpoint
- **Module**: Health Route
- **Priority**: High
- **Preconditions**: Backend server running
- **Test Steps**:
  1. Send GET request to /api/health
  2. Check response status
  3. Verify response body
  4. Check response time
- **Expected Results**:
  - Status code: 200
  - Response body: { "status": "ok", "timestamp": <timestamp> }
  - Response time < 100ms
  - Content-Type: application/json
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Basic connectivity test

### Test Case TC012
- **Test Case ID**: TC012
- **Test Case Name**: Get Candlestick Data
- **Module**: Candlestick API
- **Priority**: High
- **Preconditions**: Database contains data
- **Test Steps**:
  1. GET /api/candlesticks/BTC/1h
  2. Add query params: start, end timestamps
  3. Verify response structure
  4. Check data ordering
  5. Validate data types
- **Expected Results**:
  - Status code: 200
  - Array of candlestick objects
  - Ordered by timestamp ascending
  - All numeric fields valid
  - No null values in required fields
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Core functionality

### Test Case TC013
- **Test Case ID**: TC013
- **Test Case Name**: Invalid Token Request
- **Module**: Candlestick API
- **Priority**: Medium
- **Preconditions**: Backend running
- **Test Steps**:
  1. GET /api/candlesticks/INVALID/1h
  2. Check error response
  3. Verify status code
  4. Test SQL injection: "BTC'; DROP TABLE--"
- **Expected Results**:
  - Status code: 400
  - Error message: "Invalid token"
  - No database errors
  - Proper input sanitization
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Security test

### Test Case TC014
- **Test Case ID**: TC014
- **Test Case Name**: Current Prices Endpoint
- **Module**: Prices API
- **Priority**: High
- **Preconditions**: Price data exists
- **Test Steps**:
  1. GET /api/prices/current
  2. Verify all tokens present
  3. Check price format
  4. Verify 24h change calculation
  5. Check last_update timestamp
- **Expected Results**:
  - All 4 tokens in response
  - Prices as decimal numbers
  - 24h change as percentage
  - Recent timestamps (< 1 min old)
  - Proper JSON structure
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Real-time data test

### Test Case TC015
- **Test Case ID**: TC015
- **Test Case Name**: Data Gap Detection
- **Module**: Data Manager Service
- **Priority**: High
- **Preconditions**: Gaps exist in data
- **Test Steps**:
  1. Create artificial gap in database
  2. Request data spanning the gap
  3. Check gap detection in response
  4. Verify async fill triggered
  5. Re-request after fill
- **Expected Results**:
  - Initial response indicates gaps
  - Background job starts
  - Subsequent request has complete data
  - No duplicate entries
  - Correct gap statistics
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Data integrity test

### Test Case TC016
- **Test Case ID**: TC016
- **Test Case Name**: Rate Limit Handling
- **Module**: Binance API Service
- **Priority**: Medium
- **Preconditions**: Backend configured
- **Test Steps**:
  1. Trigger multiple rapid requests
  2. Exceed Binance rate limit
  3. Observe retry behavior
  4. Check exponential backoff
  5. Verify eventual success
- **Expected Results**:
  - 429 errors handled gracefully
  - Automatic retry with delay
  - Exponential backoff implemented
  - No data loss
  - User receives data eventually
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Resilience test

### Test Case TC017
- **Test Case ID**: TC017
- **Test Case Name**: WebSocket Connection
- **Module**: WebSocket Manager
- **Priority**: High
- **Preconditions**: Backend running
- **Test Steps**:
  1. Monitor WebSocket connection log
  2. Verify all 4 streams subscribed
  3. Check message processing
  4. Force disconnect
  5. Verify auto-reconnect
- **Expected Results**:
  - Successful connection to Binance
  - 4 token streams active
  - Price updates processed
  - Reconnect within 5 seconds
  - No message loss during reconnect
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Real-time data flow

### Test Case TC018
- **Test Case ID**: TC018
- **Test Case Name**: Scheduled Task Execution
- **Module**: Cron Jobs
- **Priority**: Medium
- **Preconditions**: Scheduler running
- **Test Steps**:
  1. Wait for hourly job trigger
  2. Check gap filling execution
  3. Verify 5-min price updates
  4. Check daily cleanup at 3 AM
  5. Monitor job completion
- **Expected Results**:
  - Jobs run on schedule
  - Gap filling completes
  - Price changes updated
  - Old data cleaned up
  - No job overlap/conflicts
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Long-running test

### Test Case TC019
- **Test Case ID**: TC019
- **Test Case Name**: Database Connection Pool
- **Module**: Database Layer
- **Priority**: High
- **Preconditions**: PostgreSQL running
- **Test Steps**:
  1. Start 25 concurrent requests
  2. Monitor connection pool
  3. Check for connection leaks
  4. Verify timeout handling
  5. Test pool exhaustion
- **Expected Results**:
  - Max 20 connections used
  - Requests queue properly
  - No connection leaks
  - Timeouts after 2 seconds
  - Graceful degradation
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Load test

### Test Case TC020
- **Test Case ID**: TC020
- **Test Case Name**: CORS Configuration
- **Module**: Express Middleware
- **Priority**: Medium
- **Preconditions**: Backend running
- **Test Steps**:
  1. Send request from different origin
  2. Check CORS headers
  3. Test preflight OPTIONS
  4. Verify allowed methods
  5. Test credentials handling
- **Expected Results**:
  - Access-Control headers present
  - OPTIONS returns 204
  - GET, POST methods allowed
  - Credentials supported
  - Origin validation works
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Security configuration

## 3. Integration Test Cases

### Test Case TC021
- **Test Case ID**: TC021
- **Test Case Name**: End-to-End Data Flow
- **Module**: Full System
- **Priority**: High
- **Preconditions**: All services running
- **Test Steps**:
  1. Binance emits new price via WebSocket
  2. Backend receives and processes
  3. Database updated
  4. Frontend receives update
  5. UI reflects new price
- **Expected Results**:
  - Total latency < 1 second
  - All components update
  - No data inconsistency
  - Smooth UI update
  - Correct price displayed
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Critical path validation

### Test Case TC022
- **Test Case ID**: TC022
- **Test Case Name**: Multi-User Concurrent Access
- **Module**: Full System
- **Priority**: Medium
- **Preconditions**: System deployed
- **Test Steps**:
  1. Open dashboard in 5 browsers
  2. Different tokens/timeframes each
  3. Generate simultaneous requests
  4. Monitor system resources
  5. Check data consistency
- **Expected Results**:
  - All users get correct data
  - No cross-contamination
  - Response times acceptable
  - Server remains stable
  - Database handles load
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Concurrency test

### Test Case TC023
- **Test Case ID**: TC023
- **Test Case Name**: Docker Container Health
- **Module**: Docker Deployment
- **Priority**: High
- **Preconditions**: Docker installed
- **Test Steps**:
  1. Run docker-compose up
  2. Check all containers start
  3. Verify health checks pass
  4. Test inter-container communication
  5. Validate exposed ports
- **Expected Results**:
  - 3 containers running
  - Health checks passing
  - Database accessible
  - Backend connects to DB
  - Frontend loads successfully
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Deployment validation

### Test Case TC024
- **Test Case ID**: TC024
- **Test Case Name**: Data Persistence
- **Module**: Database
- **Priority**: High
- **Preconditions**: System running with data
- **Test Steps**:
  1. Note current data state
  2. Stop all containers
  3. Restart containers
  4. Verify data intact
  5. Check no data loss
- **Expected Results**:
  - All historical data preserved
  - Current prices maintained
  - No corruption
  - Indexes intact
  - Normal operation resumes
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Reliability test

### Test Case TC025
- **Test Case ID**: TC025
- **Test Case Name**: Performance Under Load
- **Module**: Full System
- **Priority**: Medium
- **Preconditions**: Production setup
- **Test Steps**:
  1. Run load test tool (100 users)
  2. Simulate various operations
  3. Monitor response times
  4. Check error rates
  5. Analyze bottlenecks
- **Expected Results**:
  - Avg response time < 500ms
  - Error rate < 1%
  - No memory leaks
  - CPU usage < 80%
  - Stable performance
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Performance benchmark

## 4. Security Test Cases

### Test Case TC026
- **Test Case ID**: TC026
- **Test Case Name**: SQL Injection Prevention
- **Module**: API Endpoints
- **Priority**: High
- **Preconditions**: Backend running
- **Test Steps**:
  1. Try SQL injection in token param
  2. Test in timeframe param
  3. Attempt in query strings
  4. Check prepared statements
  5. Verify parameterization
- **Expected Results**:
  - All attempts blocked
  - Proper error messages
  - No database errors
  - Queries parameterized
  - Input validation works
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Security critical

### Test Case TC027
- **Test Case ID**: TC027
- **Test Case Name**: XSS Prevention
- **Module**: Frontend
- **Priority**: High
- **Preconditions**: Application running
- **Test Steps**:
  1. Try XSS in URL params
  2. Test in API responses
  3. Check React sanitization
  4. Verify content encoding
  5. Test user inputs
- **Expected Results**:
  - Scripts not executed
  - HTML properly escaped
  - React prevents XSS
  - Safe rendering
  - No code injection
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Frontend security

### Test Case TC028
- **Test Case ID**: TC028
- **Test Case Name**: Environment Variables Security
- **Module**: Configuration
- **Priority**: High
- **Preconditions**: Deployment setup
- **Test Steps**:
  1. Check .env not in repository
  2. Verify secrets not logged
  3. Test environment isolation
  4. Check default values
  5. Validate production config
- **Expected Results**:
  - .env in .gitignore
  - No secrets in logs
  - Proper env separation
  - Safe defaults used
  - Production secured
- **Actual Results**: [To be filled]
- **Status**: [To be filled]
- **Comments**: Configuration security

## Test Execution Summary

### Test Coverage Matrix

| Module | Total Tests | High Priority | Medium Priority | Low Priority |
|--------|------------|---------------|-----------------|--------------|
| Frontend | 10 | 6 | 3 | 1 |
| Backend API | 10 | 6 | 4 | 0 |
| Integration | 5 | 4 | 1 | 0 |
| Security | 3 | 3 | 0 | 0 |
| **Total** | **28** | **19** | **8** | **1** |

### Test Environment Requirements

1. **Development Environment**
   - Node.js 16+
   - PostgreSQL 13+
   - Docker & Docker Compose
   - Chrome/Firefox latest
   - 8GB RAM minimum

2. **Test Data Requirements**
   - Historical price data for all tokens
   - At least 30 days of data
   - Various timeframe coverage
   - Known gap scenarios

3. **Test Tools**
   - Jest for unit tests
   - Supertest for API tests
   - React Testing Library
   - JMeter for load tests
   - Browser DevTools

### Test Execution Schedule

1. **Daily Tests**: TC001-TC010 (Frontend smoke tests)
2. **Pre-deployment**: All High priority tests
3. **Weekly**: Full test suite execution
4. **Monthly**: Performance and load tests

### Risk-Based Testing Priority

1. **Critical**: Real-time data flow, API availability
2. **High**: Data accuracy, UI functionality
3. **Medium**: Performance, error handling
4. **Low**: UI polish, edge cases