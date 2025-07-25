/**
 * Angular XYFlow 事件類型定義
 * 
 * 定義所有事件處理器的類型接口
 * 包括節點事件、邊線事件、連接事件、視窗事件等
 */

import { AngularNode, AngularHandle } from './nodes';
import { AngularEdge } from './edges';
import { Viewport, XYPosition, Connection, SelectionRect } from './system-types';

// ===================
// 基礎事件類型
// ===================

/**
 * 流程事件基礎接口
 */
export interface FlowEventBase {
  /** 事件類型 */
  type: string;
  
  /** 事件時間戳 */
  timestamp: number;
  
  /** 是否已被處理 */
  handled?: boolean;
  
  /** 事件元數據 */
  metadata?: Record<string, any>;
}

/**
 * 可取消的事件接口
 */
export interface CancelableFlowEvent extends FlowEventBase {
  /** 取消事件 */
  preventDefault(): void;
  
  /** 停止事件傳播 */
  stopPropagation(): void;
  
  /** 是否已取消 */
  defaultPrevented: boolean;
  
  /** 是否停止傳播 */
  propagationStopped: boolean;
}

// ===================
// 節點事件類型
// ===================

/**
 * 節點事件處理器類型
 */
export type NodeEventHandler<
  NodeType extends AngularNode = AngularNode,
  EventType extends Event = Event
> = (event: EventType, node: NodeType) => void;

/**
 * 節點點擊事件處理器
 */
export type NodeClickEventHandler<NodeType extends AngularNode = AngularNode> = 
  NodeEventHandler<NodeType, MouseEvent>;

/**
 * 節點滑鼠事件處理器
 */
export type NodeMouseEventHandler<NodeType extends AngularNode = AngularNode> = 
  NodeEventHandler<NodeType, MouseEvent>;

/**
 * 節點拖拽事件處理器
 */
export type NodeDragEventHandler<NodeType extends AngularNode = AngularNode> = 
  (event: DragEvent, node: NodeType, dragData?: {
    startPosition: XYPosition;
    currentPosition: XYPosition;
    deltaPosition: XYPosition;
  }) => void;

/**
 * 節點鍵盤事件處理器
 */
export type NodeKeyboardEventHandler<NodeType extends AngularNode = AngularNode> = 
  NodeEventHandler<NodeType, KeyboardEvent>;

/**
 * 節點聚焦事件處理器
 */
export type NodeFocusEventHandler<NodeType extends AngularNode = AngularNode> = 
  NodeEventHandler<NodeType, FocusEvent>;

/**
 * 節點變化事件處理器
 */
export type NodeChangeEventHandler<NodeType extends AngularNode = AngularNode> = 
  (node: NodeType, changes: Partial<NodeType>) => void;

/**
 * 節點調整大小事件處理器
 */
export type NodeResizeEventHandler<NodeType extends AngularNode = AngularNode> = 
  (event: MouseEvent, node: NodeType, resizeData: {
    startDimensions: { width: number; height: number };
    currentDimensions: { width: number; height: number };
    deltaDimensions: { width: number; height: number };
  }) => void;

/**
 * 節點事件集合
 */
export interface NodeEvents<NodeType extends AngularNode = AngularNode> {
  /** 點擊事件 */
  click?: NodeClickEventHandler<NodeType>;
  
  /** 雙擊事件 */
  doubleClick?: NodeClickEventHandler<NodeType>;
  
  /** 右鍵點擊事件 */
  contextMenu?: NodeClickEventHandler<NodeType>;
  
  /** 滑鼠按下事件 */
  mouseDown?: NodeMouseEventHandler<NodeType>;
  
  /** 滑鼠抬起事件 */
  mouseUp?: NodeMouseEventHandler<NodeType>;
  
  /** 滑鼠進入事件 */
  mouseEnter?: NodeMouseEventHandler<NodeType>;
  
  /** 滑鼠離開事件 */
  mouseLeave?: NodeMouseEventHandler<NodeType>;
  
  /** 滑鼠移動事件 */
  mouseMove?: NodeMouseEventHandler<NodeType>;
  
