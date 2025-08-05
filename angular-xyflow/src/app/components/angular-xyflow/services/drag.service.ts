// Angular 核心模組
import { Injectable, signal, computed, OnDestroy } from '@angular/core';

// XyFlow 系統模組
import { XYDrag, type XYDragInstance } from '@xyflow/system';

// 專案內部模組
import { AngularXYFlowService } from './angular-xyflow.service';

interface DragConfig {
  nodeId?: string;
  domNode: HTMLElement;
  noDragClassName?: string;
  handleSelector?: string;
  isSelectable?: boolean;
  nodeClickDistance?: number;
  onDragStart?: (event: MouseEvent, nodeId: string) => void;
  onDrag?: (event: MouseEvent, nodeId: string, position: { x: number; y: number }) => void;
  onDragStop?: (event: MouseEvent, nodeId: string) => void;
}

@Injectable()
export class AngularXYFlowDragService implements OnDestroy {
  private xyDragInstances = new Map<string, XYDragInstance>();
  private _dragging = signal(false);
  
  // 臨時狀態覆寫，用於處理同步更新問題
  private tempSelectedNodeIds: string[] | null = null;
  
  // 存儲節點拖曳回調
  private dragCallbacks = new Map<string, {
    onDragStart?: (event: MouseEvent, nodeId: string) => void;
    onDrag?: (event: MouseEvent, nodeId: string, position: { x: number; y: number }) => void;
    onDragStop?: (event: MouseEvent, nodeId: string) => void;
  }>();

  // 公開拖拽狀態
  readonly dragging = computed(() => this._dragging());

  constructor(private _flowService: AngularXYFlowService) {}

  // 初始化拖拽功能
  initializeDrag(config: DragConfig): void {
    const { nodeId } = config;
    if (!nodeId) return;

    // 存儲拖曳回調
    this.dragCallbacks.set(nodeId, {
      onDragStart: config.onDragStart,
      onDrag: config.onDrag,
      onDragStop: config.onDragStop,
    });

    // 清理該節點的現有實例
    if (this.xyDragInstances.has(nodeId)) {
      this.xyDragInstances.get(nodeId)?.destroy();
    }

    // 捕獲 nodeId 用於後續的回調函式
    const currentNodeId = nodeId;

    // 創建新的 XYDrag 實例
    const xyDragInstance = XYDrag({
      getStoreItems: () => this.getStoreItems(currentNodeId),
      onNodeMouseDown: (id: string) => {
        // 處理節點選擇邏輯
        this.handleNodeClick(id);
      },
      onDragStart: (event: MouseEvent) => {
        this._dragging.set(true);
        // 調用節點的 onDragStart 回調
        const callbacks = this.dragCallbacks.get(currentNodeId);
        if (callbacks?.onDragStart) {
          callbacks.onDragStart(event, currentNodeId);
        }
      },
      onDragStop: (event: MouseEvent) => {
        this._dragging.set(false);
        // 清除任何剩餘的臨時狀態
        this.tempSelectedNodeIds = null;
        // 調用節點的 onDragStop 回調
        const callbacks = this.dragCallbacks.get(currentNodeId);
        if (callbacks?.onDragStop) {
          callbacks.onDragStop(event, currentNodeId);
        }
      },
      onDrag: (event: MouseEvent, dragItems, _node, _nodes) => {
        // 調用節點的 onDrag 回調
        const callbacks = this.dragCallbacks.get(currentNodeId);
        if (callbacks?.onDrag) {
          // 從 dragItems 中獲取當前節點的最新位置
          const draggedNode = dragItems.get(currentNodeId);
          if (draggedNode) {
            callbacks.onDrag(event, currentNodeId, draggedNode.position);
          }
        }
      }
    });


    // 更新拖拽配置 - noDragClassName 屬於 update 方法參數
    xyDragInstance.update({
      ...config,
      noDragClassName: 'non-draggable'
    });

    
    // 儲存實例
    this.xyDragInstances.set(nodeId, xyDragInstance);
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
    // 清理回調
    this.dragCallbacks.delete(nodeId);
  }

  // 清理所有拖拽實例
  destroy(): void {
    for (const [, instance] of this.xyDragInstances) {
      instance.destroy();
    }
    this.xyDragInstances.clear();
    this.dragCallbacks.clear();
    this._dragging.set(false);
  }

