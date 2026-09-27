# High-Level Design Document - Crypto Trading Dashboard

## 1. Executive Summary

The Crypto Trading Dashboard is a full-stack web application that provides real-time cryptocurrency market data visualization and technical analysis tools. The system integrates with Binance exchange APIs to display price charts, candlestick patterns, and trading indicators for multiple cryptocurrencies.

## 2. System Architecture Overview

### 2.1 Architecture Pattern
The system follows a **3-tier architecture** pattern:
- **Presentation Layer**: React-based SPA (Single Page Application)
- **Application Layer**: Node.js/Express REST API server
- **Data Layer**: PostgreSQL database with real-time data feeds

### 2.2 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Client Layer                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐    ┌──────────────────┐   ┌───────────────┐ │
│  │   React Web App │    │  Chart Components │   │   Technical   │ │
│  │   (TypeScript)  │    │   (D3.js/SVG)    │   │  Indicators   │ │
│  └────────┬────────┘    └─────────┬────────┘   └───────┬───────┘ │
│           │                       │                     │         │
│           └───────────────────────┴─────────────────────┘         │
│                                  │                                 │
└──────────────────────────────────┼─────────────────────────────────┘
                                   │ HTTP/WebSocket
┌──────────────────────────────────┼─────────────────────────────────┐
│                           Application Layer                          │
├──────────────────────────────────┼─────────────────────────────────┤
│                                  │                                  │
│  ┌─────────────────┐    ┌───────┴────────┐    ┌────────────────┐ │
│  │   Express.js    │    │  REST API      │    │   WebSocket    │ │
│  │   Web Server    │────│  Endpoints     │    │   Manager      │ │
│  └─────────────────┘    └────────────────┘    └───────┬────────┘ │
│                                                        │          │
│  ┌─────────────────┐    ┌────────────────┐    ┌──────┴────────┐ │
│  │  Data Manager   │    │  Binance API   │    │  Real-time    │ │
│  │   Service       │────│   Service      │────│  Data Feed    │ │
│  └────────┬────────┘    └────────────────┘    └───────────────┘ │
│           │                                                       │
└───────────┼───────────────────────────────────────────────────────┘
            │ Database Connection
┌───────────┼───────────────────────────────────────────────────────┐
│           │                  Data Layer                            │
├───────────┴───────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐    ┌────────────────┐    ┌───────────────┐ │
│  │   PostgreSQL    │    │  Candlesticks  │    │   Current     │ │
│  │    Database     │────│     Table      │────│  Prices Table │ │
│  └─────────────────┘    └────────────────┘    └───────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    IndexedDB (Client Cache)                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
                                   │
                                   │ External APIs
┌───────────────────────────────────┼───────────────────────────────┐
│                                   │                                │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │               Binance Exchange API                           │ │
│  │  • REST API (Historical Data)                               │ │
│  │  • WebSocket Streams (Real-time Price Updates)              │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

## 3. Major System Components

### 3.1 Frontend Module (Presentation Layer)

**Purpose**: Provide interactive user interface for cryptocurrency data visualization and analysis.

**Key Components**:
- **Dashboard Component**: Main container managing application state and data flow
- **Chart Visualization Module**: Renders price charts and candlestick patterns
- **Technical Indicators Module**: Calculates and displays trading indicators
- **Real-time Update Manager**: Handles WebSocket connections and live data updates
- **Offline Cache Manager**: Manages IndexedDB for client-side data persistence

**Interactions**:
- Communicates with backend via REST API for historical data
- Establishes WebSocket connection for real-time price updates
- Stores frequently accessed data in IndexedDB for offline capability

### 3.2 Backend API Module (Application Layer)

**Purpose**: Serve as middleware between frontend and external data sources, manage business logic and data persistence.

**Key Components**:
- **API Gateway**: Express.js server handling HTTP requests
- **Data Manager Service**: Orchestrates data flow, gap detection, and filling
- **Binance Integration Service**: Interfaces with Binance exchange APIs
- **WebSocket Manager**: Maintains persistent connections for real-time data
- **Scheduled Tasks Manager**: Runs periodic data maintenance jobs

**Interactions**:
- Processes frontend API requests
- Fetches data from Binance APIs
- Persists data to PostgreSQL database
- Broadcasts real-time updates via WebSocket

### 3.3 Database Module (Data Layer)

**Purpose**: Persist historical market data and current price information.

