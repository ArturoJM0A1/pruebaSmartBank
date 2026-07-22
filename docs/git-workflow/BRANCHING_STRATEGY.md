# Branching Strategy - SmartBank

## Overview

This document describes the branching strategy used in the SmartBank project.

---

## Main / Develop / Feature Branches

```
main (production-ready code)
  │
  └── develop (integration branch)
        │
        ├── feature/login
        ├── feature/dashboard
        ├── feature/transfers
        └── feature/cards
```

### Branch Purposes

| Branch | Purpose | Deployed To | Protected |
|--------|---------|-------------|-----------|
| `main` | Production-ready code | Production | Yes |
| `develop` | Integration of features | Staging/Dev | Yes |
| `feature/*` | New features in development | None (local) | No |
| `release/*` | Release preparation | Pre-production | No |
| `hotfix/*` | Urgent production fixes | Production | No |

---

## Release Workflow

```
develop
  │
  ├── release/v1.0.0
  │     ├── fix: final bug fixes
  │     ├── docs: update changelog
  │     └── merge → main + develop
  │
  └── (continue development on develop)
```

### Steps
1. Create `release/vX.Y.Z` from `develop`
2. Only bug fixes and documentation on release branch
3. When ready, merge to `main` AND back to `develop`
4. Tag `main` with version number

---

## Hotfix Workflow

```
main (has production bug)
  │
  ├── hotfix/fix-security-issue
  │     ├── fix: the issue
  │     ├── test: verify fix
  │     └── merge → main + develop
  │
  └── (resume normal development)
```

### Steps
1. Create `hotfix/*` from `main`
2. Fix the issue
3. Merge to `main` AND `develop`
4. Tag `main` with patch version

---

## Environment Branching

| Environment | Branch | Trigger | Deployment |
|-------------|--------|---------|------------|
| Development | `develop` | Push to develop | Auto-deploy |
| Staging | `release/*` | Push to release | Auto-deploy |
| Production | `main` | Push to main | Manual approval |

---

## Git Flow vs GitHub Flow vs Trunk-based

### Git Flow (What We Use)
- **Best for**: Apps with scheduled releases
- **Pros**: Clear structure, good for teams
- **Cons**: Complex, many branches

### GitHub Flow
- **Best for**: Continuous deployment apps
- **Pros**: Simple, fast
- **Cons**: Requires good CI/CD

### Trunk-based Development
- **Best for**: Experienced teams with strong CI/CD
- **Pros**: Fastest, least complex
- **Cons**: Requires discipline, feature flags

### Why Git Flow for SmartBank?
- Educational project: teaches proper workflow
- Scheduled releases: v1.0, v1.1, v1.2
- Team size: small enough to manage branches
- Learning value: shows all branching concepts

---

## Branch Protection Rules

### Main Branch
- Require pull request reviews
- Require status checks (CI must pass)
- Require up-to-date branches
- No force pushes
- No branch deletion

### Develop Branch
- Require pull request reviews
- Require status checks
- Allow force pushes (for rebasing)

---

## Commit Message Convention

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

### Examples
```
feat(auth): add login with JWT
fix(balance): resolve negative balance display
docs(readme): update installation steps
test(auth): add login failure tests
```