  /** 拖拽開始事件 */
  dragStart?: NodeDragEventHandler<NodeType>;
  
  /** 拖拽中事件 */
  drag?: NodeDragEventHandler<NodeType>;
  
  /** 拖拽結束事件 */
  dragEnd?: NodeDragEventHandler<NodeType>;
  
  /** 聚焦事件 */
  focus?: NodeFocusEventHandler<NodeType>;
  
  /** 失焦事件 */
  blur?: NodeFocusEventHandler<NodeType>;
  
  /** 鍵盤按下事件 */
  keyDown?: NodeKeyboardEventHandler<NodeType>;
  
  /** 鍵盤抬起事件 */
  keyUp?: NodeKeyboardEventHandler<NodeType>;
  
  /** 節點變化事件 */
  change?: NodeChangeEventHandler<NodeType>;
  
  /** 選擇變化事件 */
  select?: (node: NodeType, selected: boolean) => void;
  
  /** 調整大小開始事件 */
  resizeStart?: NodeResizeEventHandler<NodeType>;
  
  /** 調整大小中事件 */
  resize?: NodeResizeEventHandler<NodeType>;
  
  /** 調整大小結束事件 */
  resizeEnd?: NodeResizeEventHandler<NodeType>;
}

// ===================
// 邊線事件類型
// ===================

/**
 * 邊線事件處理器類型
 */
export type EdgeEventHandler<
  EdgeType extends AngularEdge = AngularEdge,
  EventType extends Event = Event
> = (event: EventType, edge: EdgeType) => void;

/**
 * 邊線點擊事件處理器
 */
export type EdgeClickEventHandler<EdgeType extends AngularEdge = AngularEdge> = 
  EdgeEventHandler<EdgeType, MouseEvent>;

/**
 * 邊線滑鼠事件處理器
 */
export type EdgeMouseEventHandler<EdgeType extends AngularEdge = AngularEdge> = 
  EdgeEventHandler<EdgeType, MouseEvent>;

/**
 * 邊線更新事件處理器
 */
export type EdgeUpdateEventHandler<EdgeType extends AngularEdge = AngularEdge> = 
  (oldEdge: EdgeType, newConnection: Connection) => EdgeType | boolean;

/**
 * 邊線事件集合
 */
export interface EdgeEvents<EdgeType extends AngularEdge = AngularEdge> {
  /** 點擊事件 */
  click?: EdgeClickEventHandler<EdgeType>;
  
  /** 雙擊事件 */
  doubleClick?: EdgeClickEventHandler<EdgeType>;
  
  /** 右鍵點擊事件 */
  contextMenu?: EdgeClickEventHandler<EdgeType>;
  
  /** 滑鼠按下事件 */
  mouseDown?: EdgeMouseEventHandler<EdgeType>;
  
  /** 滑鼠抬起事件 */
  mouseUp?: EdgeMouseEventHandler<EdgeType>;
  
  /** 滑鼠進入事件 */
  mouseEnter?: EdgeMouseEventHandler<EdgeType>;
  
  /** 滑鼠離開事件 */
  mouseLeave?: EdgeMouseEventHandler<EdgeType>;
  
  /** 聚焦事件 */
  focus?: EdgeEventHandler<EdgeType, FocusEvent>;
  
  /** 失焦事件 */
  blur?: EdgeEventHandler<EdgeType, FocusEvent>;
  
  /** 邊線更新事件 */
  update?: EdgeUpdateEventHandler<EdgeType>;
  
  /** 選擇變化事件 */
  select?: (edge: EdgeType, selected: boolean) => void;
  
  /** 重新連接開始事件 */
  reconnectStart?: (event: MouseEvent, edge: EdgeType) => void;
  
  /** 重新連接結束事件 */
  reconnectEnd?: (event: MouseEvent, edge: EdgeType, newConnection: Connection) => void;
}

// ===================
// 連接事件類型
// ===================

/**
 * 連接事件處理器
 */
export type ConnectionEventHandler = (connection: Connection) => void;

/**
 * 連接開始事件處理器
 */
export type ConnectStartEventHandler = (
  event: MouseEvent,
  handle: AngularHandle & { nodeId: string }
) => void;

