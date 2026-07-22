# JavaScript Concepts Guide - SmartBank

A comprehensive guide to JavaScript concepts with practical examples from the SmartBank project.

---

## 1. Hoisting

**Definition**: JavaScript moves declarations to the top of their scope during compilation.

**Code Example from SmartBank**:
```javascript
// Function declarations are hoisted (available before declaration)
console.log(formatCurrency(100)); // Works! Returns "$100.00"

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

// Variable declarations (var) are hoisted but NOT initialized
console.log(myVar); // undefined (not ReferenceError)
var myVar = 'SmartBank';

// let/const are hoisted but NOT initialized (TDZ)
// console.log(myLet); // ReferenceError: Cannot access before initialization
let myLet = 'Bank';
```

**Common Pitfalls**:
- `var` hoisting causes unexpected `undefined` values
- `let`/`const` Temporal Dead Zone (TDZ) prevents accidental use

**Interview Question**: What is the difference between `var`, `let`, and `const` regarding hoisting?

**Practice Exercise**: Predict the output of this code:
```javascript
console.log(a);
var a = 1;
console.log(b);
let b = 2;
```

---

## 2. Scope

**Definition**: The context where variables are accessible.

**Code Example from SmartBank**:
```javascript
// Global scope
const API_URL = 'https://api.smartbank.com';

function login() {
  // Function scope
  const token = 'abc123';

  if (true) {
    // Block scope
    const message = 'Login successful';
    var legacyVar = 'I leak out!';
  }

  // console.log(message); // ReferenceError
  console.log(legacyVar); // Works! var ignores block scope
}
```

**Common Pitfalls**:
- `var` ignores block scope, `let`/`const` respect it
- Closures capture variables by reference

**Interview Question**: Explain the difference between function scope and block scope.

**Practice Exercise**: Create a counter with proper scoping.

---

## 3. Closures

**Definition**: A function that remembers variables from its outer scope.

**Code Example from SmartBank** (debounce):
```javascript
function debounce(func, delay) {
  let timeoutId; // This variable is "closed over"

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// Usage: search input
const searchInput = document.querySelector('#search');
const handleSearch = debounce((term) => {
  fetch(`/api/search?q=${term}`);
}, 300);

searchInput.addEventListener('input', (e) => {
  handleSearch(e.target.value);
});
```

**Common Pitfalls**:
- Memory leaks if closures hold references
- Unexpected variable mutation

**Interview Question**: How does debounce use closures? Why is this useful?

**Practice Exercise**: Implement a throttle function using closures.

---

## 4. Event Loop

**Definition**: The mechanism that handles asynchronous operations in JavaScript.

**Code Example from SmartBank**:
```javascript
console.log('1: Start');

setTimeout(() => {
  console.log('2: Timeout'); // Macro task
}, 0);

Promise.resolve().then(() => {
  console.log('3: Promise'); // Micro task
});

console.log('4: End');

// Output: 1, 4, 3, 2
// Why? Micro tasks (Promise) run before macro tasks (setTimeout)
```

**Common Pitfalls**:
- Micro tasks run before macro tasks
- `setTimeout(fn, 0)` doesn't mean "run immediately"

**Interview Question**: What is the difference between microtasks and macrotasks?

**Practice Exercise**: Predict the execution order of nested async operations.

---

## 5. This Keyword

**Definition**: The execution context of a function.

**Code Example from SmartBank**:
```javascript
const account = {
  name: 'Savings',
  balance: 10000,

  // Method: this = account
  getBalance() {
    return this.balance;
  },

  // Arrow function: this = surrounding context (not account)
  getBalanceArrow: () => {
    return this.balance; // undefined! Arrow doesn't bind this
  },

  // Constructor: this = new object
  static create(name, balance) {
    return { name, balance };
  }
};

// Explicit binding
function formatBalance(currency) {
  return `${currency} ${this.balance}`;
}

const usdAccount = { balance: 5000 };
formatBalance.call(usdAccount, 'USD'); // "USD 5000"
```

**Common Pitfalls**:
- Arrow functions don't have their own `this`
- Losing `this` in callbacks

**Interview Question**: What are the four ways to bind `this`?

**Practice Exercise**: Fix the `this` binding in this callback:
```javascript
const user = {
  name: 'Juan',
  greet() {
    setTimeout(function() {
      console.log(`Hello, ${this.name}`); // undefined
    }, 100);
  }
};
```

---

## 6. Arrow Functions

**Definition**: Concise function syntax with lexical `this`.

**Code Example from SmartBank**:
```javascript
// Traditional function
function add(a, b) {
  return a + b;
}

// Arrow function
const addArrow = (a, b) => a + b;

// Single parameter (no parens needed)
const double = x => x * 2;

// No parameters
const greet = () => 'Hello!';

// Multi-line body
const processTransaction = (amount, type) => {
  const fee = type === 'transfer' ? 10 : 0;
  return amount - fee;
};

// When NOT to use arrow functions:
const account = {
  balance: 1000,
  // Arrow function loses 'this'
  getBalance: () => this.balance, // undefined!
  // Regular function works
  getBalanceCorrect() {
    return this.balance; // 1000
  }
};
```

