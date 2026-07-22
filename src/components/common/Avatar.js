/**
 * ============================================================================
 * Avatar Component
 * ============================================================================
 * 
 * PURPOSE:
 * Display user profile image with fallback to initials.
 * 
 * AVATAR PATTERNS:
 * - Image with fallback
 * - Initials (when no image)
 * - Icon (for system users)
 * - Status indicator (online/offline)
 * 
 * ACCESSIBILITY:
 * - alt text for images
 * - aria-label for screen readers
 * 
 * RELATED CONCEPTS:
 * - Profile pictures
 * - User representation
 * - Fallback strategies
 * ============================================================================
 */

import { createElement } from '../../utils/dom.js';

/**
 * Avatar Component
 * 
 * @param {Object} options - Avatar options
 * @param {string} options.src - Image URL
 * @param {string} options.alt - Alt text
 * @param {string} options.name - User name (for initials fallback)
 * @param {string} options.size - Size: small, medium, large, xlarge
 * @param {string} options.shape - Shape: circle, square
 * @param {string} options.status - Status: online, offline, away
 * @param {string} options.className - Additional classes
 * @returns {Element} Avatar element
 */
export function Avatar(options = {}) {
    const {
        src = null,
        alt = '',
        name = '',
        size = 'medium',
        shape = 'circle',
        status = null,
        className = '',
    } = options;
    
    // Generate initials from name
    const initials = name
        .split(' ')
        .slice(0, 2)
        .map(word => word.charAt(0).toUpperCase())
        .join('') || '?';
    
    // Choose background color based on name
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
        '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    ];
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const backgroundColor = colors[colorIndex];
    
    const classNames = [
        'avatar',
        `avatar--${size}`,
        `avatar--${shape}`,
        className,
    ].filter(Boolean).join(' ');
    
    const avatar = createElement('div', {
        className: classNames,
        'aria-label': name || 'User avatar',
    },
        // Image (if provided)
        src ? createElement('img', {
            className: 'avatar__image',
            src,
            alt: alt || name,
            onError: (e) => {
                // Hide image on error, show initials
                e.target.style.display = 'none';
                const initialsEl = e.target.parentElement.querySelector('.avatar__initials');
                if (initialsEl) initialsEl.style.display = 'flex';
            },
        }) : null,
        
        // Initials fallback
        createElement('span', {
            className: 'avatar__initials',
            style: { 
                backgroundColor,
                display: src ? 'none' : 'flex',
            },
        }, initials),
        
        // Status indicator
        status ? createElement('span', {
            className: `avatar__status avatar__status--${status}`,
        }) : null
    );
    
    return avatar;
}

/**
 * AvatarGroup - Group of overlapping avatars
 * 
 * @param {Array} avatars - Array of avatar options
 * @param {Object} options - Group options
 * @returns {Element} Avatar group element
 */
export function AvatarGroup(avatars = [], options = {}) {
    const { max = 4, size = 'small', className = '' } = options;
    
    const visibleAvatars = avatars.slice(0, max);
    const remaining = avatars.length - max;
    
    const group = createElement('div', { 
        className: `avatar-group ${className}`,
    },
        ...visibleAvatars.map(avatarOptions => 
            Avatar({ ...avatarOptions, size })
        ),
        remaining > 0 ? createElement('div', {
            className: `avatar avatar--${size} avatar--more`,
        }, `+${remaining}`) : null
    );
    
    return group;
}

export default Avatar;