/**
 * 連接結束事件處理器
 */
export type ConnectEndEventHandler = (event: MouseEvent) => void;

/**
 * 連接事件處理器
 */
export type ConnectEventHandler = (connection: Connection) => void;

/**
 * 連接驗證事件處理器
 */
export type ConnectionValidationHandler = (connection: Connection) => boolean;

/**
 * 連接事件集合
 */
export interface ConnectionEvents {
  /** 連接成功事件 */
  connect?: ConnectEventHandler;
  
  /** 連接開始事件 */
  connectStart?: ConnectStartEventHandler;
  
  /** 連接結束事件 */
  connectEnd?: ConnectEndEventHandler;
  
  /** 點擊連接開始事件 */
  clickConnectStart?: ConnectStartEventHandler;
  
  /** 點擊連接結束事件 */
  clickConnectEnd?: ConnectEndEventHandler;
  
  /** 連接驗證事件 */
  isValidConnection?: ConnectionValidationHandler;
  
  /** 連接懸停事件 */
  connectionHover?: (event: MouseEvent, connection: Connection | null) => void;
}

// ===================
// 視窗事件類型
// ===================

/**
 * 視窗事件處理器
 */
export type ViewportEventHandler = (viewport: Viewport) => void;

/**
 * 移動事件處理器
 */
export type MoveEventHandler = (event: MouseEvent, viewport: Viewport) => void;

/**
 * 縮放事件處理器
 */
export type ZoomEventHandler = (event: WheelEvent, viewport: Viewport) => void;

/**
 * 視窗事件集合
 */
export interface ViewportEvents {
  /** 視窗變化事件 */
  viewportChange?: ViewportEventHandler;
  
  /** 移動事件 */
  move?: MoveEventHandler;
  
  /** 移動開始事件 */
  moveStart?: MoveEventHandler;
  
  /** 移動結束事件 */
  moveEnd?: MoveEventHandler;
  
  /** 縮放事件 */
  zoom?: ZoomEventHandler;
  
  /** 縮放開始事件 */
  zoomStart?: ZoomEventHandler;
  
  /** 縮放結束事件 */
  zoomEnd?: ZoomEventHandler;
  
  /** 平移事件 */
  pan?: (event: MouseEvent, delta: XYPosition) => void;
  
  /** 適應視圖事件 */
  fitView?: (viewport: Viewport) => void;
}

// ===================
// 選擇事件類型
// ===================

/**
 * 選擇事件處理器
 */
export type SelectionEventHandler<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> = (params: { nodes: NodeType[]; edges: EdgeType[] }) => void;

/**
 * 選擇變化事件處理器
 */
export type SelectionChangeEventHandler<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> = (params: {
  nodes: NodeType[];
  edges: EdgeType[];
  added: { nodes: NodeType[]; edges: EdgeType[] };
  removed: { nodes: NodeType[]; edges: EdgeType[] };
}) => void;

/**
 * 用戶選擇事件處理器
 */
export type UserSelectionEventHandler = (event: MouseEvent, rect: SelectionRect | null) => void;

/**
 * 選擇事件集合
 */
export interface SelectionEvents<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> {
  /** 選擇變化事件 */
  selectionChange?: SelectionChangeEventHandler<NodeType, EdgeType>;
  
  /** 選擇開始事件 */
  selectionStart?: (event: MouseEvent) => void;
  
  /** 選擇結束事件 */
  selectionEnd?: (event: MouseEvent) => void;
  
  /** 選擇拖拽事件 */
  selectionDrag?: (event: MouseEvent, nodes: NodeType[]) => void;
  
  /** 用戶選擇開始事件 */
  userSelectionStart?: UserSelectionEventHandler;
  
  /** 用戶選擇結束事件 */
  userSelectionEnd?: UserSelectionEventHandler;
  
  /** 全選事件 */
  selectAll?: SelectionEventHandler<NodeType, EdgeType>;
  
  /** 取消全選事件 */
  unselectAll?: () => void;
  
  /** 反轉選擇事件 */
  invertSelection?: SelectionEventHandler<NodeType, EdgeType>;
}

