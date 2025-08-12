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
  selector: 'angular-xyflow-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div 
      [class]="panelClasses()"
      [ngStyle]="panelStyles()"
      (mousedown)="stopPropagation($event)"
      (touchstart)="stopPropagation($event)"
      (wheel)="stopPropagation($event)"
      (click)="stopPropagation($event)"
      (dblclick)="stopPropagation($event)"
      (contextmenu)="stopPropagation($event)"
    >
      <ng-content />
    </div>
  `,
  styles: [`
    .angular-xyflow__panel {
      position: absolute;
      z-index: 5;
      margin: 10px;
      pointer-events: auto;
    }

    .angular-xyflow__panel.position-top-left {
      top: 0;
      left: 0;
    }

    .angular-xyflow__panel.position-top-center {
      top: 0;
      left: 50%;
      transform: translateX(-50%);
    }

    .angular-xyflow__panel.position-top-right {
      top: 0;
      right: 0;
    }

    .angular-xyflow__panel.position-bottom-left {
      bottom: 0;
      left: 0;
    }

    .angular-xyflow__panel.position-bottom-center {
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
    }

    .angular-xyflow__panel.position-bottom-right {
      bottom: 0;
      right: 0;
    }
  `]
})
export class PanelComponent {
  // 輸入屬性
  position = input<PanelPosition>('top-left');
  className = input<string>('');
  style = input<Record<string, any>>({});
  
  // 計算屬性
  panelClasses = computed(() => {
    const classes = ['xy-flow__panel', 'angular-xyflow__panel', `position-${this.position()}`];
    
    const customClass = this.className();
    if (customClass) {
      classes.push(customClass);
    }
    
    return classes.join(' ');
  });
  
  panelStyles = computed(() => {
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
    
    // 合併自定義樣式
    const customStyle = this.style();
    return { ...styles, ...customStyle };
  });

  // 阻止事件冒泡，防止觸發 viewport 的拖曳、縮放等操作
  // 這確保用戶在 panel 中的操作（點擊按鈕、滾動等）不會意外影響 flow 的視口
  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}