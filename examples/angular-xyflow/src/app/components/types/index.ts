/**
 * Angular XYFlow 類型系統入口文件
 * 
 * 這是 Angular XYFlow 的主要類型導出入口，提供完整的類型定義
 * 包含節點、邊線、服務、組件等所有相關類型
 */

// ===================
// 基礎類型（重用 System 包）
// ===================

// 重新導出核心基礎類型
export type {
  // 基礎幾何類型
  XYPosition,
  Rect,
  Box,
  Dimensions,
  Transform,
  
  // 基礎節點和邊線類型
  NodeBase,
  EdgeBase,
  
  // Handle 類型
  HandleElement,
  
  // 連接類型
  Connection,
  ConnectionLookup,
  
  // 變化類型
  NodeChange,
  EdgeChange,
  
  // 工具類型
  CoordinateExtent,
  
  // 視窗類型
  Viewport,
  ViewportHelperFunctions,
  
  // 拖拽類型
  OnError,
  
} from './system-types';

// ===================
// Angular 特定核心類型
// ===================

export type {
  // Angular 節點類型
  AngularNode,
  AngularNodeProps,
  NodeComponent,
  NodeComponentContext,
  InternalAngularNode,
  
  // Handle 類型
  AngularHandle,
  AngularHandleProps,
  
} from './nodes';

export type {
  // 邊線相關
  AngularEdge,
  AngularEdgeProps,
  EdgeComponent,
  EdgeComponentContext,
  EdgeLabelOptions,
  EdgeMarker,
  EdgePathOptions,
  
} from './edges';

// ===================
// 組件屬性類型
// ===================

export type {
  // 主要組件屬性
  AngularFlowProps,
  FlowRendererProps,
  ViewportProps,
  
  // 控制組件屬性
  ControlsProps,
  MiniMapProps,
  BackgroundProps,
  
  // 工具組件屬性
  NodeToolbarProps,
  NodeResizerProps,
  PanelProps,
  AttributionProps,
  
} from './component-props';

// ===================
// 服務類型
// ===================

export type {
  // 核心服務接口
  AngularFlowService,
  FlowStoreService,
  
  // 特定服務接口
  NodeService,
  EdgeService,
  ViewportService,
  SelectionService,
  InteractionService,
  
  // 服務配置
  FlowServiceConfig,
  StoreConfig,
  
} from './services';

// ===================
// 事件類型
// ===================

export type {
  // 節點事件
  NodeEventHandler,
  NodeClickEventHandler,
  NodeMouseEventHandler,
  NodeDragEventHandler,
  
  // 邊線事件
  EdgeEventHandler,
  EdgeClickEventHandler,
  EdgeMouseEventHandler,
  
  // 連接事件
  ConnectionEventHandler,
  ConnectEventHandler,
  
  // 選擇事件
  SelectionEventHandler,
  
  // 視窗事件
  ViewportEventHandler,
  
  // 通用事件
  FlowEventHandler,
  
} from './events';

// ===================
// Hook 和狀態類型
// ===================

export type {
  // 狀態 Hook 返回類型
  UseNodesState,
  UseEdgesState,
  UseViewportState,
  UseSelectionState,
  
  // 操作 Hook 返回類型
  UseNodeOperations,
  UseEdgeOperations,
  UseViewportOperations,
  UseConnectionOperations,
  
  // Hook 配置
  HookConfig,
  UseFlowConfig,
  
} from './hooks';

// ===================
// 工具和輔助類型
// ===================

export type {
  // 類型守衛
  NodeTypeGuard,
  EdgeTypeGuard,
  
  // 工具類型
  DeepPartial,
  RequiredKeys,
  OptionalKeys,
  PickByType,
  
  // 樣式相關
  CSSProperties,
  ClassValue,
  StyleValue,
  
  // 泛型輔助
  NodeData,
  EdgeData,
  ComponentRef,
  
} from './utils';

// ===================
// 常量和枚舉
// ===================

export {
  // 位置枚舉
  Position,
  
  // Handle 類型枚舉
  HandleType,
  
  // 連接模式枚舉
  ConnectionMode,
  
  // 選擇模式枚舉
  SelectionMode,
  
  // 平移模式枚舉
  PanOnScrollMode,
  
  // 面板位置枚舉
  PanelPosition,
  
  // 控制器方向枚舉
  ControlPosition,
  
  // 背景變體枚舉
  BackgroundVariant,
  
} from './constants';

