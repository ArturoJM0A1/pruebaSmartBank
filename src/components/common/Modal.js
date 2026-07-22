/**
 * ============================================================================
 * Modal Component
 * ============================================================================
 * 
 * PURPOSE:
 * Reusable modal/dialog component for displaying content overlay.
 * 
 * ACCESSIBILITY (ARIA):
 * - role="dialog" indicates this is a dialog
 * - aria-modal="true" indicates it's modal (blocks interaction with rest)
 * - aria-labelledby points to the title element
 * - Focus trap: Tab key cycles within modal, not outside
 * 
 * FOCUS MANAGEMENT:
 * - When modal opens: focus first focusable element
 * - When modal closes: return focus to trigger element
 * - Tab key cycles through focusable elements within modal
 * 
 * ANIMATION:
 * - Fade in/out using CSS transitions
 * - Overlay fades in, content slides up
 * 
 * RELATED CONCEPTS:
 * - WAI-ARIA (Web Accessibility Initiative - Accessible Rich Internet Applications)
 * - Focus trap
 * - Portal (rendering outside component tree)
 * - Backdrop
 * ============================================================================
 */

import { $, createElement, on, addClass, removeClass, animate } from '../../utils/dom.js';

class Modal {
    constructor(options = {}) {
        this.options = {
            title: '',
            content: '',
            size: 'medium', // small, medium, large, full
            closable: true,
            closeOnOverlay: true,
            closeOnEscape: true,
            showCloseButton: true,
            className: '',
            onClose: null,
            onConfirm: null,
            confirmText: 'Confirmar',
            cancelText: 'Cancelar',
            showFooter: false,
            ...options,
        };
        
        this.isOpen = false;
        this.element = null;
        this.overlay = null;
        this.previousFocus = null;
        
        // Bind methods
        this.close = this.close.bind(this);
        this.handleOverlayClick = this.handleOverlayClick.bind(this);
        this.handleEscape = this.handleEscape.bind(this);
        this.handleTab = this.handleTab.bind(this);
        
        // Cleanup functions
        this.cleanupFunctions = [];
    }
    
    /**
     * render - Create modal DOM structure
     * 
     * @returns {Element} Modal overlay element
     */
    render() {
        const { title, content, size, closable, showCloseButton, showFooter, confirmText, cancelText, className } = this.options;
        
        // Overlay (background)
        this.overlay = createElement('div', { 
            className: 'modal-overlay',
            'aria-hidden': 'true',
        });
        
        // Modal container
        this.element = createElement('div', {
            className: `modal modal--${size} ${className}`,
            role: 'dialog',
            'aria-modal': 'true',
            'aria-labelledby': 'modal-title',
        },
            // Modal header
            createElement('div', { className: 'modal__header' },
                createElement('h2', { 
                    className: 'modal__title',
                    id: 'modal-title',
                }, title),
                closable && showCloseButton ? createElement('button', {
                    className: 'modal__close',
                    'aria-label': 'Close modal',
                    onClick: this.close,
                }, createElement('span', { className: 'icon-x' })) : null
            ),
            
            // Modal body
            createElement('div', { className: 'modal__body' },
                typeof content === 'string' 
                    ? createElement('div', { innerHTML: content })
                    : content
            ),
            
            // Modal footer
            showFooter ? createElement('div', { className: 'modal__footer' },
                createElement('button', {
                    className: 'btn btn--secondary',
                    onClick: this.close,
                }, cancelText),
                createElement('button', {
                    className: 'btn btn--primary',
                    onClick: () => {
                        if (this.options.onConfirm) {
                            this.options.onConfirm();
                        }
                    },
                }, confirmText)
            ) : null
        );
        
        // Add to overlay
        this.overlay.appendChild(this.element);
        
        return this.overlay;
    }
    
    /**
     * open - Open the modal
     * 
     * FOCUS TRAP:
     * 1. Save current focus (to restore later)
     * 2. Add modal to DOM
     * 3. Focus first focusable element
     * 4. Prevent body scroll
     * 5. Add keyboard listeners
     */
    open() {
        if (this.isOpen) return;
        
        // Save current focus
        this.previousFocus = document.activeElement;
        
        // Render and add to DOM
        this.render();
        document.body.appendChild(this.overlay);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Animate in
        requestAnimationFrame(() => {
            addClass(this.overlay, 'modal-overlay--visible');
            addClass(this.element, 'modal--visible');
        });
        
        // Focus first focusable element
        setTimeout(() => {
            const firstFocusable = this._getFirstFocusable();
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }, 100);
        
        // Add event listeners
        this._addEventListeners();
        
        this.isOpen = true;
    }
    