  // 獲取 XYDrag 需要的存儲數據
  private getStoreItems(currentNodeId?: string) {
    const nodes = this._flowService.nodes();
    const edges = this._flowService.edges();
    const viewport = this._flowService.viewport();

    // 創建 nodeLookup Map，使用統一位置計算系統
    // 使用臨時覆寫狀態（如果存在）或服務中的狀態
    const selectedNodeIds = this.tempSelectedNodeIds !== null 
      ? this.tempSelectedNodeIds 
      : this._flowService.selectedNodes();
    const nodeLookup = new Map();
    nodes.forEach(node => {
      const isSelected = selectedNodeIds.includes(node.id);
      // 使用統一位置計算系統獲取位置和尺寸
      const positionAbsolute = this._flowService.getNodePositionAbsolute(node.id);
      const internals = this._flowService.getNodeInternals(node.id);
      
      nodeLookup.set(node.id, {
        ...node,
        // 強制使用選中狀態，確保一致性
        selected: isSelected,
        measured: internals?.measured || { width: node.width || 150, height: node.height || 40 },
        internals: {
          positionAbsolute: positionAbsolute || { x: node.position.x, y: node.position.y }
        }
      });
    });


    // 使用正確的流程容器 - 從 AngularFlowService 獲取當前實例的容器
    const flowContainer = this._flowService.getContainerElement();

    return {
      nodes,
      nodeLookup,
      edges,
      nodeExtent: [[-Infinity, -Infinity], [Infinity, Infinity]] as [[number, number], [number, number]],
      snapGrid: [15, 15] as [number, number],
      snapToGrid: false,
      nodeOrigin: this._flowService.getNodeOrigin(),
      multiSelectionActive: false,
      domNode: flowContainer,
      transform: [viewport.x, viewport.y, viewport.zoom] as [number, number, number],
      autoPanOnNodeDrag: true,
      nodesDraggable: this._flowService.nodesDraggable(),
      selectNodesOnDrag: this._flowService.selectNodesOnDrag(),
      nodeDragThreshold: 0,
      panBy: async (delta: { x: number; y: number }) => {
        const currentViewport = this._flowService.viewport();
        const flowInstance = this._flowService.getFlowInstance();
        flowInstance.setViewport({
          x: currentViewport.x + delta.x,
          y: currentViewport.y + delta.y,
          zoom: currentViewport.zoom
        });
        return true;
      },
      unselectNodesAndEdges: () => {
        // 實現取消選擇邏輯 - 對應React Flow的行為
        
        // 立即設置臨時覆寫狀態為空數組，確保 getDragItems 看到正確的狀態
        this.tempSelectedNodeIds = [];
        
        // 異步更新服務狀態
        this._flowService.clearSelection();
        
        // 不要立即清除臨時狀態，讓它在整個拖拽操作期間保持
        // 它會在 onDragStop 中被清除
      },
      onError: (error: string) => {
        console.error('XYDrag error:', error);
      },
      onNodeDragStart: (_event: MouseEvent, _node: any, _nodes: any[]) => {
        // 節點拖拽開始處理
      },
      onNodeDrag: (_event: MouseEvent, _node: any, _nodes: any[]) => {
        // 節點拖拽中處理
      },
      onNodeDragStop: (_event: MouseEvent, _node: any, _nodes: any[]) => {
        // 節點拖拽結束處理
      },
      updateNodePositions: (dragItems: Map<string, any>, dragging?: boolean) => {
        // 檢查是否在 controlled 模式 - 與 React Flow 邏輯一致
        const isControlled = !this._flowService.hasDefaultNodes() && !this._flowService.hasDefaultEdges();
        
        if (isControlled) {
          // 在 controlled 模式下，創建帶有新位置和拖拽狀態的節點陣列
          // 但不直接更新內部狀態，而是透過事件讓父組件處理
          const currentNodes = this._flowService.nodes();
          // 在 controlled 模式下，創建 position changes
          const nodeChanges: any[] = [];
          for (const [nodeId, dragItem] of dragItems) {
            nodeChanges.push({
              type: 'position',
              id: nodeId,
              position: dragItem.position,
              dragging: dragging || false
            });
          }
          
          // 觸發事件讓父組件處理位置更新
          if (nodeChanges.length > 0) {
            this._flowService.triggerNodeChanges(nodeChanges);
          }
          return;
        }
        
        // 在 uncontrolled 模式下的原有邏輯
        // 當 selectNodesOnDrag=false 時，只更新實際被拖拽的節點
        const selectNodesOnDrag = this._flowService.selectNodesOnDrag();
        
        if (!selectNodesOnDrag && currentNodeId) {
          // 只更新當前被拖拽的節點
          const dragItem = dragItems.get(currentNodeId);
          if (dragItem) {
            const flowInstance = this._flowService.getFlowInstance();
            flowInstance.updateNode(currentNodeId, {
              position: dragItem.position,
              dragging: dragging || false
            });
          }
        } else {
          // 正常更新所有拖拽項目
          const flowInstance = this._flowService.getFlowInstance();
          for (const [nodeId, dragItem] of dragItems) {
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
    
    const node = this._flowService.nodeLookup().get(nodeId);

    if (!node) {
      console.error('Node not found:', nodeId);
      return;
    }


    const isSelectable = this._flowService.elementsSelectable();

    if (isSelectable) {
      const multiSelectionActive = false; // 目前不支持多選
      
      if (!node.selected && !multiSelectionActive) {
        
        // 強制同步更新：直接修改服務中的節點狀態
        // 這確保 getDragItems 能立即看到更新後的狀態
        this._flowService.selectNode(nodeId, false);
        
        // 為了確保立即生效，我們還需要手動觸發一次狀態檢查
        
        
      } else if (node.selected) {
      }
    } else {
    }
  }

  // 設置特定節點的拖動狀態
  setNodeDraggable(nodeId: string, draggable: boolean): void {
    // 限制在當前Flow實例的容器範圍內查詢節點
    const flowContainer = this._flowService.getContainerElement();
    const nodeElement = flowContainer?.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
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

    }
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}
