const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const portfolioRouter = require('./portfolio');

// Mock jwt
jest.mock('jsonwebtoken');

describe('Portfolio Routes', () => {
  let app;
  let mockPool;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    mockPool = {
      query: jest.fn()
    };
    app.use('/api/portfolio', portfolioRouter(mockPool));

    // Default: valid JWT token
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, { id: 1, username: 'testuser' });
    });

    jest.clearAllMocks();
  });

  const authHeader = { Authorization: 'Bearer valid-token' };

  describe('GET /', () => {
    it('returns portfolio holdings with current values', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            token: 'BTC',
            quantity: '0.5',
            buy_price: '40000',
            created_at: new Date().toISOString(),
            current_price: '45000',
            change_24h: '2.5'
          },
          {
            id: 2,
            token: 'ETH',
            quantity: '2',
            buy_price: '2000',
            created_at: new Date().toISOString(),
            current_price: '2500',
            change_24h: '3.0'
          }
        ]
      });

      const response = await request(app)
        .get('/api/portfolio')
        .set(authHeader)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.holdings).toHaveLength(2);
      expect(response.body.data.holdings[0].token).toBe('BTC');
      expect(response.body.data.holdings[0].quantity).toBe(0.5);
      expect(response.body.data.holdings[0].currentValue).toBe(22500); // 0.5 * 45000
      expect(response.body.data.holdings[0].profitLoss).toBe(2500); // 22500 - 20000
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary.totalValue).toBeDefined();
    });

    it('returns empty portfolio for new user', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/portfolio')
        .set(authHeader)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.holdings).toHaveLength(0);
      expect(response.body.data.summary.totalValue).toBe(0);
    });

    it('requires authentication', async () => {
      const response = await request(app)
        .get('/api/portfolio')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('handles database errors', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      mockPool.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/portfolio')
        .set(authHeader)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch portfolio');
    });

    it('handles null current price', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          token: 'BTC',
          quantity: '0.5',
          buy_price: '40000',
          created_at: new Date().toISOString(),
          current_price: null,
          change_24h: null
        }]
      });

      const response = await request(app)
        .get('/api/portfolio')
        .set(authHeader)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.holdings[0].currentPrice).toBe(0);
    });
  });

  describe('POST /', () => {
    it('adds a new holding successfully', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          token: 'BTC',
          quantity: '0.5',
          buy_price: '40000',
          created_at: new Date().toISOString()
        }]
      });

      const response = await request(app)
        .post('/api/portfolio')
        .set(authHeader)
        .send({ token: 'BTC', quantity: 0.5, buyPrice: 40000 })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBe('BTC');
      expect(response.body.data.quantity).toBe(0.5);
    });

    it('converts token to uppercase', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          token: 'BTC',
          quantity: '0.5',
          buy_price: '40000',
          created_at: new Date().toISOString()
        }]
      });

      await request(app)
        .post('/api/portfolio')
        .set(authHeader)
        .send({ token: 'btc', quantity: 0.5, buyPrice: 40000 })
        .expect(201);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([1, 'BTC', 0.5, 40000])
      );
    });

    it('returns error for invalid token', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      const response = await request(app)
        .post('/api/portfolio')
        .set(authHeader)
        .send({ token: 'INVALID', quantity: 0.5, buyPrice: 40000 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid token');
    });

    it('returns error when token is missing', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      const response = await request(app)
        .post('/api/portfolio')
        .set(authHeader)
        .send({ quantity: 0.5, buyPrice: 40000 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Token, quantity, and buy price are required');
    });

    it('returns error when quantity is missing', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      const response = await request(app)
        .post('/api/portfolio')
        .set(authHeader)
        .send({ token: 'BTC', buyPrice: 40000 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('returns error when buyPrice is missing', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      const response = await request(app)
        .post('/api/portfolio')
        .set(authHeader)
        .send({ token: 'BTC', quantity: 0.5 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('returns error for negative quantity', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      const response = await request(app)
        .post('/api/portfolio')
        .set(authHeader)
        .send({ token: 'BTC', quantity: -0.5, buyPrice: 40000 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Quantity and buy price must be positive numbers');
    });

    it('returns error for negative buyPrice', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      const response = await request(app)
        .post('/api/portfolio')
        .set(authHeader)
        .send({ token: 'BTC', quantity: 0.5, buyPrice: -40000 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('returns error for zero quantity', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      const response = await request(app)
        .post('/api/portfolio')
        .set(authHeader)
        .send({ token: 'BTC', quantity: 0, buyPrice: 40000 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('handles database errors', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      mockPool.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/portfolio')
        .set(authHeader)
        .send({ token: 'BTC', quantity: 0.5, buyPrice: 40000 })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to add holding');
    });

    it('requires authentication', async () => {
      const response = await request(app)
        .post('/api/portfolio')
        .send({ token: 'BTC', quantity: 0.5, buyPrice: 40000 })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /:token', () => {
    it('updates a holding successfully', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          token: 'BTC',
          quantity: '1.0',
          buy_price: '45000',
          created_at: new Date().toISOString()
        }]
      });

      const response = await request(app)
        .put('/api/portfolio/BTC')
        .set(authHeader)
        .send({ quantity: 1.0, buyPrice: 45000 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(1.0);
      expect(response.body.data.buyPrice).toBe(45000);
    });

    it('returns error when holding not found', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put('/api/portfolio/XRP')
        .set(authHeader)
        .send({ quantity: 1.0, buyPrice: 45000 })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Holding not found');
    });

    it('returns error when quantity is missing', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      const response = await request(app)
        .put('/api/portfolio/BTC')
        .set(authHeader)
        .send({ buyPrice: 45000 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Quantity and buy price are required');
    });

    it('returns error when buyPrice is missing', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      const response = await request(app)
        .put('/api/portfolio/BTC')
        .set(authHeader)
        .send({ quantity: 1.0 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('returns error for negative values', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      const response = await request(app)
        .put('/api/portfolio/BTC')
        .set(authHeader)
        .send({ quantity: -1.0, buyPrice: 45000 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('handles database errors', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      mockPool.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/portfolio/BTC')
        .set(authHeader)
        .send({ quantity: 1.0, buyPrice: 45000 })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to update holding');
    });

    it('converts token to uppercase', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          token: 'BTC',
          quantity: '1.0',
          buy_price: '45000',
          created_at: new Date().toISOString()
        }]
      });

      await request(app)
        .put('/api/portfolio/btc')
        .set(authHeader)
        .send({ quantity: 1.0, buyPrice: 45000 })
        .expect(200);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([1.0, 45000, 1, 'BTC'])
      );
    });
  });

  describe('DELETE /:token', () => {
    it('deletes a holding successfully', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 1 }]
      });

      const response = await request(app)
        .delete('/api/portfolio/BTC')
        .set(authHeader)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Holding deleted successfully');
    });

    it('returns error when holding not found', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .delete('/api/portfolio/XRP')
        .set(authHeader)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Holding not found');
    });

    it('handles database errors', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      mockPool.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/portfolio/BTC')
        .set(authHeader)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to delete holding');
    });

    it('converts token to uppercase', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 1 }]
      });

      await request(app)
        .delete('/api/portfolio/btc')
        .set(authHeader)
        .expect(200);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([1, 'BTC'])
      );
    });

    it('requires authentication', async () => {
      const response = await request(app)
        .delete('/api/portfolio/BTC')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
