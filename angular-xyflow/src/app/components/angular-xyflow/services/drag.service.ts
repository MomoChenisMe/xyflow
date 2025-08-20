// Angular 核心模組
import { Injectable, signal, computed, OnDestroy, inject } from '@angular/core';

// XyFlow 系統模組
import { XYDrag, type XYDragInstance, panBy as panBySystem } from '@xyflow/system';

// 專案內部模組
import { AngularXYFlowService } from './angular-xyflow.service';
import { KeyboardService } from './keyboard.service';

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
  multiSelectionKeyCode?: import('./keyboard.service').KeyboardKey | import('./keyboard.service').KeyboardKey[];
}

@Injectable()
export class AngularXYFlowDragService implements OnDestroy {
  private xyDragInstances = new Map<string, XYDragInstance>();
  private _dragging = signal(false);

  // 🔧 關鍵修復：全局拖拽狀態管理，確保同時只有一個節點在拖拽
  private _activeDragNodeId = signal<string | null>(null);
  private _isDragInProgress = signal(false);

  // 多選鍵配置
  private multiSelectionKeyConfig?: import('./keyboard.service').KeyboardKey | import('./keyboard.service').KeyboardKey[];

  // 存儲節點拖曳回調
  private dragCallbacks = new Map<string, {
    onDragStart?: (event: MouseEvent, nodeId: string) => void;
    onDrag?: (event: MouseEvent, nodeId: string, position: { x: number; y: number }) => void;
    onDragStop?: (event: MouseEvent, nodeId: string) => void;
  }>();

  // 公開拖拽狀態
  dragging = computed(() => this._dragging());

  private _flowService = inject(AngularXYFlowService);
  private _keyboardService = inject(KeyboardService);

  // 設置多選鍵配置
  setMultiSelectionKeyCode(keyCode?: import('./keyboard.service').KeyboardKey | import('./keyboard.service').KeyboardKey[]): void {
    this.multiSelectionKeyConfig = keyCode;
  }


