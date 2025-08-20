import { 
  NodeBase, 
  EdgeBase, 
  Position, 
  XYPosition, 
  Connection,
  NodeOrigin,
  FitViewOptionsBase as SystemFitViewOptions,
  ConnectionLineType,
  PanOnScrollMode,
  SelectionMode,
  Dimensions
} from '@xyflow/system';
import { Type } from '@angular/core';

// NodeProps - 與 React Flow 的 NodeProps 對應，用於傳遞給節點元件的屬性
export interface NodeProps<NodeType extends AngularNode = AngularNode> {
  id: string;
  data: NodeType['data'];
  type?: string;
  selected: boolean;
  dragging: boolean;
  isConnectable: boolean;
  sourcePosition?: Position;
  targetPosition?: Position;
  width?: number;
  height?: number;
  parentId?: string;
  zIndex: number;
  draggable: boolean;
  selectable: boolean;
  deletable: boolean;
  positionAbsoluteX: number;
  positionAbsoluteY: number;
  dragHandle?: string;
}

// NodeTypes - 節點類型對應表，映射節點類型字串到對應的 Angular 元件
export type NodeTypes = Record<string, Type<any>>;

// EdgeComponentProps - 用於傳遞給邊緣組件的屬性（不包含 source 和 target）
export interface EdgeComponentProps<EdgeType extends AngularEdge = AngularEdge> extends Record<string, any> {
  id: string;
  data: EdgeType['data'];
  type?: string;
  selected: boolean;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  sourceHandleId?: string;
  targetHandleId?: string;
  markerStart?: EdgeMarker | string;
  markerEnd?: EdgeMarker | string;
  style?: Record<string, any>;
  animated?: boolean;
  hidden?: boolean;
  deletable?: boolean;
  selectable?: boolean;
  focusable?: boolean;
  interactionWidth?: number;
  pathOptions?: any;
  label?: string | number;
  labelStyle?: Record<string, any>;
  labelShowBg?: boolean;
  labelBgStyle?: Record<string, any>;
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;
}

// EdgeProps - 完整的邊緣屬性（包含 source 和 target，用於內部管理）
export interface EdgeProps<EdgeType extends AngularEdge = AngularEdge> extends EdgeComponentProps<EdgeType> {
  source: string;  // 源節點 ID
  target: string;  // 目標節點 ID
}

// EdgeTypes - 邊類型對應表，映射邊類型字串到對應的 Angular 元件
export type EdgeTypes = Record<string, Type<any>>;

// Angular-specific Node type extending system NodeBase
export interface AngularNode<T extends Record<string, unknown> = Record<string, unknown>> extends NodeBase<T> {
  id: string;
  position: XYPosition;
  data: T;
  type?: string;
  className?: string;
  draggable?: boolean;
  selectable?: boolean;
  connectable?: boolean;
  deletable?: boolean;
  focusable?: boolean;
  initialWidth?: number;  // 初始寬度，用於 fitView 計算
  initialHeight?: number; // 初始高度，用於 fitView 計算
  selected?: boolean;
  sourcePosition?: Position;
  targetPosition?: Position;
  hidden?: boolean;
  dragging?: boolean;
  width?: number;
  height?: number;
  parentId?: string;
  zIndex?: number;
  style?: Record<string, any>;
  origin?: [number, number]; // 新增：節點原點屬性，用於定位計算
  measured?: { width: number; height: number }; // 新增：測量的尺寸屬性
  /**
   * A class name that can be applied to elements inside the node that allows those elements to act
   * as drag handles, letting the user drag the node by clicking and dragging on those elements.
   */
  dragHandle?: string;
  /**
   * The ARIA role attribute for the node element, used for accessibility.
   * @default "group"
   */
  ariaRole?: string;
  /**
   * General escape hatch for adding custom attributes to the node's DOM element.
   */
  domAttributes?: Record<string, any>;
}