// ===================
// 面板事件類型
// ===================

/**
 * 面板事件處理器
 */
export type PaneEventHandler = (event: MouseEvent) => void;

/**
 * 面板滾輪事件處理器
 */
export type PaneScrollEventHandler = (event: WheelEvent) => void;

/**
 * 面板事件集合
 */
export interface PaneEvents {
  /** 面板點擊事件 */
  paneClick?: PaneEventHandler;
  
  /** 面板右鍵點擊事件 */
  paneContextMenu?: PaneEventHandler;
  
  /** 面板雙擊事件 */
  paneDoubleClick?: PaneEventHandler;
  
  /** 面板滑鼠按下事件 */
  paneMouseDown?: PaneEventHandler;
  
  /** 面板滑鼠抬起事件 */
  paneMouseUp?: PaneEventHandler;
  
  /** 面板滑鼠進入事件 */
  paneMouseEnter?: PaneEventHandler;
  
  /** 面板滑鼠離開事件 */
  paneMouseLeave?: PaneEventHandler;
  
  /** 面板滑鼠移動事件 */
  paneMouseMove?: PaneEventHandler;
  
  /** 面板滾輪事件 */
  paneScroll?: PaneScrollEventHandler;
}

// ===================
// 鍵盤事件類型
// ===================

/**
 * 鍵盤事件處理器
 */
export type KeyboardEventHandler = (event: KeyboardEvent) => void;

/**
 * 熱鍵事件處理器
 */
export type HotkeyEventHandler = (event: KeyboardEvent, hotkey: string) => void;

/**
 * 鍵盤事件集合
 */
export interface KeyboardEvents {
  /** 鍵盤按下事件 */
  keyDown?: KeyboardEventHandler;
  
  /** 鍵盤抬起事件 */
  keyUp?: KeyboardEventHandler;
  
  /** 鍵盤按壓事件 */
  keyPress?: KeyboardEventHandler;
  
  /** 熱鍵事件 */
  hotkey?: HotkeyEventHandler;
  
  /** 刪除鍵事件 */
  delete?: KeyboardEventHandler;
  
  /** 複製事件 */
  copy?: KeyboardEventHandler;
  
  /** 粘貼事件 */
  paste?: KeyboardEventHandler;
  
  /** 剪切事件 */
  cut?: KeyboardEventHandler;
  
  /** 撤銷事件 */
  undo?: KeyboardEventHandler;
  
  /** 重做事件 */
  redo?: KeyboardEventHandler;
  
  /** 全選事件 */
  selectAll?: KeyboardEventHandler;
  
  /** 取消選擇事件 */
  escape?: KeyboardEventHandler;
}

// ===================
// 生命週期事件類型
// ===================

/**
 * 流程初始化事件處理器
 */
export type FlowInitEventHandler = (flowInstance: any) => void;

/**
 * 流程銷毀事件處理器
 */
export type FlowDestroyEventHandler = () => void;

/**
 * 流程準備就緒事件處理器
 */
export type FlowReadyEventHandler = (flowInstance: any) => void;

/**
 * 生命週期事件集合
 */
export interface LifecycleEvents {
  /** 流程初始化事件 */
  init?: FlowInitEventHandler;
  
  /** 流程準備就緒事件 */
  ready?: FlowReadyEventHandler;
  
  /** 流程銷毀事件 */
  destroy?: FlowDestroyEventHandler;
  
  /** 組件掛載事件 */
  mount?: () => void;
  
  /** 組件卸載事件 */
  unmount?: () => void;
  
  /** 數據載入事件 */
  dataLoad?: (data: { nodes: AngularNode[]; edges: AngularEdge[] }) => void;
  
  /** 數據保存事件 */
  dataSave?: (data: { nodes: AngularNode[]; edges: AngularEdge[] }) => void;
}

// ===================
// 錯誤事件類型
// ===================

/**
 * 錯誤事件處理器
 */
export type ErrorEventHandler = (error: Error, context?: string) => void;

/**
 * 警告事件處理器
 */
export type WarningEventHandler = (warning: string, context?: string) => void;