**Key Components**:
- **Candlesticks Storage**: Stores OHLCV (Open, High, Low, Close, Volume) data
- **Current Prices Cache**: Maintains latest price and 24h statistics
- **Data Indexing**: Optimized indices for time-series queries

**Interactions**:
- Receives data from backend services
- Provides historical data for chart rendering
- Supports efficient time-range queries

### 3.4 External Integration Module

**Purpose**: Interface with third-party cryptocurrency exchange APIs.

**Key Components**:
- **Binance REST Client**: Fetches historical market data
- **Binance WebSocket Client**: Receives real-time price streams
- **Rate Limiter**: Manages API request throttling
- **Error Handler**: Manages connection failures and retries

## 4. Data Flow

### 4.1 Real-time Data Flow
1. Binance WebSocket streams emit price updates
2. Backend WebSocket manager receives and processes updates
3. Current prices are updated in database
4. Frontend receives updates via WebSocket broadcast
5. UI components re-render with new data

### 4.2 Historical Data Flow
1. Frontend requests historical data for specific timeframe
2. Backend checks database for existing data
3. If gaps exist, backend fetches from Binance API
4. Data is stored in database and returned to frontend
5. Frontend caches data in IndexedDB

## 5. Key Design Decisions

### 5.1 Technology Stack Selection
- **React + TypeScript**: Type-safe frontend development with component reusability
- **Node.js + Express**: JavaScript ecosystem consistency and async I/O performance
- **PostgreSQL**: Reliable time-series data storage with ACID compliance
- **Docker**: Consistent development and deployment environments

### 5.2 Architectural Patterns
- **RESTful API Design**: Standard HTTP methods for CRUD operations
- **WebSocket for Real-time**: Bi-directional communication for live updates
- **Microservice-ready**: Modular design allows future service separation
- **Client-side Caching**: Reduced server load and offline capability

### 5.3 Scalability Considerations
- **Horizontal Scaling**: Stateless backend design supports multiple instances
- **Database Optimization**: Indexed time-series queries and data partitioning ready
- **Caching Strategy**: Multi-level caching (client and server-side)
- **Load Distribution**: WebSocket connections can be distributed across servers

## 6. Security Architecture

### 6.1 API Security
- CORS configuration for cross-origin requests
- Environment-based configuration for sensitive data
- Read-only access to external APIs (no trading capabilities)

### 6.2 Data Protection
- No user authentication required (public data only)
- PostgreSQL connection pooling and access control
- Docker network isolation between services

## 7. Performance Architecture

### 7.1 Frontend Optimization
- Component memoization for expensive calculations
- Virtual scrolling for large datasets
- Lazy loading of chart components
- IndexedDB for offline data access

### 7.2 Backend Optimization
- Connection pooling for database queries
- Efficient batch processing for gap filling
- Scheduled cleanup of old granular data
- Aggregate data for longer timeframes

## 8. System Interfaces

### 8.1 User Interface
- Responsive web design for desktop and mobile
- Interactive charts with zoom/pan capabilities
- Real-time price updates with visual indicators
- Technical analysis tools with configurable parameters

### 8.2 API Interface
- RESTful endpoints following OpenAPI standards
- WebSocket protocol for real-time data streams
- JSON data format for all communications
- Standardized error response format

### 8.3 External Interfaces
- Binance REST API v3 for historical data
- Binance WebSocket Streams for live prices
- Future support for additional exchanges

## 9. Deployment Architecture

### 9.1 Container Architecture
```
┌─────────────────────────────────────────┐
│         Docker Compose Network          │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────┐  ┌──────────┐  ┌──────┐ │
│  │PostgreSQL │  │ Backend  │  │React │ │
│  │Container  │  │Container │  │ App  │ │
│  │  (5432)   │  │  (5001)  │  │(3000)│ │
│  └───────────┘  └──────────┘  └──────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### 9.2 Production Deployment
- Docker Compose for orchestration
- Health checks for service availability
- Volume mounting for data persistence
- Environment-based configuration

## 10. Future Extensibility

### 10.1 Planned Enhancements
- User authentication and personalized dashboards
- Portfolio tracking and P&L calculations
- Automated trading strategy backtesting
- Multi-exchange support
- Advanced alerting system

### 10.2 Architecture Flexibility
- Modular component design for easy feature addition
- API versioning support
- Database migration framework
- Microservice extraction capability