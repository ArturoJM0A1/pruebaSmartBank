/**
 * ============================================================================
 * Data Table Component
 * ============================================================================
 * 
 * PURPOSE:
 * Display tabular data with sorting, custom rendering, and interactions.
 * 
 * TABLE PATTERNS:
 * 
 * 1. BASIC TABLE:
 *    - Simple HTML table
 *    - Good for small datasets
 * 
 * 2. DATA TABLE:
 *    - Sorting, filtering, pagination
 *    - Custom cell renderers
 *    - Row selection
 * 
 * 3. VIRTUAL SCROLLING:
 *    - Only renders visible rows
 *    - Handles millions of items
 *    - Complex to implement
 * 
 * PERFORMANCE:
 * - For < 100 rows: DOM rendering is fine
 * - For 100-1000 rows: Consider pagination
 * - For > 1000 rows: Virtual scrolling
 * 
 * ACCESSIBILITY:
 * - Proper table semantics
 * - Sort buttons with aria-sort
 * - Keyboard navigation
 * - Screen reader announcements
 * 
 * RELATED CONCEPTS:
 * - Virtual scrolling (react-window, react-virtualized)
 * - Infinite scrolling
 * - Server-side pagination
 * - Column resizing
 * ============================================================================
 */

import { createElement, on, addClass, removeClass } from '../../utils/dom.js';

class Table {
    constructor(options = {}) {
        this.options = {
            columns: [],
            data: [],
            onRowClick: null,
            onSort: null,
            sortable: true,
            striped: true,
            hoverable: true,
            emptyMessage: 'No hay datos disponibles',
            loading: false,
            className: '',
            ...options,
        };
        
        this.element = null;
        this.sortColumn = null;
        this.sortDirection = 'asc';
    }
    
    /**
     * render - Create table DOM structure
     * 
     * @returns {Element} Table element
     */
    render() {
        const { columns, data, striped, hoverable, loading, className, emptyMessage } = this.options;
        
        this.element = createElement('div', { 
            className: `table-container ${className}`,
        },
            // Loading overlay
            loading ? createElement('div', { className: 'table-loading' },
                createElement('div', { className: 'spinner spinner--medium' })
            ) : null,
            
            // Table
            createElement('table', { className: `table ${striped ? 'table--striped' : ''} ${hoverable ? 'table--hover' : ''}` },
                // Header
                createElement('thead', { className: 'table__header' },
                    createElement('tr', null,
                        ...columns.map(col => this._renderHeaderCell(col))
                    )
                ),
                
                // Body
                createElement('tbody', { className: 'table__body' },
                    data.length === 0 
                        ? createElement('tr', null,
                            createElement('td', { 
                                className: 'table__empty',
                                colspan: columns.length,
                            }, emptyMessage)
                        )
                        : data.map((row, index) => this._renderRow(row, index))
                )
            )
        );
        
        return this.element;
    }
    
    /**
     * _renderHeaderCell - Render a header cell
     * 
     * @private
     * @param {Object} column - Column configuration
     * @returns {Element} Header cell element
     */
    _renderHeaderCell(column) {
        const { sortable } = this.options;
        const isSorted = this.sortColumn === column.key;
        
        const th = createElement('th', {
            className: `table__th ${column.className || ''} ${sortable && column.sortable !== false ? 'table__th--sortable' : ''}`,
            style: column.width ? { width: column.width } : {},
            'aria-sort': isSorted ? (this.sortDirection === 'asc' ? 'ascending' : 'descending') : 'none',
        },
            createElement('div', { className: 'table__th-content' },
                column.label,
                sortable && column.sortable !== false ? createElement('span', { 
                    className: `table__sort-icon ${isSorted ? 'table__sort-icon--active' : ''} ${isSorted && this.sortDirection === 'desc' ? 'table__sort-icon--desc' : ''}`,
                }) : null
            )
        );
        
        // Add sort handler
        if (sortable && column.sortable !== false) {
            on(th, 'click', () => this._handleSort(column.key));
            th.style.cursor = 'pointer';
        }
        
        return th;
    }
    
    /**
     * _renderRow - Render a table row
     * 
     * @private
     * @param {Object} row - Row data
     * @param {number} index - Row index
     * @returns {Element} Row element
     */
    _renderRow(row, index) {
        const { columns, onRowClick } = this.options;
        
        const tr = createElement('tr', {
            className: `table__row ${onRowClick ? 'table__row--clickable' : ''}`,
            'data-index': index,
        },
            ...columns.map(col => this._renderCell(row, col, index))
        );
        
        // Row click handler
        if (onRowClick) {
            on(tr, 'click', () => onRowClick(row, index));
        }
        
        return tr;
    }
    
    /**
     * _renderCell - Render a table cell
     * 
     * @private
     * @param {Object} row - Row data
     * @param {Object} column - Column configuration
     * @param {number} index - Row index
     * @returns {Element} Cell element
     */
    _renderCell(row, column, index) {
        const value = row[column.key];
        
        let content;
        
        // Custom renderer
        if (column.render) {
            content = column.render(value, row, index);
        } else {
            content = String(value ?? '');
        }
        
        return createElement('td', {
            className: `table__td ${column.className || ''}`,
        }, content);
    }
    
    /**
     * _handleSort - Handle column sort
     * 
     * @private
     * @param {string} columnKey - Column key to sort by
     */
    _handleSort(columnKey) {
        // Toggle direction if same column
        if (this.sortColumn === columnKey) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = columnKey;
            this.sortDirection = 'asc';
        }
        
        // Sort data
        this._sortData();
        
        // Callback
        if (this.options.onSort) {
            this.options.onSort(this.sortColumn, this.sortDirection);
        }
        
        // Re-render
        this._update();
    }
    
    /**
     * _sortData - Sort data array
     * 
     * @private
     */
    _sortData() {
        const { data } = this.options;
        const { sortColumn, sortDirection } = this;
        
        if (!sortColumn) return;
        
        this.options.data = [...data].sort((a, b) => {
            let valueA = a[sortColumn];
            let valueB = b[sortColumn];
            
            // Handle different types
            if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }
            
            if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
            if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }
    
    /**
     * _update - Update table display
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
     * update - Update table data and options
     * 
     * @param {Object} options - New options
     */
    update(options) {
        this.options = { ...this.options, ...options };
        this._update();
    }
    
    /**
     * setData - Update table data
     * 
     * @param {Array} data - New data
     */
    setData(data) {
        this.options.data = data;
        this._update();
    }
    
    /**
     * setLoading - Set loading state
     * 
     * @param {boolean} loading - Loading state
     */
    setLoading(loading) {
        this.options.loading = loading;
        this._update();
    }
    
    /**
     * mount - Attach table to container
     * 
     * @param {Element} container - Container element
     */
    mount(container) {
        if (!container) return;
        
        const table = this.render();
        container.appendChild(table);
    }
    
    /**
     * unmount - Remove table
     */
    unmount() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.element = null;
    }
}

export default Table;