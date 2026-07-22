/**
 * ============================================================================
 * Pagination Component
 * ============================================================================
 * 
 * PURPOSE:
 * Navigate through pages of data (accounts, transactions, etc.)
 * 
 * PAGINATION STRATEGIES:
 * 
 * 1. OFFSET-BASED (what we use):
 *    - Page 1: items 1-10
 *    - Page 2: items 11-20
 *    - Simple, widely used
 *    - Problem: Can miss items if data changes between pages
 * 
 * 2. CURSOR-BASED:
 *    - Uses "after" parameter (last item ID)
 *    - More stable with changing data
 *    - Used by: Twitter, Facebook, GraphQL APIs
 *    - Problem: Can't jump to specific page
 * 
 * 3. INFINITE SCROLL:
 *    - Load more as user scrolls
 *    - Better mobile experience
 *    - Problem: Hard to reach footer, SEO issues
 * 
 * ACCESSIBILITY:
 * - aria-label for navigation
 * - Keyboard navigation (arrow keys)
 * - Current page announced to screen readers
 * 
 * RELATED CONCEPTS:
 * - Virtual scrolling (for very large lists)
 * - Lazy loading
 * - Data tables
 * ============================================================================
 */

import { createElement, on } from '../../utils/dom.js';

class Pagination {
    constructor(options = {}) {
        this.options = {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 10,
            maxVisiblePages: 5,
            onPageChange: null,
            showInfo: true,
            showItemsPerPage: true,
            itemsPerPageOptions: [5, 10, 25, 50],
            ...options,
        };
        
        this.element = null;
        
        // Bind methods
        this.handlePageChange = this.handlePageChange.bind(this);
        this.handleItemsPerPage = this.handleItemsPerPage.bind(this);
    }
    
    /**
     * render - Create pagination DOM structure
     * 
     * @returns {Element} Pagination element
     */
    render() {
        const { currentPage, totalPages, totalItems, itemsPerPage, showInfo, showItemsPerPage, itemsPerPageOptions } = this.options;
        
        // Calculate total items on current page
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);
        
        this.element = createElement('div', { className: 'pagination' },
            // Info section
            showInfo ? createElement('div', { className: 'pagination__info' },
                createElement('span', { className: 'pagination__showing' },
                    `Mostrando ${startItem} a ${endItem} de ${totalItems} registros`
                )
            ) : null,
            
            // Page navigation
            createElement('nav', { 
                className: 'pagination__nav',
                'aria-label': 'Pagination',
            },
                // Previous button
                this._createPageButton('Anterior', currentPage - 1, currentPage === 1),
                
                // Page numbers
                ...this._getPageNumbers(),
                
                // Next button
                this._createPageButton('Siguiente', currentPage + 1, currentPage === totalPages)
            ),
            
            // Items per page selector
            showItemsPerPage ? createElement('div', { className: 'pagination__per-page' },
                createElement('label', { htmlFor: 'items-per-page' }, 'Por página:'),
                createElement('select', {
                    id: 'items-per-page',
                    className: 'pagination__select',
                    onChange: this.handleItemsPerPage,
                },
                    ...itemsPerPageOptions.map(option => 
                        createElement('option', { 
                            value: option,
                            selected: option === itemsPerPage,
                        }, String(option))
                    )
                )
            ) : null
        );
        
        return this.element;
    }
    
    /**
     * _getPageNumbers - Generate page number buttons
     * 
     * WHY: Show limited page numbers with ellipsis
     * Example: 1 2 3 ... 8 9 10
     * 
     * @private
     * @returns {Array<Element>} Page number elements
     */
    _getPageNumbers() {
        const { currentPage, totalPages, maxVisiblePages } = this.options;
        const pages = [];
        
        // Calculate start and end page numbers
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page
        if (startPage > 1) {
            pages.push(this._createPageButton('1', 1));
            if (startPage > 2) {
                pages.push(createElement('span', { className: 'pagination__ellipsis' }, '...'));
            }
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(this._createPageButton(String(i), i, false, i === currentPage));
        }
        
        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(createElement('span', { className: 'pagination__ellipsis' }, '...'));
            }
            pages.push(this._createPageButton(String(totalPages), totalPages));
        }
        
        return pages;
    }
    
    /**
     * _createPageButton - Create a page button
     * 
     * @private
     * @param {string} label - Button label
     * @param {number} page - Page number
     * @param {boolean} disabled - Is button disabled
     * @param {boolean} active - Is this the current page
     * @returns {Element} Button element
     */
    _createPageButton(label, page, disabled = false, active = false) {
        const className = [
            'pagination__btn',
            disabled ? 'pagination__btn--disabled' : '',
            active ? 'pagination__btn--active' : '',
        ].filter(Boolean).join(' ');
        
        const button = createElement('button', {
            className,
            'aria-label': `Page ${page}`,
            'aria-current': active ? 'page' : undefined,
            disabled,
        }, label);
        
        if (!disabled) {
            on(button, 'click', () => this.handlePageChange(page));
        }
        
        return button;
    }
    
    /**
     * handlePageChange - Handle page change
     * 
     * @param {number} page - New page number
     */
    handlePageChange(page) {
        const { totalPages, onPageChange } = this.options;
        
        if (page < 1 || page > totalPages) return;
        
        this.options.currentPage = page;
        
        if (onPageChange) {
            onPageChange(page, this.options.itemsPerPage);
        }
        
        // Re-render
        this._update();
    }
    
    /**
     * handleItemsPerPage - Handle items per page change
     * 
     * @param {Event} e - Change event
     */
    handleItemsPerPage(e) {
        const newItemsPerPage = parseInt(e.target.value, 10);
        this.options.itemsPerPage = newItemsPerPage;
        this.options.currentPage = 1; // Reset to first page
        
        if (this.options.onPageChange) {
            this.options.onPageChange(1, newItemsPerPage);
        }
        
        this._update();
    }
    
    /**
     * _update - Update pagination display
     * 
     * @private
     */
    _update() {
        if (!this.element) return;
        
        const newElement = this.render();
        this.element.parentNode.replaceChild(newElement, this.element);
        this.element = newElement;
    }
    
    /**
     * update - Update pagination options
     * 
     * @param {Object} options - New options
     */
    update(options) {
        this.options = { ...this.options, ...options };
        this._update();
    }
    
    /**
     * mount - Attach pagination to container
     * 
     * @param {Element} container - Container element
     */
    mount(container) {
        if (!container) return;
        
        const pagination = this.render();
        container.appendChild(pagination);
    }
    
    /**
     * unmount - Remove pagination
     */
    unmount() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.element = null;
    }
}

export default Pagination;