/**
 * ============================================================================
 * DOM Manipulation Utilities
 * ============================================================================
 * 
 * PURPOSE:
 * Wrappers around native DOM APIs that:
 * 1. Reduce verbosity (shorter, readable code)
 * 2. Add safety checks (null handling)
 * 3. Provide consistent patterns across the app
 * 4. Make DOM manipulation more functional
 * 
 * WHY NOT USE A FRAMEWORK?
 * - Learning: Understanding vanilla DOM manipulation is fundamental
 * - Performance: No virtual DOM overhead for simple apps
 * - Bundle size: No framework to download
 * - Control: Direct DOM access when you need it
 * 
 * MODERN DOM APIs:
 * - querySelector/querySelectorAll (replaced getElementById, getElementsByClassName)
 * - classList API (replaced className string manipulation)
 * - dataset (replaced getAttribute('data-*'))
 * - Template literals (replaced innerHTML concatenation)
 * 
 * PERFORMANCE TIPS:
 * - Cache DOM queries (don't query the same element repeatedly)
 * - Use DocumentFragment for batch DOM insertions
 * - Prefer CSS animations over JavaScript animations
 * - Use event delegation for dynamic content
 * 
 * RELATED CONCEPTS:
 * - Virtual DOM (React, Vue) - abstraction over real DOM
 * - DOM diffing algorithms
 * - Shadow DOM (Web Components)
 * ============================================================================
 */

/**
 * $ - Query single element (querySelector shorthand)
 * 
 * WHY: document.querySelector() is verbose. $ is shorter and common convention.
 * jQuery uses $, but we're using it as a vanilla JS shorthand.
 * 
 * @param {string} selector - CSS selector
 * @param {Element} [parent=document] - Parent element to search within
 * @returns {Element|null} Found element or null
 */
export function $(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * $$ - Query multiple elements as Array (querySelectorAll shorthand)
 * 
 * WHY: querySelectorAll returns a NodeList, which doesn't have Array methods
 * like .map(), .filter(), .forEach(). Converting to Array gives us all
 * those methods.
 * 
 * CONCEPT: Array.from() converts iterables to arrays
 * - NodeList is iterable but not an array
 * - Array.from() creates a new array from any iterable
 * - Alternative: [...nodeList] spread operator also works
 * 
 * @param {string} selector - CSS selector
 * @param {Element} [parent=document] - Parent element to search within
 * @returns {Array<Element>} Array of found elements
 */
export function $$(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
}

/**
 * createElement - Create DOM element with attributes and children
 * 
 * WHY: document.createElement() + setAttribute() + appendChild() is verbose.
 * This function lets you create elements in one call.
 * 
 * CONCEPT:
 * - Object destructuring: const { className, id } = attrs
 * - Spread operator: ...attrs for passing object properties
 * - Rest parameters: ...children for variable arguments
 * 
 * @param {string} tag - HTML tag name
 * @param {Object} [attrs={}] - Attributes to set
 * @param {...(Element|string)} children - Child elements or text
 * @returns {Element} Created element
 */
export function createElement(tag, attrs = {}, ...children) {
    const element = document.createElement(tag);
    
    // Set attributes
    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            // Set data-* attributes
            for (const [dataKey, dataValue] of Object.entries(value)) {
                element.dataset[dataKey] = dataValue;
            }
        } else if (key.startsWith('on') && typeof value === 'function') {
            // Event handlers: onClick -> click
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, value);
        } else if (key === 'style' && typeof value === 'object') {
            // Style object
            Object.assign(element.style, value);
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else if (key === 'textContent') {
            element.textContent = value;
        } else {
            element.setAttribute(key, value);
        }
    }
    
    // Add children
    for (const child of children) {
        if (child === null || child === undefined) continue;
        
        if (typeof child === 'string' || typeof child === 'number') {
            // Text nodes
            element.appendChild(document.createTextNode(String(child)));
        } else if (child instanceof Element) {
            element.appendChild(child);
        } else if (Array.isArray(child)) {
            // Handle arrays of children
            child.forEach(c => {
                if (c instanceof Element) {
                    element.appendChild(c);
                } else if (c !== null && c !== undefined) {
                    element.appendChild(document.createTextNode(String(c)));
                }
            });
        }
    }
    
    return element;
}

