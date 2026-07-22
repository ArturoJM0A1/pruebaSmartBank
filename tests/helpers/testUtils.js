/**
 * ============================================================================
 * SMARTBANK - TEST UTILITY HELPERS
 * ============================================================================
 * 
 * PURPOSE: Reusable utilities that simplify writing tests.
 * 
 * WHY test helpers?
 *   - REDUCE BOILERPLATE: Setting up DOM elements, waiting for async code,
 *     and simulating events requires repeated code. Helpers abstract this.
 *   - IMPREAD READABILITY: `waitForElement('#btn')` is clearer than
 *     `new Promise(resolve => { const check = () => { ... } })`.
 *   - ENFORCE CONSISTENCY: All tests use the same wait strategies,
 *     the same event simulation, the same DOM creation patterns.
 * 
 * TESTING PATTERNS USED:
 *   1. "Arrange-Act-Assert" (AAA): Every test has these three phases.
 *   2. "Given-When-Then": Same as AAA but from BDD perspective.
 *   3. "Page Object Model": Helpers hide DOM implementation details.
 * 
 * ============================================================================
 */

'use strict';

/**
 * ============================================================================
 * waitForElement - Wait for a DOM element to appear
 * ============================================================================
 * 
 * WHY: Components render asynchronously. After calling render(), the element
 * might not exist yet in the DOM. We need to wait for it.
 * 
 * HOW: Uses MutationObserver (browser API) to watch for DOM changes.
 * Alternative: polling with setInterval (less efficient but simpler).
 * 
 * @param {string} selector - CSS selector to wait for
 * @param {number} timeout - Max wait time in ms (default: 1000)
 * @returns {Promise<Element>} The found element
 * @throws {Error} If element not found within timeout
 * 
 * USAGE:
 *   renderComponent();
 *   const button = await waitForElement('.submit-button');
 *   expect(button).toBeTruthy();
 * ============================================================================
 */
function waitForElement(selector, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);

    if (element) {
      return resolve(element);
    }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(el);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for element: ${selector}`));
    }, timeout);
  });
}

/**
 * ============================================================================
 * createTestElement - Create a DOM element for testing
 * ============================================================================
 * 
 * WHY: Many tests need a DOM element but don't need a full component render.
 * This helper creates a minimal, properly-attached element.
 * 
 * IMPORTANT: Elements MUST be attached to document.body for event listeners
 * to work. Unattached elements (in memory only) won't fire events.
 * 
 * @param {string} html - HTML string to create
 * @returns {Element} The created and attached element
 * 
 * USAGE:
 *   const form = createTestElement('<form><input type="text" id="email"></form>');
 *   const input = form.querySelector('#email');
 *   simulateInput(input, 'test@example.com');
 * ============================================================================
 */
function createTestElement(html) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  // Return the first child (the actual element, not the wrapper)
  const element = wrapper.firstElementChild;

  // Store wrapper for cleanup
  element._testWrapper = wrapper;

  return element;
}

/**
 * ============================================================================
 * cleanupTestElement - Remove test elements from DOM
 * ============================================================================
 * 
 * WHY: Tests must clean up after themselves. Leftover DOM elements can:
 *   - Cause memory leaks in long test suites
   - Interfere with subsequent tests
 *   - Trigger unexpected event handlers
 * 
 * PATTERN: Always call this in afterEach() or afterAll()
 * ============================================================================
 */
function cleanupTestElement(element) {
  if (element && element._testWrapper) {
    element._testWrapper.remove();
  } else if (element) {
    element.remove();
  }
}

/**
 * ============================================================================
 * simulateClick - Simulate a click event
 * ============================================================================
 * 
 * WHY not just element.click()?
 *   - element.click() only fires a basic 'click' event.
 *   - Real user clicks also fire: mousedown → mouseup → click.
 *   - Some frameworks listen for mousedown/mouseup, not just click.
 * 
 * @param {Element} element - Element to click
 * 
 * USAGE:
 *   const button = document.querySelector('#submit-btn');
 *   simulateClick(button);
 *   expect(mockHandler).toHaveBeenCalledTimes(1);
 * ============================================================================
 */
function simulateClick(element) {
  const events = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];

  events.forEach((eventType) => {
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    element.dispatchEvent(event);
  });
}

/**
 * ============================================================================
 * simulateInput - Simulate text input into a form field
 * ============================================================================
 * 
 * WHY not just element.value = 'test'?
 *   - Setting .value programmatically doesn't fire 'input' event.
 *   - React/Vue/Angular listen for 'input' events to update state.
 *   - Real typing fires: keydown → keypress → input → keyup.
 * 
 * @param {Element} element - Input element
 * @param {string} value - Value to type
 * 
 * USAGE:
 *   const emailInput = document.querySelector('#email');
 *   simulateInput(emailInput, 'user@smartbank.com');
 *   expect(emailInput.value).toBe('user@smartbank.com');
 * ============================================================================
 */
function simulateInput(element, value) {
  element.focus();
  element.value = value;

  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * ============================================================================
 * flushPromises - Wait for all pending promises to resolve
 * ============================================================================
 * 
 * WHY: JavaScript is asynchronous. After calling an async function,
 * the results aren't immediately available. We need to wait.
 * 
 * HOW: setTimeout(0) pushes execution to the end of the microtask queue.
 * This is a common pattern in React/Vue testing.
 * 
 * ALTERNATIVE: jest.runAllTimers() if using fake timers.
 * 
 * @returns {Promise<void>}
 * 
 * USAGE:
 *   await flushPromises();
 *   expect(element.textContent).toBe('Updated content');
 * ============================================================================
 */
function flushPromises() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * ============================================================================
 * createMockEvent - Create a mock event object
 * ============================================================================
 * 
 * WHY: Event handlers receive an event object with properties like:
 *   - preventDefault(): Prevents form submission, link navigation, etc.
 *   - stopPropagation(): Stops event from bubbling up the DOM.
 *   - target.value: The current value of the input.
 * 
 * In tests, we need to mock these methods to verify they're called.
 * 
 * @param {Object} overrides - Custom event properties
 * @returns {Object} Mock event object
 * 
 * USAGE:
 *   const mockEvent = createMockEvent({ target: { value: 'test' } });
 *   handler(mockEvent);
 *   expect(mockEvent.preventDefault).toHaveBeenCalled();
 * ============================================================================
 */
function createMockEvent(overrides = {}) {
  return {
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    stopImmediatePropagation: jest.fn(),
    target: { value: '', ...overrides.target },
    currentTarget: { value: '' },
    type: 'click',
    bubbles: true,
    cancelable: true,
    ...overrides,
  };
}

/**
 * ============================================================================
 * sleep - Async delay utility
 * ============================================================================
 * 
 * WHY: Sometimes tests need to wait for real time to pass:
 *   - Debounce/throttle tests
 *   - Animation tests
 *   - Rate limiting tests
 * 
 * WARNING: Don't use in most tests! Use jest.useFakeTimers() instead.
 * This is ONLY for tests that require real time passage.
 * 
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 * ============================================================================
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================
module.exports = {
  waitForElement,
  createTestElement,
  cleanupTestElement,
  simulateClick,
  simulateInput,
  flushPromises,
  createMockEvent,
  sleep,
};
