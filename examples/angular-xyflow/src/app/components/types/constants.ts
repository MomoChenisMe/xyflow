/**
 * Angular XYFlow 常量和枚舉定義
 * 
 * 定義系統中使用的所有常量、枚舉值和預設配置
 * 包括位置枚舉、顏色模式、組件類型等
 */

// ===================
// 位置枚舉
// ===================

/**
 * Handle 位置枚舉
 */
export enum Position {
  Top = 'top',
  Right = 'right', 
  Bottom = 'bottom',
  Left = 'left'
}

/**
 * Handle 類型枚舉
 */
export enum HandleType {
  Source = 'source',
  Target = 'target'
}

/**
 * 面板位置枚舉
 */
export enum PanelPosition {
  TopLeft = 'top-left',
  TopCenter = 'top-center',
  TopRight = 'top-right',
  CenterLeft = 'center-left',
  CenterRight = 'center-right',
  BottomLeft = 'bottom-left',
  BottomCenter = 'bottom-center',
  BottomRight = 'bottom-right'
}

/**
 * 控制器位置枚舉
 */
export enum ControlPosition {
  TopLeft = 'top-left',
  TopCenter = 'top-center',
  TopRight = 'top-right',
  CenterLeft = 'center-left',
  CenterRight = 'center-right',
  BottomLeft = 'bottom-left',
  BottomCenter = 'bottom-center',
  BottomRight = 'bottom-right'
}

/**
 * 小地圖位置枚舉
 */
export enum MiniMapPosition {
  TopLeft = 'top-left',
  TopRight = 'top-right',
  BottomLeft = 'bottom-left',
  BottomRight = 'bottom-right'
}

// ===================
// 模式枚舉
// ===================

/**
 * 連接模式枚舉
 */
export enum ConnectionMode {
  Strict = 'strict',
  Loose = 'loose'
}

/**
 * 選擇模式枚舉
 */
export enum SelectionMode {
  Partial = 'partial',
  Full = 'full'
}

/**
 * 滾動平移模式枚舉
 */
export enum PanOnScrollMode {
  Free = 'free',
  Vertical = 'vertical',
  Horizontal = 'horizontal'
}

/**
 * 顏色模式枚舉
 */
export enum ColorMode {
  Light = 'light',
  Dark = 'dark',
  System = 'system'
}

/**
 * 拖拽模式枚舉
 */
export enum DragMode {
  Move = 'move',
  Select = 'select',
  Pan = 'pan'
}

// ===================
// 背景枚舉
// ===================

/**
 * 背景變體枚舉
 */
export enum BackgroundVariant {
  Dots = 'dots',
  Lines = 'lines',
  Cross = 'cross'
}

/**
 * 背景圖案單位枚舉
 */
export enum BackgroundPatternUnits {
  UserSpaceOnUse = 'userSpaceOnUse',
  ObjectBoundingBox = 'objectBoundingBox'
}

// ===================
// 節點和邊線類型
// ===================

/**
 * 默認節點類型
 */
export enum DefaultNodeTypes {
  Default = 'default',
  Input = 'input',
  Output = 'output',
  Group = 'group'
}

/**
 * 默認邊線類型
 */
export enum DefaultEdgeTypes {
  Default = 'default',
  Straight = 'straight',
  Step = 'step',
  SmoothStep = 'smoothstep',
  Bezier = 'bezier'
}

/**
 * 標記類型枚舉
 */
export enum MarkerType {
  Arrow = 'arrow',
  ArrowClosed = 'arrowclosed',
  Circle = 'circle',
  Diamond = 'diamond',
  Triangle = 'triangle'
}

// ===================
// 交互枚舉
// ===================

/**
 * 鍵盤按鍵枚舉
 */
export enum KeyCode {
  Escape = 'Escape',
  Delete = 'Delete',
  Backspace = 'Backspace',
  Enter = 'Enter',
  Space = ' ',
  Tab = 'Tab',
  
  // 方向鍵
  ArrowUp = 'ArrowUp',
  ArrowDown = 'ArrowDown',
  ArrowLeft = 'ArrowLeft',
  ArrowRight = 'ArrowRight',
  
