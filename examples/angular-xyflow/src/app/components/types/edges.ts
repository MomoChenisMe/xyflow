/**
 * Angular XYFlow 邊線類型定義
 * 
 * 定義 Angular 特定的邊線類型，擴展基礎邊線類型以支持 Angular 特性
 * 包括組件、事件處理、樣式綁定、標籤等 Angular 特有功能
 */

import { Type, Signal, TemplateRef, ComponentRef } from '@angular/core';
import { EdgeBase, HandleType, XYPosition } from './system-types';

// ===================
// Angular 邊線類型
// ===================

/**
 * Angular 邊線接口
 * 擴展基礎邊線類型，添加 Angular 特定屬性
 */
export interface AngularEdge<
  EdgeData extends Record<string, unknown> = Record<string, unknown>,
  EdgeType extends string | undefined = string | undefined
> extends EdgeBase<EdgeData, EdgeType> {
  // Angular 樣式綁定
  /** Angular ngClass 綁定 */
  ngClass?: string | string[] | Set<string> | { [className: string]: boolean };
  
  /** Angular ngStyle 綁定 */
  ngStyle?: { [styleName: string]: string | number | null } | null;
  
  /** CSS 類名字符串 */
  className?: string;
  
  /** 內聯樣式對象 */
  style?: Record<string, string | number>;
  
  // 邊線標籤相關
  /** 邊線標籤 */
  label?: string | TemplateRef<EdgeLabelContext>;
  
  /** 標籤樣式 */
  labelStyle?: Record<string, string | number>;
  
  /** 標籤背景樣式 */
  labelBgStyle?: Record<string, string | number>;
  
  /** 標籤背景內邊距 */
  labelBgPadding?: [number, number];
  
  /** 標籤背景邊框半徑 */
  labelBgBorderRadius?: number;
  
  /** 是否顯示標籤背景 */
  labelShowBg?: boolean;
  
  // Angular 事件處理
  /** 邊線點擊事件 */
  onClick?: (event: MouseEvent, edge: AngularEdge<EdgeData, EdgeType>) => void;
  
  /** 邊線雙擊事件 */
  onDoubleClick?: (event: MouseEvent, edge: AngularEdge<EdgeData, EdgeType>) => void;
  
  /** 邊線滑鼠進入事件 */
  onMouseEnter?: (event: MouseEvent, edge: AngularEdge<EdgeData, EdgeType>) => void;
  
  /** 邊線滑鼠離開事件 */
  onMouseLeave?: (event: MouseEvent, edge: AngularEdge<EdgeData, EdgeType>) => void;
  
  /** 邊線右鍵點擊事件 */
  onContextMenu?: (event: MouseEvent, edge: AngularEdge<EdgeData, EdgeType>) => void;
  
  /** 邊線聚焦事件 */
  onFocus?: (event: FocusEvent, edge: AngularEdge<EdgeData, EdgeType>) => void;
  
  /** 邊線失焦事件 */
  onBlur?: (event: FocusEvent, edge: AngularEdge<EdgeData, EdgeType>) => void;
  
  // 路徑和標記
  /** 自定義路徑 */
  path?: string;
  
  /** 起始標記 */
  markerStart?: EdgeMarker;
  
  /** 結束標記 */
  markerEnd?: EdgeMarker;
  
  /** 路徑選項 */
  pathOptions?: EdgePathOptions;
  
  // Angular 特定屬性
  /** 邊線組件類型 */
  component?: Type<EdgeComponent<EdgeData, EdgeType>>;
  
  /** 組件引用 */
  componentRef?: ComponentRef<EdgeComponent<EdgeData, EdgeType>>;
  
  /** 自定義 SVG 屬性 */
  svgAttributes?: Record<string, string | number | boolean>;
  
  /** ARIA 標籤 */
  ariaLabel?: string;
  
  /** ARIA 描述 */
  ariaDescription?: string;
  
  /** 是否為可訪問性焦點 */
  tabIndex?: number;
  
  /** 工具提示文本 */
  title?: string;
  
  /** 邊線更新器 */
  updaterPosition?: number;
  
  /** 是否正在更新 */
  updating?: boolean;
}

