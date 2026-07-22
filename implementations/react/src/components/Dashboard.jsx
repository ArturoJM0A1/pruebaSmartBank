/**
 * Dashboard - React Component with Data Fetching
 * 
 * COMPONENT COMPOSITION in React:
 * - Build complex UIs from simple, reusable components
 * - Each component has a single responsibility
 * - Props flow down, events flow up (unidirectional data flow)
 * 
 * CONDITIONAL RENDERING patterns:
 * 1. Ternary operator: condition ? <A /> : <B />
 * 2. Logical AND: condition && <A />
 * 3. Early return: if (!condition) return null
 * 4. Variable assignment: const content = condition ? <A /> : <B />
 * 
 * WHY early returns (guard clauses)?
 * - Reduces nesting (pyramid of doom)
 * - More readable: handle edge cases first
 * - Follows "fail fast" principle
 */
import React from 'react';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function Dashboard() {
  const { user } = useAuth();
  
  // WHY multiple useFetch calls?
  // Each manages its own loading/error state independently
  // Components stay focused on their specific data needs
  const { data: accounts, loading: accountsLoading } = useFetch('/accounts');
  const { data: recentTransactions, loading: transactionsLoading } = useFetch(
    '/transactions?limit=5'
  );

  // WHY early returns for loading states?
  // Cleaner than nested ternaries in JSX
  // Each state has its own clear rendering logic
  if (accountsLoading || transactionsLoading) {
    return <div className="loading-spinner">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      {/* WHY optional chaining in JSX? */}
      {/* User might not be loaded yet, prevents "Cannot read property" */}
      <header className="dashboard-header">
        <h1>Welcome, {user?.name || 'User'}</h1>
        <p className="dashboard-date">
          {formatDate(new Date())}
        </p>
      </header>

      <section className="accounts-summary">
        <h2>Account Overview</h2>
        {/* WHY conditional rendering with &&? */}
        {/* Renders empty state when no accounts exist */}
        {accounts?.length > 0 ? (
          <div className="account-cards">
            {accounts.map((account) => (
              <div key={account.id} className="account-card">
                <h3>{account.name}</h3>
                <p className="account-type">{account.type}</p>
                <p className="account-balance">
                  {formatCurrency(account.balance)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No accounts found.</p>
        )}
      </section>

      <section className="recent-transactions">
        <h2>Recent Transactions</h2>
        {recentTransactions?.length > 0 ? (
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{formatDate(tx.date)}</td>
                  <td>{tx.description}</td>
                  <td className={tx.amount >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(tx.amount)}
                  </td>
                  <td>
                    <span className={`status-${tx.status}`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">No recent transactions.</p>
        )}
      </section>
    </div>
  );
}
