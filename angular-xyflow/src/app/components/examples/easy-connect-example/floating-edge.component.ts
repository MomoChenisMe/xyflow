import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { getStraightPath } from '@xyflow/system';
import { AngularNode } from '../../angular-xyflow/types';
import { getEdgeParams } from './utils';

@Component({
  selector: 'svg:svg[app-floating-edge]',
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
  id = input.required<string>();
  source = input.required<string>();
  target = input.required<string>();
  markerEnd = input<string>();
  markerStart = input<string>();
  style = input<any>();
  sourceX = input<number>();
  sourceY = input<number>();
  targetX = input<number>();
  targetY = input<number>();
  sourcePosition = input<any>();
  targetPosition = input<any>();
  data = input<any>();
  interactionWidth = input<number>();
  type = input<string>();
  selected = input<boolean>(false);
  sourceHandleId = input<string>();
  targetHandleId = input<string>();
  animated = input<boolean>(false);
  hidden = input<boolean>(false);
  deletable = input<boolean>();
  selectable = input<boolean>();
  label = input<string>();
  labelStyle = input<any>();
  labelShowBg = input<boolean>();
  labelBgStyle = input<any>();
  labelBgPadding = input<any>();
  labelBgBorderRadius = input<number>();
  pathOptions = input<any>();
  
  // 新增：直接接收節點數據作為輸入，避免注入服務
  sourceNode = input<any>();
  targetNode = input<any>();

  // 簡化的路徑數據計算 - 使用輸入的節點數據
  pathData = computed(() => {
    const source = this.sourceNode();
    const target = this.targetNode();

    if (!source || !target) {
      return '';
    }

    // 創建與 React Flow InternalNode 相同的數據結構
    const sourceNodeData = {
      internals: {
        positionAbsolute: source.positionAbsolute || source.position,
      },
      measured: source.measured || { width: 100, height: 40 },
    };

    const targetNodeData = {
      internals: {
        positionAbsolute: target.positionAbsolute || target.position,
      },
      measured: target.measured || { width: 100, height: 40 },
    };

    const { sx, sy, tx, ty } = getEdgeParams(
      sourceNodeData,
      targetNodeData
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

  // 計算邊緣樣式 - 處理 selected 狀態
  edgeStyle = computed(() => {
    const baseStyle = this.style() || {};
    const isSelected = this.selected();
    
    // 默認樣式（與其他邊組件一致）
    const defaultStyle: Record<string, any> = {
      stroke: '#b1b1b7',
      strokeWidth: '1',
    };
    
    // 選中狀態的樣式
    if (isSelected) {
      defaultStyle['stroke'] = '#555'; // 與其他邊組件一致
      // 不設置 strokeWidth: 2，與 React 版本保持一致
    }
    
    // 合併樣式
    const finalStyle = { ...defaultStyle, ...baseStyle };

    // 轉換為 CSS 字串
    return Object.entries(finalStyle)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ');
  });

  // 計算 marker URL（用於箭頭）
  markerEndUrl = computed(() => {
    const marker = this.markerEnd();
    // EdgeWrapperComponent 已經將 marker 格式化為 url(#id) 格式
    // 直接返回，不需要再次包裝
    return marker;
  });

  markerStartUrl = computed(() => {
    const marker = this.markerStart();
    // EdgeWrapperComponent 已經將 marker 格式化為 url(#id) 格式
    // 直接返回，不需要再次包裝
    return marker;
  });
}
