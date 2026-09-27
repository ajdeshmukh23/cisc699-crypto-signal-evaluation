# Detailed Design Document - Crypto Trading Dashboard

## 1. Frontend Module Detailed Design

### 1.1 Component Architecture

#### 1.1.1 App Component (Main Dashboard)
```typescript
interface AppState {
  selectedToken: 'BTC' | 'ETH' | 'SOL' | 'ADA';
  selectedTimeframe: '1D' | '1W' | '1M' | '3M' | 'YTD' | '1Y';
  viewMode: 'line' | 'candlestick';
  marketData: MarketData[];
  currentPrices: CurrentPrices;
  isLoading: boolean;
  error: string | null;
}

class App extends React.Component<{}, AppState> {
  private updateInterval: NodeJS.Timeout;
  private binanceService: BinanceService;
  
  componentDidMount() {
    this.initializeServices();
    this.loadInitialData();
    this.startRealTimeUpdates();
  }
  
  private async loadInitialData() {
    // Fetch historical data from API
    // Update component state
    // Handle errors
  }
  
  private startRealTimeUpdates() {
    // Poll current prices every 5 seconds
    // Update UI with new data
  }
}
```

#### 1.1.2 InteractiveCandlestickChart Component
```typescript
interface ChartProps {
  data: CandlestickData[];
  width: number;
  height: number;
  onZoom: (domain: [Date, Date]) => void;
}

interface ChartState {
  zoomDomain: [Date, Date] | null;
  hoveredCandle: CandlestickData | null;
  scrollPosition: number;
}

class InteractiveCandlestickChart {
  private svg: SVGElement;
  private xScale: ScaleTime;
  private yScale: ScaleLinear;
  private volumeScale: ScaleLinear;
  
  private setupScales() {
    // Initialize D3 scales for x-axis (time)
    // Initialize D3 scales for y-axis (price)
    // Initialize volume scale
  }
  
  private renderCandlesticks() {
    // Draw candlestick bodies
    // Draw wicks
    // Apply color based on open/close
  }
  
  private handleZoom(event: WheelEvent) {
    // Calculate new zoom level
    // Update scale domains
    // Re-render chart
  }
  
  private renderTooltip(candle: CandlestickData) {
    // Show OHLCV data on hover
    // Position tooltip near cursor
  }
}
```

#### 1.1.3 TradingIndicators Component
```typescript
interface IndicatorProps {
  marketData: MarketData[];
  selectedIndicators: string[];
}

class TradingIndicators {
  // Technical Indicator Calculations
  
  calculateRSI(data: MarketData[], period: number = 14): number {
    // Calculate average gains and losses
    // Apply RSI formula: 100 - (100 / (1 + RS))
    // Return RSI value
  }
  
  calculateMACD(data: MarketData[]): MACDResult {
    // Calculate 12-period EMA
    // Calculate 26-period EMA
    // Calculate MACD line (12 EMA - 26 EMA)
    // Calculate signal line (9 EMA of MACD)
    // Return MACD data
  }
  
  calculateBollingerBands(data: MarketData[], period: number = 20): BollingerBands {
    // Calculate Simple Moving Average
    // Calculate Standard Deviation
    // Upper Band = SMA + (2 * SD)
    // Lower Band = SMA - (2 * SD)
  }
  
  generateTradingSignals(): TradingSignal {
    // Aggregate all indicator signals
    // Apply weighted scoring
    // Return BUY/SELL/NEUTRAL signal
  }
}
```

### 1.2 Service Layer Design

#### 1.2.1 API Service
```typescript
class ApiService {
  private baseURL: string = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  
  async fetchCandlesticks(token: string, timeframe: string): Promise<MarketData[]> {
    // Construct API endpoint
    // Add error handling
    // Transform response data
    // Return typed market data
  }
  
  async fetchCurrentPrices(): Promise<CurrentPrices> {
    // Fetch all token prices
    // Handle network errors
    // Return price map
  }
  
  private handleApiError(error: Error): void {
    // Log error details
    // Show user-friendly message
    // Trigger fallback behavior
  }
}
```

