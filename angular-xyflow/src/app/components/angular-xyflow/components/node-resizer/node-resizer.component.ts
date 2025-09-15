// Angular 核心模組
import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// XyFlow 系統模組
import { Position } from '@xyflow/system';

// 專案內部模組
import { NodeResizeControlComponent, ResizeControlVariant } from './node-resize-control.component';
import type { NodeChange } from '../../types';

/**
 * NodeResizer 組件
 * 提供節點調整大小功能，使用獨立的 NodeResizeControl 組件架構
 * 模擬 React Flow NodeResizer 的行為模式
 */
@Component({
  selector: 'angular-xyflow-node-resizer',
  standalone: true,
  imports: [CommonModule, NodeResizeControlComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'angular-xyflow__node-resizer-host',
    '[style.position]': '"absolute"',
    '[style.inset]': '"-1px"', // 修正：等同於 top/left/right/bottom: -1px，與React Flow一致
    '[style.pointer-events]': '"none"',
  },
  template: `
    @if (isVisible() || selected()) {
      <!-- 調整線 (Lines) -->
      @for (position of linePositions; track position) {
        <angular-xyflow-node-resize-control
          [nodeId]="nodeId()"
          [position]="position"
          [variant]="ResizeControlVariant.Line"
          [minWidth]="minWidth()"
          [maxWidth]="maxWidth()"
          [minHeight]="minHeight()"
          [maxHeight]="maxHeight()"
          [keepAspectRatio]="keepAspectRatio()"
          [shouldResize]="shouldResize()"
          [color]="color()"
          [style]="lineStyle()"
          [handleClassName]="lineClassName()"
          [autoScale]="autoScale()"
          (nodeChange)="onNodeChange($event)"
          (resizeStart)="resizeStart.emit($event)"
          (resize)="resize.emit($event)"
          (resizeEnd)="resizeEnd.emit($event)"
        />
      }
      
      <!-- 調整手柄 (Handles) -->
      @for (position of handlePositions; track position) {
        <angular-xyflow-node-resize-control
          [nodeId]="nodeId()"
          [position]="position"
          [variant]="ResizeControlVariant.Handle"
          [minWidth]="minWidth()"
          [maxWidth]="maxWidth()"
          [minHeight]="minHeight()"
          [maxHeight]="maxHeight()"
          [keepAspectRatio]="keepAspectRatio()"
          [shouldResize]="shouldResize()"
          [color]="color()"
          [style]="handleStyle()"
          [handleClassName]="handleClassName()"
          [autoScale]="autoScale()"
          (nodeChange)="onNodeChange($event)"
          (resizeStart)="resizeStart.emit($event)"
          (resize)="resize.emit($event)"
          (resizeEnd)="resizeEnd.emit($event)"
        />
      }
    }
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class NodeResizerComponent {
  // 輸入屬性
  nodeId = input.required<string>();
  minWidth = input<number>(10);
  maxWidth = input<number>(Number.MAX_VALUE);
  minHeight = input<number>(10);
  maxHeight = input<number>(Number.MAX_VALUE);
  isVisible = input<boolean>(false);
  selected = input<boolean>(false);
  keepAspectRatio = input<boolean>(false);
  shouldResize = input<((event: any, params: any) => boolean) | undefined>(undefined);
  color = input<string>('');
  handleClassName = input<string>('');
  handleStyle = input<Record<string, any>>({});
  lineClassName = input<string>('');
  lineStyle = input<Record<string, any>>({});
  autoScale = input<boolean>(true); // 新增：自動縮放功能，默認啟用
  
  // 輸出事件
  nodeChange = output<NodeChange>();
  resizeStart = output<any>();
  resize = output<any>();
  resizeEnd = output<any>();
  
  // 內部屬性 - 控制位置定義（與 React Flow 預設行為一致）
  protected linePositions = ['top', 'right', 'bottom', 'left'];
  protected handlePositions = [
    'top-left', 'top-right',
    'bottom-left', 'bottom-right'
  ];
  
  // 公開枚舉給模板使用
  Position = Position;
  ResizeControlVariant = ResizeControlVariant;
  
  // 處理子組件的 nodeChange 事件
  onNodeChange(change: NodeChange): void {
    // 透傳給父組件處理（受控模式）
    this.nodeChange.emit(change);
  }
}