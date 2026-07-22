# Interview Questions - SmartBank

Common interview questions related to concepts used in the SmartBank project.

---

## JavaScript Fundamentals

### Q1: What is closure and how is it used in SmartBank?

**Answer**: A closure is a function that remembers variables from its outer scope. SmartBank uses closures in:
- `debounce()` - remembers the timeout ID
- `throttle()` - remembers the last execution time
- Event handlers - remembers the callback context

```javascript
// SmartBank debounce example
function debounce(func, delay) {
  let timeoutId; // Closed over
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
```

### Q2: Explain the difference between `==` and `===`

**Answer**: 
- `==`: Loose equality, performs type coercion (`5 == '5'` is true)
- `===`: Strict equality, no type coercion (`5 === '5'` is false)

**SmartBank reference**: Validators always use `===` to prevent type coercion bugs.

### Q3: What is the event loop?

**Answer**: The event loop handles asynchronous operations in JavaScript:
1. Call stack executes synchronous code
2. Web APIs handle async operations (fetch, setTimeout)
3. Callback queue holds completed callbacks
4. Microtask queue (Promises) has priority over callback queue

**SmartBank reference**: API calls use async/await which leverages the event loop.

### Q4: Explain `this` binding rules

**Answer**:
1. **Default**: Global object (or `undefined` in strict mode)
2. **Implicit**: Object method (`obj.method()` → `this = obj`)
3. **Explicit**: `call()`, `apply()`, `bind()`
4. **Arrow**: Lexical (surrounding scope)

**SmartBank reference**: Component methods use regular functions for proper `this` binding.

### Q5: What are Promises and how do they work?

**Answer**: Promises represent eventual completion of async operations:
- `pending`: Initial state
- `fulfilled`: Operation completed successfully
- `rejected`: Operation failed

```javascript
// SmartBank API call example
fetch('/api/accounts')
  .then(response => response.json())
  .then(data => updateUI(data))
  .catch(error => showError(error));
```

### Q6: Explain async/await

**Answer**: Syntactic sugar over Promises for cleaner async code:
- `async`: Function returns a Promise
- `await`: Pauses execution until Promise settles

```javascript
// SmartBank login example
async function login(email, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}
```

### Q7: What is hoisting?

**Answer**: JavaScript moves declarations to the top of their scope:
- `var`: Hoisted and initialized to `undefined`
- `let`/`const`: Hoisted but not initialized (TDZ)
- Function declarations: Fully hoisted
- Function expressions: Not hoisted

### Q8: Difference between `let`, `const`, and `var`?

**Answer**:
- `var`: Function-scoped, hoisted, can be redeclared
- `let`: Block-scoped, hoisted, cannot be redeclared
- `const`: Block-scoped, hoisted, cannot be reassigned or redeclared

**SmartBank reference**: Uses `const` for constants, `let` for variables, avoids `var`.

### Q9: What is destructuring?

**Answer**: Extract values from arrays/objects into variables:

```javascript
// Object destructuring
const { firstName, lastName } = user;

// Array destructuring
const [first, second] = accounts;

// Nested destructuring
const { account: { balance } } = userData;
```

### Q10: Explain spread vs rest operators

**Answer**:
- **Spread (`...`)**: Expands arrays/objects
- **Rest (`...`)**: Collects into array

```javascript
// Spread: copy object
const copy = { ...original };

// Rest: collect parameters
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b);
}
```

---

## React/Vue/Angular Comparison

### Q11: How does state management differ between React and Vue?

**Answer**:
- **React**: useState, useReducer, Context API, Redux
- **Vue**: reactive(), ref(), Vuex/Pinia
- **Angular**: Services with RxJS, NgRx

**SmartBank reference**: Uses custom Store pattern (similar to Redux).

### Q12: What are React hooks?

**Answer**: Functions that let you use state and lifecycle in functional components:
- `useState`: State management
- `useEffect`: Side effects
- `useContext`: Context consumption
- `useCallback`/`useMemo`: Performance optimization

