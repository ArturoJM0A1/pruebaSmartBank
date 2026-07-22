/**
 * ============================================================================
 * Card Component
 * ============================================================================
 * 
 * PURPOSE:
 * Generic card container for grouping related content.
 * 
 * CARD USAGE:
 * - Dashboard widgets
 * - Content sections
 * - Data display
 * - Forms
 * 
 * DESIGN PRINCIPLES:
 * - Consistent padding and margins
 * - Subtle shadows for depth
 * - Clear visual hierarchy
 * 
 * RELATED CONCEPTS:
 * - Material Design cards
 * - Bootstrap cards
 * - CSS Grid/Flexbox layouts
 * ============================================================================
 */

import { createElement } from '../../utils/dom.js';

/**
 * Card Component
 * 
 * @param {Object} options - Card options
 * @param {string} options.className - Additional classes
 * @param {boolean} options.hoverable - Hover effect
 * @param {boolean} options.bordered - Show border
 * @param {Function} options.onClick - Click handler
 * @returns {Element} Card element
 */
export function Card(options = {}) {
    const {
        className = '',
        hoverable = false,
        bordered = true,
        onClick = null,
        children = [],
    } = options;
    
    const classNames = [
        'card',
        hoverable ? 'card--hoverable' : '',
        bordered ? 'card--bordered' : '',
        className,
    ].filter(Boolean).join(' ');
    
    const card = createElement('div', {
        className: classNames,
        onclick: onClick,
        style: onClick ? { cursor: 'pointer' } : {},
    }, ...children);
    
    return card;
}

/**
 * CardHeader - Card header section
 * 
 * @param {Object} options - Header options
 * @param {string} options.title - Header title
 * @param {string} options.subtitle - Header subtitle
 * @param {Element} options.action - Action button/element
 * @returns {Element} Header element
 */
export function CardHeader({ title = '', subtitle = '', action = null } = {}) {
    return createElement('div', { className: 'card__header' },
        createElement('div', { className: 'card__header-content' },
            title ? createElement('h3', { className: 'card__title' }, title) : null,
            subtitle ? createElement('p', { className: 'card__subtitle' }, subtitle) : null
        ),
        action ? createElement('div', { className: 'card__action' }, action) : null
    );
}

/**
 * CardBody - Card body section
 * 
 * @param {Object} options - Body options
 * @param {boolean} options.padding - Add padding
 * @returns {Element} Body element
 */
export function CardBody({ padding = true, children = [] } = {}) {
    return createElement('div', { 
        className: `card__body ${padding ? 'card__body--padded' : ''}`,
    }, ...children);
}

/**
 * CardFooter - Card footer section
 * 
 * @param {Object} options - Footer options
 * @returns {Element} Footer element
 */
export function CardFooter({ children = [] } = {}) {
    return createElement('div', { className: 'card__footer' }, ...children);
}

/**
 * StatCard - Card for displaying statistics
 * 
 * @param {Object} options - Stat options
 * @param {string} options.label - Stat label
 * @param {string|number} options.value - Stat value
 * @param {string} options.change - Change percentage
 * @param {boolean} options.positive - Is change positive
 * @param {string} options.icon - Icon class
 * @returns {Element} Stat card element
 */
export function StatCard({ label = '', value = '', change = '', positive = true, icon = null } = {}) {
    return Card({
        className: 'stat-card',
        children: [
            CardBody({
                children: [
                    createElement('div', { className: 'stat-card__content' },
                        createElement('p', { className: 'stat-card__label' }, label),
                        createElement('h2', { className: 'stat-card__value' }, String(value)),
                        change ? createElement('p', { 
                            className: `stat-card__change ${positive ? 'stat-card__change--positive' : 'stat-card__change--negative'}`,
                        }, `${positive ? '+' : ''}${change}%`) : null
                    ),
                    icon ? createElement('div', { className: 'stat-card__icon' },
                        createElement('span', { className: icon })
                    ) : null
                ]
            })
        ]
    });
}

/**
 * InfoCard - Card for displaying information
 * 
 * @param {Object} options - Info options
 * @param {string} options.title - Info title
 * @param {string} options.description - Info description
 * @param {string} options.icon - Icon class
 * @param {string} options.variant - Card variant
 * @returns {Element} Info card element
 */
export function InfoCard({ title = '', description = '', icon = null, variant = 'default' } = {}) {
    return Card({
        className: `info-card info-card--${variant}`,
        children: [
            CardBody({
                children: [
                    createElement('div', { className: 'info-card__icon' },
                        createElement('span', { className: icon || 'icon-info' })
                    ),
                    createElement('div', { className: 'info-card__content' },
                        createElement('h3', { className: 'info-card__title' }, title),
                        createElement('p', { className: 'info-card__description' }, description)
                    )
                ]
            })
        ]
    });
}

export default Card;