/**
 * AccountList - React Component with Filtering and Pagination
 * 
 * LIST RENDERING in React:
 * - Use .map() to transform data array into JSX elements
 * - WHY key prop? React uses keys to identify which items changed
 *   → Enables efficient reconciliation (diffing algorithm)
 *   → Without keys, React re-renders entire list on any change
 *   → Keys should be stable, unique IDs (never use array index)
 * 
 * REACT.MEMO for performance:
 * - Memoizes component to prevent unnecessary re-renders
 * - Only re-renders when props change (shallow comparison)
 * - WHEN to use: List items, expensive components, callbacks passed down
 * - WHEN NOT to use: Simple components, infrequent re-renders
 * 
 * PERFORMANCE PATTERN:
 * - useMemo for expensive calculations
 * - useCallback for stable function references
 * - React.memo for preventing child re-renders
 * - Virtualized lists for 1000+ items (react-window)
 */
import React, { useState, useMemo } from 'react';
import { useFetch } from '../hooks/useFetch';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import { formatCurrency, formatDate } from '../utils/helpers';

// WHY React.memo?
// Prevents re-render when props haven't changed
// Parent re-renders (e.g., filter change) won't affect this if data is same
const AccountCard = React.memo(function AccountCard({ account }) {
  return (
    <div className="account-card">
      <h3>{account.name}</h3>
      <p className="account-type">{account.type}</p>
      <p className="account-balance">{formatCurrency(account.balance)}</p>
      <p className="account-number">****{account.number.slice(-4)}</p>
      <span className={`status-${account.status}`}>{account.status}</span>
    </div>
  );
});

export default function AccountList() {
  const [filter, setFilter] = useState('');
  const [accountType, setAccountType] = useState('all');
  
  // WHY debounce the search input?
  // Prevents API call on every keystroke
  // User types "savings" → only 1 API call after 300ms pause
  const debouncedFilter = useDebounce(filter, 300);
  
  // WHY construct URL with query params?
  // Server-side filtering is more efficient for large datasets
  // Client-side filtering is fine for small datasets
  const { data: accounts, loading, error } = useFetch(
    `/accounts?search=${debouncedFilter}&type=${accountType}`
  );

  // WHY useMemo for filtered accounts?
  // Only recalculates when accounts or filter changes
  // Prevents unnecessary work on every render
  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];
    return accounts.filter((account) => {
      const matchesSearch = account.name
        .toLowerCase()
        .includes(debouncedFilter.toLowerCase());
      const matchesType = accountType === 'all' || account.type === accountType;
      return matchesSearch && matchesType;
    });
  }, [accounts, debouncedFilter, accountType]);

  const pagination = usePagination(filteredAccounts.length, 6);

  // WHY slice for pagination?
  // Only renders visible items (virtual scrolling for large lists)
  const visibleAccounts = useMemo(() => {
    return filteredAccounts.slice(
      pagination.startIndex,
      pagination.endIndex + 1
    );
  }, [filteredAccounts, pagination.startIndex, pagination.endIndex]);

  if (loading) {
    return <div className="loading-spinner">Loading accounts...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="account-list">
      <h1>My Accounts</h1>
      
      {/* Filter controls */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search accounts..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="search-input"
        />
        <select
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
          className="type-filter"
        >
          <option value="all">All Types</option>
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
          <option value="credit">Credit Card</option>
        </select>
      </div>

      {/* WHY key={account.id}? */}
      {/* React needs stable identifiers for efficient updates */}
      <div className="accounts-grid">
        {visibleAccounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>

      {filteredAccounts.length === 0 && (
        <p className="empty-state">No accounts found matching your criteria.</p>
      )}

      {/* Pagination controls */}
      <div className="pagination">
        <button
          onClick={pagination.firstPage}
          disabled={!pagination.hasPrevPage}
        >
          First
        </button>
        <button
          onClick={pagination.prevPage}
          disabled={!pagination.hasPrevPage}
        >
          Previous
        </button>
        <span>
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
        <button
          onClick={pagination.nextPage}
          disabled={!pagination.hasNextPage}
        >
          Next
        </button>
        <button
          onClick={pagination.lastPage}
          disabled={!pagination.hasNextPage}
        >
          Last
        </button>
      </div>
    </div>
  );
}