// Edge marker type
export enum MarkerType {
  Arrow = 'arrow',
  ArrowClosed = 'arrowclosed'
}

export interface EdgeMarker {
  type: MarkerType;
  color?: string;
  width?: number;
  height?: number;
  markerUnits?: 'strokeWidth' | 'userSpaceOnUse';
  strokeWidth?: number;
  orient?: string;
}

// Angular-specific Edge type extending system EdgeBase
export interface AngularEdge<T extends Record<string, unknown> = Record<string, unknown>> extends EdgeBase<T> {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  animated?: boolean;
  hidden?: boolean;
  deletable?: boolean;
  selectable?: boolean;
  focusable?: boolean;
  selected?: boolean;
  data?: T;
  className?: string;
  style?: Record<string, any>;
  zIndex?: number;
  markerStart?: EdgeMarker | string;
  markerEnd?: EdgeMarker | string;
  label?: string | any;
  labelStyle?: Record<string, any>;
  labelShowBg?: boolean;
  labelBgStyle?: Record<string, any>;
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;
  pathOptions?: any;
  interactionWidth?: number;
}

// Angular XY Flow Props interface
export interface AngularXYFlowProps<NodeType extends AngularNode = AngularNode, EdgeType extends AngularEdge = AngularEdge> {
  nodes?: NodeType[];
  edges?: EdgeType[];
  defaultNodes?: NodeType[];
  defaultEdges?: EdgeType[];
  nodeTypes?: NodeTypes;
  edgeTypes?: EdgeTypes;
  onNodesChange?: (changes: NodeChange<NodeType>[]) => void;
  onEdgesChange?: (changes: EdgeChange<EdgeType>[]) => void;
  onConnect?: (connection: Connection) => void;
  onNodeClick?: (event: MouseEvent, node: NodeType) => void;
  onNodeDragStart?: (event: MouseEvent, node: NodeType, nodes: NodeType[]) => void;
  onNodeDrag?: (event: MouseEvent, node: NodeType, nodes: NodeType[]) => void;
  onNodeDragStop?: (event: MouseEvent, node: NodeType, nodes: NodeType[]) => void;
  onSelectionDragStart?: (event: MouseEvent, nodes: NodeType[]) => void;
  onSelectionDrag?: (event: MouseEvent, nodes: NodeType[]) => void;
  onSelectionDragStop?: (event: MouseEvent, nodes: NodeType[]) => void;
  className?: string;
  minZoom?: number;
  maxZoom?: number;
  fitView?: boolean;
  fitViewOptions?: SystemFitViewOptions;
  selectNodesOnDrag?: boolean;
  nodeOrigin?: NodeOrigin;
  elevateEdgesOnSelect?: boolean;
  elevateNodesOnSelect?: boolean;
  defaultEdgeOptions?: Partial<EdgeType>;
  nodeDragThreshold?: number;
  connectionLineType?: ConnectionLineType;
  zoomOnScroll?: boolean;
  zoomOnPinch?: boolean;
  panOnDrag?: boolean | number[];
  panOnScroll?: boolean;
  panOnScrollSpeed?: number;
  panOnScrollMode?: PanOnScrollMode;
  zoomOnDoubleClick?: boolean;
  selectionMode?: SelectionMode;
  selectionOnDrag?: boolean;
  preventScrolling?: boolean;
  nodesDraggable?: boolean;
  nodesConnectable?: boolean;
  nodesFocusable?: boolean;
  edgesFocusable?: boolean;
  elementsSelectable?: boolean;
}

// Viewport type
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

