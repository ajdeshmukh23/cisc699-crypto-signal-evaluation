const express = require('express');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRouter = require('./auth');

// Mock bcrypt and jwt
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Routes', () => {
  let app;
  let mockPool;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    mockPool = {
      query: jest.fn()
    };
    app.use('/api/auth', authRouter(mockPool));
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    it('registers a new user successfully', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // Check existing user
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            username: 'testuser',
            created_at: new Date().toISOString()
          }]
        }); // Insert user

      bcrypt.hash.mockResolvedValue('hashedpassword123');
      jwt.sign.mockReturnValue('mock-jwt-token');

      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'password123' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.token).toBe('mock-jwt-token');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('returns error when username already exists', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 1 }] // User exists
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'existinguser', password: 'password123' })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Username already exists');
    });

    it('returns error when username is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ password: 'password123' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Username and password are required');
    });

    it('returns error when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Username and password are required');
    });

    it('returns error when username is too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'ab', password: 'password123' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Username must be at least 3 characters');
    });

    it('returns error when password is too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: '12345' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Password must be at least 6 characters');
    });

    it('handles database errors during registration', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'password123' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to register user');
    });

    it('handles bcrypt hash errors', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      bcrypt.hash.mockRejectedValue(new Error('Hash error'));

      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'password123' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /login', () => {
    it('logs in user successfully', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          username: 'testuser',
          password_hash: 'hashedpassword',
          created_at: new Date().toISOString()
        }]
      });

      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-jwt-token');

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.token).toBe('mock-jwt-token');
    });

    it('returns error for non-existent user', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: 'password123' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid username or password');
    });

    it('returns error for wrong password', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          username: 'testuser',
          password_hash: 'hashedpassword',
          created_at: new Date().toISOString()
        }]
      });

      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'wrongpassword' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid username or password');
    });

    it('returns error when username is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Username and password are required');
    });

    it('returns error when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Username and password are required');
    });

    it('handles database errors during login', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to login');
    });

    it('handles bcrypt compare errors', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          username: 'testuser',
          password_hash: 'hashedpassword',
          created_at: new Date().toISOString()
        }]
      });

      bcrypt.compare.mockRejectedValue(new Error('Compare error'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /me', () => {
    it('returns current user info with valid token', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          username: 'testuser',
          created_at: new Date().toISOString()
        }]
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('testuser');
    });

    it('returns error without authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    it('returns error with invalid token', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('Invalid token'), null);
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or expired token');
    });

    it('returns error when user not found', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 999, username: 'deleteduser' });
      });

      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });

    it('handles database errors when fetching user', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, username: 'testuser' });
      });

      mockPool.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch user');
    });

    it('handles malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
