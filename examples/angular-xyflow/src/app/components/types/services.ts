/**
 * Angular XYFlow 服務類型定義
 * 
 * 定義所有 Angular XYFlow 服務的接口和配置類型
 * 包括核心服務、狀態管理、配置等
 */

import { Signal, WritableSignal, Type } from '@angular/core';
import { Observable } from 'rxjs';
import { 
  AngularNode, 
  NodeComponent,
  InternalAngularNode 
} from './nodes';
import {
  AngularEdge,
  EdgeComponent
} from './edges';
import { 
  Viewport, 
  Transform, 
  XYPosition, 
  CoordinateExtent,
  NodeChange,
  EdgeChange,
  Connection,
  FitViewOptions,
  SelectionRect,
  ConnectionMode,
  PanOnScrollMode,
  SelectionMode
} from './system-types';

// ===================
// 核心服務接口
// ===================

/**
 * Angular Flow 主服務接口
 * 提供流程圖的主要 API 入口點
 */
export interface AngularFlowService<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> {
  // 響應式狀態
  /** 節點列表信號 */
  nodes: Signal<NodeType[]>;
  
  /** 邊線列表信號 */
  edges: Signal<EdgeType[]>;
  
  /** 視窗狀態信號 */
  viewport: Signal<Viewport>;
  
  /** 選中節點信號 */
  selectedNodes: Signal<NodeType[]>;
  
  /** 選中邊線信號 */
  selectedEdges: Signal<EdgeType[]>;
  
  /** 是否正在拖拽信號 */
  isDragging: Signal<boolean>;
  
  /** 是否正在連接信號 */
  isConnecting: Signal<boolean>;
  
  /** 連接狀態信號 */
  connectionStatus: Signal<{
    inProgress: boolean;
    fromNode?: string;
    fromHandle?: string;
    toNode?: string;
    toHandle?: string;
    isValid: boolean;
  }>;
  
  // 節點操作
  /** 設置節點列表 */
  setNodes(nodes: NodeType[]): void;
  
  /** 添加節點 */
  addNode(node: NodeType): void;
  
  /** 更新節點 */
  updateNode(nodeId: string, updates: Partial<NodeType>): void;
  
  /** 更新節點數據 */
  updateNodeData<T = any>(nodeId: string, dataUpdates: Partial<T>): void;
  
  /** 移除節點 */
  removeNode(nodeId: string): void;
  
  /** 根據 ID 獲取節點 */
  getNode(nodeId: string): NodeType | undefined;
  
  /** 獲取內部節點信息 */
  getInternalNode(nodeId: string): InternalAngularNode | undefined;
  
  /** 更新節點內部狀態 */
  updateNodeInternals(nodeIds?: string[]): void;
  
  // 邊線操作
  /** 設置邊線列表 */
  setEdges(edges: EdgeType[]): void;
  
  /** 添加邊線 */
  addEdge(edge: EdgeType): void;
  
  /** 更新邊線 */
  updateEdge(edgeId: string, updates: Partial<EdgeType>): void;
  
  /** 更新邊線數據 */
  updateEdgeData<T = any>(edgeId: string, dataUpdates: Partial<T>): void;
  
  /** 移除邊線 */
  removeEdge(edgeId: string): void;
  
  /** 根據 ID 獲取邊線 */
  getEdge(edgeId: string): EdgeType | undefined;
  
  // 視窗操作
  /** 設置視窗狀態 */
  setViewport(viewport: Viewport, options?: { duration?: number }): void;
  
  /** 獲取視窗狀態 */
  getViewport(): Viewport;
  
  /** 適應視圖 */
  fitView(options?: FitViewOptions): Promise<boolean>;
  
  /** 縮放到指定級別 */
  zoomTo(zoom: number, options?: { duration?: number }): void;
  
  /** 放大 */
  zoomIn(options?: { duration?: number }): void;
  
