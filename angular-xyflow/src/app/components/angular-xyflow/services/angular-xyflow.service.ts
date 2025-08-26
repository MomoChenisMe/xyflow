// Angular 核心模組
import { Injectable, signal, computed, Signal, effect, inject } from '@angular/core';

// 交集檢測工具
import { isRectIntersecting, nodeToRect } from '../utils/intersection-utils';

// XyFlow 系統模組
import {
  type PanZoomInstance,
  type XYDragInstance,
  type XYPosition,
  type Connection,
  type Transform,
  type Rect,
  Position,
  ColorMode,
  ColorModeClass,
  ConnectionMode,
  getNodesInside,
  getNodePositionWithOrigin,
  updateNodeInternals as systemUpdateNodeInternals,
  getDimensions,
  type InternalNodeUpdate,
} from '@xyflow/system';

// 專案內部模組
import {
  AngularNode,
  AngularEdge,
  Viewport,
  AngularXYFlowInstance,
  ConnectionState,
  NoConnection,
  ConnectionInProgress,
  Handle,
  HandleType,
  NodeChange,
  EdgeChange,
  NodeSelectionChange,
  EdgeSelectionChange,
  NodePositionChange,
  NodeDimensionChange,
  NodeRemoveChange,
  EdgeRemoveChange,
  NodeAddChange,
  EdgeAddChange,
  ConnectionInfo,
} from '../types';

// 確保類型導入正確
type ConnectionInfoType = ConnectionInfo;

import { AngularFlowStore, createInitialStore } from '../types/store';
import { applyNodeChanges, applyEdgeChanges } from '../utils/changes';
import { KeyboardService } from './keyboard.service';

@Injectable({
  providedIn: 'root'
})
export class AngularXYFlowService<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> {
  // 注入鍵盤服務
  private _keyboardService = inject(KeyboardService);

  // 持久化存储节点的 handle 位置，类似 React Flow 的行为
  private nodeHandleBounds: Map<string, { source: any[]; target: any[] }> =
    new Map();

  // 備用的 handle 元數據（當 DOM 被移除時使用）
  private nodeHandlesCache: Map<string, { source: any[]; target: any[] }> =
    new Map();

  // Angular 專用：三階段測量協調器
  private nodeRenderingStages: Map<
    string,
    {
      componentCreated: boolean; // 階段1：組件創建完成
      domRendered: boolean; // 階段2：DOM 渲染完成
      dimensionsMeasured: boolean; // 階段3：尺寸測量完成
    }
  > = new Map();

  constructor() {
    // 使用 computed 來自動計算節點內部狀態，避免 effect 無窮迴圈
    this._nodeInternals = computed(() => {
      const nodes = this._nodes();
      const measuredDimensions = this._nodeMeasuredDimensions();
      // 讀取觸發器以建立依賴（故意不使用值，只是為了追踪變化）
      this._nodeInternalsUpdateTrigger();
      const internals = new Map();

      nodes.forEach((node) => {
        // 優先使用測量的尺寸，然後是節點的尺寸，最後使用合理的預設值
        // React Flow 使用 initialWidth/initialHeight 作為 fallback。若為 0 會導致節點被過濾掉
        const measuredFromObserver = measuredDimensions.get(node.id);
        const styleWidth = this.getNodeStyleDimension(node, 'width');
        const styleHeight = this.getNodeStyleDimension(node, 'height');

        const measured = measuredFromObserver ||
          node.measured || {
            // 使用與 React Flow 相同的 fallback 邏輯，包括 style 中的尺寸
            // 優先序: node.width -> node.style?.width -> node.initialWidth -> 預設值
            width: styleWidth || (node as any).initialWidth || 150,
            height: styleHeight || (node as any).initialHeight || 80,
          };

        // 節點尺寸計算完成

        // 創建一個包含測量尺寸的節點副本，供 getNodePositionWithOrigin 使用
        // 確保節點有有效的 position 屬性，避免 undefined 錯誤
        const nodeWithMeasured = {
          ...node,
          position: node.position || { x: 0, y: 0 }, // 提供 fallback position
          measured,
          width: measured.width,
          height: measured.height,
        };

        // 計算絕對位置 - 需要考慮 parentId 邏輯
        const nodeOrigin = node.origin || this._nodeOrigin();
        let positionAbsolute: XYPosition;

        if (node.parentId) {
          // 子節點：需要基於父節點的絕對位置計算
          const parentNode = nodes.find(n => n.id === node.parentId);
          if (parentNode) {
            // 遞迴計算父節點的絕對位置（處理多層巢狀）
            const parentAbsolute = this.calculateNodeAbsolutePosition(parentNode, nodes, nodeOrigin);
            positionAbsolute = {
              x: parentAbsolute.x + node.position.x,
              y: parentAbsolute.y + node.position.y
            };
          } else {
            // 找不到父節點，使用相對位置
            positionAbsolute = getNodePositionWithOrigin(nodeWithMeasured, nodeOrigin);
          }
        } else {
          // 根節點：使用正常的位置計算
          positionAbsolute = getNodePositionWithOrigin(nodeWithMeasured, nodeOrigin);
        }

        // 獲取 handle bounds（與 React Flow 一致）
        const handleBounds = this.getNodeHandleBounds(node.id);

        internals.set(node.id, {
          positionAbsolute,
          measured,
          handleBounds: handleBounds || undefined, // 包含 handleBounds，與 React Flow 一致
        });
      });

      return internals;
    });

    // 監聽節點變化，自動管理階段追蹤
    effect(() => {
      const nodes = this._nodes();

      // 初始化新節點的階段追蹤
      nodes.forEach((node) => {
        if (!this.nodeRenderingStages.has(node.id)) {
          this.initializeNodeStages(node.id);
        }
      });

      // 清理已移除節點的階段追蹤
      const currentNodeIds = new Set(nodes.map((n) => n.id));
      for (const [nodeId] of this.nodeRenderingStages) {
        if (!currentNodeIds.has(nodeId)) {
          this.cleanupNodeStages(nodeId);
        }
      }

      // 清理不再存在的節點的 handle bounds 緩存（只在節點真正被移除時）
      for (const nodeId of this.nodeHandleBounds.keys()) {
        if (!currentNodeIds.has(nodeId)) {
          this.nodeHandleBounds.delete(nodeId);
          this.nodeHandlesCache.delete(nodeId);
        }
      }
    });
  }

  // 核心信號狀態
  private _nodes = signal<NodeType[]>([]);
  private _edges = signal<EdgeType[]>([]);
  private _defaultEdgeOptions = signal<Partial<EdgeType> | undefined>(undefined);
  private _viewport = signal<Viewport>({ x: 0, y: 0, zoom: 1 });
  private _selectedNodes = signal<string[]>([]);
  private _selectedEdges = signal<string[]>([]);
  private _selectedHandles = signal<
    Array<{ nodeId: string; handleId?: string; type: 'source' | 'target' }>
  >([]);

  // NodesSelection 相關狀態
  private _nodesSelectionActive = signal<boolean>(false);
  private _userSelectionActive = signal<boolean>(false);
  private _noPanClassName = signal<string>('nopan');
  private _disableKeyboardA11y = signal<boolean>(false);
  private _onSelectionContextMenu = signal<((event: any) => void) | undefined>(undefined);
  private _connectionState = signal<ConnectionState<NodeType>>({
    inProgress: false,
  } as NoConnection);

  // 點擊連接相關 Signal
  private _connectOnClick = signal<boolean>(true);
  private _connectionMode = signal<ConnectionMode>(ConnectionMode.Strict);
  private _connectionClickStartHandle = signal<{
    nodeId: string;
    type: HandleType;
    id: string | null;
  } | null>(null);

  private _initialized = signal<boolean>(false);

  // 存儲最新的 controlled nodes/edges，用於 setNodes/setEdges 函數形式
  private _controlledNodes?: NodeType[];
  private _controlledEdges?: EdgeType[];
  private _minZoom = signal<number>(0.5);
  private _maxZoom = signal<number>(2);
  private _connectionRadius = signal<number>(50);
  private _fitViewQueued = signal<boolean>(false);

  // fitView 延遲執行相關屬性
  private _fitViewOptions: any = undefined;
  private _fitViewResolver: ((value: boolean) => void) | null = null;

  private _nodesDraggable = signal<boolean>(true);
  private _nodesConnectable = signal<boolean>(true);
  private _elementsSelectable = signal<boolean>(true);
  private _nodesFocusable = signal<boolean>(true);
  private _edgesFocusable = signal<boolean>(true);
  private _colorMode = signal<ColorMode>('light');
  private _selectNodesOnDrag = signal<boolean>(false);
  private _autoPanOnNodeFocus = signal<boolean>(false);
  private _snapToGrid = signal<boolean>(false);
  private _snapGrid = signal<[number, number]>([15, 15]);
  private _elevateNodesOnSelect = signal<boolean>(true);
  private _dimensions = signal<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Controlled/Uncontrolled 模式標誌
  private _hasDefaultNodes = signal<boolean>(false);
  private _hasDefaultEdges = signal<boolean>(false);

  // 事件回調
  private _onNodesChange: ((changes: NodeChange<NodeType>[]) => void) | null =
    null;
  private _onEdgesChange: ((changes: EdgeChange<EdgeType>[]) => void) | null =
    null;
  private _onConnect: ((connection: Connection) => void) | null = null;
  private _onConnectStart:
    | ((data: {
        event: MouseEvent;
        nodeId: string;
        handleType: 'source' | 'target';
        handleId?: string;
      }) => void)
    | null = null;
  private _onConnectEnd:
    | ((data: { connection?: Connection; event: MouseEvent }) => void)
    | null = null;
  private _onSelectionChange:
    | ((data: { nodes: NodeType[]; edges: EdgeType[] }) => void)
    | null = null;

  // 統一位置計算系統 - 內部節點狀態管理 (使用 computed 避免無窮迴圈)
  private _nodeMeasuredDimensions = signal<
    Map<string, { width: number; height: number }>
  >(new Map());
  private _nodeOrigin = signal<[number, number]>([0, 0]);
  private _nodeInternalsUpdateTrigger = signal(0); // 用於強制更新 nodeInternals
  private _nodeInternals!: Signal<
    Map<
      string,
      {
        positionAbsolute: XYPosition;
        measured: { width: number; height: number };
      }
    >
  >;

  // 設置事件回調
  setOnNodesChange(
    callback: ((changes: NodeChange<NodeType>[]) => void) | null
  ) {
    this._onNodesChange = callback;
  }

  setOnEdgesChange(
    callback: ((changes: EdgeChange<EdgeType>[]) => void) | null
  ) {
    this._onEdgesChange = callback;
  }

  setOnConnect(callback: ((connection: Connection) => void) | null) {
    this._onConnect = callback;
  }

  setOnConnectStart(
    callback:
      | ((data: {
          event: MouseEvent;
          nodeId: string;
          handleType: 'source' | 'target';
          handleId?: string;
        }) => void)
      | null
  ) {
    this._onConnectStart = callback;
  }

  setOnConnectEnd(
    callback:
      | ((data: { connection?: Connection; event: MouseEvent }) => void)
      | null
  ) {
    this._onConnectEnd = callback;
  }

  setOnSelectionChange(
    callback: ((data: { nodes: NodeType[]; edges: EdgeType[] }) => void) | null
  ) {
    this._onSelectionChange = callback;
  }

  // 點擊連接配置方法
  setConnectOnClick(value: boolean) {
    this._connectOnClick.set(value);
  }

  setConnectionMode(mode: ConnectionMode) {
    this._connectionMode.set(mode);
  }

  // 觸發選擇變化事件
  triggerSelectionChange() {
    if (this._onSelectionChange) {
      const currentNodes = this._nodes();
      const currentEdges = this._edges();

      const selectedNodes = currentNodes.filter((node) => node.selected);
      const selectedEdges = currentEdges.filter((edge) => edge.selected);

      this._onSelectionChange({ nodes: selectedNodes, edges: selectedEdges });
    }
  }

