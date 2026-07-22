/**
 * ============================================================================
 * SMARTBANK - UNIT TESTS: Copy Utilities
 * ============================================================================
 * 
 * PURPOSE: Test shallow and deep copy functions.
 * 
 * WHY TEST COPY FUNCTIONS?
 *   - Copy bugs are SILENT: the code runs without errors, but data is
 *     corrupted. You won't know until a user reports "my data changed!"
 *   - Mutations are the #1 source of bugs in JavaScript.
 *   - Testing copies ensures our data immutability is actually working.
 * 
 * SHALLOW vs DEEP COPY:
 *   - SHALLOW: Copies the outer object, but nested objects are still shared.
 *     const a = { nested: { x: 1 } };
 *     const b = shallowCopy(a);
 *     b.nested.x = 99; // ALSO changes a.nested.x!
 * 
 *   - DEEP: Copies everything, including nested objects. Fully independent.
 *     const a = { nested: { x: 1 } };
 *     const b = deepCopy(a);
 *     b.nested.x = 99; // a.nested.x is still 1!
 * 
 * ============================================================================
 */

'use strict';

// ============================================================================
// SHALLOW COPY TESTS
// ============================================================================
// Shallow copy creates a new object with the same top-level properties.
// Nested objects are still REFERENCE-COPIED (shared).

describe('Shallow Copy', () => {
  // WHAT: Object.assign creates a shallow copy
  // WHY: Most common shallow copy method in older JavaScript.
  it('should create shallow copy with Object.assign', () => {
    const original = { name: 'Juan', account: { balance: 1000 } };
    const copy = Object.assign({}, original);

    // Top-level properties are independent
    copy.name = 'María';
    expect(original.name).toBe('Juan'); // Original unchanged

    // BUT nested objects are shared (shallow copy limitation)
    copy.account.balance = 5000;
    expect(original.account.balance).toBe(5000); // Original CHANGED!
  });

  // WHAT: Spread operator creates a shallow copy (ES6+)
  // WHY: More readable than Object.assign, same behavior.
  it('should create shallow copy with spread operator', () => {
    const original = { name: 'Juan', tags: ['premium', 'active'] };
    const copy = { ...original };

    copy.tags.push('new-tag');
    expect(original.tags).toContain('new-tag'); // Shared array!
  });

  // WHAT: Top-level primitive values are independent
  // WHY: Primitives are copied by value, not reference.
  it('should copy primitive values independently', () => {
    const original = { name: 'Juan', balance: 1000 };
    const copy = { ...original };

    copy.name = 'María';
    copy.balance = 5000;

    expect(original.name).toBe('Juan');
    expect(original.balance).toBe(1000);
  });

  // WHAT: Arrays are reference-copied in shallow copy
  // WHY: Arrays are objects; spreading copies the reference.
  it('should share array references in shallow copy', () => {
    const original = { items: [1, 2, 3] };
    const copy = { ...original };

    copy.items.push(4);
    expect(original.items).toHaveLength(4); // Shared!
  });
});

// ============================================================================
// DEEP COPY TESTS
// ============================================================================
// Deep copy creates a completely independent clone.
// All nested objects are new, with no shared references.

describe('Deep Copy', () => {
  // WHAT: JSON.parse(JSON.stringify()) creates a deep copy
  // WHY: Most common deep copy method. Simple but has limitations.
  it('should create deep copy with JSON method', () => {
    const original = {
      name: 'Juan',
      account: { balance: 1000, currency: 'MXN' },
      transactions: [{ id: 1, amount: 100 }],
    };
    const copy = JSON.parse(JSON.stringify(original));

    // Nested objects are independent
    copy.account.balance = 5000;
    copy.transactions.push({ id: 2, amount: 200 });

    expect(original.account.balance).toBe(1000); // Original unchanged
    expect(original.transactions).toHaveLength(1); // Original unchanged
  });

  // WHAT: structuredClone() is the modern deep copy (ES2022+)
  // WHY: Built-in, handles more types than JSON method.
  it('should create deep copy with structuredClone', () => {
    const original = {
      name: 'Juan',
      account: { balance: 1000 },
      date: new Date('2024-01-01'),
    };
    const copy = structuredClone(original);

    copy.account.balance = 5000;
    expect(original.account.balance).toBe(1000);
  });

  // WHAT: Manual recursive deep copy
  // WHY: Full control over what gets copied and how.
  it('should create deep copy with recursive function', () => {
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

    const original = {
      name: 'Juan',
      nested: { deep: { value: 42 } },
      items: [1, { inner: 2 }],
    };
    const copy = deepClone(original);

    copy.nested.deep.value = 999;
    copy.items[1].inner = 888;

    expect(original.nested.deep.value).toBe(42);
    expect(original.items[1].inner).toBe(2);
  });
});