### Q13: Explain Vue's reactivity system

**Answer**: Vue automatically tracks dependencies and updates DOM:
- `ref()`: Reactive primitive values
- `reactive()`: Reactive objects
- `computed()`: Cached derived values
- `watch()`: Side effects on changes

---

## API Design Questions

### Q14: What is REST and its principles?

**Answer**:
1. Client-Server architecture
2. Stateless communication
3. Cacheable responses
4. Uniform interface
5. Layered system
6. Code on demand (optional)

**SmartBank reference**: API follows REST conventions with proper HTTP methods.

### Q15: How do you handle API errors?

**Answer**:
```javascript
// SmartBank error handling
try {
  const response = await fetch('/api/data');
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  return await response.json();
} catch (error) {
  if (error.name === 'TypeError') {
    // Network error
    showNotification('Check your connection');
  } else {
    // API error
    showNotification(error.message);
  }
}
```

### Q16: What is JWT authentication?

**Answer**: JSON Web Token for stateless authentication:
1. User logs in with credentials
2. Server generates JWT with user data
3. Client stores JWT (localStorage/cookie)
4. Client sends JWT in Authorization header
5. Server validates JWT on each request

---

## Testing Strategy Questions

### Q17: What is test-driven development (TDD)?

**Answer**: Write tests before code:
1. Write a failing test
2. Write minimal code to pass
3. Refactor
4. Repeat

**SmartBank reference**: Tests define expected behavior before implementation.

### Q18: Explain unit vs integration vs E2E tests

**Answer**:
- **Unit**: Test individual functions in isolation
- **Integration**: Test multiple components working together
- **E2E**: Test complete user flows through the browser

**SmartBank reference**: Has all three levels in tests/ directory.

### Q19: How do you mock API calls?

**Answer**:
```javascript
// Using jest-fetch-mock
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: 'test' })
});
```

---

## Architecture Questions

### Q20: What is MVC pattern?

**Answer**: Model-View-Controller separates concerns:
- **Model**: Data and business logic
- **View**: User interface
- **Controller**: Handles user input

**SmartBank reference**: Similar to presentation/business/data layer separation.

### Q21: Explain component composition

**Answer**: Build complex UIs from simple, reusable components:
- Single responsibility
- Props down, events up
- Composition over inheritance

### Q22: What is state management?

**Answer**: Centralized management of application state:
- Single source of truth
- Predictable state updates
- Easy debugging

**SmartBank reference**: Custom Store pattern with subscribe/dispatch.

---

## Git Workflow Questions

### Q23: What is Git Flow?

**Answer**: Branching model with:
- `main`: Production code
- `develop`: Integration branch
- `feature/*`: New features
- `release/*`: Release preparation
- `hotfix/*`: Urgent fixes

### Q24: Explain git rebase vs git merge

**Answer**:
- **merge**: Creates merge commit, preserves history
- **rebase**: Rewrites history, linear timeline

**Rule**: Never rebase shared branches.

### Q25: What is a pull request?

**Answer**: Request to merge changes:
1. Create feature branch
2. Make changes
3. Push to remote
4. Create PR with description
5. Code review
6. Merge after approval

---

## Agile/Scrum Questions

### Q26: What is a sprint?

**Answer**: Time-boxed iteration (1-4 weeks):
- Fixed duration
- Selected backlog items
- Daily standups
- Sprint review and retrospective

### Q27: Explain story points

**Answer**: Relative estimation of effort:
- Fibonacci scale (1, 2, 3, 5, 8, 13)
- Not time-based
- Team-specific calibration
- Used for velocity tracking

### Q28: What is Definition of Done?

**Answer**: Shared criteria for "completed" work:
- Code written and tested
- Code reviewed
- Documentation updated
- No critical bugs
- Product Owner accepted

---

## Common Coding Challenges

### Q29: Implement debounce function

```javascript
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}
```

### Q30: Deep clone an object

```javascript
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);

  const clone = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key]);
    }
  }
  return clone;
}
```
