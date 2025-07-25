/**
 * Angular XYFlow 節點類型定義
 * 
 * 定義 Angular 特定的節點類型，擴展基礎節點類型以支持 Angular 特性
 * 包括組件、事件處理、樣式綁定等 Angular 特有功能
 */

import { Type, Signal, TemplateRef, ComponentRef, ElementRef } from '@angular/core';
import { 
  NodeBase, 
  InternalNodeBase, 
  XYPosition, 
  Position, 
  HandleType,
  CoordinateExtent,
  NodeOrigin
} from './system-types';

// ===================
// Angular 節點類型
// ===================

/**
 * Angular 節點接口
 * 擴展基礎節點類型，添加 Angular 特定屬性
 */
export interface AngularNode<
  NodeData extends Record<string, unknown> = Record<string, unknown>,
  NodeType extends string | undefined = string | undefined
> extends NodeBase<NodeData, NodeType> {
  // Angular 樣式綁定
  /** Angular ngClass 綁定 */
  ngClass?: string | string[] | Set<string> | { [className: string]: boolean };
  
  /** Angular ngStyle 綁定 */
  ngStyle?: { [styleName: string]: string | number | null } | null;
  
  /** CSS 類名字符串 */
  className?: string;
  
  /** 內聯樣式對象 */
  style?: Record<string, string | number>;
  
  // Angular 事件處理
  /** 節點點擊事件 */
  onClick?: (event: MouseEvent, node: AngularNode<NodeData, NodeType>) => void;
  
  /** 節點雙擊事件 */
  onDoubleClick?: (event: MouseEvent, node: AngularNode<NodeData, NodeType>) => void;
  
  /** 節點滑鼠進入事件 */
  onMouseEnter?: (event: MouseEvent, node: AngularNode<NodeData, NodeType>) => void;
  
  /** 節點滑鼠離開事件 */
  onMouseLeave?: (event: MouseEvent, node: AngularNode<NodeData, NodeType>) => void;
  
  /** 節點滑鼠按下事件 */
  onMouseDown?: (event: MouseEvent, node: AngularNode<NodeData, NodeType>) => void;
  
  /** 節點滑鼠抬起事件 */
  onMouseUp?: (event: MouseEvent, node: AngularNode<NodeData, NodeType>) => void;
  
  /** 節點右鍵點擊事件 */
  onContextMenu?: (event: MouseEvent, node: AngularNode<NodeData, NodeType>) => void;
  
  /** 節點拖拽開始事件 */
  onDragStart?: (event: DragEvent, node: AngularNode<NodeData, NodeType>) => void;
  
  /** 節點拖拽中事件 */
  onDrag?: (event: DragEvent, node: AngularNode<NodeData, NodeType>) => void;
  
  /** 節點拖拽結束事件 */
  onDragEnd?: (event: DragEvent, node: AngularNode<NodeData, NodeType>) => void;
  
  /** 節點聚焦事件 */
  onFocus?: (event: FocusEvent, node: AngularNode<NodeData, NodeType>) => void;
  
  /** 節點失焦事件 */
  onBlur?: (event: FocusEvent, node: AngularNode<NodeData, NodeType>) => void;
  
  /** 節點鍵盤事件 */
  onKeyDown?: (event: KeyboardEvent, node: AngularNode<NodeData, NodeType>) => void;
  onKeyUp?: (event: KeyboardEvent, node: AngularNode<NodeData, NodeType>) => void;
  
  // Angular 特定屬性
  /** 節點模板引用 */
  template?: TemplateRef<NodeComponentContext<NodeData, NodeType>>;
  
  /** 節點組件類型 */
  component?: Type<NodeComponent<NodeData, NodeType>>;
  
  /** 組件引用 */
  componentRef?: ComponentRef<NodeComponent<NodeData, NodeType>>;
  
  /** DOM 元素引用 */
  elementRef?: ElementRef<HTMLElement>;
  
  /** 節點是否正在調整大小 */
  resizing?: boolean;
  
  /** 自定義 DOM 屬性 */
  domAttributes?: Record<string, string | number | boolean>;
  
  /** ARIA 標籤 */
  ariaLabel?: string;
  
  /** ARIA 描述 */
  ariaDescription?: string;
  
  /** ARIA 角色 */
  ariaRole?: string;
  
  /** 是否為可訪問性焦點 */
  tabIndex?: number;
  
  /** 工具提示文本 */
  title?: string;
  
  /** 節點原點，用於定位節點的參考點 */
  origin?: NodeOrigin;
}

/**
 * 內部 Angular 節點類型
 */
export type InternalAngularNode<NodeType extends AngularNode = AngularNode> = 
  InternalNodeBase<NodeType> & {
  /** Angular 特定的內部狀態 */
  angular: {
    /** 組件實例 */
    componentInstance?: NodeComponent;
    /** 是否已初始化 */
    initialized: boolean;
    /** 變更檢測狀態 */
    changeDetectionScheduled: boolean;
  };
};

// ===================
// 節點組件接口
// ===================

/**
 * 節點組件接口
 * 所有自定義節點組件都應該實現這個接口
 */