**Common Pitfalls**:
- No `arguments` object in arrow functions
- Can't use as constructors
- `this` is lexical (surrounding scope)

**Interview Question**: When should you NOT use arrow functions?

**Practice Exercise**: Convert this function to arrow syntax:
```javascript
function fetchData(url) {
  return fetch(url).then(response => response.json());
}
```

---

## 7. Modules (ES Modules)

**Definition**: Organize code into separate, reusable files.

**Code Example from SmartBank**:
```javascript
// utils/helpers.js (export)
export function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

// Default export
export default class AuthService {
  login() { /* ... */ }
}

// app.js (import)
import AuthService, { formatCurrency, formatDate } from './utils/helpers.js';

// Dynamic import (code splitting)
async function loadDashboard() {
  const { DashboardComponent } = await import('./components/Dashboard.js');
  return new DashboardComponent();
}
```

**Common Pitfalls**:
- Circular imports
- Import order matters
- Named vs default exports

**Interview Question**: What is the difference between named and default exports?

**Practice Exercise**: Create a module that exports multiple utility functions.

---

## 8. Promises

**Definition**: Objects representing eventual completion of async operations.

**Code Example from SmartBank**:
```javascript
// Creating a promise
function fetchAccounts() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const accounts = [
        { id: 1, balance: 5000 },
        { id: 2, balance: 10000 }
      ];
      resolve(accounts); // Success
      // reject(new Error('Network error')); // Failure
    }, 1000);
  });
}

// Chaining promises
fetchAccounts()
  .then(accounts => accounts.filter(a => a.balance > 5000))
  .then(filtered => console.log(filtered))
  .catch(error => console.error(error))
  .finally(() => console.log('Done'));

// Promise.all - all must succeed
Promise.all([fetchAccounts(), fetchCards()])
  .then(([accounts, cards]) => {
    console.log(accounts, cards);
  })
  .catch(error => {
    console.error('One failed:', error);
  });

// Promise.race - first to settle wins
Promise.race([
  fetch('/api/fast'),
  fetch('/api/slow')
]).then(fastest => console.log(fastest));
```

**Common Pitfalls**:
- Unhandled promise rejections
- Not returning promises in chains
- Mixing callbacks and promises

**Interview Question**: What is the difference between `Promise.all` and `Promise.allSettled`?

**Practice Exercise**: Create a function that retries a failed promise 3 times.

---

## 9. Async/Await

**Definition**: Syntactic sugar over Promises for cleaner async code.

**Code Example from SmartBank**:
```javascript
// Async/await syntax
async function login(email, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error; // Re-throw for caller to handle
  }
}

// Parallel execution
async function loadDashboard() {
  const [accounts, transactions, notifications] = await Promise.all([
    fetchAccounts(),
    fetchTransactions(),
    fetchNotifications()
  ]);

  return { accounts, transactions, notifications };
}
```

**Common Pitfalls**:
- Sequential awaits when parallel is possible
- Not handling errors properly
- Using await in loops (slow)

**Interview Question**: How do you handle errors in async/await?

**Practice Exercise**: Refactor this Promise chain to async/await:
```javascript
fetchUser(id)
  .then(user => fetchOrders(user.id))
  .then(orders => processOrders(orders))
  .catch(handleError);
```

---

## 10. Array Methods

### map, filter, reduce

**Code Example from SmartBank**:
```javascript
const transactions = [
  { id: 1, amount: -100, type: 'transfer' },
  { id: 2, amount: 500, type: 'deposit' },
  { id: 3, amount: -200, type: 'payment' },
];

// map: Transform each item
const descriptions = transactions.map(t =>
  `${t.type}: $${Math.abs(t.amount)}`
);

// filter: Keep items that match
const expenses = transactions.filter(t => t.amount < 0);

// reduce: Accumulate into single value
const totalBalance = transactions.reduce((sum, t) => sum + t.amount, 0);

// Chaining
const summary = transactions
  .filter(t => t.type === 'transfer')
  .map(t => ({ ...t, absoluteAmount: Math.abs(t.amount) }))
  .reduce((acc, t) => acc + t.absoluteAmount, 0);
```

### find, findIndex, some, every

```javascript
const accounts = [
  { id: 1, type: 'savings', balance: 5000 },
  { id: 2, type: 'checking', balance: 1000 },
  { id: 3, type: 'savings', balance: 15000 },
];

// find: First match
const savingsAccount = accounts.find(a => a.type === 'savings');

// findIndex: Position of first match
const checkingIndex = accounts.findIndex(a => a.type === 'checking');

// some: Any item matches?
const hasHighBalance = accounts.some(a => a.balance > 10000);

// every: All items match?
const allSavings = accounts.every(a => a.type === 'savings');
```

### flat, flatMap, sort

```javascript
// flat: Flatten nested arrays
const nested = [[1, 2], [3, 4], [5]];
const flat = nested.flat(); // [1, 2, 3, 4, 5]

// flatMap: Map + flatten
const transactions = [
  { id: 1, items: ['coffee', 'lunch'] },
  { id: 2, items: ['dinner'] }
];
const allItems = transactions.flatMap(t => t.items);

// sort: Order items
const sorted = [...accounts].sort((a, b) => b.balance - a.balance);
```

