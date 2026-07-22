/**
 * LitElement Shared Styles
 * 
 * CSS SHARED STYLES in LitElement:
 * - Use css`` tagged template literal
 * - Import and apply to multiple components
 * - Shared via export or CSSStyleSheet
 * 
 * WHY share styles?
 * - Consistent design system
 * - Single source of truth for colors, spacing
 * - Easier theming
 * - Reduced CSS bundle size
 * 
 * CSS CUSTOM PROPERTIES (CSS Variables):
 * - Define in :root for global theming
 * - Override per component or per instance
 * - Inherit naturally through DOM
 * - Work across Shadow DOM boundaries
 */
import { css } from 'lit';

export const sharedStyles = css`
  :host {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --primary-color: #1a73e8;
    --primary-hover: #1557b0;
    --secondary-color: #5f6368;
    --success-color: #34a853;
    --error-color: #ea4335;
    --warning-color: #fbbc04;
    --background: #f8f9fa;
    --surface: #ffffff;
    --text-primary: #202124;
    --text-secondary: #5f6368;
    --border-color: #dadce0;
    --shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
    --shadow-hover: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
    --radius: 8px;
    --transition: all 0.2s ease-in-out;
  }

  button {
    cursor: pointer;
    border: none;
    border-radius: var(--radius);
    font-size: 16px;
    font-weight: 500;
    padding: 12px 24px;
    transition: var(--transition);
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--primary-color);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--primary-hover);
    box-shadow: var(--shadow);
  }

  .btn-secondary {
    background: var(--surface);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--background);
  }

  .loading-spinner {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 60px;
    color: var(--text-secondary);
    font-size: 18px;
  }

  .empty-state {
    text-align: center;
    padding: 40px;
    color: var(--text-secondary);
    background: var(--surface);
    border-radius: var(--radius);
  }
`;
