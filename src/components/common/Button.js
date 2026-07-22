/**
 * ============================================================================
 * Button Component
 * ============================================================================
 * 
 * PURPOSE:
 * Reusable button with variants, sizes, and states.
 * 
 * BUTTON VARIANTS:
 * - Primary: Main actions (submit, confirm)
 * - Secondary: Alternative actions (cancel, back)
 * - Danger: Destructive actions (delete, block)
 * - Outline: Less prominent actions
 * - Ghost: Minimal actions (close, dismiss)
 * 
 * BUTTON STATES:
 * - Default: Ready to click
 * - Hover: Mouse over
 * - Active: Being clicked
 * - Disabled: Cannot be clicked
 * - Loading: Operation in progress
 * 
 * ACCESSIBILITY:
 * - Use <button> for actions, <a> for navigation
 * - aria-label for icon-only buttons
 * - aria-disabled instead of disabled (still focusable)
 * - Loading state announced to screen readers
 * 
 * RELATED CONCEPTS:
 * - Design systems
 * - Component libraries (Material UI, Bootstrap)
 * - Atomic design
 * ============================================================================
 */

import { createElement, on, addClass, removeClass } from '../../utils/dom.js';

/**
 * Button Component
 * 
 * @param {Object} options - Button options
 * @param {string} options.variant - Button variant
 * @param {string} options.size - Button size
 * @param {boolean} options.disabled - Disabled state
 * @param {boolean} options.loading - Loading state
 * @param {string} options.icon - Icon class
 * @param {string} options.iconPosition - Icon position (left, right)
 * @param {Function} options.onClick - Click handler
 * @param {string} options.type - Button type (button, submit, reset)
 * @param {string} options.className - Additional classes
 * @returns {Element} Button element
 */
export function Button(options = {}) {
    const {
        variant = 'primary',
        size = 'medium',
        disabled = false,
        loading = false,
        icon = null,
        iconPosition = 'left',
        onClick = null,
        type = 'button',
        className = '',
        children = [],
        'aria-label': ariaLabel,
    } = options;
    
    const classNames = [
        'btn',
        `btn--${variant}`,
        `btn--${size}`,
        loading ? 'btn--loading' : '',
        disabled ? 'btn--disabled' : '',
        icon && !children.length ? 'btn--icon-only' : '',
        className,
    ].filter(Boolean).join(' ');
    
    const button = createElement('button', {
        type,
        className: classNames,
        disabled: disabled || loading,
        'aria-disabled': disabled || loading,
        'aria-label': ariaLabel,
        'aria-busy': loading,
    },
        // Loading spinner
        loading ? createElement('span', { className: 'btn__spinner' }) : null,
        
        // Icon (left position)
        icon && iconPosition === 'left' && !loading ? createElement('span', { 
            className: `btn__icon btn__icon--left ${icon}`,
        }) : null,
        
        // Content
        ...children.map(child => {
            if (typeof child === 'string' || typeof child === 'number') {
                return createElement('span', { className: 'btn__text' }, String(child));
            }
            return child;
        }),
        
        // Icon (right position)
        icon && iconPosition === 'right' && !loading ? createElement('span', { 
            className: `btn__icon btn__icon--right ${icon}`,
        }) : null
    );
    
    // Click handler
    if (onClick && !disabled && !loading) {
        on(button, 'click', onClick);
    }
    
    return button;
}

/**
 * IconButton - Button with only an icon
 * 
 * @param {Object} options - Button options
 * @returns {Element} Icon button element
 */
export function IconButton(options = {}) {
    const {
        icon,
        label,
        variant = 'ghost',
        size = 'small',
        ...rest
    } = options;
    
    return Button({
        variant,
        size,
        icon,
        'aria-label': label,
        ...rest,
    });
}

/**
 * ButtonGroup - Group of related buttons
 * 
 * @param {Array} buttons - Array of button options
 * @param {Object} options - Group options
 * @returns {Element} Button group element
 */
export function ButtonGroup(buttons = [], options = {}) {
    const { className = '', vertical = false } = options;
    
    const group = createElement('div', {
        className: `btn-group ${vertical ? 'btn-group--vertical' : ''} ${className}`,
        role: 'group',
    },
        ...buttons.map(btnOptions => Button(btnOptions))
    );
    
    return group;
}

export default Button;