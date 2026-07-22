/**
 * ============================================================================
 * Sidebar Navigation Component
 * ============================================================================
 * 
 * PURPOSE:
 * Side navigation menu with links to all main sections.
 * Collapsible on mobile devices.
 * 
 * NAVIGATION PATTERNS:
 * - Top navigation (Header): Best for few items (3-5)
 * - Side navigation: Best for many items, hierarchical structure
 * - Bottom navigation: Best for mobile apps (3-5 items)
 * 
 * ACCESSIBILITY:
 * - Use semantic HTML (<nav>, <ul>, <li>)
 * - ARIA labels for icon-only buttons
 * - Keyboard navigation support
 * - Focus indicators
 * 
 * RELATED CONCEPTS:
 * - Responsive design
 * - Mobile-first approach
 * - ARIA (Accessible Rich Internet Applications)
 * ============================================================================
 */

import { createElement, on, addClass, removeClass } from '../../utils/dom.js';
import store from '../../store/store.js';
import AuthService from '../../services/auth.js';
import { ROUTES } from '../../constants/app.js';

class Sidebar {
    constructor(options = {}) {
        this.options = options;
        this.element = null;
        this.isCollapsed = false;
        this.currentPath = '';
        
        // Bind methods
        this.toggleCollapse = this.toggleCollapse.bind(this);
        this.handleNavigation = this.handleNavigation.bind(this);
        
        // Cleanup functions
        this.cleanupFunctions = [];
    }
    
    /**
     * render - Create sidebar DOM structure
     * 
     * @returns {Element} Sidebar element
     */
    render() {
        const user = store.getState('user');
        const isAdmin = AuthService.isAdmin();
        
        this.element = createElement('aside', { className: 'sidebar' },
            // Logo (visible when collapsed)
            createElement('div', { className: 'sidebar__logo' },
                createElement('a', { href: '#/dashboard' }, 'SB')
            ),
            
            // Navigation menu
            createElement('nav', { className: 'sidebar__nav' },
                createElement('ul', { className: 'sidebar__menu' },
                    // Dashboard
                    this._createMenuItem({
                        icon: 'icon-home',
                        label: 'Dashboard',
                        path: ROUTES.DASHBOARD,
                    }),
                    
                    // Accounts
                    this._createMenuItem({
                        icon: 'icon-wallet',
                        label: 'Cuentas',
                        path: ROUTES.ACCOUNTS,
                    }),
                    
                    // Transfer
                    this._createMenuItem({
                        icon: 'icon-transfer',
                        label: 'Transferir',
                        path: ROUTES.TRANSFER,
                    }),
                    
                    // Transactions
                    this._createMenuItem({
                        icon: 'icon-history',
                        label: 'Transacciones',
                        path: ROUTES.TRANSACTIONS,
                    }),
                    
                    // Cards
                    this._createMenuItem({
                        icon: 'icon-credit-card',
                        label: 'Tarjetas',
                        path: ROUTES.CARDS,
                    }),
                    
                    // Beneficiaries
                    this._createMenuItem({
                        icon: 'icon-users',
                        label: 'Beneficiarios',
                        path: ROUTES.BENEFICIARIES,
                    }),
                    
                    // Notifications
                    this._createMenuItem({
                        icon: 'icon-bell',
                        label: 'Notificaciones',
                        path: ROUTES.NOTIFICATIONS,
                    }),
                    
                    // Admin section (only for admins)
                    isAdmin ? this._createMenuGroup('Administración', [
                        this._createMenuItem({
                            icon: 'icon-users',
                            label: 'Usuarios',
                            path: ROUTES.ADMIN_USERS,
                        }),
                        this._createMenuItem({
                            icon: 'icon-settings',
                            label: 'Configuración',
                            path: ROUTES.ADMIN_SETTINGS,
                        }),
                    ]) : null
                )
            ),
            
            // User info at bottom
            this._renderUserInfo(user),
            
            // Collapse toggle button
            createElement('button', {
                className: 'sidebar__toggle',
                'aria-label': 'Toggle sidebar',
                onClick: this.toggleCollapse,
            }, createElement('span', { className: 'icon-chevron-left' }))
        );
        
        return this.element;
    }
    
    /**
     * _createMenuItem - Create a single menu item
     * 
     * @private
     * @param {Object} options - Menu item options
     * @returns {Element} List item element
     */
    _createMenuItem({ icon, label, path }) {
        const li = createElement('li', { className: 'sidebar__item' },
            createElement('a', {
                href: `#${path}`,
                className: 'sidebar__link',
                'data-path': path,
            },
                createElement('span', { className: `sidebar__icon ${icon}` }),
                createElement('span', { className: 'sidebar__label' }, label)
            )
        );
        
        return li;
    }
    
