/**
 * useAuth - Custom Hook for Authentication State
 * 
 * WHY custom hooks?
 * - Extract reusable stateful logic from components
 * - Custom hooks follow the "Don't Repeat Yourself" principle
 * - They're just functions - easy to test in isolation
 * -命名约定: use prefix tells React this is a hook (enables linting rules)
 * 
 * WHEN to extract a custom hook:
 * - Same state logic appears in 2+ components
 * - Component is doing too many things (violation of SRP)
 * - You want to test the logic separately
 * - Logic is complex enough to benefit from abstraction
 */
import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure, logout } from '../store/slices/authSlice';
import { api } from '../services/api';

export function useAuth() {
  // WHY useSelector with shallow comparison?
  // Prevents unnecessary re-renders when only part of auth state changes
  const { user, isAuthenticated, loading, error } = useSelector(
    (state) => state.auth
  );
  const dispatch = useDispatch();

  // WHY useCallback?
  // Prevents new function reference on every render
  // This matters when passing to child components (especially with React.memo)
  const login = useCallback(
    async (credentials) => {
      dispatch(loginStart());
      try {
        const response = await api.post('/auth/login', credentials);
        dispatch(loginSuccess(response.data));
        return true;
      } catch (err) {
        dispatch(loginFailure(err.response?.data?.message || 'Login failed'));
        return false;
      }
    },
    [dispatch]
  );

  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout: handleLogout,
  };
}