  // 修飾鍵
  Control = 'Control',
  Shift = 'Shift',
  Alt = 'Alt',
  Meta = 'Meta',
  
  // 字母鍵
  KeyA = 'KeyA',
  KeyC = 'KeyC',
  KeyV = 'KeyV',
  KeyX = 'KeyX',
  KeyZ = 'KeyZ',
  KeyY = 'KeyY'
}

/**
 * 滑鼠按鈕枚舉
 */
export enum MouseButton {
  Left = 0,
  Middle = 1,
  Right = 2
}

/**
 * 游標類型枚舉
 */
export enum CursorType {
  Default = 'default',
  Pointer = 'pointer',
  Grab = 'grab',
  Grabbing = 'grabbing',
  Move = 'move',
  Crosshair = 'crosshair',
  NotAllowed = 'not-allowed',
  Resize = 'resize'
}

// ===================
// 動畫枚舉
// ===================

/**
 * 緩動類型枚舉
 */
export enum EasingType {
  Linear = 'linear',
  EaseIn = 'ease-in',
  EaseOut = 'ease-out',
  EaseInOut = 'ease-in-out',
  EaseCubic = 'cubic-bezier(0.4, 0, 0.2, 1)'
}

/**
 * 動畫持續時間枚舉
 */
export enum AnimationDuration {
  Fast = 150,
  Medium = 300,
  Slow = 500
}

// ===================
// 錯誤類型枚舉
// ===================

/**
 * 錯誤代碼枚舉
 */
export enum ErrorCode {
  NodeNotFound = 'NODE_NOT_FOUND',
  EdgeNotFound = 'EDGE_NOT_FOUND',
  InvalidConnection = 'INVALID_CONNECTION',
  InvalidConfiguration = 'INVALID_CONFIGURATION',
  ComponentNotRegistered = 'COMPONENT_NOT_REGISTERED',
  ServiceNotInitialized = 'SERVICE_NOT_INITIALIZED'
}

// ===================
// CSS 類名常量
// ===================

/**
 * CSS 類名前綴
 */
export const CSS_PREFIX = 'angular-flow';

/**
 * 基礎 CSS 類名
 */
export const CSS_CLASSES = {
  // 容器類名
  CONTAINER: `${CSS_PREFIX}`,
  VIEWPORT: `${CSS_PREFIX}__viewport`,
  PANE: `${CSS_PREFIX}__pane`,
  
  // 節點類名
  NODE: `${CSS_PREFIX}__node`,
  NODE_DEFAULT: `${CSS_PREFIX}__node-default`,
  NODE_INPUT: `${CSS_PREFIX}__node-input`,
  NODE_OUTPUT: `${CSS_PREFIX}__node-output`,
  NODE_GROUP: `${CSS_PREFIX}__node-group`,
  NODE_SELECTED: `${CSS_PREFIX}__node-selected`,
  NODE_DRAGGING: `${CSS_PREFIX}__node-dragging`,
  
  // 邊線類名
  EDGE: `${CSS_PREFIX}__edge`,
  EDGE_PATH: `${CSS_PREFIX}__edge-path`,
  EDGE_LABEL: `${CSS_PREFIX}__edge-label`,
  EDGE_SELECTED: `${CSS_PREFIX}__edge-selected`,
  EDGE_ANIMATED: `${CSS_PREFIX}__edge-animated`,
  
  // Handle 類名
  HANDLE: `${CSS_PREFIX}__handle`,
  HANDLE_SOURCE: `${CSS_PREFIX}__handle-source`,
  HANDLE_TARGET: `${CSS_PREFIX}__handle-target`,
  HANDLE_CONNECTABLE: `${CSS_PREFIX}__handle-connectable`,
  HANDLE_CONNECTING: `${CSS_PREFIX}__handle-connecting`,
  
  // 控制器類名
  CONTROLS: `${CSS_PREFIX}__controls`,
  CONTROL_BUTTON: `${CSS_PREFIX}__control-button`,
  
  // 小地圖類名
  MINIMAP: `${CSS_PREFIX}__minimap`,
  MINIMAP_MASK: `${CSS_PREFIX}__minimap-mask`,
  MINIMAP_NODE: `${CSS_PREFIX}__minimap-node`,
  
  // 背景類名
  BACKGROUND: `${CSS_PREFIX}__background`,
  
  // 選擇類名
  SELECTION: `${CSS_PREFIX}__selection`,
  SELECTION_RECT: `${CSS_PREFIX}__selection-rect`,
  
  // 工具欄類名
  TOOLBAR: `${CSS_PREFIX}__node-toolbar`,
  RESIZER: `${CSS_PREFIX}__node-resizer`,
  
  // 面板類名
  PANEL: `${CSS_PREFIX}__panel`,
  
  // 狀態類名
  DRAGGING: `${CSS_PREFIX}--dragging`,
  SELECTING: `${CSS_PREFIX}--selecting`,
  CONNECTING: `${CSS_PREFIX}--connecting`,
  INTERACTIVE: `${CSS_PREFIX}--interactive`,
  
  // 禁用類名
  NO_PAN: `${CSS_PREFIX}__nopan`,
  NO_DRAG: `${CSS_PREFIX}__nodrag`,
  NO_WHEEL: `${CSS_PREFIX}__nowheel`
} as const;

