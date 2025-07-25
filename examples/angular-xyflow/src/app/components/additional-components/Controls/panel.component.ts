import { Component, input, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelPosition } from './controls.types';

@Component({
  selector: 'xy-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      [class]="panelClass()"
      [ngStyle]="panelStyle()"
      [attr.data-testid]="testId()"
      [attr.aria-label]="ariaLabel()"
    >
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .xy-flow__panel {
      position: absolute;
      z-index: 5;
      margin: 15px;
      
      &.top {
        top: 0;
      }
      
      &.bottom {
        bottom: 0;
      }
      
      &.left {
        left: 0;
      }
      
      &.right {
        right: 0;
      }
      
      &.center {
        left: 50%;
        transform: translateX(-50%);
      }
    }
  `]
})
export class Panel {
  className = input<string>();
  position = input<PanelPosition>(PanelPosition.BottomLeft);
  style = input<{ [key: string]: any }>();
  testId = input<string>();
  ariaLabel = input<string>();

  panelClass = computed(() => {
    const classes = ['xy-flow__panel'];
    
    // Add position classes
    const position = this.position();
    switch (position) {
      case PanelPosition.TopLeft:
        classes.push('top', 'left');
        break;
      case PanelPosition.TopCenter:
        classes.push('top', 'center');
        break;
      case PanelPosition.TopRight:
        classes.push('top', 'right');
        break;
      case PanelPosition.BottomLeft:
        classes.push('bottom', 'left');
        break;
      case PanelPosition.BottomCenter:
        classes.push('bottom', 'center');
        break;
      case PanelPosition.BottomRight:
        classes.push('bottom', 'right');
        break;
    }
    
    const className = this.className();
    if (className) {
      classes.push(className);
    }
    
    return classes.join(' ');
  });

  panelStyle = computed(() => {
    return {
      ...this.style()
    };
  });
}