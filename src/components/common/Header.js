/**
 * ============================================================================
 * Header Component
 * ============================================================================
 * 
 * PURPOSE:
 * Reusable header/navigation bar component for the application.
 * Contains logo, user greeting, notifications, and user menu.
 * 
 * COMPONENT PATTERN:
 * This uses a simple class-based component pattern.
 * Each component has:
 * - render(): Creates and returns DOM elements
 * - mount(container): Attaches to the DOM
 * - unmount(): Cleans up (removes event listeners, etc.)
 * 
 * WHY COMPONENTS?
 * 1. Reusability: Use the same header everywhere
 * 2. Encapsulation: All header logic in one place
 * 3. Maintainability: Change header in one file
 * 4. Testability: Test header independently
 * 
 * REUSABILITY:
 * - Props (properties) customize component behavior
 * - Same component, different data
 * 
 * RELATED CONCEPTS:
 * - Web Components (custom elements)
 * - Shadow DOM (style encapsulation)
 * - Virtual DOM (React, Vue)
 * - Component lifecycle
 * ============================================================================
 */

import { $, on, createElement, addClass, removeClass } from '../../utils/dom.js';
import store from '../../store/store.js';
import AuthService from '../../services/auth.js';
import { ROUTES } from '../../constants/app.js';

class Header {
    constructor(options = {}) {
        this.options = options;
        this.element = null;
        this.notificationCount = 0;
        this.isMobileMenuOpen = false;
        this.isDropdownOpen = false;
        
        // Bind methods
        this.handleLogout = this.handleLogout.bind(this);
        this.toggleMobileMenu = this.toggleMobileMenu.bind(this);
        this.toggleDropdown = this.toggleDropdown.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        
        // Cleanup functions
        this.cleanupFunctions = [];
    }
    
    /**
     * render - Create the header DOM structure
     * 
     * CONCEPT: Template literals for HTML
     * - Backticks allow multi-line strings
     * - ${} for interpolation
     * - Much more readable than string concatenation
     * 
     * @returns {Element} Header element
     */
    render() {
        const user = store.getState('user');
        const unreadCount = store.getState('unreadCount');
        
        this.element = createElement('header', { className: 'header' },
            // Logo
            createElement('div', { className: 'header__logo' },
                createElement('a', { href: '#/dashboard' }, 'SmartBank')
            ),
            
            // Mobile menu toggle
            createElement('button', {
                className: 'header__menu-toggle',
                'aria-label': 'Toggle menu',
                onClick: this.toggleMobileMenu,
            }, createElement('span', { className: 'hamburger' })),
            
            // Navigation
            this._renderNav(),
            
            // Right side (notifications + user)
            createElement('div', { className: 'header__right' },
                // Notifications bell
                this._renderNotifications(unreadCount),
                
                // User dropdown
                this._renderUserDropdown(user)
            )
        );
        
        return this.element;
    }
    
    /**
     * _renderNav - Render navigation links
     * 
     * @private
     * @returns {Element} Navigation element
     */
    _renderNav() {
        const nav = createElement('nav', { className: 'header__nav' },
            createElement('a', { 
                href: '#/dashboard',
                className: 'nav-link',
            }, 'Dashboard'),
            createElement('a', { 
                href: '#/accounts',
                className: 'nav-link',
            }, 'Cuentas'),
            createElement('a', { 
                href: '#/transactions',
                className: 'nav-link',
            }, 'Transacciones'),
            createElement('a', { 
                href: '#/cards',
                className: 'nav-link',
            }, 'Tarjetas')
        );
        
        return nav;
    }
    
    /**
     * _renderNotifications - Render notification bell with badge
     * 
     * WHY: Users need quick access to notifications.
     * Badge shows unread count.
     * 
     * @private
     * @param {number} count - Unread notification count
     * @returns {Element} Notification element
     */
    _renderNotifications(count) {
        const bell = createElement('button', {
            className: 'header__notifications',
            'aria-label': `Notifications (${count} unread)`,
            onClick: () => {
                window.location.hash = '#/notifications';
            },
        },
            createElement('span', { className: 'icon-bell' }),
            count > 0 ? createElement('span', { 
                className: 'badge',
            }, String(count)) : null
        );
        
        return bell;
    }
    
    /**
     * _renderUserDropdown - Render user dropdown menu
     * 
     * @private
     * @param {Object} user - User object
     * @returns {Element} User dropdown element
     */
    _renderUserDropdown(user) {
        const dropdown = createElement('div', { className: 'header__user' },
            // User button
            createElement('button', {
                className: 'header__user-button',
                onClick: this.toggleDropdown,
            },
                createElement('div', { className: 'avatar avatar--small' },
                    user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                ),
                createElement('span', { className: 'header__user-name' },
                    user?.name || 'Usuario'
                ),
                createElement('span', { className: 'icon-chevron-down' })
            ),
            
            // Dropdown menu
            createElement('div', { className: 'dropdown dropdown--right' },
                createElement('a', { 
                    href: '#/profile',
                    className: 'dropdown__item',
                }, 'Mi Perfil'),
                createElement('a', { 
                    href: '#/settings',
                    className: 'dropdown__item',
                }, 'Configuración'),
                createElement('div', { className: 'dropdown__divider' }),
                createElement('button', {
                    className: 'dropdown__item dropdown__item--danger',
                    onClick: this.handleLogout,
                }, 'Cerrar Sesión')
            )
        );
        
        return dropdown;
    }
    
