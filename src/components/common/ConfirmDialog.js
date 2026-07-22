/**
 * ============================================================================
 * Confirmation Dialog Component
 * ============================================================================
 * 
 * PURPOSE:
 * Modal dialog for confirming destructive or important actions.
 * 
 * WHEN TO USE:
 * - Deleting data
 * - Blocking a card
 * - Large money transfers
 * - Logging out
 * - Any irreversible action
 * 
 * UX BEST PRACTICES:
 * - Clear title and message
 * - Destructive actions in red
 * - Cancel should be easily accessible
 * - Don't overuse (annoying)
 * 
 * RELATED CONCEPTS:
 * - Modal dialogs
 * - Confirmation prompts
 * - Error prevention
 * ============================================================================
 */

import { createElement, on } from '../../utils/dom.js';
import { CONFIRMATION_MESSAGES } from '../../constants/messages.js';

class ConfirmDialog {
    constructor(options = {}) {
        this.options = {
            title: 'Confirmar',
            message: '¿Estás seguro?',
            confirmText: 'Confirmar',
            cancelText: 'Cancelar',
            confirmVariant: 'danger',
            showCancel: true,
            onConfirm: null,
            onCancel: null,
            ...options,
        };
        
        this.isOpen = false;
        this.element = null;
        this.overlay = null;
        this.resolve = null;
    }
    
    /**
     * show - Show the confirmation dialog
     * 
     * @param {Object} options - Dialog options
     * @returns {Promise<boolean>} True if confirmed, false if cancelled
     */
    show(options = {}) {
        // Merge options
        this.options = { ...this.options, ...options };
        
        return new Promise((resolve) => {
            this.resolve = resolve;
            this._render();
            this._open();
        });
    }
    
    /**
     * _render - Create dialog DOM
     * 
     * @private
     */
    _render() {
        const { title, message, confirmText, cancelText, confirmVariant, showCancel } = this.options;
        
        // Overlay
        this.overlay = createElement('div', { className: 'modal-overlay' });
        
        // Dialog
        this.element = createElement('div', {
            className: 'confirm-dialog',
            role: 'alertdialog',
            'aria-modal': 'true',
            'aria-labelledby': 'confirm-title',
            'aria-describedby': 'confirm-message',
        },
            // Header
            createElement('div', { className: 'confirm-dialog__header' },
                createElement('span', { className: 'confirm-dialog__icon icon-alert-triangle' }),
                createElement('h3', { 
                    className: 'confirm-dialog__title',
                    id: 'confirm-title',
                }, title)
            ),
            
            // Message
            createElement('p', { 
                className: 'confirm-dialog__message',
                id: 'confirm-message',
            }, message),
            
            // Actions
            createElement('div', { className: 'confirm-dialog__actions' },
                showCancel ? createElement('button', {
                    className: 'btn btn--secondary',
                    onClick: () => this._handleCancel(),
                }, cancelText) : null,
                createElement('button', {
                    className: `btn btn--${confirmVariant}`,
                    onClick: () => this._handleConfirm(),
                }, confirmText)
            )
        );
        
        // Add to overlay
        this.overlay.appendChild(this.element);
    }
    
    /**
     * _open - Open the dialog
     * 
     * @private
     */
    _open() {
        document.body.appendChild(this.overlay);
        document.body.style.overflow = 'hidden';
        
        // Focus confirm button
        setTimeout(() => {
            const confirmBtn = this.element.querySelector('.btn--danger, .btn--primary');
            if (confirmBtn) confirmBtn.focus();
        }, 100);
        
        // Close on escape
        this._escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this._handleCancel();
            }
        };
        on(document, 'keydown', this._escapeHandler);
        
        // Close on overlay click
        on(this.overlay, 'click', (e) => {
            if (e.target === this.overlay) {
                this._handleCancel();
            }
        });
        
        this.isOpen = true;
    }
    
    /**
     * _close - Close the dialog
     * 
     * @private
     */
    _close() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        
        document.body.style.overflow = '';
        this.isOpen = false;
    }
    
    /**
     * _handleConfirm - Handle confirm button click
     * 
     * @private
     */
    _handleConfirm() {
        this._close();
        
        if (this.options.onConfirm) {
            this.options.onConfirm();
        }
        
        if (this.resolve) {
            this.resolve(true);
        }
    }
    
    /**
     * _handleCancel - Handle cancel button click
     * 
     * @private
     */
    _handleCancel() {
        this._close();
        
        if (this.options.onCancel) {
            this.options.onCancel();
        }
        
        if (this.resolve) {
            this.resolve(false);
        }
    }
}

// Create singleton instance
const confirmDialog = new ConfirmDialog();

/**
 * confirm - Quick confirmation dialog
 * 
 * @param {Object|string} options - Options or message string
 * @returns {Promise<boolean>} Confirmation result
 */
export function confirm(options) {
    const dialogOptions = typeof options === 'string' 
        ? { message: options }
        : options;
    
    return confirmDialog.show(dialogOptions);
}

/**
 * confirmDestructive - Confirmation for destructive actions
 * 
 * @param {string} message - Confirmation message
 * @returns {Promise<boolean>} Confirmation result
 */
export function confirmDestructive(message) {
    return confirm({
        title: 'Acción destructiva',
        message,
        confirmText: 'Eliminar',
        confirmVariant: 'danger',
    });
}

export { confirmDialog };
export default confirmDialog;