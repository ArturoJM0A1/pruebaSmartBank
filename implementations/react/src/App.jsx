/**
 * SmartBank React Application
 * 
 * WHY React Router?
 * - Client-side routing without page reloads
 * - Declarative route definitions match URLs to components
 * - Nested routes enable layouts and URL hierarchies
 * 
 * WHY JSX?
 * - JSX is syntactic sugar for React.createElement()
 * - Makes component trees readable and maintainable
 * - Compiled to JavaScript at build time (no runtime cost)
 * - Enables HTML-like syntax in JavaScript with full power of JS expressions
 */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import AccountList from './components/AccountList';
import TransactionHistory from './components/TransactionHistory';
import TransferForm from './components/TransferForm';

/**
 * WHY a separate AuthGuard component?
 * - Encapsulates authentication logic in one place
 * - Reusable across protected routes
 * - Follows Single Responsibility Principle
 */
function AuthGuard({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // WHY Navigate instead of redirect?
  // Navigate is declarative - it fits React's component model
  // It also works with React Router's history stack
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

/**
 * WHY functional components over class components?
 * - Hooks eliminate the need for classes
 * - Better code reuse via custom hooks
 * - Smaller bundle size (no this binding, no class methods)
 * - Better TypeScript inference
 * - Future of React (all new features target hooks)
 */
export default function App() {
  return (
    <div className="app">
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginForm />} />
        
        {/* Protected routes - WHY nested structure? */}
        {/* It maps naturally to the UI hierarchy and URL structure */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        />
        <Route
          path="/accounts"
          element={
            <AuthGuard>
              <AccountList />
            </AuthGuard>
          }
        />
        <Route
          path="/transactions"
          element={
            <AuthGuard>
              <TransactionHistory />
            </AuthGuard>
          }
        />
        <Route
          path="/transfer"
          element={
            <AuthGuard>
              <TransferForm />
            </AuthGuard>
          }
        />
        
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}
