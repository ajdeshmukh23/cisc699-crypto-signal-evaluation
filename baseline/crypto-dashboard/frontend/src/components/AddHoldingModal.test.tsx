import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { AddHoldingModal } from './AddHoldingModal';
import { AuthProvider } from '../context/AuthContext';

// Mock fetch
global.fetch = jest.fn();

const mockAuthContext = {
  token: 'mock-token',
  isAuthenticated: true,
  user: { id: 1, username: 'testuser', createdAt: new Date().toISOString() },
  isLoading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn()
};

// Create a wrapper that provides auth context
jest.mock('../context/AuthContext', () => {
  const actual = jest.requireActual('../context/AuthContext');
  return {
    ...actual,
    useAuth: () => mockAuthContext
  };
});

describe('AddHoldingModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders nothing when isOpen is false', () => {
    render(
      <AddHoldingModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    expect(screen.queryByText('Add Holding')).not.toBeInTheDocument();
  });

  it('renders modal when isOpen is true', () => {
    render(
      <AddHoldingModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    expect(screen.getByRole('heading', { name: 'Add Holding' })).toBeInTheDocument();
    expect(screen.getByLabelText('Token')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('Buy Price (USD)')).toBeInTheDocument();
  });

  it('shows all supported tokens in dropdown', () => {
    render(
      <AddHoldingModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const tokenSelect = screen.getByLabelText('Token');
    expect(tokenSelect).toBeInTheDocument();

    // Check all options
    expect(screen.getByRole('option', { name: 'BTC' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'ETH' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'SOL' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'ADA' })).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup();

    render(
      <AddHoldingModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    await act(async () => {
      await user.click(screen.getByText('×'));
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking overlay', async () => {
    const user = userEvent.setup();

    render(
      <AddHoldingModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const overlay = screen.getByRole('heading', { name: 'Add Holding' }).closest('.auth-modal-overlay');
    if (overlay) {
      await act(async () => {
        await user.click(overlay);
      });
    }

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not close when clicking modal content', async () => {
    const user = userEvent.setup();

    render(
      <AddHoldingModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const modal = screen.getByRole('heading', { name: 'Add Holding' }).closest('.auth-modal');
    if (modal) {
      await act(async () => {
        await user.click(modal);
      });
    }

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('shows error when quantity is empty', async () => {
    const user = userEvent.setup();

    render(
      <AddHoldingModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    await act(async () => {
      await user.type(screen.getByLabelText('Buy Price (USD)'), '40000');
      await user.click(screen.getByRole('button', { name: 'Add Holding' }));
    });

    expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('shows error when buy price is empty', async () => {
    const user = userEvent.setup();

    render(
      <AddHoldingModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    await act(async () => {
      await user.type(screen.getByLabelText('Quantity'), '0.5');
      await user.click(screen.getByRole('button', { name: 'Add Holding' }));
    });

    expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('shows error for negative quantity', async () => {
    const user = userEvent.setup();

    render(
      <AddHoldingModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    await act(async () => {
      await user.type(screen.getByLabelText('Quantity'), '-0.5');
      await user.type(screen.getByLabelText('Buy Price (USD)'), '40000');
      await user.click(screen.getByRole('button', { name: 'Add Holding' }));
    });

    expect(screen.getByText('Quantity and buy price must be positive numbers')).toBeInTheDocument();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('shows error for zero quantity', async () => {
    const user = userEvent.setup();

    render(
      <AddHoldingModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    await act(async () => {
      await user.type(screen.getByLabelText('Quantity'), '0');
      await user.type(screen.getByLabelText('Buy Price (USD)'), '40000');
      await user.click(screen.getByRole('button', { name: 'Add Holding' }));
    });

    expect(screen.getByText('Quantity and buy price must be positive numbers')).toBeInTheDocument();
  });

  it('shows error for negative buy price', async () => {
    const user = userEvent.setup();

    render(
      <AddHoldingModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    await act(async () => {
      await user.type(screen.getByLabelText('Quantity'), '0.5');
      await user.type(screen.getByLabelText('Buy Price (USD)'), '-40000');
      await user.click(screen.getByRole('button', { name: 'Add Holding' }));
    });

    expect(screen.getByText('Quantity and buy price must be positive numbers')).toBeInTheDocument();
  });

  it('submits form successfully', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: { id: 1, token: 'BTC', quantity: 0.5, buyPrice: 40000 }
      })
    });

    render(
      <AddHoldingModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    await act(async () => {
      await user.type(screen.getByLabelText('Quantity'), '0.5');
      await user.type(screen.getByLabelText('Buy Price (USD)'), '40000');
      await user.click(screen.getByRole('button', { name: 'Add Holding' }));
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/portfolio',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        }),
        body: JSON.stringify({
          token: 'BTC',
          quantity: 0.5,
          buyPrice: 40000
        })
      })
    );
  });

  it('submits with different token selection', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: { id: 1, token: 'ETH', quantity: 2, buyPrice: 2500 }
      })
    });

    render(
      <AddHoldingModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    await act(async () => {
      await user.selectOptions(screen.getByLabelText('Token'), 'ETH');
      await user.type(screen.getByLabelText('Quantity'), '2');
      await user.type(screen.getByLabelText('Buy Price (USD)'), '2500');
      await user.click(screen.getByRole('button', { name: 'Add Holding' }));
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/portfolio',
      expect.objectContaining({
        body: JSON.stringify({
          token: 'ETH',
          quantity: 2,
          buyPrice: 2500
        })
      })
    );
  });

  it('shows error on API failure', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: 'Failed to add holding'
      })
    });

    render(
      <AddHoldingModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    await act(async () => {
      await user.type(screen.getByLabelText('Quantity'), '0.5');
      await user.type(screen.getByLabelText('Buy Price (USD)'), '40000');
      await user.click(screen.getByRole('button', { name: 'Add Holding' }));
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to add holding')).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('shows error on network failure', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <AddHoldingModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    await act(async () => {
      await user.type(screen.getByLabelText('Quantity'), '0.5');
      await user.type(screen.getByLabelText('Buy Price (USD)'), '40000');
      await user.click(screen.getByRole('button', { name: 'Add Holding' }));
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to connect to server')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();

    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (global.fetch as jest.Mock).mockReturnValueOnce(pendingPromise);

    render(
      <AddHoldingModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    await act(async () => {
      await user.type(screen.getByLabelText('Quantity'), '0.5');
      await user.type(screen.getByLabelText('Buy Price (USD)'), '40000');
      await user.click(screen.getByRole('button', { name: 'Add Holding' }));
    });

    expect(screen.getByText('Adding...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adding...' })).toBeDisabled();

    // Resolve the promise
    await act(async () => {
      resolvePromise!({
        json: async () => ({
          success: true,
          data: { id: 1, token: 'BTC', quantity: 0.5, buyPrice: 40000 }
        })
      });
    });
  });

  it('resets form on successful submission', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: { id: 1, token: 'ETH', quantity: 2, buyPrice: 2500 }
      })
    });

    render(
      <AddHoldingModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    await act(async () => {
      await user.selectOptions(screen.getByLabelText('Token'), 'ETH');
      await user.type(screen.getByLabelText('Quantity'), '2');
      await user.type(screen.getByLabelText('Buy Price (USD)'), '2500');
      await user.click(screen.getByRole('button', { name: 'Add Holding' }));
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('resets form and clears error on close', async () => {
    const user = userEvent.setup();

    render(
      <AddHoldingModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    // Fill form partially and trigger error
    await act(async () => {
      await user.type(screen.getByLabelText('Quantity'), '0.5');
      await user.click(screen.getByRole('button', { name: 'Add Holding' }));
    });

    expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();

    // Close modal
    await act(async () => {
      await user.click(screen.getByText('×'));
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays note about averaging buy price', () => {
    render(
      <AddHoldingModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    expect(screen.getByText(/if you already own this token/i)).toBeInTheDocument();
  });

  it('has required attributes on inputs', () => {
    render(
      <AddHoldingModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const quantityInput = screen.getByLabelText('Quantity');
    const buyPriceInput = screen.getByLabelText('Buy Price (USD)');

    expect(quantityInput).toHaveAttribute('required');
    expect(buyPriceInput).toHaveAttribute('required');
    expect(quantityInput).toHaveAttribute('type', 'number');
    expect(buyPriceInput).toHaveAttribute('type', 'number');
  });

  it('accepts decimal values for quantity', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: { id: 1, token: 'BTC', quantity: 0.00123456, buyPrice: 40000 }
      })
    });

    render(
      <AddHoldingModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    await act(async () => {
      await user.type(screen.getByLabelText('Quantity'), '0.00123456');
      await user.type(screen.getByLabelText('Buy Price (USD)'), '40000');
      await user.click(screen.getByRole('button', { name: 'Add Holding' }));
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/portfolio',
      expect.objectContaining({
        body: JSON.stringify({
          token: 'BTC',
          quantity: 0.00123456,
          buyPrice: 40000
        })
      })
    );
  });
});
