const express = require('express');
const { authenticateToken } = require('../middleware/auth');

module.exports = (pool) => {
  const router = express.Router();

  // All portfolio routes require authentication
  router.use(authenticateToken);

  // Get user's portfolio holdings with current values
  router.get('/', async (req, res) => {
    try {
      const userId = req.user.id;

      // Get holdings with current prices
      const result = await pool.query(`
        SELECT
          ph.id,
          ph.token,
          ph.quantity,
          ph.buy_price,
          ph.created_at,
          cp.price as current_price,
          cp.change_24h
        FROM portfolio_holdings ph
        LEFT JOIN current_prices cp ON ph.token = cp.token
        WHERE ph.user_id = $1
        ORDER BY ph.created_at DESC
      `, [userId]);

      const holdings = result.rows.map(row => {
        const currentValue = parseFloat(row.quantity) * parseFloat(row.current_price || 0);
        const investedValue = parseFloat(row.quantity) * parseFloat(row.buy_price);
        const profitLoss = currentValue - investedValue;
        const profitLossPercent = investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;

        return {
          id: row.id,
          token: row.token,
          quantity: parseFloat(row.quantity),
          buyPrice: parseFloat(row.buy_price),
          currentPrice: parseFloat(row.current_price || 0),
          change24h: parseFloat(row.change_24h || 0),
          currentValue,
          investedValue,
          profitLoss,
          profitLossPercent,
          createdAt: row.created_at
        };
      });

      // Calculate totals
      const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
      const totalInvested = holdings.reduce((sum, h) => sum + h.investedValue, 0);
      const totalProfitLoss = totalValue - totalInvested;
      const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

      res.json({
        success: true,
        data: {
          holdings,
          summary: {
            totalValue,
            totalInvested,
            totalProfitLoss,
            totalProfitLossPercent
          }
        }
      });
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch portfolio'
      });
    }
  });

  // Add a new holding
  router.post('/', async (req, res) => {
    try {
      const userId = req.user.id;
      const { token, quantity, buyPrice } = req.body;

      if (!token || !quantity || !buyPrice) {
        return res.status(400).json({
          success: false,
          error: 'Token, quantity, and buy price are required'
        });
      }

      const validTokens = ['BTC', 'ETH', 'SOL', 'ADA'];
      if (!validTokens.includes(token.toUpperCase())) {
        return res.status(400).json({
          success: false,
          error: `Invalid token. Must be one of: ${validTokens.join(', ')}`
        });
      }

      if (quantity <= 0 || buyPrice <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Quantity and buy price must be positive numbers'
        });
      }

      // Insert or update holding (upsert)
      const result = await pool.query(`
        INSERT INTO portfolio_holdings (user_id, token, quantity, buy_price)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, token)
        DO UPDATE SET
          quantity = portfolio_holdings.quantity + $3,
          buy_price = (
            (portfolio_holdings.quantity * portfolio_holdings.buy_price + $3 * $4) /
            (portfolio_holdings.quantity + $3)
          )
        RETURNING id, token, quantity, buy_price, created_at
      `, [userId, token.toUpperCase(), quantity, buyPrice]);

      const holding = result.rows[0];

      res.status(201).json({
        success: true,
        data: {
          id: holding.id,
          token: holding.token,
          quantity: parseFloat(holding.quantity),
          buyPrice: parseFloat(holding.buy_price),
          createdAt: holding.created_at
        }
      });
    } catch (error) {
      console.error('Error adding holding:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add holding'
      });
    }
  });

  // Update a holding
  router.put('/:token', async (req, res) => {
    try {
      const userId = req.user.id;
      const { token } = req.params;
      const { quantity, buyPrice } = req.body;

      if (!quantity || !buyPrice) {
        return res.status(400).json({
          success: false,
          error: 'Quantity and buy price are required'
        });
      }

      if (quantity <= 0 || buyPrice <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Quantity and buy price must be positive numbers'
        });
      }

      const result = await pool.query(`
        UPDATE portfolio_holdings
        SET quantity = $1, buy_price = $2
        WHERE user_id = $3 AND token = $4
        RETURNING id, token, quantity, buy_price, created_at
      `, [quantity, buyPrice, userId, token.toUpperCase()]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Holding not found'
        });
      }

      const holding = result.rows[0];

      res.json({
        success: true,
        data: {
          id: holding.id,
          token: holding.token,
          quantity: parseFloat(holding.quantity),
          buyPrice: parseFloat(holding.buy_price),
          createdAt: holding.created_at
        }
      });
    } catch (error) {
      console.error('Error updating holding:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update holding'
      });
    }
  });

  // Delete a holding
  router.delete('/:token', async (req, res) => {
    try {
      const userId = req.user.id;
      const { token } = req.params;

      const result = await pool.query(`
        DELETE FROM portfolio_holdings
        WHERE user_id = $1 AND token = $2
        RETURNING id
      `, [userId, token.toUpperCase()]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Holding not found'
        });
      }

      res.json({
        success: true,
        message: 'Holding deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting holding:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete holding'
      });
    }
  });

  return router;
};
