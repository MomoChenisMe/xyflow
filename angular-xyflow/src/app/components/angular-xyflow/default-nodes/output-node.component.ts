import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position } from '@xyflow/system';
import { HandleComponent } from '../handle/handle.component';
// NodeProps 類型定義在 types.ts 中，但在 Angular 元件中我們使用 input() signals

@Component({
  selector: 'angular-xyflow-output-node',
  standalone: true,
  imports: [CommonModule, HandleComponent],
  template: `
    <!-- Target Handle (頂部) - Output 節點只有 target handle -->
    <angular-xyflow-handle
      type="target"
      [position]="targetPosition()"
      [nodeId]="id()"
      [isConnectable]="isConnectable()"
    />
    
    <!-- 節點內容 - 直接輸出文字，與 React 保持一致 -->
    {{ data()?.['label'] }}
  `,
  styles: [`
    :host {
      display: contents; /* 讓宿主元素不影響佈局，子元素直接參與父容器的佈局 */
    }
  `]
})
export class OutputNodeComponent {
  // 節點屬性 - 與 React Flow NodeProps 對應
  readonly id = input.required<string>();
  readonly data = input<Record<string, unknown>>({});
  readonly type = input<string>();
  readonly selected = input<boolean>(false);
  readonly dragging = input<boolean>(false);
  readonly isConnectable = input<boolean>(true);
  readonly sourcePosition = input<Position>(Position.Bottom);
  readonly targetPosition = input<Position>(Position.Top);
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