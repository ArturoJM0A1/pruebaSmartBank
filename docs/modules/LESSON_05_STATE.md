# Lesson 5: State Management

## What You Learned

- Local vs global state
- State management patterns
- Store implementation
- Subscriptions and updates
- Immutable state updates

---

## Why It Was Done This Way

### Custom Store Pattern
```javascript
function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    getState: () => state,
    setState: (newState) => {
      state = { ...state, ...newState };
      listeners.forEach(listener => listener(state));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
```

**Why custom store?**
- Educational (understand how Redux works)
- Lightweight (no external dependencies)
- Flexible (customize for project needs)

### Immutable Updates
```javascript
// Wrong: Mutates state
state.balance = 5000;

// Correct: Creates new state
setState({ balance: 5000 });

// Wrong: Nested mutation
state.account.balance = 5000;

// Correct: Spread nested objects
setState({
  account: { ...state.account, balance: 5000 }
});
```

**Why immutable?**
- Predictable changes
- Easy to track history
- Prevents unexpected side effects

### Subscriptions for Reactivity
```javascript
// Component subscribes to state changes
const unsubscribe = store.subscribe((newState) => {
  updateUI(newState);
});

// Cleanup on unmount
useEffect(() => {
  return unsubscribe;
}, []);
```

**Why subscriptions?**
- Components stay in sync
- Automatic re-rendering
- Decoupled architecture

---

## Common Mistakes

1. **Mutating state directly**
   - Mistake: `state.items.push(item)`
   - Fix: `setState({ items: [...state.items, item] })`

2. **Not unsubscribing**
   - Mistake: Forgetting to unsubscribe from store
   - Fix: Always return cleanup function

3. **Overusing global state**
   - Mistake: Putting everything in global store
   - Fix: Use local state for UI-only data

4. **Complex state logic**
   - Mistake: Giant reducer with 100+ cases
   - Fix: Split into multiple reducers/stores

---

## Interview Questions

**Q: When should you use local vs global state?**

A:
- **Local state**: UI-specific (form inputs, modals, toggles)
- **Global state**: Shared data (user, accounts, theme)

**Q: What is the difference between Redux and Context API?**

A:
- **Redux**: Full-featured (middleware, devtools, time-travel)
- **Context API**: Simple (built-in, no extra dependencies)

**Q: How do you handle complex state updates?**

A:
- Use reducer pattern for complex logic
- Split state into smaller pieces
- Use middleware for async operations

---

## Practice Exercises

1. **Build a shopping cart**
   - Implement add/remove/update actions
   - Handle quantity changes
   - Calculate totals

2. **Add undo/redo functionality**
   - Store state history
   - Implement undo/redo actions
   - Track current position

3. **Implement persistence**
   - Save state to localStorage
   - Load state on app start
   - Handle storage errors