// ===================
// 邊線組件接口
// ===================

/**
 * 邊線組件接口
 * 所有自定義邊線組件都應該實現這個接口
 */
export interface EdgeComponent<
  EdgeData extends Record<string, unknown> = Record<string, unknown>,
  EdgeType extends string | undefined = string | undefined
> {
  /** 邊線數據信號 */
  edge: Signal<AngularEdge<EdgeData, EdgeType>>;
  
  /** 是否選中信號 */
  selected: Signal<boolean>;
  
  /** 源節點位置信號 */
  sourcePosition: Signal<XYPosition>;
  
  /** 目標節點位置信號 */
  targetPosition: Signal<XYPosition>;
  
  /** 路徑數據信號 */
  pathData: Signal<string>;
  
  /** 標籤位置信號 */
  labelPosition: Signal<XYPosition | null>;
  
  /** 可選的初始化方法 */
  ngOnInit?(): void;
  
  /** 可選的銷毀方法 */
  ngOnDestroy?(): void;
  
  /** 可選的變更檢測方法 */
  ngOnChanges?(): void;
}

/**
 * 邊線組件上下文
 * 用於模板中的上下文類型
 */
export interface EdgeComponentContext<
  EdgeData extends Record<string, unknown> = Record<string, unknown>,
  EdgeType extends string | undefined = string | undefined
> {
  /** 當前邊線 */
  $implicit: AngularEdge<EdgeData, EdgeType>;
  
  /** 邊線數據 */
  data: EdgeData;
  
  /** 邊線 ID */
  id: string;
  
  /** 邊線類型 */
  type: EdgeType;
  
  /** 源節點 ID */
  source: string;
  
  /** 目標節點 ID */
  target: string;
  
  /** 是否選中 */
  selected: boolean;
  
  /** 是否動畫 */
  animated: boolean;
  
  /** 路徑數據 */
  pathData: string;
  
  /** 源位置 */
  sourcePosition: XYPosition;
  
  /** 目標位置 */
  targetPosition: XYPosition;
}

// ===================
// 邊線標籤類型
// ===================

/**
 * 邊線標籤上下文
 */
export interface EdgeLabelContext {
  /** 標籤文本 */
  label: string;
  
  /** 標籤位置 */
  position: XYPosition;
  
  /** 邊線引用 */
  edge: AngularEdge;
}

/**
 * 邊線標籤選項
 */
export interface EdgeLabelOptions {
  /** 標籤內容 */
  label?: string | TemplateRef<EdgeLabelContext>;
  
  /** 標籤位置（0-1之間的值） */
  labelPosition?: number;
  
  /** 標籤 X 偏移 */
  labelX?: number;
  
  /** 標籤 Y 偏移 */
  labelY?: number;
  
  /** 標籤樣式 */
  labelStyle?: Record<string, string | number>;
  
  /** 標籤背景樣式 */
  labelBgStyle?: Record<string, string | number>;
  
  /** 標籤背景內邊距 */
  labelBgPadding?: [number, number];
  
  /** 標籤背景邊框半徑 */
  labelBgBorderRadius?: number;
  
  /** 是否顯示標籤背景 */
  labelShowBg?: boolean;
}

// ===================
// 邊線標記類型
// ===================

/**
 * 邊線標記
 */
export interface EdgeMarker {
  /** 標記類型 */
  type: 'arrow' | 'arrowclosed' | 'circle' | 'diamond' | 'triangle';
  
  /** 標記顏色 */
  color?: string;
  
  /** 標記寬度 */
  width?: number;
  
  /** 標記高度 */
  height?: number;
  
  /** 標記單位 */
  markerUnits?: 'strokeWidth' | 'userSpaceOnUse';
  
  /** 標記方向 */
  orient?: 'auto' | 'auto-start-reverse' | number;
  
  /** 標記偏移 */
  strokeWidth?: number;
}

// ===================
// 邊線路徑選項
// ===================

/**
 * 邊線路徑選項
 */
export interface EdgePathOptions {
  /** 曲線度（用於貝塞爾曲線） */
  curvature?: number;
  
  /** 邊框半徑（用於平滑邊線） */
  borderRadius?: number;
  
  /** 偏移量 */
  offset?: number;
  
