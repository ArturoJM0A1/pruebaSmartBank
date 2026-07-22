# Design Patterns Used in SmartBank

## Overview

SmartBank uses several design patterns to solve common software problems. Each pattern has a specific purpose and trade-offs.

---

## 1. Singleton Pattern

**What**: Ensures only ONE instance of a class exists.

**When to use**: Global state management, configuration, logging.

**SmartBank example**: Store, Router

```javascript
// Singleton Store - only one instance exists
const store = createStore({ user: null, accounts: [] });

// All components use the SAME instance
import { store } from './store';
store.getState(); // Returns the single instance
```

**Pros**:
- Global access point
- Lazy initialization
- Controlled instantiation

**Cons**:
- Hard to test (global state)
- Tight coupling
- Can hide dependencies

**Alternatives**:
- Dependency injection (better for testing)
- Module pattern (simpler)

---

## 2. Observer Pattern

**What**: Defines a subscription mechanism to notify multiple objects about events.

**When to use**: Event systems, state management, reactive programming.

**SmartBank example**: Store subscriptions, event emitters

```javascript
// Observer pattern in Store
const listeners = new Set();

// Subscribe (observer registers)
store.subscribe((newState) => {
  console.log('State changed:', newState);
});

// Notify (subject notifies observers)
function setState(newState) {
  state = newState;
  listeners.forEach(listener => listener(newState));
}
```

**Pros**:
- Loose coupling
- Dynamic subscriptions
- Event-driven architecture

**Cons**:
- Memory leaks if not unsubscribed
- Cascading updates
- Hard to debug

**Alternatives**:
- Pub/Sub (more decoupled)
- RxJS (more powerful, complex)

---

## 3. Factory Pattern

**What**: Creates objects without specifying the exact class.

**When to use**: Object creation varies by context, dynamic component creation.

**SmartBank example**: Component creation, API response handling

```javascript
// Factory for creating components
function createComponent(type, props) {
  switch (type) {
    case 'account':
      return new AccountCard(props);
    case 'transaction':
      return new TransactionItem(props);
    default:
      return new DefaultCard(props);
  }
}

// Factory for API responses
function createResponse(data, status) {
  if (status >= 200 && status < 300) {
    return new SuccessResponse(data);
  }
  return new ErrorResponse(data);
}
```

**Pros**:
- Flexible object creation
- Encapsulates creation logic
- Easy to extend

**Cons**:
- Can become complex
- Hard to trace object creation

**Alternatives**:
- Builder pattern (for complex objects)
- Prototype pattern (for cloning)

---

## 4. Strategy Pattern

**What**: Defines a family of algorithms and makes them interchangeable.

**When to use**: Multiple ways to do the same thing, runtime algorithm selection.

**SmartBank example**: Validation, copy methods, sorting

```javascript
// Strategy for validation
const validationStrategies = {
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  password: (value) => value.length >= 8,
  amount: (value) => value > 0 && value <= 999999.99,
};

// Use the appropriate strategy
function validate(value, type) {
  const strategy = validationStrategies[type];
  if (!strategy) throw new Error(`Unknown validation: ${type}`);
  return strategy(value);
}

// Strategy for deep copy
const copyStrategies = {
  json: (obj) => JSON.parse(JSON.stringify(obj)),
  structuredClone: (obj) => structuredClone(obj),
  recursive: (obj) => deepCloneRecursive(obj),
};
```

**Pros**:
- Eliminates conditional statements
- Easy to add new algorithms
- Runtime flexibility

**Cons**:
- Increased number of classes
- Client must know strategies exist

**Alternatives**:
- Conditional logic (simpler but less flexible)
- Polymorphism (object-oriented approach)

---

## 5. Module Pattern

**What**: Encapsulates code into modules with public/private interfaces.

**When to use**: Organizing code, hiding implementation details.

**SmartBank example**: Services, utilities

```javascript
// Module pattern for AuthService
const AuthService = (() => {
  // Private variables
  let token = null;
  const API_URL = '/api/auth';

  // Private functions
  function storeToken(newToken) {
    token = newToken;
    localStorage.setItem('token', newToken);
  }

  // Public interface
  return {
    login: async (email, password) => {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      storeToken(data.token);
      return data;
    },

    logout: () => {
      token = null;
      localStorage.removeItem('token');
    },

    isAuthenticated: () => !!token,
  };
})();
```

**Pros**:
- Information hiding
- Clean namespace
- Reusability

**Cons**:
- Hard to unit test private functions
- Can lead to large modules

**Alternatives**:
- ES6 modules (modern standard)
- Classes (for OOP approach)

---

## 6. Middleware Pattern

**What**: Processes requests/responses in a pipeline.

**When to use**: Cross-cutting concerns (logging, auth, validation).

**SmartBank example**: API request/response handling

```javascript
// Middleware pattern for API requests
async function apiRequest(endpoint, options) {
  // Pre-processing middleware
  const token = localStorage.getItem('token');
  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  // Make request
  const response = await fetch(endpoint, options);

  // Post-processing middleware
  if (response.status === 401) {
    // Token expired, redirect to login
    window.location.href = '/login';
  }

  return response;
}
```

**Pros**:
- Separation of concerns
- Reusable logic
- Easy to compose

**Cons**:
- Can be hard to debug
- Order matters

**Alternatives**:
- Decorator pattern
- Aspect-oriented programming

---

## Pattern Selection Guide

| Problem | Pattern | SmartBank Example |
|---------|---------|-------------------|
| Global state | Singleton | Store |
| Event handling | Observer | Store subscriptions |
| Object creation | Factory | Component creation |
| Algorithm selection | Strategy | Validation |
| Code organization | Module | Services |
| Cross-cutting concerns | Middleware | API handling |

---

## Anti-Patterns to Avoid

1. **God Object**: One class doing everything
2. **Spaghetti Code**: No clear structure
3. **Golden Hammer**: Using one pattern everywhere
4. **Premature Optimization**: Over-engineering
5. **Copy-Paste Programming**: Duplicated code

---

## Interview Questions

1. **When would you use Singleton over dependency injection?**
   - Singleton: Global state that must be unique (Store)
   - DI: When you need testability and flexibility

2. **How does Observer pattern differ from Pub/Sub?**
   - Observer: Subject knows observers directly
   - Pub/Sub: Complete decoupling via message broker

3. **What are the trade-offs of the Factory pattern?**
   - Pros: Flexible creation, encapsulation
   - Cons: Complexity, harder to trace

4. **When would you NOT use the Module pattern?**
   - When you need to unit test private functions
   - When the module becomes too large
