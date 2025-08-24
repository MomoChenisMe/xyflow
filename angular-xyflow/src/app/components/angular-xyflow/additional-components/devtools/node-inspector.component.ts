import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularNode } from '../../types';
import { AngularXYFlowService } from '../../services/angular-xyflow.service';
import { ViewportPortalComponent } from '../../components/viewport-portal/viewport-portal.component';

@Component({
  selector: 'angular-xyflow-node-inspector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ViewportPortalComponent],
  template: `
    <!-- 🔑 關鍵修正：在 NodeInspector 內部使用 ViewportPortal -->
    <angular-xyflow-viewport-portal>
      <div class="angular-xyflow__devtools-nodeinspector">
        @for (nodePos of nodePositions(); track nodePos.node.id) {
          <div
              class="angular-xyflow__devtools-nodeinfo"
              [style.position]="'absolute'"
              [style.transform]="getTransform(nodePos)"
              [style.width.px]="getInfoWidth(nodePos)"
              [style.z-index]="nodePos.zIndex"
            >
              <div>id: {{ nodePos.node.id }}</div>
              <div>type: {{ nodePos.node.type || 'default' }}</div>
              <div>
                position: {{ nodePos.x.toFixed(1) }}, {{ nodePos.y.toFixed(1) }}
              </div>
              <div>
                dimensions: {{ nodePos.width }} × {{ nodePos.height }}
              </div>
              <div>data: {{ formatData(nodePos.node.data) }}</div>
            </div>
        }
      </div>
    </angular-xyflow-viewport-portal>
  `,
  styles: [`
    .angular-xyflow__devtools-nodeinspector {
      pointer-events: none;
      font-family: monospace, sans-serif;
      font-size: 10px;
    }

    .angular-xyflow__devtools-nodeinfo {
      top: 5px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #ccc;
      padding: 5px;
      border-radius: 3px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .angular-xyflow__devtools-nodeinfo div {
      margin-bottom: 2px;
    }

    .angular-xyflow__devtools-nodeinfo div:last-child {
      margin-bottom: 0;
    }
  `],
})
export class NodeInspectorComponent {
  // 注入服務 - 簡化設計，直接使用 flow 服務的節點資料
  private _flowService = inject(AngularXYFlowService);

  // 直接使用 flow 服務的節點 Signal - 與 React 版本的 useNodes() 對應
  nodes = computed(() => this._flowService.nodes());

  // 計算節點的位置資訊，對應 React 版本的邏輯
  // 過濾掉隱藏的節點，與其他組件（如 MiniMap）保持一致
  nodePositions = computed(() => {
    const nodes = this.nodes();
    const selectedNodeIds = this._flowService.selectedNodes();
    const elevateOnSelect = this._flowService.elevateNodesOnSelect();
    
    // 只顯示非隱藏節點的 Inspector 信息
    return nodes
      .filter(node => !node.hidden)
      .map((node, index) => {
        // 使用原始 flow 座標，讓 ViewportPortal 自動處理變換
        const x = node.position.x || 0;
        const y = node.position.y || 0;
        const width = node.measured?.width || node.width || 150;
        const height = node.measured?.height || node.height || 40;
        
        // 🔑 關鍵修正：實現四層級體系
        // 1. 計算節點的實際 z-index（包含選中狀態的提升）
        const nodeZIndex = this._flowService.calculateNodeZIndex(node, index, selectedNodeIds, elevateOnSelect);
        // 2. Inspector 的 z-index 永遠比對應節點高 1
        const inspectorZIndex = nodeZIndex + 1;
        
        return {
          node,
          x,
          y,
          width,
          height,
          zIndex: inspectorZIndex
        };
      });
  });

  // 計算變換位置 - 與 React 版本保持一致
  getTransform(nodePos: any): string {
    const x = nodePos.x;
    const y = nodePos.y + nodePos.height; // 在節點下方顯示
    return `translate(${x}px, ${y}px)`;
  }

  // 計算資訊框寬度 - 對應 React 版本的寬度為節點寬度的兩倍
  getInfoWidth(nodePos: any): number {
    return nodePos.width * 2;
  }

  // 格式化資料顯示
  formatData(data: any): string {
    if (!data || typeof data !== 'object') {
      return String(data || '');
    }
    return JSON.stringify(data, null, 2);
  }
}