  /** 中心位置 X */
  centerX?: number;
  
  /** 中心位置 Y */
  centerY?: number;
}

// ===================
// 邊線屬性類型
// ===================

/**
 * Angular 邊線組件屬性
 */
export interface AngularEdgeProps<
  EdgeData extends Record<string, unknown> = Record<string, unknown>,
  EdgeType extends string | undefined = string | undefined
> {
  /** 邊線實例 */
  edge: AngularEdge<EdgeData, EdgeType>;
  
  /** 是否選中 */
  selected?: boolean;
  
  /** 源節點位置 */
  sourcePosition?: XYPosition;
  
  /** 目標節點位置 */
  targetPosition?: XYPosition;
  
  /** 源 Handle 位置 */
  sourceHandlePosition?: XYPosition;
  
  /** 目標 Handle 位置 */
  targetHandlePosition?: XYPosition;
  
  /** 是否可交互 */
  interactive?: boolean;
  
  /** 縮放級別 */
  scale?: number;
  
  /** 邊線類型組件映射 */
  edgeTypes?: Record<string, Type<EdgeComponent>>;
  
  /** 默認邊線類型 */
  defaultEdgeType?: string;
  
  /** 連接線類名 */
  connectionLineClassName?: string;
  
  /** 連接線樣式 */
  connectionLineStyle?: Record<string, string | number>;
  
  /** 是否啟用邊線更新器 */
  enableEdgeUpdater?: boolean;
  
  /** 邊線更新半徑 */
  edgeUpdaterRadius?: number;
}

// ===================
// 預定義邊線類型
// ===================

/**
 * 默認邊線數據
 */
export interface DefaultEdgeData extends Record<string, unknown> {
  label?: string;
}

/**
 * 直線邊線數據
 */
export interface StraightEdgeData extends Record<string, unknown> {
  label?: string;
}

/**
 * 平滑邊線數據
 */
export interface SmoothEdgeData extends Record<string, unknown> {
  label?: string;
  curvature?: number;
}

/**
 * 步進邊線數據
 */
export interface StepEdgeData extends Record<string, unknown> {
  label?: string;
  borderRadius?: number;
}

/**
 * 貝塞爾邊線數據
 */
export interface BezierEdgeData extends Record<string, unknown> {
  label?: string;
  curvature?: number;
}

/**
 * 默認邊線類型
 */
export type DefaultEdge = AngularEdge<DefaultEdgeData, 'default'>;

/**
 * 直線邊線類型
 */
export type StraightEdge = AngularEdge<StraightEdgeData, 'straight'>;

/**
 * 平滑邊線類型
 */
export type SmoothEdge = AngularEdge<SmoothEdgeData, 'smoothstep'>;

/**
 * 步進邊線類型
 */
export type StepEdge = AngularEdge<StepEdgeData, 'step'>;

/**
 * 貝塞爾邊線類型
 */
export type BezierEdge = AngularEdge<BezierEdgeData, 'bezier'>;

// ===================
// 邊線創建工具
// ===================

/**
 * 創建邊線的選項
 */
export interface CreateEdgeOptions<
  EdgeData extends Record<string, unknown> = Record<string, unknown>,
  EdgeType extends string | undefined = string | undefined
> {
  /** 邊線 ID */
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
  
  /** 邊線樣式 */
  style?: Record<string, string | number>;
  
  /** CSS 類名 */
  className?: string;
  
  /** 標籤 */
  label?: string;
  
  /** 是否動畫 */
  animated?: boolean;
  
  /** 是否可選擇 */
  selectable?: boolean;
  
  /** 是否可刪除 */
  deletable?: boolean;
  
  /** 是否可重新連接 */
  reconnectable?: boolean | HandleType;
  
  /** 起始標記 */
  markerStart?: EdgeMarker;
  
  /** 結束標記 */
  markerEnd?: EdgeMarker;
  
  /** Z-Index */
  zIndex?: number;
  
  /** 交互寬度 */
  interactionWidth?: number;
}

/**
 * 邊線創建函數類型
 */
export type CreateEdgeFunction = <
  EdgeData extends Record<string, unknown> = Record<string, unknown>,
  EdgeType extends string | undefined = string | undefined