**Common Pitfalls**:
- `sort` mutates the original array
- `map` doesn't skip undefined/null
- `reduce` needs initial value

**Interview Question**: When would you use `reduce` instead of `map` + `filter`?

**Practice Exercise**: Calculate the average balance of all savings accounts.

---

## 11. Destructuring

**Definition**: Extract values from arrays/objects into variables.

**Code Example from SmartBank**:
```javascript
// Object destructuring
const user = {
  firstName: 'Juan',
  lastName: 'Pérez',
  email: 'juan@email.com',
  preferences: { currency: 'MXN' }
};

const { firstName, lastName } = user;
const { email: userEmail } = user; // Rename
const { phone = 'N/A' } = user; // Default value

// Nested destructuring
const { preferences: { currency } } = user;

// Array destructuring
const [first, second] = [1, 2, 3];
const [, , third] = [1, 2, 3]; // Skip first two

// Function parameter destructuring
function createTransfer({ from, to, amount, concept = '' }) {
  return { from, to, amount, concept };
}

// Swap variables
let a = 1, b = 2;
[a, b] = [b, a]; // a=2, b=1
```

**Common Pitfalls**:
- Forgetting default values
- Destructuring null/undefined throws errors

**Interview Question**: How does destructuring work with default values?

**Practice Exercise**: Destructure this nested object:
```javascript
const data = {
  user: { name: 'Juan', account: { balance: 1000 } }
};
```

---

## 12. Spread/Rest Operators

**Definition**: `...` expands (spread) or collects (rest) elements.

**Code Example from SmartBank**:
```javascript
// Spread: Expand arrays/objects
const accounts = [acc1, acc2];
const allAccounts = [...accounts, acc3]; // Add to array

const userDefaults = { theme: 'light', currency: 'MXN' };
const userPrefs = { ...userDefaults, theme: 'dark' }; // Override

// Spread: Copy (shallow)
const accountsCopy = [...accounts];

// Rest: Collect into array
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}
sum(1, 2, 3, 4); // 10

// Rest: Collect remaining properties
const { id, ...rest } = { id: 1, name: 'Juan', email: 'j@e.com' };
// rest = { name: 'Juan', email: 'j@e.com' }
```

**Common Pitfalls**:
- Spread is shallow (nested objects still shared)
- Rest must be last parameter

**Interview Question**: What is the difference between spread and rest?

**Practice Exercise**: Create a function that accepts any number of account IDs.

---

## 13. Optional Chaining (?.)

**Definition**: Safely access nested properties without errors.

**Code Example from SmartBank**:
```javascript
const user = {
  name: 'Juan',
  address: {
    city: 'CDMX'
  }
};

// Without optional chaining
const city = user && user.address && user.address.city;

// With optional chaining
const city = user?.address?.city; // 'CDMX'

// With method calls
const result = user?.getBalance?.();

// With arrays
const firstItem = user?.transactions?.[0];

// Short-circuit evaluation
const name = user?.name ?? 'Unknown';
```

**Common Pitfalls**:
- Doesn't prevent all null references
- Can mask errors if overused

**Interview Question**: When should you use optional chaining vs explicit checks?

**Practice Exercise**: Safely access this deeply nested object:
```javascript
const data = {
  response: {
    user: {
      account: {
        transactions: [{}]
      }
    }
  }
};
```

---

## 14. Nullish Coalescing (??)

**Definition**: Provides default value only for `null` or `undefined`.

**Code Example from SmartBank**:
```javascript
const balance = 0;
const defaultBalance = 1000;

// Logical OR (treats 0 as falsy)
const result1 = balance || defaultBalance; // 1000 (wrong!)

// Nullish Coalescing (only null/undefined trigger default)
const result2 = balance ?? defaultBalance; // 0 (correct!)

// With optional chaining
const name = user?.name ?? 'Anonymous';
```

**Common Pitfalls**:
- Don't mix with `||` without understanding the difference
- `??` cannot be mixed with `||` or `&&` without parentheses

**Interview Question**: When would you use `??` instead of `||`?

**Practice Exercise**: Fix this code to handle zero balances correctly:
```javascript
function getDisplayBalance(balance) {
  return balance || 'No balance';
}
```

---

## Quick Reference

| Concept | Pattern | SmartBank Use |
|---------|---------|---------------|
| Hoisting | `var` vs `let` | Variable declarations |
| Scope | Block scope | Loop variables |
| Closures | `debounce`, `throttle` | Search input |
| Event Loop | `setTimeout`, `Promise` | API calls |
| This | Method binding | Component methods |
| Arrow Functions | Lexical this | Callbacks |
| Modules | `import/export` | File organization |
| Promises | `.then()/.catch()` | Async operations |
| Async/Await | `async/await` | API services |
| Array Methods | `map/filter/reduce` | Data transformation |
| Destructuring | `const { a } = obj` | Props, config |
| Spread/Rest | `...` | Immutability |
| Optional Chaining | `?.` | Safe access |
| Nullish Coalescing | `??` | Default values |
