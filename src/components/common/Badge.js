/**
 * ============================================================================
 * Badge/Tag Component
 * ============================================================================
 * 
 * PURPOSE:
 * Small visual indicators for status, labels, or counts.
 * 
 * USE CASES:
 * - Status badges (active, pending, blocked)
 * - Notification counts
 * - Labels/tags for categorization
 * - State indicators
 * 
 * ACCESSIBILITY:
 * - Use aria-label for context
 * - Color alone shouldn't convey meaning (add text)
 * 
 * RELATED CONCEPTS:
 * - Status indicators
 * - Labels
 * - Tags
 * - Chips
 * ============================================================================
 */

import { createElement } from '../../utils/dom.js';

/**
 * Badge Component
 * 
 * @param {Object} options - Badge options
 * @param {string} options.variant - Badge variant (primary, success, warning, danger, info)
 * @param {string} options.size - Badge size (small, medium, large)
 * @param {boolean} options.pill - Pill shape (rounded)
 * @param {boolean} options.dot - Show as dot only
 * @param {string} options.className - Additional classes
 * @returns {Element} Badge element
 */
export function Badge(options = {}) {
    const {
        variant = 'primary',
        size = 'small',
        pill = false,
        dot = false,
        className = '',
        children = [],
    } = options;
    
    const classNames = [
        'badge',
        `badge--${variant}`,
        `badge--${size}`,
        pill ? 'badge--pill' : '',
        dot ? 'badge--dot' : '',
        className,
    ].filter(Boolean).join(' ');
    
    return createElement('span', { className: classNames },
        ...children
    );
}

/**
 * StatusBadge - Badge for displaying status
 * 
 * @param {Object} options - Status badge options
 * @param {string} options.status - Status value
 * @param {Object} options.statusMap - Map of status to display config
 * @returns {Element} Status badge element
 */
export function StatusBadge({ status, statusMap = {} } = {}) {
    const defaultStatusMap = {
        active: { label: 'Activo', variant: 'success' },
        inactive: { label: 'Inactivo', variant: 'secondary' },
        pending: { label: 'Pendiente', variant: 'warning' },
        blocked: { label: 'Bloqueado', variant: 'danger' },
        completed: { label: 'Completado', variant: 'success' },
        failed: { label: 'Fallido', variant: 'danger' },
        cancelled: { label: 'Cancelado', variant: 'secondary' },
    };
    
    const map = { ...defaultStatusMap, ...statusMap };
    const config = map[status] || { label: status, variant: 'secondary' };
    
    return Badge({
        variant: config.variant,
        children: [config.label],
    });
}

/**
 * CountBadge - Badge for displaying counts
 * 
 * @param {Object} options - Count badge options
 * @param {number} options.count - Count value
 * @param {number} options.max - Maximum count to display
 * @returns {Element} Count badge element
 */
export function CountBadge({ count = 0, max = 99 } = {}) {
    const displayCount = count > max ? `${max}+` : String(count);
    
    return Badge({
        variant: 'danger',
        size: 'small',
        pill: true,
        children: [displayCount],
    });
}

export default Badge;