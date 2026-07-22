# Git Workflow Guide - SmartBank

## Overview

This document describes the Git workflow used in the SmartBank project. It covers branching strategies, common commands, and best practices.

---

## Git Flow Explanation

Git Flow is a branching model that defines a strict branching structure. It's ideal for projects with scheduled releases.

```
main (production)
  │
  ├── develop (integration)
  │     │
  │     ├── feature/login-page
  │     ├── feature/account-dashboard
  │     ├── feature/transfer-flow
  │     │
  │     └── (merge back to develop)
  │
  ├── release/v1.0.0
  │     │
  │     └── (merge to main AND develop)
  │
  └── hotfix/fix-login-bug
        │
        └── (merge to main AND develop)
```

---

## Branch Naming Conventions

| Branch Type | Pattern | Example | When to Use |
|-------------|---------|---------|-------------|
| `feature/` | `feature/description` | `feature/login-page` | New functionality |
| `bugfix/` | `bugfix/description` | `bugfix/fix-balance-display` | Non-urgent bug fixes |
| `hotfix/` | `hotfix/description` | `hotfix/security-patch` | Urgent production fixes |
| `release/` | `release/vX.Y.Z` | `release/v1.2.0` | Preparing a release |
| `chore/` | `chore/description` | `chore/update-dependencies` | Maintenance tasks |

---

## Common Git Commands

### When to Use Each Command

#### `git init` / `git clone`
- **`git init`**: Create a new repository from scratch
- **`git clone`**: Copy an existing repository
- **WHY**: Every project starts with one of these

#### `git add` / `git commit` / `git push`
- **`git add`**: Stage changes for commit
- **`git commit`**: Save staged changes with a message
- **`git push`**: Upload commits to remote repository
- **Common mistake**: Committing directly without staging (`git add -p` for partial staging)

#### `git pull` / `git fetch`
- **`git pull`**: Fetch + merge (downloads and integrates changes)
- **`git fetch`**: Download changes without integrating
- **WHY prefer fetch**: You can review changes before merging

#### `git branch` / `git checkout` / `git switch`
- **`git branch`**: List or create branches
- **`git checkout`**: Switch branches (or restore files)
- **`git switch`**: Modern way to switch branches (safer)
- **WHY switch exists**: `checkout` does too many things (branches, files, tags)

#### `git merge` vs `git rebase`
- **`git merge`**: Creates a merge commit (preserves history)
- **`git rebase`**: Rewrites history (cleaner, linear history)
- **WHEN to use merge**: Shared branches (main, develop)
- **WHEN to use rebase**: Your own feature branch (before sharing)

#### `git cherry-pick`
- **WHEN**: You need a specific commit from another branch
- **Example**: A bug fix on `hotfix/fix-123` needs to go into `develop` too

#### `git stash`
- **WHEN**: You need to switch branches but aren't ready to commit
- **Common mistake**: Forgetting to pop the stash

#### `git tag`
- **WHEN**: Marking release versions (v1.0.0, v1.1.0)
- **Semantic versioning**: MAJOR.MINOR.PATCH

#### `git revert` vs `git reset`
- **`git revert`**: Creates a new commit that undoes changes (safe for shared branches)
- **`git reset`**: Rewrites history (DANGEROUS for shared branches)
- **RULE**: Never `git reset` on main/develop

---

## Merge Conflicts Resolution

### When Conflicts Occur
1. Two branches modify the same file
2. One branch deletes a file the other modifies
3. Both branches add a file with the same name

### Resolution Steps
```bash
# 1. See which files have conflicts
git status

# 2. Open the conflicted files and look for markers:
<<<<<<< HEAD
// Your changes
=======
// Their changes
>>>>>>> branch-name

# 3. Edit the file to keep what you want
# 4. Remove the conflict markers
# 5. Stage and commit
git add <file>
git commit -m "Resolve merge conflict in <file>"
```

### Prevention Tips
- Pull frequently (reduce divergence)
- Communicate with team about who's working on what
- Keep branches short-lived

---

## Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console.log statements
```

---

## Code Review Checklist

1. **Functionality**: Does the code do what it's supposed to?
2. **Tests**: Are there adequate tests?
3. **Security**: No hardcoded secrets, proper input validation
4. **Performance**: No unnecessary re-renders, efficient algorithms
5. **Readability**: Clear variable names, minimal comments needed
6. **Error Handling**: All edge cases handled
7. **Documentation**: READMEs, JSDoc updated if needed

---

## Common Mistakes

1. **Committing too early**: Stage related changes, not random files
2. **Vague commit messages**: "fixed stuff" → "fix: resolve login timeout on slow connections"
3. **Not pulling before push**: Always `git pull --rebase origin main` before pushing
4. **Force pushing shared branches**: Never force push to main/develop
5. **Large commits**: Break into smaller, focused commits
