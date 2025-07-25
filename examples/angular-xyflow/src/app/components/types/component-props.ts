/**
 * Angular XYFlow 組件屬性類型定義
 * 
 * 定義所有 Angular XYFlow 組件的屬性接口
 * 包括主要組件、控制組件、工具組件等的完整屬性定義
 */

import { Type, TemplateRef, ElementRef, EventEmitter } from '@angular/core';
import { 
  AngularNode, 
  NodeComponent,
  AngularHandle,
  NodeEventHandlers
} from './nodes';
import { 
  AngularEdge, 
  EdgeComponent,
  EdgeEventHandlers 
} from './edges';
import { 
  Viewport, 
  XYPosition, 
  Position, 
  Transform, 
  CoordinateExtent,
  SelectionMode,
  PanOnScrollMode,
  ConnectionMode,
  FitViewOptions,
  NodeChange,
  EdgeChange,
  Connection,
  OnError
} from './system-types';

// ===================
// 主要組件屬性
// ===================

/**
 * Angular Flow 主組件屬性
 */
export interface AngularFlowProps<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> {
  // 核心數據
  /** 節點列表 */
  nodes?: NodeType[];
  
  /** 邊線列表 */
  edges?: EdgeType[];
  
  /** 是否使用默認節點（當 nodes 為空時） */
  defaultNodes?: boolean;
  
  /** 是否使用默認邊線（當 edges 為空時） */
  defaultEdges?: boolean;
  
  // 視窗控制
  /** 初始視窗狀態 */
  defaultViewport?: Viewport;
  
  /** 視窗狀態 */
  viewport?: Viewport;
  
  /** 最小縮放級別 */
  minZoom?: number;
  
  /** 最大縮放級別 */
  maxZoom?: number;
  
  /** 縮放步長 */
  zoomStep?: number;
  
  /** 變換矩陣 */
  transform?: Transform;
  
  /** 平移和縮放範圍限制 */
  translateExtent?: CoordinateExtent;
  
  /** 節點範圍限制 */
  nodeExtent?: CoordinateExtent;
  
  // 交互行為
  /** 是否可拖拽節點 */
  nodesDraggable?: boolean;
  
  /** 是否可連接節點 */
  nodesConnectable?: boolean;
  
  /** 節點是否可聚焦 */
  nodesFocusable?: boolean;
  
  /** 邊線是否可聚焦 */
  edgesFocusable?: boolean;
  
  /** 邊線是否可重新連接 */
  edgesReconnectable?: boolean;
  
  /** 元素是否可選擇 */
  elementsSelectable?: boolean;
  
  /** 拖拽時是否選擇節點 */
  selectNodesOnDrag?: boolean;
  
  /** 多選是否激活 */
  multiSelectionActive?: boolean;
  
  /** 用戶選擇是否激活 */
  userSelectionActive?: boolean;
  
  /** 選擇模式 */
  selectionMode?: SelectionMode;
  
  /** 是否捕獲面板點擊 */
  panOnDrag?: boolean;
  
  /** 滾動時平移 */
  panOnScroll?: boolean;
  
  /** 滾動平移模式 */
  panOnScrollMode?: PanOnScrollMode;
  
  /** 滾動平移速度 */
  panOnScrollSpeed?: number;
  
  /** 是否阻止滾動 */
  preventScrolling?: boolean;
  
  /** 縮放激活鍵 */
  zoomActivationKeyCode?: string | null;
  
  /** 縮放時拖拽 */
  zoomOnPinch?: boolean;
  
  /** 縮放時雙擊 */
  zoomOnDoubleClick?: boolean;
  
  /** 縮放時滾動 */
  zoomOnScroll?: boolean;
  
  // 連接設置
  /** 連接模式 */
  connectionMode?: ConnectionMode;
  
  /** 連接半徑 */
  connectionRadius?: number;
  
  /** 是否點擊連接 */
  connectOnClick?: boolean;
  
  /** 連接線類型 */
  connectionLineType?: string;
  
  /** 連接線樣式 */
  connectionLineStyle?: Record<string, string | number>;
  
  /** 連接線類名 */
  connectionLineClassName?: string;
  
  /** 連接線組件 */
  connectionLineComponent?: Type<any>;
  
  /** 連接拖拽閾值 */
  connectionDragThreshold?: number;
  
  // 組件類型映射
  /** 節點類型組件映射 */
  nodeTypes?: Record<string, Type<NodeComponent>>;
  
  /** 邊線類型組件映射 */
  edgeTypes?: Record<string, Type<EdgeComponent>>;
  
  /** 默認節點類型 */
  defaultNodeType?: string;
  
