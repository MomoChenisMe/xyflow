/**
 * Angular XYFlow 工具函數入口
 * 
 * 導出所有工具函數模塊，提供完整的工具函數庫
 * 包括變更處理、幾何計算、圖操作、邊線工具等
 */

// 使用命名導出避免衝突

// 默認導出常用工具函數
export {
  // 基礎類型守衛
  isNode,
  isEdge,
  isConnection,
  
  // 幾何計算
  clamp,
  clampPosition,
  getBoundsOfBoxes,
  getOverlappingArea,
  
  // 座標轉換
  pointToRendererPoint,
  rendererPointToPoint,
  screenToFlowPosition,
  flowToScreenPosition,
  
  // ID 生成
  generateNodeId,
  generateEdgeId,
  
  // 樣式工具
  combineClassNames,
  createStyleString
} from './general';

export {
  // 圖操作
  getIncomers,
  getOutgoers,
  getConnectedEdges,
  getNodesBounds
} from './graph';

export {
  // 連接工具
  connectionExists
} from './connections';

export {
  // 邊線工具
  getEdgeCenter,
  getEdgeId
} from './edges';

// 導出其他常用函數
export {
  // 變更處理
  createNodeSelectionChange,
  createEdgeSelectionChange,
  createNodePositionChange,
  createNodeDimensionChange
} from './changes';

export {
  // 連接工具
  isValidConnection,
  generateConnectionId,
  createAutoConnection
} from './connections';

export {
  // 邊線工具
  addEdge,
  reconnectEdge,
  getStraightPath,
  getBezierPath
} from './edges';

export {
  // 節點工具
  getNodeChildren,
  getNodeDescendants,
  updateNode,
  addNode
} from './nodes';

export {
  // 視窗工具
  getViewportForBounds,
  zoomWithCenter,
  panViewport
} from './viewport';

export {
  // 驗證工具
  isValidNode,
  isValidEdge,
  validateNodes,
  validateEdges
} from './validation';