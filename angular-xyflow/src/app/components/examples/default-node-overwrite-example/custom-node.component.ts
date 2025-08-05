import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position } from '@xyflow/system';
import { HandleComponent } from '../../angular-xyflow/handle/handle.component';

@Component({
  selector: 'app-custom-node',
  standalone: true,
  imports: [CommonModule, HandleComponent],
  template: `
    <div class="custom-node-wrapper">
      <!-- Target Handle (頂部) -->
      <angular-xyflow-handle
        type="target"
        [position]="Position.Top"
        [nodeId]="id()"
        [isConnectable]="isConnectable()"
      />
      
      <!-- 自定義節點內容 -->
      <div class="custom-node-content">
        <div class="custom-node-icon">🎯</div>
        <div class="custom-node-label">
          {{ data()['label'] || 'Custom Node' }}
        </div>
        <div class="custom-node-status" [class.active]="selected()">
          {{ selected() ? 'Selected' : 'Not Selected' }}
        </div>
      </div>
      
      <!-- Source Handle (底部) -->
      <angular-xyflow-handle
        type="source"
        [position]="Position.Bottom"
        [nodeId]="id()"
        [isConnectable]="isConnectable()"
      />
    </div>
  `,
  styles: [`
    :host {
      display: contents; /* 讓宿主元素不影響佈局，子元素直接參與父容器的佈局 */
    }
    
    .custom-node-wrapper {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      border: 2px solid #fff;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .custom-node-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 12px;
      color: white;
    }
    
    .custom-node-icon {
      font-size: 24px;
      margin-bottom: 4px;
    }
    
    .custom-node-label {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 4px;
      text-align: center;
    }
    
    .custom-node-status {
      font-size: 10px;
      opacity: 0.8;
      padding: 2px 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }
    
    .custom-node-status.active {
      background: rgba(76, 175, 80, 0.5);
    }
  `]
})
export class CustomNodeComponent {
  // 節點屬性
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