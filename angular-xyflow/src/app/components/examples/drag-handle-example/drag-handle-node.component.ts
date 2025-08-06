import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position } from '@xyflow/system';
import { HandleComponent } from '../../angular-xyflow/handle/handle.component';

@Component({
  selector: 'app-drag-handle-node',
  standalone: true,
  imports: [CommonModule, HandleComponent],
  template: `
    <!-- Target handle (左側) -->
    <angular-xyflow-handle
      type="target"
      [position]="Position.Left"
      [nodeId]="id()"
      [isConnectable]="isConnectable()"
    />

    <!-- 節點內容 -->
    <div class="label-container">
      Only draggable here → 
      <span class="custom-drag-handle"></span>
    </div>

    <!-- Source handle (右側) -->
    <angular-xyflow-handle
      type="source"
      [position]="Position.Right"
      [nodeId]="id()"
      [isConnectable]="isConnectable()"
    />
  `,
  styles: [`
    :host {
      /* 移除 display: contents，改用 block 讓宿主元素正常參與 DOM */
      display: block;
      width: 100%;
      height: 100%;
    }
    
    .label-container {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0 10px;
    }

    .custom-drag-handle {
      display: inline-block;
      width: 25px;
      height: 25px;
      background-color: teal;
      margin-left: 5px;
      border-radius: 50%;
      cursor: grab;
    }

    .custom-drag-handle:active {
      cursor: grabbing;
    }
  `]
})
export class DragHandleNodeComponent {
  // 節點屬性
  readonly id = input.required<string>();
  readonly data = input<Record<string, unknown>>({});
  readonly type = input<string>();
  readonly selected = input<boolean>(false);
  readonly dragging = input<boolean>(false);
  readonly isConnectable = input<boolean>(true);
  readonly sourcePosition = input<Position>(Position.Right);
  readonly targetPosition = input<Position>(Position.Left);
  readonly width = input<number>();
  readonly height = input<number>();
  readonly parentId = input<string>();
  readonly zIndex = input<number>(0);
  readonly draggable = input<boolean>(true);
  readonly selectable = input<boolean>(true);
  readonly deletable = input<boolean>(true);
  readonly positionAbsoluteX = input<number>(0);
  readonly positionAbsoluteY = input<number>(0);
  readonly dragHandle = input<string>();
  
  // Position 枚舉供模板使用
  protected readonly Position = Position;
}