// Angular XY Flow Instance interface similar to React Flow's useReactFlow
export interface AngularXYFlowInstance<NodeType extends AngularNode = AngularNode, EdgeType extends AngularEdge = AngularEdge> {
  getNodes: () => NodeType[];
  getNode: (id: string) => NodeType | undefined;
  getEdges: () => EdgeType[];
  getEdge: (id: string) => EdgeType | undefined;
  setNodes: (nodes: NodeType[] | ((nodes: NodeType[]) => NodeType[])) => void;
  setEdges: (edges: EdgeType[] | ((edges: EdgeType[]) => EdgeType[])) => void;
  addNodes: (nodes: NodeType | NodeType[]) => void;
  addEdges: (edges: EdgeType | EdgeType[]) => void;
  updateNode: (id: string, nodeUpdate: Partial<NodeType> | ((node: NodeType) => Partial<NodeType>)) => void;
  updateNodeData: (id: string, dataUpdate: any | ((node: NodeType) => any)) => void;
  updateEdge: (id: string, edgeUpdate: Partial<EdgeType> | ((edge: EdgeType) => Partial<EdgeType>)) => void;
  deleteElements: (elements: { nodes?: { id: string }[]; edges?: { id: string }[] }) => void;
  fitView: (options?: SystemFitViewOptions) => void;
  setViewport: (viewport: Viewport) => void;
  getViewport: () => Viewport;
  toObject: () => { nodes: NodeType[]; edges: EdgeType[]; viewport: Viewport };
}

// Background variant type
export enum BackgroundVariant {
  Lines = 'lines',
  Dots = 'dots',
  Cross = 'cross'
}

// Edge types
export enum EdgeType {
  Default = 'default',
  Straight = 'straight',
  Step = 'step',
  SmoothStep = 'smoothstep',
  Bezier = 'bezier'
}

// Node types  
export enum NodeType {
  Default = 'default',
  Input = 'input',
  Output = 'output'
}

// Handle related types
export interface Handle {
  id: string | null;
  nodeId: string;
  position: Position;
  type: 'source' | 'target';
  x: number;
  y: number;
}

// Connection state types
export interface NoConnection {
  inProgress: false;
}

export interface ConnectionInProgress<NodeType extends AngularNode = AngularNode> {
  inProgress: true;
  isValid: boolean | null;
  from: XYPosition;
  fromHandle: Handle;
  fromPosition: Position;
  fromNode: NodeType;
  to: XYPosition;
  toHandle: Handle | null;
  toPosition: Position;
  toNode: NodeType | null;
}

export type ConnectionState<NodeType extends AngularNode = AngularNode> = 
  | ConnectionInProgress<NodeType>
  | NoConnection;

// Connection line component props
export interface ConnectionLineComponentProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromPosition: Position;
  toPosition: Position;
  isValid: boolean | null;
  connectionLineStyle?: Record<string, any>;
}

// ConnectionInfo - 用於 connectionLookup 的連接資訊
export interface ConnectionInfo {
  edgeId: string;
  connectedNode: string;
  sourceHandle: string | null;
  targetHandle: string | null;
  isSource: boolean;
}

// Template context for connection line
export interface ConnectionLineTemplateContext {
  $implicit: ConnectionLineComponentProps;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromPosition: Position;
  toPosition: Position;
  isValid: boolean | null;
  connectionLineStyle?: Record<string, any>;
}

// Node template component props
export interface NodeTemplateComponentProps<NodeType extends AngularNode = AngularNode> {
  node: NodeType;
  selected: boolean;
  dragging: boolean;
  onNodeClick?: (event: MouseEvent) => void;
  onColorChange?: (event: Event) => void;
}

// Template context for custom nodes
export interface NodeTemplateContext<NodeType extends AngularNode = AngularNode> {
  $implicit: NodeTemplateComponentProps<NodeType>;
  node: NodeType;
  selected: boolean;
  dragging: boolean;
  onNodeClick?: (event: MouseEvent) => void;
  onColorChange?: (event: Event) => void;
}

// Minimap node component props - 匹配 React MiniMapNodeProps
export interface MinimapNodeComponentProps<NodeType extends AngularNode = AngularNode> {
  node: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  selected: boolean;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
}

// Template context for custom minimap nodes
export interface MinimapNodeTemplateContext<NodeType extends AngularNode = AngularNode> {
  $implicit: MinimapNodeComponentProps<NodeType>;
  node: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  selected: boolean;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
}

