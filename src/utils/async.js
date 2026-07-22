/**
 * ============================================================================
 * Async Utility Functions
 * ============================================================================
 * 
 * PURPOSE:
 * Utilities for working with asynchronous operations (Promises, async/await).
 * These functions handle common async patterns like:
 * - Timeouts
 * - Retries
 * - Parallel execution
 * - Concurrency control
 * 
 * UNDERSTANDING THE EVENT LOOP:
 * JavaScript is single-threaded but handles async operations via the Event Loop.
 * 
 * ┌─────────────────────────────────────────────────────┐
 * │                    JS Engine                         │
 * │  ┌─────────────────────────────────────────────┐    │
 * │  │              Call Stack                      │    │
 * │  │  (executes synchronous code, one at a time) │    │
 * │  └─────────────────────────────────────────────┘    │
 * │                      │                               │
 * │                      ▼                               │
 * │  ┌─────────────────────────────────────────────┐    │
 * │  │           Web APIs / Node APIs              │    │
 * │  │  (setTimeout, fetch, DOM events, etc.)      │    │
 * │  └─────────────────────────────────────────────┘    │
 * │                      │                               │
 * │          ┌───────────┴───────────┐                   │
 * │          ▼                       ▼                   │
 * │  ┌──────────────┐        ┌──────────────┐           │
 * │  │ Microtask    │        │ Macrotask    │           │
 * │  │ Queue        │        │ Queue        │           │
 * │  │ (Promises)   │        │ (setTimeout) │           │
 * │  │ Higher prio  │        │ Lower prio   │           │
 * │  └──────────────┘        └──────────────┘           │
 * │          │                       │                   │
 * │          └───────────┬───────────┘                   │
 * │                      ▼                               │
 * │  ┌─────────────────────────────────────────────┐    │
 * │  │              Event Loop                      │    │
 * │  │  (moves tasks from queues to call stack)     │    │
 * │  └─────────────────────────────────────────────┘    │
 * └─────────────────────────────────────────────────────┘
 * 
 * KEY CONCEPTS:
 * - Microtasks (Promises) have higher priority than macrotasks (setTimeout)
 * - Promise.then callbacks are microtasks
 * - All microtasks run before the next macrotask
 * - This means Promise.resolve().then() runs BEFORE setTimeout(fn, 0)
 * 
 * RELATED CONCEPTS:
 * - Promises (then/catch/finally)
 * - Async/Await (syntactic sugar over Promises)
 * - Generators (used by async/await internally)
 * - Worker Threads (true parallelism in JS)
 * ============================================================================
 */

/**
 * fetchWithTimeout - Fetch with automatic timeout
 * 
 * WHY: The default fetch() has no timeout. A slow server could make
 * the user wait forever. This adds a timeout.
 * 
 * CONCEPT: Promise.race()
 * - Promise.race([promise1, promise2]) resolves/rejects with the
 *   FIRST promise to settle (resolve or reject)
 * - We race the actual fetch against a timeout promise
 * - If timeout resolves first, we throw a timeout error
 * 
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>} Fetch response
 */
