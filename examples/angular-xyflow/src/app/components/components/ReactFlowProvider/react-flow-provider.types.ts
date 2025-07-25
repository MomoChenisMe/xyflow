import { NodeBase } from '../Nodes/nodes.types';

/**
 * 坐標範圍類型 - 模擬 @xyflow/system 的 CoordinateExtent
 */
export type CoordinateExtent = [[number, number], [number, number]];

/**
 * 節點原點類型 - 模擬 @xyflow/system 的 NodeOrigin
 */
export type NodeOrigin = [number, number];

/**
 * 適應視圖選項
 */
export interface FitViewOptions {
  /** 是否包含所有節點 */
  includeHiddenNodes?: boolean;
  /** 最小縮放級別 */
  minZoom?: number;
  /** 最大縮放級別 */
  maxZoom?: number;
  /** 內邊距 */
  padding?: number;
  /** 動畫持續時間 */
  duration?: number;
  /** 節點 ID 過濾器 */
  nodes?: string[];
}

/**
 * Angular Flow Provider 配置
 */
export interface AngularFlowProviderConfig {
  /** 初始節點 - 用於初始化 flow，不是動態的 */
  initialNodes?: NodeBase[];
  /** 初始邊緣 - 用於初始化 flow，不是動態的 */
  initialEdges?: any[];
  /** 默認節點 */
  defaultNodes?: NodeBase[];
  /** 默認邊緣 */
  defaultEdges?: any[];
  /** 初始寬度 - 在服務器端使用 fitView 時必需 */
  initialWidth?: number;
  /** 初始高度 - 在服務器端使用 fitView 時必需 */
  initialHeight?: number;
  /** 是否自動適應視圖 */
  fitView?: boolean;
  /** 初始適應視圖選項 */
  initialFitViewOptions?: FitViewOptions;
  /** 初始最小縮放級別 */
  initialMinZoom?: number;
  /** 初始最大縮放級別 */
  initialMaxZoom?: number;
  /** 節點原點 */
  nodeOrigin?: NodeOrigin;
  /** 節點範圍 */
  nodeExtent?: CoordinateExtent;
}

/**
 * Flow 狀態接口
 */
export interface FlowState {
  /** 節點集合 */
  nodes: NodeBase[];
  /** 邊緣集合 */
  edges: any[];
  /** 節點查找表 */
  nodeLookup: Map<string, NodeBase>;
  /** 邊緣查找表 */
  edgeLookup: Map<string, any>;
  /** 變換矩陣 [x, y, zoom] */
  transform: [number, number, number];
  /** 視口寬度 */
  width: number;
  /** 視口高度 */
  height: number;
  /** 最小縮放級別 */
  minZoom: number;
  /** 最大縮放級別 */
  maxZoom: number;
  /** 是否正在連接中 */
  connectionMode: string;
  /** 是否正在拖拽 */
  isDragging: boolean;
  /** 選中的節點 */
  selectedNodes: Set<string>;
  /** 選中的邊緣 */
  selectedEdges: Set<string>;
}

/**
 * Store API 接口
 */
export interface StoreApi {
  /** 獲取當前狀態 */
  getState(): FlowState;
  /** 設置狀態 */
  setState(partial: Partial<FlowState>): void;
  /** 訂閱狀態變化 */
  subscribe(listener: (state: FlowState) => void): () => void;
}