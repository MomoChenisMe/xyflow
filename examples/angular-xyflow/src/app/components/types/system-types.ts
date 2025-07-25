/**
 * System 包類型重新導出
 * 
 * 這個文件重新導出 @xyflow/system 包中的所有基礎類型
 * 這些類型是框架無關的，可以在 Angular XYFlow 中直接使用
 */

// ===================
// 基礎幾何類型
// ===================

/**
 * 2D 位置坐標
 */
export interface XYPosition {
  x: number;
  y: number;
}

/**
 * Handle 位置枚舉
 */
export enum Position {
  Left = 'left',
  Top = 'top',
  Right = 'right',
  Bottom = 'bottom',
}

/**
 * 矩形區域
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 邊界框
 */
export interface Box {
  x: number;
  y: number;
  x2: number;
  y2: number;
}

/**
 * 尺寸
 */
export interface Dimensions {
  width: number;
  height: number;
}

/**
 * 變換矩陣 [x, y, zoom]
 */
export type Transform = [number, number, number];

/**
 * 坐標範圍
 */
export type CoordinateExtent = [[number, number], [number, number]];

/**
 * 節點原點 [x, y]，用於定位節點的參考點
 * [0, 0] = 左上角，[0.5, 0.5] = 中心，[1, 1] = 右下角
 */
export type NodeOrigin = [number, number];

// ===================
// 節點基礎類型
// ===================

/**
 * 節點基礎接口
 */
export interface NodeBase<
  NodeData extends Record<string, unknown> = Record<string, unknown>,
  NodeType extends string | undefined = string | undefined
> {
  /** 唯一標識符 */
  id: string;
  
  /** 節點位置 */
  position: XYPosition;
  
  /** 節點數據 */
  data: NodeData;
  
  /** 節點類型 */
  type?: NodeType;
  
  /** 源連接點默認位置 */
  sourcePosition?: Position;
  
  /** 目標連接點默認位置 */
  targetPosition?: Position;
  
  /** 是否隱藏 */
  hidden?: boolean;
  
  /** 是否選中 */
  selected?: boolean;
  
  /** 是否正在拖拽 */
  dragging?: boolean;
  
  /** 是否可拖拽 */
  draggable?: boolean;
  
  /** 是否可選擇 */
  selectable?: boolean;
  
  /** 是否可連接 */
  connectable?: boolean;
  
  /** 是否可刪除 */
  deletable?: boolean;
  
  /** 是否可聚焦 */
  focusable?: boolean;
  
  /** 節點寬度 */
  width?: number;
  
  /** 節點高度 */
  height?: number;
  
  /** 父節點 ID */
  parentId?: string;
  
  /** Z-index */
  zIndex?: number;
  
  /** 範圍限制 */
  extent?: 'parent' | CoordinateExtent;
  
  /** 可展開的子節點 */
  expandParent?: boolean;
  
  /** 位置絕對坐標 */
  positionAbsolute?: XYPosition;
  
  /** 測量信息 */
  measured?: {
    width?: number;
    height?: number;
  };
}

/**
 * 內部節點類型（包含計算屬性）
 */
export type InternalNodeBase<NodeType extends NodeBase = NodeBase> = NodeType & {
  /** 測量信息 */
  measured: {
    width: number;
    height: number;
  };
  
  /** 內部狀態 */
  internals: {
    /** 絕對位置 */
    positionAbsolute: XYPosition;
    /** Z-index */
    z: number;
    /** Handle 邊界 */
    handleBounds: {
      source: HandleElement[];
      target: HandleElement[];
    };
  };
};

// ===================
// 邊線基礎類型
// ===================

/**
 * 邊線基礎接口
 */
export interface EdgeBase<
  EdgeData extends Record<string, unknown> = Record<string, unknown>,
  EdgeType extends string | undefined = string | undefined
