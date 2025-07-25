import { computed } from '@angular/core';
import { ReactFlowState, Selector } from './store-types';
import { NodeBase, InternalNode } from '../components/Nodes/nodes.types';
import { Edge } from '../hooks/edge.service';

/**
 * Store 選擇器集合
 * 
 * 提供預定義的狀態選擇器，用於高效地從 store 中獲取特定數據
 * 這些選擇器經過優化，只在相關數據變化時重新計算
 */

// ===================
// 基礎選擇器
// ===================

/**
 * 選擇所有節點
 */
export const selectNodes: Selector<NodeBase[]> = (state) => state.nodes;

/**
 * 選擇所有邊緣
 */
export const selectEdges: Selector<Edge[]> = (state) => state.edges;

/**
 * 選擇變換矩陣
 */
export const selectTransform: Selector<[number, number, number]> = (state) => state.transform;

/**
 * 選擇視窗狀態
 */
export const selectViewport: Selector<{ x: number; y: number; zoom: number }> = (state) => ({
  x: state.x,
  y: state.y,
  zoom: state.zoom
});

/**
 * 選擇視窗尺寸
 */
export const selectViewportDimensions: Selector<{ width: number; height: number }> = (state) => ({
  width: state.width,
  height: state.height
});

// ===================
// 查找表選擇器
// ===================

/**
 * 選擇節點查找表
 */
export const selectNodeLookup: Selector<Map<string, InternalNode>> = (state) => state.nodeLookup;

/**
 * 選擇邊緣查找表
 */
export const selectEdgeLookup: Selector<Map<string, Edge>> = (state) => state.edgeLookup;

/**
 * 選擇連接查找表
 */
export const selectConnectionLookup: Selector<Map<string, any>> = (state) => state.connectionLookup;

/**
 * 選擇父子關係查找表
 */
export const selectParentLookup: Selector<Map<string, Set<string>>> = (state) => state.parentLookup;

// ===================
// 選擇狀態選擇器
// ===================

/**
 * 選擇已選中的節點 ID
 */
export const selectSelectedNodeIds: Selector<string[]> = (state) => Array.from(state.selectedNodes);

/**
 * 選擇已選中的邊緣 ID
 */
export const selectSelectedEdgeIds: Selector<string[]> = (state) => Array.from(state.selectedEdges);

/**
 * 選擇已選中的節點
 */
export const selectSelectedNodes: Selector<NodeBase[]> = (state) => {
  const selectedIds = Array.from(state.selectedNodes);
  return state.nodes.filter(node => selectedIds.includes(node.id));
};

/**
 * 選擇已選中的邊緣
 */
export const selectSelectedEdges: Selector<Edge[]> = (state) => {
  const selectedIds = Array.from(state.selectedEdges);
  return state.edges.filter(edge => selectedIds.includes(edge.id));
};

/**
 * 選擇是否有任何選擇
 */
export const selectHasSelection: Selector<boolean> = (state) => 
  state.selectedNodes.size > 0 || state.selectedEdges.size > 0;

/**
 * 選擇選擇計數
 */
export const selectSelectionCount: Selector<{ nodes: number; edges: number; total: number }> = (state) => ({
  nodes: state.selectedNodes.size,
  edges: state.selectedEdges.size,
  total: state.selectedNodes.size + state.selectedEdges.size
});

// ===================
// 連接狀態選擇器
// ===================

/**
 * 選擇連接狀態
 */
export const selectConnection: Selector<ReactFlowState['connection']> = (state) => state.connection;

/**
 * 選擇是否正在連接
 */
export const selectIsConnecting: Selector<boolean> = (state) => state.connection.inProgress;

/**
 * 選擇連接模式
 */
export const selectConnectionMode: Selector<ReactFlowState['connectionMode']> = (state) => state.connectionMode;

/**
 * 選擇連接起始 Handle
 */
export const selectConnectionStartHandle: Selector<ReactFlowState['connectionClickStartHandle']> = 
  (state) => state.connectionClickStartHandle;

// ===================
// 交互狀態選擇器
// ===================

/**
 * 選擇是否正在拖拽
 */
