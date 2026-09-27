import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { Portfolio } from './Portfolio';

// Mock fetch
global.fetch = jest.fn();

// Mock window.confirm
const mockConfirm = jest.fn();
window.confirm = mockConfirm;

// Create mock auth state that can be modified
const mockAuthState = {
  token: 'mock-token',
  isAuthenticated: true,
  user: { id: 1, username: 'testuser', createdAt: new Date().toISOString() },
  isLoading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn()
};

// Mock AuthContext
jest.mock('../context/AuthContext', () => {
  const actual = jest.requireActual('../context/AuthContext');
  return {
    ...actual,
    useAuth: () => mockAuthState
  };
});

describe('Portfolio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    mockConfirm.mockReset();
    // Reset to authenticated state
    mockAuthState.token = 'mock-token';
    mockAuthState.isAuthenticated = true;
  });

  describe('when not authenticated', () => {
    beforeEach(() => {
      mockAuthState.token = null as any;
      mockAuthState.isAuthenticated = false;
    });

    it('shows login prompt when not authenticated', () => {
      render(<Portfolio />);

      expect(screen.getByText('Portfolio')).toBeInTheDocument();
      expect(screen.getByText('Login to track your crypto holdings')).toBeInTheDocument();
    });
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      mockAuthState.token = 'mock-token';
      mockAuthState.isAuthenticated = true;
    });

    it('shows loading state initially', async () => {
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(pendingPromise);

      render(<Portfolio />);

      expect(screen.getByText('Loading portfolio...')).toBeInTheDocument();

      // Resolve the promise to clean up
      await act(async () => {
        resolvePromise!({
          json: async () => ({ success: true, data: { holdings: [], summary: { totalValue: 0, totalInvested: 0, totalProfitLoss: 0, totalProfitLossPercent: 0 } } })
        });
      });
    });

    it('displays portfolio with holdings', async () => {
      const mockPortfolio = {
        success: true,
        data: {
          holdings: [
            {
              id: 1,
              token: 'BTC',
              quantity: 0.5,
              buyPrice: 40000,
              currentPrice: 45000,
              change24h: 2.5,
              currentValue: 22500,
              investedValue: 20000,
              profitLoss: 2500,
              profitLossPercent: 12.5,
              createdAt: new Date().toISOString()
            },
            {
              id: 2,
              token: 'ETH',
              quantity: 2,
              buyPrice: 2000,
              currentPrice: 2500,
              change24h: -1.5,
              currentValue: 5000,
              investedValue: 4000,
              profitLoss: 1000,
              profitLossPercent: 25,
              createdAt: new Date().toISOString()
            }
          ],
          summary: {
            totalValue: 27500,
            totalInvested: 24000,
            totalProfitLoss: 3500,
            totalProfitLossPercent: 14.58
          }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockPortfolio
      });

      render(<Portfolio />);

      await waitFor(() => {
        expect(screen.getByText('My Portfolio')).toBeInTheDocument();
      });

      // Check summary
      expect(screen.getByText('Total Value')).toBeInTheDocument();
      expect(screen.getByText('Total Invested')).toBeInTheDocument();
      expect(screen.getByText('Total P/L')).toBeInTheDocument();

      // Check holdings table
      expect(screen.getByText('BTC')).toBeInTheDocument();
      expect(screen.getByText('ETH')).toBeInTheDocument();
      expect(screen.getByText('0.500000')).toBeInTheDocument();
      expect(screen.getByText('2.000000')).toBeInTheDocument();
    });

    it('displays empty state when no holdings', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            holdings: [],
            summary: { totalValue: 0, totalInvested: 0, totalProfitLoss: 0, totalProfitLossPercent: 0 }
          }
        })
      });

      render(<Portfolio />);

      await waitFor(() => {
        expect(screen.getByText('No holdings yet. Add your first crypto holding!')).toBeInTheDocument();
      });
    });

    it('displays error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: 'Failed to fetch portfolio'
        })
      });

      render(<Portfolio />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch portfolio')).toBeInTheDocument();
      });
    });

    it('displays error on network failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<Portfolio />);

      await waitFor(() => {
        expect(screen.getByText('Failed to connect to server')).toBeInTheDocument();
      });
    });

    it('opens add holding modal when button clicked', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            holdings: [],
            summary: { totalValue: 0, totalInvested: 0, totalProfitLoss: 0, totalProfitLossPercent: 0 }
          }
        })
      });

      render(<Portfolio />);

      await waitFor(() => {
        expect(screen.getByText('+ Add Holding')).toBeInTheDocument();
      });

      await act(async () => {
        await user.click(screen.getByText('+ Add Holding'));
      });

      expect(screen.getByRole('heading', { name: 'Add Holding' })).toBeInTheDocument();
    });

    it('deletes holding when confirmed', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);

      const mockPortfolio = {
        success: true,
        data: {
          holdings: [{
            id: 1,
            token: 'BTC',
            quantity: 0.5,
            buyPrice: 40000,
            currentPrice: 45000,
            change24h: 2.5,
            currentValue: 22500,
            investedValue: 20000,
            profitLoss: 2500,
            profitLossPercent: 12.5,
            createdAt: new Date().toISOString()
          }],
          summary: { totalValue: 22500, totalInvested: 20000, totalProfitLoss: 2500, totalProfitLossPercent: 12.5 }
        }
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ json: async () => mockPortfolio })
        .mockResolvedValueOnce({ json: async () => ({ success: true }) })
        .mockResolvedValueOnce({ json: async () => ({ success: true, data: { holdings: [], summary: { totalValue: 0, totalInvested: 0, totalProfitLoss: 0, totalProfitLossPercent: 0 } } }) });

      render(<Portfolio />);

      await waitFor(() => {
        expect(screen.getByText('BTC')).toBeInTheDocument();
      });

      await act(async () => {
        await user.click(screen.getByText('Delete'));
      });

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete your BTC holding?');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/portfolio/BTC',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('does not delete holding when not confirmed', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);

      const mockPortfolio = {
        success: true,
        data: {
          holdings: [{
            id: 1,
            token: 'BTC',
            quantity: 0.5,
            buyPrice: 40000,
            currentPrice: 45000,
            change24h: 2.5,
            currentValue: 22500,
            investedValue: 20000,
            profitLoss: 2500,
            profitLossPercent: 12.5,
            createdAt: new Date().toISOString()
          }],
          summary: { totalValue: 22500, totalInvested: 20000, totalProfitLoss: 2500, totalProfitLossPercent: 12.5 }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockPortfolio
      });

      render(<Portfolio />);

      await waitFor(() => {
        expect(screen.getByText('BTC')).toBeInTheDocument();
      });

      await act(async () => {
        await user.click(screen.getByText('Delete'));
      });

      // Fetch should only be called once for initial load, not for delete
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('shows error when delete fails', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);

      const mockPortfolio = {
        success: true,
        data: {
          holdings: [{
            id: 1,
            token: 'BTC',
            quantity: 0.5,
            buyPrice: 40000,
            currentPrice: 45000,
            change24h: 2.5,
            currentValue: 22500,
            investedValue: 20000,
            profitLoss: 2500,
            profitLossPercent: 12.5,
            createdAt: new Date().toISOString()
          }],
          summary: { totalValue: 22500, totalInvested: 20000, totalProfitLoss: 2500, totalProfitLossPercent: 12.5 }
        }
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ json: async () => mockPortfolio })
        .mockResolvedValueOnce({ json: async () => ({ success: false, error: 'Failed to delete holding' }) });

      render(<Portfolio />);

      await waitFor(() => {
        expect(screen.getByText('BTC')).toBeInTheDocument();
      });

      await act(async () => {
        await user.click(screen.getByText('Delete'));
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to delete holding')).toBeInTheDocument();
      });
    });

    it('shows error when delete network fails', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);

      const mockPortfolio = {
        success: true,
        data: {
          holdings: [{
            id: 1,
            token: 'BTC',
            quantity: 0.5,
            buyPrice: 40000,
            currentPrice: 45000,
            change24h: 2.5,
            currentValue: 22500,
            investedValue: 20000,
            profitLoss: 2500,
            profitLossPercent: 12.5,
            createdAt: new Date().toISOString()
          }],
          summary: { totalValue: 22500, totalInvested: 20000, totalProfitLoss: 2500, totalProfitLossPercent: 12.5 }
        }
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ json: async () => mockPortfolio })
        .mockRejectedValueOnce(new Error('Network error'));

      render(<Portfolio />);

      await waitFor(() => {
        expect(screen.getByText('BTC')).toBeInTheDocument();
      });

      await act(async () => {
        await user.click(screen.getByText('Delete'));
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to connect to server')).toBeInTheDocument();
      });
    });

    it('formats prices correctly', async () => {
      const mockPortfolio = {
        success: true,
        data: {
          holdings: [{
            id: 1,
            token: 'BTC',
            quantity: 0.5,
            buyPrice: 45000,
            currentPrice: 50000,
            change24h: 2.5,
            currentValue: 25000,
            investedValue: 22500,
            profitLoss: 2500,
            profitLossPercent: 11.11,
            createdAt: new Date().toISOString()
          }],
          summary: { totalValue: 25000, totalInvested: 22500, totalProfitLoss: 2500, totalProfitLossPercent: 11.11 }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockPortfolio
      });

      render(<Portfolio />);

      await waitFor(() => {
        expect(screen.getByText('BTC')).toBeInTheDocument();
      });

      // Check that prices are formatted with commas for large numbers
      const container = document.body;
      expect(container.textContent).toContain('$50,000');
      expect(container.textContent).toContain('$45,000');
      expect(container.textContent).toContain('$25,000');
    });

    it('formats small prices with decimals', async () => {
      const mockPortfolio = {
        success: true,
        data: {
          holdings: [{
            id: 1,
            token: 'ADA',
            quantity: 100,
            buyPrice: 0.5,
            currentPrice: 0.75,
            change24h: 5.0,
            currentValue: 75,
            investedValue: 50,
            profitLoss: 25,
            profitLossPercent: 50,
            createdAt: new Date().toISOString()
          }],
          summary: { totalValue: 75, totalInvested: 50, totalProfitLoss: 25, totalProfitLossPercent: 50 }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockPortfolio
      });

      render(<Portfolio />);

      await waitFor(() => {
        expect(screen.getByText('ADA')).toBeInTheDocument();
      });

      // Check that small prices are formatted with 4 decimal places
      const container = document.body;
      expect(container.textContent).toContain('$0.7500');
      expect(container.textContent).toContain('$0.5000');
    });

    it('applies correct colors for positive/negative changes', async () => {
      const mockPortfolio = {
        success: true,
        data: {
          holdings: [
            {
              id: 1,
              token: 'BTC',
              quantity: 1,
              buyPrice: 40000,
              currentPrice: 45000,
              change24h: 5.0,
              currentValue: 45000,
              investedValue: 40000,
              profitLoss: 5000,
              profitLossPercent: 12.5,
              createdAt: new Date().toISOString()
            },
            {
              id: 2,
              token: 'ETH',
              quantity: 1,
              buyPrice: 3000,
              currentPrice: 2500,
              change24h: -10.0,
              currentValue: 2500,
              investedValue: 3000,
              profitLoss: -500,
              profitLossPercent: -16.67,
              createdAt: new Date().toISOString()
            }
          ],
          summary: { totalValue: 47500, totalInvested: 43000, totalProfitLoss: 4500, totalProfitLossPercent: 10.47 }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockPortfolio
      });

      render(<Portfolio />);

      await waitFor(() => {
        expect(screen.getByText('+5.00%')).toBeInTheDocument();
        expect(screen.getByText('-10.00%')).toBeInTheDocument();
      });
    });

    it('refreshes portfolio after successful add', async () => {
      const user = userEvent.setup();

      const emptyPortfolio = {
        success: true,
        data: {
          holdings: [],
          summary: { totalValue: 0, totalInvested: 0, totalProfitLoss: 0, totalProfitLossPercent: 0 }
        }
      };

      const portfolioWithHolding = {
        success: true,
        data: {
          holdings: [{
            id: 1,
            token: 'BTC',
            quantity: 0.5,
            buyPrice: 40000,
            currentPrice: 45000,
            change24h: 2.5,
            currentValue: 22500,
            investedValue: 20000,
            profitLoss: 2500,
            profitLossPercent: 12.5,
            createdAt: new Date().toISOString()
          }],
          summary: { totalValue: 22500, totalInvested: 20000, totalProfitLoss: 2500, totalProfitLossPercent: 12.5 }
        }
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ json: async () => emptyPortfolio })
        .mockResolvedValueOnce({ json: async () => ({ success: true, data: { token: 'BTC', quantity: 0.5, buyPrice: 40000 } }) })
        .mockResolvedValueOnce({ json: async () => portfolioWithHolding });

      render(<Portfolio />);

      await waitFor(() => {
        expect(screen.getByText('No holdings yet. Add your first crypto holding!')).toBeInTheDocument();
      });

      // Open add modal
      await act(async () => {
        await user.click(screen.getByText('+ Add Holding'));
      });

      // Fill form
      await act(async () => {
        await user.type(screen.getByLabelText('Quantity'), '0.5');
        await user.type(screen.getByLabelText('Buy Price (USD)'), '40000');
        await user.click(screen.getByRole('button', { name: 'Add Holding' }));
      });

      // Portfolio should refresh and show the new holding
      await waitFor(() => {
        expect(screen.getByText('BTC')).toBeInTheDocument();
      });
    });
  });
});
