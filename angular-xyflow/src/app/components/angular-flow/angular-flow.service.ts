// Angular 核心模組
import { Injectable, inject, signal, computed, Signal, effect, Injector } from '@angular/core';

// XyFlow 系統模組
import {
  type PanZoomInstance,
  type XYDragInstance,
  type NodeBase,
  type EdgeBase,
  type XYPosition,
  type Viewport as SystemViewport,
  type Connection,
  type Transform,
  type Rect,
  Position,
  addEdge as systemAddEdge,
  evaluateAbsolutePosition,
  getConnectedEdges,
  getIncomers,
  getOutgoers,
  getNodesInside,
  getNodePositionWithOrigin,
} from '@xyflow/system';

// 專案內部模組
import {
  AngularNode,
  AngularEdge,
  Viewport,
  AngularFlowInstance,
  ConnectionState,
  NoConnection,
  ConnectionInProgress,
  Handle,
} from './types';

@Injectable()
export class AngularFlowService<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> {
  private injector = inject(Injector);
  
  constructor() {
    // 使用 computed 來自動計算節點內部狀態，避免 effect 無窮迴圈
    this._nodeInternals = computed(() => {
      const nodes = this._nodes();
      const measuredDimensions = this._nodeMeasuredDimensions();
      const internals = new Map();
      
      nodes.forEach(node => {
        // 計算絕對位置（考慮 origin）
        const positionAbsolute = getNodePositionWithOrigin(node, this._nodeOrigin());
        
        // 優先使用測量的尺寸，然後是節點的尺寸，最後是默認值
        const measured = measuredDimensions.get(node.id) || 
          node.measured || 
          {
            width: node.width || 150,
            height: node.height || 40
          };
        
        internals.set(node.id, {
          positionAbsolute,
          measured
        });
      });
      
      return internals;
    });
  }
  
  // 核心信號狀態
  private _nodes = signal<NodeType[]>([]);
  private _edges = signal<EdgeType[]>([]);
  private _viewport = signal<Viewport>({ x: 0, y: 0, zoom: 1 });
  private _selectedNodes = signal<string[]>([]);
  private _selectedEdges = signal<string[]>([]);
  private _selectedHandles = signal<
    Array<{ nodeId: string; handleId?: string; type: 'source' | 'target' }>
  >([]);
  private _connectionState = signal<ConnectionState<NodeType>>({
    inProgress: false,
  } as NoConnection);
  private _initialized = signal<boolean>(false);
  private _minZoom = signal<number>(0.5);
  private _maxZoom = signal<number>(2);
  private _connectionRadius = signal<number>(20);
  private _fitViewQueued = signal<boolean>(false);
  private _nodesDraggable = signal<boolean>(true);
  private _nodesConnectable = signal<boolean>(true);
  private _elementsSelectable = signal<boolean>(true);
  private _selectNodesOnDrag = signal<boolean>(false);
  private _autoPanOnNodeFocus = signal<boolean>(false);
  private _dimensions = signal<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  
  // 統一位置計算系統 - 內部節點狀態管理 (使用 computed 避免無窮迴圈)
  private _nodeMeasuredDimensions = signal<Map<string, { width: number; height: number }>>(new Map());
  private _nodeOrigin = signal<[number, number]>([0, 0]);
  private _nodeInternals!: Signal<Map<string, {
    positionAbsolute: XYPosition;
    measured: { width: number; height: number };
  }>>;

  // 計算信號 - 唯讀訪問器
  readonly nodes: Signal<NodeType[]> = computed(() => this._nodes());
  readonly edges: Signal<EdgeType[]> = computed(() => this._edges());
  readonly viewport: Signal<Viewport> = computed(() => this._viewport());
  readonly selectedNodes: Signal<string[]> = computed(() =>
    this._selectedNodes()
  );
  readonly selectedEdges: Signal<string[]> = computed(() =>
    this._selectedEdges()
  );
  readonly selectedHandles: Signal<
    Array<{ nodeId: string; handleId?: string; type: 'source' | 'target' }>
  > = computed(() => this._selectedHandles());
  readonly connectionState: Signal<ConnectionState<NodeType>> = computed(() =>
    this._connectionState()
  );
  readonly initialized: Signal<boolean> = computed(() => this._initialized());
  readonly minZoom: Signal<number> = computed(() => this._minZoom());
  readonly maxZoom: Signal<number> = computed(() => this._maxZoom());
  readonly connectionRadius: Signal<number> = computed(() =>
    this._connectionRadius()
  );
  readonly nodesDraggable: Signal<boolean> = computed(() =>
    this._nodesDraggable()
  );
  readonly nodesConnectable: Signal<boolean> = computed(() =>
    this._nodesConnectable()
  );
  readonly elementsSelectable: Signal<boolean> = computed(() =>
    this._elementsSelectable()
  );
  readonly selectNodesOnDrag: Signal<boolean> = computed(() =>
    this._selectNodesOnDrag()
  );
  readonly autoPanOnNodeFocus: Signal<boolean> = computed(() =>
    this._autoPanOnNodeFocus()
  );
  readonly dimensions: Signal<{ width: number; height: number }> = computed(
    () => this._dimensions()
  );
  readonly isInteractive: Signal<boolean> = computed(
    () =>
      this._nodesDraggable() ||
      this._nodesConnectable() ||
      this._elementsSelectable()
  );