// ============================================================================
// EDGE CASE TESTS
// ============================================================================
// Edge cases are unusual scenarios that often break code.

describe('Copy Edge Cases', () => {
  // WHAT: Empty objects copy correctly
  it('should copy empty objects', () => {
    const original = {};
    const copy = { ...original };
    expect(copy).toEqual({});
    expect(copy).not.toBe(original);
  });

  // WHAT: Null values handled correctly
  it('should handle null values', () => {
    const original = { name: null, value: undefined };
    const copy = JSON.parse(JSON.stringify(original));
    // JSON.stringify removes undefined values
    expect(copy).toHaveProperty('name', null);
  });

  // WHAT: Nested arrays in objects
  it('should deep copy nested arrays', () => {
    const original = {
      matrix: [[1, 2], [3, 4]],
      transactions: [
        { id: 1, tags: ['transfer'] },
        { id: 2, tags: ['deposit'] },
      ],
    };
    const copy = JSON.parse(JSON.stringify(original));

    copy.matrix[0][0] = 999;
    copy.transactions[0].tags.push('new');

    expect(original.matrix[0][0]).toBe(1);
    expect(original.transactions[0].tags).toHaveLength(1);
  });

  // WHAT: JSON method fails on functions and undefined
  // WHY: This is a known limitation of JSON deep copy.
  it('should handle JSON deep copy limitations', () => {
    const original = {
      name: 'Juan',
      greet: function () { return 'hello'; },
      extra: undefined,
    };
    const copy = JSON.parse(JSON.stringify(original));

    expect(copy.name).toBe('Juan');
    expect(copy.greet).toBeUndefined(); // Functions lost!
    expect(copy.extra).toBeUndefined(); // Undefined values lost!
  });
});

// ============================================================================
// isDeepEqual TESTS
// ============================================================================
// Deep equality checks if two objects have identical values at all levels.

describe('isDeepEqual', () => {
  function isDeepEqual(a, b) {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== typeof b) return false;

    if (typeof a !== 'object') return a === b;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) => isDeepEqual(a[key], b[key]));
  }

  // WHAT: Identical objects are equal
  it('should return true for identical objects', () => {
    const obj = { name: 'Juan', balance: 1000 };
    expect(isDeepEqual(obj, { ...obj })).toBe(true);
  });

  // WHAT: Different objects are not equal
  it('should return false for different objects', () => {
    const a = { name: 'Juan' };
    const b = { name: 'María' };
    expect(isDeepEqual(a, b)).toBe(false);
  });

  // WHAT: Nested equality
  it('should compare nested objects deeply', () => {
    const a = { account: { balance: 1000, currency: 'MXN' } };
    const b = { account: { balance: 1000, currency: 'MXN' } };
    expect(isDeepEqual(a, b)).toBe(true);
  });

  // WHAT: Different nesting is not equal
  it('should return false for different nested values', () => {
    const a = { account: { balance: 1000 } };
    const b = { account: { balance: 5000 } };
    expect(isDeepEqual(a, b)).toBe(false);
  });

  // WHAT: Different key counts
  it('should return false for objects with different keys', () => {
    const a = { name: 'Juan', age: 30 };
    const b = { name: 'Juan' };
    expect(isDeepEqual(a, b)).toBe(false);
  });

  // WHAT: Null handling
  it('should handle null values', () => {
    expect(isDeepEqual(null, null)).toBe(true);
    expect(isDeepEqual(null, {})).toBe(false);
    expect(isDeepEqual({}, null)).toBe(false);
  });
});