// ===================
// 默認值常量
// ===================

/**
 * 默認視窗設置
 */
export const DEFAULT_VIEWPORT = {
  x: 0,
  y: 0,
  zoom: 1
} as const;

/**
 * 默認縮放範圍
 */
export const DEFAULT_ZOOM_RANGE = {
  min: 0.1,
  max: 4
} as const;

/**
 * 默認平移範圍
 */
export const DEFAULT_TRANSLATE_EXTENT = [
  [-Infinity, -Infinity],
  [Infinity, Infinity]
] as const;

/**
 * 默認節點尺寸
 */
export const DEFAULT_NODE_SIZE = {
  width: 150,
  height: 40
} as const;

/**
 * 默認 Handle 尺寸
 */
export const DEFAULT_HANDLE_SIZE = {
  width: 8,
  height: 8
} as const;

/**
 * 默認拖拽閾值
 */
export const DEFAULT_DRAG_THRESHOLD = 1;

/**
 * 默認點擊距離
 */
export const DEFAULT_CLICK_DISTANCE = 10;

/**
 * 默認連接半徑
 */
export const DEFAULT_CONNECTION_RADIUS = 20;

/**
 * 默認邊線更新半徑
 */
export const DEFAULT_EDGE_UPDATER_RADIUS = 10;

/**
 * 默認自動平移速度
 */
export const DEFAULT_AUTO_PAN_SPEED = 15;

// ===================
// 背景默認設置
// ===================

/**
 * 默認背景設置
 */
export const DEFAULT_BACKGROUND = {
  variant: BackgroundVariant.Dots,
  gap: 15,
  size: 1,
  color: '#999',
  backgroundColor: 'transparent'
} as const;

/**
 * 默認小地圖設置
 */
export const DEFAULT_MINIMAP = {
  width: 200,
  height: 150,
  position: MiniMapPosition.BottomRight,
  maskColor: 'rgba(0, 0, 0, 0.1)',
  maskStrokeColor: '#999',
  maskStrokeWidth: 1,
  nodeColor: '#333',
  nodeStrokeColor: '#999',
  nodeStrokeWidth: 1,
  backgroundColor: '#fff'
} as const;

/**
 * 默認控制器設置
 */
export const DEFAULT_CONTROLS = {
  position: ControlPosition.BottomLeft,
  orientation: 'vertical',
  showZoom: true,
  showFitView: true,
  showInteractive: true
} as const;

// ===================
// 時間常量
// ===================

/**
 * 動畫時間常量
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  MEDIUM: 300,
  SLOW: 500
} as const;

/**
 * 防抖時間常量
 */
export const DEBOUNCE_DURATION = {
  FAST: 50,
  MEDIUM: 100,
  SLOW: 250
} as const;

/**
 * 節流時間常量
 */
export const THROTTLE_DURATION = {
  FAST: 16,   // ~60fps
  MEDIUM: 33, // ~30fps
  SLOW: 100   // ~10fps
} as const;

// ===================
// 事件名稱常量
// ===================

/**
 * 節點事件名稱
 */