  /** 縮小 */
  zoomOut(options?: { duration?: number }): void;
  
  /** 設置中心點 */
  setCenter(x: number, y: number, options?: { zoom?: number; duration?: number }): void;
  
  /** 平移 */
  panBy(offset: XYPosition): void;
  
  /** 獲取變換矩陣 */
  getTransform(): Transform;
  
  /** 設置變換矩陣 */
  setTransform(transform: Transform): void;
  
  // 選擇操作
  /** 選擇節點 */
  selectNodes(nodeIds: string[]): void;
  
  /** 選擇邊線 */
  selectEdges(edgeIds: string[]): void;
  
  /** 取消選擇 */
  unselectAll(): void;
  
  /** 取消選擇節點和邊線 */
  unselectNodesAndEdges(params: { nodes?: NodeType[]; edges?: EdgeType[] }): void;
  
  /** 獲取選中的元素 */
  getSelectedElements(): { nodes: NodeType[]; edges: EdgeType[] };
  
  // 連接操作
  /** 開始連接 */
  startConnection(fromHandle: { nodeId: string; handleId?: string; type: 'source' | 'target' }): void;
  
  /** 結束連接 */
  endConnection(): void;
  
  /** 取消連接 */
  cancelConnection(): void;
  
  /** 創建連接 */
  connect(connection: Connection): boolean;
  
  /** 檢查連接是否有效 */
  isValidConnection(connection: Connection): boolean;
  
  // 座標轉換
  /** 屏幕座標轉流程座標 */
  screenToFlowPosition(position: XYPosition): XYPosition;
  
  /** 流程座標轉屏幕座標 */
  flowToScreenPosition(position: XYPosition): XYPosition;
  
  // 工具方法
  /** 重置流程狀態 */
  reset(): void;
  
  /** 銷毀服務 */
  destroy(): void;
  
  /** 獲取流程邊界 */
  getFlowBounds(): { x: number; y: number; width: number; height: number } | null;
  
  /** 獲取節點邊界 */
  getNodesBounds(nodeIds?: string[]): { x: number; y: number; width: number; height: number } | null;
}

/**
 * 流程存儲服務接口
 */
export interface FlowStoreService<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> {
  // 核心狀態信號
  /** 節點狀態 */
  nodes: WritableSignal<NodeType[]>;
  
  /** 邊線狀態 */
  edges: WritableSignal<EdgeType[]>;
  
  /** 視窗狀態 */
  viewport: WritableSignal<Viewport>;
  
  /** 選中狀態 */
  selectedNodes: WritableSignal<Set<string>>;
  selectedEdges: WritableSignal<Set<string>>;
  
  /** 交互狀態 */
  isDragging: WritableSignal<boolean>;
  paneDragging: WritableSignal<boolean>;
  userSelectionActive: WritableSignal<boolean>;
  multiSelectionActive: WritableSignal<boolean>;
  
  /** 連接狀態 */
  connectionInProgress: WritableSignal<boolean>;
  connectionFromHandle: WritableSignal<any>;
  
  // 計算屬性
  /** 可見節點 */
  visibleNodes: Signal<NodeType[]>;
  
  /** 可見邊線 */
  visibleEdges: Signal<EdgeType[]>;
  
  /** 選中節點列表 */
  selectedNodesList: Signal<NodeType[]>;
  
  /** 選中邊線列表 */
  selectedEdgesList: Signal<EdgeType[]>;
  
  /** 是否有選中元素 */
  hasSelection: Signal<boolean>;
  
  /** 節點查找表 */
  nodeLookup: Signal<Map<string, InternalAngularNode>>;
  
  /** 邊線查找表 */
  edgeLookup: Signal<Map<string, EdgeType>>;
  
  // 狀態操作
  /** 應用節點變化 */
  applyNodeChanges(changes: NodeChange<NodeType>[]): void;
  