#### 1.2.2 Binance WebSocket Service
```typescript
class BinanceService {
  private ws: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  
  connect(): void {
    const streams = ['btcusdt@trade', 'ethusdt@trade', 'solusdt@trade', 'adausdt@trade'];
    this.ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams.join('/')}`);
    
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onerror = this.handleError.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
  }
  
  private handleMessage(event: MessageEvent): void {
    const data = JSON.parse(event.data);
    // Parse trade data
    // Update price cache
    // Notify subscribers
  }
  
  private reconnect(): void {
    // Implement exponential backoff
    // Retry connection
    // Reset on success
  }
}
```

#### 1.2.3 IndexedDB Service
```typescript
interface DBSchema {
  marketData: {
    key: string; // token_timeframe
    value: MarketData[];
    indexes: { 'by-timestamp': number };
  };
  currentPrices: {
    key: string; // token
    value: PriceData;
  };
}

class DatabaseService {
  private db: IDBPDatabase<DBSchema>;
  
  async initialize(): Promise<void> {
    this.db = await openDB<DBSchema>('CryptoDashboard', 1, {
      upgrade(db) {
        // Create object stores
        // Add indexes
      }
    });
  }
  
  async cacheMarketData(token: string, timeframe: string, data: MarketData[]): Promise<void> {
    // Store data with composite key
    // Set expiration timestamp
    // Handle storage quota
  }
  
  async getCachedData(token: string, timeframe: string): Promise<MarketData[] | null> {
    // Check cache validity
    // Return data or null
    // Clean expired entries
  }
}
```

### 1.3 Data Models

```typescript
// Market Data Types
interface MarketData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickData extends MarketData {
  token: string;
  timeframe: string;
}

interface CurrentPrices {
  [token: string]: {
    price: number;
    change24h: number;
    lastUpdate: number;
  };
}

// Technical Indicator Types
interface RSIData {
  value: number;
  overbought: boolean;
  oversold: boolean;
}

interface MACDResult {
  macdLine: number;
  signalLine: number;
  histogram: number;
  crossover: 'bullish' | 'bearish' | null;
}

interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
  squeeze: boolean;
}