> {
  /** 唯一標識符 */
  id: string;
  
  /** 邊線類型 */
  type?: EdgeType;
  
  /** 源節點 ID */
  source: string;
  
  /** 目標節點 ID */
  target: string;
  
  /** 源 Handle ID */
  sourceHandle?: string | null;
  
  /** 目標 Handle ID */
  targetHandle?: string | null;
  
  /** 邊線數據 */
  data?: EdgeData;
  
  /** 是否隱藏 */
  hidden?: boolean;
  
  /** 是否動畫 */
  animated?: boolean;
  
  /** 是否選中 */
  selected?: boolean;
  
  /** 是否可選擇 */
  selectable?: boolean;
  
  /** 是否可刪除 */
  deletable?: boolean;
  
  /** 是否可聚焦 */
  focusable?: boolean;
  
  /** 是否可重新連接 */
  reconnectable?: boolean | 'source' | 'target';
  
  /** Z-index */
  zIndex?: number;
  
  /** ARIA 標籤 */
  ariaLabel?: string;
  
  /** 交互寬度（用於點擊檢測） */
  interactionWidth?: number;
}

// ===================
// Handle 類型
// ===================

/**
 * Handle 類型
 */
export enum HandleType {
  Source = 'source',
  Target = 'target',
}

/**
 * Handle 元素
 */
export interface HandleElement {
  /** Handle ID */
  id?: string;
  
  /** Handle 位置 */
  position: Position;
  
  /** Handle 類型 */
  type: HandleType;
  
  /** Handle 的 DOM 位置 */
  x: number;
  y: number;
  width: number;
  height: number;
}

// ===================
// 連接類型
// ===================

/**
 * 連接
 */
export interface Connection {
  /** 源節點 ID */
  source: string;
  
  /** 目標節點 ID */
  target: string;
  
  /** 源 Handle */
  sourceHandle?: string | null;
  
  /** 目標 Handle */
  targetHandle?: string | null;
}

/**
 * 連接查找表
 */
export type ConnectionLookup = Map<string, Map<string, Connection>>;

/**
 * 連接模式
 */
export enum ConnectionMode {
  /** 嚴格模式：只能連接不同類型的 Handle */
  Strict = 'strict',
  /** 鬆散模式：可以連接任何 Handle */
  Loose = 'loose',
}

// ===================
// 變化類型
// ===================

/**
 * 節點變化基礎類型
 */
export interface NodeChangeBase {
  id: string;
  type: string;
}

/**
 * 節點位置變化
 */
export interface NodePositionChange extends NodeChangeBase {
  type: 'position';
  position?: XYPosition;
  positionAbsolute?: XYPosition;
  dragging?: boolean;
}

/**
 * 節點尺寸變化
 */
export interface NodeDimensionChange extends NodeChangeBase {
  type: 'dimensions';
  dimensions?: Dimensions;
  updateStyle?: boolean;
}

/**
 * 節點選擇變化
 */
export interface NodeSelectionChange extends NodeChangeBase {
  type: 'select';
  selected: boolean;
}

/**
 * 節點移除變化
 */
export interface NodeRemoveChange extends NodeChangeBase {
  type: 'remove';
}

/**
 * 節點添加變化
 */
export interface NodeAddChange<NodeType extends NodeBase = NodeBase> extends NodeChangeBase {
  type: 'add';
  item: NodeType;
}

/**
 * 節點替換變化
 */
export interface NodeReplaceChange<NodeType extends NodeBase = NodeBase> extends NodeChangeBase {
  type: 'replace';
  item: NodeType;
}

/**
 * 節點重置變化
 */
export interface NodeResetChange extends NodeChangeBase {
  type: 'reset';
}

/**
 * 所有節點變化類型
 */
export type NodeChange<NodeType extends NodeBase = NodeBase> =
  | NodePositionChange
  | NodeDimensionChange
  | NodeSelectionChange
  | NodeRemoveChange
  | NodeAddChange<NodeType>
  | NodeReplaceChange<NodeType>
  | NodeResetChange;

/**
 * 邊線變化基礎類型
 */
export interface EdgeChangeBase {
  id: string;
  type: string;
}

/**
 * 邊線選擇變化
 */
export interface EdgeSelectionChange extends EdgeChangeBase {
  type: 'select';
  selected: boolean;
}

