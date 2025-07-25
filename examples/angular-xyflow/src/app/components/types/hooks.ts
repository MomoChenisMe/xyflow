/**
 * Angular XYFlow Hook 和狀態類型定義
 * 
 * 定義 Angular 中對應 React Hook 的服務和狀態管理類型
 * 包括狀態 Hook、操作 Hook、配置等
 */

import { Signal, WritableSignal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { 
  AngularNode, 
  NodeComponent
} from './nodes';
import { 
  AngularEdge, 
  EdgeComponent 
} from './edges';
import { 
  Viewport, 
  Transform, 
  XYPosition, 
  Connection,
  NodeChange,
  EdgeChange,
  FitViewOptions,
  CoordinateExtent,
  SelectionRect
} from './system-types';

// ===================
// 基礎 Hook 配置
// ===================

/**
 * Hook 配置基礎接口
 */
export interface HookConfig {
  /** 是否啟用自動更新 */
  autoUpdate?: boolean;
  
  /** 更新間隔（毫秒） */
  updateInterval?: number;
  
  /** 是否啟用調試模式 */
  debug?: boolean;
  
  /** Hook 名稱（用於調試） */
  name?: string;
}

/**
 * 流程 Hook 配置
 */
export interface UseFlowConfig extends HookConfig {
  /** 初始節點 */
  initialNodes?: AngularNode[];
  
  /** 初始邊線 */
  initialEdges?: AngularEdge[];
  
  /** 初始視窗 */
  initialViewport?: Viewport;
  
  /** 節點類型映射 */
  nodeTypes?: Record<string, any>;
  
  /** 邊線類型映射 */
  edgeTypes?: Record<string, any>;
  
  /** 是否啟用鍵盤快捷鍵 */
  enableKeyboardShortcuts?: boolean;
  
  /** 是否啟用撤銷/重做 */
  enableUndoRedo?: boolean;
  
  /** 歷史記錄大小 */
  historySize?: number;
}

// ===================
// 狀態 Hook 返回類型
// ===================

/**
 * 節點狀態 Hook 返回類型
 */
export interface UseNodesState<NodeType extends AngularNode = AngularNode> {
  /** 節點列表信號 */
  nodes: Signal<NodeType[]>;
  
  /** 設置節點列表 */
  setNodes: (nodes: NodeType[] | ((prev: NodeType[]) => NodeType[])) => void;
  
  /** 節點變化處理器 */
  onNodesChange: (changes: NodeChange<NodeType>[]) => void;
  
  /** 添加節點 */
  addNode: (node: NodeType) => void;
  
  /** 更新節點 */
  updateNode: (nodeId: string, updates: Partial<NodeType>) => void;
  
  /** 移除節點 */
  removeNode: (nodeId: string) => void;
  
  /** 獲取節點 */
  getNode: (nodeId: string) => NodeType | undefined;
  
  /** 節點數量 */
  nodeCount: Signal<number>;
  
  /** 可見節點 */
  visibleNodes: Signal<NodeType[]>;
  
  /** 選中節點 */
  selectedNodes: Signal<NodeType[]>;
  
  /** 節點查找表 */
  nodeLookup: Signal<Map<string, NodeType>>;
}

/**
 * 邊線狀態 Hook 返回類型
 */
export interface UseEdgesState<EdgeType extends AngularEdge = AngularEdge> {
  /** 邊線列表信號 */
  edges: Signal<EdgeType[]>;
  
  /** 設置邊線列表 */
  setEdges: (edges: EdgeType[] | ((prev: EdgeType[]) => EdgeType[])) => void;
  
  /** 邊線變化處理器 */
  onEdgesChange: (changes: EdgeChange<EdgeType>[]) => void;
  
  /** 添加邊線 */
  addEdge: (edge: EdgeType) => void;
  
  /** 更新邊線 */
  updateEdge: (edgeId: string, updates: Partial<EdgeType>) => void;
  
  /** 移除邊線 */
  removeEdge: (edgeId: string) => void;
  
  /** 獲取邊線 */
  getEdge: (edgeId: string) => EdgeType | undefined;
  
  /** 邊線數量 */
  edgeCount: Signal<number>;
  
  /** 可見邊線 */
  visibleEdges: Signal<EdgeType[]>;
  
  /** 選中邊線 */
  selectedEdges: Signal<EdgeType[]>;
  
  /** 邊線查找表 */
  edgeLookup: Signal<Map<string, EdgeType>>;
}

/**
 * 視窗狀態 Hook 返回類型
 */
export interface UseViewportState {
  /** 視窗狀態信號 */
  viewport: Signal<Viewport>;
  
  /** 設置視窗 */
  setViewport: (viewport: Viewport | ((prev: Viewport) => Viewport)) => void;
  
  /** 變換矩陣信號 */
  transform: Signal<Transform>;
  
  /** 縮放級別信號 */
  zoom: Signal<number>;
  
  /** X 偏移信號 */
  x: Signal<number>;
  
  /** Y 偏移信號 */
  y: Signal<number>;
  
  /** 是否正在移動信號 */
  isMoving: Signal<boolean>;
  
  /** 是否正在縮放信號 */
  isZooming: Signal<boolean>;
  
  /** 視窗邊界信號 */
  bounds: Signal<{ x: number; y: number; width: number; height: number }>;
}

/**
 * 選擇狀態 Hook 返回類型
 */
export interface UseSelectionState<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> {
  /** 選中節點 ID 信號 */
  selectedNodeIds: Signal<Set<string>>;
  
  /** 選中邊線 ID 信號 */
  selectedEdgeIds: Signal<Set<string>>;
  
  /** 選中節點信號 */
  selectedNodes: Signal<NodeType[]>;
  
  /** 選中邊線信號 */
  selectedEdges: Signal<EdgeType[]>;
  
  /** 是否有選中元素信號 */
  hasSelection: Signal<boolean>;
  
  /** 選擇數量信號 */
  selectionCount: Signal<{ nodes: number; edges: number; total: number }>;
  
  /** 選擇邊界信號 */
  selectionBounds: Signal<{ x: number; y: number; width: number; height: number } | null>;
  
  /** 用戶選擇狀態信號 */
  userSelectionActive: Signal<boolean>;
  
  /** 用戶選擇矩形信號 */
  userSelectionRect: Signal<SelectionRect | null>;
  
  /** 多選模式信號 */
  multiSelectionActive: Signal<boolean>;
}

// ===================
// 操作 Hook 返回類型
// ===================

/**
 * 節點操作 Hook 返回類型
 */
export interface UseNodeOperations<NodeType extends AngularNode = AngularNode> {
  /** 創建節點 */
  createNode: <T extends Record<string, unknown>>(
    id: string,
    type: string,
    position: XYPosition,
    data: T,
    options?: Partial<NodeType>
  ) => NodeType;
  
  /** 複製節點 */
  duplicateNode: (nodeId: string, offset?: XYPosition) => NodeType | null;
  
  /** 移動節點 */
  moveNode: (nodeId: string, position: XYPosition) => void;
  
  /** 移動多個節點 */
  moveNodes: (nodeIds: string[], offset: XYPosition) => void;
  
  /** 調整節點大小 */
  resizeNode: (nodeId: string, dimensions: { width: number; height: number }) => void;
  
  /** 設置節點父級 */
  setNodeParent: (nodeId: string, parentId: string | undefined) => void;
  
  /** 獲取節點子級 */
  getNodeChildren: (nodeId: string) => NodeType[];
  
  /** 檢查節點相交 */
  getIntersectingNodes: (nodeId: string) => NodeType[];
  
  /** 獲取節點邊界 */
  getNodeBounds: (nodeId: string) => { x: number; y: number; width: number; height: number } | null;
  
  /** 檢查節點是否在視窗內 */
  isNodeVisible: (nodeId: string) => boolean;
  
  /** 聚焦節點 */
  focusNode: (nodeId: string, options?: { zoom?: number; duration?: number }) => void;
  
  /** 驗證節點 */
  validateNode: (node: Partial<NodeType>) => { isValid: boolean; errors: string[] };
}

/**
 * 邊線操作 Hook 返回類型
 */
export interface UseEdgeOperations<EdgeType extends AngularEdge = AngularEdge> {
  /** 創建邊線 */
  createEdge: <T extends Record<string, unknown>>(
    id: string,
    source: string,
    target: string,
    type?: string,
    data?: T,
    options?: Partial<EdgeType>
  ) => EdgeType;
  
  /** 重新連接邊線 */
  reconnectEdge: (edgeId: string, newConnection: Connection) => boolean;
  
  /** 更新邊線路徑 */
  updateEdgePath: (edgeId: string) => void;
  
  /** 獲取邊線路徑 */
  getEdgePath: (edgeId: string) => string | null;
  
  /** 獲取邊線中心點 */
  getEdgeCenter: (edgeId: string) => XYPosition | null;
  
  /** 獲取邊線長度 */
  getEdgeLength: (edgeId: string) => number | null;
  
  /** 檢查邊線相交 */
  isEdgeIntersectingRect: (
    edgeId: string, 
    rect: { x: number; y: number; width: number; height: number }
  ) => boolean;
  
  /** 獲取節點連接的邊線 */
  getConnectedEdges: (nodeId: string) => { 
    incoming: EdgeType[]; 
    outgoing: EdgeType[]; 
    all: EdgeType[] 
  };
  
  /** 檢查邊線是否可見 */
  isEdgeVisible: (edgeId: string) => boolean;
  
  /** 驗證邊線 */
  validateEdge: (edge: Partial<EdgeType>) => { isValid: boolean; errors: string[] };
}

/**
 * 視窗操作 Hook 返回類型
 */
export interface UseViewportOperations {
  /** 適應視圖 */
  fitView: (options?: FitViewOptions) => Promise<boolean>;
  
  /** 縮放到指定級別 */
  zoomTo: (zoom: number, options?: { duration?: number }) => void;
  
  /** 放大 */
  zoomIn: (options?: { duration?: number }) => void;
  
  /** 縮小 */
  zoomOut: (options?: { duration?: number }) => void;
  
  /** 設置中心點 */
  setCenter: (x: number, y: number, options?: { zoom?: number; duration?: number }) => void;
  
  /** 平移 */
  panBy: (offset: XYPosition) => void;
  
  /** 平移到指定位置 */
  panTo: (position: XYPosition, options?: { duration?: number }) => void;
  
  /** 重置視窗 */
  resetViewport: () => void;
  
  /** 獲取可見邊界 */
  getVisibleBounds: () => { x: number; y: number; width: number; height: number };
  
  /** 屏幕座標轉流程座標 */
  screenToFlowPosition: (position: XYPosition) => XYPosition;
  
  /** 流程座標轉屏幕座標 */
  flowToScreenPosition: (position: XYPosition) => XYPosition;
  
  /** 檢查點是否可見 */
  isPointVisible: (point: XYPosition) => boolean;
  
  /** 檢查矩形是否可見 */
  isRectVisible: (rect: { x: number; y: number; width: number; height: number }) => boolean;
  
  /** 適應邊界 */
  fitBounds: (
    bounds: { x: number; y: number; width: number; height: number },
    options?: { padding?: number; duration?: number }
  ) => void;
}

/**
 * 連接操作 Hook 返回類型
 */
export interface UseConnectionOperations {
  /** 開始連接 */
  startConnection: (fromHandle: { 
    nodeId: string; 
    handleId?: string; 
    type: 'source' | 'target' 
  }) => void;
  
  /** 結束連接 */
  endConnection: () => void;
  
  /** 取消連接 */
  cancelConnection: () => void;
  
  /** 創建連接 */
  connect: (connection: Connection) => boolean;
  
  /** 檢查連接是否有效 */
  isValidConnection: (connection: Connection) => boolean;
  
  /** 獲取可能的連接 */
  getPossibleConnections: (nodeId: string, handleId?: string) => Connection[];
  
  /** 獲取連接狀態 */
  getConnectionStatus: () => Signal<{
    inProgress: boolean;
    fromNode?: string;
    fromHandle?: string;
    toNode?: string;
    toHandle?: string;
    isValid: boolean;
  }>;
  
  /** 設置連接驗證器 */
  setConnectionValidator: (validator: (connection: Connection) => boolean) => void;
}

// ===================
// 工具 Hook 類型
// ===================

/**
 * 鍵盤快捷鍵 Hook 返回類型
 */
export interface UseKeyboardShortcuts {
  /** 註冊快捷鍵 */
  register: (keys: string, handler: (event: KeyboardEvent) => void, options?: {
    preventDefault?: boolean;
    stopPropagation?: boolean;
    global?: boolean;
  }) => () => void;
  
  /** 註銷快捷鍵 */
  unregister: (keys: string) => void;
  
  /** 清除所有快捷鍵 */
  clear: () => void;
  
  /** 啟用/禁用快捷鍵 */
  setEnabled: (enabled: boolean) => void;
  
  /** 獲取已註冊的快捷鍵 */
  getRegistered: () => Record<string, Function>;
}

/**
 * 撤銷/重做 Hook 返回類型
 */
export interface UseUndoRedo<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> {
  /** 撤銷 */
  undo: () => void;
  
  /** 重做 */
  redo: () => void;
  
  /** 是否可以撤銷 */
  canUndo: Signal<boolean>;
  
  /** 是否可以重做 */
  canRedo: Signal<boolean>;
  
  /** 歷史記錄數量 */
  historySize: Signal<number>;
  
  /** 當前歷史索引 */
  currentIndex: Signal<number>;
  
  /** 清除歷史記錄 */
  clearHistory: () => void;
  
  /** 保存當前狀態到歷史 */
  saveState: () => void;
  
  /** 設置最大歷史記錄數 */
  setMaxHistorySize: (size: number) => void;
  
  /** 獲取歷史記錄 */
  getHistory: () => Array<{
    nodes: NodeType[];
    edges: EdgeType[];
    viewport: Viewport;
    timestamp: number;
  }>;
}

/**
 * 拖放 Hook 返回類型
 */
export interface UseDragAndDrop<NodeType extends AngularNode = AngularNode> {
  /** 設置拖拽數據 */
  setDragData: (data: any) => void;
  
  /** 獲取拖拽數據 */
  getDragData: () => any;
  
  /** 處理拖拽放置 */
  onDrop: (event: DragEvent, position: XYPosition) => NodeType | null;
  
  /** 處理拖拽懸停 */
  onDragOver: (event: DragEvent) => void;
  
  /** 處理拖拽進入 */
  onDragEnter: (event: DragEvent) => void;
  
  /** 處理拖拽離開 */
  onDragLeave: (event: DragEvent) => void;
  
  /** 是否正在拖拽 */
  isDragging: Signal<boolean>;
  
  /** 拖拽懸停位置 */
  dragPosition: Signal<XYPosition | null>;
  
  /** 設置放置驗證器 */
  setDropValidator: (validator: (data: any, position: XYPosition) => boolean) => void;
  
  /** 設置節點創建器 */
  setNodeCreator: (creator: (data: any, position: XYPosition) => NodeType) => void;
}

/**
 * 選擇框 Hook 返回類型
 */
export interface UseSelectionBox<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> {
  /** 開始選擇 */
  startSelection: (startPosition: XYPosition) => void;
  
  /** 更新選擇框 */
  updateSelection: (currentPosition: XYPosition) => void;
  
  /** 結束選擇 */
  endSelection: () => void;
  
  /** 取消選擇 */
  cancelSelection: () => void;
  
  /** 選擇框矩形 */
  selectionRect: Signal<SelectionRect | null>;
  
  /** 是否正在選擇 */
  isSelecting: Signal<boolean>;
  
  /** 框中的元素 */
  elementsInBox: Signal<{ nodes: NodeType[]; edges: EdgeType[] }>;
  
  /** 設置選擇模式 */
  setSelectionMode: (mode: 'replace' | 'add' | 'subtract' | 'intersect') => void;
  
  /** 設置選擇過濾器 */
  setSelectionFilter: (filter: {
    nodes?: (node: NodeType) => boolean;
    edges?: (edge: EdgeType) => boolean;
  }) => void;
}

// ===================
// 性能和工具 Hook
// ===================

/**
 * 性能監控 Hook 返回類型
 */
export interface UsePerformanceMonitor {
  /** 幀率信號 */
  fps: Signal<number>;
  
  /** 渲染時間信號 */
  renderTime: Signal<number>;
  
  /** 節點數量信號 */
  nodeCount: Signal<number>;
  
  /** 邊線數量信號 */
  edgeCount: Signal<number>;
  
  /** 內存使用情況信號 */
  memoryUsage: Signal<{ used: number; total: number } | null>;
  
  /** 性能統計信號 */
  stats: Signal<{
    averageFps: number;
    averageRenderTime: number;
    maxNodes: number;
    maxEdges: number;
  }>;
  
  /** 開始監控 */
  startMonitoring: () => void;
  
  /** 停止監控 */
  stopMonitoring: () => void;
  
  /** 重置統計 */
  resetStats: () => void;
  
  /** 獲取詳細報告 */
  getDetailedReport: () => any;
}

/**
 * 調試 Hook 返回類型
 */
export interface UseDebug {
  /** 是否啟用調試 */
  debugEnabled: Signal<boolean>;
  
  /** 調試信息信號 */
  debugInfo: Signal<{
    nodeCount: number;
    edgeCount: number;
    selectedCount: number;
    renderTime: number;
    lastUpdate: number;
  }>;
  
  /** 啟用/禁用調試 */
  setDebugEnabled: (enabled: boolean) => void;
  
  /** 記錄調試信息 */
  log: (message: string, data?: any) => void;
  
  /** 記錄警告 */
  warn: (message: string, data?: any) => void;
  
  /** 記錄錯誤 */
  error: (message: string, error?: Error) => void;
  
  /** 獲取調試日誌 */
  getLogs: () => Array<{ level: string; message: string; data?: any; timestamp: number }>;
  
  /** 清除日誌 */
  clearLogs: () => void;
  
  /** 導出調試數據 */
  exportDebugData: () => any;
}

// ===================
// 複合 Hook 類型
// ===================

/**
 * 完整流程 Hook 返回類型
 * 包含所有子 Hook 的功能
 */
export interface UseAngularFlow<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> extends 
  UseNodesState<NodeType>,
  UseEdgesState<EdgeType>,
  UseViewportState,
  UseSelectionState<NodeType, EdgeType>,
  UseNodeOperations<NodeType>,
  UseEdgeOperations<EdgeType>,
  UseViewportOperations,
  UseConnectionOperations {
  
  /** 流程實例 */
  flowInstance: Signal<any>;
  
  /** 是否已初始化 */
  initialized: Signal<boolean>;
  
  /** 是否準備就緒 */
  ready: Signal<boolean>;
  
  /** 重置整個流程 */
  reset: () => void;
  
  /** 銷毀流程 */
  destroy: () => void;
  
  /** 獲取流程快照 */
  getSnapshot: () => {
    nodes: NodeType[];
    edges: EdgeType[];
    viewport: Viewport;
    selectedNodes: string[];
    selectedEdges: string[];
  };
  
  /** 恢復流程快照 */
  restoreSnapshot: (snapshot: {
    nodes: NodeType[];
    edges: EdgeType[];
    viewport: Viewport;
    selectedNodes: string[];
    selectedEdges: string[];
  }) => void;
}

// ===================
// Hook 工廠類型
// ===================

/**
 * Hook 工廠接口
 */
export interface HookFactory {
  /** 創建節點狀態 Hook */
  createUseNodesState: <NodeType extends AngularNode = AngularNode>(
    config?: HookConfig
  ) => UseNodesState<NodeType>;
  
  /** 創建邊線狀態 Hook */
  createUseEdgesState: <EdgeType extends AngularEdge = AngularEdge>(
    config?: HookConfig
  ) => UseEdgesState<EdgeType>;
  
  /** 創建視窗狀態 Hook */
  createUseViewportState: (config?: HookConfig) => UseViewportState;
  
  /** 創建選擇狀態 Hook */
  createUseSelectionState: <
    NodeType extends AngularNode = AngularNode,
    EdgeType extends AngularEdge = AngularEdge
  >(config?: HookConfig) => UseSelectionState<NodeType, EdgeType>;
  
  /** 創建完整流程 Hook */
  createUseAngularFlow: <
    NodeType extends AngularNode = AngularNode,
    EdgeType extends AngularEdge = AngularEdge
  >(config?: UseFlowConfig) => UseAngularFlow<NodeType, EdgeType>;
}