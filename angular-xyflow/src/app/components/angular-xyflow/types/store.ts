// Angular 核心模組
import { Signal } from '@angular/core';

// XyFlow 系統模組
import { 
  Transform, 
  CoordinateExtent, 
  ConnectionMode,
  ConnectionState,
  PanZoomInstance,
  NodeOrigin,
  SnapGrid,
  InternalNodeBase
} from '@xyflow/system';

// 專案內部模組
import { 
  AngularNode, 
  AngularEdge,
  NodeChange,
  EdgeChange
} from '../types';

/**
 * Angular XYFlow 的統一 Store 狀態定義
 * 類似於 React 版本的 Zustand store 結構
 */
export interface AngularFlowStore<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> {
  // ===== 基礎狀態 =====
  rfId: string;
  width: number;
  height: number;
  transform: Transform;
  
  // ===== 節點和邊 =====
  nodes: NodeType[];
  edges: EdgeType[];
  nodeLookup: Map<string, InternalNodeBase<NodeType>>;
  edgeLookup: Map<string, EdgeType>;
  parentLookup: Map<string, string[]>;
  connectionLookup: Map<string, string[]>;
  
  // ===== 初始化狀態 =====
  nodesInitialized: boolean;
  hasDefaultNodes: boolean;
  hasDefaultEdges: boolean;
  
  // ===== 交互狀態 =====
  nodesDraggable: boolean;
  nodesConnectable: boolean;
  nodesFocusable: boolean;
  edgesFocusable: boolean;
  edgesReconnectable: boolean;
  elementsSelectable: boolean;
  selectNodesOnDrag: boolean;
  elevateNodesOnSelect: boolean;
  elevateEdgesOnSelect: boolean;
  
  // ===== 多選和選擇狀態 =====
  multiSelectionActive: boolean;
  selectedNodes: string[];
  selectedEdges: string[];
  nodesSelectionActive: boolean;
  userSelectionActive: boolean;
  
  // ===== 拖曳狀態 =====
  dragging: boolean;
  paneDragging: boolean;
  nodeDragThreshold: number;
  autoPanOnNodeFocus: boolean;
  
  // ===== 視窗和縮放 =====
  minZoom: number;
  maxZoom: number;
  snapToGrid: boolean;
  snapGrid: SnapGrid;
  nodeOrigin: NodeOrigin;
  nodeExtent: CoordinateExtent;
  translateExtent: CoordinateExtent;
  
  // ===== DOM 和 PanZoom =====
  domNode: HTMLDivElement | null;
  panZoom: PanZoomInstance | null;
  noPanClassName: string;
  
  // ===== 連接狀態 =====
  connection: ConnectionState<InternalNodeBase<NodeType>>;
  connectionMode: ConnectionMode;
  connectionDragThreshold: number;
  connectOnClick: boolean;
  connectionClickStartHandle: any | null;
  
  // ===== FitView 相關 =====
  fitViewQueued: boolean;
  fitViewOptions: any | undefined;
  
  // ===== 事件處理器 =====
  onNodesChange: ((changes: NodeChange<NodeType>[]) => void) | null;
  onEdgesChange: ((changes: EdgeChange<EdgeType>[]) => void) | null;
  onConnect: ((connection: any) => void) | null;
  onConnectStart: ((event: any, params: any) => void) | null;
  onConnectEnd: ((event: any) => void) | null;
  
  onClickConnectStart: ((event: any, params: any) => void) | null;
  onClickConnectEnd: ((event: any) => void) | null;
  
  onNodeDragStart: ((event: any, node: NodeType, nodes: NodeType[]) => void) | null;
  onNodeDrag: ((event: any, node: NodeType, nodes: NodeType[]) => void) | null;
  onNodeDragStop: ((event: any, node: NodeType, nodes: NodeType[]) => void) | null;
  
  onSelectionDragStart: ((event: any) => void) | null;
  onSelectionDrag: ((event: any) => void) | null;
  onSelectionDragStop: ((event: any) => void) | null;
  
  onMoveStart: ((event: any, viewport: any) => void) | null;
  onMove: ((event: any, viewport: any) => void) | null;
  onMoveEnd: ((event: any, viewport: any) => void) | null;
  
  onError: ((code: string, message: string) => void) | null;
  
  // ===== 默認選項 =====
  defaultEdgeOptions: Partial<EdgeType> | undefined;
}

/**
 * 創建初始 Store 狀態的工廠函數
 */
export function createInitialStore<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
>(): AngularFlowStore<NodeType, EdgeType> {
  return {
    // 基礎狀態
    rfId: '',
    width: 0,
    height: 0,
    transform: [0, 0, 1],
    
    // 節點和邊
    nodes: [],
    edges: [],
    nodeLookup: new Map(),
    edgeLookup: new Map(),
    parentLookup: new Map(),
    connectionLookup: new Map(),
    
    // 初始化狀態
    nodesInitialized: false,
    hasDefaultNodes: false,
    hasDefaultEdges: false,
    
    // 交互狀態
    nodesDraggable: true,
    nodesConnectable: true,
    nodesFocusable: true,
    edgesFocusable: true,
    edgesReconnectable: false,
    elementsSelectable: true,
    selectNodesOnDrag: true,
    elevateNodesOnSelect: false,
    elevateEdgesOnSelect: false,
    
    // 多選和選擇狀態
    multiSelectionActive: false,
    selectedNodes: [],
    selectedEdges: [],
    nodesSelectionActive: false,
    userSelectionActive: false,
    
    // 拖曳狀態
    dragging: false,
    paneDragging: false,
    nodeDragThreshold: 0,
    autoPanOnNodeFocus: true,
    
    // 視窗和縮放
    minZoom: 0.5,
    maxZoom: 2,
    snapToGrid: false,
    snapGrid: [15, 15],
    nodeOrigin: [0, 0],
    nodeExtent: [[-Infinity, -Infinity], [Infinity, Infinity]],
    translateExtent: [[-Infinity, -Infinity], [Infinity, Infinity]],
    
    // DOM 和 PanZoom
    domNode: null,
    panZoom: null,
    noPanClassName: 'nopan',
    
    // 連接狀態
    connection: {
      inProgress: false,
      from: null,
      fromHandle: null,
      to: null,
      toHandle: null,
      isValid: null,
      fromPosition: 'bottom' as any,
      fromNode: null,
      toPosition: 'top' as any,
      toNode: null
    },
    connectionMode: ConnectionMode.Strict,
    connectionDragThreshold: 0,
    connectOnClick: true,
    connectionClickStartHandle: null,
    
    // FitView
    fitViewQueued: false,
    fitViewOptions: undefined,
    
    // 事件處理器
    onNodesChange: null,
    onEdgesChange: null,
    onConnect: null,
    onConnectStart: null,
    onConnectEnd: null,
    onClickConnectStart: null,
    onClickConnectEnd: null,
    onNodeDragStart: null,
    onNodeDrag: null,
    onNodeDragStop: null,
    onSelectionDragStart: null,
    onSelectionDrag: null,
    onSelectionDragStop: null,
    onMoveStart: null,
    onMove: null,
    onMoveEnd: null,
    onError: null,
    
    // 默認選項
    defaultEdgeOptions: undefined
  };
}