export const selectIsDragging: Selector<boolean> = (state) => state.isDragging;

/**
 * 選擇是否正在拖拽面板
 */
export const selectIsPaneDragging: Selector<boolean> = (state) => state.paneDragging;

/**
 * 選擇用戶選擇框狀態
 */
export const selectUserSelection: Selector<{
  active: boolean;
  rect: ReactFlowState['userSelectionRect'];
}> = (state) => ({
  active: state.userSelectionActive,
  rect: state.userSelectionRect
});

/**
 * 選擇多選狀態
 */
export const selectMultiSelection: Selector<boolean> = (state) => state.multiSelectionActive;

// ===================
// 配置選擇器
// ===================

/**
 * 選擇縮放範圍
 */
export const selectZoomRange: Selector<{ min: number; max: number }> = (state) => ({
  min: state.minZoom,
  max: state.maxZoom
});

/**
 * 選擇行為配置
 */
export const selectBehaviorConfig: Selector<{
  nodesDraggable: boolean;
  nodesConnectable: boolean;
  elementsSelectable: boolean;
  selectNodesOnDrag: boolean;
}> = (state) => ({
  nodesDraggable: state.nodesDraggable,
  nodesConnectable: state.nodesConnectable,
  elementsSelectable: state.elementsSelectable,
  selectNodesOnDrag: state.selectNodesOnDrag
});

/**
 * 選擇自動平移配置
 */
export const selectAutoPanConfig: Selector<{
  onConnect: boolean;
  onNodeFocus: boolean;
  speed: number;
}> = (state) => ({
  onConnect: state.autoPanOnConnect,
  onNodeFocus: state.autoPanOnNodeFocus,
  speed: state.autoPanSpeed
});

// ===================
// 計算選擇器
// ===================

/**
 * 選擇可見節點
 */
export const selectVisibleNodes: Selector<NodeBase[]> = (state) => 
  state.nodes.filter(node => !node.hidden);

/**
 * 選擇可見邊緣
 */
export const selectVisibleEdges: Selector<Edge[]> = (state) => 
  state.edges.filter(edge => !edge.hidden);

/**
 * 選擇節點邊界
 */
export const selectNodeBounds: Selector<{
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} | null> = (state) => {
  const visibleNodes = state.nodes.filter(node => !node.hidden);
  
  if (visibleNodes.length === 0) return null;
  
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  visibleNodes.forEach(node => {
    const x = node.position.x;
    const y = node.position.y;
    const width = node.width || 150;
    const height = node.height || 40;
    
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x + width);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y + height);
  });
  
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
};

/**
 * 選擇可見區域邊界（流程坐標）
 */
export const selectVisibleBounds: Selector<{
  x: number;
  y: number;
  width: number;
  height: number;
}> = (state) => {
  const { x, y, zoom, width, height } = state;
  
  return {
    x: -x / zoom,
    y: -y / zoom,
    width: width / zoom,
    height: height / zoom
  };
};

/**
 * 選擇是否需要適應視圖
 */
export const selectNeedsFitView: Selector<boolean> = (state) => state.fitViewQueued;

// ===================
// 類型選擇器
// ===================

/**
 * 按類型選擇節點
 */
export const selectNodesByType = (nodeType: string): Selector<NodeBase[]> => (state) =>
  state.nodes.filter(node => node.type === nodeType);

/**
 * 按類型選擇邊緣
 */
export const selectEdgesByType = (edgeType: string): Selector<Edge[]> => (state) =>
  state.edges.filter(edge => edge.type === edgeType);

/**
 * 選擇節點類型統計
 */
export const selectNodeTypeStats: Selector<Record<string, number>> = (state) => {
  const stats: Record<string, number> = {};
  
  state.nodes.forEach(node => {
    const type = node.type || 'default';
    stats[type] = (stats[type] || 0) + 1;
  });
  
  return stats;
};

/**
 * 選擇邊緣類型統計
 */
export const selectEdgeTypeStats: Selector<Record<string, number>> = (state) => {
  const stats: Record<string, number> = {};
  
  state.edges.forEach(edge => {
    const type = edge.type || 'default';
    stats[type] = (stats[type] || 0) + 1;
  });
  
  return stats;
};

