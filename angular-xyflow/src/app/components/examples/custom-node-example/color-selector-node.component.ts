import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position } from '@xyflow/system';
import { HandleComponent } from '../../angular-xyflow/components/handle/handle.component';

// 自定義節點數據類型
export interface ColorSelectorNodeData extends Record<string, unknown> {
  color: string;
  onChange: (event: Event) => void;
}

@Component({
  selector: 'app-color-selector-node',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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

    <!-- 節點內容 - 與 React 版本保持一致的簡潔結構 -->
    <div>
      Custom Color Picker Node: <strong>{{ getColor() }}</strong>
    </div>
    <input
      class="nodrag"
      type="color"
      [value]="getColor()"
      (input)="handleColorChange($event)"
    />

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
      display: block;
      position: relative;
      /* 與 React 版本的 .react-flow__node-selectorNode 樣式保持一致 */
      font-size: 12px;
      background: #f0f2f3;
      border: 1px solid #555;
      border-radius: 5px;
      text-align: center;
      padding: 10px;
    }

    /* 確保 handle 的邊框色與節點背景一致 */
    :host ::ng-deep angular-xyflow-handle {
      border-color: #f0f2f3;
    }

    /* nodrag 類防止拖拽時移動節點 */
    .nodrag {
      pointer-events: auto;
    }
  `]
})
export class ColorSelectorNodeComponent {
  // 節點屬性
  id = input.required<string>();
  data = input<ColorSelectorNodeData | Record<string, unknown>>({});
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