export interface NodeComponent<
  NodeData extends Record<string, unknown> = Record<string, unknown>,
  NodeType extends string | undefined = string | undefined
> {
  /** 節點數據信號 */
  node: Signal<AngularNode<NodeData, NodeType>>;
  
  /** 是否選中信號 */
  selected: Signal<boolean>;
  
  /** 是否拖拽中信號 */
  dragging: Signal<boolean>;
  
  /** 是否可聚焦信號 */
  focusable: Signal<boolean>;
  
  /** 節點尺寸信號 */
  dimensions: Signal<{ width: number; height: number } | null>;
  
  /** 可選的初始化方法 */
  ngOnInit?(): void;
  
  /** 可選的銷毀方法 */
  ngOnDestroy?(): void;
  
  /** 可選的變更檢測方法 */
  ngOnChanges?(): void;
}

/**
 * 節點組件上下文
 * 用於模板中的上下文類型
 */
export interface NodeComponentContext<
  NodeData extends Record<string, unknown> = Record<string, unknown>,
  NodeType extends string | undefined = string | undefined
> {
  /** 當前節點 */
  $implicit: AngularNode<NodeData, NodeType>;
  
  /** 節點數據 */
  data: NodeData;
  
  /** 節點 ID */
  id: string;
  
  /** 節點類型 */
  type: NodeType;
  
  /** 是否選中 */
  selected: boolean;
  
  /** 是否拖拽中 */
  dragging: boolean;
  
  /** 節點位置 */
  position: XYPosition;
  
  /** 節點尺寸 */
  dimensions: { width: number; height: number } | null;
}

// ===================
// 節點屬性類型
// ===================

/**
 * Angular 節點組件屬性
 */
export interface AngularNodeProps<
  NodeData extends Record<string, unknown> = Record<string, unknown>,
  NodeType extends string | undefined = string | undefined
> {
  /** 節點實例 */
  node: AngularNode<NodeData, NodeType>;
  
  /** 是否選中 */
  selected?: boolean;
  
  /** 是否拖拽中 */
  dragging?: boolean;
  
  /** Z-Index */
  zIndex?: number;
  
  /** 是否可交互 */
  interactive?: boolean;
  
  /** 縮放級別 */
  scale?: number;
  
  /** 節點類型組件映射 */
  nodeTypes?: Record<string, Type<NodeComponent>>;
  
  /** 默認節點類型 */
  defaultNodeType?: string;
  
  /** 是否禁用指針事件 */
  noDragClassName?: string;
  
  /** 是否啟用鍵盤導航 */
  enableKeyboardNavigation?: boolean;
  
  /** 拖拽閾值 */
  dragThreshold?: number;
  
  /** 點擊距離閾值 */
  clickDistance?: number;
}

// ===================
// Handle 類型
// ===================

/**
 * Angular Handle 類型
 */
export interface AngularHandle {
  /** Handle ID */
  id?: string;
  
  /** Handle 類型 */
  type: HandleType;
  
  /** Handle 位置 */
  position: Position;
  
  /** 是否可連接 */
  isConnectable?: boolean;
  
  /** 是否有效的連接目標 */
  isValidConnection?: boolean;
  
  /** CSS 類名 */
  className?: string;
  
  /** 內聯樣式 */
  style?: Record<string, string | number>;
  
  /** Angular ngClass 綁定 */
  ngClass?: string | string[] | Set<string> | { [className: string]: boolean };
  
  /** Angular ngStyle 綁定 */
  ngStyle?: { [styleName: string]: string | number | null };
  
  /** Handle 點擊事件 */
  onClick?: (event: MouseEvent, handle: AngularHandle) => void;
  
  /** Handle 滑鼠進入事件 */
  onMouseEnter?: (event: MouseEvent, handle: AngularHandle) => void;
  
  /** Handle 滑鼠離開事件 */
  onMouseLeave?: (event: MouseEvent, handle: AngularHandle) => void;
  
  /** 連接開始事件 */
  onConnectStart?: (event: MouseEvent, handle: AngularHandle) => void;
  
  /** 連接結束事件 */
  onConnectEnd?: (event: MouseEvent, handle: AngularHandle) => void;
  
  /** DOM 屬性 */
  domAttributes?: Record<string, string | number | boolean>;
  
  /** ARIA 標籤 */
  ariaLabel?: string;
}

/**
 * Angular Handle 組件屬性
 */
export interface AngularHandleProps {
  /** Handle 配置 */
  handle: AngularHandle;
  
  /** 所屬節點 ID */
  nodeId: string;
  
  /** 連接半徑 */
  connectionRadius?: number;
  
  /** 是否正在連接 */
  connecting?: boolean;
  
  /** 連接狀態 */
  connectionStatus?: 'idle' | 'valid' | 'invalid';
  
  /** 禁用平移類名 */
  noPanClassName?: string;
  
  /** 是否禁用拖拽 */
  isConnectingFrom?: boolean;
}

// ===================
// 預定義節點類型
// ===================

/**
 * 默認節點數據
 */