    /**
     * close - Close the modal
     * 
     * CLEANUP:
     * 1. Animate out
     * 2. Remove from DOM
     * 3. Restore body scroll
     * 4. Remove event listeners
     * 5. Return focus to trigger
     */
    close() {
        if (!this.isOpen) return;
        
        // Animate out
        removeClass(this.overlay, 'modal-overlay--visible');
        removeClass(this.element, 'modal--visible');
        
        // Wait for animation to complete
        setTimeout(() => {
            // Remove from DOM
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
            
            // Restore body scroll
            document.body.style.overflow = '';
            
            // Remove event listeners
            this._removeEventListeners();
            
            // Return focus
            if (this.previousFocus && this.previousFocus.focus) {
                this.previousFocus.focus();
            }
            
            this.isOpen = false;
            
            // Call onClose callback
            if (this.options.onClose) {
                this.options.onClose();
            }
        }, 300); // Match animation duration
    }
    
    /**
     * handleOverlayClick - Close modal when clicking overlay
     * 
     * WHY: Common UX pattern - click outside to close.
     * Only closes if click is on overlay, not on modal content.
     */
    handleOverlayClick(e) {
        if (e.target === this.overlay && this.options.closeOnOverlay) {
            this.close();
        }
    }
    
    /**
     * handleEscape - Close modal on Escape key
     */
    handleEscape(e) {
        if (e.key === 'Escape' && this.options.closeOnEscape) {
            this.close();
        }
    }
    
    /**
     * handleTab - Trap focus within modal
     * 
     * FOCUS TRAP EXPLANATION:
     * - When user tabs forward from last element → go to first
     * - When user tabs backward from first element → go to last
     * - Prevents focus from escaping the modal
     */
    handleTab(e) {
        if (e.key !== 'Tab') return;
        
        const focusableElements = this._getFocusableElements();
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
            // Shift + Tab (backward)
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab (forward)
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }
    
    /**
     * _getFocusableElements - Get all focusable elements in modal
     * 
     * @private
     * @returns {Array} Focusable elements
     */
    _getFocusableElements() {
        if (!this.element) return [];
        
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
        ].join(', ');
        
        return Array.from(this.element.querySelectorAll(focusableSelectors));
    }
    
    /**
     * _getFirstFocusable - Get first focusable element
     * 
     * @private
     * @returns {Element|null} First focusable element
     */
    _getFirstFocusable() {
        const elements = this._getFocusableElements();
        return elements.length > 0 ? elements[0] : null;
    }
    
    /**
     * _addEventListeners - Add event listeners
     * 
     * @private
     */
    _addEventListeners() {
        if (this.overlay) {
            this.cleanupFunctions.push(
                on(this.overlay, 'click', this.handleOverlayClick)
            );
        }
        
        this.cleanupFunctions.push(
            on(document, 'keydown', this.handleEscape)
        );
        
        this.cleanupFunctions.push(
            on(document, 'keydown', this.handleTab)
        );
    }
    
    /**
     * _removeEventListeners - Remove event listeners
     * 
     * @private
     */
    _removeEventListeners() {
        this.cleanupFunctions.forEach(cleanup => cleanup());
        this.cleanupFunctions = [];
    }
    
    /**
     * updateContent - Update modal content
     * 
     * @param {string|Element} content - New content
     */
    updateContent(content) {
        if (!this.element) return;
        
        const body = this.element.querySelector('.modal__body');
        if (body) {
            body.innerHTML = '';
            
            if (typeof content === 'string') {
                body.innerHTML = content;
            } else if (content instanceof Element) {
                body.appendChild(content);
            }
        }
    }
    
    /**
     * updateTitle - Update modal title
     * 
     * @param {string} title - New title
     */
    updateTitle(title) {
        if (!this.element) return;
        
        const titleEl = this.element.querySelector('.modal__title');
        if (titleEl) {
            titleEl.textContent = title;
        }
    }
}

/**
 * Modal static methods for quick dialogs
 */
Modal.confirm = function(options) {
    return new Promise((resolve) => {
        const modal = new Modal({
            title: options.title || 'Confirmar',
            content: options.message || '¿Estás seguro?',
            size: 'small',
            showFooter: true,
            confirmText: options.confirmText || 'Confirmar',
            cancelText: options.cancelText || 'Cancelar',
            onConfirm: () => {
                modal.close();
                resolve(true);
            },
            onClose: () => {
                resolve(false);
            },
        });
        
        modal.open();
    });
};

Modal.alert = function(options) {
    return new Promise((resolve) => {
        const modal = new Modal({
            title: options.title || 'Aviso',
            content: options.message || '',
            size: 'small',
            showFooter: true,
            confirmText: 'Aceptar',
            showCancelButton: false,
            onConfirm: () => {
                modal.close();
                resolve();
            },
        });
        
        modal.open();
    });
};

export default Modal;