// ===================
// 單個元素選擇器工廠
// ===================

/**
 * 創建節點選擇器
 */
export const createNodeSelector = (nodeId: string): Selector<NodeBase | undefined> => (state) =>
  state.nodes.find(node => node.id === nodeId);

/**
 * 創建內部節點選擇器
 */
export const createInternalNodeSelector = (nodeId: string): Selector<InternalNode | undefined> => (state) =>
  state.nodeLookup.get(nodeId);

/**
 * 創建邊緣選擇器
 */
export const createEdgeSelector = (edgeId: string): Selector<Edge | undefined> => (state) =>
  state.edges.find(edge => edge.id === edgeId);

/**
 * 創建節點數據選擇器
 */
export const createNodeDataSelector = <T = any>(nodeId: string): Selector<T | undefined> => (state) => {
  const node = state.nodes.find(n => n.id === nodeId);
  return node?.data;
};

/**
 * 創建節點位置選擇器
 */
export const createNodePositionSelector = (nodeId: string): Selector<{ x: number; y: number } | undefined> => (state) => {
  const node = state.nodes.find(n => n.id === nodeId);
  return node?.position;
};

/**
 * 創建節點連接選擇器
 */
export const createNodeConnectionsSelector = (nodeId: string): Selector<{
  incoming: Edge[];
  outgoing: Edge[];
  all: Edge[];
}> => (state) => {
  const incoming = state.edges.filter(edge => edge.target === nodeId);
  const outgoing = state.edges.filter(edge => edge.source === nodeId);
  
  return {
    incoming,
    outgoing,
    all: [...incoming, ...outgoing]
  };
};

// ===================
// 性能優化選擇器
// ===================

/**
 * 選擇器組合器 - 合併多個選擇器
 */
export function combineSelectors<T extends Record<string, Selector<any>>>(
  selectors: T
): Selector<{ [K in keyof T]: ReturnType<T[K]> }> {
  return (state) => {
    const result = {} as { [K in keyof T]: ReturnType<T[K]> };
    
    for (const key in selectors) {
      result[key] = selectors[key](state);
    }
    
    return result;
  };
}

/**
 * 記憶化選擇器
 */
export function memoizeSelector<T>(
  selector: Selector<T>,
  equalityFn: (a: T, b: T) => boolean = (a, b) => a === b
): Selector<T> {
  let lastState: ReactFlowState | undefined;
  let lastResult: T;
  
  return (state) => {
    if (state !== lastState) {
      const newResult = selector(state);
      
      if (lastState === undefined || !equalityFn(lastResult, newResult)) {
        lastResult = newResult;
      }
      
      lastState = state;
    }
    
    return lastResult;
  };
}

/**
 * 創建深度相等的記憶化選擇器
 */
export function createDeepEqualSelector<T>(selector: Selector<T>): Selector<T> {
  return memoizeSelector(selector, (a, b) => JSON.stringify(a) === JSON.stringify(b));
}

/**
 * 選擇器工具
 */
export const SelectorUtils = {
  /**
   * 創建計算屬性選擇器
   */
  createComputedSelector: <T>(selector: Selector<T>) => computed(() => selector),
  
  /**
   * 創建條件選擇器
   */
  createConditionalSelector: <T>(
    condition: Selector<boolean>,
    trueSelector: Selector<T>,
    falseSelector: Selector<T>
  ): Selector<T> => (state) => {
    return condition(state) ? trueSelector(state) : falseSelector(state);
  },
  
  /**
   * 創建陣列過濾選擇器
   */
  createFilterSelector: <T>(
    arraySelector: Selector<T[]>,
    predicate: (item: T) => boolean
  ): Selector<T[]> => (state) => {
    return arraySelector(state).filter(predicate);
  },
  
  /**
   * 創建陣列映射選擇器
   */
  createMapSelector: <T, U>(
    arraySelector: Selector<T[]>,
    mapper: (item: T) => U
  ): Selector<U[]> => (state) => {
    return arraySelector(state).map(mapper);
  },
} as const;