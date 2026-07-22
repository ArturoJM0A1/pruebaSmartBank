/**
 * Root Component - Angular
 * 
 * COMPONENT LIFECYCLE:
 * - constructor: DI injection, initialization
 * - ngOnInit: Component initialized, inputs available
 * - ngOnChanges: Input properties changed
 * - ngAfterViewInit: Template rendered, children available
 * - ngOnDestroy: Cleanup (unsubscribe, remove event listeners)
 * 
 * DECORATORS in Angular:
 * - @Component: Defines component metadata
 * - @Injectable: Marks class as injectable service
 * - @Input: Declares component input property
 * - @Output: Declares component output event
 * - @ViewChild: Queries child component/element
 * 
 * ANGULAR vs React/Vue template approach:
 * - Angular uses its own template syntax (not HTML)
 * - *ngIf, *ngFor, [property], (event), [(ngModel)]
 * - Standalone: @if, @for (Angular 17+)
 */
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="app">
      <!--
        RouterOutlet is like React's <Outlet> or Vue's <RouterView>
        It renders the matched route's component
      -->
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .app {
      min-height: 100vh;
    }
  `],
})
export class AppComponent {
  constructor(public auth: AuthService) {}
}