  // 節點和邊的查找映射 - 效能優化的查找表
  readonly nodeLookup: Signal<Map<string, NodeType>> = computed(() => {
    const lookup = new Map<string, NodeType>();
    this._nodes().forEach((node) => lookup.set(node.id, node));
    return lookup;
  });

  readonly edgeLookup: Signal<Map<string, EdgeType>> = computed(() => {
    const lookup = new Map<string, EdgeType>();
    this._edges().forEach((edge) => lookup.set(edge.id, edge));
    return lookup;
  });

  // 內部節點查找表 - 用於 getNodesInside 函數
  readonly internalNodeLookup = computed(() => {
    const lookup = new Map();
    this._nodes().forEach((node) => {
      lookup.set(node.id, {
        ...node,
        measured: {
          width: (node as any).width || 150,
          height: (node as any).height || 32,
        },
        selectable: true,
        hidden: false,
        internals: {
          positionAbsolute: { x: node.position.x, y: node.position.y },
          handleBounds: true, // 避免強制初始渲染
        },
      });
    });
    return lookup;
  });

  // PanZoom 和 Drag 實例 - 型別安全
  private panZoom: PanZoomInstance | null = null;
  private drag: XYDragInstance | null = null;
  private handle: any | null = null;
  private containerElement: HTMLElement | null = null;

  // 獲取容器元素方法 - 提供給子服務使用
  getContainerElement(): HTMLElement | null {
    return this.containerElement;
  }

  // 流程實例API
  getFlowInstance(): AngularFlowInstance<NodeType, EdgeType> {
    return {
      getNodes: () => [...this._nodes()],
      getNode: (id: string) => this.nodeLookup().get(id),
      getEdges: () => [...this._edges()],
      getEdge: (id: string) => this.edgeLookup().get(id),
      setNodes: (nodes: NodeType[] | ((nodes: NodeType[]) => NodeType[])) => {
        if (typeof nodes === 'function') {
          this._nodes.update(nodes);
        } else {
          this._nodes.set([...nodes]);
        }
      },
      setEdges: (edges: EdgeType[] | ((edges: EdgeType[]) => EdgeType[])) => {
        if (typeof edges === 'function') {
          this._edges.update(edges);
        } else {
          this._edges.set([...edges]);
        }
      },
      addNodes: (nodes: NodeType | NodeType[]) => {
        const nodesToAdd = Array.isArray(nodes) ? nodes : [nodes];
        // 為新節點設置默認的 measured 屬性，這對 getNodePositionWithOrigin 很重要
        const nodesWithDefaults = nodesToAdd.map(node => ({
          ...node,
          measured: node.measured || {
            width: node.width || 150,  // 默認寬度與 CSS 一致
            height: node.height || 40  // 默認高度（估算）
          }
        }));
        
        this._nodes.update((existingNodes) => [
          ...existingNodes,
          ...nodesWithDefaults,
        ]);
      },
      addEdges: (edges: EdgeType | EdgeType[]) => {
        const edgesToAdd = Array.isArray(edges) ? edges : [edges];
        this._edges.update((existingEdges) => [
          ...existingEdges,
          ...edgesToAdd,
        ]);
      },
      updateNode: (
        id: string,
        nodeUpdate: Partial<NodeType> | ((node: NodeType) => Partial<NodeType>)
      ) => {
        this._nodes.update((nodes) =>
          nodes.map((node) => {
            if (node.id === id) {
              const update =
                typeof nodeUpdate === 'function'
                  ? nodeUpdate(node)
                  : nodeUpdate;
              return { ...node, ...update };
            }
            return node;
          })
        );
      },
      updateNodeData: (
        id: string,
        dataUpdate: any | ((node: NodeType) => any)
      ) => {
        this._nodes.update((nodes) =>
          nodes.map((node) => {
            if (node.id === id) {
              const newData =
                typeof dataUpdate === 'function'
                  ? dataUpdate(node)
                  : dataUpdate;
              return { ...node, data: { ...node.data, ...newData } };
            }
            return node;
          })
        );
      },
      updateEdge: (
        id: string,
        edgeUpdate: Partial<EdgeType> | ((edge: EdgeType) => Partial<EdgeType>)
      ) => {
        this._edges.update((edges) =>
          edges.map((edge) => {
            if (edge.id === id) {
              const update =
                typeof edgeUpdate === 'function'
                  ? edgeUpdate(edge)
                  : edgeUpdate;
              return { ...edge, ...update };
            }
            return edge;
          })
        );
      },
      deleteElements: (elements: {
        nodes?: { id: string }[];
        edges?: { id: string }[];
      }) => {
        if (elements.nodes?.length) {
          const nodeIdsToDelete = new Set(elements.nodes.map((n) => n.id));
          this._nodes.update((nodes) =>
            nodes.filter((node) => !nodeIdsToDelete.has(node.id))
          );
        }
        if (elements.edges?.length) {
          const edgeIdsToDelete = new Set(elements.edges.map((e) => e.id));
          this._edges.update((edges) =>
            edges.filter((edge) => !edgeIdsToDelete.has(edge.id))
          );
        }
      },
      fitView: (options?) => {
        this._fitViewQueued.set(true);
        // 實際的 fitView 邏輯會在組件中處理
      },
      setViewport: (viewport: Viewport) => {
        this._viewport.set({ ...viewport });
      },
      getViewport: () => ({ ...this._viewport() }),
      toObject: () => ({
        nodes: [...this._nodes()],
        edges: [...this._edges()],
        viewport: { ...this._viewport() },
      }),
    };
  }

