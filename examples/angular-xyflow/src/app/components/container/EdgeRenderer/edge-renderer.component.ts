import { 
  Component, 
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '../../../types/node';
import { AngularEdge } from '../../types/edges';

/**
 * AngularEdgeRenderer 組件
 * 對應 React Flow 的 AngularEdgeRenderer 組件
 * 負責渲染和管理所有邊
 */
@Component({
  selector: 'angular-edge-renderer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg 
      class="xy-flow__edges"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; overflow: visible;"
    >
      @for (edge of visibleEdges(); track edge.id) {
        <g 
          class="xy-flow__edge selectable"
          [class.selected]="edge.selected"
          [class.animated]="edge.animated"
          [style.z-index]="getEdgeZIndex(edge)"
        >
          <!-- 交互層（提供更好的點擊體驗） -->
          <path
            class="xy-flow__edge-interaction"
            [attr.d]="edgePathsMap().get(edge.id)"
            fill="none"
            stroke="transparent"
            stroke-width="20"
            style="pointer-events: stroke; cursor: pointer; z-index: 1;"
            (click)="handleEdgeClick($event, edge)"
          />
          
          <!-- 實際顯示的邊線 -->
          <path
            class="xy-flow__edge-path"
            [attr.d]="edgePathsMap().get(edge.id)"
            fill="none"
            stroke="var(--xy-edge-stroke, #b1b1b7)"
            stroke-width="1"
            [class.animated]="edge.animated"
            style="pointer-events: none;"
          />
          
          <!-- 箭頭標記（如果需要） -->
          @if (shouldShowArrow(edge)) {
            <defs>
              <marker
                [id]="'arrowhead-' + edge.id"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="var(--xy-edge-stroke, #b1b1b7)"
                />
              </marker>
            </defs>
          }
        </g>
      }
    </svg>
  `,
  styles: [`
    :host {
      display: contents;
    }
    
    .xy-flow__edge-path.animated {
      stroke-dasharray: 5;
      animation: dashdraw 0.5s linear infinite;
    }
    
    @keyframes dashdraw {
      0% {
        stroke-dashoffset: 10;
      }
      100% {
        stroke-dashoffset: 0;
      }
    }
    
    .xy-flow__edge.selected .xy-flow__edge-path {
      stroke: var(--xy-edge-stroke-selected, #555);
    }
  `]
})
export class EdgeRendererComponent {
  // === 輸入屬性 ===
  
  // 核心數據 - 使用signals以支持響應式更新  
  public edges = input.required<AngularEdge[]>();
  public nodes = input.required<Node[]>();
  public viewport = input.required<{ x: number; y: number; zoom: number }>();
  public onlyRenderVisibleElements = input<boolean>(false);
  
  // === 事件輸出 ===
  
  public onEdgeClick = output<{ event: MouseEvent; edge: AngularEdge }>();
  public onEdgesChange = output<AngularEdge[]>();
  
  // === 計算屬性 ===
  
  // 只渲染可見的邊（優化性能）
  public visibleEdges = computed(() => {
    const allEdges = this.edges();
    console.log('🎯 EdgeRenderer: visibleEdges computed, edges count:', allEdges.length);
    
    if (!this.onlyRenderVisibleElements()) {
      return allEdges;
    }
    
    // 這裡可以實現基於視口的邊過濾邏輯
    // 暫時返回所有邊
    return allEdges;
  });
  
  // 🔥 CRITICAL FIX: Make edge paths reactive to node position changes
  // This computed property will automatically recalculate edge paths when nodes move
  public edgePathsMap = computed(() => {
    const edges = this.edges();
    const nodes = this.nodes();
    
    console.log('🎯 EdgeRenderer: edgePathsMap computed - recalculating edge paths due to node/edge changes');
    
    const pathsMap = new Map<string, string>();
    
    edges.forEach(edge => {
      const sourceNode = nodes.find((n: Node) => n.id === edge.source);
      const targetNode = nodes.find((n: Node) => n.id === edge.target);
      
      if (!sourceNode || !targetNode) {
        pathsMap.set(edge.id, '');
        return;
      }
      
      const sourcePosition = this.getNodeHandlePosition(sourceNode, 'source', edge.sourceHandle || undefined);
      const targetPosition = this.getNodeHandlePosition(targetNode, 'target', edge.targetHandle || undefined);
      
      const path = this.getBezierPath({
        sourceX: sourcePosition.x,
        sourceY: sourcePosition.y,
        sourcePosition: sourcePosition.position,
        targetX: targetPosition.x,
        targetY: targetPosition.y,
        targetPosition: targetPosition.position,
        curvature: 0.25
      });
      
      pathsMap.set(edge.id, path);
    });
    
    console.log('🎯 EdgeRenderer: edgePathsMap updated with', pathsMap.size, 'edge paths');
    return pathsMap;
  });
  
  // === 事件處理 ===
  
  protected handleEdgeClick(event: MouseEvent, edge: AngularEdge) {
    event.stopPropagation();
    
    // 切換邊的選擇狀態
    const edges = this.edges();
    const updatedEdges = edges.map((e: AngularEdge) => ({
      ...e,
      selected: e.id === edge.id ? !e.selected : false
    }));
    
    this.onEdgesChange.emit(updatedEdges);
    this.onEdgeClick.emit({ event, edge });
  }
  
  // === 路徑計算輔助方法 ===
  
  private getNodeHandlePosition(node: Node, handleType: 'source' | 'target', handleId?: string) {
    const nodeWidth = node.width || 150;
    const nodeHeight = node.height || 36;
    
    // 根據節點類型和手柄類型計算位置
    if (handleType === 'source') {
      // 源手柄通常在底部
      return {
        x: node.position.x + nodeWidth / 2,
        y: node.position.y + nodeHeight,
        position: 'bottom'
      };
    } else {
      // 目標手柄通常在頂部
      return {
        x: node.position.x + nodeWidth / 2,
        y: node.position.y,
        position: 'top'
      };
    }
  }
  
  private getBezierPath(params: {
    sourceX: number;
    sourceY: number;
    sourcePosition: string;
    targetX: number;
    targetY: number;
    targetPosition: string;
    curvature?: number;
  }): string {
    const {
      sourceX, sourceY, sourcePosition,
      targetX, targetY, targetPosition,
      curvature = 0.25
    } = params;
    
    const distance = Math.sqrt((targetX - sourceX) ** 2 + (targetY - sourceY) ** 2);
    const controlOffset = distance * curvature;
    
    let sourceControlX = sourceX;
    let sourceControlY = sourceY;
    let targetControlX = targetX;
    let targetControlY = targetY;
    
    // 根據手柄位置計算控制點
    switch (sourcePosition) {
      case 'right':
        sourceControlX = sourceX + controlOffset;
        break;
      case 'left':
        sourceControlX = sourceX - controlOffset;
        break;
      case 'bottom':
        sourceControlY = sourceY + controlOffset;
        break;
      case 'top':
        sourceControlY = sourceY - controlOffset;
        break;
    }
    
    switch (targetPosition) {
      case 'left':
        targetControlX = targetX - controlOffset;
        break;
      case 'right':
        targetControlX = targetX + controlOffset;
        break;
      case 'top':
        targetControlY = targetY - controlOffset;
        break;
      case 'bottom':
        targetControlY = targetY + controlOffset;
        break;
    }
    
    return `M ${sourceX} ${sourceY} C ${sourceControlX} ${sourceControlY}, ${targetControlX} ${targetControlY}, ${targetX} ${targetY}`;
  }
  
  protected getEdgeZIndex(edge: AngularEdge): number {
    const baseZIndex = 1; // 降低邊的 z-index，讓 handle 可以在上面
    const selectedZIndex = edge.selected ? 2 : 0;
    return baseZIndex + selectedZIndex;
  }
  
  protected shouldShowArrow(edge: AngularEdge): boolean {
    // 根據邊的類型決定是否顯示箭頭
    return edge.type !== 'straight' && edge.markerEnd !== undefined;
  }
}