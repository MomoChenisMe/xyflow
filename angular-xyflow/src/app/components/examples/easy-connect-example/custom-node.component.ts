import {
  Component,
  input,
  inject,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HandleComponent } from '../../angular-xyflow/components/handle/handle.component';
import { Position } from '@xyflow/system';
import { AngularXYFlowService } from '../../angular-xyflow/services/angular-xyflow.service';

@Component({
  selector: 'app-custom-node',
  standalone: true,
  imports: [CommonModule, HandleComponent],
  template: `
    <div class="customNode">
      <div
        class="customNodeBody"
        [style.borderStyle]="isTarget() ? 'dashed' : 'solid'"
        [style.backgroundColor]="isTarget() ? '#ffcce3' : '#ccd9f6'"
      >
        <!--
          如果 handles 是條件渲染且初始不存在，需要使用 updateNodeInternals
          https://reactflow.dev/docs/api/hooks/use-update-node-internals/
          在這個例子中，我們不需要使用 updateNodeInternals，
          因為 !connection.inProgress 初始是 true，所有 handles 初始都會渲染
        -->

        <!-- Target handle: 左側，用於接收連接 -->
        @if (!connectionStateSignal().inProgress || isTarget()) {
        <angular-xyflow-handle
          class="customHandle"
          [nodeId]="id()"
          [handleId]="'target'"
          [position]="Position.Left"
          type="target"
        />
        }
        
        <!-- Source handle: 右側，用於發起連接 -->
        @if (!connectionStateSignal().inProgress) {
        <angular-xyflow-handle
          class="customHandle"
          [nodeId]="id()"
          [handleId]="'source'"
          [position]="Position.Right"
          type="source"
        />
        }

        {{ label() }}
      </div>
    </div>
  `,
  styleUrls: ['./easy-connect-example.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomNodeComponent {
  // 使用 Angular 20+ 的 input() API - 包含所有必要的節點屬性
  id = input.required<string>();
  type = input<string>();
  data = input<Record<string, unknown>>({});
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

  Position = Position;

  private xyflowService = inject(AngularXYFlowService);

  // 獲取當前連線狀態 - 直接使用 readonly signal 避免額外計算層
  connectionStateSignal = this.xyflowService.connectionState;

  // 計算是否為目標節點 - 添加更嚴格的檢查避免不必要的重計算
  isTarget = computed(() => {
    const conn = this.connectionStateSignal();
    if (!conn.inProgress) return false;
    const fromNodeId = conn.fromNode?.id;
    const currentId = this.id();
    return fromNodeId !== currentId;
  });

  // 根據狀態顯示不同標籤 - 使用靜態字串避免創建新對象
  label = computed(() => {
    return this.isTarget() ? 'Drop here' : 'Drag to connect';
  });
}