  // 循環保護標記
  private _applyingNodeChanges = false;

  // 觸發節點變更事件
  triggerNodeChanges(changes: NodeChange<NodeType>[]) {
    if (changes.length === 0) return;

    // 防止無限循環
    if (this._applyingNodeChanges) {
      return;
    }

    this._applyingNodeChanges = true;
    try {
      // 總是應用變更到內部狀態
      const currentNodes = this._nodes();
      const newNodes = this.applyNodeChanges(changes, currentNodes);
      this._nodes.set(newNodes);

      // CRITICAL FIX: Update _selectedNodes signal after applying selection changes
      // Check if any of the changes are selection changes
      const hasSelectionChanges = changes.some(change => change.type === 'select');
      if (hasSelectionChanges) {
        // Recalculate selected nodes from the updated node array
        const selectedNodeIds = newNodes
          .filter(node => node.selected)
          .map(node => node.id);
        this._selectedNodes.set(selectedNodeIds);

        // 注意：不要在這裡自動更新 nodesSelectionActive
        // React Flow 只在框選結束時或明確設置時才更新 nodesSelectionActive
        // 單擊節點時會通過 handleNodeClick 設置為 false
      }

      // 如果有外部回調，也要觸發它
      if (this._onNodesChange) {
        this._onNodesChange(changes);
      }
    } finally {
      this._applyingNodeChanges = false;
    }
  }

  // 循環保護標記
  private _applyingEdgeChanges = false;

  // 觸發邊變更事件
  triggerEdgeChanges(changes: EdgeChange<EdgeType>[]) {
    if (changes.length === 0) return;

    // 防止無限循環
    if (this._applyingEdgeChanges) {
      return;
    }

    this._applyingEdgeChanges = true;
    try {
      // 總是應用變更到內部狀態
      const currentEdges = this._edges();
      const newEdges = this.applyEdgeChanges(changes, currentEdges);
      this._edges.set(newEdges);

      // 如果有外部回調，也要觸發它
      if (this._onEdgesChange) {
        this._onEdgesChange(changes);
      }
    } finally {
      this._applyingEdgeChanges = false;
    }
  }

  // 設置 controlled/uncontrolled 模式
  setHasDefaultNodes(value: boolean) {
    this._hasDefaultNodes.set(value);
  }

  setHasDefaultEdges(value: boolean) {
    this._hasDefaultEdges.set(value);
  }

  // 獲取模式狀態
  hasDefaultNodes(): boolean {
    return this._hasDefaultNodes();
  }

  hasDefaultEdges(): boolean {
    return this._hasDefaultEdges();
  }

  // 檢查是否在 controlled 模式 - 與 React Flow 邏輯一致
  private isControlledMode(): boolean {
    // 如果沒有 defaultNodes 和 defaultEdges，就是 controlled 模式
    return !this._hasDefaultNodes() && !this._hasDefaultEdges();
  }

  // 檢查是否有外部節點變更處理器（controlled 模式）
  private _hasExternalNodeChanges(): boolean {
    return !!this._onNodesChange;
  }

  // 檢查是否有外部邊變更處理器（controlled 模式）
  private _hasExternalEdgeChanges(): boolean {
    return !!this._onEdgesChange;
  }

  // 內部方法：應用節點變更到內部狀態
  private applyNodeChanges(changes: NodeChange<NodeType>[], nodes: NodeType[]): NodeType[] {
    return applyNodeChanges(changes, nodes);
  }

  // 內部方法：應用邊變更到內部狀態
  private applyEdgeChanges(changes: EdgeChange<EdgeType>[], edges: EdgeType[]): EdgeType[] {
    return applyEdgeChanges(changes, edges);
  }

  // 內部方法：更新狀態而不觸發事件（用於 controlled 模式同步）
  syncNodesFromControlled(nodes: NodeType[]) {
    this._nodes.set([...nodes]);
    // 保存 controlled nodes 的引用，供 setNodes 使用
    this._controlledNodes = nodes;
  }

  syncEdgesFromControlled(edges: EdgeType[]) {
    this._edges.set([...edges]);
    // 保存 controlled edges 的引用，供 setEdges 使用
    this._controlledEdges = edges;
  }

  // 計算信號 - 唯讀訪問器
  nodes: Signal<NodeType[]> = computed(() => this._nodes());
  edges: Signal<EdgeType[]> = computed(() => this._edges());
  defaultEdgeOptions: Signal<Partial<EdgeType> | undefined> = computed(() =>
    this._defaultEdgeOptions()
  );
  viewport: Signal<Viewport> = computed(() => this._viewport());
  selectedNodes: Signal<string[]> = computed(() =>
    this._nodes().filter(node => node.selected).map(node => node.id)
  );
  selectedEdges: Signal<string[]> = computed(() =>
    this._selectedEdges()
  );
  selectedHandles: Signal<
    Array<{ nodeId: string; handleId?: string; type: 'source' | 'target' }>
  > = computed(() => this._selectedHandles());
  connectionState: Signal<ConnectionState<NodeType>> =
    this._connectionState.asReadonly();

  // 🔑 基礎 Pane 點擊事件阻止條件檢查 - 連接狀態檢查
  connectionInProgress: Signal<boolean> = computed(() => this._connectionState().inProgress);

  // 🔑 用於組件檢查 pane 點擊是否應被阻止的方法
  // 這個方法可以被組件調用，傳入額外的狀態信息
  isPaneClickBlocked(selectionInProgress: boolean, dragging: boolean): boolean {
    const connectionInProgress = this._connectionState().inProgress;

    // 與 React Flow 一致的阻止條件：
    // 1. 選擇操作進行中
    // 2. 連接操作進行中
    // 3. 拖拽操作進行中
    return selectionInProgress || connectionInProgress || dragging;
  }

  // 點擊連接相關的計算信號
  connectOnClick: Signal<boolean> = computed(() => this._connectOnClick());
  connectionMode: Signal<ConnectionMode> = computed(() => this._connectionMode());
  connectionClickStartHandle: Signal<{
    nodeId: string;
    type: HandleType;
    id: string | null;
  } | null> = computed(() => this._connectionClickStartHandle());

  initialized: Signal<boolean> = computed(() => this._initialized());
  minZoom: Signal<number> = computed(() => this._minZoom());
  maxZoom: Signal<number> = computed(() => this._maxZoom());
  connectionRadius: Signal<number> = computed(() =>
    this._connectionRadius()
  );

  // Angular 專用：檢查所有節點是否都完成三個渲染階段
  nodesInitialized: Signal<boolean> = computed(() => {
    const nodes = this._nodes();

    // 如果沒有節點，視為已初始化
    if (nodes.length === 0) {
      return true;
    }

    // 檢查每個節點是否都完成了所有三個階段
    const allInitialized = nodes.every((node) => {
      const stages = this.nodeRenderingStages.get(node.id);
      const isComplete =
        stages &&
        stages.componentCreated &&
        stages.domRendered &&
        stages.dimensionsMeasured;

      return isComplete;
    });

    return allInitialized;
  });

  nodesDraggable: Signal<boolean> = computed(() =>
    this._nodesDraggable()
  );
  nodesConnectable: Signal<boolean> = computed(() =>
    this._nodesConnectable()
  );
  elementsSelectable: Signal<boolean> = computed(() =>
    this._elementsSelectable()
  );
  nodesFocusable: Signal<boolean> = computed(() =>
    this._nodesFocusable()
  );
  edgesFocusable: Signal<boolean> = computed(() =>
    this._edgesFocusable()
  );
  selectNodesOnDrag: Signal<boolean> = computed(() =>
    this._selectNodesOnDrag()
  );
  multiSelectionActive: Signal<boolean> = computed(() =>
    this._keyboardService.multiSelectionActive()
  );
  nodesSelectionActive: Signal<boolean> = computed(() =>
    this._nodesSelectionActive()
  );
  userSelectionActive: Signal<boolean> = computed(() =>
    this._userSelectionActive()
  );
  noPanClassName: Signal<string> = computed(() =>
    this._noPanClassName()
  );
  disableKeyboardA11y: Signal<boolean> = computed(() =>
    this._disableKeyboardA11y()
  );
  onSelectionContextMenu: Signal<((event: any) => void) | undefined> = computed(() =>
    this._onSelectionContextMenu()
  );
  autoPanOnNodeFocus: Signal<boolean> = computed(() =>
    this._autoPanOnNodeFocus()
  );
  snapToGrid: Signal<boolean> = computed(() =>
    this._snapToGrid()
  );
  snapGrid: Signal<[number, number]> = computed(() =>
    this._snapGrid()
  );
  elevateNodesOnSelect: Signal<boolean> = computed(() =>
    this._elevateNodesOnSelect()
  );
  dimensions: Signal<{ width: number; height: number }> = computed(
    () => this._dimensions()
  );
  isInteractive: Signal<boolean> = computed(
    () =>
      this._nodesDraggable() ||
      this._nodesConnectable() ||
      this._elementsSelectable()
  );
  colorMode: Signal<ColorMode> = computed(() => this._colorMode());
  colorModeClass: Signal<ColorModeClass> = computed(() => {
    const mode = this._colorMode();
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return mode as ColorModeClass;
  });

  // Transform 狀態管理 - 用於 PanZoom 服務
  private _transform = signal<Transform>([0, 0, 1]);
  transform: Signal<Transform> = computed(() => this._transform());

  // Transform 方法
  setTransform(transform: Transform): void {
    this._transform.set([...transform]);
  }

  // 單獨的 setViewport 方法（供服務內部使用）
  setViewport(viewport: Viewport): void {
    const currentViewport = this._viewport();
    const hasChanged =
      currentViewport.x !== viewport.x ||
      currentViewport.y !== viewport.y ||
      currentViewport.zoom !== viewport.zoom;

    if (hasChanged) {
      this._viewport.set({ ...viewport });
      this._transform.set([viewport.x, viewport.y, viewport.zoom]);
    }
  }

  // 節點和邊的查找映射 - 效能優化的查找表
  nodeLookup: Signal<Map<string, NodeType>> = computed(() => {
    const lookup = new Map<string, NodeType>();
    const nodes = this._nodes();
    const nodeInternals = this._nodeInternals();

    nodes.forEach((node) => {
      const internals = nodeInternals.get(node.id);
      if (internals) {
        // 🔑 關鍵修正：創建包含 internals 的完整節點，確保保留所有原始屬性
        const nodeWithInternals = {
          ...node, // 保留所有原始屬性，包括 sourcePosition 和 targetPosition
          internals: {
            positionAbsolute: internals.positionAbsolute,
            measured: internals.measured,
            handleBounds: (internals as any).handleBounds, // 確保 handleBounds 被包含
          },
          // 確保 measured 屬性是最新的
          measured: internals.measured,
          // 添加 width 和 height 屬性供 system 函數使用
          width: internals.measured.width,
          height: internals.measured.height,
          // 🔑 明確保留佈局相關屬性（防止被覆蓋）
          sourcePosition: node.sourcePosition,
          targetPosition: node.targetPosition,
        } as NodeType;

        lookup.set(node.id, nodeWithInternals);
      } else {
        lookup.set(node.id, node);
      }
    });

    return lookup;
  });

  edgeLookup: Signal<Map<string, EdgeType>> = computed(() => {
    const lookup = new Map<string, EdgeType>();
    this._edges().forEach((edge) => lookup.set(edge.id, edge));
    return lookup;
  });

