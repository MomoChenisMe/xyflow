import { 
  Component, 
  input, 
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectionState } from '../../store/store-types';
import { 
  getBezierPath, 
  getSmoothStepPath, 
  getStraightPath,
  ConnectionLineType,
  type XYPosition,
  Position
} from '@xyflow/system';

/**
 * ConnectionLine 組件
 * 對應 React Flow 的 ConnectionLine 組件
 * 顯示正在進行的連接線
 */
@Component({
  selector: 'angular-connection-line',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (connectionState().inProgress) {
      <svg 
        class="xy-flow__connection-line"
        [style]="containerStyle()"
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1001; overflow: visible;"
      >
        <g class="xy-flow__connection">
          <path
            class="xy-flow__connection-path"
            [attr.d]="connectionPath()"
            fill="none"
            [style]="style()"
            stroke="var(--xy-connection-path-color, #b1b1b7)"
            stroke-width="1"
            stroke-dasharray="5,5"
            style="pointer-events: none;"
          />
        </g>
      </svg>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }
    
    .xy-flow__connection-path {
      animation: dashdraw 0.5s linear infinite;
    }
    
    @keyframes dashdraw {
      0% {
        stroke-dashoffset: 10;
      }
      100% {
        stroke-dashoffset: 0;
      }
    }
  `]
})
export class ConnectionLineComponent {
  // === 輸入屬性 ===
  
  public connectionState = input.required<ConnectionState>();
  public type = input<ConnectionLineType>(ConnectionLineType.Bezier);
  public style = input<any>({});
  public containerStyle = input<any>({});
  
  // === 計算連接路徑 ===
  
  public connectionPath = computed(() => {
    const connection = this.connectionState();
    
    if (!connection.inProgress || !connection.from || !connection.to) {
      return '';
    }
    
    const pathParams = {
      sourceX: connection.from.x,
      sourceY: connection.from.y,
      sourcePosition: connection.fromPosition as Position || Position.Bottom,
      targetX: connection.to.x,
      targetY: connection.to.y,
      targetPosition: connection.toPosition as Position || Position.Top
    };
    
    let path = '';
    
    switch (this.type()) {
      case ConnectionLineType.Bezier:
        [path] = getBezierPath(pathParams);
        break;
      case ConnectionLineType.SimpleBezier:
        [path] = getBezierPath(pathParams);
        break;
      case ConnectionLineType.Step:
        [path] = getSmoothStepPath({
          ...pathParams,
          borderRadius: 0
        });
        break;
      case ConnectionLineType.SmoothStep:
        [path] = getSmoothStepPath(pathParams);
        break;
      default:
        [path] = getStraightPath(pathParams);
    }
    
    return path;
  });
  
  // === 檢查是否正在連接 ===
  
  public isConnecting = computed(() => this.connectionState().inProgress);
}