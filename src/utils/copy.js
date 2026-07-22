/**
 * ============================================================================
 * Deep Copy & Shallow Copy Utilities
 * ============================================================================
 * 
 * PURPOSE:
 * Demonstrate ALL copy methods in JavaScript, explaining when to use each.
 * This is a common interview topic and practical skill.
 * 
 * KEY CONCEPT: SHALLOW vs DEEP COPY
 * 
 * SHALLOW COPY:
 * - Creates a new object, but nested objects are still REFERENCES
 * - Changing nested objects in the copy ALSO changes the original
 * - Think: "Copy the shell, but the inside is shared"
 * 
 * Example:
 * const original = { name: 'John', address: { city: 'CDMX' } };
 * const shallow = { ...original };
 * shallow.address.city = 'Guadalajara';
 * console.log(original.address.city); // 'Guadalajara' (CHANGED!)
 * 
 * DEEP COPY:
 * - Creates a new object AND copies all nested objects
 * - Completely independent from the original
 * - Think: "Copy everything, including all the insides"
 * 
 * Example:
 * const deep = structuredClone(original);
 * deep.address.city = 'Guadalajara';
 * console.log(original.address.city); // 'CDMX' (unchanged)
 * 
 * WHEN TO USE EACH:
 * - Shallow: Simple objects, when you don't need nested independence
 * - Deep: Complex nested objects, when you need full independence
 * 
 * PERFORMANCE:
 * - Shallow is faster (less work)
 * - Deep is slower (traverses entire object tree)
 * - Don't deep copy unnecessarily
 * 
 * RELATED CONCEPTS:
 * - Pass by value vs pass by reference
 * - Object identity (=== checks reference, not value)
 * - Mutation vs immutability
 * ============================================================================
 */

/**
 * ============================================================================
 * SHALLOW COPY METHODS
 * ============================================================================
 * These methods only copy the first level of properties.
 * Nested objects are still shared references.
 * ============================================================================
 */

/**
 * copyWithObjectAssign - Shallow copy using Object.assign()
 * 
 * WHY: Object.assign() copies enumerable own properties from source to target.
 * 
 * CONCEPT:
 * - Object.assign(target, ...sources)
 * - Modifies and returns the target object
 * - When target is {}, it creates a new object
 * 
 * LIMITATIONS:
 * - Only copies own properties (not inherited ones)
 * - Only copies enumerable properties
 * - Nested objects are references (shallow)
 * 
 * @param {Object} obj - Object to copy
 * @returns {Object} New shallow copy
 */
export function copyWithObjectAssign(obj) {
    return Object.assign({}, obj);
}

/**
 * copyWithSpread - Shallow copy using spread operator (...)
 * 
 * WHY: Spread syntax is more concise and readable than Object.assign()
 * Introduced in ES2018 (ES9)
 * 
 * CONCEPT: Rest/Spread properties
 * - Spread (...obj) expands an object into individual properties
 * - Works like: { ...obj } = { key1: obj.key1, key2: obj.key2, ... }
 * 
 * @param {Object} obj - Object to copy
 * @returns {Object} New shallow copy
 */
export function copyWithSpread(obj) {
    return { ...obj };
}

/**
 * copyArrayWithFrom - Shallow copy array using Array.from()
 * 
 * WHY: Array.from() creates a new array from an iterable.
 * It's a shallow copy - nested objects are still references.
 * 
 * @param {Array} arr - Array to copy
 * @returns {Array} New shallow copy
 */
export function copyArrayWithFrom(arr) {
    return Array.from(arr);
}

/**
 * copyArrayWithSlice - Shallow copy array using .slice()
 * 
 * WHY: .slice() with no arguments returns a copy of the entire array.
 * It's the traditional way to copy arrays (pre-ES6).
 * 
 * @param {Array} arr - Array to copy
 * @returns {Array} New shallow copy
 */
export function copyArrayWithSlice(arr) {
    return arr.slice();
}

/**
 * ============================================================================
 * DEEP COPY METHODS
 * ============================================================================
 * These methods copy the entire object tree, creating full independence.
 * ============================================================================
 */

/**
 * copyWithJSON - Deep copy using JSON.parse(JSON.stringify())
 * 
 * WHY: This is the most common "quick and dirty" deep copy method.
 * 
 * HOW IT WORKS:
 * 1. JSON.stringify(obj) - Converts object to JSON string
 *    - This serializes all properties (creates new copies)
 * 2. JSON.parse(json) - Converts string back to object
 *    - This creates entirely new objects from the string
 * 
 * LIMITATIONS (IMPORTANT!):
 * - Cannot copy functions (they become undefined)
 * - Cannot copy Date objects (become strings)
 * - Cannot copy RegExp (becomes {})
 * - Cannot copy Map, Set, WeakMap, WeakSet
 * - Cannot copy Infinity, NaN (become null)
 * - Cannot copy undefined (omitted)
 * - CANNOT HANDLE CIRCULAR REFERENCES (infinite recursion!)
 * - Cannot copy class instances (loses prototype chain)
 * 
 * When to use:
 * - Simple data objects (API responses, plain objects)
 * - When you know the structure doesn't have special types
 * - Quick prototyping
 * 
 * @param {Object} obj - Object to deep copy
 * @returns {Object} New deep copy
 */
