# Lesson 6: Testing Strategies

## What You Learned

- Unit testing fundamentals
- Integration testing patterns
- Mocking strategies
- Test-driven development
- Coverage and quality metrics

---

## Why It Was Done This Way

### Test Pyramid
```
        /\
       /  \  E2E Tests (few)
      /    \
     /------\  Integration Tests (some)
    /        \
   /----------\  Unit Tests (many)
```

**Why this structure?**
- Unit tests: Fast, cheap, many
- Integration tests: Moderate speed, moderate cost
- E2E tests: Slow, expensive, few

### Mocking Strategy
```javascript
// Mock fetch for API tests
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: 'test' })
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
```

**Why mock?**
- Isolate code under test
- Control test conditions
- Speed up test execution
- Avoid external dependencies

### Test Organization
```
tests/
├── unit/
│   ├── utils/
│   │   ├── helpers.test.js
│   │   └── validators.test.js
│   ├── services/
│   │   └── api.test.js
│   └── store/
│       └── store.test.js
├── integration/
│   └── transfer.test.js
└── mocks/
    ├── mockData.js
    └── mockFetch.js
```

**Why this structure?**
- Mirrors source code structure
- Easy to find related tests
- Clear separation of test types

---

## Common Mistakes

1. **Testing implementation details**
   - Mistake: Testing internal state
   - Fix: Test behavior and outputs

2. **Not mocking external dependencies**
   - Mistake: Making real API calls in tests
   - Fix: Mock fetch, localStorage, etc.

3. **Flaky tests**
   - Mistake: Tests that sometimes pass/fail
   - Fix: Avoid time dependencies, use deterministic data

4. **Low test coverage**
   - Mistake: Only testing happy path
   - Fix: Test edge cases, errors, boundaries

---

## Interview Questions

**Q: What is test-driven development (TDD)?**

A: Write tests before code:
1. Write failing test
2. Write minimal code to pass
3. Refactor
4. Repeat

**Q: How do you decide what to test?**

A: Test:
- Public API surface
- Business logic
- Edge cases
- Error handling
- Don't test: Framework code, getters/setters

**Q: What is mocking and when to use it?**

A: Mocking replaces real dependencies with controlled substitutes:
- API calls (mock fetch)
- File system (mock fs)
- Time (jest.useFakeTimers)
- External services (mock email, payment)

---

## Practice Exercises

1. **Write unit tests**
   - Test all utility functions
   - Achieve 80%+ coverage
   - Test edge cases

2. **Create integration tests**
   - Test complete user flows
   - Mock API responses
   - Verify state changes

3. **Set up test automation**
   - Configure CI to run tests
   - Add coverage reports
   - Set up test notifications
