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
  
  // 臨時狀態覆寫，用於處理同步更新問題
  private tempSelectedNodeIds: string[] | null = null;

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

    // 捕獲 nodeId 用於後續的回調函式
    const currentNodeId = nodeId;

    // 創建新的 XYDrag 實例
    const xyDragInstance = XYDrag({
      getStoreItems: () => this.getStoreItems(currentNodeId),
      onNodeMouseDown: (id: string) => {
        console.log('🎯 XYDrag onNodeMouseDown called:', id);
        // 處理節點選擇邏輯
        this.handleNodeClick(id);
      },
      onDragStart: () => {
        console.log('🎯 Drag start for node:', nodeId, 'from XYDrag instance');
        this._dragging.set(true);
        
        // 在拖拽開始時記錄當前狀態
        const currentState = this.getStoreItems(currentNodeId);
        console.log('🎯 Drag start - nodeLookup selected states:');
        currentState.nodeLookup.forEach((node: any, id: string) => {
          console.log(`  Node ${id}: selected = ${node.selected}`);
        });
        
        // 檢查有多少個 XYDrag 實例
        console.log('🎯 Total XYDrag instances:', this.xyDragInstances.size);
        console.log('🎯 XYDrag instance keys:', Array.from(this.xyDragInstances.keys()));
      },
      onDragStop: () => {
        console.log('🎯 Drag stop for node:', nodeId);
        this._dragging.set(false);
        // 清除任何剩餘的臨時狀態
        this.tempSelectedNodeIds = null;
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
  private getStoreItems(currentNodeId?: string) {
    const nodes = this.flowService.nodes();
    const edges = this.flowService.edges();
    const viewport = this.flowService.viewport();

    // console.log('🗂️ getStoreItems called, current nodes:', nodes.map(n => ({ id: n.id, selected: n.selected })));

    // 創建 nodeLookup Map，確保選中狀態的絕對一致性
    // 使用臨時覆寫狀態（如果存在）或服務中的狀態
    const selectedNodeIds = this.tempSelectedNodeIds !== null 
      ? this.tempSelectedNodeIds 
      : this.flowService.selectedNodes();
    const nodeLookup = new Map();
    nodes.forEach(node => {
      const isSelected = selectedNodeIds.includes(node.id);
      nodeLookup.set(node.id, {
        ...node,
        // 強制使用選中狀態，確保一致性
        selected: isSelected,
        measured: { width: node.width || 150, height: node.height || 40 },
        internals: {
          positionAbsolute: { x: node.position.x, y: node.position.y }
        }
      });
      console.log(`🗂️ Node ${node.id}: selected = ${isSelected} (from selectedNodeIds: ${selectedNodeIds})`);
    });

    console.log('🗂️ Force-synchronized selected nodes:', selectedNodeIds, 
                'tempOverride:', this.tempSelectedNodeIds !== null);

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
      selectNodesOnDrag: this.flowService.selectNodesOnDrag(),
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
        // 實現取消選擇邏輯 - 對應React Flow的行為
        console.log('🧹 unselectNodesAndEdges called');
        
        // 立即設置臨時覆寫狀態為空數組，確保 getDragItems 看到正確的狀態
        this.tempSelectedNodeIds = [];
        console.log('🧹 tempSelectedNodeIds set to []');
        
        // 異步更新服務狀態
        this.flowService.clearSelection();
        
        // 不要立即清除臨時狀態，讓它在整個拖拽操作期間保持
        // 它會在 onDragStop 中被清除
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
        console.log('📍 updateNodePositions called with dragItems:', Array.from(dragItems.keys()), 'dragging:', dragging);
        console.log('📍 dragItems details:', Array.from(dragItems.entries()).map(([id, item]) => ({
          id,
          position: item.position
        })));
        
        // 當 selectNodesOnDrag=false 時，只更新實際被拖拽的節點
        const selectNodesOnDrag = this.flowService.selectNodesOnDrag();
        
        console.log('📍 updateNodePositions logic check:', {
          selectNodesOnDrag,
          draggedNodeId: currentNodeId, // 使用捕獲的 currentNodeId
          condition: !selectNodesOnDrag && currentNodeId
        });
        
        if (!selectNodesOnDrag && currentNodeId) {
          // 只更新當前被拖拽的節點
          const dragItem = dragItems.get(currentNodeId);
          if (dragItem) {
            console.log('📍 [selectNodesOnDrag=false] Only updating dragged node:', currentNodeId);
            const flowInstance = this.flowService.getFlowInstance();
            flowInstance.updateNode(currentNodeId, {
              position: dragItem.position,
              dragging: dragging || false
            });
          }
        } else {
          // 正常更新所有拖拽項目
          const flowInstance = this.flowService.getFlowInstance();
          for (const [nodeId, dragItem] of dragItems) {
            console.log('📍 Updating position for node:', nodeId, 'to:', dragItem.position);
            flowInstance.updateNode(nodeId, {
              position: dragItem.position,
              dragging: dragging || false
            });
          }
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

    if (isSelectable) {
      const multiSelectionActive = false; // 目前不支持多選
      
      if (!node.selected && !multiSelectionActive) {
        console.log('🧹 Force clearing other selected nodes before selecting:', nodeId);
        
        // 強制同步更新：直接修改服務中的節點狀態
        // 這確保 getDragItems 能立即看到更新後的狀態
        const currentNodes = this.flowService.nodes();
        const updatedNodes = currentNodes.map(n => ({
          ...n,
          selected: n.id === nodeId
        }));
        
        // 使用私有方法強制立即更新（如果可用）
        // 或者使用一個同步的更新方法
        this.flowService.selectNode(nodeId, false);
        
        // 為了確保立即生效，我們還需要手動觸發一次狀態檢查
        console.log('✅ Node selected on mousedown (forced sync):', nodeId);
        
        // 驗證更新是否生效
        setTimeout(() => {
          const updatedNode = this.flowService.nodeLookup().get(nodeId);
          console.log('🔍 Verification - Node after update:', { id: nodeId, selected: updatedNode?.selected });
        }, 0);
        
      } else if (node.selected) {
        console.log('ℹ️ Node already selected:', nodeId);
      }
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