export async function fetchWithTimeout(url, options = {}, timeout = 30000) {
    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Request timed out after ${timeout}ms`));
        }, timeout);
    });
    
    // Create the actual fetch promise
    const fetchPromise = fetch(url, options);
    
    // Race them - first to settle wins
    try {
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        return response;
    } catch (error) {
        // If it's our timeout error, throw it
        if (error.message.includes('timed out')) {
            throw error;
        }
        // Otherwise, it's a fetch error
        throw error;
    }
}

/**
 * retry - Retry a failed operation
 * 
 * WHY: Network operations can fail transiently (temporary failures).
 * Retrying immediately or after a delay often succeeds.
 * 
 * CONCEPT: Exponential Backoff
 * - Wait longer between each retry
 * - Attempt 1: 0ms, Attempt 2: 1000ms, Attempt 3: 2000ms
 * - Prevents overwhelming the server with rapid retries
 * - Called "exponential" because delay grows exponentially in production
 * 
 * @param {Function} fn - Async function to retry
 * @param {number} retries - Number of retries
 * @param {number} delay - Base delay in ms
 * @returns {Promise} Result of the function
 */
export async function retry(fn, retries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            // Try to execute the function
            return await fn();
        } catch (error) {
            lastError = error;
            
            // If we have retries left, wait and try again
            if (attempt < retries) {
                // Exponential backoff: delay * 2^attempt
                const waitTime = delay * Math.pow(2, attempt);
                console.log(`Attempt ${attempt + 1} failed, retrying in ${waitTime}ms...`);
                await sleep(waitTime);
            }
        }
    }
    
    // All retries failed
    throw lastError;
}

/**
 * parallel - Run promises in parallel (with limit)
 * 
 * WHY: Promise.all() runs ALL promises at once. If you have 100 API calls,
 * that's 100 simultaneous requests, which can overwhelm the server.
 * 
 * This function runs promises in parallel but respects a concurrency limit.
 * 
 * CONCEPT: Promise.all()
 * - Takes an array of promises
 * - Resolves when ALL promises resolve
 * - Rejects if ANY promise rejects
 * - Results are in the same order as input
 * 
 * @param {Array<Function>} tasks - Array of async functions
 * @param {number} concurrency - Max parallel operations
 * @returns {Promise<Array>} Array of results
 */
export async function parallel(tasks, concurrency = 5) {
    const results = [];
    const executing = new Set();
    
    for (const task of tasks) {
        // Create the promise
        const promise = task().then(result => {
            executing.delete(promise);
            return result;
        });
        
        executing.add(promise);
        results.push(promise);
        
        // If we've reached the limit, wait for one to complete
        if (executing.size >= concurrency) {
            await Promise.race(executing);
        }
    }
    
    return Promise.all(results);
}

/**
 * sequential - Run promises one after another
 * 
 * WHY: Some operations must happen in order:
 * - Creating a user, then creating their account, then their card
 * - Each step depends on the previous one's result
 * 
 * CONCEPT: Sequential async/await
 * - Each await pauses until the promise resolves
 * - The next line runs after the previous one completes
 * 
 * @param {Array<Function>} tasks - Array of async functions
 * @returns {Promise<Array>} Array of results in order
 */
export async function sequential(tasks) {
    const results = [];
    
    for (const task of tasks) {
        const result = await task();
        results.push(result);
    }
    
    return results;
}

/**
 * queue - Task queue with concurrency control
 * 
 * WHY: Like parallel(), but with a queue system.
 * Tasks are added to a queue and executed when a slot opens.
 * Useful for background processing, job queues, etc.
 * 
 * CONCEPT: Producer-Consumer pattern
 * - Producer: Adds tasks to the queue
 * - Consumer: Takes tasks from queue and executes
 * - The queue manages the flow between them
 * 
 * @param {number} concurrency - Max parallel tasks
 * @returns {Object} Queue controller
 */
export function queue(concurrency = 3) {
    const tasks = [];
    let running = 0;
    let resolveWaiting = null;
    
    /**
     * Add a task to the queue
     * @param {Function} task - Async function to execute
     * @returns {Promise} Resolves with task result
     */
    function add(task) {
        return new Promise((resolve, reject) => {
            tasks.push({ task, resolve, reject });
            processNext();
        });
    }
    
    /**
     * Process next task if slot available
     */
    async function processNext() {
        if (running >= concurrency || tasks.length === 0) {
            return;
        }
        
        running++;
        const { task, resolve, reject } = tasks.shift();
        
        try {
            const result = await task();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            running--;
            processNext();
        }
    }
    
    /**
     * Wait for all tasks to complete
     * @returns {Promise} Resolves when queue is empty
     */
    function drain() {
        if (tasks.length === 0 && running === 0) {
            return Promise.resolve();
        }
        
        return new Promise(resolve => {
            resolveWaiting = resolve;
        });
    }
    
    /**
     * Get queue status
     * @returns {Object} Queue status
     */
    function status() {
        return {
            pending: tasks.length,
            running: running,
            total: tasks.length + running,
        };
    }
    
    return { add, drain, status };
}

/**
 * sleep - Promise-based delay
 * 
 * WHY: Sometimes you need to wait in async code:
 * - Polling with intervals
 * - Rate limiting
 * - Testing with artificial delays
 * 
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Resolves after the delay
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * debounceAsync - Debounce async functions
 * 
 * WHY: For search-as-you-type with API calls, you want to debounce
 * the API request, not just the keystroke handling.
 * 
 * @param {Function} fn - Async function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function} Debounced async function
 */
export function debounceAsync(fn, delay = 300) {
    let timeoutId;
    let pendingPromise = null;
    
    return function debounced(...args) {
        // Cancel previous timeout
        clearTimeout(timeoutId);
        
        // Return existing promise if pending
        if (pendingPromise) {
            return pendingPromise;
        }
        
        // Create new promise
        pendingPromise = new Promise((resolve, reject) => {
            timeoutId = setTimeout(async () => {
                try {
                    const result = await fn.apply(this, args);
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    pendingPromise = null;
                }
            }, delay);
        });
        
        return pendingPromise;
    };
}

/**
 * Promise Utilities
 */

/**
 * allSettled - Like Promise.all() but doesn't reject on first failure
 * 
 * WHY: Sometimes you want to know about ALL results, even failures.
 * Promise.all() rejects immediately on first failure.
 * Promise.allSettled() waits for all to complete.
 * 
 * @param {Array<Promise>} promises - Array of promises
 * @returns {Promise<Array>} Array of { status, value/reason }
 */
export async function allSettled(promises) {
    return Promise.allSettled(promises);
}

/**
 * any - Resolves with first successful promise
 * 
 * WHY: Try multiple sources, use the first successful one.
 * Example: Try multiple API endpoints, use the fastest.
 * 
 * @param {Array<Promise>} promises - Array of promises
 * @returns {Promise} Resolves with first success
 */
export async function any(promises) {
    return Promise.any(promises);
}

/**
 * repeat - Repeat a function N times with delay
 * 
 * @param {Function} fn - Function to repeat
 * @param {number} times - Number of times to repeat
 * @param {number} delay - Delay between repeats
 * @returns {Promise<Array>} Array of results
 */
export async function repeat(fn, times, delay = 0) {
    const results = [];
    
    for (let i = 0; i < times; i++) {
        results.push(await fn(i));
        
        if (delay > 0 && i < times - 1) {
            await sleep(delay);
        }
    }
    
    return results;
}

/**
 * timeout - Add timeout to any promise
 * 
 * @param {Promise} promise - Promise to add timeout to
 * @param {number} ms - Timeout in milliseconds
 * @param {string} message - Error message
 * @returns {Promise} Promise that rejects on timeout
 */
export function timeout(promise, ms, message = 'Operation timed out') {
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(message)), ms);
    });
    
    return Promise.race([promise, timeoutPromise]);
}