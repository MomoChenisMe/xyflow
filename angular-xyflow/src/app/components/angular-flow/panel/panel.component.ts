import { 
  Component, 
  input, 
  computed,
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type PanelPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right'
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right';

@Component({
  selector: 'angular-flow-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div 
      class="angular-flow__panel"
      [class]="panelClasses()"
      [style]="panelStyles()"
    >
      <ng-content />
    </div>
  `,
  styles: [`
    .angular-flow__panel {
      position: absolute;
      z-index: 5;
      margin: 10px;
    }

    .angular-flow__panel.position-top-left {
      top: 0;
      left: 0;
    }

    .angular-flow__panel.position-top-center {
      top: 0;
      left: 50%;
      transform: translateX(-50%);
    }

    .angular-flow__panel.position-top-right {
      top: 0;
      right: 0;
    }

    .angular-flow__panel.position-bottom-left {
      bottom: 0;
      left: 0;
    }

    .angular-flow__panel.position-bottom-center {
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
    }

    .angular-flow__panel.position-bottom-right {
      bottom: 0;
      right: 0;
    }
  `]
})
export class PanelComponent {
  // 輸入屬性
  readonly position = input<PanelPosition>('top-left');
  readonly className = input<string>('');
  
  // 計算屬性
  readonly panelClasses = computed(() => {
    const classes = ['angular-flow__panel', `position-${this.position()}`];
    
    const customClass = this.className();
    if (customClass) {
      classes.push(customClass);
    }
    
    return classes.join(' ');
  });
  
  readonly panelStyles = computed(() => {
    const styles: Record<string, string> = {
      position: 'absolute',
      'z-index': '5',
      margin: '10px'
    };
    
    const position = this.position();
    
    // 設置位置樣式
    switch (position) {
      case 'top-left':
        styles['top'] = '0';
        styles['left'] = '0';
        break;
      case 'top-center':
        styles['top'] = '0';
        styles['left'] = '50%';
        styles['transform'] = 'translateX(-50%)';
        break;
      case 'top-right':
        styles['top'] = '0';
        styles['right'] = '0';
        break;
      case 'bottom-left':
        styles['bottom'] = '0';
        styles['left'] = '0';
        break;
      case 'bottom-center':
        styles['bottom'] = '0';
        styles['left'] = '50%';
        styles['transform'] = 'translateX(-50%)';
        break;
      case 'bottom-right':
        styles['bottom'] = '0';
        styles['right'] = '0';
        break;
    }
    
    return styles;
  });
}