  // ============= 統一位置計算系統 API =============
  
  /**
   * 獲取節點的絕對位置（考慮 origin）
   */
  getNodePositionAbsolute(nodeId: string): XYPosition | null {
    const internals = this._nodeInternals().get(nodeId);
    return internals ? internals.positionAbsolute : null;
  }
  
  /**
   * 獲取節點的視覺位置（用於 transform）
   */
  getNodeVisualPosition(node: NodeType): XYPosition {
    const internals = this._nodeInternals().get(node.id);
    if (internals) {
      return internals.positionAbsolute;
    }
    // 備用計算
    return getNodePositionWithOrigin(node, this._nodeOrigin());
  }
  
  /**
   * 獲取節點的內部狀態
   */
  getNodeInternals(nodeId: string): { positionAbsolute: XYPosition; measured: { width: number; height: number }; } | null {
    return this._nodeInternals().get(nodeId) || null;
  }
  
  /**
   * 獲取節點原點設定
   */
  getNodeOrigin(): [number, number] {
    return this._nodeOrigin();
  }
  
  /**
   * 測量節點的實際 Handle bounds（類似 React 版本的 getHandleBounds）
   */
  measureNodeHandleBounds(nodeId: string): { source: any[]; target: any[]; } | null {
    // 限制在當前Flow實例的容器範圍內查詢節點
    const container = this.getContainerElement();
    if (!container) return null;
    
    const nodeElement = container.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
    if (!nodeElement) return null;

    const nodeBounds = nodeElement.getBoundingClientRect();
    const viewport = this._viewport();
    const zoom = viewport.zoom;

    const sourceHandles = nodeElement.querySelectorAll('.source');
    const targetHandles = nodeElement.querySelectorAll('.target');

    const source = Array.from(sourceHandles).map((handle): any => {
      const handleBounds = handle.getBoundingClientRect();
      return {
        id: handle.getAttribute('data-handleid') || null,
        type: 'source',
        nodeId,
        position: handle.getAttribute('data-handlepos') || 'bottom',
        x: (handleBounds.left - nodeBounds.left) / zoom,
        y: (handleBounds.top - nodeBounds.top) / zoom,
        width: handleBounds.width / zoom,
        height: handleBounds.height / zoom,
      };
    });

    const target = Array.from(targetHandles).map((handle): any => {
      const handleBounds = handle.getBoundingClientRect();
      return {
        id: handle.getAttribute('data-handleid') || null,
        type: 'target',
        nodeId,
        position: handle.getAttribute('data-handlepos') || 'top',
        x: (handleBounds.left - nodeBounds.left) / zoom,
        y: (handleBounds.top - nodeBounds.top) / zoom,
        width: handleBounds.width / zoom,
        height: handleBounds.height / zoom,
      };
    });

    return { source, target };
  }
  
