import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

// Mock fetch
global.fetch = jest.fn();

// Test component to access auth context
const TestComponent: React.FC = () => {
  const { user, isAuthenticated, isLoading, login, register, logout } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="username">{user?.username || 'no-user'}</div>
      <button onClick={() => login('testuser', 'password123')}>Login</button>
      <button onClick={() => register('newuser', 'password123')}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (global.fetch as jest.Mock).mockReset();
  });

  it('provides initial state', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('username')).toHaveTextContent('no-user');
  });

  it('logs in user successfully', async () => {
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

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    await act(async () => {
      await user.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('username')).toHaveTextContent('testuser');
    });

    expect(localStorage.getItem('token')).toBe('mock-token');
  });

  it('handles login failure', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Invalid credentials'
      })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    await act(async () => {
      await user.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });
  });

  it('handles login network error', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    await act(async () => {
      await user.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });
  });

  it('registers user successfully', async () => {
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

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    await act(async () => {
      await user.click(screen.getByText('Register'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('username')).toHaveTextContent('newuser');
    });
  });

  it('handles register failure', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Username already exists'
      })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    await act(async () => {
      await user.click(screen.getByText('Register'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });
  });

  it('logs out user', async () => {
    const user = userEvent.setup();

    // First login
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

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    await act(async () => {
      await user.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
    });

    // Then logout
    await act(async () => {
      await user.click(screen.getByText('Logout'));
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('username')).toHaveTextContent('no-user');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('restores session from localStorage', async () => {
    localStorage.setItem('token', 'stored-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'storeduser', createdAt: new Date().toISOString() }));

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { id: 1, username: 'storeduser', createdAt: new Date().toISOString() }
      })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('username')).toHaveTextContent('storeduser');
    });
  });

  it('clears session when token verification fails', async () => {
    localStorage.setItem('token', 'invalid-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'storeduser' }));

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });

    expect(localStorage.getItem('token')).toBeNull();
  });

  it('throws error when useAuth is used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleError.mockRestore();
  });

  it('handles verification with invalid response', async () => {
    localStorage.setItem('token', 'stored-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'storeduser' }));

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Token invalid'
      })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });
  });
});
