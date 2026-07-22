/**
 * usePagination - Pagination State Management Hook
 * 
 * STATE MACHINE PATTERN:
 * Pagination is a finite state machine with states:
 * - idle: Initial state, no data loaded
 * - loading: Fetching data for current page
 * - loaded: Data available, can navigate
 * - error: Fetch failed, can retry
 * 
 * WHY encapsulate pagination in a hook?
 * - Pagination logic is repeated across many list components
 * - Encapsulates: currentPage, pageSize, totalPages, navigation
 * - Handles edge cases: first page, last page, empty results
 * - Easy to test the pagination logic in isolation
 * 
 * STATE TRANSITIONS:
 * idle → loading → loaded
 * loaded → loading → loaded (next/prev page)
 * loaded/error → loading → loaded/error (retry)
 */
import { useState, useCallback, useMemo } from 'react';

export function usePagination(totalItems = 0, initialPageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // WHY useMemo for computed values?
  // Prevents recalculation on every render
  // Only recalculates when dependencies change
  const totalPages = useMemo(
    () => Math.ceil(totalItems / pageSize),
    [totalItems, pageSize]
  );

  const startIndex = useMemo(
    () => (currentPage - 1) * pageSize,
    [currentPage, pageSize]
  );

  const endIndex = useMemo(
    () => Math.min(startIndex + pageSize - 1, totalItems - 1),
    [startIndex, pageSize, totalItems]
  );

  // WHY useCallback for handlers?
  // Stable references prevent unnecessary child re-renders
  const goToPage = useCallback(
    (page) => {
      const pageNumber = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(pageNumber);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const firstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const lastPage = useCallback(() => {
    goToPage(totalPages);
  }, [goToPage, totalPages]);

  const changePageSize = useCallback(
    (newSize) => {
      setPageSize(newSize);
      // Reset to first page when page size changes
      // WHY? Current position might be invalid with new page size
      setCurrentPage(1);
    },
    []
  );

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    changePageSize,
  };
}