  // 連接查找表 - 用於高效查找節點相連的邊
  connectionLookup: Signal<Map<string, Map<string, ConnectionInfoType>>> = computed(() => {
    const edges = this._edges();
    const lookup = new Map<string, Map<string, ConnectionInfoType>>();

    edges.forEach(edge => {
      // 為 source 節點添加連接
      if (!lookup.has(edge.source)) {
        lookup.set(edge.source, new Map());
      }
      lookup.get(edge.source)!.set(edge.id, {
        edgeId: edge.id,
        connectedNode: edge.target,
        sourceHandle: edge.sourceHandle || null,
        targetHandle: edge.targetHandle || null,
        isSource: true
      });

      // 為 target 節點添加連接
      if (!lookup.has(edge.target)) {
        lookup.set(edge.target, new Map());
      }
      lookup.get(edge.target)!.set(edge.id, {
        edgeId: edge.id,
        connectedNode: edge.source,
        sourceHandle: edge.sourceHandle || null,
        targetHandle: edge.targetHandle || null,
        isSource: false
      });
    });

    return lookup;
  });

  // 內部節點查找表 - 用於 getNodesInside 函數和 fitView
  internalNodeLookup = computed(() => {
    const nodes = this._nodes();
    const measuredDimensions = this._nodeMeasuredDimensions();
    const nodeInternals = this._nodeInternals();
    const lookup = new Map();

    nodes.forEach((node) => {
      // 使用實際測量尺寸，優先順序：實際測量 > 節點自帶 measured > 節點 width/height > initialWidth/Height > 默認值
      const measuredFromObserver = measuredDimensions.get(node.id);
      const measured = measuredFromObserver ||
        node.measured || {
          // 使用合理的預設值以避免節點被過濾
          // 使用稍大的預設高度以適應 EasyConnect 節點 (150x80)
          width: (node as any).width || (node as any).initialWidth || 150,
          height: (node as any).height || (node as any).initialHeight || 80,
        };

      // 獲取節點內部狀態中的絕對位置
      const internals = nodeInternals.get(node.id);

      // 獲取緩存的 handle bounds
      const handleBounds = this.getNodeHandleBounds(node.id);

      lookup.set(node.id, {
        ...node,
        measured,
        width: (node as any).width,
        height: (node as any).height,
        initialWidth: (node as any).initialWidth || 150,
        initialHeight: (node as any).initialHeight || 80,
        selectable: true,
        hidden: false,
        internals: {
          positionAbsolute: internals?.positionAbsolute || {
            x: node.position.x,
            y: node.position.y,
          },
          handleBounds: handleBounds || undefined,
          userNode: node, // 保存原始用戶節點的引用
        },
      });
    });
    return lookup;
  });

  // PanZoom 和 Drag 實例 - 型別安全
  private panZoom: PanZoomInstance | null = null;
  private drag: XYDragInstance | null = null;
  private handle: any | null = null;
  containerElement: HTMLElement | null = null;

  // PanZoom 就緒狀態追蹤
  private _panZoomReady = signal(false);
  panZoomReady = computed(() => this._panZoomReady());

  // 獲取容器元素方法 - 提供給子服務使用
  getContainerElement(): HTMLElement | null {
    return this.containerElement;
  }

