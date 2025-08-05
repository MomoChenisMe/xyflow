import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position } from '@xyflow/system';
import { HandleComponent } from '../../angular-xyflow/handle/handle.component';

// 自定義節點數據類型
export interface ColorSelectorNodeData extends Record<string, unknown> {
  color: string;
  onChange: (event: Event) => void;
}

@Component({
  selector: 'app-color-selector-node',
  standalone: true,
  imports: [CommonModule, HandleComponent],
  template: `
    <!-- Target handle (左側) -->
    <angular-xyflow-handle
      type="target"
      [position]="Position.Left"
      [nodeId]="id()"
      [isConnectable]="isConnectable()"
      [style]="{ background: '#555' }"
    />

    <!-- 節點內容 -->
    <div class="color-selector-content">
      <div>
        Custom Color Picker Node:
        <strong>{{ getColor() }}</strong>
      </div>
      <input
        class="nodrag color-picker"
        type="color"
        [value]="getColor()"
        (input)="handleColorChange($event)"
      />
    </div>

    <!-- Source handles (右側) -->
    <angular-xyflow-handle
      type="source"
      [position]="Position.Right"
      [nodeId]="id()"
      [handleId]="'a'"
      [isConnectable]="isConnectable()"
      [style]="{ background: '#555', top: '10px' }"
    />
    <angular-xyflow-handle
      type="source"
      [position]="Position.Right"
      [nodeId]="id()"
      [handleId]="'b'"
      [isConnectable]="isConnectable()"
      [style]="{ background: '#555', bottom: '10px', top: 'auto' }"
    />
  `,
  styles: [`
    :host {
      display: contents; /* 讓宿主元素不影響佈局，子元素直接參與父容器的佈局 */
    }
    
    .color-selector-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      width: auto;
      font-size: 12px;
      text-align: center;
    }

    .color-picker {
      width: 50px;
      height: 25px;
      border: 1px solid #ccc;
      border-radius: 3px;
      cursor: pointer;
      flex-shrink: 0;
    }

    /* nodrag 類防止拖拽時移動節點 */
    .nodrag {
      pointer-events: auto;
    }
  `]
})
export class ColorSelectorNodeComponent {
  // 節點屬性
  readonly id = input.required<string>();
  readonly data = input<ColorSelectorNodeData | Record<string, unknown>>({});
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

  // 獲取顏色值
  getColor(): string {
    const nodeData = this.data() as ColorSelectorNodeData;
    return nodeData?.color || '#1A192B';
  }

  // 處理顏色變更
  handleColorChange(event: Event): void {
    const nodeData = this.data() as ColorSelectorNodeData;
    if (nodeData?.onChange) {
      nodeData.onChange(event);
    }
  }
}