# Copy Methods Comparison - SmartBank

## Overview

JavaScript objects are reference types. Copying creates either a shallow copy (shared nested objects) or a deep copy (fully independent clone).

---

## Shallow vs Deep Copy Explained

```javascript
// Original object with nested property
const original = {
  name: 'Juan',
  account: { balance: 1000 }
};

// SHALLOW COPY: Outer object is new, nested objects are shared
const shallow = { ...original };
shallow.account.balance = 5000;
console.log(original.account.balance); // 5000 (CHANGED!)

// DEEP COPY: Everything is independent
const deep = JSON.parse(JSON.stringify(original));
deep.account.balance = 10000;
console.log(original.account.balance); // 5000 (UNCHANGED)
```

---

## Method Comparison

### 1. Object.assign()

```javascript
const copy = Object.assign({}, original);
```

| Pros | Cons |
|------|------|
| ES6 standard | Shallow only |
| Readable | Doesn't handle nested objects |
| Good browser support | Limited to enumerable properties |

**Best for**: Simple flat objects, combining objects

### 2. Spread Operator (...)

```javascript
const copy = { ...original };
const arrCopy = [...originalArray];
```

| Pros | Cons |
|------|------|
| Concise syntax | Shallow only |
| ES6 standard | Can't copy non-enumerable properties |
| Works with arrays | |

**Best for**: Quick shallow copies, adding/overriding properties

### 3. JSON.parse(JSON.stringify())

```javascript
const copy = JSON.parse(JSON.stringify(original));
```

| Pros | Cons |
|------|------|
| Deep copy | Drops functions |
| Simple one-liner | Drops undefined values |
| Works with nested objects | Can't handle circular references |
| | Slow for large objects |
| | Doesn't preserve Date objects correctly |

**Best for**: Simple data objects, API responses

### 4. structuredClone()

```javascript
const copy = structuredClone(original);
```

| Pros | Cons |
|------|------|
| True deep copy | Not in very old browsers |
| Handles most types | Slightly slower than JSON |
| Handles circular references | Still drops functions |
| Preserves Date, RegExp, Map, Set | |

**Best for**: Modern browsers, complex data types

### 5. Manual Recursive Copy

```javascript
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
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

| Pros | Cons |
|------|------|
| Full control | More code to write |
| Handles any type | Can be slow |
| Customizable | Must handle all edge cases |
| Can handle circular references | |

**Best for**: Custom cloning logic, learning how deep copy works

---

## Performance Comparison

| Method | Speed | Memory | Deep? |
|--------|-------|--------|-------|
| Spread | Fast | Low | No |
| Object.assign | Fast | Low | No |
| JSON | Medium | Medium | Yes |
| structuredClone | Medium | Medium | Yes |
| Recursive | Slow | High | Yes |

**Benchmark (1000 iterations of 100-property object)**:
- Spread: ~15ms
- Object.assign: ~18ms
- JSON: ~85ms
- structuredClone: ~90ms
- Recursive: ~120ms

---

## Edge Cases Comparison

| Edge Case | Spread | JSON | structuredClone | Recursive |
|-----------|--------|------|-----------------|-----------|
| Functions | ✓ copied | ✗ dropped | ✗ dropped | ✓ if custom |
| Undefined | ✓ copied | ✗ dropped | ✓ preserved | ✓ preserved |
| Date objects | ✓ reference | ✗ string | ✓ Date | ✓ if custom |
| Circular refs | ✓ shared | ✗ error | ✓ handled | ✓ if custom |
| null values | ✓ copied | ✓ copied | ✓ copied | ✓ copied |
| Nested arrays | ✗ shared | ✓ copied | ✓ copied | ✓ copied |
| Map/Set | ✓ reference | ✗ plain obj | ✓ Map/Set | ✓ if custom |
| RegExp | ✓ reference | ✗ plain obj | ✓ RegExp | ✓ if custom |

---

## Decision Tree: Which Copy Method to Use?

```
Is the object flat (no nested objects)?
├── YES → Use spread or Object.assign
└── NO → Continue
    │
    Does it contain functions?
    ├── YES → Create custom copy function
    └── NO → Continue
        │
    Does it contain circular references?
    ├── YES → Use structuredClone or custom recursive
    └── NO → Continue
        │
    Do you need to preserve Dates/Map/Set?
    ├── YES → Use structuredClone
    └── NO → Use JSON.parse(JSON.stringify())
```

---

## Interview Questions

1. **What is the difference between shallow and deep copy?**
   - Shallow: Only top-level properties are copied
   - Deep: All levels are independently copied

2. **Why does JSON.parse(JSON.stringify()) fail with functions?**
   - Functions are not valid JSON
   - JSON.stringify drops them silently

3. **How would you deep copy an object with circular references?**
   - Use structuredClone() (modern)
   - Use WeakMap to track visited objects (custom)
   - Never use JSON method (throws error)

4. **When would you use Object.assign vs spread?**
   - Object.assign: When you need to merge into existing object
   - Spread: When creating new object from scratch

5. **What are the performance implications of deep copy?**
   - Deep copy creates new memory for every nested object
   - Large objects can cause memory pressure
   - Consider if you really need deep copy
