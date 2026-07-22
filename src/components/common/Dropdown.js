/**
 * ============================================================================
 * Dropdown Menu Component
 * ============================================================================
 * 
 * PURPOSE:
 * Toggleable dropdown menu for actions, settings, or navigation.
 * 
 * DROPDOWN PATTERNS:
 * - Click to open
 * - Hover to open (less common now)
 * - Keyboard navigation
 * 
 * ACCESSIBILITY:
 * - aria-haspopup="true"
 * - aria-expanded="true/false"
 * - Keyboard navigation (arrow keys, Enter, Escape)
 * - Focus management
 * 
 * RELATED CONCEPTS:
 * - Context menus
 * - Popovers
 * - Tooltips
 * ============================================================================
 */

import { createElement, on, addClass, removeClass } from '../../utils/dom.js';

class Dropdown {
    constructor(options = {}) {
        this.options = {
            trigger: null, // Element or text
            items: [], // Array of { label, icon, onClick, divider, disabled }
            position: 'bottom-left', // bottom-left, bottom-right, top-left, top-right
            className: '',
            onSelect: null,
            ...options,
        };
        
        this.element = null;
        this.menu = null;
        this.isOpen = false;
        this.selectedIndex = -1;
        
        // Bind methods
        this.toggle = this.toggle.bind(this);
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        
        // Cleanup functions
        this.cleanupFunctions = [];
    }
    
    /**
     * render - Create dropdown DOM structure
     * 
     * @returns {Element} Dropdown element
     */
    render() {
        const { trigger, items, position, className } = this.options;
        
        this.element = createElement('div', { 
            className: `dropdown ${className}`,
        },
            // Trigger button
            this._renderTrigger(trigger),
            
            // Menu
            this._renderMenu(items, position)
        );
        
        return this.element;
    }
    
    /**
     * _renderTrigger - Render trigger button
     * 
     * @private
     * @param {string|Element} trigger - Trigger content
     * @returns {Element} Trigger button
     */
    _renderTrigger(trigger) {
        const triggerButton = createElement('button', {
            className: 'dropdown__trigger',
            'aria-haspopup': 'true',
            'aria-expanded': 'false',
        });
        
        if (typeof trigger === 'string') {
            triggerButton.textContent = trigger;
        } else if (trigger instanceof Element) {
            triggerButton.appendChild(trigger);
        }
        
        on(triggerButton, 'click', this.toggle);
        
        return triggerButton;
    }
    
    /**
     * _renderMenu - Render dropdown menu
     * 
     * @private
     * @param {Array} items - Menu items
     * @param {string} position - Menu position
     * @returns {Element} Menu element
     */
    _renderMenu(items, position) {
        this.menu = createElement('div', {
            className: `dropdown__menu dropdown__menu--${position}`,
            role: 'menu',
        },
            ...items.map((item, index) => this._renderMenuItem(item, index))
        );
        
        return this.menu;
    }
    
    /**
     * _renderMenuItem - Render a menu item
     * 
     * @private
     * @param {Object} item - Item configuration
     * @param {number} index - Item index
     * @returns {Element} Menu item element
     */
    _renderMenuItem(item, index) {
        // Divider
        if (item.divider) {
            return createElement('div', { 
                className: 'dropdown__divider',
                role: 'separator',
            });
        }
        
        const classNames = [
            'dropdown__item',
            item.disabled ? 'dropdown__item--disabled' : '',
            item.danger ? 'dropdown__item--danger' : '',
        ].filter(Boolean).join(' ');
        
        const menuItem = createElement('div', {
            className: classNames,
            role: 'menuitem',
            'data-index': index,
            tabindex: '-1',
        },
            item.icon ? createElement('span', { className: `dropdown__item-icon ${item.icon}` }) : null,
            createElement('span', { className: 'dropdown__item-label' }, item.label),
            item.shortcut ? createElement('span', { className: 'dropdown__item-shortcut' }, item.shortcut) : null
        );
        
        // Click handler
        if (!item.disabled && item.onClick) {
            on(menuItem, 'click', (e) => {
                e.stopPropagation();
                item.onClick();
                this.close();
            });
        }
        
        // Hover state
        on(menuItem, 'mouseenter', () => {
            if (!item.disabled) {
                this.selectedIndex = index;
                this._updateSelected();
            }
        });
        
        return menuItem;
    }
    
    /**
     * mount - Attach dropdown to container
     * 
     * @param {Element} container - Container element
     */
    mount(container) {
        if (!container) return;
        
        const dropdown = this.render();
        container.appendChild(dropdown);
        
        // Add event listeners
        this._addEventListeners();
    }
    
    /**
     * unmount - Remove dropdown
     */
    unmount() {
        this.cleanupFunctions.forEach(cleanup => cleanup());
        this.cleanupFunctions = [];
        
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.element = null;
        this.menu = null;
    }
    
    /**
     * _addEventListeners - Add event listeners
     * 
     * @private
     */
    _addEventListeners() {
        this.cleanupFunctions.push(
            on(document, 'keydown', this.handleKeyDown)
        );
        
        this.cleanupFunctions.push(
            on(document, 'click', this.handleOutsideClick)
        );
    }
    
    /**
     * toggle - Toggle dropdown open/close
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    /**
     * open - Open dropdown
     */
    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        
        if (this.element) {
            addClass(this.element, 'dropdown--open');
            
            const trigger = this.element.querySelector('.dropdown__trigger');
            if (trigger) {
                trigger.setAttribute('aria-expanded', 'true');
            }
        }
        
        // Focus first item
        this.selectedIndex = 0;
        this._updateSelected();
    }
    
    /**
     * close - Close dropdown
     */
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.selectedIndex = -1;
        
        if (this.element) {
            removeClass(this.element, 'dropdown--open');
            
            const trigger = this.element.querySelector('.dropdown__trigger');
            if (trigger) {
                trigger.setAttribute('aria-expanded', 'false');
            }
        }
    }
    
    /**
     * handleKeyDown - Handle keyboard navigation
     * 
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
        if (!this.isOpen) return;
        
        const items = this.menu?.querySelectorAll('.dropdown__item:not(.dropdown__item--disabled)');
        if (!items || items.length === 0) return;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
                this._updateSelected();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                this._updateSelected();
                break;
                
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (this.selectedIndex >= 0) {
                    items[this.selectedIndex].click();
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                this.close();
                break;
                
            case 'Tab':
                this.close();
                break;
        }
    }
    
    /**
     * handleOutsideClick - Close dropdown when clicking outside
     * 
     * @param {Event} e - Click event
     */
    handleOutsideClick(e) {
        if (this.element && !this.element.contains(e.target)) {
            this.close();
        }
    }
    
    /**
     * _updateSelected - Update selected item highlight
     * 
     * @private
     */
    _updateSelected() {
        const items = this.menu?.querySelectorAll('.dropdown__item');
        items?.forEach((item, index) => {
            if (index === this.selectedIndex) {
                addClass(item, 'dropdown__item--selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                removeClass(item, 'dropdown__item--selected');
            }
        });
    }
    
    /**
     * setItems - Update menu items
     * 
     * @param {Array} items - New items
     */
    setItems(items) {
        this.options.items = items;
        
        if (this.menu) {
            this.menu.innerHTML = '';
            items.forEach((item, index) => {
                this.menu.appendChild(this._renderMenuItem(item, index));
            });
        }
    }
}

export default Dropdown;