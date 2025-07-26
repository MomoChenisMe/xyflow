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
  SelectionMode
} from '@xyflow/system';

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
  selected?: boolean;
  sourcePosition?: Position;
  targetPosition?: Position;
  hidden?: boolean;
  dragging?: boolean;
  width?: number;
  height?: number;
  parentId?: string;
  zIndex?: number;
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
  selected?: boolean;
  data?: T;
  className?: string;
  zIndex?: number;
}

// Angular Flow Props interface
export interface AngularFlowProps<NodeType extends AngularNode = AngularNode, EdgeType extends AngularEdge = AngularEdge> {
  nodes?: NodeType[];
  edges?: EdgeType[];
  defaultNodes?: NodeType[];
  defaultEdges?: EdgeType[];
  onNodesChange?: (nodes: NodeType[]) => void;
  onEdgesChange?: (edges: EdgeType[]) => void;
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
  panOnDrag?: boolean;
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

// Angular Flow Instance interface similar to React Flow's useReactFlow
export interface AngularFlowInstance<NodeType extends AngularNode = AngularNode, EdgeType extends AngularEdge = AngularEdge> {
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