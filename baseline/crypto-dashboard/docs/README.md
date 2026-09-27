# Documentation

Comprehensive documentation for the Crypto Trading Platform.

## 📁 Structure

### design/
System design documents for both the dashboard and trading bot:

#### Dashboard Design
- **HIGH_LEVEL_DESIGN.md**: System architecture, components, data flow
- **DETAILED_DESIGN.md**: Implementation details, code examples, schemas

#### Trading Bot Design  
- **TRADING_BOT_HIGH_LEVEL_DESIGN.md**: AI/ML architecture, microservices design
- **TRADING_BOT_DETAILED_DESIGN.md**: Complete implementation guide with code

### testing/
Test documentation and coverage reports:

#### Dashboard Tests
- **TEST_CASES.md**: 28 test cases covering all functionality
- **TEST_COVERAGE_REPORT.md**: 100% coverage analysis

#### Trading Bot Tests
- **TRADING_BOT_TEST_CASES.md**: 17 comprehensive test cases with templates

### videos/
Video presentation scripts:
- **VIDEO_SCRIPT.md**: Multi-person demonstration script
- **VIDEO_SCRIPT_SINGLE.md**: Single presenter script

## 📚 Key Documents

### System Architecture
Both systems follow modern architectural patterns:
- Microservices architecture
- Event-driven design
- GPU-accelerated ML
- Real-time data processing
- Horizontal scalability

### Technical Stack
- Frontend: React, TypeScript, D3.js
- Backend: Node.js, Express, Python
- Databases: PostgreSQL, InfluxDB
- ML/AI: XGBoost, FinBERT, TensorRT
- Infrastructure: Docker, Kubernetes

### Testing Strategy
- Unit tests with Jest
- Integration tests
- Performance testing
- Security testing
- Load testing with Locust

## 🎯 Getting Started

1. **Understand the Architecture**: Start with HIGH_LEVEL_DESIGN documents
2. **Deep Dive**: Read DETAILED_DESIGN for implementation
3. **Testing**: Review TEST_CASES for quality assurance
4. **Deployment**: Check deployment configurations

## 📖 Reading Order

For new developers:
1. HIGH_LEVEL_DESIGN.md
2. DETAILED_DESIGN.md  
3. TEST_CASES.md
4. Backend/Frontend READMEs

For system architects:
1. TRADING_BOT_HIGH_LEVEL_DESIGN.md
2. TRADING_BOT_DETAILED_DESIGN.md
3. Deployment configurations

## 🔍 Quick Links

- [Dashboard Architecture](design/HIGH_LEVEL_DESIGN.md)
- [Trading Bot Architecture](design/TRADING_BOT_HIGH_LEVEL_DESIGN.md)
- [API Documentation](design/DETAILED_DESIGN.md#api-endpoints)
- [Test Coverage](testing/TEST_COVERAGE_REPORT.md)

## 📝 Document Standards

All documents follow:
- Clear section headers
- Code examples where applicable
- Diagrams for architecture
- Requirement traceability
- Version control friendly

## 🚀 Future Documentation

Planned additions:
- API reference (OpenAPI/Swagger)
- User guides
- Deployment guides
- Performance tuning guide
- Security best practices