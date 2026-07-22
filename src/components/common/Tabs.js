/**
 * ============================================================================
 * Tab Navigation Component
 * ============================================================================
 * 
 * PURPOSE:
 * Organize content into switchable panels using tabs.
 * 
 * TAB PATTERNS:
 * - Horizontal tabs (most common)
 * - Vertical tabs (sidebar)
 * - Scrollable tabs (many items)
 * 
 * ACCESSIBILITY:
 * - role="tablist" for tab container
 * - role="tab" for each tab
 * - role="tabpanel" for content panels
 * - aria-selected="true" for active tab
 * - Keyboard navigation (arrow keys)
 * 
 * RELATED CONCEPTS:
 * - Navigation patterns
 * - Content organization
 * - Progressive disclosure
 * ============================================================================
 */

import { createElement, on, addClass, removeClass } from '../../utils/dom.js';

class Tabs {
    constructor(options = {}) {
        this.options = {
            tabs: [], // Array of { id, label, content, icon, disabled }
            activeTab: null,
            onChange: null,
            className: '',
            ...options,
        };
        
        this.element = null;
        this.activeTab = this.options.activeTab || this.options.tabs[0]?.id;
        this.tabButtons = [];
        this.tabPanels = [];
        
        // Bind methods
        this.handleTabClick = this.handleTabClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }
    
    /**
     * render - Create tabs DOM structure
     * 
     * @returns {Element} Tabs element
     */
    render() {
        const { tabs, className } = this.options;
        
        this.element = createElement('div', { 
            className: `tabs ${className}`,
        },
            // Tab list
            this._renderTabList(tabs),
            
            // Tab panels
            ...tabs.map(tab => this._renderTabPanel(tab))
        );
        
        return this.element;
    }
    
    /**
     * _renderTabList - Render tab buttons
     * 
     * @private
     * @param {Array} tabs - Tab definitions
     * @returns {Element} Tab list element
     */
    _renderTabList(tabs) {
        const tabList = createElement('div', {
            className: 'tabs__list',
            role: 'tablist',
        },
            ...tabs.map(tab => this._renderTabButton(tab))
        );
        
        return tabList;
    }
    
    /**
     * _renderTabButton - Render a single tab button
     * 
     * @private
     * @param {Object} tab - Tab definition
     * @returns {Element} Tab button element
     */
    _renderTabButton(tab) {
        const isActive = tab.id === this.activeTab;
        const isDisabled = tab.disabled;
        
        const button = createElement('button', {
            className: `tabs__button ${isActive ? 'tabs__button--active' : ''}`,
            role: 'tab',
            'aria-selected': isActive,
            'aria-controls': `tabpanel-${tab.id}`,
            id: `tab-${tab.id}`,
            tabindex: isActive ? '0' : '-1',
            disabled: isDisabled,
        },
            tab.icon ? createElement('span', { className: `tabs__button-icon ${tab.icon}` }) : null,
            createElement('span', { className: 'tabs__button-label' }, tab.label)
        );
        
        // Click handler
        if (!isDisabled) {
            on(button, 'click', () => this.handleTabClick(tab.id));
        }
        
        this.tabButtons.push({ id: tab.id, element: button });
        
        return button;
    }
    
    /**
     * _renderTabPanel - Render tab content panel
     * 
     * @private
     * @param {Object} tab - Tab definition
     * @returns {Element} Tab panel element
     */
    _renderTabPanel(tab) {
        const isActive = tab.id === this.activeTab;
        
        const panel = createElement('div', {
            className: `tabs__panel ${isActive ? 'tabs__panel--active' : ''}`,
            role: 'tabpanel',
            id: `tabpanel-${tab.id}`,
            'aria-labelledby': `tab-${tab.id}`,
            tabindex: '0',
            hidden: !isActive,
        });
        
        // Add content
        if (typeof tab.content === 'string') {
            panel.innerHTML = tab.content;
        } else if (tab.content instanceof Element) {
            panel.appendChild(tab.content);
        } else if (typeof tab.content === 'function') {
            const content = tab.content();
            if (content instanceof Element) {
                panel.appendChild(content);
            }
        }
        
        this.tabPanels.push({ id: tab.id, element: panel });
        
        return panel;
    }
    
