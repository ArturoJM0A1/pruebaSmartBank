/**
 * ============================================================================
 * Search Bar Component
 * ============================================================================
 * 
 * PURPOSE:
 * Search input with debounce, clear button, and recent searches.
 * 
 * DEBOUNCED SEARCH:
 * - Wait for user to stop typing before searching
 * - Prevents excessive API calls
 * - Default delay: 300ms
 * 
 * RECENT SEARCHES:
 * - Show recent searches for quick re-search
 * - Store in localStorage
 * - Clear option
 * 
 * AUTOCOMPLETE:
 * - Show suggestions as user types
 * - Keyboard navigation (arrow keys)
 * - Click or Enter to select
 * 
 * RELATED CONCEPTS:
 * - Typeahead
 * - Autocomplete
 * - Search UX patterns
 * ============================================================================
 */

import { createElement, on, addClass, removeClass } from '../../utils/dom.js';
import { debounce } from '../../utils/helpers.js';
import { getLastSearch, setLastSearch } from '../../utils/storage.js';

class SearchBar {
    constructor(options = {}) {
        this.options = {
            placeholder: 'Buscar...',
            debounceDelay: 300,
            onSearch: null,
            onSelect: null,
            showRecentSearches: true,
            maxRecentSearches: 5,
            className: '',
            ...options,
        };
        
        this.element = null;
        this.input = null;
        this.recentSearches = [];
        this.isOpen = false;
        this.selectedRecentIndex = -1;
        
        // Bind methods
        this.handleInput = debounce(this.handleInput.bind(this), this.options.debounceDelay);
        this.handleFocus = this.handleFocus.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleClear = this.handleClear.bind(this);
        this.handleRecentClick = this.handleRecentClick.bind(this);
        
        // Load recent searches
        this._loadRecentSearches();
    }
    
    /**
     * render - Create search bar DOM structure
     * 
     * @returns {Element} Search bar element
     */
    render() {
        const { placeholder, className, showRecentSearches } = this.options;
        
        this.element = createElement('div', { 
            className: `search-bar ${className}`,
        },
            // Search icon
            createElement('span', { className: 'search-bar__icon icon-search' }),
            
            // Input
            this.input = createElement('input', {
                type: 'search',
                className: 'search-bar__input',
                placeholder,
                'aria-label': 'Search',
                autocomplete: 'off',
            }),
            
            // Clear button
            createElement('button', {
                className: 'search-bar__clear',
                'aria-label': 'Clear search',
                onClick: this.handleClear,
            }, createElement('span', { className: 'icon-x' })),
            
            // Recent searches dropdown
            showRecentSearches ? this._renderRecentSearches() : null
        );
        
        return this.element;
    }
    
    /**
     * _renderRecentSearches - Render recent searches dropdown
     * 
     * @private
     * @returns {Element} Dropdown element
     */
    _renderRecentSearches() {
        return createElement('div', { 
            className: 'search-bar__recent',
        },
            createElement('div', { className: 'search-bar__recent-header' },
                createElement('span', null, 'Búsquedas recientes'),
                createElement('button', {
                    className: 'search-bar__recent-clear',
                    onClick: () => this.clearRecentSearches(),
                }, 'Limpiar')
            ),
            createElement('ul', { className: 'search-bar__recent-list' },
                ...this.recentSearches.map((search, index) => 
                    createElement('li', { 
                        className: 'search-bar__recent-item',
                        'data-index': index,
                    },
                        createElement('span', { className: 'icon-clock' }),
                        createElement('span', null, search)
                    )
                )
            )
        );
    }
    
    /**
     * mount - Attach search bar to container
     * 
     * @param {Element} container - Container element
     */
    mount(container) {
        if (!container) return;
        
        const searchBar = this.render();
        container.appendChild(searchBar);
        
        // Add event listeners
        this._addEventListeners();
    }
    