/**
 * html - Parse HTML string to DOM element
 * 
 * WHY: Sometimes you have an HTML string (from templates) and need to
 * convert it to a real DOM element.
 * 
 * CONCEPT: Template literals (backticks)
 * - Allow multi-line strings
 * - Support interpolation: ${variable}
 * - More readable than string concatenation
 * 
 * SECURITY WARNING: Don't use with user input (XSS vulnerability)
 * innerHTML executes any <script> tags in the HTML
 * 
 * @param {string} template - HTML string
 * @returns {Element} Parsed element
 */
export function html(template) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(template, 'text/html');
    return doc.body.firstElementChild;
}

/**
 * ============================================================================
 * ELEMENT VISIBILITY
 * ============================================================================
 */

/**
 * show - Make element visible
 * 
 * WHY: Common pattern in UI - show/hide elements based on state
 * 
 * @param {Element} element - DOM element
 */
export function show(element) {
    if (!element) return;
    element.style.display = '';
    element.removeAttribute('hidden');
}

/**
 * hide - Hide element
 * 
 * @param {Element} element - DOM element
 */
export function hide(element) {
    if (!element) return;
    element.style.display = 'none';
}

/**
 * toggle - Toggle element visibility
 * 
 * @param {Element} element - DOM element
 * @param {boolean} [force] - Force show (true) or hide (false)
 */
export function toggle(element, force) {
    if (!element) return;
    const isVisible = element.style.display !== 'none' && !element.hidden;
    const shouldShow = force !== undefined ? force : !isVisible;
    
    if (shouldShow) {
        show(element);
    } else {
        hide(element);
    }
}

/**
 * ============================================================================
 * CLASS MANIPULATION
 * ============================================================================
 * Using classList API (modern, clean, supported in all modern browsers)
 * ============================================================================
 */

/**
 * addClass - Add CSS class(es) to element
 * 
 * @param {Element} element - DOM element
 * @param {...string} classes - Class names to add
 */
export function addClass(element, ...classes) {
    if (!element) return;
    element.classList.add(...classes);
}

/**
 * removeClass - Remove CSS class(es) from element
 * 
 * @param {Element} element - DOM element
 * @param {...string} classes - Class names to remove
 */
export function removeClass(element, ...classes) {
    if (!element) return;
    element.classList.remove(...classes);
}

/**
 * toggleClass - Toggle CSS class on element
 * 
 * @param {Element} element - DOM element
 * @param {string} className - Class name to toggle
 * @param {boolean} [force] - Force add (true) or remove (false)
 */
export function toggleClass(element, className, force) {
    if (!element) return;
    element.classList.toggle(className, force);
}

/**
 * hasClass - Check if element has CSS class
 * 
 * @param {Element} element - DOM element
 * @param {string} className - Class name to check
 * @returns {boolean} True if element has the class
 */
export function hasClass(element, className) {
    if (!element) return false;
    return element.classList.contains(className);
}

/**
 * ============================================================================
 * EVENT HANDLING
 * ============================================================================
 * Event listeners with cleanup tracking
 * ============================================================================
 */

/**
 * Event manager for cleanup
 * 
 * WHY: When building SPAs, you need to remove event listeners when
 * components are destroyed to prevent memory leaks.
 * 
 * CONCEPT: WeakMap
 * - Keys must be objects (not primitives)
 * - Entries are garbage collected when the key object is garbage collected
 * - Perfect for associating data with DOM elements
 */
const eventListeners = new WeakMap();

/**
 * on - Add event listener with cleanup tracking
 * 
 * WHY: Native addEventListener doesn't track what's been added.
 * We need to track for cleanup in SPAs.
 * 
 * CONCEPT: WeakMap usage
 * - DOM elements as keys (they can be garbage collected)
 * - Array of listeners as values
 * - When element is removed from DOM, its listeners are automatically cleaned up
 * 
 * @param {Element} element - DOM element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} [options] - addEventListener options
 * @returns {Function} Cleanup function
 */