  // 流程實例API
  getFlowInstance(): AngularXYFlowInstance<NodeType, EdgeType> {
    return {
      getNodes: () => [...this._nodes()],
      getNode: (id: string) => this.nodeLookup().get(id),
      getEdges: () => [...this._edges()],
      getEdge: (id: string) => this.edgeLookup().get(id),
      setNodes: (nodes: NodeType[] | ((nodes: NodeType[]) => NodeType[])) => {
        // 在 controlled 模式下，使用最新同步的 nodes
        // 在 uncontrolled 模式下，使用內部狀態
        const currentNodes = this.isControlledMode()
          ? this._controlledNodes || this._nodes()
          : this._nodes();

        const newNodes =
          typeof nodes === 'function' ? nodes(currentNodes) : [...nodes];

        // 創建 changes - 完整替換所有節點
        const changes: NodeChange<NodeType>[] = [];

        // 先移除所有舊節點
        currentNodes.forEach((node) => {
          changes.push({ type: 'remove', id: node.id });
        });

        // 再添加所有新節點
        newNodes.forEach((node, index) => {
          changes.push({ type: 'add', item: node, index });
        });

        // 在 controlled 模式下，只發出事件，不更新內部狀態
        if (this.isControlledMode()) {
          this.triggerNodeChanges(changes);
        } else {
          // 在 uncontrolled 模式下，更新內部狀態並發出事件
          this._nodes.set(newNodes);
          this.triggerNodeChanges(changes);
        }
      },
      setEdges: (edges: EdgeType[] | ((edges: EdgeType[]) => EdgeType[])) => {
        // 在 controlled 模式下，使用最新同步的 edges
        // 在 uncontrolled 模式下，使用內部狀態
        const currentEdges = this.isControlledMode()
          ? this._controlledEdges || this._edges()
          : this._edges();

        const newEdges =
          typeof edges === 'function' ? edges(currentEdges) : [...edges];

        // 創建 changes - 完整替換所有邊
        const changes: EdgeChange<EdgeType>[] = [];

        // 先移除所有舊邊
        currentEdges.forEach((edge) => {
          changes.push({ type: 'remove', id: edge.id });
        });

        // 再添加所有新邊
        newEdges.forEach((edge, index) => {
          changes.push({ type: 'add', item: edge, index });
        });

        // 🔑 統一狀態更新邏輯：triggerEdgeChanges 負責所有狀態更新
        this.triggerEdgeChanges(changes);
      },
      addNodes: (nodes: NodeType | NodeType[]) => {
        const nodesToAdd = Array.isArray(nodes) ? nodes : [nodes];
        // 為新節點設置默認的 measured 屬性，這對 getNodePositionWithOrigin 很重要
        const nodesWithDefaults = nodesToAdd.map((node) => ({
          ...node,
          measured: node.measured || {
            width: node.width || 150, // 默認寬度與 CSS 一致
            height: node.height || 80, // 默認高度（與React Flow一致）
          },
        }));

        // 創建 add changes
        const changes: NodeChange<NodeType>[] = nodesWithDefaults.map(
          (node) => ({
            type: 'add' as const,
            item: node,
          })
        );

        // 在 controlled 模式下，只發出事件，不更新內部狀態
        if (this.isControlledMode()) {
          this.triggerNodeChanges(changes);
        } else {
          // 在 uncontrolled 模式下，更新內部狀態並發出事件
          const currentNodes = this._nodes();
          this._nodes.set([...currentNodes, ...nodesWithDefaults]);
          this.triggerNodeChanges(changes);
        }
      },
      addEdges: (edges: EdgeType | EdgeType[]) => {
        const edgesToAdd = Array.isArray(edges) ? edges : [edges];

        // 創建 add changes
        const changes: EdgeChange<EdgeType>[] = edgesToAdd.map((edge) => ({
          type: 'add' as const,
          item: edge,
        }));

        // 🔑 統一狀態更新邏輯：triggerEdgeChanges 負責所有狀態更新
        this.triggerEdgeChanges(changes);
      },
      updateNode: (
        id: string,
        nodeUpdate: Partial<NodeType> | ((node: NodeType) => Partial<NodeType>)
      ) => {
        // 在 controlled 模式下，使用最新同步的 nodes
        const currentNodes = this.isControlledMode()
          ? this._controlledNodes || this._nodes()
          : this._nodes();

        const nodeToUpdate = currentNodes.find((n) => n.id === id);
        if (!nodeToUpdate) return;

        const update =
          typeof nodeUpdate === 'function'
            ? nodeUpdate(nodeToUpdate)
            : nodeUpdate;

        const updatedNode = { ...nodeToUpdate, ...update };

        // 創建 replace change
        const changes: NodeChange<NodeType>[] = [
          {
            type: 'replace',
            id,
            item: updatedNode,
          },
        ];

        // 在 controlled 模式下，只發出事件，不更新內部狀態
        if (this.isControlledMode()) {
          this.triggerNodeChanges(changes);
        } else {
          // 在 uncontrolled 模式下，更新內部狀態並發出事件
          const newNodes = currentNodes.map((node) =>
            node.id === id ? updatedNode : node
          );
          this._nodes.set(newNodes);
          this.triggerNodeChanges(changes);
        }
      },
      updateNodeData: (
        id: string,
        dataUpdate: any | ((node: NodeType) => any)
      ) => {
        // 在 controlled 模式下，使用最新同步的 nodes
        const currentNodes = this.isControlledMode()
          ? this._controlledNodes || this._nodes()
          : this._nodes();

        const nodeToUpdate = currentNodes.find((n) => n.id === id);
        if (!nodeToUpdate) return;

        const newData =
          typeof dataUpdate === 'function'
            ? dataUpdate(nodeToUpdate)
            : dataUpdate;

        const updatedNode = {
          ...nodeToUpdate,
          data: { ...nodeToUpdate.data, ...newData },
        };

        // 創建 replace change
        const changes: NodeChange<NodeType>[] = [
          {
            type: 'replace',
            id,
            item: updatedNode,
          },
        ];

        // 在 controlled 模式下，只發出事件，不更新內部狀態
        if (this.isControlledMode()) {
          this.triggerNodeChanges(changes);
        } else {
          // 在 uncontrolled 模式下，更新內部狀態並發出事件
          const newNodes = currentNodes.map((node) =>
            node.id === id ? updatedNode : node
          );
          this._nodes.set(newNodes);
          this.triggerNodeChanges(changes);
        }
      },
      updateEdge: (
        id: string,
        edgeUpdate: Partial<EdgeType> | ((edge: EdgeType) => Partial<EdgeType>)
      ) => {
        // 在 controlled 模式下，使用最新同步的 edges
        const currentEdges = this.isControlledMode()
          ? this._controlledEdges || this._edges()
          : this._edges();

        const edgeToUpdate = currentEdges.find((e) => e.id === id);
        if (!edgeToUpdate) return;

        const update =
          typeof edgeUpdate === 'function'
            ? edgeUpdate(edgeToUpdate)
            : edgeUpdate;

        const updatedEdge = { ...edgeToUpdate, ...update };

        // 創建 replace change
        const changes: EdgeChange<EdgeType>[] = [
          {
            type: 'replace',
            id,
            item: updatedEdge,
          },
        ];

        // 🔑 統一狀態更新邏輯：triggerEdgeChanges 負責所有狀態更新
        this.triggerEdgeChanges(changes);
      },
      deleteElements: (elements: {
        nodes?: { id: string }[];
        edges?: { id: string }[];
      }) => {
        const nodeChanges: NodeChange<NodeType>[] = [];
        const edgeChanges: EdgeChange<EdgeType>[] = [];

        if (elements.nodes?.length) {
          // 創建 remove changes for nodes
          elements.nodes.forEach((node) => {
            nodeChanges.push({
              type: 'remove',
              id: node.id,
            });
          });

          // 在 controlled 模式下，只發出事件，不更新內部狀態
          if (this.isControlledMode()) {
            this.triggerNodeChanges(nodeChanges);
          } else {
            // 在 uncontrolled 模式下，更新內部狀態並發出事件
            const nodeIdsToDelete = new Set(elements.nodes.map((n) => n.id));
            const currentNodes = this._nodes();
            const newNodes = currentNodes.filter(
              (node) => !nodeIdsToDelete.has(node.id)
            );
            this._nodes.set(newNodes);
            this.triggerNodeChanges(nodeChanges);
          }
        }

        if (elements.edges?.length) {
          // 創建 remove changes for edges
          elements.edges.forEach((edge) => {
            edgeChanges.push({
              type: 'remove',
              id: edge.id,
            });
          });

          // 在 controlled 模式下，只發出事件，不更新內部狀態
          if (this.isControlledMode()) {
            this.triggerEdgeChanges(edgeChanges);
          } else {
            // 在 uncontrolled 模式下，更新內部狀態並發出事件
            const edgeIdsToDelete = new Set(elements.edges.map((e) => e.id));
            const currentEdges = this._edges();
            const newEdges = currentEdges.filter(
              (edge) => !edgeIdsToDelete.has(edge.id)
            );
            this._edges.set(newEdges);
            this.triggerEdgeChanges(edgeChanges);
          }
        }
      },

      // ===== 批量操作方法 =====
      // 批量更新節點數據，優化大量節點的更新性能
      batchUpdateNodeData: (updates: Map<string, any>) => {
        if (updates.size === 0) return;

        // 在 controlled 模式下，使用最新同步的 nodes
        const currentNodes = this.isControlledMode()
          ? this._controlledNodes || this._nodes()
          : this._nodes();

        const changes: NodeChange<NodeType>[] = [];
        const updatedNodes = currentNodes.map(node => {
          const dataUpdate = updates.get(node.id);
          if (dataUpdate) {
            const newData = typeof dataUpdate === 'function'
              ? dataUpdate(node)
              : dataUpdate;

            const updatedNode = {
              ...node,
              data: { ...node.data, ...newData }
            };

            changes.push({
              type: 'replace',
              id: node.id,
              item: updatedNode
            });

            return updatedNode;
          }
          return node;
        });

        // 在 controlled 模式下，只發出事件，不更新內部狀態
        if (this.isControlledMode()) {
          this.triggerNodeChanges(changes);
        } else {
          // 在 uncontrolled 模式下，更新內部狀態並發出事件
          this._nodes.set(updatedNodes);
          this.triggerNodeChanges(changes);
        }
      },

      // 批量更新邊緣，優化大量邊緣的更新性能
      batchUpdateEdges: (updates: Map<string, Partial<EdgeType>>) => {
        if (updates.size === 0) return;

        // 在 controlled 模式下，使用最新同步的 edges
        const currentEdges = this.isControlledMode()
          ? this._controlledEdges || this._edges()
          : this._edges();

        const changes: EdgeChange<EdgeType>[] = [];
        const updatedEdges = currentEdges.map(edge => {
          const edgeUpdate = updates.get(edge.id);
          if (edgeUpdate) {
            const updatedEdge = { ...edge, ...edgeUpdate };

            changes.push({
              type: 'replace',
              id: edge.id,
              item: updatedEdge
            });

            return updatedEdge;
          }
          return edge;
        });

        // 更新邊緣狀態並發出變更事件
        if (!this.isControlledMode()) {
          this._edges.set(updatedEdges);
        }
        this.triggerEdgeChanges(changes);
      },

      // 批量設置節點（模擬 React Flow 中的多次 setNodes 調用）
      batchSetNodes: (updateFn: (nodes: NodeType[]) => NodeType[]) => {
        // 在 controlled 模式下，使用最新同步的 nodes
        const currentNodes = this.isControlledMode()
          ? this._controlledNodes || this._nodes()
          : this._nodes();

        const updatedNodes = updateFn([...currentNodes]);

        if (this.isControlledMode()) {
          // controlled 模式下，通過設置函數更新
          this.getFlowInstance().setNodes(updatedNodes);
        } else {
          // uncontrolled 模式下，直接更新內部狀態
          this._nodes.set(updatedNodes);
        }
      },

      fitView: async (options?: any): Promise<boolean> => {
        return new Promise((resolve) => {
          this._fitViewOptions = options;
          this._fitViewResolver = resolve;
          this._fitViewQueued.set(true);

          // 如果節點已經初始化，立即執行
          if (this.nodesInitialized()) {
            requestAnimationFrame(() => {
              this.executeFitView();
            });
          }
          // 否則等待 effect 觸發執行
        });
      },
      setViewport: (viewport: Viewport) => {
        this._viewport.set({ ...viewport });
        this._transform.set([viewport.x, viewport.y, viewport.zoom]);
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
   * 遞迴計算節點的絕對位置（處理 parentId 關係）
   * 與 React Flow 的邏輯一致
   */
  private calculateNodeAbsolutePosition(
    node: NodeType,
    allNodes: NodeType[],
    nodeOrigin: [number, number]
  ): XYPosition {
    if (node.parentId) {
      // 找到父節點
      const parentNode = allNodes.find(n => n.id === node.parentId);
      if (parentNode) {
        // 遞迴計算父節點的絕對位置
        const parentAbsolute = this.calculateNodeAbsolutePosition(parentNode, allNodes, nodeOrigin);
        // 子節點的絕對位置 = 父節點絕對位置 + 子節點相對位置
        return {
          x: parentAbsolute.x + node.position.x,
          y: parentAbsolute.y + node.position.y
        };
      }
    }

    // 根節點或找不到父節點：使用正常的位置計算
    const nodeWithMeasured = {
      ...node,
      position: node.position || { x: 0, y: 0 },
      measured: node.measured || { width: 150, height: 36 }
    };
    return getNodePositionWithOrigin(nodeWithMeasured, nodeOrigin);
  }

  /**
   * 獲取節點的視覺位置（用於 transform）
   */
  getNodeVisualPosition(node: NodeType): XYPosition {
    const internals = this._nodeInternals().get(node.id);
    if (internals) {
      return internals.positionAbsolute;
    }
    // 備用計算 - 使用節點特定的 origin 或全局 origin
    const nodeOrigin = node.origin || this._nodeOrigin();
    return getNodePositionWithOrigin(node, nodeOrigin);
  }

  /**
   * 獲取節點的內部狀態
   */
  getNodeInternals(nodeId: string): {
    positionAbsolute: XYPosition;
    measured: { width: number; height: number };
    handleBounds?: { source: any[]; target: any[] };
  } | null {
    const internals = this._nodeInternals().get(nodeId);
    if (!internals) return null;

    // 包含 handleBounds（如果有的話）
    const handleBounds = this.nodeHandleBounds.get(nodeId);
    return {
      ...internals,
      handleBounds: handleBounds || undefined,
    };
  }

  /**
   * 獲取節點原點設定
   */
  getNodeOrigin(): [number, number] {
    return this._nodeOrigin();
  }

  /**
   * 設置節點原點
   */
  setNodeOrigin(origin: [number, number]): void {
    this._nodeOrigin.set(origin);
  }

  /**
   * 將 position 字符串轉換為 Position enum
   */
  private stringToPositionEnum(position: string): Position {
    switch (position) {
      case 'top':
        return Position.Top;
      case 'right':
        return Position.Right;
      case 'bottom':
        return Position.Bottom;
      case 'left':
        return Position.Left;
      default:
        return Position.Bottom;
    }
  }

  /**
   * 測量節點的實際 Handle bounds（類似 React 版本的 getHandleBounds）
   */
  measureNodeHandleBounds(
    nodeId: string
  ): { source: any[]; target: any[] } | null {
    // 限制在當前Flow實例的容器範圍內查詢節點
    const container = this.getContainerElement();
    if (!container) {
      return null;
    }

    const nodeElement = container.querySelector(
      `[data-node-id="${nodeId}"]`
    ) as HTMLElement;
    if (!nodeElement) return null;

    const nodeBounds = nodeElement.getBoundingClientRect();
    const viewport = this._viewport();
    const zoom = viewport.zoom;

    const sourceHandles = nodeElement.querySelectorAll('.source');
    const targetHandles = nodeElement.querySelectorAll('.target');

    const source = Array.from(sourceHandles).map((handle): any => {
      const handleElement = handle as HTMLElement;
      const handleBounds = handleElement.getBoundingClientRect();
      // 使用 offsetWidth/offsetHeight 獲取原始尺寸（不受 transform 影響）
      // 這與 React 版本的 getDimensions 一致
      const width = handleElement.offsetWidth;
      const height = handleElement.offsetHeight;
      // x, y 是變換後的位置（左上角）
      const x = (handleBounds.left - nodeBounds.left) / zoom;
      const y = (handleBounds.top - nodeBounds.top) / zoom;

      // 將 position 字符串轉換為 Position enum
      const positionStr = handle.getAttribute('data-handlepos') || 'bottom';
      const positionEnum = this.stringToPositionEnum(positionStr);

      const handleData = {
        id: handle.getAttribute('data-handleid') || null,
        type: 'source' as const,
        nodeId,
        position: positionEnum,
        x: x,
        y: y,
        width: width,
        height: height,
      };

      return handleData;
    });

    const target = Array.from(targetHandles).map((handle): any => {
      const handleElement = handle as HTMLElement;
      const handleBounds = handleElement.getBoundingClientRect();
      // 使用 offsetWidth/offsetHeight 獲取原始尺寸（不受 transform 影響）
      // 這與 React 版本的 getDimensions 一致
      const width = handleElement.offsetWidth;
      const height = handleElement.offsetHeight;
      // x, y 是變換後的位置（左上角）
      const x = (handleBounds.left - nodeBounds.left) / zoom;
      const y = (handleBounds.top - nodeBounds.top) / zoom;


      // 將 position 字符串轉換為 Position enum
      const positionStr = handle.getAttribute('data-handlepos') || 'top';
      const positionEnum = this.stringToPositionEnum(positionStr);


      const handleData = {
        id: handle.getAttribute('data-handleid') || null,
        type: 'target' as const,
        nodeId,
        position: positionEnum,
        x: x,
        y: y,
        width: width,
        height: height,
      };

      return handleData;
    });


    return { source, target };
  }

  /**
   * 強制清除所有節點的 handleBounds 緩存並重新測量
   */
  forceRefreshHandleBounds(): void {
    this.nodeHandleBounds.clear();
    this.nodeHandlesCache.clear();

    // 觸發重新測量
    this._nodeInternalsUpdateTrigger.update((v) => v + 1);
  }

  /**
   * 獲取 Handle 的絕對位置
   */
  getHandlePositionAbsolute(
    nodeId: string,
    handleType: 'source' | 'target',
    handlePosition?: Position,
    handleId?: string | null
  ): XYPosition | null {
    const node = this._nodes().find((n) => n.id === nodeId);
    const internals = this._nodeInternals().get(nodeId);

    if (!node || !internals) return null;

    // 嘗試從 handle bounds 獲取具體的 handle
    const handleBounds = this.getNodeHandleBounds(nodeId);
    let handle: any = null;

    if (handleBounds) {
      const handles =
        handleType === 'source' ? handleBounds.source : handleBounds.target;
      if (handles && handles.length > 0) {
        // 如果沒有指定 handleId，使用第一個 handle；否則根據 id 查找
        handle = !handleId
          ? handles[0]
          : handles.find((h: any) => h.id === handleId);
      }
    }

    const position =
      handlePosition ||
      handle?.position ||
      (handleType === 'source' ? Position.Bottom : Position.Top);

    // 如果有具體的 handle，使用其位置和尺寸
    // 重要：handle.x 和 handle.y 是經過 CSS transform 後的位置
    // CSS transform 已經將 Handle 移動到視覺位置（例如 bottom handle 向下偏移 50%）
    // 所以 handle 的位置實際上已經接近中心點
    if (handle) {
      const x = (handle.x ?? 0) + internals.positionAbsolute.x;
      const y = (handle.y ?? 0) + internals.positionAbsolute.y;
      // handle.width 和 handle.height 是 offsetWidth/offsetHeight（包含 border）
      // 對於 6px + 1px border 的 Handle，實際是 8x8
      const width = handle.width ?? 8;
      const height = handle.height ?? 8;

      // 根據 position 計算 Edge 端點位置
      // Edge 應該連接到 Handle 的邊緣，而不是中心
      let result: XYPosition;
      const centerX = x + width / 2;
      const centerY = y + height / 2;

      switch (position) {
        case Position.Top:
          // Edge 連接到 Handle 的頂部邊緣
          result = { x: centerX, y };
          break;
        case Position.Right:
          // Edge 連接到 Handle 的右邊緣
          result = { x: x + width, y: centerY };
          break;
        case Position.Bottom:
          // Edge 連接到 Handle 的底部邊緣
          result = { x: centerX, y: y + height };
          break;
        case Position.Left:
          // Edge 連接到 Handle 的左邊緣
          result = { x, y: centerY };
          break;
        default:
          // 預設返回中心點
          result = { x: centerX, y: centerY };
      }

      return result;
    }

    // 備用：如果沒有 handle bounds，使用節點尺寸（保持原有邏輯）
    const { width, height } = internals.measured;
    const { x, y } = internals.positionAbsolute;

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
   * 強制更新節點的內部資訊（包括 handle bounds）
   * 類似 React Flow 的 useUpdateNodeInternals
   * 用於當 handles 條件渲染時手動觸發更新
   */
  updateNodeInternals(nodeIds: string | string[]) {
    const ids = Array.isArray(nodeIds) ? nodeIds : [nodeIds];

    // 測量並存储 handle 位置
    requestAnimationFrame(() => {
      ids.forEach((nodeId) => {
        const bounds = this.measureNodeHandleBounds(nodeId);
        if (bounds && (bounds.source.length > 0 || bounds.target.length > 0)) {
          // 儲存到兩個地方：主要快取和備用快取
          this.nodeHandleBounds.set(nodeId, bounds);
          this.nodeHandlesCache.set(nodeId, bounds);
        }
      });

      // 觸發 computed signal 更新
      this._nodeInternalsUpdateTrigger.update((v) => v + 1);
    });
  }

  /**
   * 獲取快取的 handle bounds（用於 DOM 被移除時的備用）
   */
  getNodeHandleBounds(nodeId: string) {
    // 優先返回主要快取，如果沒有則返回備用快取
    return (
      this.nodeHandleBounds.get(nodeId) || this.nodeHandlesCache.get(nodeId)
    );
  }

  /**
   * 直接設定 handle bounds（用於初始化）
   */
  setNodeHandleBounds(
    nodeId: string,
    bounds: { source: any[]; target: any[] }
  ) {
    if (bounds && (bounds.source.length > 0 || bounds.target.length > 0)) {
      this.nodeHandleBounds.set(nodeId, bounds);
      this.nodeHandlesCache.set(nodeId, bounds);
    }
  }

  /**
   * 更新節點的測量尺寸（由 ResizeObserver 調用）
   */
  updateNodeMeasuredDimensions(
    nodeId: string,
    dimensions: { width: number; height: number }
  ) {
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

      // 創建 add change
      const changes: EdgeChange<EdgeType>[] = [
        {
          type: 'add',
          item: newEdge,
        },
      ];

      // 在 controlled 模式下，只發出事件，不更新內部狀態
      // 在 uncontrolled 模式下，triggerEdgeChanges 會處理內部狀態更新
      this.triggerEdgeChanges(changes);
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

    // 檢查是否已存在相同連接 - 使用與 @xyflow/system 相同的邏輯
    const existingEdge = this._edges().some(
      (edge) =>
        edge.source === source &&
        edge.target === target &&
        (edge.sourceHandle === sourceHandle || (!edge.sourceHandle && !sourceHandle)) &&
        (edge.targetHandle === targetHandle || (!edge.targetHandle && !targetHandle))
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
    // 使用與 @xyflow/system 相同的 ID 生成模式
    const edgeId = `xy-edge__${connection.source}${connection.sourceHandle || ''}-${connection.target}${connection.targetHandle || ''}`;

    return {
      id: edgeId,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'default',
    } as EdgeType;
  }

  // 點擊連接管理方法
  startClickConnection(handle: { nodeId: string; type: HandleType; id: string | null }) {
    this._connectionClickStartHandle.set(handle);

    // 觸發 onConnectStart 事件
    if (this._onConnectStart) {
      this._onConnectStart({
        event: new MouseEvent('click') as any, // 模擬事件
        nodeId: handle.nodeId,
        handleType: handle.type,
        handleId: handle.id || undefined
      });
    }
  }

  completeClickConnection(event: MouseEvent, targetHandle: {
    nodeId: string;
    type: HandleType;
    id: string | null;
  }) {

    const startHandle = this._connectionClickStartHandle();
    if (!startHandle) {
      return;
    }


    // 驗證連接
    const connection = this.validateClickConnection(startHandle, targetHandle);

    let finalConnection: Connection | undefined;

    if (connection && this.isValidConnection(connection)) {
      finalConnection = connection;
      this.onConnect(connection);

      // 確認是否觸發了外部事件
      if (this._onConnect) {
        this._onConnect(connection);
      }
    }

    // 觸發 onConnectEnd 事件
    if (this._onConnectEnd) {
      this._onConnectEnd({
        connection: finalConnection,
        event
      });
    }

    // 清理狀態
    this._connectionClickStartHandle.set(null);
  }

  private validateClickConnection(
    fromHandle: { nodeId: string; type: HandleType; id: string | null },
    toHandle: { nodeId: string; type: HandleType; id: string | null }
  ): Connection | null {
    const connectionMode = this._connectionMode();

    // Strict 模式驗證
    if (connectionMode === ConnectionMode.Strict) {
      if (fromHandle.type === toHandle.type) {
        return null; // 同類型不能連接
      }
    }

    // Loose 模式驗證
    if (connectionMode === ConnectionMode.Loose) {
      // 不允許自己連接自己的同一個 handle
      if (fromHandle.nodeId === toHandle.nodeId && fromHandle.id === toHandle.id) {
        return null;
      }
    }

    // 不允許連接到同一個節點（除非在 Loose 模式下的不同 handle）
    if (fromHandle.nodeId === toHandle.nodeId && connectionMode === ConnectionMode.Strict) {
      return null;
    }

    return {
      source: fromHandle.type === 'source' ? fromHandle.nodeId : toHandle.nodeId,
      target: fromHandle.type === 'target' ? fromHandle.nodeId : toHandle.nodeId,
      sourceHandle: fromHandle.type === 'source' ? fromHandle.id : toHandle.id,
      targetHandle: fromHandle.type === 'target' ? fromHandle.id : toHandle.id,
    };
  }

  // 清理方法 - 釋放資源
  destroy(): void {
    this.panZoom?.destroy();
    this.drag?.destroy();
    this.handle?.destroy();
    this._initialized.set(false);
  }

  // 節點選擇 - 支援單選和多選
  // 🔥 FIXED VERSION - 使用 NodeChange 機制
  selectNode(nodeId: string, multiSelect = false): void {
    // 🔑 關鍵修正：檢查 elementsSelectable 狀態
    if (!this._elementsSelectable()) {
      return;
    }

    const currentNodes = this._nodes();
    const currentEdges = this._edges();
    const nodeChanges: NodeChange<NodeType>[] = [];
    const edgeChanges: EdgeChange<EdgeType>[] = [];

    if (multiSelect) {
      // 多選模式：如果目標節點未選中，選中它（其他已選中的節點保持選中）
      const targetNode = currentNodes.find(n => n.id === nodeId);
      if (targetNode && !targetNode.selected) {
        nodeChanges.push({ type: 'select', id: nodeId, selected: true });
      }
    } else {
      // 單選模式：只選中目標節點，取消其他所有選中的節點和邊
      currentNodes.forEach(node => {
        if (node.id === nodeId && !node.selected) {
          // 選中目標節點
          nodeChanges.push({ type: 'select', id: node.id, selected: true });
        } else if (node.id !== nodeId && node.selected) {
          // 取消選中其他節點
          nodeChanges.push({ type: 'select', id: node.id, selected: false });
        }
      });

      // 在單選模式下，也要清除所有邊的選擇（符合 React Flow 行為）
      currentEdges.forEach(edge => {
        if (edge.selected) {
          edgeChanges.push({
            type: 'select',
            id: edge.id,
            selected: false,
          });
        }
      });

      // 清除邊的選擇列表
      this._selectedEdges.set([]);
    }

    // 🔑 統一狀態更新邏輯：triggerChanges 負責所有狀態更新
    if (nodeChanges.length > 0) {
      this.triggerNodeChanges(nodeChanges);
    }
    if (edgeChanges.length > 0) {
      this.triggerEdgeChanges(edgeChanges);
    }
  }

  // 取消節點選擇
  unselectNode(nodeId: string): void {
    const currentSelected = this._selectedNodes();

    // 如果節點沒有被選中，直接返回
    if (!currentSelected.includes(nodeId)) {
      return;
    }

    // 🔧 立即修改節點的 selected 屬性
    const currentNodes = this._nodes();
    const targetNode = currentNodes.find(n => n.id === nodeId);
    if (targetNode) {
      targetNode.selected = false;
    }

    const nodeChanges: NodeChange<NodeType>[] = [{
      type: 'select',
      id: nodeId,
      selected: false,
    }];

    // 在 controlled 模式下，只發出事件，不更新狀態
    if (this.isControlledMode()) {
      this.triggerNodeChanges(nodeChanges);
    } else {
      // 在 uncontrolled 模式下，更新內部狀態並發出事件
      this._nodes.update((nodes) =>
        nodes.map((node) =>
          node.id === nodeId ? { ...node, selected: false } : node
        )
      );
      this.triggerNodeChanges(nodeChanges);
    }

    // 觸發選擇變化事件
    this.triggerSelectionChange();
  }

  // 取消邊選擇
  unselectEdge(edgeId: string): void {
    const currentSelected = this._selectedEdges();

    // 如果邊沒有被選中，直接返回
    if (!currentSelected.includes(edgeId)) {
      return;
    }

    // 🔧 立即修改邊的 selected 屬性
    const currentEdges = this._edges();
    const targetEdge = currentEdges.find(e => e.id === edgeId);
    if (targetEdge) {
      targetEdge.selected = false;
    }

    const edgeChanges: EdgeChange<EdgeType>[] = [{
      type: 'select',
      id: edgeId,
      selected: false,
    }];

    // 🔑 統一狀態更新邏輯：使用 triggerEdgeChanges 作為唯一入口
    this.triggerEdgeChanges(edgeChanges);

    // 觸發選擇變化事件
    this.triggerSelectionChange();
  }

  /**
   * 添加選中的邊 - 與 React Flow 的 addSelectedEdges 方法一致
   * 在單選模式下會清除其他所有選擇
   * 在多選模式下只添加新的邊到選擇中
   */
  addSelectedEdges(edgeIds: string[]): void {
    const multiSelectionActive = this.multiSelectionActive();
    const currentNodes = this._nodes();
    const currentEdges = this._edges();

    const nodeChanges: NodeChange<NodeType>[] = [];
    const edgeChanges: EdgeChange<EdgeType>[] = [];

    if (multiSelectionActive) {
      // 多選模式：只添加新選擇的邊
      edgeIds.forEach(edgeId => {
        const edge = currentEdges.find(e => e.id === edgeId);
        if (edge && !edge.selected) {
          edgeChanges.push({
            type: 'select',
            id: edgeId,
            selected: true
          });
        }
      });

      // 更新選中邊列表（添加新的）
      const currentSelected = this._selectedEdges();
      const newSelected = [...new Set([...currentSelected, ...edgeIds])];
      this._selectedEdges.set(newSelected);
    } else {
      // 單選模式：清除其他所有選擇，只選中指定邊
      const selectedEdgeIds = new Set(edgeIds);

      // 清除所有不在新選擇中的邊
      currentEdges.forEach(edge => {
        const shouldBeSelected = selectedEdgeIds.has(edge.id);
        if (edge.selected !== shouldBeSelected) {
          edgeChanges.push({
            type: 'select',
            id: edge.id,
            selected: shouldBeSelected
          });
        }
      });

      // 清除所有節點選擇
      currentNodes.forEach(node => {
        if (node.selected) {
          nodeChanges.push({
            type: 'select',
            id: node.id,
            selected: false
          });
        }
      });

      // 更新選中列表
      this._selectedEdges.set(edgeIds);
      this._selectedNodes.set([]);
    }

    // 應用變更
    if (this.isControlledMode()) {
      // Controlled 模式：只發出事件
      if (nodeChanges.length > 0) {
        this.triggerNodeChanges(nodeChanges);
      }
      if (edgeChanges.length > 0) {
        this.triggerEdgeChanges(edgeChanges);
      }
    } else {
      // Uncontrolled 模式：更新內部狀態並發出事件
      if (nodeChanges.length > 0) {
        this._nodes.update(nodes =>
          nodes.map(node => {
            const change = nodeChanges.find(c => c.type === 'select' && c.id === node.id) as NodeSelectionChange | undefined;
            if (change) {
              return { ...node, selected: change.selected };
            }
            return node;
          })
        );
        this.triggerNodeChanges(nodeChanges);
      }

      if (edgeChanges.length > 0) {
        this._edges.update(edges =>
          edges.map(edge => {
            const change = edgeChanges.find(c => c.type === 'select' && c.id === edge.id) as EdgeSelectionChange | undefined;
            if (change) {
              return { ...edge, selected: change.selected };
            }
            return edge;
          })
        );
        this.triggerEdgeChanges(edgeChanges);
      }
    }

    // 觸發選擇變化事件
    this.triggerSelectionChange();
  }

  // 邊選擇 - 支援單選和多選（與 React Flow 的 addSelectedEdges 邏輯一致）
  selectEdge(edgeId: string, multiSelect = false): void {
    // 🔑 關鍵修正：檢查 elementsSelectable 狀態
    if (!this._elementsSelectable()) {
      return;
    }

    const currentEdges = this._edges();
    const currentNodes = this._nodes();
    const currentSelected = this._selectedEdges();
    const edgeChanges: EdgeChange<EdgeType>[] = [];
    const nodeChanges: NodeChange<NodeType>[] = [];

    let newSelectedEdges: string[];

    if (multiSelect) {
      // 多選模式：只切換目標邊的選擇狀態，不影響節點和其他邊
      const isSelected = currentSelected.includes(edgeId);
      newSelectedEdges = isSelected
        ? currentSelected.filter((id) => id !== edgeId)
        : [...currentSelected, edgeId];

      // 只為目標邊創建 change
      edgeChanges.push({
        type: 'select',
        id: edgeId,
        selected: !isSelected,
      });
    } else {
      // 單選模式：根據 React Flow 的 addSelectedEdges 邏輯
      newSelectedEdges = [edgeId];

      // 為所有邊創建 changes（清除其他邊的選擇，選中目標邊）
      currentEdges.forEach((edge) => {
        const shouldBeSelected = edge.id === edgeId;
        if (edge.selected !== shouldBeSelected) {
          edgeChanges.push({
            type: 'select',
            id: edge.id,
            selected: shouldBeSelected,
          });
        }
      });

      // 清除所有節點的選擇（React Flow 行為）
      currentNodes.forEach((node) => {
        if (node.selected) {
          nodeChanges.push({
            type: 'select',
            id: node.id,
            selected: false,
          });
        }
      });

      this._selectedNodes.set([]);
    }

    // 更新選中邊的列表
    this._selectedEdges.set(newSelectedEdges);

    // 🔑 統一狀態更新邏輯：無論 controlled 或 uncontrolled 模式，都使用 triggerChanges 作為唯一入口
    // triggerEdgeChanges 內部會處理狀態更新，避免重複更新造成的時序問題
    if (edgeChanges.length > 0) {
      this.triggerEdgeChanges(edgeChanges);
    }

    if (nodeChanges.length > 0) {
      this.triggerNodeChanges(nodeChanges);
    }

    // 觸發選擇變化事件
    this.triggerSelectionChange();
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

    const currentNodes = this._nodes();
    const currentEdges = this._edges();
    const nodeChanges: NodeChange<NodeType>[] = [];
    const edgeChanges: EdgeChange<EdgeType>[] = [];

    // 為所有選中的節點創建取消選擇的 changes
    currentNodes.forEach((node) => {
      if (node.selected) {
        nodeChanges.push({
          type: 'select',
          id: node.id,
          selected: false,
        });

        // 讓節點失去焦點，類似 React 版本的 blur() 處理
        requestAnimationFrame(() => {
          const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement;
          if (nodeElement && nodeElement.blur) {
            nodeElement.blur();
          }
        });
      }
    });

    // 為所有選中的邊創建取消選擇的 changes
    currentEdges.forEach((edge) => {
      if (edge.selected) {
        edgeChanges.push({
          type: 'select',
          id: edge.id,
          selected: false,
        });

        // 讓邊失去焦點
        requestAnimationFrame(() => {
          const edgeElement = document.querySelector(`[data-edge-id="${edge.id}"]`) as HTMLElement;
          if (edgeElement && edgeElement.blur) {
            edgeElement.blur();
          }
        });
      }
    });

    // 清除選中列表
    this._selectedNodes.set([]);
    this._selectedEdges.set([]);
    this._selectedHandles.set([]);

    // 🔑 統一狀態更新邏輯：無論 controlled 或 uncontrolled 模式，都使用 triggerChanges 作為唯一入口
    // triggerNodeChanges 和 triggerEdgeChanges 內部會處理狀態更新，避免重複更新造成的時序問題
    if (nodeChanges.length > 0) {
      this.triggerNodeChanges(nodeChanges);
    }

    if (edgeChanges.length > 0) {
      this.triggerEdgeChanges(edgeChanges);
    }

    // 觸發選擇變化事件
    this.triggerSelectionChange();

    // 對應 React Flow Pane/index.tsx:108 邏輯：點擊空白處清除選擇時隱藏 NodesSelection
    this._nodesSelectionActive.set(false);
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
    this._panZoomReady.set(true); // 明確標記就緒狀態
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
  screenToFlow(clientPosition: { x: number; y: number }): {
    x: number;
    y: number;
  } {
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
      y: (containerY - viewport.y) / viewport.zoom,
    };
  }

  // 座標轉換方法：流座標轉螢幕座標
  flowToScreen(flowPosition: { x: number; y: number }): {
    x: number;
    y: number;
  } {
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
      y: containerY + rect.top,
    };
  }

  // 全局事件監聽器管理
  private activeMouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private activeMouseUpHandler: ((e: MouseEvent) => void) | null = null;

  // 連接狀態管理方法
  startConnection(
    fromNode: NodeType,
    fromHandle: Handle,
    fromPosition: { x: number; y: number },
    event?: MouseEvent
  ) {
    // 清理之前的事件監聽器（如果有的話）
    this.cleanupConnectionListeners();

    // 重要：在連接開始前預先快取所有節點的 handle 位置
    // 這樣即使後來 handles 被條件渲染隱藏，我們仍然知道它們的位置
    const allNodes = this._nodes();
    allNodes.forEach((node) => {
      const bounds = this.measureNodeHandleBounds(node.id);
      if (bounds) {
        this.nodeHandleBounds.set(node.id, bounds);
      }
    });

    // 觸發 onConnectStart 事件
    if (event && this._onConnectStart) {
      this._onConnectStart({
        event,
        nodeId: fromNode.id,
        handleType: fromHandle.type,
        handleId: fromHandle.id || undefined,
      });
    }

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

    // 設置全局事件監聽器來處理連線拖曳
    this.activeMouseMoveHandler = (e: MouseEvent) => {
      this.handleConnectionDrag(e);
    };

    this.activeMouseUpHandler = (e: MouseEvent) => {
      this.handleConnectionEnd(e);
    };

    document.addEventListener('mousemove', this.activeMouseMoveHandler);
    document.addEventListener('mouseup', this.activeMouseUpHandler);
  }

  private handleConnectionDrag(event: MouseEvent) {
    const currentState = this._connectionState();
    if (!currentState.inProgress) return;

    // 將螢幕座標轉換為流座標
    const flowPosition = this.screenToFlow({
      x: event.clientX,
      y: event.clientY,
    });

    // 尋找最近的有效 handle 進行磁吸
    const fromHandle = (currentState as ConnectionInProgress<NodeType>)
      .fromHandle;
    const closestHandle = this.findClosestHandle(flowPosition, {
      nodeId: fromHandle.nodeId,
      type: fromHandle.type,
      id: fromHandle.id,
    });

    let finalPosition = flowPosition;
    let toHandle: Handle | null = null;
    let toNode = null;

    if (closestHandle) {
      // 磁吸到最近的 handle
      finalPosition = { x: closestHandle.x, y: closestHandle.y };
      toHandle = closestHandle;
      toNode = this.nodeLookup().get(closestHandle.nodeId) || null;
    }

    // 更新連接狀態
    this.updateConnection(finalPosition, toHandle, toNode);
  }

  private handleConnectionEnd(event: MouseEvent) {
    const currentState = this._connectionState();
    if (!currentState.inProgress) return;

    // 獲取鼠標位置並檢查是否有磁吸的 handle
    const mousePosition = this.screenToFlow({
      x: event.clientX,
      y: event.clientY,
    });

    const fromHandle = (currentState as ConnectionInProgress<NodeType>)
      .fromHandle;
    const closestHandle = this.findClosestHandle(mousePosition, {
      nodeId: fromHandle.nodeId,
      type: fromHandle.type,
      id: fromHandle.id,
    });

    let connection: Connection | undefined;

    if (closestHandle && closestHandle.nodeId !== fromHandle.nodeId) {
      // 檢查連接類型是否有效
      const isValidConnection =
        (fromHandle.type === 'source' && closestHandle.type === 'target') ||
        (fromHandle.type === 'target' && closestHandle.type === 'source');

      if (isValidConnection) {
        connection = {
          source:
            fromHandle.type === 'source'
              ? fromHandle.nodeId
              : closestHandle.nodeId,
          sourceHandle:
            fromHandle.type === 'source' ? fromHandle.id : closestHandle.id,
          target:
            fromHandle.type === 'source'
              ? closestHandle.nodeId
              : fromHandle.nodeId,
          targetHandle:
            fromHandle.type === 'source' ? closestHandle.id : fromHandle.id,
        };
      }
    }

    // 結束連接
    this.endConnection(connection, event);
  }

  private cleanupConnectionListeners() {
    if (this.activeMouseMoveHandler) {
      document.removeEventListener('mousemove', this.activeMouseMoveHandler);
      this.activeMouseMoveHandler = null;
    }
    if (this.activeMouseUpHandler) {
      document.removeEventListener('mouseup', this.activeMouseUpHandler);
      this.activeMouseUpHandler = null;
    }
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

  endConnection(connection?: Connection, event?: MouseEvent) {
    const currentState = this._connectionState();

    // 觸發 onConnectEnd 事件（重要：無論是否有連接都要觸發）
    if (event && this._onConnectEnd) {
      this._onConnectEnd({ connection, event });
    }

    if (currentState.inProgress && connection && currentState.isValid) {
      // 根據 React Flow 的行為：
      // 1. 總是觸發用戶的 onConnect 事件（如果有的話）
      if (this._onConnect) {
        this._onConnect(connection);
      }

      // 2. 只在 uncontrolled 模式下自動添加邊
      if (!this.isControlledMode()) {
        this.onConnect(connection);
      }
    }

    // 重置連接狀態 - 確保連線狀態被清理
    // 這會導致 connectionInProgress computed 信號返回 null
    this._connectionState.set({ inProgress: false });

    // 清理全局事件監聽器
    this.cleanupConnectionListeners();

    // 清理緩存的 handle bounds
  }

  cancelConnection() {
    this._connectionState.set({ inProgress: false });
    // 清理全局事件監聽器
    this.cleanupConnectionListeners();
    // 清理緩存的 handle bounds
  }

  // 計算 handle 的世界座標位置（使用統一位置計算系統）
  calculateHandlePosition(
    node: NodeType,
    handleType: 'source' | 'target',
    handlePosition?: Position,
    nodeWidth: number = 150,
    nodeHeight: number = 40,
    handleId?: string | null
  ): { x: number; y: number } {
    // 使用統一系統獲取 Handle 位置
    const position = this.getHandlePositionAbsolute(
      node.id,
      handleType,
      handlePosition,
      handleId
    );

    if (position) {
      return position;
    }

    // 備用計算（如果統一系統尚未初始化）
    const adjustedPosition = getNodePositionWithOrigin(node, [0, 0]);
    const pos =
      handlePosition ||
      (handleType === 'source' ? Position.Bottom : Position.Top);

    switch (pos) {
      case Position.Top:
        return { x: adjustedPosition.x + nodeWidth / 2, y: adjustedPosition.y };
      case Position.Right:
        return {
          x: adjustedPosition.x + nodeWidth,
          y: adjustedPosition.y + nodeHeight / 2,
        };
      case Position.Bottom:
        return {
          x: adjustedPosition.x + nodeWidth / 2,
          y: adjustedPosition.y + nodeHeight,
        };
      case Position.Left:
        return {
          x: adjustedPosition.x,
          y: adjustedPosition.y + nodeHeight / 2,
        };
      default:
        return {
          x: adjustedPosition.x + nodeWidth / 2,
          y: adjustedPosition.y + nodeHeight / 2,
        };
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

        // React Flow 風格的 DOM 驗證：檢查 handle 是否真的在該位置
        const container = this.getContainerElement();
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const screenX =
            handle.x * this._viewport().zoom +
            this._viewport().x +
            containerRect.left;
          const screenY =
            handle.y * this._viewport().zoom +
            this._viewport().y +
            containerRect.top;

          // 使用 elementFromPoint 檢查該位置是否真的有 handle 元素
          const elementAtPoint = document.elementFromPoint(screenX, screenY);
          const isValidHandle =
            elementAtPoint?.classList.contains('xy-flow__handle') ||
            elementAtPoint?.classList.contains('source') ||
            elementAtPoint?.classList.contains('target');

          // 如果 DOM 驗證失敗，跳過這個 handle（可能被條件渲染移除了）
          if (!isValidHandle) {
            return;
          }
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
    // 優先使用存儲的 handle 位置，如果沒有則實時測量
    let handleBounds = this.nodeHandleBounds.get(node.id);
    if (!handleBounds) {
      const measured = this.measureNodeHandleBounds(node.id);
      if (measured) {
        handleBounds = measured;
        // 如果測量成功，存储起來以備后用
        this.nodeHandleBounds.set(node.id, measured);
      }
    }

    if (handleBounds) {
      const handles: Handle[] = [];
      const internals = this._nodeInternals().get(node.id);

      if (internals) {
        // 將相對位置轉換為絕對位置
        handleBounds.source.forEach((h: any) => {
          handles.push({
            ...h,
            x: internals.positionAbsolute.x + h.x + h.width / 2,
            y: internals.positionAbsolute.y + h.y + h.height / 2,
          });
        });

        handleBounds.target.forEach((h: any) => {
          handles.push({
            ...h,
            x: internals.positionAbsolute.x + h.x + h.width / 2,
            y: internals.positionAbsolute.y + h.y + h.height / 2,
          });
        });
      }

      return handles;
    }

    // 備用方法：使用計算位置
    const handles: Handle[] = [];
    const internals = this._nodeInternals().get(node.id);
    const nodeWidth = internals?.measured.width || node.width || 150;
    const nodeHeight = internals?.measured.height || node.height || 80;

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

  // setMultiSelectionActive 已移除，現在直接從鍵盤服務獲取狀態

  setNodesFocusable(focusable: boolean) {
    this._nodesFocusable.set(focusable);
  }

  setEdgesFocusable(focusable: boolean) {
    this._edgesFocusable.set(focusable);
  }

  setInteractivity(interactive: boolean) {
    this._nodesDraggable.set(interactive);
    this._nodesConnectable.set(interactive);
    this._elementsSelectable.set(interactive);
  }

  setColorMode(colorMode: ColorMode) {
    this._colorMode.set(colorMode);
  }

  setSnapToGrid(snapToGrid: boolean) {
    this._snapToGrid.set(snapToGrid);
  }

  setSnapGrid(snapGrid: [number, number]) {
    this._snapGrid.set(snapGrid);
  }

  setElevateNodesOnSelect(elevateNodesOnSelect: boolean) {
    this._elevateNodesOnSelect.set(elevateNodesOnSelect);
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
    const viewportRect: Rect = {
      x: 0,
      y: 0,
      width: dimensions.width,
      height: dimensions.height,
    };

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
        duration: 200, // 保留 200ms 平滑動畫
      });
    } else {
      // 如果沒有 PanZoom 實例，直接更新 viewport
      this._viewport.set(newViewport);
    }
  }

  // React Flow 風格的輔助方法：獲取符合 fitView 條件的節點（完全模擬 React Flow 的 getFitViewNodes）
  private getFitViewNodes(): Map<string, NodeType> {
    const nodes = this._nodes();
    const options = this._fitViewOptions || {};
    const nodeInternals = this._nodeInternals();
    const fitViewNodes = new Map<string, NodeType>();
    const optionNodeIds = options.nodes
      ? new Set(options.nodes.map((node: any) => node.id))
      : null;

    nodes.forEach((node) => {
      // 使用與 React Flow 完全相同的邏輯：檢查 internals 中的測量尺寸
      const internals = nodeInternals.get(node.id);
      const isVisible =
        internals &&
        internals.measured.width > 0 &&
        internals.measured.height > 0 &&
        (options.includeHiddenNodes || !node.hidden);

      // 只包含在選項中指定的節點（如果有的話）
      if (isVisible && (!optionNodeIds || optionNodeIds.has(node.id))) {
        fitViewNodes.set(node.id, node);
      }
    });

    return fitViewNodes;
  }

  // React Flow 風格的輔助方法：計算節點邊界（完全模擬 React Flow 的 getInternalNodesBounds + nodeToBox）
  private getInternalNodesBounds(nodes: Map<string, NodeType>): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    if (nodes.size === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let box = { x: Infinity, y: Infinity, x2: -Infinity, y2: -Infinity };
    const nodeInternals = this._nodeInternals();

    nodes.forEach((node) => {
      const internals = nodeInternals.get(node.id);
      if (
        internals &&
        internals.measured.width > 0 &&
        internals.measured.height > 0
      ) {
        // 使用與 React Flow nodeToBox 完全相同的邏輯
        const { x, y } = internals.positionAbsolute;
        const width = internals.measured.width;
        const height = internals.measured.height;

        const nodeBox = {
          x,
          y,
          x2: x + width,
          y2: y + height,
        };

        // React Flow 的 getBoundsOfBoxes 邏輯
        box = {
          x: Math.min(box.x, nodeBox.x),
          y: Math.min(box.y, nodeBox.y),
          x2: Math.max(box.x2, nodeBox.x2),
          y2: Math.max(box.y2, nodeBox.y2),
        };
      } else {
      }
    });

    // React Flow 的 boxToRect 轉換
    const bounds = {
      x: box.x,
      y: box.y,
      width: box.x2 - box.x,
      height: box.y2 - box.y,
    };

    return bounds;
  }

  // React Flow 風格的輔助方法：解析 padding 值（模擬 React Flow 的 parsePadding 函數）
  private parsePaddingValue(
    padding:
      | number
      | { top?: number; right?: number; bottom?: number; left?: number },
    width: number,
    height: number
  ): { top: number; right: number; bottom: number; left: number } {
    if (typeof padding === 'number') {
      // React Flow 的關鍵公式：Math.floor((viewport - viewport / (1 + padding)) * 0.5)
      const paddingX = Math.floor((width - width / (1 + padding)) * 0.5);
      const paddingY = Math.floor((height - height / (1 + padding)) * 0.5);

      return {
        top: paddingY,
        right: paddingX,
        bottom: paddingY,
        left: paddingX,
      };
    } else {
      // 對象類型 padding
      return {
        top: padding.top || 0,
        right: padding.right || 0,
        bottom: padding.bottom || 0,
        left: padding.left || 0,
      };
    }
  }

  // 實際執行 fitView 的方法 - 使用與 React Flow 完全一致的邏輯
  private executeFitView(): void {
    try {
      const dimensions = this._dimensions();
      const options = this._fitViewOptions || {};

      // 確保有有效的容器尺寸
      if (dimensions.width === 0 || dimensions.height === 0) {
        this.resolveFitView(false);
        return;
      }

      // 步驟1：獲取符合條件的節點（模擬 React Flow 的 getFitViewNodes）
      const nodesToFit = this.getFitViewNodes();
      if (nodesToFit.size === 0) {
        this.resolveFitView(false);
        return;
      }

      // 步驟2：使用 React Flow 的邊界計算邏輯
      const bounds = this.getInternalNodesBounds(nodesToFit);

      // 步驟3：使用 React Flow 的 padding 計算公式
      const padding = options.padding || 0.1;
      const parsedPadding = this.parsePaddingValue(
        padding,
        dimensions.width,
        dimensions.height
      );

      // 步驟4：計算縮放比例（與 React Flow 一致）
      const availableWidth =
        dimensions.width - parsedPadding.left - parsedPadding.right;
      const availableHeight =
        dimensions.height - parsedPadding.top - parsedPadding.bottom;

      const scaleX = availableWidth / bounds.width;
      const scaleY = availableHeight / bounds.height;
      let zoom = Math.min(scaleX, scaleY);

      // 應用縮放限制
      const minZoom = options.minZoom || this._minZoom();
      const maxZoom = options.maxZoom || this._maxZoom();
      zoom = Math.max(minZoom, Math.min(maxZoom, zoom));

      // 步驟5：計算居中位置（與 React Flow 一致）
      const boundsCenterX = bounds.x + bounds.width / 2;
      const boundsCenterY = bounds.y + bounds.height / 2;
      const viewportCenterX = parsedPadding.left + availableWidth / 2;
      const viewportCenterY = parsedPadding.top + availableHeight / 2;

      const x = viewportCenterX - boundsCenterX * zoom;
      const y = viewportCenterY - boundsCenterY * zoom;

      const newViewport = { x, y, zoom };

      // 使用 PanZoom 實例進行平滑動畫
      if (this.panZoom && typeof this.panZoom.setViewport === 'function') {
        this.panZoom
          .setViewport(newViewport, {
            duration: options.duration || 200,
          })
          .then(() => {
            this.resolveFitView(true);
          })
          .catch(() => {
            this.resolveFitView(false);
          });
      } else {
        // 如果沒有 PanZoom 實例，直接更新 viewport
        this._viewport.set(newViewport);
        this.resolveFitView(true);
      }
    } catch (error) {
      // Error in executeFitView
      this.resolveFitView(false);
    }
  }

  // 解決 fitView Promise
  private resolveFitView(success: boolean): void {
    if (this._fitViewResolver) {
      this._fitViewResolver(success);
      this._fitViewResolver = null;
    }
    this._fitViewOptions = undefined;
    this._fitViewQueued.set(false);
  }

  // Angular 專用：三階段測量管理方法

  /**
   * 初始化節點的渲染階段追蹤
   */
  initializeNodeStages(nodeId: string): void {
    this.nodeRenderingStages.set(nodeId, {
      componentCreated: false,
      domRendered: false,
      dimensionsMeasured: false,
    });
  }

  /**
   * 報告階段1完成：組件創建完成
   */
  reportNodeComponentCreated(nodeId: string): void {
    const stages = this.nodeRenderingStages.get(nodeId);
    if (stages) {
      stages.componentCreated = true;
      this.checkAndExecutePendingFitView();
    }
  }

  /**
   * 報告階段2完成：DOM 渲染完成
   */
  reportNodeDOMRendered(nodeId: string): void {
    const stages = this.nodeRenderingStages.get(nodeId);
    if (stages) {
      stages.domRendered = true;
      this.checkAndExecutePendingFitView();
    }
  }

  /**
   * 報告階段3完成：尺寸測量完成
   */
  reportNodeDimensionsMeasured(
    nodeId: string,
    dimensions: { width: number; height: number },
    nodeElement: HTMLElement
  ): void {
    const stages = this.nodeRenderingStages.get(nodeId);

    if (stages && dimensions.width > 0 && dimensions.height > 0) {
      stages.dimensionsMeasured = true;

      // 與 React Flow 一致：在測量尺寸後立即調用 updateNodeInternals
      this.updateNodeInternalsForElement(nodeId, nodeElement);

      this.checkAndExecutePendingFitView();
    }
  }

  /**
   * 清理節點的階段追蹤（節點被移除時調用）
   * 注意：不清理 nodeHandleBounds，因為這是重要的緩存，即使組件回收也需要保留
   */
  cleanupNodeStages(nodeId: string): void {
    this.nodeRenderingStages.delete(nodeId);
    // 不刪除 nodeHandleBounds - 這是重要的位置緩存
    // this.nodeHandleBounds.delete(nodeId);
  }

  /**
   * 檢查並執行待執行的 fitView
   */
  private checkAndExecutePendingFitView(): void {
    if (
      this._fitViewQueued() &&
      this.nodesInitialized() &&
      this._fitViewResolver
    ) {
      requestAnimationFrame(() => {
        this.executeFitView();
      });
    }
  }

  /**
   * 獲取節點的渲染階段狀態（調試用）
   */
  getNodeStages(nodeId: string) {
    return this.nodeRenderingStages.get(nodeId);
  }

  /**
   * 從節點中提取尺寸，優先序: node.width/height -> node.style?.width/height
   * 與 React Flow 的 getNodeInlineStyleDimensions 邏輯一致
   */
  private getNodeStyleDimension(
    node: any,
    dimension: 'width' | 'height'
  ): number | undefined {
    // 1. 優先使用直接設置的 width/height
    if (node[dimension] !== undefined) {
      return typeof node[dimension] === 'number'
        ? node[dimension]
        : parseFloat(node[dimension]);
    }

    // 2. 然後使用 style 中的 width/height
    if (node.style?.[dimension] !== undefined) {
      const styleValue = node.style[dimension];
      if (typeof styleValue === 'number') {
        return styleValue;
      } else if (typeof styleValue === 'string') {
        // 如果是字串，去除 'px' 後綴並轉換為數字
        const numericValue = parseFloat(styleValue.replace('px', ''));
        return isNaN(numericValue) ? undefined : numericValue;
      }
    }

    return undefined;
  }

  /**
   * 為單一節點調用 system updateNodeInternals邏輯
   * 與 React Flow 一致，用於更新節點的內部狀態和 handle bounds
   */
  private updateNodeInternalsForElement(
    nodeId: string,
    nodeElement: HTMLElement
  ): void {
    const node = this._nodes().find((n) => n.id === nodeId);
    const currentInternals = this._nodeInternals().get(nodeId);

    if (!node || !currentInternals) {
      // Warning: Cannot update internals for node: node or internals not found
      return;
    }

    // 使用 system getDimensions 獲取實際 DOM 尺寸
    const actualDimensions = getDimensions(nodeElement as HTMLDivElement);

    // 直接更新測量尺寸 signal
    this._nodeMeasuredDimensions.update((map) => {
      map.set(nodeId, actualDimensions);
      return map;
    });

    // 觸發重新計算 - 這會使 computed nodeInternals 重新執行
    this._nodeInternalsUpdateTrigger.update((value) => value + 1);
  }

  /**
   * 獲取所有節點的渲染進度概覽（調試用）
   */
  getRenderingProgress() {
    const nodes = this._nodes();
    const total = nodes.length;
    let stage1Complete = 0;
    let stage2Complete = 0;
    let stage3Complete = 0;
    let fullyComplete = 0;

    nodes.forEach((node) => {
      const stages = this.nodeRenderingStages.get(node.id);
      if (stages) {
        if (stages.componentCreated) stage1Complete++;
        if (stages.domRendered) stage2Complete++;
        if (stages.dimensionsMeasured) stage3Complete++;
        if (
          stages.componentCreated &&
          stages.domRendered &&
          stages.dimensionsMeasured
        ) {
          fullyComplete++;
        }
      }
    });

    return {
      total,
      stage1Complete,
      stage2Complete,
      stage3Complete,
      fullyComplete,
      isFullyInitialized: fullyComplete === total,
    };
  }

  /**
   * 設置預設邊線選項
   */
  setDefaultEdgeOptions(options: Partial<EdgeType> | undefined): void {
    this._defaultEdgeOptions.set(options);
  }

  // ===== NodesSelection 相關方法 =====

  /**
   * 設置用戶選擇狀態（正在進行選擇框操作時為 true）
   */
  setUserSelectionActive(active: boolean): void {
    this._userSelectionActive.set(active);
  }

  /**
   * 設置 NodesSelection 激活狀態
   * 與 React Flow 的 setNodesSelectionActive 一致
   */
  setNodesSelectionActive(active: boolean): void {
    this._nodesSelectionActive.set(active);
  }

  /**
   * 更新 NodesSelection 激活狀態
   * 僅在框選結束時調用，根據選中節點數量決定是否顯示 NodesSelection
   * 對應 React Flow 的 Pane/index.tsx:249 邏輯
   */
  updateNodesSelectionActive(): void {
    const selectedNodeIds = this._selectedNodes();
    // 修正：與 React Flow 一致 - 任何選中的節點都會激活 NodesSelection
    // React Flow: nodesSelectionActive: selectedNodeIds.current.size > 0
    const hasAnySelected = selectedNodeIds.length > 0;

    // 只在框選結束時根據選中節點數量設置
    // 這個方法應該只被 selection.service 在框選結束時調用
    this._nodesSelectionActive.set(hasAnySelected);
  }

  /**
   * 更新節點位置
   */
  updateNodes(updatedNodes: NodeType[]): void {
    const currentNodes = this._nodes();
    const nodeMap = new Map(currentNodes.map(node => [node.id, node]));

    // 更新節點位置
    updatedNodes.forEach(updatedNode => {
      nodeMap.set(updatedNode.id, updatedNode);
    });

    this._nodes.set(Array.from(nodeMap.values()));
  }

  /**
   * 處理節點點擊邏輯
   * 整合原先 handle-node-click.ts 的功能，符合 Angular 服務設計模式
   */
  handleNodeClick(nodeId: string, options: { unselect?: boolean } = {}): void {
    const { unselect = false } = options;

    const node = this.nodeLookup().get(nodeId);
    const multiSelectionActive = this.multiSelectionActive();

    if (!node) {
      // Node not found
      return;
    }

    // 重置節點選擇框狀態（對應 React 版本的 nodesSelectionActive）
    // 與 React 版本一致：單擊節點時隱藏 NodesSelection
    this.setNodesSelectionActive(false);

    if (!node.selected) {
      // 選擇節點
      if (multiSelectionActive) {
        // 多選模式：添加到現有選擇
        this.selectNode(nodeId, true);
      } else {
        // 單選模式：清除其他選擇，只選擇此節點
        this.clearSelection();
        this.selectNode(nodeId, false);
      }
    } else if (unselect || (node.selected && multiSelectionActive)) {
      // 取消選擇節點
      this.unselectNode(nodeId);
    } else {
      // 節點已選中，且不是多選模式：切換為只選中此節點
      this.clearSelection();
      this.selectNode(nodeId, false);
    }
  }

  /**
   * 處理邊點擊邏輯
   * 實現與 React Flow 一致的邊選擇行為 - 簡化為兩個分支
   */
  handleEdgeClick(edgeId: string, options: { unselect?: boolean } = {}): void {
    const { unselect = false } = options;

    const edge = this.edgeLookup().get(edgeId);
    const multiSelectionActive = this.multiSelectionActive();

    if (!edge) {
      // Edge not found
      return;
    }

    // 檢查邊是否可選擇
    const elementsSelectable = this.elementsSelectable();
    const isEdgeSelectable = edge.selectable !== undefined ? edge.selectable : elementsSelectable;

    if (!isEdgeSelectable) {
      return;
    }

    // 重置節點選擇框狀態
    this.setNodesSelectionActive(false);

    // 🔥 React Flow 邏輯：只有兩個分支
    if (edge.selected && multiSelectionActive) {
      // 分支1：已選中的邊在多選模式下，取消選擇
      this.unselectEdge(edgeId);
    } else {
      // 分支2：所有其他情況都是選擇邊
      // 包括：未選中的邊（任何模式）、已選中的邊（單選模式）
      this.addSelectedEdges([edgeId]);
    }
  }

  // Z-index 計算函數 - 模擬 React Flow 的 calculateZ 函數行為
  private calculateZ(node: NodeType, nodeIndex: number, selectedNodeIds: string[], elevateOnSelect: boolean): number {
    // React Flow 邏輯：基礎 z-index = node.zIndex || nodeIndex
    const baseZIndex = node.zIndex !== undefined ? node.zIndex : nodeIndex;

    if (elevateOnSelect && selectedNodeIds.includes(node.id)) {
      // 選中的節點獲得 +1000 的 z-index 提升，與 React Flow 一致
      return baseZIndex + 1000;
    }

    return baseZIndex;
  }

  // 公開的 z-index 計算方法，供 controlled 模式使用
  calculateNodeZIndex(node: NodeType, nodeIndex: number, selectedNodeIds: string[], elevateOnSelect: boolean): number {
    return this.calculateZ(node, nodeIndex, selectedNodeIds, elevateOnSelect);
  }

  // 帶有動態 z-index 的節點計算信號
  nodesWithZ: Signal<NodeType[]> = computed(() => {
    const nodes = this._nodes();
    const selectedNodeIds = this._selectedNodes();
    const elevateOnSelect = this._elevateNodesOnSelect();

    return nodes.map((node, index) => ({
      ...node,
      zIndex: this.calculateZ(node, index, selectedNodeIds, elevateOnSelect)
    }));
  });

  /**
   * 獲取與指定節點相交的所有其他節點
   * @param targetNode 目標節點、矩形或包含id的對象
   * @param partially 是否允許部分重疊 (預設: true)
   * @param nodesList 可選的節點清單，預設使用當前所有節點
   * @returns 相交的節點陣列
   */
  getIntersectingNodes(
    targetNode: NodeType | Rect | { id: string },
    partially: boolean = true,
    nodesList?: NodeType[]
  ): NodeType[] {
    const nodes = nodesList || this._nodes();
    const nodeInternals = this._nodeInternals();

    // 將目標轉換為矩形
    let targetRect: Rect;
    if ('x' in targetNode && 'width' in targetNode) {
      targetRect = targetNode as Rect;
    } else if ('position' in targetNode) {
      targetRect = nodeToRect(targetNode as NodeType, nodeInternals);
    } else {
      // 根據 id 查找節點
      const node = nodes.find(n => n.id === (targetNode as any).id);
      if (!node) return [];
      targetRect = nodeToRect(node, nodeInternals);
    }

    // 檢測交集
    return nodes.filter(node => {
      if ('id' in targetNode && node.id === (targetNode as any).id) {
        return false; // 排除自己
      }

      const nodeRect = nodeToRect(node, nodeInternals);
      return isRectIntersecting(targetRect, nodeRect, partially);
    });
  }

  /**
   * 檢測節點是否與指定區域相交
   * @param node 節點、矩形或包含id的對象
   * @param area 目標檢測區域
   * @param partially 是否接受部分重疊 (預設: true)
   * @returns 是否相交
   */
  isNodeIntersecting(
    node: NodeType | Rect | { id: string },
    area: Rect,
    partially: boolean = true
  ): boolean {
    const nodeInternals = this._nodeInternals();

    let nodeRect: Rect;
    if ('x' in node && 'width' in node) {
      nodeRect = node as Rect;
    } else if ('position' in node) {
      nodeRect = nodeToRect(node as NodeType, nodeInternals);
    } else {
      const foundNode = this._nodes().find(n => n.id === (node as any).id);
      if (!foundNode) return false;
      nodeRect = nodeToRect(foundNode, nodeInternals);
    }

    return isRectIntersecting(nodeRect, area, partially);
  }

}
