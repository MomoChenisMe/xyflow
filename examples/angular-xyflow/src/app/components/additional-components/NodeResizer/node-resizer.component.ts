import { Component, ChangeDetectionStrategy, input, output, computed, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeResizeControl } from './node-resize-control.component';
import { NodeResizerProps, ResizeControlVariant, ControlPosition, ControlLinePosition } from './node-resizer.types';

// Constants matching @xyflow/system
const XY_RESIZER_LINE_POSITIONS: ControlLinePosition[] = [
  ControlLinePosition.Top,
  ControlLinePosition.Right,
  ControlLinePosition.Bottom,
  ControlLinePosition.Left
];

const XY_RESIZER_HANDLE_POSITIONS: ControlPosition[] = [
  ControlPosition.TopLeft,
  ControlPosition.Top,
  ControlPosition.TopRight,
  ControlPosition.Right,
  ControlPosition.BottomRight,
  ControlPosition.Bottom,
  ControlPosition.BottomLeft,
  ControlPosition.Left
];

/**
 * NodeResizer 組件 - 為節點添加縮放調整功能
 * 
 * 這個組件使用最新的 Angular Signal API 實現，在節點周圍渲染可拖拽的控制項，
 * 支持所有方向的縮放調整。提供最小/最大尺寸限制、保持縱橫比等功能。
 * 
 * @component
 * @selector xy-node-resizer
 * @example
 * ```html
 * <xy-node-resizer 
 *   [minWidth]="100" 
 *   [minHeight]="30"
 *   [keepAspectRatio]="true"
 *   [color]="'#ff6060'"
 *   (onResizeStart)="handleResizeStart($event)"
 *   (onResize)="handleResize($event)"
 *   (onResizeEnd)="handleResizeEnd($event)">
 * </xy-node-resizer>
 * <xy-handle type="target" [position]="Position.Left" />
 * <div [style]="{ padding: '10px' }">{{ data.label }}</div>
 * <xy-handle type="source" [position]="Position.Right" />
 * ```
 */
@Component({
  selector: 'xy-node-resizer',
  standalone: true,
  imports: [CommonModule, NodeResizeControl],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isVisible()) {
      <!-- Render line controls -->
      @for (position of linePositions; track position) {
        <xy-node-resize-control
          [nodeId]="nodeId()"
          [className]="lineClassName()"
          [style]="lineStyle()"
          [position]="position"
          [variant]="ResizeControlVariant.Line"
          [color]="color()"
          [minWidth]="minWidth()"
          [minHeight]="minHeight()"
          [maxWidth]="maxWidth()"
          [maxHeight]="maxHeight()"
          [onResizeStart]="onResizeStart()"
          [keepAspectRatio]="keepAspectRatio()"
          [autoScale]="autoScale()"
          [shouldResize]="shouldResize()"
          [onResize]="onResize()"
          [onResizeEnd]="onResizeEnd()"
        />
      }
      
      <!-- Render handle controls -->
      @for (position of handlePositions; track position) {
        <xy-node-resize-control
          [nodeId]="nodeId()"
          [className]="handleClassName()"
          [style]="handleStyle()"
          [position]="position"
          [variant]="ResizeControlVariant.Handle"
          [color]="color()"
          [minWidth]="minWidth()"
          [minHeight]="minHeight()"
          [maxWidth]="maxWidth()"
          [maxHeight]="maxHeight()"
          [onResizeStart]="onResizeStart()"
          [keepAspectRatio]="keepAspectRatio()"
          [autoScale]="autoScale()"
          [shouldResize]="shouldResize()"
          [onResize]="onResize()"
          [onResizeEnd]="onResizeEnd()"
        />
      }
    }
  `,
  styleUrls: ['./node-resizer.styles.css']
})
export class NodeResizer {
  /** 要調整大小的節點 ID（在自定義節點內使用時可選） */
  nodeId = input<string | undefined>();
  
  /** 縮放控制項顏色 */
  color = input<string | undefined>();
  
  /** 應用於控制項的 CSS 類名 */
  handleClassName = input<string | undefined>();
  
  /** 應用於控制項的樣式 */
  handleStyle = input<{ [key: string]: any } | undefined>();
  
  /** 應用於線條的 CSS 類名 */
  lineClassName = input<string | undefined>();
  
  /** 應用於線條的樣式 */
  lineStyle = input<{ [key: string]: any } | undefined>();
  
  /** 控制項是否可見 */
  isVisible = input<boolean>(true);
  
  /** 節點最小寬度 */
  minWidth = input<number>(10);
  
  /** 節點最小高度 */
  minHeight = input<number>(10);
  
  /** 節點最大寬度 */
  maxWidth = input<number>(Number.MAX_VALUE);
  
  /** 節點最大高度 */
  maxHeight = input<number>(Number.MAX_VALUE);
  
  /** 調整大小時保持縱橫比 */
  keepAspectRatio = input<boolean>(false);
  
  /** 根據縮放級別縮放控制項 */
  autoScale = input<boolean>(true);
  
  /** 判斷節點是否應該調整大小的回調函數 */
  shouldResize = input<((event: MouseEvent, params: any) => boolean) | undefined>();
  
  /** 調整大小開始時的回調函數 */
  onResizeStart = input<((event: MouseEvent, params: any) => void) | undefined>();
  
  /** 調整大小過程中的回調函數 */
  onResize = input<((event: MouseEvent, params: any) => void) | undefined>();
  
  /** 調整大小結束時的回調函數 */
  onResizeEnd = input<((event: MouseEvent, params: any) => void) | undefined>();

  /** 縮放調整開始事件 */
  onResizeStartEvent = output<{ event: MouseEvent; params: any }>();
  
  /** 縮放調整進行中事件 */
  onResizeEvent = output<{ event: MouseEvent; params: any }>();
  
  /** 縮放調整結束事件 */
  onResizeEndEvent = output<{ event: MouseEvent; params: any }>();

  /** 模板使用的常量 */
  readonly ResizeControlVariant = ResizeControlVariant;
  readonly linePositions = XY_RESIZER_LINE_POSITIONS;
  readonly handlePositions = XY_RESIZER_HANDLE_POSITIONS;
}