  /** 應用邊線變化 */
  applyEdgeChanges(changes: EdgeChange<EdgeType>[]): void;
  
  /** 更新視窗 */
  updateViewport(viewport: Partial<Viewport>): void;
  
  /** 更新選擇 */
  updateSelection(params: { nodes?: string[]; edges?: string[]; append?: boolean }): void;
  
  /** 重置狀態 */
  resetState(): void;
  
  /** 獲取狀態快照 */
  getSnapshot(): {
    nodes: NodeType[];
    edges: EdgeType[];
    viewport: Viewport;
    selectedNodes: string[];
    selectedEdges: string[];
  };
  
  /** 恢復狀態快照 */
  restoreSnapshot(snapshot: {
    nodes: NodeType[];
    edges: EdgeType[];
    viewport: Viewport;
    selectedNodes: string[];
    selectedEdges: string[];
  }): void;
}

// ===================
// 特定服務接口
// ===================

/**
 * 節點服務接口
 */
export interface NodeService<NodeType extends AngularNode = AngularNode> {
  /** 創建節點 */
  createNode<T extends Record<string, unknown>>(
    id: string,
    type: string,
    position: XYPosition,
    data: T,
    options?: Partial<NodeType>
  ): NodeType;
  
  /** 複製節點 */
  duplicateNode(nodeId: string, offset?: XYPosition): NodeType | null;
  
  /** 移動節點 */
  moveNode(nodeId: string, position: XYPosition): void;
  
  /** 調整節點大小 */
  resizeNode(nodeId: string, dimensions: { width: number; height: number }): void;
  
  /** 設置節點父級 */
  setNodeParent(nodeId: string, parentId: string | undefined): void;
  
  /** 獲取節點子級 */
  getNodeChildren(nodeId: string): NodeType[];
  
  /** 檢查節點是否在範圍內 */
  isNodeInBounds(nodeId: string, bounds: { x: number; y: number; width: number; height: number }): boolean;
  
  /** 獲取節點相交 */
  getIntersectingNodes(nodeId: string): NodeType[];
  
  /** 驗證節點 */
  validateNode(node: Partial<NodeType>): { isValid: boolean; errors: string[] };
}

/**
 * 邊線服務接口
 */
export interface EdgeService<EdgeType extends AngularEdge = AngularEdge> {
  /** 創建邊線 */
  createEdge<T extends Record<string, unknown>>(
    id: string,
    source: string,
    target: string,
    type?: string,
    data?: T,
    options?: Partial<EdgeType>
  ): EdgeType;
  
  /** 重新連接邊線 */
  reconnectEdge(edgeId: string, newConnection: Connection): boolean;
  
  /** 更新邊線路徑 */
  updateEdgePath(edgeId: string): void;
  
  /** 獲取邊線路徑 */
  getEdgePath(edgeId: string): string | null;
  
  /** 獲取邊線中心點 */
  getEdgeCenter(edgeId: string): XYPosition | null;
  
  /** 檢查邊線是否與矩形相交 */
  isEdgeIntersectingRect(edgeId: string, rect: { x: number; y: number; width: number; height: number }): boolean;
  
  /** 獲取節點的連接邊線 */
  getConnectedEdges(nodeId: string): { incoming: EdgeType[]; outgoing: EdgeType[]; all: EdgeType[] };
  
  /** 驗證邊線 */
  validateEdge(edge: Partial<EdgeType>): { isValid: boolean; errors: string[] };
}

/**
 * 視窗服務接口
 */
export interface ViewportService {
  /** 獲取可見區域 */
  getVisibleBounds(): { x: number; y: number; width: number; height: number };
  
  /** 計算適應視圖的變換 */
  calculateFitViewTransform(
    nodes: AngularNode[],
    options?: FitViewOptions
  ): { x: number; y: number; zoom: number } | null;
  
  /** 平滑動畫到指定視窗 */
  animateToViewport(viewport: Viewport, duration?: number): Promise<void>;
  