/**
 * 邊線移除變化
 */
export interface EdgeRemoveChange extends EdgeChangeBase {
  type: 'remove';
}

/**
 * 邊線添加變化
 */
export interface EdgeAddChange<EdgeType extends EdgeBase = EdgeBase> extends EdgeChangeBase {
  type: 'add';
  item: EdgeType;
}

/**
 * 邊線替換變化
 */
export interface EdgeReplaceChange<EdgeType extends EdgeBase = EdgeBase> extends EdgeChangeBase {
  type: 'replace';
  item: EdgeType;
}

/**
 * 邊線重置變化
 */
export interface EdgeResetChange extends EdgeChangeBase {
  type: 'reset';
}

/**
 * 所有邊線變化類型
 */
export type EdgeChange<EdgeType extends EdgeBase = EdgeBase> =
  | EdgeSelectionChange
  | EdgeRemoveChange
  | EdgeAddChange<EdgeType>
  | EdgeReplaceChange<EdgeType>
  | EdgeResetChange;

// ===================
// 視窗類型
// ===================

/**
 * 視窗狀態
 */
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

/**
 * 視窗輔助函數
 */
export interface ViewportHelperFunctions {
  /** 設置視窗 */
  setViewport: (viewport: Viewport, options?: { duration?: number }) => void;
  
  /** 獲取視窗 */
  getViewport: () => Viewport;
  
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
  
  /** 適應到邊界 */
  fitBounds: (bounds: Rect, options?: { duration?: number; padding?: number }) => void;
  
  /** 屏幕坐標轉流程坐標 */
  screenToFlowPosition: (position: XYPosition) => XYPosition;
  
  /** 流程坐標轉屏幕坐標 */
  flowToScreenPosition: (position: XYPosition) => XYPosition;
}

/**
 * 適應視圖選項
 */
export interface FitViewOptions {
  /** 內邊距 */
  padding?: number;
  
  /** 是否包含隱藏節點 */
  includeHiddenNodes?: boolean;
  
  /** 最小縮放級別 */
  minZoom?: number;
  
  /** 最大縮放級別 */
  maxZoom?: number;
  
  /** 動畫持續時間 */
  duration?: number;
  
  /** 指定節點 ID */
  nodes?: string[];
}

// ===================
// 選擇和交互類型
// ===================

/**
 * 選擇模式
 */
export enum SelectionMode {
  /** 部分選擇：觸碰到節點即選中 */
  Partial = 'partial',
  /** 完全選擇：完全包含節點才選中 */
  Full = 'full',
}

/**
 * 平移模式
 */
export enum PanOnScrollMode {
  /** 自由平移 */
  Free = 'free',
  /** 垂直平移 */
  Vertical = 'vertical',
  /** 水平平移 */
  Horizontal = 'horizontal',
}

/**
 * 用戶選擇矩形
 */
export interface SelectionRect {
  width: number;
  height: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
}

// ===================
// 錯誤處理類型
// ===================

/**
 * 錯誤代碼
 */
export enum FlowErrorCode {
  INVALID_NODE = 'INVALID_NODE',
  INVALID_EDGE = 'INVALID_EDGE',
  INVALID_CONNECTION = 'INVALID_CONNECTION',
  MISSING_NODE = 'MISSING_NODE',
  MISSING_EDGE = 'MISSING_EDGE',
  DUPLICATE_ID = 'DUPLICATE_ID',
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',
}

/**
 * 流程錯誤
 */
export interface FlowError {
  code: FlowErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * 錯誤處理器
 */
export type OnError = (error: FlowError) => void;

// ===================
// 工具類型
// ===================

/**
 * 深度可選
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 必需鍵
 */
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * 可選鍵
 */
export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

/**
 * 按類型選擇
 */
export type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

/**
 * 節點或邊線的查找表類型
 */
export type NodeLookup<NodeType extends NodeBase = NodeBase> = Map<string, NodeType>;
export type EdgeLookup<EdgeType extends EdgeBase = EdgeBase> = Map<string, EdgeType>;