// ===================
// 類型工具函數
// ===================

// 從 type-guards 導出基礎守衛函數
export {
  isNode,
  isEdge,
  isConnection,
} from './type-guards';

// 從 nodes 導出節點相關函數
export {
  isAngularNode,
} from './nodes';

// 從 edges 導出邊線相關函數  
export {
  isAngularEdge,
} from './edges';

// ===================
// 默認導出（主要類型聚合）
// ===================

/**
 * 主要的 Angular Flow 類型集合
 */
export interface AngularFlowTypes {
  // 核心類型
  Node: AngularNode;
  Edge: AngularEdge;
  Handle: AngularHandle;
  
  // 組件類型
  NodeComponent: NodeComponent;
  EdgeComponent: EdgeComponent;
  
  // 服務類型
  FlowService: AngularFlowService;
  
  // 事件類型
  NodeEventHandler: NodeEventHandler;
  EdgeEventHandler: EdgeEventHandler;
  
  // 屬性類型
  FlowProps: AngularFlowProps;
  ControlsProps: ControlsProps;
  MiniMapProps: MiniMapProps;
}

/**
 * 類型工具集合
 */
export interface TypeUtils {
  // 類型守衛
  Guards: {
    isNode: typeof isNode;
    isEdge: typeof isEdge;
    isAngularNode: typeof isAngularNode;
    isAngularEdge: typeof isAngularEdge;
  };
  
  // 類型轉換
  Converters: {
    toAngularNode: typeof toAngularNode;
    toAngularEdge: typeof toAngularEdge;
  };
  
  // 類型驗證
  Validators: {
    validateNode: typeof validateNode;
    validateEdge: typeof validateEdge;
  };
}

/**
 * 默認的類型配置
 */
// 需要先導入缺少的類型
import type { AngularNode, NodeComponent, AngularHandle } from './nodes';
import type { AngularEdge, EdgeComponent } from './edges';
import type { AngularFlowService } from './services';
import type { NodeEventHandler, EdgeEventHandler } from './events';
import type { AngularFlowProps, ControlsProps, MiniMapProps } from './component-props';

export const DEFAULT_TYPES: AngularFlowTypes = {
  Node: {} as AngularNode,
  Edge: {} as AngularEdge,
  Handle: {} as AngularHandle,
  NodeComponent: {} as NodeComponent,
  EdgeComponent: {} as EdgeComponent,
  FlowService: {} as AngularFlowService,
  NodeEventHandler: {} as NodeEventHandler,
  EdgeEventHandler: {} as EdgeEventHandler,
  FlowProps: {} as AngularFlowProps,
  ControlsProps: {} as ControlsProps,
  MiniMapProps: {} as MiniMapProps,
};

// 臨時類型守衛函數（待實現）
const isNode = (item: any): boolean => item && typeof item.id === 'string' && item.position;
const isEdge = (item: any): boolean => item && typeof item.source === 'string' && typeof item.target === 'string';
const isAngularNode = (item: any): boolean => isNode(item);
const isAngularEdge = (item: any): boolean => isEdge(item);

// 臨時轉換函數（待實現）
const toAngularNode = (node: any): AngularNode => node as AngularNode;
const toAngularEdge = (edge: any): AngularEdge => edge as AngularEdge;

// 臨時驗證函數（待實現）
const validateNode = (node: any): boolean => true;
const validateEdge = (edge: any): boolean => true;

/**
 * 類型工具實例
 */
export const TYPE_UTILS: TypeUtils = {
  Guards: {
    isNode,
    isEdge,
    isAngularNode,
    isAngularEdge,
  },
  Converters: {
    toAngularNode,
    toAngularEdge,
  },
  Validators: {
    validateNode,
    validateEdge,
  },
};

// ===================
// 版本信息
// ===================

export const ANGULAR_FLOW_TYPES_VERSION = '1.0.0';
export const COMPATIBILITY_VERSION = {
  reactFlow: '12.0.0',
  angular: '18.0.0',
  typescript: '5.0.0',
};