type TradingSignal = 'BUY' | 'SELL' | 'NEUTRAL';
```

## 2. Backend Module Detailed Design

### 2.1 Server Architecture

#### 2.1.1 Express Server Setup
```javascript
// index.js
class CryptoAPIServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 5001;
    this.setupMiddleware();
    this.setupRoutes();
    this.initializeServices();
  }
  
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(compression());
    this.app.use(helmet());
  }
  
  setupRoutes() {
    this.app.use('/api/candlesticks', candlestickRoutes);
    this.app.use('/api/prices', priceRoutes);
    this.app.use('/api/health', healthRoutes);
  }
  
  async initializeServices() {
    await DatabasePool.initialize();
    await DataManager.start();
    WebSocketManager.initialize();
    ScheduledTasks.start();
  }
}
```

#### 2.1.2 Route Handlers
```javascript
// routes/candlesticks.js
class CandlestickRoutes {
  static async getCandlesticks(req, res) {
    const { token, timeframe } = req.params;
    const { start, end } = req.query;
    
    try {
      // Validate parameters
      this.validateRequest(token, timeframe);
      
      // Fetch from database
      const data = await DataManager.getCandlesticks(token, timeframe, start, end);
      
      // Check for gaps
      const gaps = DataManager.detectGaps(data, timeframe);
      
      if (gaps.length > 0) {
        // Fill gaps asynchronously
        DataManager.fillGapsAsync(token, timeframe, gaps);
      }
      
      // Return available data
      res.json({
        success: true,
        data: data,
        gaps: gaps.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
```

### 2.2 Service Layer

#### 2.2.1 Data Manager Service
```javascript
class DataManager {
  constructor() {
    this.db = null;
    this.fillQueue = new Queue();
    this.isProcessing = false;
  }
  
  async getCandlesticks(token, timeframe, startTime, endTime) {
    const query = `
      SELECT open_time, open, high, low, close, volume
      FROM candlesticks
      WHERE token = $1 AND timeframe = $2
        AND open_time >= $3 AND open_time <= $4
      ORDER BY open_time ASC
    `;
    
    const result = await this.db.query(query, [token, timeframe, startTime, endTime]);
    return result.rows;
  }
  
  detectGaps(data, timeframe) {
    const gaps = [];
    const interval = this.getIntervalMs(timeframe);
    
    for (let i = 1; i < data.length; i++) {
      const expectedTime = data[i-1].open_time + interval;
      const actualTime = data[i].open_time;
      
      if (actualTime > expectedTime) {
        gaps.push({
          start: expectedTime,
          end: actualTime - interval,
          missing: Math.floor((actualTime - expectedTime) / interval)
        });
      }
    }
    
    return gaps;
  }
  
  async fillGaps(token, timeframe, gaps) {
    for (const gap of gaps) {
      const missingData = await BinanceAPI.fetchHistoricalData(
        token,
        timeframe,
        gap.start,
        gap.end
      );
      
      await this.insertCandlesticks(missingData);
    }
  }
}
```

#### 2.2.2 Binance API Service
```javascript
class BinanceAPI {
  static BASE_URL = 'https://api.binance.com/api/v3';
  static MAX_LIMIT = 1000;
  
  static async fetchHistoricalData(token, interval, startTime, endTime) {
    const symbol = `${token}USDT`;
    const params = new URLSearchParams({
      symbol: symbol,
      interval: this.mapTimeframe(interval),
      startTime: startTime,
      endTime: endTime,
      limit: this.MAX_LIMIT
    });
    
    try {
      const response = await axios.get(`${this.BASE_URL}/klines?${params}`);
      return this.transformKlineData(response.data, token, interval);
    } catch (error) {
      if (error.response?.status === 429) {
        // Rate limit handling
        await this.handleRateLimit(error.response.headers);
        return this.fetchHistoricalData(token, interval, startTime, endTime);
      }
      throw error;
    }
  }
  
  static transformKlineData(klines, token, timeframe) {
    return klines.map(kline => ({
      token: token,
      timeframe: timeframe,
      open_time: kline[0],
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
      close_time: kline[6]
    }));
  }
}
```

#### 2.2.3 WebSocket Manager
```javascript
class WebSocketManager {
  constructor() {
    this.ws = null;
    this.subscribers = new Map();
    this.reconnectInterval = 5000;
  }
  
  connect() {
    const streams = this.buildStreamList();
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.on('message', (data) => {
      const message = JSON.parse(data);
      this.processMessage(message);
    });
    
    this.ws.on('close', () => {
      setTimeout(() => this.connect(), this.reconnectInterval);
    });
  }
  
  processMessage(message) {
    const { stream, data } = message;
    
    if (stream.includes('@trade')) {
      const token = stream.split('@')[0].replace('usdt', '').toUpperCase();
      const price = parseFloat(data.p);
      
      // Update database
      this.updateCurrentPrice(token, price);
      
      // Notify subscribers
      this.notifySubscribers(token, price);
    }
  }
  
  async updateCurrentPrice(token, price) {
    const query = `
      INSERT INTO current_prices (token, price, last_update)
      VALUES ($1, $2, NOW())
      ON CONFLICT (token) DO UPDATE
      SET price = $2, last_update = NOW()
    `;
    
    await db.query(query, [token, price]);
  }
}
```

### 2.3 Scheduled Tasks

```javascript
class ScheduledTasks {
  static initialize() {
    // Hourly gap filling
    cron.schedule('0 * * * *', async () => {
      console.log('Running hourly gap check...');
      await this.runGapFilling();
    });
    
    // 5-minute price change calculation
    cron.schedule('*/5 * * * *', async () => {
      console.log('Updating 24h price changes...');
      await this.update24hChanges();
    });
    
    // Daily cleanup (3 AM)
    cron.schedule('0 3 * * *', async () => {
      console.log('Running daily cleanup...');
      await this.cleanupOldData();
    });
  }
  
  static async runGapFilling() {
    const tokens = ['BTC', 'ETH', 'SOL', 'ADA'];
    const timeframes = ['5m', '1h', '4h', '1d'];
    
    for (const token of tokens) {
      for (const timeframe of timeframes) {
        const gaps = await DataManager.checkForGaps(token, timeframe);
        if (gaps.length > 0) {
          await DataManager.fillGaps(token, timeframe, gaps);
        }
      }
    }
  }
  
  static async cleanupOldData() {
    // Keep only 30 days of 5m data
    const query = `
      DELETE FROM candlesticks
      WHERE timeframe = '5m'
        AND open_time < NOW() - INTERVAL '30 days'
    `;
    
    await db.query(query);
  }
}
```

## 3. Database Design

### 3.1 Schema Definition

```sql
-- Candlesticks table
CREATE TABLE candlesticks (
    id SERIAL PRIMARY KEY,
    token VARCHAR(10) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    open_time BIGINT NOT NULL,
    open DECIMAL(20, 8) NOT NULL,
    high DECIMAL(20, 8) NOT NULL,
    low DECIMAL(20, 8) NOT NULL,
    close DECIMAL(20, 8) NOT NULL,
    volume DECIMAL(20, 8) NOT NULL,
    close_time BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(token, timeframe, open_time)
);

-- Indexes for performance
CREATE INDEX idx_candlesticks_token_timeframe_time 
ON candlesticks(token, timeframe, open_time);

CREATE INDEX idx_candlesticks_time 
ON candlesticks(open_time);

-- Current prices table
CREATE TABLE current_prices (
    token VARCHAR(10) PRIMARY KEY,
    price DECIMAL(20, 8) NOT NULL,
    change_24h DECIMAL(10, 2),
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Price history for 24h calculations
CREATE TABLE price_history_24h (
    id SERIAL PRIMARY KEY,
    token VARCHAR(10) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_price_history_token_time (token, timestamp)
);
```

### 3.2 Database Access Layer

```javascript
class DatabasePool {
  static pool = null;
  
  static async initialize() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });
    
    // Test connection
    await this.pool.query('SELECT NOW()');
  }
  
  static async query(text, params) {
    const start = Date.now();
    const res = await this.pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries
    if (duration > 1000) {
      console.log('Slow query:', { text, duration, rows: res.rowCount });
    }
    
    return res;
  }
  
  static async getClient() {
    const client = await this.pool.connect();
    const query = client.query.bind(client);
    const release = client.release.bind(client);
    
    // Set timeout for client
    const timeout = setTimeout(() => {
      console.error('Client checkout timeout');
      release();
    }, 5000);
    
    client.query = (...args) => {
      clearTimeout(timeout);
      return query(...args);
    };
    
    client.release = () => {
      clearTimeout(timeout);
      return release();
    };
    
    return client;
  }
}
```

## 4. Error Handling and Logging

### 4.1 Error Handling Strategy

```javascript
class ErrorHandler {
  static handle(error, req, res, next) {
    // Log error details
    console.error({
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      error: {
        message: error.message,
        stack: error.stack
      }
    });
    
    // Determine error type and response
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        details: error.details
      });
    }
    
    if (error.name === 'BinanceAPIError') {
      return res.status(503).json({
        success: false,
        error: 'External service temporarily unavailable',
        retry_after: error.retryAfter
      });
    }
    
    // Default error response
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
```

### 4.2 Logging System

```javascript
class Logger {
  static levels = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  };
  
  static log(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...metadata
    };
    
    console.log(JSON.stringify(logEntry));
    
    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      // Send to CloudWatch, Datadog, etc.
    }
  }
}
```

## 5. Performance Optimization

### 5.1 Frontend Optimizations

```javascript
// Memoization for expensive calculations
const memoizedCalculateRSI = useMemo(() => {
  return calculateRSI(marketData, 14);
}, [marketData]);

