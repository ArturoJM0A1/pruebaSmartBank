/**
 * ============================================================================
 * Simple Reactive Store (State Management)
 * ============================================================================
 * 
 * PURPOSE:
 * Centralized state management for the application.
 * Instead of passing data through multiple levels of components,
 * we have a single source of truth (the store).
 * 
 * WHY STATE MANAGEMENT?
 * Problem: "Prop drilling" - passing data through many components
 * 
 * Component A (has data)
 *   → Component B (doesn't need data, passes it)
 *     → Component C (doesn't need data, passes it)
 *       → Component D (needs the data)
 * 
 * Solution: Store holds data, any component can access it directly
 * 
 * STATE MANAGEMENT PATTERNS:
 * 
 * 1. FLUX (Facebook):
 *    - Unidirectional data flow
 *    - Actions → Dispatcher → Store → View
 *    - Strict separation of concerns
 *    - Used by: Redux
 * 
 * 2. REDUX:
 *    - Single immutable state tree
 *    - Pure functions (reducers) for state changes
 *    - Actions describe "what happened"
 *    - Predictable state updates
 * 
 * 3. MOBX:
 *    - Observable state
 *    - Automatic reactivity
 *    - Mutable state with decorators
 *    - Less boilerplate than Redux
 * 
 * 4. VUEX/Pinia:
 *    - Module-based stores
 *    - Built-in devtools
 *    - Mutation/Action separation
 * 
 * 5. ZUSTAND (modern):
 *    - Minimal API
 *    - No boilerplate
 *    - Uses React hooks
 *    - Very popular in 2024-2026
 * 
 * 6. SIGNALS (latest trend):
 *    - Fine-grained reactivity
 *    - Used by: Angular, Solid.js, Preact
 *    - Very efficient (only update what changed)
 * 
 * OUR IMPLEMENTATION:
 * - Simple pub/sub (publish/subscribe) pattern
 * - Similar to a simplified Redux
 * - Good for learning, production apps would use Zustand
 * 
 * RELATED CONCEPTS:
 * - Pub/Sub pattern
 * - Observer pattern
 * - Immutable state
 * - Pure functions
 * - Single Source of Truth
 * ============================================================================
 */

/**
 * Predefined action types
 * 
 * WHY: Constants prevent typos and make actions searchable.
 * Similar to Redux action types.
 * 
 * CONCEPT: String constants as action identifiers
 * Instead of: store.dispatch('SET_USER', user)
 * We use: store.dispatch(ACTIONS.SET_USER, user)
 * - Autocomplete works
 * - Typos are caught
 * - Easy to find all usages
 */
export const ACTIONS = Object.freeze({
    // User actions
    SET_USER: 'SET_USER',
    CLEAR_USER: 'CLEAR_USER',
    
    // Account actions
    SET_ACCOUNTS: 'SET_ACCOUNTS',
    SET_CURRENT_ACCOUNT: 'SET_CURRENT_ACCOUNT',
    UPDATE_ACCOUNT_BALANCE: 'UPDATE_ACCOUNT_BALANCE',
    
    // Transaction actions
    SET_TRANSACTIONS: 'SET_TRANSACTIONS',
    ADD_TRANSACTION: 'ADD_TRANSACTION',
    
    // Notification actions
    SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
    ADD_NOTIFICATION: 'ADD_NOTIFICATION',
    SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
    
    // UI actions
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR',
    SET_THEME: 'SET_THEME',
    
    // Card actions
    SET_CARDS: 'SET_CARDS',
    
    // Beneficiary actions
    SET_BENEFICIARIES: 'SET_BENEFICIARIES',
    
    // Search actions
    SET_SEARCH_RESULTS: 'SET_SEARCH_RESULTS',
    SET_SEARCH_LOADING: 'SET_SEARCH_LOADING',
});

/**
 * Store Class - Centralized state management
 * 
 * CONCEPT: Singleton pattern
 * - Only one store instance for the entire app
 * - All components share the same state
 * 
 * CONCEPT: Map data structure
 * - Used to store listeners (subscriber callbacks)
 * - Map key: state key (e.g., 'user')
 * - Map value: Set of callback functions
 * - Efficient O(1) lookup and deletion
 */