/**
 * 錯誤事件集合
 */
export interface ErrorEvents {
  /** 錯誤事件 */
  error?: ErrorEventHandler;
  
  /** 警告事件 */
  warning?: WarningEventHandler;
  
  /** 節點錯誤事件 */
  nodeError?: (error: Error, nodeId: string) => void;
  
  /** 邊線錯誤事件 */
  edgeError?: (error: Error, edgeId: string) => void;
  
  /** 連接錯誤事件 */
  connectionError?: (error: Error, connection: Connection) => void;
  
  /** 渲染錯誤事件 */
  renderError?: (error: Error, componentType: string) => void;
}

// ===================
// 通用流程事件
// ===================

/**
 * 流程事件處理器
 * 包含所有事件類型的統合接口，解決屬性衝突
 */
export interface FlowEventHandler<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> extends 
  Omit<NodeEvents<NodeType>, 'blur' | 'keyDown' | 'click' | 'keyUp' | 'contextMenu' | 'doubleClick' | 'focus' | 'mouseDown' | 'mouseEnter' | 'mouseLeave' | 'mouseOut' | 'mouseOver' | 'mouseUp' | 'select'>,
  Omit<EdgeEvents<EdgeType>, 'blur' | 'click' | 'contextMenu' | 'doubleClick' | 'focus' | 'mouseDown' | 'mouseEnter' | 'mouseLeave' | 'mouseOut' | 'mouseOver' | 'mouseUp' | 'select'>,
  ConnectionEvents,
  ViewportEvents,
  Omit<SelectionEvents<NodeType, EdgeType>, 'selectAll'>,
  PaneEvents,
  Omit<KeyboardEvents, 'keyDown' | 'selectAll' | 'keyUp'>,
  LifecycleEvents,
  ErrorEvents {
  
  // 解決衝突的屬性
  blur?: NodeFocusEventHandler<NodeType> | EdgeEventHandler<EdgeType, FocusEvent>;
  keyDown?: NodeKeyboardEventHandler<NodeType> | KeyboardEventHandler;
  keyUp?: NodeKeyboardEventHandler<NodeType> | KeyboardEventHandler;
  click?: NodeClickEventHandler<NodeType> | EdgeEventHandler<EdgeType, MouseEvent>;
  contextMenu?: NodeEventHandler<NodeType, MouseEvent> | EdgeEventHandler<EdgeType, MouseEvent>;
  doubleClick?: NodeEventHandler<NodeType, MouseEvent> | EdgeEventHandler<EdgeType, MouseEvent>;
  focus?: NodeFocusEventHandler<NodeType> | EdgeEventHandler<EdgeType, FocusEvent>;
  selectAll?: SelectionEventHandler<NodeType, EdgeType> | KeyboardEventHandler;
}

/**
 * 事件發射器接口
 */
export interface FlowEventEmitter {
  /** 註冊事件監聽器 */
  on<T extends keyof FlowEventHandler>(event: T, handler: FlowEventHandler[T]): () => void;
  
  /** 移除事件監聽器 */
  off<T extends keyof FlowEventHandler>(event: T, handler: FlowEventHandler[T]): void;
  
  /** 觸發事件 */
  emit<T extends keyof FlowEventHandler>(event: T, ...args: any[]): void;
  
  /** 一次性事件監聽器 */
  once<T extends keyof FlowEventHandler>(event: T, handler: FlowEventHandler[T]): () => void;
  
  /** 清除所有監聽器 */
  removeAllListeners(event?: keyof FlowEventHandler): void;
  
  /** 獲取監聽器數量 */
  listenerCount(event: keyof FlowEventHandler): number;
}

// ===================
// 事件配置類型
// ===================

/**
 * 事件配置
 */
export interface EventConfig {
  /** 是否啟用事件捕獲 */
  capture?: boolean;
  
  /** 是否只觸發一次 */
  once?: boolean;
  
  /** 是否被動監聽 */
  passive?: boolean;
  
  /** 事件優先級 */
  priority?: number;
  
  /** 事件節流時間 */
  throttle?: number;
  
  /** 事件防抖時間 */
  debounce?: number;
}