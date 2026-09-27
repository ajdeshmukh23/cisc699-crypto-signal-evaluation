import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { AddHoldingModal } from './AddHoldingModal';

interface Holding {
  id: number;
  token: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  change24h: number;
  currentValue: number;
  investedValue: number;
  profitLoss: number;
  profitLossPercent: number;
  createdAt: string;
}

interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
}

interface PortfolioData {
  holdings: Holding[];
  summary: PortfolioSummary;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const Portfolio: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchPortfolio = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/portfolio`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setPortfolio(data.data);
        setError('');
      } else {
        setError(data.error || 'Failed to fetch portfolio');
      }
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPortfolio();
      // Refresh portfolio every 30 seconds
      const interval = setInterval(fetchPortfolio, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchPortfolio]);

  const handleDeleteHolding = async (tokenSymbol: string) => {
    if (!token) return;

    if (!window.confirm(`Are you sure you want to delete your ${tokenSymbol} holding?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/portfolio/${tokenSymbol}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        fetchPortfolio();
      } else {
        setError(data.error || 'Failed to delete holding');
      }
    } catch (err) {
      console.error('Error deleting holding:', err);
      setError('Failed to connect to server');
    }
  };

  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }
    return `$${price.toFixed(4)}`;
  };

  const formatPercent = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getChangeColor = (value: number): string => {
    if (value > 0) return '#10b981';
    if (value < 0) return '#ef4444';
    return '#6b7280';
  };

  if (!isAuthenticated) {
    return (
      <div className="portfolio-section">
        <div className="portfolio-login-prompt">
          <h3>Portfolio</h3>
          <p>Login to track your crypto holdings</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="portfolio-section">
        <h3>Portfolio</h3>
        <div className="portfolio-loading">Loading portfolio...</div>
      </div>
    );
  }

  return (
    <div className="portfolio-section">
      <div className="portfolio-header">
        <h3>My Portfolio</h3>
        <button className="add-holding-btn" onClick={() => setShowAddModal(true)}>
          + Add Holding
        </button>
      </div>

      {error && <div className="portfolio-error">{error}</div>}

      {portfolio && (
        <>
          <div className="portfolio-summary">
            <div className="summary-card">
              <span className="summary-label">Total Value</span>
              <span className="summary-value">{formatPrice(portfolio.summary.totalValue)}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Total Invested</span>
              <span className="summary-value">{formatPrice(portfolio.summary.totalInvested)}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Total P/L</span>
              <span className="summary-value" style={{ color: getChangeColor(portfolio.summary.totalProfitLoss) }}>
                {formatPrice(portfolio.summary.totalProfitLoss)} ({formatPercent(portfolio.summary.totalProfitLossPercent)})
              </span>
            </div>
          </div>

          {portfolio.holdings.length === 0 ? (
            <div className="portfolio-empty">
              <p>No holdings yet. Add your first crypto holding!</p>
            </div>
          ) : (
            <div className="holdings-table-container">
              <table className="holdings-table">
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Quantity</th>
                    <th>Buy Price</th>
                    <th>Current Price</th>
                    <th>Value</th>
                    <th>P/L</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.holdings.map(holding => (
                    <tr key={holding.id}>
                      <td className="token-cell">
                        <span className="token-symbol">{holding.token}</span>
                      </td>
                      <td>{holding.quantity.toFixed(6)}</td>
                      <td>{formatPrice(holding.buyPrice)}</td>
                      <td>
                        {formatPrice(holding.currentPrice)}
                        <span className="price-change" style={{ color: getChangeColor(holding.change24h) }}>
                          {formatPercent(holding.change24h)}
                        </span>
                      </td>
                      <td>{formatPrice(holding.currentValue)}</td>
                      <td style={{ color: getChangeColor(holding.profitLoss) }}>
                        {formatPrice(holding.profitLoss)}
                        <br />
                        <small>{formatPercent(holding.profitLossPercent)}</small>
                      </td>
                      <td>
                        <button
                          className="delete-holding-btn"
                          onClick={() => handleDeleteHolding(holding.token)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <AddHoldingModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchPortfolio();
        }}
      />
    </div>
  );
};