  /**
   * 獲取 Handle 的絕對位置
   */
  getHandlePositionAbsolute(
    nodeId: string, 
    handleType: 'source' | 'target',
    handlePosition?: Position
  ): XYPosition | null {
    const node = this._nodes().find(n => n.id === nodeId);
    const internals = this._nodeInternals().get(nodeId);
    
    if (!node || !internals) return null;
    
    const position = handlePosition || 
      (handleType === 'source' ? Position.Bottom : Position.Top);
    const { width, height } = internals.measured;
    const { x, y } = internals.positionAbsolute;
    
    // Handle 現在使用 CSS transform 來定位，所以位置計算已經考慮了中心點
    switch (position) {
      case Position.Top:
        return { x: x + width / 2, y: y };
      case Position.Right:
        return { x: x + width, y: y + height / 2 };
      case Position.Bottom:
        return { x: x + width / 2, y: y + height };
      case Position.Left:
        return { x: x, y: y + height / 2 };
      default:
        return { x: x + width / 2, y: y + height / 2 };
    }
  }
  
  // 移除了 updateNodeInternals 方法，因為現在使用 computed 自動計算
  
  /**
   * 更新節點的測量尺寸（由 ResizeObserver 調用）
   */
  updateNodeMeasuredDimensions(nodeId: string, dimensions: { width: number; height: number }) {
    const currentDimensions = new Map(this._nodeMeasuredDimensions());
    currentDimensions.set(nodeId, dimensions);
    this._nodeMeasuredDimensions.set(currentDimensions);
  }
  
  // ============= 統一位置計算系統 API 結束 =============

  // 初始化方法 - 配置流程现境
  initialize(
    container: HTMLElement,
    options?: {
      nodes?: NodeType[];
      edges?: EdgeType[];
      defaultViewport?: Viewport;
      minZoom?: number;
      maxZoom?: number;
      selectNodesOnDrag?: boolean;
      autoPanOnNodeFocus?: boolean;
    }
  ): void {
    this.containerElement = container;
    if (options?.nodes) {
      this._nodes.set([...options.nodes]);
    }
    if (options?.edges) {
      this._edges.set([...options.edges]);
    }
    if (options?.defaultViewport) {
      this._viewport.set({ ...options.defaultViewport });
    }
    if (options?.minZoom !== undefined) {
      this._minZoom.set(options.minZoom);
    }
    if (options?.maxZoom !== undefined) {
      this._maxZoom.set(options.maxZoom);
    }
    if (options?.selectNodesOnDrag !== undefined) {
      this._selectNodesOnDrag.set(options.selectNodesOnDrag);
    }
    if (options?.autoPanOnNodeFocus !== undefined) {
      this._autoPanOnNodeFocus.set(options.autoPanOnNodeFocus);
    }

    // 初始化 PanZoom, Drag, Handle 會在實際需要時創建
    // this.panZoom = XYPanZoom({ ... });
    // this.drag = XYDrag({ ... });
    // this.handle = XYHandle;

    this._initialized.set(true);
  }

  // 連接處理 - 建立節點間的連接
  onConnect(connection: Connection): void {
    if (this.isValidConnection(connection)) {
      const newEdge = this.createEdgeFromConnection(connection);
      this._edges.update(
        (edges) => systemAddEdge(newEdge as any, edges as any) as EdgeType[]
      );
    }
  }

  // 驗證連接是否有效
  private isValidConnection(connection: Connection): boolean {
    const { source, target, sourceHandle, targetHandle } = connection;

    // 基本驗證
    if (!source || !target || source === target) {
      return false;
    }

    // 檢查節點是否存在
    const sourceNode = this.nodeLookup().get(source);
    const targetNode = this.nodeLookup().get(target);

    if (!sourceNode || !targetNode) {
      return false;
    }

    // 檢查是否已存在相同連接
    const existingEdge = this._edges().find(
      (edge) =>
        edge.source === source &&
        edge.target === target &&
        edge.sourceHandle === sourceHandle &&
        edge.targetHandle === targetHandle
    );

    if (existingEdge) {
      return false;
    }

    // 額外驗證：確保不會有相同類型的 handle 連接
    // 這裡我們假設 source 節點的 handle 是 source 類型，target 節點的 handle 是 target 類型
    // 實際上這已經在連接創建時保證了，但這裡加一層保護
    return true;
  }

