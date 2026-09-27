const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

module.exports = (pool) => {
  const router = express.Router();

  // Register a new user
  router.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password are required'
        });
      }

      if (username.length < 3) {
        return res.status(400).json({
          success: false,
          error: 'Username must be at least 3 characters'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters'
        });
      }

      // Check if username already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Username already exists'
        });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert new user
      const result = await pool.query(
        'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
        [username, passwordHash]
      );

      const user = result.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            createdAt: user.created_at
          },
          token
        }
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to register user'
      });
    }
  });

  // Login user
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password are required'
        });
      }

      // Find user
      const result = await pool.query(
        'SELECT id, username, password_hash, created_at FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid username or password'
        });
      }

      const user = result.rows[0];

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid username or password'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            createdAt: user.created_at
          },
          token
        }
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to login'
      });
    }
  });

  // Get current user info (protected route)
  router.get('/me', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, username, created_at FROM users WHERE id = $1',
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const user = result.rows[0];

      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          createdAt: user.created_at
        }
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user'
      });
    }
  });

  return router;
};
