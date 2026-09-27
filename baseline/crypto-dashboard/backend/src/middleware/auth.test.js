const jwt = require('jsonwebtoken');
const { authenticateToken, JWT_SECRET } = require('./auth');

// Mock jwt
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  it('calls next() with valid token', () => {
    mockReq.headers['authorization'] = 'Bearer valid-token';

    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, { id: 1, username: 'testuser' });
    });

    authenticateToken(mockReq, mockRes, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockReq.user).toEqual({ id: 1, username: 'testuser' });
  });

  it('returns 401 when no authorization header', () => {
    authenticateToken(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Access token required'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('returns 401 when authorization header has no token', () => {
    mockReq.headers['authorization'] = 'Bearer ';

    authenticateToken(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('returns 403 for invalid token', () => {
    mockReq.headers['authorization'] = 'Bearer invalid-token';

    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(new Error('Invalid token'), null);
    });

    authenticateToken(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid or expired token'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('returns 403 for expired token', () => {
    mockReq.headers['authorization'] = 'Bearer expired-token';

    jwt.verify.mockImplementation((token, secret, callback) => {
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      callback(error, null);
    });

    authenticateToken(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('extracts token correctly from Bearer format', () => {
    mockReq.headers['authorization'] = 'Bearer my-test-token';

    jwt.verify.mockImplementation((token, secret, callback) => {
      expect(token).toBe('my-test-token');
      callback(null, { id: 1, username: 'testuser' });
    });

    authenticateToken(mockReq, mockRes, nextFunction);

    expect(jwt.verify).toHaveBeenCalledWith(
      'my-test-token',
      expect.any(String),
      expect.any(Function)
    );
  });

  it('uses correct JWT_SECRET', () => {
    mockReq.headers['authorization'] = 'Bearer test-token';

    jwt.verify.mockImplementation((token, secret, callback) => {
      expect(secret).toBe(JWT_SECRET);
      callback(null, { id: 1, username: 'testuser' });
    });

    authenticateToken(mockReq, mockRes, nextFunction);

    expect(jwt.verify).toHaveBeenCalled();
  });

  it('exports JWT_SECRET', () => {
    expect(JWT_SECRET).toBeDefined();
    expect(typeof JWT_SECRET).toBe('string');
  });

  it('handles malformed authorization header', () => {
    mockReq.headers['authorization'] = 'InvalidFormat';

    authenticateToken(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('handles authorization header with only Bearer', () => {
    mockReq.headers['authorization'] = 'Bearer';

    authenticateToken(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