  /** 默認邊線類型 */
  defaultEdgeType?: string;
  
  // 樣式和外觀
  /** 容器類名 */
  className?: string;
  
  /** 容器樣式 */
  style?: Record<string, string | number>;
  
  /** 容器寬度 */
  width?: number;
  
  /** 容器高度 */
  height?: number;
  
  /** 背景組件 */
  background?: TemplateRef<any>;
  
  /** 控制器組件 */
  controls?: TemplateRef<any>;
  
  /** 小地圖組件 */
  miniMap?: TemplateRef<any>;
  
  /** 面板組件 */
  panel?: TemplateRef<any>;
  
  // 無障礙功能
  /** ARIA 標籤 */
  ariaLabel?: string;
  
  /** ARIA 描述 */
  ariaDescription?: string;
  
  /** 鍵盤導航 */
  enableKeyboardNavigation?: boolean;
  
  // 性能優化
  /** 選中時提升節點 */
  elevateNodesOnSelect?: boolean;
  
  /** 選中時提升邊線 */
  elevateEdgesOnSelect?: boolean;
  
  /** 禁用平移的類名 */
  noPanClassName?: string;
  
  /** 節點拖拽閾值 */
  nodeDragThreshold?: number;
  
  /** 節點點擊距離 */
  nodeClickDistance?: number;
  
  // 自動行為
  /** 連接時自動平移 */
  autoPanOnConnect?: boolean;
  
  /** 節點聚焦時自動平移 */
  autoPanOnNodeFocus?: boolean;
  
  /** 自動平移速度 */
  autoPanSpeed?: number;
  
  /** 適應視圖選項 */
  fitViewOptions?: FitViewOptions;
  
  // 事件處理器
  /** 節點變化事件 */
  onNodesChange?: (changes: NodeChange<NodeType>[]) => void;
  
  /** 邊線變化事件 */
  onEdgesChange?: (changes: EdgeChange<EdgeType>[]) => void;
  
  /** 連接事件 */
  onConnect?: (connection: Connection) => void;
  
  /** 連接開始事件 */
  onConnectStart?: (event: MouseEvent, handle: AngularHandle) => void;
  
  /** 連接結束事件 */
  onConnectEnd?: (event: MouseEvent) => void;
  
  /** 點擊連接開始事件 */
  onClickConnectStart?: (event: MouseEvent, handle: AngularHandle) => void;
  
  /** 點擊連接結束事件 */
  onClickConnectEnd?: (event: MouseEvent) => void;
  
  /** 視窗變化事件 */
  onViewportChange?: (viewport: Viewport) => void;
  
  /** 移動事件 */
  onMove?: (event: MouseEvent, viewport: Viewport) => void;
  
  /** 移動開始事件 */
  onMoveStart?: (event: MouseEvent, viewport: Viewport) => void;
  
  /** 移動結束事件 */
  onMoveEnd?: (event: MouseEvent, viewport: Viewport) => void;
  
  /** 選擇變化事件 */
  onSelectionChange?: (params: { nodes: NodeType[]; edges: EdgeType[] }) => void;
  
  /** 選擇開始事件 */
  onSelectionStart?: (event: MouseEvent) => void;
  
  /** 選擇結束事件 */
  onSelectionEnd?: (event: MouseEvent) => void;
  
  /** 拖拽中選擇事件 */
  onSelectionDrag?: (event: MouseEvent, nodes: NodeType[]) => void;
  
  /** 面板點擊事件 */
  onPaneClick?: (event: MouseEvent) => void;
  
  /** 面板右鍵點擊事件 */
  onPaneContextMenu?: (event: MouseEvent) => void;
  
  /** 面板滑鼠進入事件 */
  onPaneMouseEnter?: (event: MouseEvent) => void;
  
  /** 面板滑鼠離開事件 */
  onPaneMouseLeave?: (event: MouseEvent) => void;
  
  /** 面板滑鼠移動事件 */
  onPaneMouseMove?: (event: MouseEvent) => void;
  
  /** 面板滾輪事件 */
  onPaneScroll?: (event: WheelEvent) => void;
  
  /** 錯誤事件 */
  onError?: OnError;
  
  /** 初始化事件 */
  onInit?: (flowInstance: any) => void;
  
  // 節點和邊線事件處理器
  /** 節點事件處理器 */
  nodeEventHandlers?: NodeEventHandlers<any, any>;
  
  /** 邊線事件處理器 */
  edgeEventHandlers?: EdgeEventHandlers<any, any>;
  
  // 高級配置
  /** 調試模式 */
  debug?: boolean;
  
