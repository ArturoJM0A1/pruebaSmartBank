# Lesson 1: Project Setup & Foundations

## What You Learned

- Project structure organization
- Package.json configuration
- Development environment setup
- Git initialization and configuration
- Linting and formatting setup

---

## Why It Was Done This Way

### Directory Structure
```
SmartBank/
├── api/           # Backend logic (mock API)
├── src/           # Frontend code
├── tests/         # Test suites
├── docs/          # Documentation
├── .github/       # CI/CD workflows
└── package.json   # Project configuration
```

**Why separate api/ and src/?**
- Clear separation of concerns
- Different environments (Node.js vs Browser)
- Easier to test independently

### Package.json Scripts
```json
{
  "scripts": {
    "test": "jest --coverage",
    "lint": "eslint src/ api/",
    "dev": "concurrently \"node api/server.js\" \"live-server src\""
  }
}
```

**Why these scripts?**
- `test`: Run tests with coverage reporting
- `lint`: Catch code style issues automatically
- `dev`: Run both API and frontend simultaneously

---

## Common Mistakes

1. **Not using `.gitignore`**
   - Mistake: Committing node_modules/
   - Fix: Always create .gitignore first

2. **Inconsistent naming conventions**
   - Mistake: Mixing camelCase and snake_case
   - Fix: Agree on convention and use ESLint to enforce

3. **No README**
   - Mistake: Other developers don't know how to start
   - Fix: Write setup instructions in README.md

4. **Missing environment variables**
   - Mistake: Hardcoding API URLs
   - Fix: Use .env files for configuration

---

## Interview Questions

**Q: Why do we separate frontend and backend code?**

A: Separation of concerns allows:
- Independent testing
- Different deployment targets
- Clear responsibility boundaries
- Easier team collaboration

**Q: What is the purpose of package.json?**

A: It's the project manifest:
- Dependencies list
- Script commands
- Project metadata
- Version management

**Q: Why use ESLint and Prettier together?**

A: They serve different purposes:
- ESLint: Catches bugs and enforces code quality
- Prettier: Enforces consistent formatting
- Together: Clean, bug-free code

---

## Practice Exercises

1. **Create a new project**
   - Initialize npm project
   - Set up ESLint and Prettier
   - Create basic directory structure
   - Write a README with setup instructions

2. **Configure Husky**
   - Install husky
   - Add pre-commit hook
   - Run lint-staged on commit

3. **Set up development environment**
   - Configure VS Code settings
   - Install recommended extensions
   - Set up debugging configurations