export function copyWithJSON(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * copyWithStructuredClone - Deep copy using structuredClone()
 * 
 * WHY: Modern browsers (2022+) have structuredClone() which handles
 * ALL the limitations of the JSON method.
 * 
 * ADVANTAGES OVER JSON METHOD:
 * - Handles Date objects
 * - Handles RegExp
 * - Handles Map, Set, WeakMap, WeakSet
 * - Handles ArrayBuffer, Blob, File
 * - Handles circular references!
 * - Preserves prototype chain (partially)
 * 
 * LIMITATIONS:
 * - Cannot copy functions
 * - Cannot copy DOM nodes
 * - Cannot copy constructors (class instances lose their methods)
 * - Older browsers don't support it (check availability)
 * 
 * @param {Object} obj - Object to deep copy
 * @returns {Object} New deep copy
 */
export function copyWithStructuredClone(obj) {
    return structuredClone(obj);
}

/**
 * copyRecursive - Manual recursive deep copy
 * 
 * WHY: Understanding recursion is important, and this gives you full control.
 * 
 * CONCEPT: Recursion
 * - A function that calls itself with a smaller input
 * - Must have a BASE CASE to stop (primitives, null)
 * - Must have a RECURSIVE CASE (objects/arrays call self)
 * 
 * ALGORITHM:
 * 1. If value is primitive or null → return it directly
 * 2. If value is an Array → map each element through copyRecursive
 * 3. If value is a Date/RegExp → create new instance
 * 4. If value is an Object → create new object, copy each property recursively
 * 5. Track visited objects to handle circular references
 * 
 * @param {*} obj - Value to copy
 * @param {WeakMap} [visited] - Track visited objects (for circular refs)
 * @returns {*} Deep copy of the value
 */
export function copyRecursive(obj, visited = new WeakMap()) {
    // BASE CASE: primitives and null
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    // Handle circular references
    if (visited.has(obj)) {
        return visited.get(obj);
    }
    
    // Handle Date
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    // Handle RegExp
    if (obj instanceof RegExp) {
        return new RegExp(obj.source, obj.flags);
    }
    
    // Handle Array
    if (Array.isArray(obj)) {
        const arrCopy = [];
        visited.set(obj, arrCopy);
        
        obj.forEach((item, index) => {
            arrCopy[index] = copyRecursive(item, visited);
        });
        
        return arrCopy;
    }
    
    // Handle Object
    const objCopy = {};
    visited.set(obj, objCopy);
    
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            objCopy[key] = copyRecursive(obj[key], visited);
        }
    }
    
    return objCopy;
}

/**
 * lodashDeepClone - Simplified lodash-style deep clone
 * 
 * WHY: Lodash's _.cloneDeep() is the gold standard for deep cloning.
 * This is a simplified version showing the concept.
 * 
 * Features:
 * - Handles circular references
 * - Handles common types (Date, RegExp, Map, Set)
 * - Preserves object structure
 * 
 * @param {*} value - Value to clone
 * @param {WeakMap} [hash] - Cache for circular references
 * @returns {*} Deep clone
 */
export function lodashDeepClone(value, hash = new WeakMap()) {
    // Primitives and null
    if (Object(value) !== value || value === null) {
        return value;
    }
    
    // Handle circular references
    if (hash.has(value)) {
        return hash.get(value);
    }
    
    // Handle Date
    if (value instanceof Date) {
        return new Date(value);
    }
    
    // Handle RegExp
    if (value instanceof RegExp) {
        return new RegExp(value);
    }
    
    // Handle Array
    if (Array.isArray(value)) {
        const result = [];
        hash.set(value, result);
        value.forEach((item, index) => {
            result[index] = lodashDeepClone(item, hash);
        });
        return result;
    }
    
    // Handle Map
    if (value instanceof Map) {
        const result = new Map();
        hash.set(value, result);
        value.forEach((val, key) => {
            result.set(lodashDeepClone(key, hash), lodashDeepClone(val, hash));
        });
        return result;
    }
    
    // Handle Set
    if (value instanceof Set) {
        const result = new Set();
        hash.set(value, result);
        value.forEach(val => {
            result.add(lodashDeepClone(val, hash));
        });
        return result;
    }
    
    // Handle Object (including class instances)
    const result = Object.create(Object.getPrototypeOf(value));
    hash.set(value, result);
    
    for (const key of Reflect.ownKeys(value)) {
        if (value.hasOwnProperty(key)) {
            result[key] = lodashDeepClone(value[key], hash);
        }
    }
    
    return result;
}