  // 初始化拖拽功能
  initializeDrag(config: DragConfig): void {
    const { nodeId, handleSelector } = config;
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

    // 捕獲 nodeId 和 handleSelector 用於後續的回調函式
    const currentNodeId = nodeId;
    const currentHandleSelector = handleSelector;

    // 🔧 為了在 updateNodePositions 中訪問 currentNodeId，我們需要在閉包中捕獲它
    const capturedNodeId = currentNodeId;

    // 創建新的 XYDrag 實例
    const xyDragInstance = XYDrag({
      getStoreItems: () => this.getStoreItems(),
      onNodeMouseDown: (id: string, event?: MouseEvent) => {
        const nodeLookup = this._flowService.nodeLookup();
        const node = nodeLookup.get(id);
        
        if (!node) {
          console.warn(`Node ${id} not found in nodeLookup`);
          return;
        }

        const multiSelectionActive = this._flowService.multiSelectionActive();
        const isSelected = node.selected;
        const selectedNodes = this._flowService.selectedNodes();

        // 如果當前節點已經是多選的一部分，不要改變選擇狀態
        if (isSelected && selectedNodes.length > 1) {
          return; // 保持當前選擇狀態，不做任何改變
        }

        if (!multiSelectionActive) {
          // 單選模式：清除所有其他選擇，只選中當前節點
          this._flowService.selectNode(id, false);
        } else {
          // 多選模式：切換當前節點的選中狀態
          if (!isSelected) {
            this._flowService.selectNode(id, true);
          } else {
            this._flowService.unselectNode(id);
          }
        }
      },
      onDragStart: (event: MouseEvent) => {
        // 🔧 關鍵修復：設置當前活動拖拽節點
        this._activeDragNodeId.set(currentNodeId);
        this._isDragInProgress.set(true);
        this._dragging.set(true);
        
        // 調用節點的 onDragStart 回調
        const callbacks = this.dragCallbacks.get(currentNodeId);
        if (callbacks?.onDragStart) {
          callbacks.onDragStart(event, currentNodeId);
        }
      },
      onDragStop: (event: MouseEvent) => {
        // 🔧 關鍵修復：清除活動拖拽節點
        this._activeDragNodeId.set(null);
        this._isDragInProgress.set(false);
        this._dragging.set(false);

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


    // 更新拖拽配置 - 只傳遞 DragUpdateParams 需要的參數
    const updateParams = {
      domNode: config.domNode,
      noDragClassName: 'non-draggable',
      handleSelector: currentHandleSelector,
      isSelectable: config.isSelectable,
      nodeId: config.nodeId,
      nodeClickDistance: config.nodeClickDistance
    };

    xyDragInstance.update(updateParams);


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
  private getStoreItems() {
    // 🔧 關鍵修復：每次調用都獲取最新的節點和邊狀態
    // 這確保 XYDrag 系統總是使用最新的選中狀態
    const nodes = this._flowService.nodes();
    const edges = this._flowService.edges();
    const viewport = this._flowService.viewport();

    // 🔧 關鍵修復：創建動態 nodeLookup，每次訪問都獲取最新狀態
    const nodeLookup = new Map();
    const createNodeData = (nodeId: string) => {
      const latestNodes = this._flowService.nodes();
      const node = latestNodes.find(n => n.id === nodeId);
      if (!node) return null;

      const positionAbsolute = this._flowService.getNodePositionAbsolute(node.id);
      const internals = this._flowService.getNodeInternals(node.id);

      return {
        ...node,
        // 🎯 總是使用最新的選中狀態
        selected: node.selected,
        measured: internals?.measured || { width: node.width || 150, height: node.height || 40 },
        internals: {
          positionAbsolute: positionAbsolute || { x: node.position.x, y: node.position.y }
        }
      };
    };

    // 為每個節點創建動態獲取器
    nodes.forEach(node => {
      nodeLookup.set(node.id, createNodeData(node.id));
    });

    // 🔧 關鍵：重寫 nodeLookup.get 方法以獲取最新狀態
    const originalGet = nodeLookup.get.bind(nodeLookup);
    nodeLookup.get = function(nodeId: string) {
      const freshNodeData = createNodeData(nodeId);
      if (freshNodeData) {
        return freshNodeData;
      }
      return originalGet(nodeId);
    };

    // 🔧 關鍵：重寫 iterator 方法以確保 for...of 循環也使用最新狀態
    const originalEntries = nodeLookup.entries.bind(nodeLookup);
    (nodeLookup as any).entries = function*() {
      for (const [id] of originalEntries()) {
        const freshData = createNodeData(id);
        if (freshData) {
          yield [id, freshData];
        }
      }
    };

    // 重寫 [Symbol.iterator] 以確保 for...of 使用最新數據  
    (nodeLookup as any)[Symbol.iterator] = (nodeLookup as any).entries;


    // 使用正確的流程容器 - 從 AngularFlowService 獲取當前實例的容器
    const flowContainer = this._flowService.getContainerElement();

    return {
      nodes,
      nodeLookup,
      edges,
      nodeExtent: [[-Infinity, -Infinity], [Infinity, Infinity]] as [[number, number], [number, number]],
      snapGrid: this._flowService.snapGrid(),
      snapToGrid: this._flowService.snapToGrid(),
      nodeOrigin: this._flowService.getNodeOrigin(),
      multiSelectionActive: this._flowService.multiSelectionActive(), // 從服務獲取實時多選狀態
      domNode: flowContainer,
      transform: [viewport.x, viewport.y, viewport.zoom] as [number, number, number],
      autoPanOnNodeDrag: true,
      nodesDraggable: this._flowService.nodesDraggable(),
      selectNodesOnDrag: true, // 啟用 XYDrag 內部選擇邏輯（對應React版本的預設值）
      nodeDragThreshold: 0,
      panBy: async (delta: { x: number; y: number }) => {
        const currentViewport = this._flowService.viewport();
        const dimensions = this._flowService.dimensions();
        const panZoomInstance = this._flowService.getPanZoomInstance();

        return panBySystem({
          delta,
          panZoom: panZoomInstance,
          transform: [currentViewport.x, currentViewport.y, currentViewport.zoom],
          translateExtent: [
            [-Infinity, -Infinity],
            [Infinity, Infinity],
          ],
          width: dimensions.width,
          height: dimensions.height,
        });
      },
      unselectNodesAndEdges: () => {
        // 對應React版本的行為：清除所有選擇
        this._flowService.clearSelection();
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
        const activeDragNodeId = this._activeDragNodeId();
        
        // 只有當前活動拖拽節點相關的更新才能處理
        // 檢查 dragItems 中是否包含當前活動的拖拽節點
        if (activeDragNodeId && !dragItems.has(activeDragNodeId)) {
          return;
        }
        
        // 檢查是否在 controlled 模式 - 與 React Flow 邏輯一致
        const isControlled = !this._flowService.hasDefaultNodes() && !this._flowService.hasDefaultEdges();
        if (isControlled) {
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
        
        // 在 uncontrolled 模式下，統一更新所有 dragItems 中的節點
        const flowInstance = this._flowService.getFlowInstance();
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
        nodeClickDistance: 1
      });

    }
  }

  /**
   * 初始化 NodesSelection 的拖拽功能
   * 完全模仿 React Flow 的 useDrag hook 行為
   */
  initializeNodesSelectionDrag(selectionElement: HTMLElement): void {
    const instanceKey = 'nodes-selection'; // 用於存儲實例的鍵值
    
    // 清理現有實例
    if (this.xyDragInstances.has(instanceKey)) {
      this.xyDragInstances.get(instanceKey)?.destroy();
    }

    // 創建新的 XYDrag 實例，完全模仿 React Flow 的 useDrag 行為
    const xyDragInstance = XYDrag({
      // 獲取存儲項目，與 React 版本完全一致
      getStoreItems: () => this.getStoreItems(),
      // onNodeMouseDown: 不需要處理，因為是 NodesSelection 不是單個節點
      onNodeMouseDown: () => {
        // NodesSelection 拖曳不需要處理節點選擇
      },
      // 當拖曳開始時
      onDragStart: (event: MouseEvent) => {
        this._dragging.set(true);
      },
      // 拖曳過程中 - 讓 XYDrag 系統自動處理選中節點的拖曳
      onDrag: (_event: MouseEvent, dragItems) => {
        // XYDrag 系統會自動提供所有選中節點的拖曳信息
        // 我們只需要應用這些變化
        const flowInstance = this._flowService.getFlowInstance();
        for (const [dragNodeId, dragItem] of dragItems) {
          flowInstance.updateNode(dragNodeId, {
            position: dragItem.position,
            dragging: true
          });
        }
      },
      // 拖曳結束時
      onDragStop: (_event: MouseEvent) => {
        this._dragging.set(false);
      }
    });

    // 配置拖曳參數 - 與 React Flow 的 NodesSelection useDrag 調用一致
    // React 中調用: useDrag({ nodeRef })，所以只有 domNode，其他都是默認值
    xyDragInstance.update({
      domNode: selectionElement,
      noDragClassName: undefined,     // 與 React 保持一致：沒有傳遞此參數
      handleSelector: undefined,      // 與 React 保持一致：沒有傳遞此參數
      isSelectable: undefined,        // 與 React 保持一致：沒有傳遞此參數
      nodeId: undefined,              // 關鍵：與 React 保持一致，不指定 nodeId
      nodeClickDistance: undefined    // 與 React 保持一致：沒有傳遞此參數
    });
    
    // 儲存實例
    this.xyDragInstances.set(instanceKey, xyDragInstance);
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}