  /** 實驗性功能 */
  experimental?: {
    /** 啟用新的渲染器 */
    newRenderer?: boolean;
    /** 啟用虛擬化 */
    virtualization?: boolean;
  };
}

// ===================
// 流程渲染器屬性
// ===================

/**
 * 流程渲染器組件屬性
 */
export interface FlowRendererProps<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> {
  /** 節點列表 */
  nodes: NodeType[];
  
  /** 邊線列表 */
  edges: EdgeType[];
  
  /** 節點類型映射 */
  nodeTypes: Record<string, Type<NodeComponent>>;
  
  /** 邊線類型映射 */
  edgeTypes: Record<string, Type<EdgeComponent>>;
  
  /** 選中的節點 ID */
  selectedNodes: Set<string>;
  
  /** 選中的邊線 ID */
  selectedEdges: Set<string>;
  
  /** 縮放級別 */
  zoom: number;
  
  /** 是否正在拖拽面板 */
  paneDragging: boolean;
  
  /** 連接線組件 */
  connectionLineComponent?: Type<any>;
  
  /** 連接線類型 */
  connectionLineType?: string;
  
  /** 連接線樣式 */
  connectionLineStyle?: Record<string, string | number>;
  
  /** 連接線類名 */
  connectionLineClassName?: string;
  
  /** 禁用平移類名 */
  noPanClassName?: string;
  
  /** 是否啟用邊線更新器 */
  enableEdgeUpdater?: boolean;
  
  /** 邊線更新半徑 */
  edgeUpdaterRadius?: number;
}

/**
 * 視窗組件屬性
 */
export interface ViewportProps {
  /** 變換矩陣 */
  transform: Transform;
  
  /** 視窗寬度 */
  width: number;
  
  /** 視窗高度 */
  height: number;
  
  /** 子組件模板 */
  children?: TemplateRef<any>;
}

// ===================
// 控制組件屬性
// ===================

/**
 * 控制器組件屬性
 */
export interface ControlsProps {
  /** 是否顯示縮放控制 */
  showZoom?: boolean;
  
  /** 是否顯示適應視圖控制 */
  showFitView?: boolean;
  
  /** 是否顯示交互控制 */
  showInteractive?: boolean;
  
  /** 適應視圖選項 */
  fitViewOptions?: FitViewOptions;
  
  /** 控制器方向 */
  orientation?: 'vertical' | 'horizontal';
  
  /** 控制器位置 */
  position?: 'top-left' | 'top-center' | 'top-right' | 
            'center-left' | 'center-right' |
            'bottom-left' | 'bottom-center' | 'bottom-right';
  
  /** 自定義類名 */
  className?: string;
  
  /** 自定義樣式 */
  style?: Record<string, string | number>;
  
  /** 縮放按鈕 ARIA 標籤 */
  ariaLabel?: string;
  
  /** 是否禁用縮放按鈕 */
  zoomInDisabled?: boolean;
  zoomOutDisabled?: boolean;
  fitViewDisabled?: boolean;
  interactiveDisabled?: boolean;
  
  /** 自定義按鈕內容 */
  zoomInContent?: TemplateRef<any>;
  zoomOutContent?: TemplateRef<any>;
  fitViewContent?: TemplateRef<any>;
  interactiveContent?: TemplateRef<any>;
  
  /** 按鈕點擊事件 */
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onInteractiveChange?: (interactive: boolean) => void;
}

/**
 * 小地圖組件屬性
 */
export interface MiniMapProps<NodeType extends AngularNode = AngularNode> {
  /** 小地圖寬度 */
  width?: number;
  
  /** 小地圖高度 */
  height?: number;
  
  /** 小地圖位置 */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  /** 視窗遮罩顏色 */
  maskColor?: string;
  
  /** 視窗遮罩邊框顏色 */
  maskStrokeColor?: string;
  
  /** 視窗遮罩邊框寬度 */
  maskStrokeWidth?: number;
  
  /** 節點顏色 */
  nodeColor?: string | ((node: NodeType) => string);
  
  /** 節點邊框顏色 */
  nodeStrokeColor?: string | ((node: NodeType) => string);
  
  /** 節點邊框寬度 */
  nodeStrokeWidth?: number | ((node: NodeType) => number);
  
  /** 節點類名 */
  nodeClassName?: string | ((node: NodeType) => string);
  
  /** 節點邊框半徑 */
  nodeBorderRadius?: number;
  
  /** 背景顏色 */
  backgroundColor?: string;
  
  /** 自定義類名 */
  className?: string;
  
  /** 自定義樣式 */
  style?: Record<string, string | number>;
  
  /** 是否可拖拽視窗 */
  pannable?: boolean;
  
  /** 是否可縮放視窗 */
  zoomable?: boolean;
  
