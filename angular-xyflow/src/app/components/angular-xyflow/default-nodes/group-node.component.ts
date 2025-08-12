import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position } from '@xyflow/system';
// NodeProps 類型定義在 types.ts 中，但在 Angular 元件中我們使用 input() signals

@Component({
  selector: 'angular-xyflow-group-node',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="angular-xyflow__group-node">
      <div class="angular-xyflow__group-node-title">
        {{ data()['label'] || 'Group' }}
      </div>
      <div class="angular-xyflow__group-node-content">
        <!-- Group 節點用於包含其他節點 -->
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents; /* 讓宿主元素不影響佈局，子元素直接參與父容器的佈局 */
    }
    
    /* Group 節點需要自己的樣式，但不應干擾 Handle 定位 */
    .angular-xyflow__group-node {
      width: 100%;
      height: 100%;
      background: rgba(240, 240, 240, 0.5);
      border: 1px dashed #999;
      border-radius: 5px;
      display: flex;
      flex-direction: column;
    }
    
    .angular-xyflow__group-node-title {
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.8);
      border-bottom: 1px solid #e0e0e0;
      font-weight: 500;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #666;
    }
    
    .angular-xyflow__group-node-content {
      flex: 1;
      padding: 10px;
    }
  `]
})
export class GroupNodeComponent {
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