export function on(element, event, handler, options) {
    if (!element) return () => {};
    
    element.addEventListener(event, handler, options);
    
    // Track the listener for cleanup
    if (!eventListeners.has(element)) {
        eventListeners.set(element, []);
    }
    eventListeners.get(element).push({ event, handler, options });
    
    // Return cleanup function
    return () => {
        element.removeEventListener(event, handler, options);
        const listeners = eventListeners.get(element);
        if (listeners) {
            const index = listeners.findIndex(l => l.handler === handler);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    };
}

/**
 * off - Remove event listener
 * 
 * @param {Element} element - DOM element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler to remove
 */
export function off(element, event, handler) {
    if (!element) return;
    element.removeEventListener(event, handler);
}

/**
 * delegate - Event delegation
 * 
 * WHY: When you have many similar elements (list items, table rows),
 * adding a listener to each is inefficient. Instead, add ONE listener
 * to the parent and check which child was clicked.
 * 
 * CONCEPT: Event Bubbling
 * - Events bubble up from the target element to the root
 * - Click on <li> → bubbles to <ul> → bubbles to <div> → ...
 * - Parent receives the event with event.target pointing to original element
 * 
 * PERFORMANCE:
 * - 100 list items = 100 addEventListener calls (bad)
 * - Event delegation = 1 addEventListener call (good)
 * 
 * @param {Element} parent - Parent element
 * @param {string} selector - CSS selector for child elements
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @returns {Function} Cleanup function
 */
export function delegate(parent, selector, event, handler) {
    return on(parent, event, (e) => {
        // Find the closest ancestor that matches the selector
        const target = e.target.closest(selector);
        
        // If found AND it's within the parent (not outside)
        if (target && parent.contains(target)) {
            handler.call(target, e, target);
        }
    });
}

/**
 * ============================================================================
 * ANIMATION UTILITIES
 * ============================================================================
 */

/**
 * animate - CSS animation wrapper
 * 
 * WHY: Web Animations API provides more control than CSS animations
 * - Can be controlled (pause, reverse, cancel)
 * - Returns a Promise (know when animation completes)
 * - Better for dynamic animations
 * 
 * @param {Element} element - DOM element to animate
 * @param {Array} keyframes - Animation keyframes
 * @param {Object} [options] - Animation options
 * @returns {Animation} Web Animation object
 */
export function animate(element, keyframes, options = {}) {
    const defaultOptions = {
        duration: 300,
        easing: 'ease-in-out',
        fill: 'forwards',
    };
    
    return element.animate(keyframes, { ...defaultOptions, ...options });
}

/**
 * fadeIn - Fade element in
 * 
 * @param {Element} element - DOM element
 * @param {number} [duration=300] - Animation duration in ms
 * @returns {Promise} Resolves when animation completes
 */
export function fadeIn(element, duration = 300) {
    if (!element) return Promise.resolve();
    
    element.style.display = '';
    element.style.opacity = '0';
    
    const animation = animate(element, [
        { opacity: 0 },
        { opacity: 1 }
    ], { duration });
    
    return animation.finished;
}

/**
 * fadeOut - Fade element out
 * 
 * @param {Element} element - DOM element
 * @param {number} [duration=300] - Animation duration in ms
 * @returns {Promise} Resolves when animation completes
 */
export function fadeOut(element, duration = 300) {
    if (!element) return Promise.resolve();
    
    const animation = animate(element, [
        { opacity: 1 },
        { opacity: 0 }
    ], { duration });
    
    return animation.finished.then(() => {
        element.style.display = 'none';
    });
}

/**
 * ============================================================================
 * UTILITY FUNCTIONS
 * ============================================================================
 */

/**
 * clearChildren - Remove all children from element
 * 
 * WHY: When updating dynamic content, it's easier to clear and rebuild
 * than to diff and update individual elements.
 * 
 * PERFORMANCE NOTE: element.innerHTML = '' is faster but can cause
 * memory leaks with event listeners. This approach is safer.
 * 
 * @param {Element} element - DOM element
 */
export function clearChildren(element) {
    if (!element) return;
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * getScrollPosition - Get current scroll position
 * 
 * @returns {Object} { x, y } scroll position
 */
export function getScrollPosition() {
    return {
        x: window.scrollX || window.pageXOffset,
        y: window.scrollY || window.pageYOffset,
    };
}

/**
 * scrollTo - Scroll to element or position
 * 
 * @param {Element|number} target - Element to scroll to or y position
 * @param {Object} [options] - Scroll options
 */
export function scrollTo(target, options = {}) {
    const { behavior = 'smooth', block = 'start' } = options;
    
    if (target instanceof Element) {
        target.scrollIntoView({ behavior, block });
    } else {
        window.scrollTo({
            top: target,
            behavior,
        });
    }
}

/**
 * isElementInViewport - Check if element is visible in viewport
 * 
 * WHY: Lazy loading, infinite scroll, scroll animations
 * 
 * @param {Element} element - DOM element
 * @returns {boolean} True if element is in viewport
 */
export function isElementInViewport(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * createElementFromHTML - Convert HTML string to DOM element (alias)
 * 
 * @param {string} htmlString - HTML string
 * @returns {Element} DOM element
 */
export function createElementFromHTML(htmlString) {
    const template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    return template.content.firstChild;
}