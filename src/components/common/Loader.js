/**
 * ============================================================================
 * Loading Indicator Components
 * ============================================================================
 * 
 * PURPOSE:
 * Visual feedback during loading states. Multiple variants:
 * - Spinner: For quick operations
 * - Skeleton: For content loading (better UX)
 * - Progress bar: For known-duration operations
 * - Full page: For initial app load
 * 
 * LOADING UX PATTERNS:
 * 
 * 1. SPINNER:
 *    - Simple rotating icon
 *    - Good for buttons, small areas
 *    - Doesn't indicate progress
 * 
 * 2. SKELETON LOADING:
 *    - Shows placeholder shapes matching content layout
 *    - Better perceived performance
 *    - Users see where content will appear
 *    - Used by: Facebook, YouTube, LinkedIn
 * 
 * 3. PROGRESS BAR:
 *    - Shows actual progress percentage
 *    - Good for file uploads, downloads
 *    - Requires knowing total progress
 * 
 * 4. FULL PAGE LOADER:
 *    - Covers entire screen
 *    - Used for initial load
 *    - Shows app branding
 * 
 * PERFORMANCE:
 * - Don't show loader for < 300ms operations (flickering)
 * - Use skeleton for content that takes time to layout
 * - Progress bar only when you know the total
 * 
 * RELATED CONCEPTS:
 * - Perceived performance
 * - Progressive loading
 * - Content-first loading
 * - Optimistic UI
 * ============================================================================
 */

import { createElement, addClass } from '../../utils/dom.js';

/**
 * Spinner Component
 * 
 * @param {Object} options - Spinner options
 * @param {string} options.size - Size: small, medium, large
 * @param {string} options.color - Color: primary, white, etc.
 * @returns {Element} Spinner element
 */
export function Spinner({ size = 'medium', color = 'primary' } = {}) {
    return createElement('div', {
        className: `spinner spinner--${size} spinner--${color}`,
        'aria-label': 'Loading',
        role: 'status',
    },
        createElement('div', { className: 'spinner__circle' }),
        createElement('span', { className: 'spinner__sr-only' }, 'Loading...')
    );
}

/**
 * Skeleton Component
 * 
 * WHY: Skeleton screens show placeholder shapes while content loads.
 * This gives users a preview of the layout, reducing perceived wait time.
 * 
 * @param {Object} options - Skeleton options
 * @param {string} options.type - Type: text, heading, avatar, card, image
 * @param {number} options.lines - Number of lines (for text)
 * @param {string} options.width - Custom width
 * @returns {Element} Skeleton element
 */
export function Skeleton({ type = 'text', lines = 1, width = null } = {}) {
    const className = `skeleton skeleton--${type}`;
    const elements = [];
    
    switch (type) {
        case 'text':
            for (let i = 0; i < lines; i++) {
                elements.push(
                    createElement('div', { 
                        className: 'skeleton__line',
                        style: { width: i === lines - 1 ? '70%' : '100%' },
                    })
                );
            }
            break;
            
        case 'heading':
            elements.push(createElement('div', { className: 'skeleton__heading' }));
            break;
            
        case 'avatar':
            elements.push(createElement('div', { className: 'skeleton__avatar' }));
            break;
            
        case 'card':
            elements.push(
                createElement('div', { className: 'skeleton__card' },
                    createElement('div', { className: 'skeleton__card-header' }),
                    createElement('div', { className: 'skeleton__card-body' },
                        createElement('div', { className: 'skeleton__line' }),
                        createElement('div', { className: 'skeleton__line' }),
                        createElement('div', { className: 'skeleton__line skeleton__line--short' })
                    )
                )
            );
            break;
            
        case 'image':
            elements.push(createElement('div', { className: 'skeleton__image' }));
            break;
            
        case 'table':
            for (let i = 0; i < 5; i++) {
                elements.push(
                    createElement('div', { className: 'skeleton__table-row' },
                        createElement('div', { className: 'skeleton__table-cell' }),
                        createElement('div', { className: 'skeleton__table-cell' }),
                        createElement('div', { className: 'skeleton__table-cell' })
                    )
                );
            }
            break;
    }
    
    const skeleton = createElement('div', {
        className,
        'aria-hidden': 'true',
    }, ...elements);
    
    if (width) {
        skeleton.style.width = width;
    }
    
    return skeleton;
}

/**
 * ProgressBar Component
 * 
 * @param {Object} options - Progress options
 * @param {number} options.value - Current progress (0-100)
 * @param {boolean} options.indeterminate - Show indeterminate progress
 * @param {string} options.label - Accessible label
 * @returns {Element} Progress bar element
 */
export function ProgressBar({ value = 0, indeterminate = false, label = 'Progress' } = {}) {
    const progress = createElement('div', {
        className: `progress-bar ${indeterminate ? 'progress-bar--indeterminate' : ''}`,
        role: 'progressbar',
        'aria-valuenow': indeterminate ? undefined : value,
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-label': label,
    },
        createElement('div', { 
            className: 'progress-bar__track',
        },
            createElement('div', { 
                className: 'progress-bar__fill',
                style: { width: indeterminate ? '100%' : `${Math.min(100, Math.max(0, value))}%` },
            })
        ),
        !indeterminate ? createElement('span', { className: 'progress-bar__text' }, `${Math.round(value)}%`) : null
    );
    
    return progress;
}

/**
 * FullPageLoader Component
 * 
 * WHY: Shown during initial app load or critical operations.
 * Covers entire screen with branding.
 * 
 * @param {Object} options - Loader options
 * @param {string} options.message - Loading message
 * @returns {Element} Full page loader element
 */
export function FullPageLoader({ message = 'Cargando...' } = {}) {
    return createElement('div', { className: 'full-page-loader' },
        createElement('div', { className: 'full-page-loader__content' },
            Spinner({ size: 'large' }),
            createElement('p', { className: 'full-page-loader__message' }, message)
        )
    );
}

/**
 * ButtonLoader Component (inline loading for buttons)
 * 
 * @returns {Element} Button loader element
 */
export function ButtonLoader() {
    return createElement('span', { className: 'button-loader' },
        createElement('span', { className: 'button-loader__spinner' })
    );
}

/**
 * ContentLoader - Show skeleton while content loads
 * 
 * @param {string} type - Content type to simulate
 * @returns {Element} Content loader element
 */
export function ContentLoader({ type = 'card' } = {}) {
    const loaders = {
        'dashboard': () => createElement('div', { className: 'content-loader' },
            Skeleton({ type: 'card' }),
            Skeleton({ type: 'card' }),
            Skeleton({ type: 'card' })
        ),
        'table': () => Skeleton({ type: 'table' }),
        'form': () => createElement('div', { className: 'content-loader content-loader--form' },
            Skeleton({ type: 'text', lines: 1 }),
            Skeleton({ type: 'text', lines: 1 }),
            Skeleton({ type: 'text', lines: 1 }),
            Skeleton({ type: 'text', lines: 1 })
        ),
        'detail': () => createElement('div', { className: 'content-loader content-loader--detail' },
            Skeleton({ type: 'heading' }),
            Skeleton({ type: 'text', lines: 3 }),
            Skeleton({ type: 'image' })
        ),
    };
    
    const loader = loaders[type] || loaders['card'];
    return loader();
}

export default {
    Spinner,
    Skeleton,
    ProgressBar,
    FullPageLoader,
    ButtonLoader,
    ContentLoader,
};