  // 從連接創建邊
  private createEdgeFromConnection(connection: Connection): EdgeType {
    return {
      id: `e${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'default',
    } as EdgeType;
  }

  // 清理方法 - 釋放資源
  destroy(): void {
    this.panZoom?.destroy();
    this.drag?.destroy();
    this.handle?.destroy();
    this._initialized.set(false);
  }

  // 節點選擇 - 支援單選和多選
  selectNode(nodeId: string, multiSelect = false): void {
    let newSelectedNodes: string[];

    if (multiSelect) {
      const currentSelected = this._selectedNodes();
      newSelectedNodes = currentSelected.includes(nodeId)
        ? currentSelected.filter((id) => id !== nodeId)
        : [...currentSelected, nodeId];
    } else {
      newSelectedNodes = [nodeId];
      this._selectedEdges.set([]); // 清除邊選擇
    }

    // 同步更新選中節點列表
    this._selectedNodes.set(newSelectedNodes);

    // 立即同步更新節點的選中狀態
    this._nodes.update((nodes) =>
      nodes.map((node) => ({
        ...node,
        selected: newSelectedNodes.includes(node.id),
      }))
    );

    // 清除邊的選中狀態（如果不是多選）
    if (!multiSelect) {
      this._edges.update((edges) =>
        edges.map((edge) => ({ ...edge, selected: false }))
      );
    }
  }

  // 邊選擇 - 支援單選和多選
  selectEdge(edgeId: string, multiSelect = false): void {
    if (multiSelect) {
      this._selectedEdges.update((selected) =>
        selected.includes(edgeId)
          ? selected.filter((id) => id !== edgeId)
          : [...selected, edgeId]
      );
    } else {
      this._selectedEdges.set([edgeId]);
      this._selectedNodes.set([]); // 清除節點選擇
    }

    // 更新邊的選中狀態
    this._edges.update((edges) =>
      edges.map((edge) => ({
        ...edge,
        selected: this._selectedEdges().includes(edge.id),
      }))
    );

    // 清除節點的選中狀態（如果不是多選）
    if (!multiSelect) {
      this._nodes.update((nodes) =>
        nodes.map((node) => ({ ...node, selected: false }))
      );
    }
  }

  // Handle 選擇 - 連接點的選擇狀態
  selectHandle(
    nodeId: string,
    handleId: string | undefined,
    type: 'source' | 'target',
    multiSelect = false
  ): void {
    const handleKey = { nodeId, handleId, type };

    if (multiSelect) {
      this._selectedHandles.update((selected) => {
        const existingIndex = selected.findIndex(
          (h) =>
            h.nodeId === nodeId && h.handleId === handleId && h.type === type
        );

        if (existingIndex >= 0) {
          // 取消選擇
          return selected.filter((_, index) => index !== existingIndex);
        } else {
          // 添加選擇
          return [...selected, handleKey];
        }
      });
    } else {
      this._selectedHandles.set([handleKey]);
      this._selectedNodes.set([]); // 清除節點選擇
      this._selectedEdges.set([]); // 清除邊選擇

      // 更新節點的選中狀態
      this._nodes.update((nodes) =>
        nodes.map((node) => ({ ...node, selected: false }))
      );

      // 更新邊的選中狀態
      this._edges.update((edges) =>
        edges.map((edge) => ({ ...edge, selected: false }))
      );
    }
  }

  // 檢查 Handle 是否被選中
  isHandleSelected(
    nodeId: string,
    handleId: string | undefined,
    type: 'source' | 'target'
  ): boolean {
    return this._selectedHandles().some(
      (h) => h.nodeId === nodeId && h.handleId === handleId && h.type === type
    );
  }

  // 清除選擇 - 重置所有選擇狀態
  clearSelection(): void {
    this._selectedNodes.set([]);
    this._selectedEdges.set([]);
    this._selectedHandles.set([]);
    this._nodes.update((nodes) =>
      nodes.map((node) => ({ ...node, selected: false }))
    );
    this._edges.update((edges) =>
      edges.map((edge) => ({ ...edge, selected: false }))
    );
  }

  // 取得選中的節點
  getSelectedNodes(): NodeType[] {
    const selectedIds = this._selectedNodes();
    return this._nodes().filter((node) => selectedIds.includes(node.id));
  }

  // 取得選中的邊
  getSelectedEdges(): EdgeType[] {
    const selectedIds = this._selectedEdges();
    return this._edges().filter((edge) => selectedIds.includes(edge.id));
  }

  // 取得選中的 Handles
  getSelectedHandles(): Array<{
    nodeId: string;
    handleId?: string;
    type: 'source' | 'target';
  }> {
    return [...this._selectedHandles()];
  }

  // 獲取 PanZoom 實例
  getPanZoomInstance(): PanZoomInstance | null {
    return this.panZoom;
  }

  // 設置 PanZoom 實例
  setPanZoom(panZoomInstance: PanZoomInstance) {
    this.panZoom = panZoomInstance;
  }

  // 設置容器尺寸
  setDimensions(dimensions: { width: number; height: number }) {
    this._dimensions.set(dimensions);
  }

  // 獲取 Drag 實例
  getDrag(): XYDragInstance | null {
    return this.drag;
  }

  // 獲取 Handle 實例
  getHandle(): any | null {
    return this.handle;
  }

  // 座標轉換方法：螢幕座標轉流座標
  screenToFlow(clientPosition: { x: number; y: number }): { x: number; y: number } {
    const container = this.containerElement;
    if (!container) return clientPosition;

    const rect = container.getBoundingClientRect();
    const viewport = this._viewport();
    
    // 轉換為容器相對座標
    const containerX = clientPosition.x - rect.left;
    const containerY = clientPosition.y - rect.top;
    
    // 套用視口變換（考慮平移和縮放）
    return {
      x: (containerX - viewport.x) / viewport.zoom,
      y: (containerY - viewport.y) / viewport.zoom
    };
  }

  // 座標轉換方法：流座標轉螢幕座標
  flowToScreen(flowPosition: { x: number; y: number }): { x: number; y: number } {
    const container = this.containerElement;
    if (!container) return flowPosition;

    const rect = container.getBoundingClientRect();
    const viewport = this._viewport();
    
    // 套用視口變換
    const containerX = flowPosition.x * viewport.zoom + viewport.x;
    const containerY = flowPosition.y * viewport.zoom + viewport.y;
    
    // 轉換為螢幕座標
    return {
      x: containerX + rect.left,
      y: containerY + rect.top
    };
  }

  // 連接狀態管理方法
  startConnection(
    fromNode: NodeType,
    fromHandle: Handle,
    fromPosition: { x: number; y: number }
  ) {
    const connectionState: ConnectionInProgress<NodeType> = {
      inProgress: true,
      isValid: null,
      from: fromPosition,
      fromHandle,
      fromPosition: fromHandle.position,
      fromNode,
      to: fromPosition, // 初始時終點就是起點
      toHandle: null,
      toPosition: this.getOppositePosition(fromHandle.position),
      toNode: null,
    };

    this._connectionState.set(connectionState);
  }

  updateConnection(
    to: { x: number; y: number },
    toHandle?: Handle | null,
    toNode?: NodeType | null
  ) {
    const currentState = this._connectionState();
    if (!currentState.inProgress) return;

    const isValid =
      toHandle && toNode
        ? this.isValidConnection({
            source: currentState.fromNode.id,
            target: toNode.id,
            sourceHandle: currentState.fromHandle.id,
            targetHandle: toHandle.id,
          })
        : null;

    const updatedState: ConnectionInProgress<NodeType> = {
      ...currentState,
      to,
      toHandle: toHandle || null,
      toNode: toNode || null,
      toPosition:
        toHandle?.position ||
        this.getOppositePosition(currentState.fromPosition),
      isValid,
    };

    this._connectionState.set(updatedState);
  }

  endConnection(connection?: Connection) {
    const currentState = this._connectionState();

    if (currentState.inProgress && connection && currentState.isValid) {
      // 創建新的連接
      this.onConnect(connection);
    }

    // 重置連接狀態
    this._connectionState.set({ inProgress: false });
  }

  cancelConnection() {
    this._connectionState.set({ inProgress: false });
  }

  // 計算 handle 的世界座標位置（使用統一位置計算系統）
  calculateHandlePosition(
    node: NodeType,
    handleType: 'source' | 'target',
    handlePosition?: Position,
    nodeWidth: number = 150,
    nodeHeight: number = 40
  ): { x: number; y: number } {
    // 使用統一系統獲取 Handle 位置
    const position = this.getHandlePositionAbsolute(
      node.id, 
      handleType, 
      handlePosition
    );
    
    if (position) {
      return position;
    }
    
    // 備用計算（如果統一系統尚未初始化）
    const adjustedPosition = getNodePositionWithOrigin(node, [0, 0]);
    const pos = handlePosition || (handleType === 'source' ? Position.Bottom : Position.Top);
    
    switch (pos) {
      case Position.Top:
        return { x: adjustedPosition.x + nodeWidth / 2, y: adjustedPosition.y };
      case Position.Right:
        return { x: adjustedPosition.x + nodeWidth, y: adjustedPosition.y + nodeHeight / 2 };
      case Position.Bottom:
        return { x: adjustedPosition.x + nodeWidth / 2, y: adjustedPosition.y + nodeHeight };
      case Position.Left:
        return { x: adjustedPosition.x, y: adjustedPosition.y + nodeHeight / 2 };
      default:
        return { x: adjustedPosition.x + nodeWidth / 2, y: adjustedPosition.y + nodeHeight / 2 };
    }
  }

  // 獲取相對位置
  private getOppositePosition(position: Position): Position {
    switch (position) {
      case Position.Top:
        return Position.Bottom;
      case Position.Bottom:
        return Position.Top;
      case Position.Left:
        return Position.Right;
      case Position.Right:
        return Position.Left;
      default:
        return Position.Top;
    }
  }

  // 尋找最近的有效 handle，基於 React Flow 的邏輯
  findClosestHandle(
    position: { x: number; y: number },
    fromHandle: {
      nodeId: string;
      type: 'source' | 'target';
      id?: string | null;
    }
  ): Handle | null {
    let closestHandles: Handle[] = [];
    let minDistance = Infinity;
    const connectionRadius = this._connectionRadius();
    const ADDITIONAL_DISTANCE = 250; // 擴大搜索範圍

    // 獲取在搜索範圍內的節點
    const searchRadius = connectionRadius + ADDITIONAL_DISTANCE;
    const nearbyNodes = this._nodes().filter((node) => {
      const nodeDistance = Math.sqrt(
        Math.pow(node.position.x - position.x, 2) +
          Math.pow(node.position.y - position.y, 2)
      );
      return nodeDistance <= searchRadius;
    });

    nearbyNodes.forEach((node) => {
      const handles = this.getNodeHandles(node);

      handles.forEach((handle) => {
        // 跳過來源 handle
        if (
          fromHandle.nodeId === handle.nodeId &&
          fromHandle.type === handle.type &&
          fromHandle.id === handle.id
        ) {
          return;
        }

        // 只允許相對類型的連接：source -> target 或 target -> source
        const isValidHandleType =
          (fromHandle.type === 'source' && handle.type === 'target') ||
          (fromHandle.type === 'target' && handle.type === 'source');

        if (!isValidHandleType) {
          return;
        }

        const distance = Math.sqrt(
          Math.pow(handle.x - position.x, 2) +
            Math.pow(handle.y - position.y, 2)
        );

        // 只考慮在連接半徑內的 handle
        if (distance > connectionRadius) {
          return;
        }

        if (distance < minDistance) {
          closestHandles = [handle];
          minDistance = distance;
        } else if (distance === minDistance) {
          // 當多個 handle 距離相同時，收集所有的
          closestHandles.push(handle);
        }
      });
    });

    if (!closestHandles.length) {
      return null;
    }

    // 當多個 handle 重疊時，優先選擇相對的 handle 類型
    if (closestHandles.length > 1) {
      const oppositeHandleType =
        fromHandle.type === 'source' ? 'target' : 'source';
      return (
        closestHandles.find((handle) => handle.type === oppositeHandleType) ??
        closestHandles[0]
      );
    }

    return closestHandles[0];
  }

  // 獲取節點的所有 handle
  private getNodeHandles(node: NodeType): Handle[] {
    // 優先使用DOM測量的handle bounds
    const handleBounds = this.measureNodeHandleBounds(node.id);
    if (handleBounds) {
      const handles: Handle[] = [];
      const internals = this._nodeInternals().get(node.id);
      
      if (internals) {
        // 將相對位置轉換為絕對位置
        handleBounds.source.forEach(h => {
          handles.push({
            ...h,
            x: internals.positionAbsolute.x + h.x + h.width / 2,
            y: internals.positionAbsolute.y + h.y + h.height / 2
          });
        });
        
        handleBounds.target.forEach(h => {
          handles.push({
            ...h,
            x: internals.positionAbsolute.x + h.x + h.width / 2,
            y: internals.positionAbsolute.y + h.y + h.height / 2
          });
        });
      }
      
      return handles;
    }
    
    // 備用方法：使用計算位置
    const handles: Handle[] = [];
    const internals = this._nodeInternals().get(node.id);
    const nodeWidth = internals?.measured.width || node.width || 150;
    const nodeHeight = internals?.measured.height || node.height || 40;

    // 根據節點類型決定有哪些 handles
    const hasSourceHandle =
      !node.type || node.type === 'default' || node.type === 'input';
    const hasTargetHandle =
      !node.type || node.type === 'default' || node.type === 'output';

    if (hasSourceHandle) {
      const sourcePosition = this.calculateHandlePosition(
        node,
        'source',
        node.sourcePosition,
        nodeWidth,
        nodeHeight
      );
      handles.push({
        id: null,
        nodeId: node.id,
        position: node.sourcePosition || Position.Bottom,
        type: 'source',
        x: sourcePosition.x,
        y: sourcePosition.y,
      });
    }

    if (hasTargetHandle) {
      const targetPosition = this.calculateHandlePosition(
        node,
        'target',
        node.targetPosition,
        nodeWidth,
        nodeHeight
      );
      handles.push({
        id: null,
        nodeId: node.id,
        position: node.targetPosition || Position.Top,
        type: 'target',
        x: targetPosition.x,
        y: targetPosition.y,
      });
    }

    return handles;
  }

  // 交互性控制方法
  setNodesDraggable(draggable: boolean) {
    this._nodesDraggable.set(draggable);
  }

  setNodesConnectable(connectable: boolean) {
    this._nodesConnectable.set(connectable);
  }

  setElementsSelectable(selectable: boolean) {
    this._elementsSelectable.set(selectable);
  }

  setInteractivity(interactive: boolean) {
    this._nodesDraggable.set(interactive);
    this._nodesConnectable.set(interactive);
    this._elementsSelectable.set(interactive);
  }

  // 自動平移到節點功能 - 與 React 版本一致的行為
  panToNodeOnFocus(nodeId: string): void {
    if (!this._autoPanOnNodeFocus()) {
      return; // 如果未啟用自動平移，直接返回
    }

    const node = this.nodeLookup().get(nodeId);
    if (!node) {
      return;
    }

    const dimensions = this._dimensions();
    const viewport = this._viewport();

    // 檢查節點是否已經在視窗範圍內（與 React 版本一致）
    const transform: Transform = [viewport.x, viewport.y, viewport.zoom];
    const viewportRect: Rect = { x: 0, y: 0, width: dimensions.width, height: dimensions.height };
    
    // 創建只包含當前節點的 Map 來檢查是否在視窗內
    const singleNodeLookup = new Map();
    const internalNode = this.internalNodeLookup().get(nodeId);
    if (internalNode) {
      singleNodeLookup.set(nodeId, internalNode);
    }

    // 使用 getNodesInside 檢查節點是否在視窗範圍內
    const nodesInViewport = getNodesInside(
      singleNodeLookup,
      viewportRect,
      transform,
      true // partially = true，與 React 版本一致
    );

    // 如果節點已經在視窗範圍內，不需要移動（與 React 版本一致）
    if (nodesInViewport.length > 0) {
      return;
    }

    // 節點不在視窗範圍內，移動到節點中心
    const nodeWidth = (node as any).width || 150;
    const nodeHeight = (node as any).height || 32;
    
    // 計算節點中心點
    const nodeCenterX = node.position.x + nodeWidth / 2;
    const nodeCenterY = node.position.y + nodeHeight / 2;
    
    // 計算視窗中心點
    const viewportCenterX = dimensions.width / 2;
    const viewportCenterY = dimensions.height / 2;
    
    // 計算需要的平移量，與 React 版本的 setCenter 邏輯一致
    const targetX = viewportCenterX - nodeCenterX * viewport.zoom;
    const targetY = viewportCenterY - nodeCenterY * viewport.zoom;
    
    const newViewport = {
      x: targetX,
      y: targetY,
      zoom: viewport.zoom,
    };

    // 使用 PanZoom 實例進行平滑動畫（保留平滑動畫效果）
    if (this.panZoom && typeof this.panZoom.setViewport === 'function') {
      this.panZoom.setViewport(newViewport, { 
        duration: 200 // 保留 200ms 平滑動畫
      });
    } else {
      // 如果沒有 PanZoom 實例，直接更新 viewport  
      this._viewport.set(newViewport);
    }
  }
}