  /** 檢查點是否在可見區域內 */
  isPointVisible(point: XYPosition): boolean;
  
  /** 檢查矩形是否與可見區域相交 */
  isRectVisible(rect: { x: number; y: number; width: number; height: number }): boolean;
  
  /** 計算縮放邊界 */
  calculateZoomBounds(): { min: number; max: number };
  
  /** 限制視窗到邊界 */
  constrainViewport(viewport: Viewport): Viewport;
}

/**
 * 選擇服務接口
 */
export interface SelectionService<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> {
  /** 設置選擇框 */
  setSelectionRect(rect: SelectionRect | null): void;
  
  /** 根據選擇框選擇元素 */
  selectElementsInRect(rect: SelectionRect): { nodes: NodeType[]; edges: EdgeType[] };
  
  /** 切換元素選擇狀態 */
  toggleElementSelection(elementId: string, elementType: 'node' | 'edge'): void;
  
  /** 選擇所有元素 */
  selectAll(): void;
  
  /** 反轉選擇 */
  invertSelection(): void;
  
  /** 根據條件選擇節點 */
  selectNodesByCondition(predicate: (node: NodeType) => boolean): void;
  
  /** 根據條件選擇邊線 */
  selectEdgesByCondition(predicate: (edge: EdgeType) => boolean): void;
  
  /** 獲取選擇邊界 */
  getSelectionBounds(): { x: number; y: number; width: number; height: number } | null;
  
  /** 移動選中元素 */
  moveSelectedElements(offset: XYPosition): void;
  
  /** 刪除選中元素 */
  deleteSelectedElements(): void;
}

/**
 * 交互服務接口
 */
export interface InteractionService {
  /** 設置拖拽狀態 */
  setDragging(isDragging: boolean): void;
  
  /** 設置面板拖拽狀態 */
  setPaneDragging(isPaneDragging: boolean): void;
  
  /** 設置用戶選擇狀態 */
  setUserSelection(isActive: boolean): void;
  
  /** 設置多選狀態 */
  setMultiSelection(isActive: boolean): void;
  
  /** 處理鍵盤事件 */
  handleKeyboard(event: KeyboardEvent): boolean;
  
  /** 處理滑鼠事件 */
  handleMouse(event: MouseEvent, type: 'click' | 'down' | 'up' | 'move'): boolean;
  
  /** 處理觸控事件 */
  handleTouch(event: TouchEvent, type: 'start' | 'move' | 'end'): boolean;
  
  /** 處理滾輪事件 */
  handleWheel(event: WheelEvent): boolean;
  
  /** 檢查元素是否可交互 */
  isElementInteractive(elementId: string, elementType: 'node' | 'edge'): boolean;
  
  /** 設置游標樣式 */
  setCursor(cursor: string): void;
  
  /** 重置游標樣式 */
  resetCursor(): void;
}

// ===================
// 服務配置類型
// ===================

/**
 * 流程服務配置
 */
export interface FlowServiceConfig {
  /** 節點類型映射 */
  nodeTypes?: Record<string, Type<NodeComponent>>;
  
  /** 邊線類型映射 */
  edgeTypes?: Record<string, Type<EdgeComponent>>;
  
  /** 默認節點類型 */
  defaultNodeType?: string;
  
  /** 默認邊線類型 */
  defaultEdgeType?: string;
  
  /** 初始視窗狀態 */
  initialViewport?: Viewport;
  
  /** 縮放範圍 */
  zoomRange?: { min: number; max: number };
  
  /** 平移範圍 */
  translateExtent?: CoordinateExtent;
  
  /** 節點範圍 */
  nodeExtent?: CoordinateExtent;
  
