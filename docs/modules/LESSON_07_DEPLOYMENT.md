# Lesson 7: CI/CD & Deployment

## What You Learned

- Continuous Integration concepts
- GitHub Actions workflows
- Automated testing and linting
- Deployment strategies
- Environment management

---

## Why It Was Done This Way

### CI Pipeline Structure
```
Push to develop
    ↓
Install Dependencies
    ↓
┌─────┴─────┐
│ Lint Code │ Run Tests │ Security Audit
└─────┬─────┘
    ↓
Build Project
    ↓
SonarCloud Analysis
```

**Why this order?**
- Fail fast: Install first (catches dependency issues)
- Parallel jobs: Lint, test, security run simultaneously
- Build only if checks pass
- Analysis runs after build

### GitHub Actions Syntax
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm test
```

**Why GitHub Actions?**
- Free for public repos
- Native GitHub integration
- YAML configuration
- Marketplace for pre-built actions

### Deployment Strategy
```
main branch
    ↓
Build production assets
    ↓
Deploy to GitHub Pages
    ↓
Verify deployment
```

**Why GitHub Pages for SmartBank?**
- Free static hosting
- Automatic HTTPS
- Easy setup
- Good for educational projects

---

## Common Mistakes

1. **Not caching dependencies**
   - Mistake: Installing node_modules every run
   - Fix: Use actions/cache for node_modules

2. **Running everything sequentially**
   - Mistake: Lint → Test → Build (slow)
   - Fix: Run independent jobs in parallel

3. **No test coverage threshold**
   - Mistake: Letting coverage drop silently
   - Fix: Set minimum coverage in jest.config.js

4. **Hardcoding environment variables**
   - Mistake: Committing API keys
   - Fix: Use GitHub Secrets

---

## Interview Questions

**Q: What is Continuous Integration?**

A: Automatically integrating code changes:
- Every push triggers builds and tests
- Catches issues early
- Enforces code quality

**Q: What is the difference between CI and CD?**

A:
- **CI**: Code quality checks (lint, test, build)
- **CD**: Deployment to production

**Q: How do you handle environment-specific configuration?**

A:
- Use environment variables
- Separate config files per environment
- Never commit secrets to repository

---

## Practice Exercises

1. **Set up a basic CI pipeline**
   - Create GitHub Actions workflow
   - Add lint and test steps
   - Configure caching

2. **Add deployment**
   - Deploy to GitHub Pages
   - Add deployment verification
   - Set up environment protection

3. **Improve pipeline**
   - Add parallel jobs
   - Set up test coverage reporting
   - Add security scanning