export interface DefaultNodeData {
  label: string;
  [key: string]: unknown;
}

/**
 * 輸入節點數據
 */
export interface InputNodeData {
  label: string;
  [key: string]: unknown;
}

/**
 * 輸出節點數據
 */
export interface OutputNodeData {
  label: string;
  [key: string]: unknown;
}

/**
 * 群組節點數據
 */
export interface GroupNodeData {
  label?: string;
  background?: string;
  padding?: number;
  [key: string]: unknown;
}

/**
 * 默認節點類型
 */
export type DefaultNode = AngularNode<DefaultNodeData, 'default'>;

/**
 * 輸入節點類型
 */
export type InputNode = AngularNode<InputNodeData, 'input'>;

/**
 * 輸出節點類型
 */
export type OutputNode = AngularNode<OutputNodeData, 'output'>;

/**
 * 群組節點類型
 */
export type GroupNode = AngularNode<GroupNodeData, 'group'>;

// ===================
// 節點創建工具
// ===================

/**
 * 創建節點的選項
 */
export interface CreateNodeOptions<
  NodeData extends Record<string, unknown> = Record<string, unknown>,
  NodeType extends string | undefined = string | undefined
> {
  /** 節點 ID */
  id: string;
  
  /** 節點類型 */
  type?: NodeType;
  
  /** 節點位置 */
  position: XYPosition;
  
  /** 節點數據 */
  data: NodeData;
  
  /** 節點樣式 */
  style?: Record<string, string | number>;
  
  /** CSS 類名 */
  className?: string;
  
  /** 父節點 ID */
  parentId?: string;
  
  /** 範圍限制 */
  extent?: 'parent' | CoordinateExtent;
  
  /** 是否可拖拽 */
  draggable?: boolean;
  
  /** 是否可選擇 */
  selectable?: boolean;
  
  /** 是否可連接 */
  connectable?: boolean;
  
  /** 是否可刪除 */
  deletable?: boolean;
  
  /** 源連接點位置 */
  sourcePosition?: Position;
  
  /** 目標連接點位置 */
  targetPosition?: Position;
  
  /** 初始尺寸 */
  width?: number;
  height?: number;
  
  /** Z-Index */
  zIndex?: number;
}

/**
 * 節點創建函數類型
 */
export type CreateNodeFunction = <
  NodeData extends Record<string, unknown> = Record<string, unknown>,
  NodeType extends string | undefined = string | undefined
>(
  options: CreateNodeOptions<NodeData, NodeType>
) => AngularNode<NodeData, NodeType>;

// ===================
// 節點類型守衛
// ===================

/**
 * 檢查是否為 Angular 節點
 */
export function isAngularNode(value: unknown): value is AngularNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'position' in value &&
    'data' in value
  );
}

/**
 * 檢查是否為內部 Angular 節點
 */
export function isInternalAngularNode(value: unknown): value is InternalAngularNode {
  return (
    isAngularNode(value) &&
    'measured' in value &&
    'internals' in value
  );
}

/**
 * 檢查是否為特定類型的節點
 */
export function isNodeOfType<T extends string>(
  node: AngularNode,
  type: T
): boolean {
  return node.type === type;
}

// ===================
// 節點工具類型
// ===================

/**
 * 節點數據提取類型
 */
export type NodeDataType<T> = T extends AngularNode<infer D, any> ? D : never;

/**
 * 節點類型提取類型
 */
export type NodeTypeString<T> = T extends AngularNode<any, infer U> ? U : never;

/**
 * 節點組件映射類型
 */
export type NodeTypeMap = Record<string, Type<NodeComponent<any, any>>>;

/**
 * 節點事件處理器映射
 */
export interface NodeEventHandlers<
  NodeData extends Record<string, unknown> = Record<string, unknown>,
  NodeType extends string | undefined = string | undefined
> {
  onClick?: (event: MouseEvent, node: AngularNode<NodeData, NodeType>) => void;
  onDoubleClick?: (event: MouseEvent, node: AngularNode<NodeData, NodeType>) => void;
  onMouseEnter?: (event: MouseEvent, node: AngularNode<NodeData, NodeType>) => void;
  onMouseLeave?: (event: MouseEvent, node: AngularNode<NodeData, NodeType>) => void;
  onContextMenu?: (event: MouseEvent, node: AngularNode<NodeData, NodeType>) => void;
  onDragStart?: (event: DragEvent, node: AngularNode<NodeData, NodeType>) => void;
  onDrag?: (event: DragEvent, node: AngularNode<NodeData, NodeType>) => void;
  onDragEnd?: (event: DragEvent, node: AngularNode<NodeData, NodeType>) => void;
  onFocus?: (event: FocusEvent, node: AngularNode<NodeData, NodeType>) => void;
  onBlur?: (event: FocusEvent, node: AngularNode<NodeData, NodeType>) => void;
}

// 導出常用類型別名
export type Node<T extends Record<string, unknown> = Record<string, unknown>, U extends string | undefined = string | undefined> = AngularNode<T, U>;

// 重新導出系統類型
export type { XYPosition } from './system-types';