    /**
     * _createMenuGroup - Create a group of menu items
     * 
     * @private
     * @param {string} title - Group title
     * @param {Array<Element>} items - Menu items
     * @returns {Element} Group element
     */
    _createMenuGroup(title, items) {
        const group = createElement('li', { className: 'sidebar__group' },
            createElement('div', { className: 'sidebar__group-title' }, title),
            createElement('ul', { className: 'sidebar__submenu' }, ...items)
        );
        
        return group;
    }
    
    /**
     * _renderUserInfo - Render user info at bottom of sidebar
     * 
     * @private
     * @param {Object} user - User object
     * @returns {Element} User info element
     */
    _renderUserInfo(user) {
        return createElement('div', { className: 'sidebar__user' },
            createElement('div', { className: 'avatar' },
                user?.name ? user.name.charAt(0).toUpperCase() : 'U'
            ),
            createElement('div', { className: 'sidebar__user-info' },
                createElement('div', { className: 'sidebar__user-name' },
                    user?.name || 'Usuario'
                ),
                createElement('div', { className: 'sidebar__user-role' },
                    user?.role || 'user'
                )
            )
        );
    }
    
    /**
     * mount - Attach sidebar to container
     * 
     * @param {Element} container - Container element
     */
    mount(container) {
        if (!container) return;
        
        const sidebar = this.render();
        container.appendChild(sidebar);
        
        // Add event listeners
        this._addEventListeners();
        
        // Subscribe to state changes
        this._subscribeToState();
        
        // Set active item
        this._updateActiveItem();
    }
    
    /**
     * unmount - Remove sidebar and clean up
     */
    unmount() {
        this.cleanupFunctions.forEach(cleanup => cleanup());
        this.cleanupFunctions = [];
        
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.element = null;
    }
    
    /**
     * _addEventListeners - Add event listeners
     * 
     * @private
     */
    _addEventListeners() {
        // Handle navigation clicks
        if (this.element) {
            const links = this.element.querySelectorAll('.sidebar__link');
            links.forEach(link => {
                const cleanup = on(link, 'click', this.handleNavigation);
                this.cleanupFunctions.push(cleanup);
            });
        }
        
        // Listen for hash changes
        const hashCleanup = on(window, 'hashchange', () => {
            this._updateActiveItem();
        });
        this.cleanupFunctions.push(hashCleanup);
    }
    
    /**
     * _subscribeToState - Subscribe to store state changes
     * 
     * @private
     */
    _subscribeToState() {
        const unsubscribe = store.subscribe('user', (user) => {
            this._updateUserInfo(user);
        });
        
        this.cleanupFunctions.push(unsubscribe);
    }
    
    /**
     * toggleCollapse - Toggle sidebar collapse state
     */
    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
        
        if (this.element) {
            if (this.isCollapsed) {
                addClass(this.element, 'sidebar--collapsed');
            } else {
                removeClass(this.element, 'sidebar--collapsed');
            }
        }
    }
    
    /**
     * _updateActiveItem - Highlight current active menu item
     * 
     * @private
     */
    _updateActiveItem() {
        if (!this.element) return;
        
        const hash = window.location.hash.slice(1) || '/';
        this.currentPath = hash;
        
        // Remove all active classes
        const links = this.element.querySelectorAll('.sidebar__link');
        links.forEach(link => {
            removeClass(link, 'sidebar__link--active');
        });
        
        // Add active class to current item
        const activeLink = this.element.querySelector(`[data-path="${hash}"]`);
        if (activeLink) {
            addClass(activeLink, 'sidebar__link--active');
        }
    }
    
    /**
     * _updateUserInfo - Update user display
     * 
     * @private
     * @param {Object} user - User object
     */
    _updateUserInfo(user) {
        if (!this.element) return;
        
        const nameEl = this.element.querySelector('.sidebar__user-name');
        const roleEl = this.element.querySelector('.sidebar__user-role');
        const avatarEl = this.element.querySelector('.avatar');
        
        if (nameEl) {
            nameEl.textContent = user?.name || 'Usuario';
        }
        
        if (roleEl) {
            roleEl.textContent = user?.role || 'user';
        }
        
        if (avatarEl && user?.name) {
            avatarEl.textContent = user.name.charAt(0).toUpperCase();
        }
    }
    
    /**
     * handleNavigation - Handle navigation link clicks
     * 
     * @private
     */
    handleNavigation(e) {
        e.preventDefault();
        
        const href = e.currentTarget.getAttribute('href');
        if (href) {
            window.location.hash = href;
        }
        
        // Close mobile menu after navigation
        if (window.innerWidth < 768) {
            this.closeMobile();
        }
    }
    
    /**
     * closeMobile - Close sidebar on mobile
     */
    closeMobile() {
        if (this.element) {
            removeClass(this.element, 'sidebar--open');
        }
    }
    
    /**
     * openMobile - Open sidebar on mobile
     */
    openMobile() {
        if (this.element) {
            addClass(this.element, 'sidebar--open');
        }
    }
}

export default Sidebar;