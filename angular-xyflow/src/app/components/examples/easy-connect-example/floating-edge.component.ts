import {
  Component,
  input,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { getStraightPath } from '@xyflow/system';
import { AngularXYFlowService } from '../../angular-xyflow/services/angular-xyflow.service';
import { AngularNode } from '../../angular-xyflow/types';
import { getEdgeParams } from './utils';

@Component({
  selector: '[app-floating-edge]',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg:g class="react-flow__connection">
      <!-- 主要邊緣路徑 - 匹配 React Flow 結構 -->
      <svg:path
        [attr.id]="id()"
        class="react-flow__edge-path"
        [attr.d]="pathData()"
        [attr.marker-start]="markerStartUrl()"
        [attr.marker-end]="markerEndUrl()"
        [attr.style]="edgeStyle()"
        fill="none"
      />
      <!-- 交互路徑（透明，用於擴大點擊區域） -->
      <svg:path
        [attr.d]="pathData()"
        stroke="transparent"
        [attr.stroke-width]="interactionWidth() || 20"
        fill="none"
        style="pointer-events: stroke; cursor: pointer;"
      />
    </svg:g>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingEdgeComponent {
  // 使用 Angular 20+ Signal-based inputs
  readonly id = input.required<string>();
  readonly source = input.required<string>();
  readonly target = input.required<string>();
  readonly markerEnd = input<string>();
  readonly markerStart = input<string>();
  readonly style = input<any>();
  readonly sourceX = input<number>();
  readonly sourceY = input<number>();
  readonly targetX = input<number>();
  readonly targetY = input<number>();
  readonly sourcePosition = input<any>();
  readonly targetPosition = input<any>();
  readonly data = input<any>();
  readonly interactionWidth = input<number>();
  readonly type = input<string>();
  readonly selected = input<boolean>(false);
  readonly sourceHandleId = input<string>();
  readonly targetHandleId = input<string>();
  readonly animated = input<boolean>(false);
  readonly hidden = input<boolean>(false);
  readonly deletable = input<boolean>();
  readonly selectable = input<boolean>();
  readonly label = input<string>();
  readonly labelStyle = input<any>();
  readonly labelShowBg = input<boolean>();
  readonly labelBgStyle = input<any>();
  readonly labelBgPadding = input<any>();
  readonly labelBgBorderRadius = input<number>();
  readonly pathOptions = input<any>();

  // 注入服務
  private readonly xyflowService = inject(AngularXYFlowService);

  // 計算路徑數據 - 完全匹配 React Flow FloatingEdge 實現
  readonly pathData = computed(() => {
    // 使用 try-catch 處理 required input 的初始化問題
    let sourceId: string;
    let targetId: string;

    try {
      sourceId = this.source();
      targetId = this.target();
    } catch {
      // 如果 required inputs 還未準備好，返回空路徑
      return '';
    }

    if (!sourceId || !targetId) {
      return '';
    }

    // 從 service 獲取節點內部狀態（包含正確的 positionAbsolute 和 measured）
    const sourceInternals = this.xyflowService.getNodeInternals(sourceId);
    const targetInternals = this.xyflowService.getNodeInternals(targetId);

    if (!sourceInternals || !targetInternals) {
      return '';
    }

    // 創建與 React Flow InternalNode 相同的數據結構
    const sourceNode = {
      internals: {
        positionAbsolute: sourceInternals.positionAbsolute,
      },
      measured: sourceInternals.measured,
    };

    const targetNode = {
      internals: {
        positionAbsolute: targetInternals.positionAbsolute,
      },
      measured: targetInternals.measured,
    };

    const { sx, sy, tx, ty } = getEdgeParams(
      sourceNode,
      targetNode
    );

    // 使用與 React Flow 完全相同的 getStraightPath 調用
    const [path] = getStraightPath({
      sourceX: sx,
      sourceY: sy,
      targetX: tx,
      targetY: ty,
    });

    return path;
  });

  // 計算邊緣樣式 - 直接傳遞樣式，不處理 selected 狀態
  readonly edgeStyle = computed(() => {
    const baseStyle = this.style() || {};
    
    // 轉換為 CSS 字串
    return Object.entries(baseStyle)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ');
  });

  // 計算 marker URL（用於箭頭）
  readonly markerEndUrl = computed(() => {
    const marker = this.markerEnd();
    // 如果有 markerEnd，返回 URL 格式
    // markerEnd 通常是 marker 的 ID
    return marker ? `url(#${marker})` : undefined;
  });

  readonly markerStartUrl = computed(() => {
    const marker = this.markerStart();
    return marker ? `url(#${marker})` : undefined;
  });
}
