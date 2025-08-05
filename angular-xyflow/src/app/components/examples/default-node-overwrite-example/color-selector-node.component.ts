import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position } from '@xyflow/system';
import { HandleComponent } from '../../angular-xyflow/handle/handle.component';

@Component({
  selector: 'app-color-selector-node',
  standalone: true,
  imports: [CommonModule, HandleComponent],
  template: `
    <!-- Target Handle (左側) -->
    <angular-xyflow-handle
      type="target"
      [position]="Position.Left"
      [nodeId]="id()"
      [isConnectable]="isConnectable()"
    />
    
    <!-- 節點內容 -->
    <div class="color-selector-content">
      <div class="color-selector-label">
        Color Picker: <strong>{{ data()['color'] || '#ff6b6b' }}</strong>
      </div>
      <input 
        class="color-picker nodrag"
        type="color" 
        [value]="data()['color'] || '#ff6b6b'"
        (change)="onColorChange($event)"
      />
    </div>
    
    <!-- Source Handles (右側) - 兩個輸出 -->
    <angular-xyflow-handle
      type="source"
      [position]="Position.Right"
      [nodeId]="id()"
      [handleId]="'a'"
      [isConnectable]="isConnectable()"
      [style]="{ top: '25%' }"
    />
    <angular-xyflow-handle
      type="source"
      [position]="Position.Right"
      [nodeId]="id()"
      [handleId]="'b'"
      [isConnectable]="isConnectable()"
      [style]="{ top: '75%' }"
    />
  `,
  styles: [`
    :host {
      display: block;
      width: 180px;
      height: auto;
      position: relative;
      background: #f0f2f3;
      border: 1px solid #555;
      border-radius: 5px;
      padding: 10px;
      text-align: center;
    }
    
    .color-selector-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    
    .color-selector-label {
      font-size: 12px;
      margin-bottom: 5px;
    }
    
    .color-picker {
      width: 50px;
      height: 25px;
      border: 1px solid #ccc;
      border-radius: 3px;
      cursor: pointer;
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

  onColorChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const nodeData = this.data();
    
    // 調用節點數據中的 onChange 函數（如果存在）
    if (nodeData && typeof nodeData['onChange'] === 'function') {
      nodeData['onChange'](event);
    }
  }
}