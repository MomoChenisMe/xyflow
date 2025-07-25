import {
  Component,
  input,
  ChangeDetectionStrategy,
  computed,
  NO_ERRORS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EdgeAnchorProps, Position } from '../edges.types';

/**
 * Position 位移計算函數
 */
const shiftX = (x: number, shift: number, position: Position): number => {
  if (position === Position.Left) return x - shift;
  if (position === Position.Right) return x + shift;
  return x;
};

const shiftY = (y: number, shift: number, position: Position): number => {
  if (position === Position.Top) return y - shift;
  if (position === Position.Bottom) return y + shift;
  return y;
};

/**
 * EdgeAnchor - Angular equivalent of React EdgeAnchor component
 * 
 * 邊緣錨點組件 - 提供邊緣重新連接功能的交互錨點
 * 這是一個隱形的圓形交互區域，用於邊緣的重新連接操作
 * 
 * @internal 這是一個內部組件，主要由 EdgeWrapper 使用
 */
@Component({
  selector: 'xy-edge-anchor',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <circle
      [attr.cx]="anchorX()"
      [attr.cy]="anchorY()"
      [attr.r]="radius()"
      [class]="anchorClasses()"
      [attr.stroke]="'transparent'"
      [attr.fill]="'transparent'"
      [attr.data-testid]="'rf__edge-anchor-' + type()"
      (mousedown)="onMouseDown() && onMouseDown()!($event)"
      (mouseenter)="onMouseEnter() && onMouseEnter()!($event)"
      (mouseout)="onMouseOut() && onMouseOut()!($event)">
    </circle>
  `,
  styles: [`
    :host {
      display: contents;
    }
    
    .react-flow__edgeupdater {
      cursor: grab;
      pointer-events: all;
    }
    
    .react-flow__edgeupdater:hover {
      stroke: #ff0071;
      stroke-width: 2;
    }
    
    .react-flow__edgeupdater-source {
      /* 源錨點特定樣式 */
    }
    
    .react-flow__edgeupdater-target {
      /* 目標錨點特定樣式 */
    }
  `]
})
export class EdgeAnchorComponent {
  position = input.required<Position>();
  centerX = input.required<number>();
  centerY = input.required<number>();
  radius = input<number>(10);
  type = input.required<'source' | 'target'>();
  onMouseDown = input<(event: MouseEvent) => void>();
  onMouseEnter = input<(event: MouseEvent) => void>();
  onMouseOut = input<(event: MouseEvent) => void>();

  private readonly EdgeUpdaterClassName = 'react-flow__edgeupdater';

  // 計算錨點位置
  anchorX = computed(() => {
    return shiftX(this.centerX(), this.radius(), this.position());
  });

  anchorY = computed(() => {
    return shiftY(this.centerY(), this.radius(), this.position());
  });

  // 計算 CSS 類名
  anchorClasses = computed(() => {
    const classes = [
      this.EdgeUpdaterClassName,
      `${this.EdgeUpdaterClassName}-${this.type()}`
    ];
    
    return classes.join(' ');
  });
}