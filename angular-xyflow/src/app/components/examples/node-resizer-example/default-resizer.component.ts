// Angular 核心模組
import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// XyFlow 系統模組
import { Position } from '@xyflow/system';

// 專案內部模組
import { HandleComponent, NodeResizerComponent } from '../../angular-xyflow';
import type { NodeChange } from '../../angular-xyflow/types';

@Component({
  selector: 'app-default-resizer',
  standalone: true,
  imports: [CommonModule, HandleComponent, NodeResizerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <angular-xyflow-node-resizer
      [nodeId]="id()"
      [minWidth]="data().minWidth ?? 10"
      [maxWidth]="data().maxWidth ?? Number.MAX_VALUE"
      [minHeight]="data().minHeight ?? 10"
      [maxHeight]="data().maxHeight ?? Number.MAX_VALUE"
      [isVisible]="data().isVisible ?? selected()"
      [selected]="selected()"
      [keepAspectRatio]="data().keepAspectRatio ?? false"
      [shouldResize]="data().shouldResize"
      (nodeChange)="nodeChange()?.($event)"
      (resizeStart)="data().onResizeStart?.($event)"
      (resize)="data().onResize?.($event)"
      (resizeEnd)="data().onResizeEnd?.($event)"
    />

    <angular-xyflow-handle
      type="target"
      [position]="Position.Left"
      [nodeId]="id()"
    />

    <div>{{ data().label }}</div>

    <angular-xyflow-handle
      type="source"
      [position]="Position.Right"
      [nodeId]="id()"
    />
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
      /* 修正：移除 border、shadow，添加完整尺寸，與React Flow一致 */
      width: 100%;
      height: 100%;
      font-size: 10px;
    }
  `],
})
export class DefaultResizerComponent {
  // 節點基本屬性 - NodeWrapper 會傳遞這些屬性
  id = input.required<string>();
  data = input<any>({});
  selected = input<boolean>(false);
  dragging = input<boolean>(false);

  // NodeWrapper 傳遞的完整節點屬性（用於動態組件渲染）
  type = input<string>();
  isConnectable = input<boolean>(true);
  sourcePosition = input<Position>();
  targetPosition = input<Position>();
  width = input<number>();
  height = input<number>();
  parentId = input<string>();
  zIndex = input<number>(0);
  draggable = input<boolean>(true);
  selectable = input<boolean>(true);
  deletable = input<boolean>(true);
  positionAbsoluteX = input<number>(0);
  positionAbsoluteY = input<number>(0);
  dragHandle = input<string>();

  // NodeWrapper 傳遞的事件處理函數
  nodeChange = input<(change: NodeChange) => void>();

  // 公開 Position 枚舉給模板使用
  Position = Position;

  // 公開 Number 給模板使用
  Number = Number;
}
