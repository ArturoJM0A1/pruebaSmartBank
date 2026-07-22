/**
 * ============================================================================
 * SMARTBANK - UNIT TESTS: Auth Service
 * ============================================================================
 * 
 * PURPOSE: Test authentication logic (login, logout, token management).
 * 
 * WHY TEST AUTH?
 *   - Security-critical: A bug here could let unauthorized users in.
 *   - Token management is tricky: storage, expiration, refresh.
 *   - Role-based access must be enforced correctly.
 * 
 * TOKEN STORAGE STRATEGY:
 *   - Access Token: Stored in localStorage (sent with every request)
 *   - Refresh Token: Also in localStorage (used to get new access tokens)
 *   - WHY localStorage: Simple, persists across sessions. NOT the most secure.
 *   - BETTER: HttpOnly cookies (can't be accessed by JavaScript).
 *   - BEST: Session + CSRF tokens (defense in depth).
 * 
 * ============================================================================
 */

'use strict';

// ============================================================================
// AUTH SERVICE (simplified for testing)
// ============================================================================

const AuthService = {
  login: async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Login failed');
    }

    localStorage.setItem('token', data.data.token);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));

    return data.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  hasRole: (role) => {
    const user = AuthService.getCurrentUser();
    return user?.role === role;
  },
};

// ============================================================================
// TESTS
// ============================================================================

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  // WHAT: Successful login stores token and user data
  // WHY: After login, user should be authenticated and data available.
  it('should login successfully and store credentials', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          user: { id: 'usr_123', email: 'user@test.com', role: 'user' },
          token: 'jwt-access-token-abc123',
          refreshToken: 'refresh-token-xyz789',
        },
      }),
    };

    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const result = await AuthService.login('user@test.com', 'password123');

    expect(result.token).toBe('jwt-access-token-abc123');
    expect(localStorage.getItem('token')).toBe('jwt-access-token-abc123');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-token-xyz789');
    expect(JSON.parse(localStorage.getItem('user')).email).toBe('user@test.com');
  });

  // WHAT: Failed login throws error and doesn't store anything
  // WHY: Wrong credentials must not create a session.
  it('should throw error on failed login', async () => {
    const mockResponse = {
      ok: false,
      status: 401,
      json: () => Promise.resolve({
        success: false,
        error: { message: 'Invalid credentials' },
      }),
    };

    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    await expect(AuthService.login('wrong@test.com', 'wrong'))
      .rejects.toThrow('Invalid credentials');

    expect(localStorage.getItem('token')).toBeNull();
  });

  // WHAT: Logout clears all stored credentials
  // WHY: User must be fully logged out (no stale tokens).
  it('should clear all credentials on logout', () => {
    localStorage.setItem('token', 'some-token');
    localStorage.setItem('refreshToken', 'some-refresh');
    localStorage.setItem('user', JSON.stringify({ id: 1 }));

    AuthService.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  // WHAT: isAuthenticated returns true when token exists
  it('should return true when authenticated', () => {
    localStorage.setItem('token', 'valid-token');
    expect(AuthService.isAuthenticated()).toBe(true);
  });

  // WHAT: isAuthenticated returns false when no token
  it('should return false when not authenticated', () => {
    expect(AuthService.isAuthenticated()).toBe(false);
  });

  // WHAT: getCurrentUser returns parsed user object
  it('should return current user from storage', () => {
    const user = { id: 'usr_123', name: 'Juan', role: 'user' };
    localStorage.setItem('user', JSON.stringify(user));

    const result = AuthService.getCurrentUser();
    expect(result).toEqual(user);
  });

  // WHAT: getCurrentUser returns null when not logged in
  it('should return null when no user stored', () => {
    expect(AuthService.getCurrentUser()).toBeNull();
  });

  // WHAT: hasRole checks user role correctly
  it('should check user role', () => {
    const user = { id: 'usr_123', role: 'admin' };
    localStorage.setItem('user', JSON.stringify(user));

    expect(AuthService.hasRole('admin')).toBe(true);
    expect(AuthService.hasRole('user')).toBe(false);
  });

  // WHAT: hasRole returns false when no user
  it('should return false when no user', () => {
    expect(AuthService.hasRole('admin')).toBe(false);
  });
});
