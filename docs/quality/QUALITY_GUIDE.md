# Code Quality Guide - SmartBank

## Overview

This guide explains code quality metrics, tools, and best practices used in SmartBank.

---

## SonarQube/SonarCloud

SonarCloud is a cloud-based code quality analysis tool. It detects:
- **Bugs**: Errors that will cause runtime failures
- **Vulnerabilities**: Security issues
- **Code Smells**: Maintainability issues
- **Duplication**: Repeated code

### How It Works
1. Code is pushed to repository
2. CI pipeline runs SonarCloud scanner
3. Analysis appears on sonarcloud.io dashboard
4. PRs show quality gate status

### Quality Gate
Code must pass these thresholds:
- No new bugs
- No new vulnerabilities
- Coverage on new code ≥ 80%
- No new code smells

---

## Bugs

**What**: Errors that will cause the application to malfunction.

**How to find them**:
- Static analysis (SonarCloud, ESLint)
- Unit tests
- Code reviews

**Examples from SmartBank**:
```javascript
// Bug: Null reference
function getUserName(user) {
  return user.name.toUpperCase(); // Crashes if user is null
}

// Fix: Null check
function getUserName(user) {
  return user?.name?.toUpperCase() ?? 'Unknown';
}
```

**Common bug types**:
- Null/undefined references
- Type errors
- Logic errors
- Off-by-one errors

---

## Vulnerabilities

**What**: Security issues that could be exploited by attackers.

**Common web vulnerabilities**:

### XSS (Cross-Site Scripting)
```javascript
// Vulnerable: Injecting user input into HTML
element.innerHTML = userInput;

// Secure: Using textContent
element.textContent = userInput;
```

### CSRF (Cross-Site Request Forgery)
- Use CSRF tokens for state-changing operations
- Validate Origin/Referer headers

### Injection
```javascript
// Vulnerable: String concatenation
query = `SELECT * FROM users WHERE id = ${userId}`;

// Secure: Parameterized query
query = 'SELECT * FROM users WHERE id = ?';
db.query(query, [userId]);
```

### Authentication Issues
- Store tokens securely (HttpOnly cookies)
- Implement token expiration
- Use strong password hashing (bcrypt)

---

## Code Smells

**What**: Code that works but is hard to maintain.

**Examples**:
```javascript
// Code Smell: Long function (100+ lines)
function processTransfer(data) {
  // 100 lines of code
}

// Refactor: Extract functions
function validateTransfer(data) { /* ... */ }
function executeTransfer(data) { /* ... */ }
function updateBalances(data) { /* ... */ }
```

**Common code smells**:
- Long functions (>30 lines)
- Deep nesting (>3 levels)
- Magic numbers
- Duplicate code
- Poor naming

---

## Duplication

**What**: Same or similar code in multiple places.

**Why it's bad**:
- Bug fixes must be applied multiple times
- Changes require finding all instances
- Increases maintenance burden

**DRY Principle (Don't Repeat Yourself)**:
```javascript
// Duplicated
function formatAccountNumber(num) {
  return num.replace(/(\d{4})/g, '$1 ').trim();
}

function formatCardNumber(num) {
  return num.replace(/(\d{4})/g, '$1 ').trim();
}

// DRY: Extract shared function
function formatNumber(num, groupSize = 4) {
  const regex = new RegExp(`(\\d{${groupSize}})`, 'g');
  return num.replace(regex, '$1 ').trim();
}
```

---

## Coverage

**What**: Percentage of code executed by tests.

**Metrics**:
- **Line coverage**: % of lines executed
- **Branch coverage**: % of if/else branches executed
- **Function coverage**: % of functions called
- **Statement coverage**: % of statements executed

**Target thresholds**:
- Lines: 70%
- Branches: 60%
- Functions: 70%
- Statements: 70%

**What to test**:
- Public API surface
- Business logic
- Edge cases
- Error handling

**What NOT to test**:
- Framework code
- Simple getters/setters
- Third-party libraries
- Configuration files

---

## Quality Metrics

| Metric | Good | Warning | Bad |
|--------|------|---------|-----|
| Bugs | 0 | 1-5 | >5 |
| Vulnerabilities | 0 | 1-3 | >3 |
| Code Smells | <10 | 10-50 | >50 |
| Duplication | <3% | 3-10% | >10% |
| Coverage | >80% | 60-80% | <60% |

---

## Technical Debt

**What**: Cost of future rework caused by choosing easy solutions now.

**How to manage**:
1. Track debt items in backlog
2. Allocate 20% of sprint to debt
3. Prevent new debt with quality gates
4. Refactor during feature work

**When to incur debt**:
- Prototypes and MVPs
- Time-critical fixes
- Temporary workarounds

**When to pay debt**:
- Before major features
- When it blocks progress
- When it causes frequent bugs

---

## Best Practices

1. **Write code for humans first, computers second**
2. **Keep functions small and focused**
3. **Use meaningful names**
4. **Write tests before code (TDD)**
5. **Review code before merging**
6. **Run linter before committing**
7. **Document complex logic**
8. **Refactor regularly**