>(
  options: CreateEdgeOptions<EdgeData, EdgeType>
) => AngularEdge<EdgeData, EdgeType>;

// ===================
// 邊線類型守衛
// ===================

/**
 * 檢查是否為 Angular 邊線
 */
export function isAngularEdge(value: unknown): value is AngularEdge {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'source' in value &&
    'target' in value
  );
}

/**
 * 檢查是否為特定類型的邊線
 */
export function isEdgeOfType<T extends string>(
  edge: AngularEdge,
  type: T
): boolean {
  return edge.type === type;
}

/**
 * 檢查邊線是否有標籤
 */
export function hasEdgeLabel(edge: AngularEdge): boolean {
  return edge.label !== undefined && edge.label !== null && edge.label !== '';
}

/**
 * 檢查邊線是否可重新連接
 */
export function isEdgeReconnectable(edge: AngularEdge): boolean {
  return edge.reconnectable === true || 
         edge.reconnectable === 'source' || 
         edge.reconnectable === 'target';
}

// ===================
// 邊線工具類型
// ===================

/**
 * 邊線數據提取類型
 */
export type EdgeDataType<T> = T extends AngularEdge<infer D, any> ? D : never;

/**
 * 邊線類型提取類型
 */
export type EdgeTypeString<T> = T extends AngularEdge<any, infer U> ? U : never;

/**
 * 邊線組件映射類型
 */
export type EdgeTypeMap = Record<string, Type<EdgeComponent<any, any>>>;

/**
 * 邊線事件處理器映射
 */
export interface EdgeEventHandlers<
  EdgeData extends Record<string, unknown> = Record<string, unknown>,
  EdgeType extends string | undefined = string | undefined
> {
  onClick?: (event: MouseEvent, edge: AngularEdge<EdgeData, EdgeType>) => void;
  onDoubleClick?: (event: MouseEvent, edge: AngularEdge<EdgeData, EdgeType>) => void;
  onMouseEnter?: (event: MouseEvent, edge: AngularEdge<EdgeData, EdgeType>) => void;
  onMouseLeave?: (event: MouseEvent, edge: AngularEdge<EdgeData, EdgeType>) => void;
  onContextMenu?: (event: MouseEvent, edge: AngularEdge<EdgeData, EdgeType>) => void;
  onFocus?: (event: FocusEvent, edge: AngularEdge<EdgeData, EdgeType>) => void;
  onBlur?: (event: FocusEvent, edge: AngularEdge<EdgeData, EdgeType>) => void;
}

/**
 * 連接線類型
 */
export interface ConnectionLine {
  /** 源位置 */
  fromPosition: XYPosition;
  
  /** 目標位置 */
  toPosition: XYPosition;
  
  /** 源 Handle */
  fromHandle?: {
    id: string;
    type: HandleType;
    position: XYPosition;
  };
  
  /** 目標 Handle */
  toHandle?: {
    id: string;
    type: HandleType;
    position: XYPosition;
  };
  
  /** 連接類型 */
  connectionType?: string;
  
  /** 連接樣式 */
  connectionStyle?: Record<string, string | number>;
  
  /** 連接類名 */
  connectionClassName?: string;
}

/**
 * 邊線路徑計算函數類型
 */
export type EdgePathFunction = (params: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition?: string;
  targetPosition?: string;
  options?: EdgePathOptions;
}) => string;

/**
 * 邊線更新器類型
 */
export interface EdgeUpdater {
  /** 更新器位置 */
  position: number;
  
  /** 更新器半徑 */
  radius: number;
  
  /** 更新器樣式 */
  style?: Record<string, string | number>;
  
  /** 更新器類名 */
  className?: string;
  
  /** 更新開始事件 */
  onUpdateStart?: (event: MouseEvent) => void;
  
  /** 更新中事件 */
  onUpdate?: (event: MouseEvent) => void;
  
  /** 更新結束事件 */
  onUpdateEnd?: (event: MouseEvent) => void;
}

// 導出常用類型別名
export type Edge<T extends Record<string, unknown> = Record<string, unknown>, U extends string | undefined = string | undefined> = AngularEdge<T, U>;