    /**
     * mount - Attach header to container
     * 
     * @param {Element} container - Container element
     */
    mount(container) {
        if (!container) return;
        
        const header = this.render();
        container.prepend(header);
        
        // Add event listeners
        this._addEventListeners();
        
        // Subscribe to state changes
        this._subscribeToState();
    }
    
    /**
     * unmount - Remove header and clean up
     * 
     * WHY: Important to clean up when component is destroyed.
     * Prevents memory leaks from event listeners.
     */
    unmount() {
        // Run all cleanup functions
        this.cleanupFunctions.forEach(cleanup => cleanup());
        this.cleanupFunctions = [];
        
        // Remove element
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.element = null;
    }
    
    /**
     * _addEventListeners - Add event listeners
     * 
     * CONCEPT: Event listener cleanup
     * - Store cleanup functions for later removal
     * - Prevents memory leaks
     * 
     * @private
     */
    _addEventListeners() {
        // Close dropdown on outside click
        const cleanup = on(document, 'click', this.handleOutsideClick);
        this.cleanupFunctions.push(cleanup);
        
        // Close mobile menu on escape
        const escapeCleanup = on(document, 'keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
                this.closeDropdown();
            }
        });
        this.cleanupFunctions.push(escapeCleanup);
    }
    
    /**
     * _subscribeToState - Subscribe to store state changes
     * 
     * WHY: Header needs to update when:
     * - User logs in/out
     * - Notifications arrive
     * 
     * @private
     */
    _subscribeToState() {
        const unsubscribeUser = store.subscribe('user', (user) => {
            this._updateUserDisplay(user);
        });
        
        const unsubscribeNotifications = store.subscribe('unreadCount', (count) => {
            this._updateNotificationBadge(count);
        });
        
        this.cleanupFunctions.push(unsubscribeUser);
        this.cleanupFunctions.push(unsubscribeNotifications);
    }
    
    /**
     * _updateUserDisplay - Update user name and avatar
     * 
     * @private
     * @param {Object} user - User object
     */
    _updateUserDisplay(user) {
        const nameEl = this.element?.querySelector('.header__user-name');
        const avatarEl = this.element?.querySelector('.avatar');
        
        if (nameEl) {
            nameEl.textContent = user?.name || 'Usuario';
        }
        
        if (avatarEl && user?.name) {
            avatarEl.textContent = user.name.charAt(0).toUpperCase();
        }
    }
    
    /**
     * _updateNotificationBadge - Update notification count
     * 
     * @private
     * @param {number} count - Unread count
     */
    _updateNotificationBadge(count) {
        const badge = this.element?.querySelector('.badge');
        
        if (badge) {
            if (count > 0) {
                badge.textContent = String(count);
                badge.style.display = '';
            } else {
                badge.style.display = 'none';
            }
        }
    }
    
    /**
     * toggleMobileMenu - Toggle mobile menu
     */
    toggleMobileMenu() {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        
        if (this.element) {
            const nav = this.element.querySelector('.header__nav');
            if (nav) {
                addClass(nav, 'header__nav--open', this.isMobileMenuOpen);
            }
        }
    }
    
    /**
     * closeMobileMenu - Close mobile menu
     */
    closeMobileMenu() {
        this.isMobileMenuOpen = false;
        
        if (this.element) {
            const nav = this.element.querySelector('.header__nav');
            if (nav) {
                removeClass(nav, 'header__nav--open');
            }
        }
    }
    
    /**
     * toggleDropdown - Toggle user dropdown
     */
    toggleDropdown() {
        this.isDropdownOpen = !this.isDropdownOpen;
        
        if (this.element) {
            const dropdown = this.element.querySelector('.dropdown');
            if (dropdown) {
                if (this.isDropdownOpen) {
                    addClass(dropdown, 'dropdown--open');
                } else {
                    removeClass(dropdown, 'dropdown--open');
                }
            }
        }
    }
    
    /**
     * closeDropdown - Close user dropdown
     */
    closeDropdown() {
        this.isDropdownOpen = false;
        
        if (this.element) {
            const dropdown = this.element.querySelector('.dropdown');
            if (dropdown) {
                removeClass(dropdown, 'dropdown--open');
            }
        }
    }
    
    /**
     * handleOutsideClick - Close dropdown when clicking outside
     * 
     * CONCEPT: Event delegation
     * - Listen on document
     * - Check if click was inside the component
     * - If not, close the dropdown
     */
    handleOutsideClick(e) {
        if (this.element && !this.element.contains(e.target)) {
            this.closeDropdown();
            this.closeMobileMenu();
        }
    }
    
    /**
     * handleLogout - Handle user logout
     */
    async handleLogout() {
        this.closeDropdown();
        
        try {
            await AuthService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
}

export default Header;