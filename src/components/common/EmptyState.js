/**
 * ============================================================================
 * Empty State Component
 * ============================================================================
 * 
 * PURPOSE:
 * Display a placeholder when there's no data to show.
 * Provides context and often includes a call-to-action.
 * 
 * EMPTY STATE PATTERNS:
 * - No results found
 * - No items yet
 * - Error state
 * - Welcome state
 * 
 * UX BEST PRACTICES:
 * - Explain why it's empty
 * - Provide a clear next action
 * - Use appropriate tone (not blaming the user)
 * 
 * RELATED CONCEPTS:
 * - Zero-state design
 * - Empty states
 * - Onboarding flows
 * ============================================================================
 */

import { createElement } from '../../utils/dom.js';

/**
 * EmptyState Component
 * 
 * @param {Object} options - Empty state options
 * @param {string} options.icon - Icon class
 * @param {string} options.title - Title text
 * @param {string} options.description - Description text
 * @param {Element} options.action - Action button/element
 * @param {string} options.className - Additional classes
 * @returns {Element} Empty state element
 */
export function EmptyState(options = {}) {
    const {
        icon = 'icon-inbox',
        title = 'No hay datos',
        description = '',
        action = null,
        className = '',
    } = options;
    
    return createElement('div', { className: `empty-state ${className}` },
        createElement('div', { className: 'empty-state__icon' },
            createElement('span', { className: icon })
        ),
        createElement('h3', { className: 'empty-state__title' }, title),
        description ? createElement('p', { className: 'empty-state__description' }, description) : null,
        action ? createElement('div', { className: 'empty-state__action' }, action) : null
    );
}

/**
 * NoResults - Empty state for search results
 * 
 * @param {Object} options - Options
 * @param {string} options.searchTerm - Search term used
 * @returns {Element} No results element
 */
export function NoResults({ searchTerm = '' } = {}) {
    return EmptyState({
        icon: 'icon-search',
        title: 'Sin resultados',
        description: searchTerm 
            ? `No se encontraron resultados para "${searchTerm}"`
            : 'No se encontraron resultados',
    });
}

/**
 * NoData - Empty state for no data
 * 
 * @param {Object} options - Options
 * @param {string} options.itemName - Name of the missing item
 * @returns {Element} No data element
 */
export function NoData({ itemName = 'elementos' } = {}) {
    return EmptyState({
        icon: 'icon-folder',
        title: `Sin ${itemName}`,
        description: `No hay ${itemName} para mostrar`,
    });
}

/**
 * ErrorState - Empty state for errors
 * 
 * @param {Object} options - Options
 * @param {string} options.message - Error message
 * @param {Function} options.onRetry - Retry handler
 * @returns {Element} Error state element
 */
export function ErrorState({ message = 'Algo salió mal', onRetry = null } = {}) {
    const action = onRetry ? createElement('button', {
        className: 'btn btn--primary',
        onClick: onRetry,
    }, 'Reintentar') : null;
    
    return EmptyState({
        icon: 'icon-alert-circle',
        title: 'Error',
        description: message,
        action,
    });
}

export default EmptyState;