// Change types - 與 React Flow 的 changes 系統對應
export type NodeDimensionChange = {
  id: string;
  type: 'dimensions';
  dimensions?: Dimensions;
  resizing?: boolean;
  setAttributes?: boolean | 'width' | 'height';
};

export type NodePositionChange = {
  id: string;
  type: 'position';
  position?: XYPosition;
  positionAbsolute?: XYPosition;
  dragging?: boolean;
};

export type NodeSelectionChange = {
  id: string;
  type: 'select';
  selected: boolean;
};

export type NodeRemoveChange = {
  id: string;
  type: 'remove';
};

export type NodeAddChange<NodeType extends AngularNode = AngularNode> = {
  item: NodeType;
  type: 'add';
  index?: number;
};

export type NodeReplaceChange<NodeType extends AngularNode = AngularNode> = {
  id: string;
  item: NodeType;
  type: 'replace';
};

export type NodeChange<NodeType extends AngularNode = AngularNode> =
  | NodeDimensionChange
  | NodePositionChange
  | NodeSelectionChange
  | NodeRemoveChange
  | NodeAddChange<NodeType>
  | NodeReplaceChange<NodeType>;

export type EdgeSelectionChange = NodeSelectionChange;
export type EdgeRemoveChange = NodeRemoveChange;

export type EdgeAddChange<EdgeType extends AngularEdge = AngularEdge> = {
  item: EdgeType;
  type: 'add';
  index?: number;
};

export type EdgeReplaceChange<EdgeType extends AngularEdge = AngularEdge> = {
  id: string;
  item: EdgeType;
  type: 'replace';
};

export type EdgeChange<EdgeType extends AngularEdge = AngularEdge> =
  | EdgeSelectionChange
  | EdgeRemoveChange
  | EdgeAddChange<EdgeType>
  | EdgeReplaceChange<EdgeType>;

// 錯誤處理相關類型 - 與 React Flow 保持一致
export type ErrorCode = '003' | '011'; // 擴展其他錯誤代碼時在此添加

/**
 * 錯誤處理函數類型
 * 與 React Flow 的 onError 事件保持一致
 */
export type OnErrorHandler = (code: ErrorCode, message: string) => void;

// 重新匯出從 @xyflow/system 導入的類型
export type { Connection, Position, XYPosition, NodeOrigin, ConnectionLineType };

// ===============================
// 新增功能相關類型定義
// ===============================

// 鍵盤按鍵類型
export type KeyboardKey = string;

// 多選按鍵組合類型 - 對應 React Flow 的 multiSelectionKeyCode
export type MultiSelectionKeyCode = KeyboardKey | KeyboardKey[];

// 縮放激活按鍵類型 - 對應 React Flow 的 zoomActivationKeyCode  
export type ZoomActivationKeyCode = KeyboardKey;

// 選擇框激活按鍵類型 - 對應 React Flow 的 selectionKeyCode
export type SelectionKeyCode = KeyboardKey;

// 選擇上下文菜單事件類型
export interface SelectionContextMenuEvent<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> {
  event: MouseEvent;
  nodes: NodeType[];
  edges: EdgeType[];
}

// 選擇變化事件類型
export interface SelectionChangeEvent<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> {
  nodes: NodeType[];
  edges: EdgeType[];
}

// 選擇開始事件類型
export interface SelectionStartEvent {
  event: MouseEvent;
}

// 選擇結束事件類型
export interface SelectionEndEvent<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> {
  event: MouseEvent;
  nodes: NodeType[];
  edges: EdgeType[];
}

// 選擇框狀態接口
export interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;  
  endY: number;
  active: boolean;
}

// 選擇框樣式接口
export interface SelectionBoxStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: string;
  opacity?: number;
}

// 重新導出 SelectionMode 以便使用
export { SelectionMode, PanOnScrollMode };