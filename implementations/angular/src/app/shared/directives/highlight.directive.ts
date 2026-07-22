/**
 * Highlight Directive - Angular
 * 
 * DIRECTIVES in Angular:
 * - Instructions that modify DOM elements
 * - Three types:
 *   1. Component directives (with template)
 *   2. Structural directives (*ngIf, *ngFor, @if, @for)
 *   3. Attribute directives (modify appearance/behavior)
 * 
 * ATTRIBUTE vs STRUCTURAL directives:
 * - Attribute: Change appearance/behavior of existing element
 *   → [highlight], [ngClass], [ngStyle]
 *   → Applied as attributes: <div appHighlight>
 * 
 * - Structural: Add/remove/modify DOM elements
 *   → *ngIf, *ngFor, @if, @for
 *   → Applied with asterisk: <div *ngIf="show">
 * 
 * HOST element:
 * - The element the directive is applied to
 * - @HostBinding binds host element properties
 * - @HostListener listens to host element events
 */
import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true,
})
export class HighlightDirective {
  @Input() appHighlight = '';
  
  private defaultColor = '#fffde7';

  constructor(private el: ElementRef) {}

  // WHY @HostListener?
  // Listens to DOM events on the host element
  // Cleaner than addEventListener in constructor
  // Automatic cleanup on destroy

  @HostListener('mouseenter') onMouseEnter() {
    this.highlight(this.appHighlight || this.defaultColor);
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.highlight('');
  }

  private highlight(color: string) {
    this.el.nativeElement.style.backgroundColor = color;
  }
}

/**
 * USAGE:
 * <tr appHighlight>Normal yellow highlight</tr>
 * <tr [appHighlight]="'#e3f2fd'">Custom blue highlight</tr>
 */