  /** 反轉拖拽方向 */
  inversePan?: boolean;
  
  /** 縮放步長 */
  zoomStep?: number;
  
  /** 點擊事件 */
  onClick?: (event: MouseEvent, position: XYPosition) => void;
  
  /** 節點點擊事件 */
  onNodeClick?: (event: MouseEvent, node: NodeType) => void;
  
  /** ARIA 標籤 */
  ariaLabel?: string;
}

/**
 * 背景組件屬性
 */
export interface BackgroundProps {
  /** 背景變體 */
  variant?: 'dots' | 'lines' | 'cross';
  
  /** 網格間距 */
  gap?: number | [number, number];
  
  /** 網格大小 */
  size?: number;
  
  /** 網格顏色 */
  color?: string;
  
  /** 背景顏色 */
  backgroundColor?: string;
  
  /** 自定義類名 */
  className?: string;
  
  /** 自定義樣式 */
  style?: Record<string, string | number>;
  
  /** 網格偏移 */
  offset?: number;
  
  /** 線條寬度 */
  lineWidth?: number;
  
  /** 點的半徑 */
  dotRadius?: number;
  
  /** 網格 ID（用於多個背景） */
  id?: string;
  
  /** 圖案單位 */
  patternUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
}

// ===================
// 工具組件屬性
// ===================

/**
 * 節點工具欄組件屬性
 */
export interface NodeToolbarProps {
  /** 目標節點 ID */
  nodeId?: string;
  
  /** 工具欄位置 */
  position?: Position;
  
  /** 是否為選中節點顯示 */
  isVisible?: boolean;
  
  /** 位置偏移 */
  offset?: number;
  
  /** 對齊方式 */
  align?: 'start' | 'center' | 'end';
  
  /** 自定義類名 */
  className?: string;
  
  /** 自定義樣式 */
  style?: Record<string, string | number>;
  
  /** 工具欄內容 */
  children?: TemplateRef<any>;
  
  /** ARIA 標籤 */
  ariaLabel?: string;
}

/**
 * 節點調整器組件屬性
 */
export interface NodeResizerProps {
  /** 目標節點 ID */
  nodeId?: string;
  
  /** 是否為選中節點顯示 */
  isVisible?: boolean;
  
  /** 調整器顏色 */
  color?: string;
  
  /** 調整器邊框顏色 */
  handleStyle?: Record<string, string | number>;
  
  /** 調整器類名 */
  handleClassName?: string;
  
  /** 線條樣式 */
  lineStyle?: Record<string, string | number>;
  
  /** 線條類名 */
  lineClassName?: string;
  
  /** 最小寬度 */
  minWidth?: number;
  
  /** 最小高度 */
  minHeight?: number;
  
  /** 最大寬度 */
  maxWidth?: number;
  
  /** 最大高度 */
  maxHeight?: number;
  
  /** 保持長寬比 */
  keepAspectRatio?: boolean;
  
  /** 是否應該調整範圍 */
  shouldResize?: (event: MouseEvent, params: { 
    x: number; 
    y: number; 
    width: number; 
    height: number; 
  }) => boolean;
  
  /** 調整開始事件 */
  onResizeStart?: (event: MouseEvent, params: { 
    x: number; 
    y: number; 
    width: number; 
    height: number; 
  }) => void;
  
  /** 調整中事件 */
  onResize?: (event: MouseEvent, params: { 
    x: number; 
    y: number; 
    width: number; 
    height: number; 
  }) => void;
  
  /** 調整結束事件 */
  onResizeEnd?: (event: MouseEvent, params: { 
    x: number; 
    y: number; 
    width: number; 
    height: number; 
  }) => void;
}

/**
 * 面板組件屬性
 */
export interface PanelProps {
  /** 面板位置 */
  position?: 'top-left' | 'top-center' | 'top-right' | 
            'center-left' | 'center-right' |
            'bottom-left' | 'bottom-center' | 'bottom-right';
  
  /** 自定義類名 */
  className?: string;
  
  /** 自定義樣式 */
  style?: Record<string, string | number>;
  
  /** 面板內容 */
  children?: TemplateRef<any>;
  
  /** ARIA 標籤 */
  ariaLabel?: string;
}

/**
 * 歸屬組件屬性
 */
export interface AttributionProps {
  /** 是否在生產環境中顯示 */
  proOptions?: {
    hideAttribution?: boolean;
  };
  
  /** 自定義類名 */
  className?: string;
  
  /** 自定義樣式 */
  style?: Record<string, string | number>;
  
  /** 歸屬位置 */
  position?: 'bottom-left' | 'bottom-right';
}