    /**
     * unmount - Remove search bar
     */
    unmount() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.element = null;
        this.input = null;
    }
    
    /**
     * _addEventListeners - Add event listeners
     * 
     * @private
     */
    _addEventListeners() {
        if (!this.input) return;
        
        on(this.input, 'input', this.handleInput);
        on(this.input, 'focus', this.handleFocus);
        on(this.input, 'blur', this.handleBlur);
        on(this.input, 'keydown', this.handleKeyDown);
        
        // Recent search item clicks
        const recentList = this.element?.querySelector('.search-bar__recent-list');
        if (recentList) {
            on(recentList, 'click', (e) => {
                const item = e.target.closest('.search-bar__recent-item');
                if (item) {
                    const index = parseInt(item.dataset.index, 10);
                    this.handleRecentClick(index);
                }
            });
        }
    }
    
    /**
     * handleInput - Handle input change
     * 
     * @param {Event} e - Input event
     */
    handleInput(e) {
        const value = e.target.value;
        
        // Update clear button visibility
        this._updateClearButton(value);
        
        // Call search callback
        if (this.options.onSearch) {
            this.options.onSearch(value);
        }
    }
    
    /**
     * handleFocus - Handle input focus
     */
    handleFocus() {
        this.isOpen = true;
        this._updateDropdown();
    }
    
    /**
     * handleBlur - Handle input blur
     * 
     * WHY: Delay hiding dropdown to allow click events
     */
    handleBlur() {
        setTimeout(() => {
            this.isOpen = false;
            this._updateDropdown();
        }, 200);
    }
    
    /**
     * handleKeyDown - Handle keyboard navigation
     * 
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
        if (!this.isOpen || this.recentSearches.length === 0) return;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedRecentIndex = Math.min(
                    this.selectedRecentIndex + 1,
                    this.recentSearches.length - 1
                );
                this._updateSelectedRecent();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.selectedRecentIndex = Math.max(
                    this.selectedRecentIndex - 1,
                    -1
                );
                this._updateSelectedRecent();
                break;
                
            case 'Enter':
                if (this.selectedRecentIndex >= 0) {
                    e.preventDefault();
                    this.handleRecentClick(this.selectedRecentIndex);
                } else if (this.input.value.trim()) {
                    this._addToRecentSearches(this.input.value.trim());
                }
                break;
                
            case 'Escape':
                this.isOpen = false;
                this._updateDropdown();
                this.input.blur();
                break;
        }
    }
    
    /**
     * handleClear - Clear search input
     */
    handleClear() {
        if (this.input) {
            this.input.value = '';
            this.input.focus();
            this._updateClearButton('');
            
            if (this.options.onSearch) {
                this.options.onSearch('');
            }
        }
    }
    
    /**
     * handleRecentClick - Handle recent search click
     * 
     * @param {number} index - Recent search index
     */
    handleRecentClick(index) {
        const search = this.recentSearches[index];
        if (search && this.input) {
            this.input.value = search;
            this._updateClearButton(search);
            
            if (this.options.onSearch) {
                this.options.onSearch(search);
            }
            
            this.isOpen = false;
            this._updateDropdown();
        }
    }
    
    /**
     * clearRecentSearches - Clear all recent searches
     */
    clearRecentSearches() {
        this.recentSearches = [];
        this._saveRecentSearches();
        this._updateDropdown();
    }
    
    /**
     * _loadRecentSearches - Load recent searches from localStorage
     * 
     * @private
     */
    _loadRecentSearches() {
        try {
            const stored = localStorage.getItem('smartbank_recent_searches');
            if (stored) {
                this.recentSearches = JSON.parse(stored);
            }
        } catch {
            this.recentSearches = [];
        }
    }
    
    /**
     * _saveRecentSearches - Save recent searches to localStorage
     * 
     * @private
     */
    _saveRecentSearches() {
        try {
            localStorage.setItem('smartbank_recent_searches', JSON.stringify(this.recentSearches));
        } catch {
            // Ignore storage errors
        }
    }
    
    /**
     * _addToRecentSearches - Add search to recent searches
     * 
     * @private
     * @param {string} search - Search term
     */
    _addToRecentSearches(search) {
        // Remove if already exists
        this.recentSearches = this.recentSearches.filter(s => s !== search);
        
        // Add to beginning
        this.recentSearches.unshift(search);
        
        // Limit to max
        this.recentSearches = this.recentSearches.slice(0, this.options.maxRecentSearches);
        
        // Save
        this._saveRecentSearches();
    }
    
    /**
     * _updateClearButton - Update clear button visibility
     * 
     * @private
     * @param {string} value - Current input value
     */
    _updateClearButton(value) {
        const clearBtn = this.element?.querySelector('.search-bar__clear');
        if (clearBtn) {
            clearBtn.style.display = value ? 'flex' : 'none';
        }
    }
    
    /**
     * _updateDropdown - Update recent searches dropdown visibility
     * 
     * @private
     */
    _updateDropdown() {
        const recent = this.element?.querySelector('.search-bar__recent');
        if (recent) {
            if (this.isOpen && this.recentSearches.length > 0 && this.input?.value === '') {
                addClass(recent, 'search-bar__recent--visible');
            } else {
                removeClass(recent, 'search-bar__recent--visible');
            }
        }
    }
    
    /**
     * _updateSelectedRecent - Update selected recent search highlight
     * 
     * @private
     */
    _updateSelectedRecent() {
        const items = this.element?.querySelectorAll('.search-bar__recent-item');
        items?.forEach((item, index) => {
            if (index === this.selectedRecentIndex) {
                addClass(item, 'search-bar__recent-item--selected');
            } else {
                removeClass(item, 'search-bar__recent-item--selected');
            }
        });
    }
    
    /**
     * setValue - Set search input value
     * 
     * @param {string} value - Value to set
     */
    setValue(value) {
        if (this.input) {
            this.input.value = value;
            this._updateClearButton(value);
        }
    }
    
    /**
     * getValue - Get current search value
     * 
     * @returns {string} Current value
     */
    getValue() {
        return this.input?.value || '';
    }
    
    /**
     * focus - Focus the search input
     */
    focus() {
        this.input?.focus();
    }
}

export default SearchBar;