import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { AuthModal } from './AuthModal';
import { AuthProvider } from '../context/AuthContext';

// Mock fetch
global.fetch = jest.fn();

const renderWithAuth = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      {ui}
    </AuthProvider>
  );
};

describe('AuthModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders nothing when isOpen is false', () => {
    renderWithAuth(<AuthModal isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  it('renders login form when isOpen is true', () => {
    renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('switches between login and register modes', async () => {
    const user = userEvent.setup();

    renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByText('Sign up'));
    });

    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByText('Login', { selector: 'button' }));
    });

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();

    renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

    await act(async () => {
      await user.click(screen.getByText('×'));
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking overlay', async () => {
    const user = userEvent.setup();

    renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

    const overlay = screen.getByRole('heading', { name: 'Login' }).closest('.auth-modal-overlay');
    if (overlay) {
      await act(async () => {
        await user.click(overlay);
      });
    }

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not close when clicking modal content', async () => {
    const user = userEvent.setup();

    renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

    const modal = screen.getByRole('heading', { name: 'Login' }).closest('.auth-modal');
    if (modal) {
      await act(async () => {
        await user.click(modal);
      });
    }

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('submits login form successfully', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: { id: 1, username: 'testuser', createdAt: new Date().toISOString() },
          token: 'mock-token'
        }
      })
    });

    renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

    await act(async () => {
      await user.type(screen.getByLabelText('Username'), 'testuser');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Login' }));
    });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('displays error message on login failure', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Invalid credentials'
      })
    });

    renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

    await act(async () => {
      await user.type(screen.getByLabelText('Username'), 'testuser');
      await user.type(screen.getByLabelText('Password'), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: 'Login' }));
    });

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('submits register form successfully', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: { id: 1, username: 'newuser', createdAt: new Date().toISOString() },
          token: 'mock-token'
        }
      })
    });

    renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

    // Switch to register mode
    await act(async () => {
      await user.click(screen.getByText('Sign up'));
    });

    await act(async () => {
      await user.type(screen.getByLabelText('Username'), 'newuser');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Create Account' }));
    });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('displays error message on register failure', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Username already exists'
      })
    });

    renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

    // Switch to register mode
    await act(async () => {
      await user.click(screen.getByText('Sign up'));
    });

    await act(async () => {
      await user.type(screen.getByLabelText('Username'), 'existinguser');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Create Account' }));
    });

    await waitFor(() => {
      expect(screen.getByText('Username already exists')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();

    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (global.fetch as jest.Mock).mockReturnValueOnce(pendingPromise);

    renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

    await act(async () => {
      await user.type(screen.getByLabelText('Username'), 'testuser');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Login' }));
    });

    expect(screen.getByText('Please wait...')).toBeInTheDocument();

    // Resolve the promise
    await act(async () => {
      resolvePromise!({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: { id: 1, username: 'testuser', createdAt: new Date().toISOString() },
            token: 'mock-token'
          }
        })
      });
    });
  });

  it('clears error when switching modes', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Invalid credentials'
      })
    });

    renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

    await act(async () => {
      await user.type(screen.getByLabelText('Username'), 'testuser');
      await user.type(screen.getByLabelText('Password'), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: 'Login' }));
    });

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByText('Sign up'));
    });

    expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
  });

  it('handles network error', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

    await act(async () => {
      await user.type(screen.getByLabelText('Username'), 'testuser');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Login' }));
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to connect to server')).toBeInTheDocument();
    });
  });

  it('has required input validation', () => {
    renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');

    expect(usernameInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('required');
    expect(usernameInput).toHaveAttribute('minLength', '3');
    expect(passwordInput).toHaveAttribute('minLength', '6');
  });
});
