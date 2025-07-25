import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlButtonProps } from './controls.types';

/**
 * You can add buttons to the control panel by using the `<xy-control-button />` component
 * and pass it as a child to the [`<xy-controls />`] component.
 *
 * @public
 * @example
 *```typescript
 *@Component({
 *  template: `
 *    <xy-flow [nodes]="nodes" [edges]="edges">
 *      <xy-controls>
 *        <xy-control-button (click)="doSomethingMagical()">
 *          <magic-wand-icon></magic-wand-icon>
 *        </xy-control-button>
 *      </xy-controls>
 *    </xy-flow>
 *  `
 *})
 *export class FlowComponent {
 *  doSomethingMagical() {
 *    alert('Something magical just happened. ✨');
 *  }
 *}
 *```
 */
@Component({
  selector: 'xy-control-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button 
      [type]="type()"
      [class]="buttonClass()"
      [disabled]="disabled()"
      [title]="title()"
      [attr.aria-label]="ariaLabel()"
      (click)="handleClick()"
    >
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    button {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 26px;
      width: 26px;
      padding: 4px;
      border: none;
      cursor: pointer;
      user-select: none;
      border-bottom: 1px solid #eee;
      
      &:last-child {
        border-bottom: none;
      }
      
      &:hover {
        background: var(
          --xy-controls-button-background-color-hover-props,
          var(--xy-controls-button-background-color-hover, var(--xy-controls-button-background-color-hover-default))
        );
      }
      
      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }
  `]
})
export class ControlButton {
  className = input<string>();
  disabled = input<boolean>(false);
  title = input<string>();
  ariaLabel = input<string>();
  type = input<'button' | 'submit' | 'reset'>('button');
  
  onClick = output<void>();

  buttonClass = computed(() => {
    const classes = ['react-flow__controls-button'];
    const className = this.className();
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  });

  handleClick(): void {
    if (!this.disabled()) {
      this.onClick.emit();
    }
  }
}