    /**
     * mount - Attach tabs to container
     * 
     * @param {Element} container - Container element
     */
    mount(container) {
        if (!container) return;
        
        const tabs = this.render();
        container.appendChild(tabs);
        
        // Add keyboard navigation
        on(this.element, 'keydown', this.handleKeyDown);
    }
    
    /**
     * unmount - Remove tabs
     */
    unmount() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.element = null;
        this.tabButtons = [];
        this.tabPanels = [];
    }
    
    /**
     * handleTabClick - Handle tab click
     * 
     * @param {string} tabId - Tab ID to activate
     */
    handleTabClick(tabId) {
        if (tabId === this.activeTab) return;
        
        this.setActiveTab(tabId);
    }
    
    /**
     * setActiveTab - Set active tab
     * 
     * @param {string} tabId - Tab ID to activate
     */
    setActiveTab(tabId) {
        const { tabs, onChange } = this.options;
        const tab = tabs.find(t => t.id === tabId);
        
        if (!tab || tab.disabled) return;
        
        // Update active tab
        this.activeTab = tabId;
        
        // Update button states
        this.tabButtons.forEach(({ id, element }) => {
            if (id === tabId) {
                addClass(element, 'tabs__button--active');
                element.setAttribute('aria-selected', 'true');
                element.setAttribute('tabindex', '0');
                element.focus();
            } else {
                removeClass(element, 'tabs__button--active');
                element.setAttribute('aria-selected', 'false');
                element.setAttribute('tabindex', '-1');
            }
        });
        
        // Update panel visibility
        this.tabPanels.forEach(({ id, element }) => {
            if (id === tabId) {
                addClass(element, 'tabs__panel--active');
                element.removeAttribute('hidden');
            } else {
                removeClass(element, 'tabs__panel--active');
                element.setAttribute('hidden', '');
            }
        });
        
        // Callback
        if (onChange) {
            onChange(tabId);
        }
    }
    
    /**
     * handleKeyDown - Handle keyboard navigation
     * 
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
        const { tabs } = this.options;
        const enabledTabs = tabs.filter(t => !t.disabled);
        const currentIndex = enabledTabs.findIndex(t => t.id === this.activeTab);
        
        let newIndex;
        
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                newIndex = (currentIndex + 1) % enabledTabs.length;
                this.setActiveTab(enabledTabs[newIndex].id);
                break;
                
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                newIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
                this.setActiveTab(enabledTabs[newIndex].id);
                break;
                
            case 'Home':
                e.preventDefault();
                this.setActiveTab(enabledTabs[0].id);
                break;
                
            case 'End':
                e.preventDefault();
                this.setActiveTab(enabledTabs[enabledTabs.length - 1].id);
                break;
        }
    }
    
    /**
     * getActiveTab - Get current active tab ID
     * 
     * @returns {string} Active tab ID
     */
    getActiveTab() {
        return this.activeTab;
    }
    
    /**
     * addTab - Add a new tab
     * 
     * @param {Object} tab - Tab definition
     */
    addTab(tab) {
        this.options.tabs.push(tab);
        this._update();
    }
    
    /**
     * removeTab - Remove a tab
     * 
     * @param {string} tabId - Tab ID to remove
     */
    removeTab(tabId) {
        this.options.tabs = this.options.tabs.filter(t => t.id !== tabId);
        
        if (this.activeTab === tabId) {
            this.activeTab = this.options.tabs[0]?.id;
        }
        
        this._update();
    }
    
    /**
     * _update - Update tabs display
     * 
     * @private
     */
    _update() {
        if (!this.element) return;
        
        const newElement = this.render();
        this.element.parentNode.replaceChild(newElement, this.element);
        this.element = newElement;
    }
}

export default Tabs;