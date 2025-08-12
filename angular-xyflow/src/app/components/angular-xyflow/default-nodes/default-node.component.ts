import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position } from '@xyflow/system';
import { HandleComponent } from '../handle/handle.component';
// NodeProps 類型定義在 types.ts 中，但在 Angular 元件中我們使用 input() signals

@Component({
  selector: 'angular-xyflow-default-node',
  standalone: true,
  imports: [CommonModule, HandleComponent],
  template: `
    <!-- Target Handle (使用 targetPosition 屬性) -->
    <angular-xyflow-handle
      type="target"
      [position]="targetPosition()"
      [nodeId]="id()"
      [isConnectable]="isConnectable()"
    />
    
    <!-- 節點內容 - 直接輸出文字，與 React 保持一致 -->
    {{ data()['label'] || id() }}
    
    <!-- Source Handle (使用 sourcePosition 屬性) -->
    <angular-xyflow-handle
      type="source"
      [position]="sourcePosition()"
      [nodeId]="id()"
      [isConnectable]="isConnectable()"
    />
  `,
  styles: [`
    :host {
      display: contents; /* 讓宿主元素不影響佈局，子元素直接參與父容器的佈局 */
    }
  `]
})
export class DefaultNodeComponent {
  // 節點屬性 - 與 React Flow NodeProps 對應
  id = input.required<string>();
  data = input<Record<string, unknown>>({});
  type = input<string>();
  selected = input<boolean>(false);
  dragging = input<boolean>(false);
  isConnectable = input<boolean>(true);
  sourcePosition = input<Position>(Position.Bottom);
  targetPosition = input<Position>(Position.Top);
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