  /** 交互設置 */
  interaction?: {
    nodesDraggable?: boolean;
    nodesConnectable?: boolean;
    nodesFocusable?: boolean;
    edgesFocusable?: boolean;
    elementsSelectable?: boolean;
    multiSelection?: boolean;
    panOnDrag?: boolean;
    zoomOnScroll?: boolean;
    zoomOnDoubleClick?: boolean;
    selectNodesOnDrag?: boolean;
  };
  
  /** 連接設置 */
  connection?: {
    mode?: ConnectionMode;
    radius?: number;
    onConnect?: boolean;
    lineType?: string;
    dragThreshold?: number;
  };
  
  /** 性能設置 */
  performance?: {
    elevateNodesOnSelect?: boolean;
    elevateEdgesOnSelect?: boolean;
    dragThreshold?: number;
    clickDistance?: number;
  };
  
  /** 自動平移設置 */
  autoPan?: {
    onConnect?: boolean;
    onNodeFocus?: boolean;
    speed?: number;
  };
  
  /** 調試設置 */
  debug?: boolean;
}

/**
 * 存儲配置
 */
export interface StoreConfig {
  /** 是否啟用持久化 */
  enablePersistence?: boolean;
  
  /** 持久化鍵名 */
  persistenceKey?: string;
  
  /** 持久化存儲 */
  persistenceStorage?: Storage;
  
  /** 是否啟用歷史記錄 */
  enableHistory?: boolean;
  
  /** 歷史記錄大小 */
  historySize?: number;
  
  /** 是否啟用中間件 */
  enableMiddleware?: boolean;
  
  /** 中間件列表 */
  middleware?: any[];
  
  /** 是否啟用調試工具 */
  enableDevtools?: boolean;
  
  /** 調試工具配置 */
  devtools?: {
    name?: string;
    trace?: boolean;
    traceLimit?: number;
  };
}

// ===================
// 服務工廠類型
// ===================

/**
 * 服務工廠接口
 */
export interface ServiceFactory {
  /** 創建流程服務實例 */
  createFlowService<
    NodeType extends AngularNode = AngularNode,
    EdgeType extends AngularEdge = AngularEdge
  >(config?: FlowServiceConfig): AngularFlowService<NodeType, EdgeType>;
  
  /** 創建存儲服務實例 */
  createStoreService<
    NodeType extends AngularNode = AngularNode,
    EdgeType extends AngularEdge = AngularEdge
  >(config?: StoreConfig): FlowStoreService<NodeType, EdgeType>;
  
  /** 創建節點服務實例 */
  createNodeService<NodeType extends AngularNode = AngularNode>(): NodeService<NodeType>;
  
  /** 創建邊線服務實例 */
  createEdgeService<EdgeType extends AngularEdge = AngularEdge>(): EdgeService<EdgeType>;
  
  /** 創建視窗服務實例 */
  createViewportService(): ViewportService;
  
  /** 創建選擇服務實例 */
  createSelectionService<
    NodeType extends AngularNode = AngularNode,
    EdgeType extends AngularEdge = AngularEdge
  >(): SelectionService<NodeType, EdgeType>;
  
  /** 創建交互服務實例 */
  createInteractionService(): InteractionService;
}

// ===================
// 服務提供者類型
// ===================

/**
 * 服務提供者配置
 */
export interface ServiceProviderConfig {
  /** 是否為根服務 */
  forRoot?: boolean;
  
  /** 服務配置 */
  config?: FlowServiceConfig;
  
  /** 存儲配置 */
  storeConfig?: StoreConfig;
  
  /** 自定義服務 */
  customServices?: Record<string, any>;
}

/**
 * 注入令牌
 */
export const FLOW_SERVICE_CONFIG = 'FLOW_SERVICE_CONFIG';
export const STORE_SERVICE_CONFIG = 'STORE_SERVICE_CONFIG';
export const NODE_TYPES_TOKEN = 'NODE_TYPES_TOKEN';
export const EDGE_TYPES_TOKEN = 'EDGE_TYPES_TOKEN';