/**
 * ============================================================================
 * COMPARISON UTILITIES
 * ============================================================================
 */

/**
 * isDeepEqual - Deep comparison of two objects
 * 
 * WHY: After copying, you might need to verify equality.
 * Simple === only checks reference equality (same object in memory).
 * Deep equality checks if the STRUCTURE and VALUES are the same.
 * 
 * @param {*} obj1 - First value
 * @param {*} obj2 - Second value
 * @returns {boolean} True if deeply equal
 */
export function isDeepEqual(obj1, obj2) {
    // Same reference or both null/undefined
    if (obj1 === obj2) return true;
    
    // One is null/undefined
    if (obj1 === null || obj2 === null) return false;
    if (obj1 === undefined || obj2 === undefined) return false;
    
    // Different types
    if (typeof obj1 !== typeof obj2) return false;
    
    // Primitives
    if (typeof obj1 !== 'object') return obj1 === obj2;
    
    // Different number of keys
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    
    // Compare each key
    return keys1.every(key => 
        obj2.hasOwnProperty(key) && isDeepEqual(obj1[key], obj2[key])
    );
}

/**
 * getCopyMethod - Recommend the best copy method based on object complexity
 * 
 * WHY: Different situations call for different copy methods.
 * This helps choose the right one.
 * 
 * @param {*} obj - Object to copy
 * @returns {Object} { method: string, reason: string }
 */
export function getCopyMethod(obj) {
    if (obj === null || typeof obj !== 'object') {
        return {
            method: 'direct',
            reason: 'Primitive value, no copy needed (just assign)',
        };
    }
    
    const hasCircularRefs = hasCircularReference(obj);
    const hasSpecialTypes = containsSpecialTypes(obj);
    const isNested = hasNestedObjects(obj);
    
    if (hasCircularRefs) {
        return {
            method: 'structuredClone',
            reason: 'Object has circular references, only structuredClone handles them safely',
        };
    }
    
    if (hasSpecialTypes) {
        return {
            method: 'structuredClone',
            reason: 'Object contains Dates, RegExp, Map, or Set',
        };
    }
    
    if (!isNested) {
        return {
            method: 'spread',
            reason: 'Flat object, spread operator is fastest and most readable',
        };
    }
    
    return {
        method: 'JSON',
        reason: 'Nested plain objects, JSON method is simple and effective',
    };
}

// Helper functions for getCopyMethod
function hasCircularReference(obj, seen = new WeakSet()) {
    if (obj === null || typeof obj !== 'object') return false;
    
    if (seen.has(obj)) return true;
    seen.add(obj);
    
    for (const key of Object.keys(obj)) {
        if (hasCircularReference(obj[key], seen)) return true;
    }
    
    return false;
}

function containsSpecialTypes(obj) {
    if (obj === null || typeof obj !== 'object') return false;
    
    if (obj instanceof Date || obj instanceof RegExp || 
        obj instanceof Map || obj instanceof Set) {
        return true;
    }
    
    if (Array.isArray(obj)) {
        return obj.some(item => containsSpecialTypes(item));
    }
    
    return Object.values(obj).some(value => containsSpecialTypes(value));
}

function hasNestedObjects(obj) {
    if (obj === null || typeof obj !== 'object') return false;
    
    if (Array.isArray(obj)) {
        return obj.some(item => 
            item !== null && typeof item === 'object'
        );
    }
    
    return Object.values(obj).some(value => 
        value !== null && typeof value === 'object'
    );
}

/**
 * ============================================================================
 * INTERVIEW CHEAT SHEET (as comments)
 * ============================================================================
 * 
 * Q: What's the difference between shallow and deep copy?
 * A: Shallow copies the outer object but shares nested references.
 *    Deep copies everything, creating complete independence.
 * 
 * Q: When would you use spread vs Object.assign?
 * A: Functionally equivalent. Spread is more concise and modern.
 *    Object.assign can modify the target object (not just create new ones).
 * 
 * Q: What are the limitations of JSON.parse(JSON.stringify())?
 * A: Cannot copy functions, Dates (become strings), RegExp, undefined,
 *    Infinity, NaN, circular references, class instances.
 * 
 * Q: What is structuredClone and why is it better?
 * A: Modern browser API that handles Dates, RegExp, Map, Set,
 *    circular references. Still can't copy functions.
 * 
 * Q: How would you implement deep copy in an interview?
 * A: Start with base case (primitives, null), then handle arrays
 *    (map + recursive), then objects (for-in + recursive),
 *    then add circular reference handling with WeakMap.
 * 
 * Q: Performance considerations?
 * A: Spread is fastest for shallow copies.
 *    JSON is fast for simple objects.
 *    structuredClone is slower but handles more types.
 *    Recursive is slowest but most customizable.
 * ============================================================================
 */