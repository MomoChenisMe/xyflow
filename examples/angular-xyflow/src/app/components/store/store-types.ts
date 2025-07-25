import { signal, Signal } from '@angular/core';
import { NodeBase, InternalNode } from '../components/Nodes/nodes.types';
import { Connection, HandleType, ConnectionMode } from '../components/Handle/handle.types';
import { Edge } from '../hooks/edge.service';

/**
 * Transform 類型：[x, y, zoom]
 */
export type Transform = [number, number, number];

/**
 * 視窗狀態
 */
export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

/**
 * 位置信息
 */
export interface XYPosition {
  x: number;
  y: number;
}

/**
 * Handle 信息
 */
export interface HandleInfo {
  nodeId: string;
  id: string | null;
  type: HandleType;
  position?: string;
}

/**
 * Handle信息 - 匹配@xyflow/system的Handle類型
 */
export interface SystemHandle {
  nodeId: string;
  id: string | null;
  type: HandleType;
  x: number;
  y: number;
  width: number;
  height: number;
  position: string;
}

/**
 * 無連接狀態
 */
export interface NoConnection {
  inProgress: false;
  isValid: null;
  from: null;
  fromHandle: null;
  fromPosition: null;
  fromNode: null;
  to: null;
  toHandle: null;
  toPosition: null;
  toNode: null;
}

/**
 * 連接進行中狀態
 */
export interface ConnectionInProgress {
  inProgress: true;
  isValid: boolean | null;
  from: XYPosition;
  fromHandle: SystemHandle;
  fromPosition: string;
  fromNode: any;
  to: XYPosition;
  toHandle: SystemHandle | null;
  toPosition: string | null;
  toNode: any | null;
}

/**
 * 連接狀態 - 匹配@xyflow/system的Union type
 */
export type ConnectionState = ConnectionInProgress | NoConnection;

/**
 * 選擇狀態
 */