class Store {
    constructor() {
        // Initial state
        this._state = {
            // User
            user: null,
            isAuthenticated: false,
            
            // Accounts
            accounts: [],
            currentAccount: null,
            
            // Transactions
            transactions: [],
            
            // Notifications
            notifications: [],
            unreadCount: 0,
            
            // Cards
            cards: [],
            
            // Beneficiaries
            beneficiaries: [],
            
            // Search
            searchResults: [],
            searchLoading: false,
            
            // UI
            loading: false,
            error: null,
            theme: 'light',
        };
        
        // Map of state keys to Sets of listener callbacks
        this._listeners = new Map();
        
        // Global listeners (called on any state change)
        this._globalListeners = new Set();
    }
    
    /**
     * getState - Get current state or specific key
     * 
     * WHY: Components read state through this method.
     * Provides a consistent API for accessing state.
     * 
     * CONCEPT: Getter pattern
     * - If no key provided, return entire state
     * - If key provided, return only that slice
     * 
     * @param {string} key - Optional state key
     * @returns {*} State value or entire state
     */
    getState(key) {
        if (key === undefined) {
            // Return a copy to prevent direct mutation
            return { ...this._state };
        }
        
        // Return a copy of the specific slice
        const value = this._state[key];
        if (Array.isArray(value)) {
            return [...value];
        }
        if (typeof value === 'object' && value !== null) {
            return { ...value };
        }
        return value;
    }
    
    /**
     * setState - Update state and notify listeners
     * 
     * WHY: This is the ONLY way to modify state.
     * All state changes go through here, ensuring:
     * 1. Consistent updates
     * 2. All listeners are notified
     * 3. State changes are traceable
     * 
     * CONCEPT: Spread operator for immutability
     * - {...this._state, [key]: value} creates a NEW object
     * - Original state is never modified
     * - This is called "immutable update"
     * 
     * @param {string|Object} key - State key or object of key-value pairs
     * @param {*} value - Value to set (if key is string)
     */
    setState(key, value) {
        if (typeof key === 'object') {
            // Batch update: setState({ user: userData, loading: false })
            const updates = key;
            
            // Create new state with all updates
            this._state = { ...this._state, ...updates };
            
            // Notify listeners for each changed key
            Object.keys(updates).forEach(k => {
                this._notifyListeners(k, updates[k]);
            });
        } else {
            // Single update: setState('user', userData)
            
            // Skip if value hasn't changed (optimization)
            if (this._state[key] === value) {
                return;
            }
            
            // Update state
            this._state = { ...this._state, [key]: value };
            
            // Notify listeners for this key
            this._notifyListeners(key, value);
        }
        
        // Notify global listeners
        this._notifyGlobalListeners();
    }
    
