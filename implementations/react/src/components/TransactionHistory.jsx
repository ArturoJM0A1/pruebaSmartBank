/**
 * TransactionHistory - React Component with Performance Optimizations
 * 
 * PERFORMANCE PATTERNS explained:
 * 
 * 1. React.memo(Component):
 *    - Wraps component to skip re-renders if props haven't changed
 *    - Shallow comparison of props by default
 *    - Use custom comparator for complex props
 * 
 * 2. useMemo(() => value, [deps]):
 *    - Caches expensive calculations
 *    - Returns same reference if deps haven't changed
 *    - Use for: filtering, sorting, data transformation
 * 
 * 3. useCallback(() => fn, [deps]):
 *    - Caches function reference
 *    - Prevents child re-renders when passing callbacks
 *    - Use when: passing to memoized children, useEffect deps
 * 
 * WHEN NOT to optimize:
 * - Premature optimization is the root of all evil
 * - Profile first, optimize what's actually slow
 * - Simple components don't need memo
 * - Readability > micro-optimization
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useFetch } from '../hooks/useFetch';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency, formatDate } from '../utils/helpers';

// WHY React.memo for list items?
// Prevents re-render of all items when only one changes
// Significant performance gain for long lists
const TransactionRow = React.memo(function TransactionRow({ transaction }) {
  return (
    <tr>
      <td>{formatDate(transaction.date)}</td>
      <td>{transaction.description}</td>
      <td>{transaction.fromAccount}</td>
      <td>{transaction.toAccount}</td>
      <td className={transaction.amount >= 0 ? 'positive' : 'negative'}>
        {formatCurrency(transaction.amount)}
      </td>
      <td>
        <span className={`status-${transaction.status}`}>
          {transaction.status}
        </span>
      </td>
    </tr>
  );
});

export default function TransactionHistory() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Debounce filter changes to avoid excessive API calls
  const debouncedMinAmount = useDebounce(minAmount, 500);
  const debouncedMaxAmount = useDebounce(maxAmount, 500);

  const { data: transactions, loading, error } = useFetch(
    `/transactions?from=${dateFrom}&to=${dateTo}&minAmount=${debouncedMinAmount}&maxAmount=${debouncedMaxAmount}`
  );

  // WHY useMemo for sorting?
  // Sorting is O(n log n) - expensive for large arrays
  // useMemo prevents recalculation on every render
  const sortedTransactions = useMemo(() => {
    if (!transactions) return [];
    
    return [...transactions].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [transactions, sortBy, sortOrder]);

  // WHY useCallback for event handlers passed as props?
  // Prevents unnecessary child re-renders
  // Child components re-render when parent re-renders if fn reference changes
  const handleSort = useCallback((field) => {
    setSortBy((prev) => {
      if (prev === field) {
        setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortOrder('asc');
      return field;
    });
  }, []);

  if (loading) {
    return <div className="loading-spinner">Loading transactions...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="transaction-history">
      <h1>Transaction History</h1>
      
      {/* Filter controls */}
      <div className="filters">
        <div className="filter-group">
          <label>From:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>To:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Min Amount:</label>
          <input
            type="number"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="filter-group">
          <label>Max Amount:</label>
          <input
            type="number"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            placeholder="∞"
          />
        </div>
      </div>

      {/* Transaction table */}
      <table className="transactions-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('date')}>
              Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('description')}>
              Description {sortBy === 'description' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th>From</th>
            <th>To</th>
            <th onClick={() => handleSort('amount')}>
              Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedTransactions.map((tx) => (
            <TransactionRow key={tx.id} transaction={tx} />
          ))}
        </tbody>
      </table>

      {sortedTransactions.length === 0 && (
        <p className="empty-state">No transactions found.</p>
      )}
    </div>
  );
}
