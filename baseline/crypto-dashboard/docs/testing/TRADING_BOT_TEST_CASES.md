# Test Cases - Sentiment-Driven Ensemble Trading Signal Bot

## Test Case Template Information
- **Test Case Number**: Unique identifier (TC###)
- **Revision**: Document revision number
- **Author**: Test case author
- **Date Conducted**: Test execution date
- **Test Conductor**: Person executing the test
- **Customer Representative**: Stakeholder witness
- **P/F**: Pass/Fail status

---

## 1. Authentication and API Access Test Cases

### Test Case TC001
- **Test Case Number**: TC001
- **Revision**: Rev. 1
- **Author**: QA Team
- **Date Conducted**: [To be filled]
- **Test Conductor**: [To be filled]
- **Customer Representative**: [To be filled]
- **Description**: This test case validates API key authentication and authorization functionality for the prediction API endpoint.
- **Pre-Test Setup**: 
  1. Ensure API service is running
  2. Database is populated with test API keys
  3. Test API key is available: `test_key_123`
- **Use Case**: UC3
- **Flow**: Main Flow

| Step | User Action | Expected Results | Requirement # | P/F | Comment |
|------|------------|------------------|---------------|-----|---------|
| 1 | Send GET request to /predict?token=BTC&horizon=5m with valid Authorization header "Bearer test_key_123" | • HTTP 200 response<br>• Valid JSON response with prediction data<br>• Response time < 500ms | 3.1.5, NFR1.2 | | |
| 2 | Send GET request without Authorization header | • HTTP 401 response<br>• Error message: "Invalid API key format" | NFR4.2 | | |
| 3 | Send GET request with invalid API key "Bearer invalid_key" | • HTTP 401 response<br>• Error message: "Invalid API key" | NFR4.2 | | |
| 4 | Send GET request with expired API key | • HTTP 401 response<br>• Error message: "Invalid API key" | NFR4.2 | | |
| 5 | Exceed rate limit by sending 101 requests in 60 seconds | • First 100 requests return HTTP 200<br>• 101st request returns HTTP 429<br>• Error message includes retry time | NFR2.2 | | |

**Post-conditions**: API key usage is logged in database for billing and analytics

---

### Test Case TC002
- **Test Case Number**: TC002
- **Revision**: Rev. 1
- **Author**: QA Team
- **Date Conducted**: [To be filled]
- **Test Conductor**: [To be filled]
- **Customer Representative**: [To be filled]
- **Description**: This test case validates WebSocket authentication and real-time prediction streaming functionality.
- **Pre-Test Setup**: 
  1. WebSocket service is running
  2. Valid API key available
  3. WebSocket client ready
- **Use Case**: UC1
- **Flow**: Main Flow

| Step | User Action | Expected Results | Requirement # | P/F | Comment |
|------|------------|------------------|---------------|-----|---------|
| 1 | Connect to wss://api.cryptosignalbot.com/ws/predict?apikey=test_key_123 | • WebSocket connection established<br>• No error messages | FR5.2 | | |
| 2 | Wait for initial prediction broadcast | • Receive JSON message within 60 seconds<br>• Contains predictions for all 4 tokens and 2 horizons | FR5.2 | | |
| 3 | Verify prediction data structure | • Each prediction has prob_up, prob_down, timestamp<br>• Probabilities sum to 1.0 | 3.1.5 | | |
| 4 | Attempt connection with invalid API key | • Connection rejected with code 1008<br>• Reason: "Invalid API key" | NFR4.2 | | |
| 5 | Maintain connection for 5 minutes | • Receive 5 prediction updates<br>• No disconnections | NFR3.1 | | |

**Post-conditions**: WebSocket connections tracked in monitoring system

---

## 2. Market Data Ingestion Test Cases

### Test Case TC003
- **Test Case Number**: TC003
- **Revision**: Rev. 1
- **Author**: QA Team
- **Date Conducted**: [To be filled]
- **Test Conductor**: [To be filled]
- **Customer Representative**: [To be filled]
- **Description**: This test case validates Binance WebSocket connection and OHLCV data ingestion for all supported tokens.
- **Pre-Test Setup**: 
  1. Binance WebSocket service is accessible
  2. Time-series database is running
  3. Network connectivity established
- **Use Case**: Data Ingestion
- **Flow**: Main Flow

| Step | User Action | Expected Results | Requirement # | P/F | Comment |
|------|------------|------------------|---------------|-----|---------|
| 1 | Start market data ingestion service | • Service connects to Binance WebSocket<br>• Subscription confirmed for 8 streams (4 tokens × 2 intervals) | FR1.1, 3.1.1 | | |
| 2 | Monitor incoming data for 5 minutes | • Receive 1-min bars every minute<br>• Receive 5-min bars every 5 minutes<br>• All 4 tokens covered | FR1.2 | | |
| 3 | Verify data normalization | • OHLCV data properly formatted<br>• Timestamps in milliseconds<br>• Numeric values as floats | FR1.2 | | |
| 4 | Disconnect network cable | • Connection lost detected within 5 seconds<br>• Reconnection attempts logged | FR1.3 | | |
| 5 | Reconnect network cable | • Automatic reconnection within 5 seconds<br>• Data ingestion resumes<br>• No data loss | NFR3.2 | | |
| 6 | Query time-series database | • All ingested data present<br>• Proper indexing by token and interval<br>• Query response < 100ms | FR1.2 | | |

**Post-conditions**: Historical OHLCV data available for feature calculation

---

### Test Case TC004
- **Test Case Number**: TC004
- **Revision**: Rev. 1
- **Author**: QA Team
- **Date Conducted**: [To be filled]
- **Test Conductor**: [To be filled]
- **Customer Representative**: [To be filled]
- **Description**: This test case validates news ingestion from CryptoControl API with proper rate limiting and deduplication.
- **Pre-Test Setup**: 
  1. CryptoControl API key configured
  2. Message queue (Kafka) running
  3. Deduplication cache initialized
- **Use Case**: Text Data Ingestion
- **Flow**: Main Flow

| Step | User Action | Expected Results | Requirement # | P/F | Comment |
|------|------------|------------------|---------------|-----|---------|
| 1 | Start news fetcher service | • Service initializes successfully<br>• Connects to CryptoControl API | FR2.1, 3.1.2 | | |
| 2 | Monitor first news fetch cycle | • Fetches news for all 4 tokens<br>• Respects 60-second polling interval | FR2.1 | | |
| 3 | Verify duplicate handling | • Same headline not processed twice<br>• Hash-based deduplication working | FR2.1 | | |
| 4 | Send 100 requests in 1 minute | • All requests succeed<br>• Rate limiter tracks usage | 3.1.2 | | |
| 5 | Send 101st request | • Request queued or delayed<br>• No API errors | 3.1.2 | | |
| 6 | Check Kafka queue | • News items published to 'raw-text' topic<br>• Proper JSON format with source, tokenTags, text | FR2.4 | | |

**Post-conditions**: Raw news data available for sentiment analysis

---

## 3. Feature Engineering Test Cases

### Test Case TC005
- **Test Case Number**: TC005
- **Revision**: Rev. 1
- **Author**: QA Team
- **Date Conducted**: [To be filled]
- **Test Conductor**: [To be filled]
- **Customer Representative**: [To be filled]
- **Description**: This test case validates GPU-accelerated sentiment analysis processing and scoring accuracy.
- **Pre-Test Setup**: 
  1. GPU available with CUDA support
  2. FinBERT model loaded
  3. Sample text data prepared
- **Use Case**: Feature Engineering
- **Flow**: Main Flow

| Step | User Action | Expected Results | Requirement # | P/F | Comment |
|------|------------|------------------|---------------|-----|---------|
| 1 | Submit positive sentiment text: "Bitcoin rally continues, institutional adoption soaring" | • Sentiment score > 0.5<br>• Score in range [-1.0, 1.0] | FR3.1 | | |
| 2 | Submit negative sentiment text: "Crypto market crash fears amid regulatory crackdown" | • Sentiment score < -0.5<br>• Score in range [-1.0, 1.0] | FR3.1 | | |
| 3 | Submit neutral text: "Bitcoin trades at $45,000" | • Sentiment score near 0<br>• Score in range [-1.0, 1.0] | FR3.1 | | |
| 4 | Process batch of 32 texts | • All texts processed in single GPU batch<br>• Processing time < 1.5 seconds | NFR1.1 | | |
| 5 | Verify sentiment aggregation | • 1-min mean sentiment calculated<br>• 5-min mean sentiment calculated<br>• Momentum values computed | FR3.2 | | |
| 6 | Check GPU memory usage | • Memory usage < 16GB<br>• No out-of-memory errors | 2.5 | | |

**Post-conditions**: Sentiment features stored in feature store

---

### Test Case TC006
- **Test Case Number**: TC006
- **Revision**: Rev. 1
- **Author**: QA Team
- **Date Conducted**: [To be filled]
- **Test Conductor**: [To be filled]
- **Customer Representative**: [To be filled]
- **Description**: This test case validates technical indicator calculations with GPU acceleration.
- **Pre-Test Setup**: 
  1. Historical OHLCV data available (100+ data points)
  2. GPU compute resources allocated
  3. Feature store accessible
- **Use Case**: Feature Engineering
- **Flow**: Main Flow

| Step | User Action | Expected Results | Requirement # | P/F | Comment |
|------|------------|------------------|---------------|-----|---------|
| 1 | Trigger RSI calculation for BTC 1m | • RSI value between 0-100<br>• 14-period calculation correct | FR3.3 | | |
| 2 | Trigger MACD calculation | • MACD line calculated (12-26 EMA)<br>• Signal line calculated (9 EMA)<br>• Values reasonable for price range | FR3.3 | | |
| 3 | Calculate Bollinger Bands | • Upper/middle/lower bands calculated<br>• Z-score of current price computed<br>• 20-period SMA correct | FR3.3 | | |
| 4 | Calculate VWAP deviation | • VWAP calculated with volume weighting<br>• Deviation percentage computed | FR3.3 | | |
| 5 | Process all indicators for 1 token | • All calculations complete < 1.5 seconds<br>• GPU utilization logged | NFR1.1 | | |
| 6 | Verify feature normalization | • Features normalized (z-score or min-max)<br>• Stored in feature store with timestamp | FR3.4 | | |

**Post-conditions**: Technical indicator features available for model inference

---

## 4. Model Inference Test Cases

### Test Case TC007
- **Test Case Number**: TC007
- **Revision**: Rev. 1
- **Author**: QA Team
- **Date Conducted**: [To be filled]
- **Test Conductor**: [To be filled]
- **Customer Representative**: [To be filled]
- **Description**: This test case validates the complete prediction pipeline including base models, ensemble, and calibration.
- **Pre-Test Setup**: 
  1. All models loaded (sentiment, technical, ensemble)
  2. Fresh features available in feature store
  3. Temperature calibration parameters loaded
- **Use Case**: UC3
- **Flow**: Main Flow

| Step | User Action | Expected Results | Requirement # | P/F | Comment |
|------|------------|------------------|---------------|-----|---------|
| 1 | Request prediction for BTC 5m | • Response received < 500ms<br>• Contains prob_up and prob_down | FR4.4, NFR1.2 | | |
| 2 | Verify probability values | • prob_up + prob_down = 1.0 (±0.0001)<br>• Both values in range [0, 1] | FR4.4 | | |
| 3 | Check sentiment model output | • Sentiment model prediction logged<br>• Value between 0 and 1 | FR4.2 | | |
| 4 | Check technical model output | • Technical model prediction logged<br>• Value between 0 and 1 | FR4.2 | | |
| 5 | Verify ensemble combination | • Ensemble uses both base predictions<br>• Final prediction differs from base models | FR4.2 | | |
| 6 | Verify temperature calibration | • Calibrated probability ≠ raw probability<br>• Calibration improves accuracy | FR4.3 | | |

**Post-conditions**: Prediction logged for performance tracking

---

### Test Case TC008
- **Test Case Number**: TC008
- **Revision**: Rev. 1
- **Author**: QA Team
- **Date Conducted**: [To be filled]
- **Test Conductor**: [To be filled]
- **Customer Representative**: [To be filled]
- **Description**: This test case validates handling of stale features and service degradation.
- **Pre-Test Setup**: 
  1. Prediction service running
  2. Feature store contains old data (>2 minutes)
  3. API monitoring active
- **Use Case**: UC3
- **Flow**: Alternate Flow - Stale Data

| Step | User Action | Expected Results | Requirement # | P/F | Comment |
|------|------------|------------------|---------------|-----|---------|
| 1 | Stop feature updates for 3 minutes | • Feature timestamp becomes stale | Setup | | |
| 2 | Request prediction for ETH 1h | • HTTP 503 response<br>• Error: "Features stale; retry after 1 minute" | FR4.4 | | |
| 3 | Resume feature updates | • New features calculated and stored | Recovery | | |
| 4 | Retry prediction request | • HTTP 200 response<br>• Valid prediction returned | FR4.4 | | |
| 5 | Simulate GPU out of memory | • Service remains responsive<br>• Error logged | NFR5.3 | | |
| 6 | Check fallback behavior | • CPU inference attempted<br>• Degraded performance acceptable | NFR5.3 | | |

**Post-conditions**: Service health metrics updated

---

## 5. Dashboard and UI Test Cases

### Test Case TC009
- **Test Case Number**: TC009
- **Revision**: Rev. 1
- **Author**: QA Team
- **Date Conducted**: [To be filled]
- **Test Conductor**: [To be filled]
- **Customer Representative**: [To be filled]
- **Description**: This test case validates the React dashboard functionality including authentication, real-time updates, and visualizations.
- **Pre-Test Setup**: 
  1. Dashboard deployed and accessible
  2. Valid API key available
  3. Chrome/Firefox browser ready
- **Use Case**: UC1
- **Flow**: Main Flow

| Step | User Action | Expected Results | Requirement # | P/F | Comment |
|------|------------|------------------|---------------|-----|---------|
| 1 | Navigate to dashboard URL | • Login prompt displayed<br>• API key field visible | FR5.1 | | |
| 2 | Enter valid API key | • Authentication successful<br>• Dashboard loads < 5 seconds | FR5.1, NFR5.1 | | |
| 3 | Verify initial display | • 8 probability gauges shown (4 tokens × 2 horizons)<br>• All gauges show current values | FR5.3 | | |
| 4 | Observe gauge colors | • Green gauges for prob_up ≥ 0.5<br>• Red gauges for prob_up < 0.5 | FR5.3 | | |
| 5 | Wait 60 seconds | • Gauges update with new values<br>• Smooth animation on change | FR5.2 | | |
| 6 | Check time-series charts | • Charts show last 60 data points<br>• RSI and sentiment trends visible | FR5.4 | | |
| 7 | Test responsive design | • Resize browser to mobile width<br>• Layout adjusts appropriately | NFR5.1 | | |

**Post-conditions**: User session maintained in local storage

---

### Test Case TC010
- **Test Case Number**: TC010
- **Revision**: Rev. 1
- **Author**: QA Team
- **Date Conducted**: [To be filled]
- **Test Conductor**: [To be filled]
- **Customer Representative**: [To be filled]
- **Description**: This test case validates alert configuration functionality through the dashboard UI.
- **Pre-Test Setup**: 
  1. User authenticated in dashboard
  2. Email/SMS services configured
  3. Database ready for alert storage
- **Use Case**: UC2
- **Flow**: Main Flow

| Step | User Action | Expected Results | Requirement # | P/F | Comment |
|------|------------|------------------|---------------|-----|---------|
| 1 | Click "Configure Alerts" button | • Modal dialog opens<br>• Form fields displayed | FR5.5 | | |
| 2 | Select Token: BTC, Horizon: 5m | • Dropdowns populate correctly<br>• Selection highlighted | FR5.5 | | |
| 3 | Set threshold slider to 0.80 | • Slider moves smoothly<br>• Value displayed as 80% | FR5.5 | | |
| 4 | Select notification: Email, Enter: test@example.com | • Email validation applied<br>• Valid format accepted | FR5.5 | | |
| 5 | Click "Save" button | • Loading indicator shown<br>• Success message displayed<br>• Modal closes | FR5.5 | | |
| 6 | Verify alert in database | • Alert record created<br>• All fields stored correctly<br>• is_active = true | FR5.6 | | |

**Post-conditions**: Alert active and monitored every 30 seconds

---

## 6. Alert Processing Test Cases

### Test Case TC011
- **Test Case Number**: TC011
- **Revision**: Rev. 1
- **Author**: QA Team
- **Date Conducted**: [To be filled]
- **Test Conductor**: [To be filled]
- **Customer Representative**: [To be filled]
- **Description**: This test case validates alert triggering and notification delivery when threshold conditions are met.
- **Pre-Test Setup**: 
  1. Alert configured: SOL 1h ≥ 75%
  2. Alert service running
  3. Email service (AWS SES) configured
- **Use Case**: UC2
- **Flow**: Alert Triggering

| Step | User Action | Expected Results | Requirement # | P/F | Comment |
|------|------------|------------------|---------------|-----|---------|
| 1 | Mock prediction service to return SOL 1h = 0.76 | • Prediction endpoint returns mocked value | Setup | | |
| 2 | Wait for alert check cycle (max 30s) | • Alert service polls predictions<br>• Threshold condition detected | FR5.6 | | |
| 3 | Verify notification sent | • Email sent to test@example.com<br>• Contains token, probability, threshold | FR5.6 | | |
| 4 | Check notification content | • Subject: "Crypto Signal Alert: SOL"<br>• Body includes all relevant data<br>• Timestamp included | FR5.6 | | |
| 5 | Verify cooldown period | • Same alert not sent again for 5 minutes<br>• last_triggered updated | FR5.6 | | |
| 6 | Test SMS notification | • Configure SMS alert<br>• SMS delivered successfully<br>• Message within 160 characters | FR5.6 | | |

**Post-conditions**: Alert history recorded in database

---

## 7. Backtesting Engine Test Cases

### Test Case TC012
- **Test Case Number**: TC012
- **Revision**: Rev. 1
- **Author**: QA Team
- **Date Conducted**: [To be filled]
- **Test Conductor**: [To be filled]
- **Customer Representative**: [To be filled]
- **Description**: This test case validates the backtesting engine's ability to simulate historical trading strategies.
- **Pre-Test Setup**: 
  1. Historical data available for 2024
  2. Models trained and available
  3. Report generation service ready
- **Use Case**: UC4
- **Flow**: Main Flow

| Step | User Action | Expected Results | Requirement # | P/F | Comment |
|------|------------|------------------|---------------|-----|---------|
| 1 | Configure backtest: ADA, 5m, 2024-01-01 to 2024-12-31 | • Configuration accepted<br>• Parameters validated | FR6.1 | | |
| 2 | Set thresholds: Up=0.75, Down=0.75 | • Thresholds stored<br>• Valid range confirmed | FR6.1 | | |
| 3 | Start backtest execution | • Progress indicator shown<br>• Historical data loading | FR6.2 | | |
| 4 | Monitor simulation progress | • Processing each time bucket<br>• Trades executed based on signals<br>• P&L calculated | FR6.3 | | |
| 5 | Verify metrics calculation | • Sharpe ratio computed<br>• Max drawdown calculated<br>• Win rate percentage shown | FR6.4 | | |
| 6 | Check generated report | • PDF/HTML report created<br>• Contains trade list<br>• Equity curve plotted<br>• Performance vs benchmark | FR6.5 | | |

**Post-conditions**: Backtest results stored for future reference

---

## 8. Performance and Load Test Cases

### Test Case TC013
- **Test Case Number**: TC013
- **Revision**: Rev. 1
- **Author**: QA Team
- **Date Conducted**: [To be filled]
- **Test Conductor**: [To be filled]
- **Customer Representative**: [To be filled]
- **Description**: This test case validates system performance under concurrent load conditions.
- **Pre-Test Setup**: 
  1. Load testing tool configured (JMeter/Locust)
  2. 50 virtual users ready
  3. Monitoring tools active
- **Use Case**: Performance Testing
- **Flow**: Load Test

| Step | User Action | Expected Results | Requirement # | P/F | Comment |
|------|------------|------------------|---------------|-----|---------|
| 1 | Start 10 concurrent API requests | • All requests succeed<br>• Response time < 500ms | NFR1.2, NFR2.2 | | |
| 2 | Increase to 50 concurrent users | • System remains responsive<br>• No errors returned<br>• Avg response time < 1s | NFR2.2 | | |
| 3 | Sustain load for 10 minutes | • No memory leaks<br>• CPU usage < 80%<br>• GPU usage stable | NFR2.2 | | |
| 4 | Monitor WebSocket connections | • 50 concurrent connections maintained<br>• All receive updates | NFR2.2 | | |
| 5 | Check database performance | • Query response times normal<br>• No connection pool exhaustion | NFR2.2 | | |
| 6 | Verify auto-scaling | • Additional pods spawned if needed<br>• Load distributed evenly | NFR2.1 | | |

**Post-conditions**: Performance metrics recorded for analysis

---

## 9. Security Test Cases

### Test Case TC014
- **Test Case Number**: TC014
- **Revision**: Rev. 1
- **Author**: QA Team
- **Date Conducted**: [To be filled]
- **Test Conductor**: [To be filled]
- **Customer Representative**: [To be filled]
- **Description**: This test case validates security measures including HTTPS, authentication, and data protection.
- **Pre-Test Setup**: 
  1. Security scanning tools ready
  2. Test API keys prepared
  3. Network monitoring active
- **Use Case**: Security Testing
- **Flow**: Security Validation

| Step | User Action | Expected Results | Requirement # | P/F | Comment |
|------|------------|------------------|---------------|-----|---------|
| 1 | Access API via HTTP (not HTTPS) | • Request redirected to HTTPS<br>• Or connection refused | NFR4.1 | | |
| 2 | Attempt SQL injection in token parameter | • Request rejected<br>• Error logged<br>• No database errors | Security | | |
| 3 | Send malformed JSON payload | • HTTP 400 Bad Request<br>• No server crash | Security | | |
| 4 | Check API key in logs | • API keys not logged in plain text<br>• Masked or hashed | NFR4.3 | | |
| 5 | Verify TLS version | • TLS 1.2 or higher<br>• Strong cipher suites | NFR4.1 | | |
| 6 | Test cross-origin requests | • CORS properly configured<br>• Only allowed origins accepted | Security | | |

**Post-conditions**: Security scan report generated

---

## 10. Failover and Recovery Test Cases

### Test Case TC015
- **Test Case Number**: TC015
- **Revision**: Rev. 1
- **Author**: QA Team
- **Date Conducted**: [To be filled]
- **Test Conductor**: [To be filled]
- **Customer Representative**: [To be filled]
- **Description**: This test case validates system resilience and recovery procedures during component failures.
- **Pre-Test Setup**: 
  1. All services running normally
  2. Backup systems configured
  3. Monitoring alerts active
- **Use Case**: Disaster Recovery
- **Flow**: Failure Recovery

| Step | User Action | Expected Results | Requirement # | P/F | Comment |
|------|------------|------------------|---------------|-----|---------|
| 1 | Stop PostgreSQL primary database | • Failover to replica within 30s<br>• Service remains available | NFR3.1 | | |
| 2 | Stop one prediction API instance | • Load balancer redirects traffic<br>• No user impact | NFR3.1 | | |
| 3 | Disconnect Binance WebSocket | • Reconnection attempted<br>• Historical data used temporarily | NFR3.2 | | |
| 4 | Simulate Redis cache failure | • Service continues with degraded performance<br>• Direct database queries | NFR3.1 | | |
| 5 | Restart all failed components | • Services recover automatically<br>• Normal operation resumes<br>• No data loss | NFR3.1 | | |
| 6 | Verify system integrity | • All features functional<br>• Data consistency maintained<br>• Metrics accurate | NFR3.1 | | |

**Post-conditions**: Incident report generated with recovery times

---

## 11. End-to-End Integration Test Cases

### Test Case TC016
- **Test Case Number**: TC016
- **Revision**: Rev. 1
- **Author**: QA Team
- **Date Conducted**: [To be filled]
- **Test Conductor**: [To be filled]
- **Customer Representative**: [To be filled]
- **Description**: This test case validates the complete data flow from market data ingestion through prediction delivery.
- **Pre-Test Setup**: 
  1. Full system deployed
  2. All integrations active
  3. Monitoring enabled
- **Use Case**: End-to-End Flow
- **Flow**: Complete Pipeline

| Step | User Action | Expected Results | Requirement # | P/F | Comment |
|------|------------|------------------|---------------|-----|---------|
| 1 | New OHLCV data arrives from Binance | • Data ingested within 1 second<br>• Stored in time-series DB | FR1.1-1.2 | | |
| 2 | News headline published about Bitcoin | • Fetched within 60 seconds<br>• Sentiment analyzed < 1.5s | FR2.1, FR3.1 | | |
| 3 | Features calculated automatically | • Technical indicators computed<br>• Sentiment aggregated<br>• All within 1.5s | FR3.2-3.4, NFR1.1 | | |
| 4 | Request prediction via API | • Features retrieved<br>• Models execute<br>• Response < 500ms | FR4.4, NFR1.2 | | |
| 5 | Dashboard updates automatically | • New prediction displayed<br>• Charts updated<br>• Smooth animation | FR5.2-5.4 | | |
| 6 | Alert threshold exceeded | • Notification sent within 30s<br>• User receives email/SMS | FR5.6 | | |

**Post-conditions**: Complete audit trail available in logs

---

## 12. Data Quality Test Cases

### Test Case TC017
- **Test Case Number**: TC017
- **Revision**: Rev. 1
- **Author**: QA Team
- **Date Conducted**: [To be filled]
- **Test Conductor**: [To be filled]
- **Customer Representative**: [To be filled]
- **Description**: This test case validates data quality, gap detection, and automatic gap filling functionality.
- **Pre-Test Setup**: 
  1. Historical data with known gaps
  2. Gap detection service enabled
  3. Binance API accessible
- **Use Case**: Data Management
- **Flow**: Gap Handling

| Step | User Action | Expected Results | Requirement # | P/F | Comment |
|------|------------|------------------|---------------|-----|---------|
| 1 | Query data with 10-minute gap | • Gap detected in response<br>• Gap metadata included | FR3 | | |
| 2 | Trigger automatic gap filling | • Background job initiated<br>• Missing data fetched from Binance | FR3 | | |
| 3 | Re-query same time range | • Gap filled successfully<br>• Data continuous | FR3 | | |
| 4 | Verify scheduled gap checks | • Hourly job runs automatically<br>• All tokens checked | Scheduled Tasks | | |
| 5 | Check data retention | • 5m data older than 30 days deleted<br>• Other timeframes retained | Scheduled Tasks | | |
| 6 | Validate data consistency | • No duplicate entries<br>• Timestamps monotonic<br>• Values within reasonable ranges | Data Integrity | | |

**Post-conditions**: Data quality metrics updated

---

## Test Execution Summary

### Test Coverage Matrix

| Component | Total Tests | Critical | High | Medium | Low |
|-----------|------------|----------|------|--------|-----|
| Authentication & API | 2 | 2 | 0 | 0 | 0 |
| Data Ingestion | 2 | 1 | 1 | 0 | 0 |
| Feature Engineering | 2 | 1 | 1 | 0 | 0 |
| Model Inference | 2 | 2 | 0 | 0 | 0 |
| Dashboard UI | 2 | 1 | 1 | 0 | 0 |
| Alert System | 1 | 1 | 0 | 0 | 0 |
| Backtesting | 1 | 0 | 1 | 0 | 0 |
| Performance | 1 | 1 | 0 | 0 | 0 |
| Security | 1 | 1 | 0 | 0 | 0 |
| Failover | 1 | 1 | 0 | 0 | 0 |
| Integration | 2 | 2 | 0 | 0 | 0 |
| **Total** | **17** | **13** | **4** | **0** | **0** |

### Test Environment Requirements

1. **Hardware Requirements**
   - GPU Server: NVIDIA Tesla T4 or better (16GB VRAM)
   - CPU: 8+ cores, 32GB RAM minimum
   - Storage: 500GB SSD for time-series data
   - Network: 1Gbps connection

2. **Software Requirements**
   - Docker & Docker Compose
   - Kubernetes cluster (for production tests)
   - PostgreSQL 14+
   - InfluxDB 2.7+
   - Python 3.9+ with CUDA support
   - Node.js 16+ for dashboard

3. **External Dependencies**
   - Binance API access
   - CryptoControl API key
   - Twitter API credentials
   - Reddit API credentials
   - AWS SES for email
   - Twilio for SMS

### Test Data Requirements

1. **Market Data**
   - Minimum 90 days historical OHLCV
   - All 4 tokens (BTC, ETH, SOL, ADA)
   - 1-minute and 5-minute intervals
   - Known gap scenarios for testing

2. **Text Data**
   - Sample news headlines (positive/negative/neutral)
   - Tweet samples with crypto mentions
   - Reddit posts from r/CryptoCurrency

3. **Test Users**
   - Valid API keys for authentication
   - Test email addresses
   - Test phone numbers for SMS

### Acceptance Criteria

1. **Functional Requirements**
   - All API endpoints return correct data formats
   - Predictions accurate to 4 decimal places
   - Real-time updates within specified intervals
   - Alert notifications delivered successfully

2. **Non-Functional Requirements**
   - API response time < 500ms (p99)
   - Feature computation < 1.5s
   - System uptime > 99%
   - Support 50+ concurrent users

3. **Security Requirements**
   - All endpoints use HTTPS
   - API authentication required
   - No sensitive data in logs
   - Rate limiting enforced

### Test Execution Schedule

| Phase | Duration | Test Cases | Resources |
|-------|----------|------------|-----------|
| Unit Testing | 1 week | Component tests | 2 developers |
| Integration Testing | 1 week | TC001-TC006 | 2 QA engineers |
| System Testing | 2 weeks | TC007-TC012 | 3 QA engineers |
| Performance Testing | 3 days | TC013 | 1 performance engineer |
| Security Testing | 2 days | TC014 | 1 security engineer |
| UAT | 1 week | TC015-TC017 | Customer representatives |
| **Total** | **5 weeks** | **All** | **Full team** |

### Defect Management

1. **Severity Levels**
   - **Critical**: System down, data loss, security breach
   - **High**: Major feature broken, performance degraded
   - **Medium**: Minor feature issues, UI problems
   - **Low**: Cosmetic issues, minor improvements

2. **Response Times**
   - Critical: Fix within 4 hours
   - High: Fix within 24 hours
   - Medium: Fix within 3 days
   - Low: Next release

### Sign-off Criteria

The system will be considered ready for production when:

1. All critical and high priority test cases pass
2. No critical or high severity defects remain open
3. Performance meets specified SLAs
4. Security scan shows no vulnerabilities
5. Customer representative approves UAT results
6. Documentation is complete and accurate

### Post-Testing Activities

1. **Test Report Generation**
   - Executive summary
   - Detailed test results
   - Defect analysis
   - Performance metrics
   - Recommendations

2. **Knowledge Transfer**
   - Test case handover to maintenance team
   - Known issues documentation
   - Monitoring setup guide

3. **Continuous Testing**
   - Automated regression suite
   - Performance monitoring
   - Security scanning schedule
   - Monthly disaster recovery drills