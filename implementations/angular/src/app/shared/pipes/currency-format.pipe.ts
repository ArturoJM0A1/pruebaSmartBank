/**
 * Currency Format Pipe - Angular
 * 
 * PIPES in Angular:
 * - Transform displayed values in templates
 * - Like React's functions called in JSX: {formatCurrency(amount)}
 * - Or Vue's filters (deprecated): {{ amount | currency }}
 * - Angular pipes: {{ amount | currencyFormat }}
 * 
 * PURE vs IMPURE pipes:
 * - Pure (default): Recalculates only when input changes
 *   → Better performance
 *   → No side effects allowed
 * 
 * - Impure: Recalculates on every change detection cycle
 *   → Use when pipe depends on external state
 *   → Can cause performance issues
 *   → Mark with { pure: false }
 * 
 * This pipe is PURE (default) - it only transforms the input
 */
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFormat',
  standalone: true,
})
export class CurrencyFormatPipe implements PipeTransform {
  /**
   * WHY standalone: true?
   * - No need to declare in NgModule
   * - Can be imported directly where needed
   * - Better tree-shaking
   */
  transform(value: number, currency: string = 'USD'): string {
    if (value === null || value === undefined) {
      return '$0.00';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value);
  }
}
