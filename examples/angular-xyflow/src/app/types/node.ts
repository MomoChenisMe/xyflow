// 基礎類型定義

// 位置類型
export interface XYPosition {
  x: number;
  y: number;
}

// 尺寸類型
export interface Dimensions {
  width: number;
  height: number;
}

// 位置枚舉
export enum Position {
  Left = 'left',
  Top = 'top',
  Right = 'right',
  Bottom = 'bottom',
}

// 節點基礎類型
export interface Node<
  NodeData extends Record<string, unknown> = Record<string, unknown>,
  NodeType extends string | undefined = string | undefined
> {
  id: string;
  type?: NodeType;
  position: XYPosition;
  data: NodeData;
  style?: Record<string, any>;
  className?: string;
  selected?: boolean;
  draggable?: boolean;
  selectable?: boolean;
  connectable?: boolean;
  deletable?: boolean;
  focusable?: boolean;
  width?: number;
  height?: number;
  parentId?: string;
  expandParent?: boolean;
  ariaRole?: string;
  zIndex?: number;
  hidden?: boolean;
}

// Handle 邊界
export interface HandleBounds {
  source?: HandleBound[];
  target?: HandleBound[];
}

export interface HandleBound {
  id?: string;
  position: Position;
  x: number;
  y: number;
  width: number;
  height: number;
}

// 內部節點類型
export interface InternalNode<NodeType extends Node = Node> {
  id: string;
  type?: NodeType['type'];
  position: XYPosition;
  data: NodeType['data'];
  style?: Record<string, any>;
  className?: string;
  selected?: boolean;
  draggable?: boolean;
  selectable?: boolean;
  connectable?: boolean;
  deletable?: boolean;
  focusable?: boolean;
  width?: number;
  height?: number;
  parentId?: string;
  expandParent?: boolean;
  ariaRole?: string;
  measured: Dimensions | null;
  internals: {
    positionAbsolute: XYPosition;
    z: number;
    userNode: NodeType;
    handleBounds?: HandleBounds;
    isParent: boolean;
  };
}

// 內建節點類型
export type BuiltInNode =
  | Node<{ label: string }, 'input' | 'output' | 'default'>
  | Node<Record<string, never>, 'group'>;

// 節點變更類型
export type NodeChange =
  | NodeDimensionChange
  | NodePositionChange
  | NodeSelectionChange
  | NodeRemoveChange
  | NodeAddChange
  | NodeReplaceChange;

export interface NodeDimensionChange {
  id: string;
  type: 'dimensions';
  dimensions?: Dimensions;
  measured?: Dimensions;
  resizing?: boolean;
}

export interface NodePositionChange {
  id: string;
  type: 'position';
  position?: XYPosition;
  dragging?: boolean;
}

export interface NodeSelectionChange {
  id: string;
  type: 'selection';
  selected: boolean;
}

export interface NodeRemoveChange {
  id: string;
  type: 'remove';
}

export interface NodeAddChange<NodeType extends Node = Node> {
  id: string;
  type: 'add';
  node: NodeType;
}

export interface NodeReplaceChange<NodeType extends Node = Node> {
  id: string;
  type: 'replace';
  node: NodeType;
}
