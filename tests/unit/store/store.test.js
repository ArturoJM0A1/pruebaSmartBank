/**
 * ============================================================================
 * SMARTBANK - UNIT TESTS: State Management (Store)
 * ============================================================================
 * 
 * PURPOSE: Test the centralized state management system.
 * 
 * WHAT IS STATE MANAGEMENT?
 *   - A single source of truth for application data.
 *   - Components read from and write to the store.
 *   - When state changes, all subscribed components update.
 * 
 * WHY TEST THE STORE?
 *   - The store holds ALL app state. A bug here corrupts everything.
 *   - State updates must be predictable and traceable.
 *   - Concurrent updates must not cause race conditions.
 * 
 * STATE MANAGEMENT PATTERNS:
 *   - Redux (React): Actions → Reducers → State
 *   - Vuex/Pinia (Vue): State, Getters, Mutations, Actions
 *   - Zustand, Jotai, Recoil: Modern alternatives
 *   - Custom Store (SmartBank): Simple, educational implementation
 * 
 * ============================================================================
 */

'use strict';

// ============================================================================
// STORE IMPLEMENTATION (simplified for testing)
// ============================================================================

function createStore(initialState = {}) {
  let state = { ...initialState };
  const listeners = new Set();

  return {
    getState: () => ({ ...state }),

    setState: (partial) => {
      const prevState = { ...state };
      state = { ...state, ...partial };
      listeners.forEach((listener) => listener(state, prevState));
    },

    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    dispatch: (action) => {
      if (typeof action === 'function') {
        action(store.dispatch, store.getState);
      } else if (action && action.type) {
        // Simple reducer pattern
        store.setState(action.payload);
      }
    },
  };
}

// We need to reference the store inside itself for dispatch
let store;

function createAppStore(initialState = {}) {
  store = createStore(initialState);
  return store;
}

// ============================================================================
// TESTS
// ============================================================================

describe('Store', () => {
  let store;

  beforeEach(() => {
    store = createAppStore({
      user: null,
      accounts: [],
      balance: 0,
      isLoading: false,
    });
  });

  // WHAT: Initial state is set correctly
  // WHY: Store must start with the expected default values.
  it('should have correct initial state', () => {
    const state = store.getState();

    expect(state.user).toBeNull();
    expect(state.accounts).toEqual([]);
    expect(state.balance).toBe(0);
    expect(state.isLoading).toBe(false);
  });

  // WHAT: setState updates state correctly
  // WHY: This is the primary way components update state.
  it('should update state with setState', () => {
    store.setState({ user: { id: 1, name: 'Juan' } });

    const state = store.getState();
    expect(state.user).toEqual({ id: 1, name: 'Juan' });
    // Other properties should remain unchanged
    expect(state.accounts).toEqual([]);
  });

  // WHAT: getState returns a copy, not reference
  // WHY: Prevents external code from mutating state directly.
  it('should return a copy of state (immutability)', () => {
    const state1 = store.getState();
    const state2 = store.getState();

    // Should be equal in value but different references
    expect(state1).toEqual(state2);
    expect(state1).not.toBe(state2);
  });

  // WHAT: setState triggers subscriber notifications
  // WHY: Components need to re-render when state changes.
  it('should notify subscribers on state change', () => {
    const listener = jest.fn();
    store.subscribe(listener);

    store.setState({ balance: 5000 });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ balance: 5000 }),
      expect.any(Object) // Previous state
    );
  });

  // WHAT: Multiple subscribers are all notified
  // WHY: Multiple components can subscribe to the same state.
  it('should notify multiple subscribers', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    store.subscribe(listener1);
    store.subscribe(listener2);

    store.setState({ isLoading: true });

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  // WHAT: Unsubscribe stops notifications
  // WHY: When a component unmounts, it shouldn't receive updates.
  it('should stop notifying after unsubscribe', () => {
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);

    store.setState({ balance: 1000 });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe(); // Stop listening

    store.setState({ balance: 2000 });
    expect(listener).toHaveBeenCalledTimes(1); // Still 1
  });

  // WHAT: Multiple state updates trigger multiple notifications
  it('should notify on each setState call', () => {
    const listener = jest.fn();
    store.subscribe(listener);

    store.setState({ balance: 1000 });
    store.setState({ balance: 2000 });
    store.setState({ balance: 3000 });

    expect(listener).toHaveBeenCalledTimes(3);
  });

  // WHAT: Partial state updates merge correctly
  // WHY: setState should only update specified properties.
  it('should merge partial state updates', () => {
    store.setState({ user: { id: 1 } });
    store.setState({ balance: 5000 });

    const state = store.getState();
    expect(state.user).toEqual({ id: 1 });
    expect(state.balance).toBe(5000);
  });
});
