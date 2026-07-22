# Lesson 3: JavaScript Deep Dive

## What You Learned

- Closures and their practical uses
- Async patterns (Promises, async/await)
- Array methods (map, filter, reduce)
- ES6+ features (destructuring, spread, optional chaining)
- Event loop and asynchronous execution

---

## Why It Was Done This Way

### Closures for State Management
```javascript
// SmartBank debounce - uses closure to remember timeoutId
function debounce(func, delay) {
  let timeoutId; // Closed over
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
```

**Why closures?**
- Encapsulate private state
- Create function factories
- Implement callbacks with context

### Array Methods for Data Transformation
```javascript
// Transform API data for display
const summary = transactions
  .filter(t => t.type === 'transfer')
  .map(t => ({
    ...t,
    displayAmount: formatCurrency(t.amount)
  }))
  .reduce((acc, t) => acc + t.amount, 0);
```

**Why functional approach?**
- Declarative (what to do, not how)
- Chainable operations
- Easier to test (pure functions)

### Async/Await for API Calls
```javascript
// Clean async code
async function loadDashboard() {
  try {
    const accounts = await fetchAccounts();
    const transactions = await fetchTransactions();
    updateUI({ accounts, transactions });
  } catch (error) {
    showError(error.message);
  }
}
```

**Why async/await over .then()?**
- More readable (synchronous-looking code)
- Easier error handling (try/catch)
- Better debugging (stack traces)

---

## Common Mistakes

1. **Not understanding closures**
   - Mistake: Variable captured by reference
   - Fix: Understand lexical scope

2. **Async/await anti-patterns**
   - Mistake: Sequential awaits when parallel is possible
   - Fix: Use Promise.all for independent operations

3. **Array method misuse**
   - Mistake: Using forEach when you need map
   - Fix: Use map to transform, forEach for side effects

4. **Forgetting return in arrow functions**
   - Mistake: `() => { value }` returns undefined
   - Fix: `() => value` or explicit return

---

## Interview Questions

**Q: Explain closures with a practical example.**

A: A closure is a function that remembers its outer scope:
```javascript
function createCounter() {
  let count = 0; // Private variable
  return {
    increment: () => ++count,
    getCount: () => count
  };
}
const counter = createCounter();
counter.increment();
counter.getCount(); // 1
```

**Q: What is the difference between map and forEach?**

A:
- `map`: Returns new array, transforms elements
- `forEach`: Returns undefined, performs side effects

**Q: How does the event loop handle Promises?**

A: Promises use microtask queue:
1. Promise executor runs synchronously
2. `.then()` callbacks go to microtask queue
3. Microtasks run after current task completes
4. Microtasks have priority over macrotasks (setTimeout)

---

## Practice Exercises

1. **Implement debounce and throttle**
   - Create debounce function from scratch
   - Create throttle function from scratch
   - Test with input events

2. **Data transformation**
   - Take API response data
   - Transform for display using array methods
   - Handle edge cases (null, undefined, empty arrays)

3. **Async patterns**
   - Create retry function for failed requests
   - Implement request cancellation
   - Add timeout to fetch calls
