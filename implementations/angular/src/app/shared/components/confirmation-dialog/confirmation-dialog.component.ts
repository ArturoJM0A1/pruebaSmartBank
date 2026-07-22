/**
 * Confirmation Dialog - Angular Shared Component
 * 
 * @Input / @Output:
 * - @Input: Parent passes data to child (like props in React)
 * - @Output: Child emits events to parent (like callbacks in React)
 * 
 * CONTENT PROJECTION in Angular:
 * - <ng-content> projects child content into component
 * - Like React's {children} or Vue's <slot>
 * - Enables flexible component composition
 * 
 * ANGULAR vs React/Vue event patterns:
 * - React: props (callback functions)
 * - Vue: $emit('event', data)
 * - Angular: @Output() EventEmitter
 */
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="dialog-overlay" (click)="onCancel()">
        <div class="dialog-content" (click)="$event.stopPropagation()">
          <h2>{{ title }}</h2>
          <!--
            WHY $event.stopPropagation()?
            Prevents click from bubbling to overlay
            Without it, clicking content closes the dialog
          -->
          <p>{{ message }}</p>
          <div class="dialog-actions">
            <button class="btn-secondary" (click)="onCancel()">Cancel</button>
            <button class="btn-danger" (click)="onConfirm()">Confirm</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .dialog-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); display: flex;
      justify-content: center; align-items: center; z-index: 1000;
    }
    .dialog-content {
      background: white; border-radius: 12px; padding: 32px;
      max-width: 400px; width: 90%;
    }
    .dialog-content h2 { margin-bottom: 16px; }
    .dialog-content p { color: #5f6368; margin-bottom: 24px; }
    .dialog-actions { display: flex; gap: 12px; justify-content: flex-end; }
    .dialog-actions button {
      padding: 10px 20px; border: none; border-radius: 8px;
      font-weight: 500; cursor: pointer;
    }
    .btn-secondary { background: #f1f3f4; color: #202124; }
    .btn-danger { background: #ea4335; color: white; }
  `],
})
export class ConfirmationDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure?';
  
  // WHY EventEmitter for Output?
  // Creates an observable stream of events
  // Parent can subscribe to events with (event)="handler()"
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }
}
