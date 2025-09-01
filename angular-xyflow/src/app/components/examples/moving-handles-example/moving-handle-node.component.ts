import {
  Component,
  computed,
  inject,
  input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// XYFlow 組件
import { HandleComponent } from '../../angular-xyflow/components/handle/handle.component';
import { AngularXYFlowService } from '../../angular-xyflow/services/angular-xyflow.service';

// XYFlow 類型
import { Position } from '@xyflow/system';

@Component({
  selector: 'moving-handle-node',
  standalone: true,
  imports: [CommonModule, HandleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (id()) {
    <!-- 左側 Target Handles 容器 -->
    <div [ngStyle]="leftHandlesContainerStyle">
      <angular-xyflow-handle
        type="target"
        handleId="a"
        [position]="Position.Left"
        [nodeId]="id()"
        [hostStyle]="targetHandleHostStyle()"
        [style]="targetHandleStyle()"
      />
      <angular-xyflow-handle
        type="target"
        handleId="b"
        [position]="Position.Left"
        [nodeId]="id()"
        [hostStyle]="targetHandleHostStyle()"
        [style]="targetHandleStyle()"
      />
    </div>

    <!-- 節點主體內容 -->
    <div [ngStyle]="nodeContentStyle">
      <div>moving handles</div>
      <!-- 兩個 source handle，與 React 版本一致 -->
      <angular-xyflow-handle
        type="source"
        handleId="source-1"
        [position]="Position.Right"
        [nodeId]="id()"
      />
      <angular-xyflow-handle
        type="source"
        handleId="source-2"
        [position]="Position.Right"
        [nodeId]="id()"
      />
    </div>
    }
  `,
  styles: [`
    :host {
      position: relative;
      display: block;
    }
  `],
})
export class MovingHandleNodeComponent {
  // 將 Position 暴露給模板使用
  readonly Position = Position;

  // 節點輸入屬性 - 從 node wrapper 傳入（完整屬性列表）
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

  // 注入流服務
  private _flowService = inject(AngularXYFlowService);

  // 響應式連接狀態
  connectionInProgress = computed(() =>
    this._flowService.connectionInProgress()
  );

  // 動態 Target Handle 宿主元素樣式 - 應用在 angular-xyflow-handle 元素上
  targetHandleHostStyle = computed(() => ({
    position: 'relative',
    transform: this.connectionInProgress()
      ? 'translate(-20px, 0)'
      : 'translate(-50%, 0)',
    top: 0,
    transition: 'transform 0.5s', // 與 React 版本一致，使用默認 ease
  }));
  
  // Target Handle 內部 div 樣式 - 空對象，因為所有樣式都在宿主元素上
  targetHandleStyle = computed(() => ({}));

  // 左側 Handles 容器樣式（與 React 版本完全一致）
  leftHandlesContainerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0, // 使用 top: 0, bottom: 0 替代 height: 100% 來確保正確的高度計算
    justifyContent: 'space-around'
  };

  // 節點主體內容樣式（與 React 版本精確一致）
  nodeContentStyle = {
    background: '#f4f4f4',
    padding: '10px', // 與 React 版本一致的數字格式
    position: 'relative', // 確保 handle 定位正確
    display: 'block', // 確保塊級元素行為
  };
}
