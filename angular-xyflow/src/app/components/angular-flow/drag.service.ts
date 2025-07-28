import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { XYDrag, type XYDragInstance } from '@xyflow/system';
import { AngularFlowService } from './angular-flow.service';

interface DragConfig {
  nodeId?: string;
  domNode: HTMLElement;
  noDragClassName?: string;
  handleSelector?: string;
  isSelectable?: boolean;
  nodeClickDistance?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AngularFlowDragService implements OnDestroy {
  private xyDragInstances = new Map<string, XYDragInstance>();
  private readonly _dragging = signal(false);

  // 公開拖拽狀態
  readonly dragging = computed(() => this._dragging());

  constructor(private flowService: AngularFlowService) {}

  // 初始化拖拽功能
  initializeDrag(config: DragConfig): void {
    const { nodeId, domNode } = config;
    if (!nodeId) return;

    console.log('🚀 initializeDrag called for:', nodeId, { domNode, config });

    // 清理該節點的現有實例
    if (this.xyDragInstances.has(nodeId)) {
      console.log('🧹 Destroying existing instance for:', nodeId);
      this.xyDragInstances.get(nodeId)?.destroy();
    }

    // 創建新的 XYDrag 實例
    const xyDragInstance = XYDrag({
      getStoreItems: () => this.getStoreItems(),
      onNodeMouseDown: (id: string) => {
        console.log('🎯 XYDrag onNodeMouseDown called:', id);
        // 處理節點選擇邏輯
        this.handleNodeClick(id);
      },
      onDragStart: () => {
        console.log('🎯 Drag start for node:', nodeId);
        this._dragging.set(true);
      },
      onDragStop: () => {
        console.log('🎯 Drag stop for node:', nodeId);
        this._dragging.set(false);
      },
      onDrag: (event, dragItems, node, nodes) => {
        console.log('🔧 Drag update for node:', nodeId, { node, nodes });
      }
    });

    console.log('✅ XYDrag instance created for:', nodeId);

    // 更新拖拽配置 - noDragClassName 屬於 update 方法參數
    xyDragInstance.update({
      ...config,
      noDragClassName: 'non-draggable'
    });

    console.log('✅ XYDrag instance updated with config for:', nodeId);
    
    // 儲存實例
    this.xyDragInstances.set(nodeId, xyDragInstance);
    console.log('✅ XYDrag instance stored for:', nodeId);
  }

  // 更新拖拽配置
  updateDrag(nodeId: string, config: Partial<DragConfig>): void {
    const instance = this.xyDragInstances.get(nodeId);
    if (instance) {
      // 轉換 config 到正確的 DragUpdateParams 格式
      const updateParams = {
        domNode: config.domNode!,
        noDragClassName: config.noDragClassName,
        handleSelector: config.handleSelector,
        isSelectable: config.isSelectable,
        nodeId: config.nodeId,
        nodeClickDistance: config.nodeClickDistance
      };
      instance.update(updateParams);
    }
  }

  // 清理特定節點的拖拽實例
  destroyNodeDrag(nodeId: string): void {
    const instance = this.xyDragInstances.get(nodeId);
    if (instance) {
      instance.destroy();
      this.xyDragInstances.delete(nodeId);
    }
  }

  // 清理所有拖拽實例
  destroy(): void {
    for (const [nodeId, instance] of this.xyDragInstances) {
      instance.destroy();
    }
    this.xyDragInstances.clear();
    this._dragging.set(false);
  }

  // 獲取 XYDrag 需要的存儲數據
  private getStoreItems() {
    const nodes = this.flowService.nodes();
    const edges = this.flowService.edges();
    const viewport = this.flowService.viewport();

    // 創建 nodeLookup Map
    const nodeLookup = new Map();
    nodes.forEach(node => {
      nodeLookup.set(node.id, {
        ...node,
        measured: { width: node.width || 150, height: node.height || 40 },
        internals: {
          positionAbsolute: { x: node.position.x, y: node.position.y }
        }
      });
    });

    // 嘗試獲取流程容器作為 domNode
    const flowContainer = document.querySelector('.xy-flow');

    return {
      nodes,
      nodeLookup,
      edges,
      nodeExtent: [[-Infinity, -Infinity], [Infinity, Infinity]] as [[number, number], [number, number]],
      snapGrid: [15, 15] as [number, number],
      snapToGrid: false,
      nodeOrigin: [0, 0] as [number, number],
      multiSelectionActive: false,
      domNode: flowContainer,
      transform: [viewport.x, viewport.y, viewport.zoom] as [number, number, number],
      autoPanOnNodeDrag: true,
      nodesDraggable: this.flowService.nodesDraggable(),
      selectNodesOnDrag: true,
      nodeDragThreshold: 0,
      panBy: async (delta: { x: number; y: number }) => {
        const currentViewport = this.flowService.viewport();
        const flowInstance = this.flowService.getFlowInstance();
        flowInstance.setViewport({
          x: currentViewport.x + delta.x,
          y: currentViewport.y + delta.y,
          zoom: currentViewport.zoom
        });
        return true;
      },
      unselectNodesAndEdges: () => {
        // 實現取消選擇邏輯
        console.log('Unselect nodes and edges');
      },
      onError: (error: string) => {
        console.error('XYDrag error:', error);
      },
      onNodeDragStart: (event: MouseEvent, node: any, nodes: any[]) => {
        console.log('onNodeDragStart', node);
      },
      onNodeDrag: (event: MouseEvent, node: any, nodes: any[]) => {
        console.log('onNodeDrag', node);
      },
      onNodeDragStop: (event: MouseEvent, node: any, nodes: any[]) => {
        console.log('onNodeDragStop', node);
      },
      updateNodePositions: (dragItems: Map<string, any>, dragging?: boolean) => {
        // 更新節點位置
        const flowInstance = this.flowService.getFlowInstance();
        for (const [nodeId, dragItem] of dragItems) {
          flowInstance.updateNode(nodeId, {
            position: dragItem.position,
            dragging: dragging || false
          });
        }
      },
      autoPanSpeed: 15
    };
  }

  // 處理節點點擊 - 對應 XYDrag 的 onNodeMouseDown 回調
  private handleNodeClick(nodeId: string): void {
    console.log('🔍 handleNodeClick called for:', nodeId);
    
    const node = this.flowService.nodeLookup().get(nodeId);

    if (!node) {
      console.error('❌ Node not found:', nodeId);
      return;
    }

    console.log('🔍 Node data:', { id: nodeId, selected: node.selected });

    const isSelectable = this.flowService.elementsSelectable();
    console.log('🔍 Is selectable:', isSelectable);

    // 根據 React Flow 實際邏輯：
    // XYDrag 的 onNodeMouseDown 回調總是會嘗試選中節點，無論 selectNodesOnDrag 設置如何
    // 這個函數對應 React 版本的 handleNodeClick，會無條件選中未選中的節點
    if (isSelectable) {
      if (!node.selected) {
        console.log('✅ Selecting node on mousedown:', nodeId);
        this.flowService.selectNode(nodeId, false);
      } else {
        console.log('ℹ️ Node already selected:', nodeId);
      }
      // 如果節點已經選中，不需要做任何事情（冪等性）
    } else {
      console.log('❌ Node not selectable');
    }
  }

  // 設置特定節點的拖動狀態
  setNodeDraggable(nodeId: string, draggable: boolean): void {
    const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
    const instance = this.xyDragInstances.get(nodeId);

    if (nodeElement && instance) {
      if (draggable) {
        nodeElement.classList.remove('non-draggable');
      } else {
        nodeElement.classList.add('non-draggable');
      }

      // 更新拖拽實例的 noDragClassName
      instance.update({
        domNode: nodeElement,
        noDragClassName: 'non-draggable',
        nodeId: nodeId,
        isSelectable: true,
        nodeClickDistance: 0
      });

      console.log('🔧 節點拖動狀態已更新', { nodeId, draggable });
    }
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}