export interface SelectionState {
  selectedNodes: Set<string>;
  selectedEdges: Set<string>;
  nodesSelectionActive: boolean;
  userSelectionActive: boolean;
  userSelectionRect: {
    startX: number;
    startY: number;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

/**
 * 內部狀態
 */
export interface InternalState {
  // 查找表
  nodeLookup: Map<string, InternalNode>;
  edgeLookup: Map<string, Edge>;
  connectionLookup: Map<string, Connection>;
  parentLookup: Map<string, Set<string>>;
  
  // DOM 相關
  domNode: Element | null;
  panZoom: any | null;
  
  // 初始化標誌
  initialized: boolean;
  
  // 調試模式
  debug: boolean;
}

/**
 * React Flow 完整狀態接口
 */
export interface ReactFlowState extends ViewportState, SelectionState, InternalState {
  // 連接狀態
  connection: ConnectionState;
  
  // 數據
  nodes: NodeBase[];
  edges: Edge[];
  
  // 視窗控制
  transform: Transform;
  width: number;
  height: number;
  minZoom: number;
  maxZoom: number;
  
  // 交互狀態
  isDragging: boolean;
  paneDragging: boolean;
  preventScrolling: boolean;
  multiSelectionActive: boolean;
  
  // 連接配置
  connectionMode: ConnectionMode;
  connectionClickStartHandle: {
    nodeId: string;
    type: HandleType;
    id: string | null;
  } | null;
  connectionRadius: number;
  connectionDragThreshold: number;
  
  // 行為配置
  nodesDraggable: boolean;
  nodesConnectable: boolean;
  nodesFocusable: boolean;
  edgesFocusable: boolean;
  edgesReconnectable: boolean;
  elementsSelectable: boolean;
  selectNodesOnDrag: boolean;
  elevateNodesOnSelect: boolean;
  elevateEdgesOnSelect: boolean;
  
  // 自動平移
  autoPanOnConnect: boolean;
  autoPanOnNodeFocus: boolean;
  autoPanSpeed: number;
  
  // 適應視圖
  fitViewQueued: boolean;
  fitViewResolver: ((value: boolean) => void) | null;
  
  // 範圍限制
  nodeExtent?: [[number, number], [number, number]];
  translateExtent?: [[number, number], [number, number]];
  
  // 默認選項
  defaultEdgeOptions?: Partial<Edge>;
  hasDefaultNodes: boolean;
  hasDefaultEdges: boolean;
  
  // 識別信息
  rfId: string;
  lib: string;
  
  // CSS 類名
  noPanClassName?: string;
  
  // 無障礙
  ariaLiveMessage: string;
  ariaLabelConfig: Record<string, (params: any) => string>;
  
  // 驗證函數
  isValidConnection?: (connection: Connection) => boolean;
  
  // 閾值
  nodeDragThreshold: number;
  nodeClickDistance: number;
  
  // 點擊連接
  connectOnClick: boolean;
  
  // 對齊網格
  snapGrid?: [number, number];
  snapToGrid: boolean;
  
  // 事件回調
  onNodesChange?: (changes: any[]) => void;
  onEdgesChange?: (changes: any[]) => void;
  onConnect?: (connection: Connection) => void;
  onConnectStart?: (event: any, params: any) => void;
  onConnectEnd?: (event: any, connectionState: any) => void;
  onClickConnectStart?: (event: any, params: any) => void;
  onClickConnectEnd?: (event: any, connectionState: any) => void;
  onError?: (code: string, message: string) => void;
  onSelectionChangeHandlers: Array<(params: any) => void>;
  
  // 操作方法
  panBy: (delta: { x: number; y: number }) => void;
  setCenter: (x: number, y: number, options?: any) => void;
  fitView: (options?: any) => Promise<boolean>;
  updateConnection: (connection: Partial<ConnectionState>) => void;
  cancelConnection: () => void;
  addSelectedNodes: (nodeIds: string[]) => void;
  addSelectedEdges: (edgeIds: string[]) => void;
  unselectNodesAndEdges: (params: { nodes?: any[]; edges?: any[] }) => void;
  setNodes: (nodes: NodeBase[]) => void;
  setEdges: (edges: Edge[]) => void;
  reset: () => void;
}

/**
 * Store API 接口
 */
export interface StoreApi {
  getState: () => ReactFlowState;
  setState: (partial: Partial<ReactFlowState>) => void;
  subscribe: (listener: (state: ReactFlowState) => void) => () => void;
  destroy: () => void;
}

/**
 * Flow Store 操作接口
 */
export interface FlowStoreActions {
  // 節點操作
  updateNode: (nodeId: string, updates: Partial<NodeBase>) => void;
  updateNodeData: (nodeId: string, data: any) => void;
  updateNodeInternals: (nodeIds?: string[]) => void;
  
  // 邊緣操作
  updateEdge: (edgeId: string, updates: Partial<Edge>) => void;
  updateEdgeData: (edgeId: string, data: any) => void;
  
  // 視窗操作
  setViewport: (viewport: ViewportState) => void;
  zoomIn: (options?: any) => void;
  zoomOut: (options?: any) => void;
  zoomTo: (zoom: number, options?: any) => void;
  
  // 選擇操作
  selectNodes: (nodeIds: string[]) => void;
  selectEdges: (edgeIds: string[]) => void;
  clearSelection: () => void;
  
  // 連接操作
  startConnection: (fromHandle: any) => void;
  endConnection: () => void;
  updateConnectionPreview: (position: { x: number; y: number }) => void;
  
  // 內部操作
  triggerNodeChanges: (changes: any[]) => void;
  triggerEdgeChanges: (changes: any[]) => void;
  updateLookupTables: () => void;
}

/**
 * 節點變化類型
 */
export interface NodeChanges {
  type: 'add' | 'remove' | 'select' | 'position' | 'dimensions' | 'data';
  id: string;
  item?: NodeBase;
  position?: { x: number; y: number };
  dimensions?: { width: number; height: number };
  data?: any;
  selected?: boolean;
}

/**
 * 邊緣變化類型
 */
export interface EdgeChanges {
  type: 'add' | 'remove' | 'select';
  id: string;
  item?: Edge;
  selected?: boolean;
}

/**
 * 中間件接口
 */
export interface StoreMiddleware {
  name: string;
  beforeStateChange?: (nextState: Partial<ReactFlowState>, currentState: ReactFlowState) => Partial<ReactFlowState>;
  afterStateChange?: (newState: ReactFlowState, previousState: ReactFlowState) => void;
  onAction?: (actionName: string, payload: any, state: ReactFlowState) => void;
}

/**
 * 選擇器函數類型
 */
export type Selector<T> = (state: ReactFlowState) => T;

/**
 * 狀態監聽器類型
 */
export type StateListener = (state: ReactFlowState, previousState: ReactFlowState) => void;

/**
 * 動作調度器類型
 */
export type ActionDispatcher = <T = any>(actionName: string, payload?: T) => void;

/**
 * Store 配置選項
 */
export interface StoreOptions {
  enableMiddleware?: boolean;
  enableDevtools?: boolean;
  enablePersistence?: boolean;
  persistenceKey?: string;
  debug?: boolean;
}

/**
 * 持久化配置
 */
export interface PersistenceConfig {
  key: string;
  storage: Storage;
  include?: (keyof ReactFlowState)[];
  exclude?: (keyof ReactFlowState)[];
  serialize?: (state: ReactFlowState) => string;
  deserialize?: (serialized: string) => Partial<ReactFlowState>;
}

/**
 * 調試工具配置
 */
export interface DevtoolsConfig {
  name?: string;
  enabled?: boolean;
  maxAge?: number;
  actionSanitizer?: (action: any) => any;
  stateSanitizer?: (state: ReactFlowState) => any;
}

/**
 * 性能監控配置
 */
export interface PerformanceConfig {
  enableMetrics?: boolean;
  sampleRate?: number;
  onMetric?: (metric: PerformanceMetric) => void;
}

/**
 * 性能指標
 */
export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Store 事件類型
 */
export type StoreEvent = 
  | { type: 'state-changed'; payload: { newState: ReactFlowState; previousState: ReactFlowState } }
  | { type: 'action-dispatched'; payload: { action: string; payload: any } }
  | { type: 'middleware-error'; payload: { error: Error; middleware: string } }
  | { type: 'performance-metric'; payload: PerformanceMetric };

/**
 * Store 事件監聽器
 */
export type StoreEventListener = (event: StoreEvent) => void;

/**
 * 響應式 Store 接口
 */
export interface ReactiveStoreApi extends StoreApi {
  // Signal 支持
  getStateSignal: () => Signal<ReactFlowState>;
  selectSignal: <T>(selector: Selector<T>) => Signal<T>;
  
  // 中間件
  addMiddleware: (middleware: StoreMiddleware) => void;
  removeMiddleware: (middlewareName: string) => void;
  
  // 事件
  addEventListener: (listener: StoreEventListener) => () => void;
  removeEventListener: (listener: StoreEventListener) => void;
  
  // 性能
  getMetrics: () => PerformanceMetric[];
  clearMetrics: () => void;
  
  // 調試
  getHistory: () => ReactFlowState[];
  clearHistory: () => void;
  
  // 持久化
  persist: (config: PersistenceConfig) => void;
  restore: () => Promise<void>;
}

/**
 * Store 創建選項
 */
export interface CreateStoreOptions extends StoreOptions {
  initialState?: Partial<ReactFlowState>;
  middleware?: StoreMiddleware[];
  persistence?: PersistenceConfig;
  devtools?: DevtoolsConfig;
  performance?: PerformanceConfig;
}