// Virtualization for large datasets
const VirtualizedChart = ({ data }) => {
  const rowRenderer = ({ index, key, style }) => {
    const item = data[index];
    return (
      <div key={key} style={style}>
        <CandleStick data={item} />
      </div>
    );
  };
  
  return (
    <AutoSizer>
      {({ height, width }) => (
        <VirtualList
          height={height}
          width={width}
          rowCount={data.length}
          rowHeight={20}
          rowRenderer={rowRenderer}
        />
      )}
    </AutoSizer>
  );
};
```

### 5.2 Backend Optimizations

```javascript
// Data aggregation for longer timeframes
class DataAggregator {
  static aggregate(data, fromInterval, toInterval) {
    const aggregated = [];
    const groupSize = this.getGroupSize(fromInterval, toInterval);
    
    for (let i = 0; i < data.length; i += groupSize) {
      const group = data.slice(i, i + groupSize);
      
      aggregated.push({
        open_time: group[0].open_time,
        open: group[0].open,
        high: Math.max(...group.map(d => d.high)),
        low: Math.min(...group.map(d => d.low)),
        close: group[group.length - 1].close,
        volume: group.reduce((sum, d) => sum + d.volume, 0)
      });
    }
    
    return aggregated;
  }
}

// Query optimization with prepared statements
class PreparedQueries {
  static statements = new Map();
  
