/**
 * ============================================================================
 * Toast Notification System
 * ============================================================================
 * 
 * PURPOSE:
 * Non-blocking notification messages that appear and auto-dismiss.
 * Used for success, error, warning, and info messages.
 * 
 * TOAST vs MODAL:
 * - Toast: Non-blocking, auto-dismiss, appears at edge of screen
 * - Modal: Blocking, requires user action, covers content
 * 
 * Z-INDEX MANAGEMENT:
 * - Toasts need to appear above other content
 * - Stack multiple toasts vertically
 * - Use z-index carefully to avoid conflicts
 * 
 * NOTIFICATION PATTERNS:
 * - Material Design: Snackbar at bottom
 * - iOS: Banner at top
 * - Bootstrap: Alert in corner
 * - Our approach: Bottom-right corner, stack vertically
 * 
 * RELATED CONCEPTS:
 * - Non-blocking notifications
 * - Auto-dismiss timers
 * - Toast stacking
 * - Z-index layering
 * ============================================================================
 */

import { createElement, on, addClass, removeClass } from '../../utils/dom.js';
import { TOAST_DURATION } from '../../constants/app.js';

class Toast {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.maxToasts = 5;
        
        // Create container
        this._createContainer();
    }
    
    /**
     * _createContainer - Create toast container
     * 
     * WHY: All toasts are appended to a single container.
     * This makes positioning and stacking easy.
     * 
     * @private
     */
    _createContainer() {
        // Check if container already exists
        this.container = document.getElementById('toast-container');
        
        if (!this.container) {
            this.container = createElement('div', {
                id: 'toast-container',
                className: 'toast-container',
                'aria-live': 'polite',
                'aria-atomic': 'false',
            });
            
            document.body.appendChild(this.container);
        }
    }
    
    /**
     * show - Show a toast notification
     * 
     * @param {Object} options - Toast options
     * @param {string} options.message - Message to display
     * @param {string} options.type - Type: success, error, warning, info
     * @param {number} options.duration - Auto-dismiss time in ms
     * @param {boolean} options.closable - Show close button
     * @param {Function} options.onClick - Click handler
     * @returns {Object} Toast instance for programmatic control
     */
    show(options = {}) {
        const {
            message = '',
            type = 'info',
            duration = TOAST_DURATION[type.toUpperCase()] || TOAST_DURATION.INFO,
            closable = true,
            onClick = null,
        } = options;
        
        // Remove oldest toast if at limit
        if (this.toasts.length >= this.maxToasts) {
            this._dismiss(this.toasts[0]);
        }
        
        // Create toast element
        const toast = this._createToast({ message, type, closable, onClick });
        
        // Add to container
        this.container.appendChild(toast);
        
        // Track toast
        const toastInstance = {
            element: toast,
            timeout: null,
            type,
        };
        
        this.toasts.push(toastInstance);
        
        // Animate in
        requestAnimationFrame(() => {
            addClass(toast, 'toast--visible');
        });
        
        // Auto-dismiss
        if (duration > 0) {
            toastInstance.timeout = setTimeout(() => {
                this._dismiss(toastInstance);
            }, duration);
        }
        
        // Return control methods
        return {
            dismiss: () => this._dismiss(toastInstance),
            update: (newMessage) => {
                const msgEl = toast.querySelector('.toast__message');
                if (msgEl) msgEl.textContent = newMessage;
            },
        };
    }
    
    /**
     * _createToast - Create toast DOM element
     * 
     * @private
     * @param {Object} options - Toast options
     * @returns {Element} Toast element
     */
    _createToast({ message, type, closable, onClick }) {
        const toast = createElement('div', {
            className: `toast toast--${type}`,
            role: 'alert',
            'aria-live': 'assertive',
            'aria-atomic': 'true',
        },
            // Icon
            createElement('div', { className: 'toast__icon' },
                this._getIcon(type)
            ),
            
            // Message
            createElement('div', { className: 'toast__message' }, message),
            
            // Close button
            closable ? createElement('button', {
                className: 'toast__close',
                'aria-label': 'Close notification',
                onClick: (e) => {
                    e.stopPropagation();
                    const toastInstance = this.toasts.find(t => t.element === toast);
                    if (toastInstance) {
                        this._dismiss(toastInstance);
                    }
                },
            }, createElement('span', { className: 'icon-x' })) : null
        );
        
        // Click handler
        if (onClick) {
            toast.style.cursor = 'pointer';
            on(toast, 'click', onClick);
        }
        
        return toast;
    }
    
    /**
     * _getIcon - Get icon for toast type
     * 
     * @private
     * @param {string} type - Toast type
     * @returns {Element} Icon element
     */
    _getIcon(type) {
        const icons = {
            success: createElement('span', { className: 'icon-check-circle' }),
            error: createElement('span', { className: 'icon-x-circle' }),
            warning: createElement('span', { className: 'icon-alert-triangle' }),
            info: createElement('span', { className: 'icon-info' }),
        };
        
        return icons[type] || icons.info;
    }
    
    /**
     * _dismiss - Dismiss a toast with animation
     * 
     * @private
     * @param {Object} toastInstance - Toast instance to dismiss
     */
    _dismiss(toastInstance) {
        if (!toastInstance || !toastInstance.element) return;
        
        // Clear timeout
        if (toastInstance.timeout) {
            clearTimeout(toastInstance.timeout);
        }
        
        // Animate out
        removeClass(toastInstance.element, 'toast--visible');
        addClass(toastInstance.element, 'toast--hiding');
        
        // Remove after animation
        setTimeout(() => {
            if (toastInstance.element && toastInstance.element.parentNode) {
                toastInstance.element.parentNode.removeChild(toastInstance.element);
            }
            
            // Remove from array
            const index = this.toasts.indexOf(toastInstance);
            if (index > -1) {
                this.toasts.splice(index, 1);
            }
        }, 300);
    }
    
    /**
     * success - Show success toast
     * 
     * @param {string} message - Success message
     * @param {Object} options - Additional options
     * @returns {Object} Toast instance
     */
    success(message, options = {}) {
        return this.show({ message, type: 'success', ...options });
    }
    
    /**
     * error - Show error toast
     * 
     * @param {string} message - Error message
     * @param {Object} options - Additional options
     * @returns {Object} Toast instance
     */
    error(message, options = {}) {
        return this.show({ 
            message, 
            type: 'error', 
            duration: TOAST_DURATION.ERROR,
            ...options 
        });
    }
    
    /**
     * warning - Show warning toast
     * 
     * @param {string} message - Warning message
     * @param {Object} options - Additional options
     * @returns {Object} Toast instance
     */
    warning(message, options = {}) {
        return this.show({ 
            message, 
            type: 'warning',
            duration: TOAST_DURATION.WARNING,
            ...options 
        });
    }
    
    /**
     * info - Show info toast
     * 
     * @param {string} message - Info message
     * @param {Object} options - Additional options
     * @returns {Object} Toast instance
     */
    info(message, options = {}) {
        return this.show({ message, type: 'info', ...options });
    }
    
    /**
     * dismissAll - Dismiss all toasts
     */
    dismissAll() {
        [...this.toasts].forEach(toast => {
            this._dismiss(toast);
        });
    }
    
    /**
     * destroy - Clean up toast system
     */
    destroy() {
        this.dismissAll();
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        this.container = null;
        this.toasts = [];
    }
}

// Create singleton instance
const toast = new Toast();

export default toast;