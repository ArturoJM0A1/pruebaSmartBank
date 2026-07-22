# Lesson 4: Component Architecture

## What You Learned

- Component composition patterns
- Props and state management
- Event handling
- Lifecycle methods
- Reusable component design

---

## Why It Was Done This Way

### Component Hierarchy
```
App
├── Layout
│   ├── Header
│   ├── Sidebar
│   └── Footer
├── Pages
│   ├── LoginPage
│   ├── DashboardPage
│   └── AccountsPage
└── Components
    ├── AccountCard
    ├── TransactionItem
    └── Button
```

**Why this hierarchy?**
- Clear separation of concerns
- Reusable components at bottom
- Layout components handle structure
- Page components handle routes

### Single Responsibility Principle
```javascript
// Good: Each component does one thing
function AccountCard({ account }) {
  return (
    <div className="account-card">
      <h3>{account.name}</h3>
      <p>{formatCurrency(account.balance)}</p>
    </div>
  );
}

// Bad: Component does too much
function Dashboard({ accounts, transactions, user, notifications }) {
  // 200+ lines of mixed concerns
}
```

**Why single responsibility?**
- Easier to test
- Easier to reuse
- Easier to maintain
- Clearer purpose

### Props Down, Events Up
```javascript
// Parent passes data down
<TransferForm
  accounts={accounts}
  onSubmit={handleTransfer}
/>

// Child emits events up
function TransferForm({ accounts, onSubmit }) {
  const handleSubmit = (data) => {
    onSubmit(data); // Call parent function
  };
}
```

**Why unidirectional data flow?**
- Predictable state changes
- Easier debugging
- Clear data ownership

---

## Common Mistakes

1. **Prop drilling**
   - Mistake: Passing props through many levels
   - Fix: Use context or state management

2. **Too many props**
   - Mistake: Component accepts 10+ props
   - Fix: Split into smaller components or use composition

3. **Mutating props**
   - Mistake: Modifying prop values directly
   - Fix: Create copies or use state

4. **Not using keys correctly**
   - Mistake: Using array index as key
   - Fix: Use stable, unique IDs

---

## Interview Questions

**Q: What is component composition?**

A: Building complex UIs from simple, reusable pieces:
- Small, focused components
- Combine to create complex UIs
- Each component handles one thing

**Q: How do you decide when to extract a component?**

A: Extract when:
- Same UI appears in multiple places
- Component grows beyond 100-150 lines
- Complex logic needs separate testing
- Reuse is needed across features

**Q: What are controlled vs uncontrolled components?**

A:
- **Controlled**: State managed by React (via useState)
- **Uncontrolled**: State managed by DOM (via ref)

**SmartBank reference**: Forms use controlled components for validation.

---

## Practice Exercises

1. **Build a reusable component library**
   - Create Button, Input, Modal components
   - Support different variants and sizes
   - Add proper TypeScript types

2. **Refactor a large component**
   - Take a 200+ line component
   - Break into smaller pieces
   - Maintain same functionality

3. **Implement prop drilling solution**
   - Create context for shared state
   - Refactor prop drilling to use context
   - Compare before/after