  static async prepare(name, text) {
    if (!this.statements.has(name)) {
      this.statements.set(name, {
        name,
        text,
        values: []
      });
    }
    return this.statements.get(name);
  }
  
  static async execute(name, values) {
    const statement = this.statements.get(name);
    return db.query({
      name: statement.name,
      text: statement.text,
      values: values
    });
  }
}
```

## 6. Testing Strategy

### 6.1 Unit Test Examples

```javascript
// Frontend component test
describe('TradingIndicators', () => {
  it('should calculate RSI correctly', () => {
    const mockData = generateMockMarketData(20);
    const component = shallow(<TradingIndicators data={mockData} />);
    
    const rsi = component.instance().calculateRSI(mockData);
    expect(rsi).toBeGreaterThanOrEqual(0);
    expect(rsi).toBeLessThanOrEqual(100);
  });
  
  it('should generate correct trading signals', () => {
    const bullishData = generateBullishData();
    const component = shallow(<TradingIndicators data={bullishData} />);
    
    const signal = component.instance().generateTradingSignals();
    expect(signal).toBe('BUY');
  });
});

// Backend service test
describe('DataManager', () => {
  it('should detect gaps correctly', () => {
    const data = [
      { open_time: 1000000 },
      { open_time: 1060000 }, // 1 minute later
      { open_time: 1180000 }  // Gap here - should be 1120000
    ];
    
    const gaps = DataManager.detectGaps(data, '1m');
    expect(gaps).toHaveLength(1);
    expect(gaps[0].missing).toBe(1);
  });
});
```

### 6.2 Integration Test Examples

```javascript
describe('API Integration', () => {
  it('should fetch and cache candlestick data', async () => {
    const response = await request(app)
      .get('/api/candlesticks/BTC/1h')
      .query({ start: Date.now() - 86400000, end: Date.now() });
    
    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data[0]).toHaveProperty('open');
    expect(response.body.data[0]).toHaveProperty('close');
  });
});
```