    /**
     * subscribe - Subscribe to state changes
     * 
     * WHY: Components need to know when state changes to re-render.
     * This is the Observer/Pub-Sub pattern.
     * 
     * CONCEPT: Listener registration
     * - Each key can have multiple listeners
     * - Listeners are stored in a Set (no duplicates)
     * - Returns unsubscribe function for cleanup
     * 
     * @param {string|Function} key - State key or callback for all changes
     * @param {Function} callback - Function to call on change
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        // If only one argument, subscribe to all changes
        if (typeof key === 'function') {
            callback = key;
            this._globalListeners.add(callback);
            
            return () => {
                this._globalListeners.delete(callback);
            };
        }
        
        // Initialize Set for this key if it doesn't exist
        if (!this._listeners.has(key)) {
            this._listeners.set(key, new Set());
        }
        
        // Add listener
        this._listeners.get(key).add(callback);
        
        // Return unsubscribe function
        return () => {
            const listeners = this._listeners.get(key);
            if (listeners) {
                listeners.delete(callback);
                
                // Clean up empty Sets
                if (listeners.size === 0) {
                    this._listeners.delete(key);
                }
            }
        };
    }
    
    /**
     * dispatch - Dispatch an action to update state
     * 
     * WHY: Actions describe WHAT happened, not HOW to update state.
     * This separation makes the code more predictable and testable.
     * 
     * CONCEPT: Action/Reducer pattern (simplified Redux)
     * - Action: { type: 'SET_USER', payload: userData }
     * - Reducer: Function that determines new state based on action
     * 
     * @param {string} action - Action type
     * @param {*} payload - Action data
     */
    dispatch(action, payload) {
        // Handle based on action type
        switch (action) {
            // User actions
            case ACTIONS.SET_USER:
                this.setState({
                    user: payload,
                    isAuthenticated: !!payload,
                });
                break;
                
            case ACTIONS.CLEAR_USER:
                this.setState({
                    user: null,
                    isAuthenticated: false,
                });
                break;
            
            // Account actions
            case ACTIONS.SET_ACCOUNTS:
                this.setState('accounts', payload);
                break;
                
            case ACTIONS.SET_CURRENT_ACCOUNT:
                this.setState('currentAccount', payload);
                break;
                
            case ACTIONS.UPDATE_ACCOUNT_BALANCE:
                const accounts = this.getState('accounts').map(acc => {
                    if (acc.id === payload.accountId) {
                        return { ...acc, balance: payload.balance };
                    }
                    return acc;
                });
                this.setState('accounts', accounts);
                break;
            
            // Transaction actions
            case ACTIONS.SET_TRANSACTIONS:
                this.setState('transactions', payload);
                break;
                
            case ACTIONS.ADD_TRANSACTION:
                const transactions = [payload, ...this.getState('transactions')];
                this.setState('transactions', transactions);
                break;
            
            // Notification actions
            case ACTIONS.SET_NOTIFICATIONS:
                this.setState('notifications', payload);
                break;
                
            case ACTIONS.ADD_NOTIFICATION:
                const notifications = [payload, ...this.getState('notifications')];
                this.setState({
                    notifications,
                    unreadCount: this.getState('unreadCount') + 1,
                });
                break;
                
            case ACTIONS.SET_UNREAD_COUNT:
                this.setState('unreadCount', payload);
                break;
            
            // Card actions
            case ACTIONS.SET_CARDS:
                this.setState('cards', payload);
                break;
            
            // Beneficiary actions
            case ACTIONS.SET_BENEFICIARIES:
                this.setState('beneficiaries', payload);
                break;
            
            // Search actions
            case ACTIONS.SET_SEARCH_RESULTS:
                this.setState('searchResults', payload);
                break;
                
            case ACTIONS.SET_SEARCH_LOADING:
                this.setState('searchLoading', payload);
                break;
            
            // UI actions
            case ACTIONS.SET_LOADING:
                this.setState('loading', payload);
                break;
                
            case ACTIONS.SET_ERROR:
                this.setState('error', payload);
                break;
                
            case ACTIONS.CLEAR_ERROR:
                this.setState('error', null);
                break;
                
            case ACTIONS.SET_THEME:
                this.setState('theme', payload);
                document.documentElement.setAttribute('data-theme', payload);
                break;
            
            default:
                console.warn(`Unknown action: ${action}`);
        }
    }
    
    /**
     * _notifyListeners - Notify listeners for a specific key
     * 
     * @private
     * @param {string} key - State key
     * @param {*} value - New value
     */
    _notifyListeners(key, value) {
        const listeners = this._listeners.get(key);
        
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(value, key);
                } catch (error) {
                    console.error(`Error in listener for key "${key}":`, error);
                }
            });
        }
    }
    
    /**
     * _notifyGlobalListeners - Notify all global listeners
     * 
     * @private
     */
    _notifyGlobalListeners() {
        this._globalListeners.forEach(callback => {
            try {
                callback(this._state);
            } catch (error) {
                console.error('Error in global listener:', error);
            }
        });
    }
    
    /**
     * reset - Reset store to initial state
     * 
     * WHY: Useful for logout - clear all data
     */
    reset() {
        this._state = {
            user: null,
            isAuthenticated: false,
            accounts: [],
            currentAccount: null,
            transactions: [],
            notifications: [],
            unreadCount: 0,
            cards: [],
            beneficiaries: [],
            searchResults: [],
            searchLoading: false,
            loading: false,
            error: null,
            theme: 'light',
        };
        
        // Notify all listeners of the reset
        this._listeners.forEach((listeners, key) => {
            this._notifyListeners(key, this._state[key]);
        });
        
        this._notifyGlobalListeners();
    }
}

/**
 * Create and export a singleton store instance
 * 
 * WHY singleton? Same state shared across entire app.
 */
const store = new Store();

export default store;