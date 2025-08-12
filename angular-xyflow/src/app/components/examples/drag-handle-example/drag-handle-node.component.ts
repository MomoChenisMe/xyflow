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
  id = input.required<string>();
  data = input<Record<string, unknown>>({});
  type = input<string>();
  selected = input<boolean>(false);
  dragging = input<boolean>(false);
  isConnectable = input<boolean>(true);
  sourcePosition = input<Position>(Position.Right);
  targetPosition = input<Position>(Position.Left);
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
  
  // Position 枚舉供模板使用
  protected readonly Position = Position;
}