export const NODE_EVENTS = {
  CLICK: 'nodeClick',
  DOUBLE_CLICK: 'nodeDoubleClick',
  CONTEXT_MENU: 'nodeContextMenu',
  MOUSE_ENTER: 'nodeMouseEnter',
  MOUSE_LEAVE: 'nodeMouseLeave',
  DRAG_START: 'nodeDragStart',
  DRAG: 'nodeDrag',
  DRAG_END: 'nodeDragEnd',
  SELECT: 'nodeSelect',
  DESELECT: 'nodeDeselect'
} as const;

/**
 * 邊線事件名稱
 */
export const EDGE_EVENTS = {
  CLICK: 'edgeClick',
  DOUBLE_CLICK: 'edgeDoubleClick',
  CONTEXT_MENU: 'edgeContextMenu',
  MOUSE_ENTER: 'edgeMouseEnter',
  MOUSE_LEAVE: 'edgeMouseLeave',
  UPDATE: 'edgeUpdate',
  SELECT: 'edgeSelect',
  DESELECT: 'edgeDeselect'
} as const;

/**
 * 流程事件名稱
 */
export const FLOW_EVENTS = {
  INIT: 'flowInit',
  READY: 'flowReady',
  DESTROY: 'flowDestroy',
  VIEWPORT_CHANGE: 'viewportChange',
  SELECTION_CHANGE: 'selectionChange',
  CONNECT: 'connect',
  CONNECT_START: 'connectStart',
  CONNECT_END: 'connectEnd'
} as const;

// ===================
// 存儲鍵名常量
// ===================

/**
 * 本地存儲鍵名
 */
export const STORAGE_KEYS = {
  VIEWPORT: 'angular-flow-viewport',
  NODES: 'angular-flow-nodes',
  EDGES: 'angular-flow-edges',
  THEME: 'angular-flow-theme',
  SETTINGS: 'angular-flow-settings'
} as const;

// ===================
// 版本信息常量
// ===================

/**
 * 版本信息
 */
export const VERSION_INFO = {
  ANGULAR_FLOW: '1.0.0',
  REACT_FLOW_COMPAT: '12.0.0',
  ANGULAR_MIN: '18.0.0',
  TYPESCRIPT_MIN: '5.0.0'
} as const;

// ===================
// 性能常量
// ===================

/**
 * 性能設置
 */
export const PERFORMANCE = {
  // 虛擬化閾值
  VIRTUALIZATION_THRESHOLD: 1000,
  
  // 批處理大小
  BATCH_SIZE: 50,
  
  // 最大渲染時間（毫秒）
  MAX_RENDER_TIME: 16,
  
  // 內存警告閾值（MB）
  MEMORY_WARNING_THRESHOLD: 100,
  
  // FPS 監控間隔
  FPS_MONITOR_INTERVAL: 1000
} as const;

// ===================
// 輔助功能常量
// ===================

/**
 * ARIA 標籤
 */
export const ARIA_LABELS = {
  FLOW: 'Flow diagram',
  NODE: 'Flow node',
  EDGE: 'Flow edge',
  HANDLE: 'Connection handle',
  CONTROLS: 'Flow controls',
  MINIMAP: 'Flow minimap',
  ZOOM_IN: 'Zoom in',
  ZOOM_OUT: 'Zoom out',
  FIT_VIEW: 'Fit view',
  TOGGLE_INTERACTIVE: 'Toggle interactive mode'
} as const;

/**
 * 鍵盤快捷鍵
 */
export const KEYBOARD_SHORTCUTS = {
  DELETE: ['Delete', 'Backspace'],
  SELECT_ALL: ['Control+a', 'Meta+a'],
  COPY: ['Control+c', 'Meta+c'],
  PASTE: ['Control+v', 'Meta+v'],
  CUT: ['Control+x', 'Meta+x'],
  UNDO: ['Control+z', 'Meta+z'],
  REDO: ['Control+y', 'Meta+y', 'Control+Shift+z', 'Meta+Shift+z'],
  ZOOM_IN: ['Control+=', 'Meta+='],
  ZOOM_OUT: ['Control+-', 'Meta+-'],
  FIT_VIEW: ['Control+0', 'Meta+0'],
  ESCAPE: ['Escape']
} as const;