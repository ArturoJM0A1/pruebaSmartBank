/**
 * ============================================================================
 * Tooltip Component
 * ============================================================================
 * 
 * PURPOSE:
 * Small popup that displays additional information on hover or focus.
 * 
 * TOOLTIP PATTERNS:
 * - Hover to show
 * - Focus to show (accessibility)
 * - Auto-hide after delay
 * - Position relative to trigger
 * 
 * ACCESSIBILITY:
 * - aria-describedby for screen readers
 * - Keyboard accessible (focus triggers tooltip)
 * - Not dependent on color alone
 * 
 * RELATED CONCEPTS:
 * - Popovers (more content, interactive)
 * - Tooltips (non-interactive, informational)
 * - Toggles
 * ============================================================================
 */

import { createElement, on, addClass, removeClass } from '../../utils/dom.js';

class Tooltip {
    constructor(options = {}) {
        this.options = {
            content: '',
            position: 'top', // top, bottom, left, right
            delay: 300,
            showArrow: true,
            className: '',
            ...options,
        };
        
        this.element = null;
        this.tooltip = null;
        this.showTimeout = null;
        this.hideTimeout = null;
        this.isVisible = false;
    }
    
    /**
     * attach - Attach tooltip to an element
     * 
     * @param {Element} element - Element to attach tooltip to
     */
    attach(element) {
        if (!element) return;
        
        this.element = element;
        
        // Add aria attributes
        this.element.setAttribute('aria-describedby', this._getTooltipId());
        
        // Event listeners
        on(this.element, 'mouseenter', () => this.show());
        on(this.element, 'mouseleave', () => this.hide());
        on(this.element, 'focus', () => this.show());
        on(this.element, 'blur', () => this.hide());
    }
    
    /**
     * show - Show the tooltip
     */
    show() {
        clearTimeout(this.hideTimeout);
        
        this.showTimeout = setTimeout(() => {
            this._createTooltip();
            this._positionTooltip();
            this.isVisible = true;
        }, this.options.delay);
    }
    
    /**
     * hide - Hide the tooltip
     */
    hide() {
        clearTimeout(this.showTimeout);
        
        this.hideTimeout = setTimeout(() => {
            this._removeTooltip();
            this.isVisible = false;
        }, 100);
    }
    
    /**
     * _createTooltip - Create tooltip element
     * 
     * @private
     */
    _createTooltip() {
        if (this.tooltip) return;
        
        const { content, position, showArrow, className } = this.options;
        
        this.tooltip = createElement('div', {
            className: `tooltip tooltip--${position} ${className}`,
            id: this._getTooltipId(),
            role: 'tooltip',
        },
            showArrow ? createElement('div', { className: 'tooltip__arrow' }) : null,
            createElement('div', { className: 'tooltip__content' }, content)
        );
        
        document.body.appendChild(this.tooltip);
    }
    
    /**
     * _positionTooltip - Position tooltip relative to element
     * 
     * @private
     */
    _positionTooltip() {
        if (!this.tooltip || !this.element) return;
        
        const rect = this.element.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const { position } = this.options;
        
        let top, left;
        
        switch (position) {
            case 'top':
                top = rect.top - tooltipRect.height - 8;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = rect.bottom + 8;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.left - tooltipRect.width - 8;
                break;
            case 'right':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.right + 8;
                break;
        }
        
        // Keep tooltip within viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        left = Math.max(8, Math.min(left, viewportWidth - tooltipRect.width - 8));
        top = Math.max(8, Math.min(top, viewportHeight - tooltipRect.height - 8));
        
        this.tooltip.style.top = `${top + window.scrollY}px`;
        this.tooltip.style.left = `${left + window.scrollX}px`;
    }
    
    /**
     * _removeTooltip - Remove tooltip from DOM
     * 
     * @private
     */
    _removeTooltip() {
        if (this.tooltip && this.tooltip.parentNode) {
            this.tooltip.parentNode.removeChild(this.tooltip);
        }
        
        this.tooltip = null;
    }
    
    /**
     * _getTooltipId - Get unique tooltip ID
     * 
     * @private
     * @returns {string} Tooltip ID
     */
    _getTooltipId() {
        if (!this._tooltipId) {
            this._tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;
        }
        return this._tooltipId;
    }
    
    /**
     * update - Update tooltip content
     * 
     * @param {string} content - New content
     */
    update(content) {
        this.options.content = content;
        
        if (this.tooltip) {
            const contentEl = this.tooltip.querySelector('.tooltip__content');
            if (contentEl) {
                contentEl.textContent = content;
            }
        }
    }
    
    /**
     * destroy - Remove tooltip and clean up
     */
    destroy() {
        clearTimeout(this.showTimeout);
        clearTimeout(this.hideTimeout);
        this._removeTooltip();
    }
}

/**
 * tooltip - Create and attach a tooltip
 * 
 * @param {Element} element - Element to attach to
 * @param {Object|string} options - Tooltip options or content string
 * @returns {Tooltip} Tooltip instance
 */
export function tooltip(element, options) {
    const tooltipOptions = typeof options === 'string' 
        ? { content: options }
        : options;
    
    const tooltipInstance = new Tooltip(tooltipOptions);
    tooltipInstance.attach(element);
    
    return tooltipInstance;
}

/**
 * addTooltips - Add tooltips to multiple elements
 * 
 * WHY: Useful for adding tooltips to all elements with data-tooltip attribute
 * 
 * @param {Element} container - Container element
 */
export function addTooltips(container = document) {
    const elements = container.querySelectorAll('[data-tooltip]');
    
    elements.forEach(element => {
        const content = element.getAttribute('data-tooltip');
        const position = element.getAttribute('data-tooltip-position') || 'top';
        
        tooltip(element, { content, position });
    });
}

export { Tooltip };
export default tooltip;