/**
 * Angular XYFlow 節點工具
 * 
 * 提供節點相關的計算和操作功能
 * 包括節點位置計算、尺寸調整、內部節點處理等
 */

import { AngularNode } from '../types/nodes';
import { XYPosition, Dimensions, NodeOrigin, CoordinateExtent, Rect } from '../types/system-types';
import { clampPosition, getNodeDimensions } from './general';

// ===================
// 節點位置計算
// ===================

/**
 * 獲取節點的絕對位置
 */
export function getNodePositionAbsolute(
  node: AngularNode,
  nodeOrigin: NodeOrigin = [0, 0]
): XYPosition {
  const dimensions = getNodeDimensions(node);
  const origin = node.origin ?? nodeOrigin;
  const offsetX = dimensions.width * origin[0];
  const offsetY = dimensions.height * origin[1];

  const absolutePosition = node.positionAbsolute || node.position;

  return {
    x: absolutePosition.x - offsetX,
    y: absolutePosition.y - offsetY
  };
}

/**
 * 根據原點獲取節點位置
 */
export function getNodePositionWithOrigin(
  node: AngularNode,
  nodeOrigin: NodeOrigin = [0, 0]
): XYPosition {
  const dimensions = getNodeDimensions(node);
  const origin = node.origin ?? nodeOrigin;
  const offsetX = dimensions.width * origin[0];
  const offsetY = dimensions.height * origin[1];

  return {
    x: node.position.x - offsetX,
    y: node.position.y - offsetY
  };
}

/**
 * 計算節點的下一個位置
 */
export function calculateNodePosition(params: {
  node: AngularNode;
  nextPosition: XYPosition;
  nodeOrigin?: NodeOrigin;
  nodeExtent?: CoordinateExtent;
  parentNode?: AngularNode;
}): { position: XYPosition; positionAbsolute: XYPosition } {
  const { node, nextPosition, nodeOrigin = [0, 0], nodeExtent, parentNode } = params;

  const { x: parentX, y: parentY } = parentNode 
    ? (parentNode.positionAbsolute || parentNode.position)
    : { x: 0, y: 0 };

  const origin = node.origin ?? nodeOrigin;
  let extent = nodeExtent;

  // 處理 extent 為 'parent' 的情況
  if (node.extent === 'parent' && parentNode && !node.expandParent) {
    const parentDimensions = getNodeDimensions(parentNode);
    extent = [
      [parentX, parentY],
      [parentX + parentDimensions.width, parentY + parentDimensions.height]
    ];
  } else if (parentNode && Array.isArray(node.extent)) {
    extent = [
      [node.extent[0][0] + parentX, node.extent[0][1] + parentY],
      [node.extent[1][0] + parentX, node.extent[1][1] + parentY]
    ];
  }

  const dimensions = getNodeDimensions(node);
  const positionAbsolute = extent
    ? clampPosition(nextPosition, extent, dimensions)
    : nextPosition;

  return {
    position: {
      x: positionAbsolute.x - parentX + dimensions.width * origin[0],
      y: positionAbsolute.y - parentY + dimensions.height * origin[1]
    },
    positionAbsolute
  };
}

// ===================
// 節點尺寸和邊界
// ===================

/**
 * 獲取節點的邊界矩形
 */
export function getNodeBounds(
  node: AngularNode,
  nodeOrigin: NodeOrigin = [0, 0]
): Rect {
  const position = getNodePositionWithOrigin(node, nodeOrigin);
  const dimensions = getNodeDimensions(node);

  return {
    x: position.x,
    y: position.y,
    width: dimensions.width,
    height: dimensions.height
  };
}

/**
 * 計算調整大小後的節點尺寸
 */
export function getResizedNodeDimensions(
  node: AngularNode,
  change: { width?: number; height?: number },
  options: {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    aspectRatio?: number;
  } = {}
): Dimensions {
  const {
    minWidth = 10,
    minHeight = 10,
    maxWidth = Infinity,
    maxHeight = Infinity,
    aspectRatio
  } = options;

  const currentDimensions = getNodeDimensions(node);
  let width = change.width ?? currentDimensions.width;
  let height = change.height ?? currentDimensions.height;

  // 限制尺寸範圍
  width = Math.max(minWidth, Math.min(maxWidth, width));
  height = Math.max(minHeight, Math.min(maxHeight, height));

  // 保持長寬比
  if (aspectRatio) {
    if (change.width !== undefined) {
      height = width / aspectRatio;
    } else if (change.height !== undefined) {
      width = height * aspectRatio;
    }
  }

  return { width, height };
}

// ===================
// 內部節點處理
// ===================

/**
 * 創建內部節點數據
 */
export function createInternalNode<NodeType extends AngularNode>(
  node: NodeType,
  parentId?: string
): NodeType & { internals: InternalNodeData } {
  return {
    ...node,
    internals: {
      positionAbsolute: node.positionAbsolute || node.position,
      parentId,
      z: calculateNodeZIndex(node, parentId),
      handleBounds: {},
      isParent: false
    }
  };
}

export interface InternalNodeData {
  positionAbsolute: XYPosition;
  parentId?: string;
  z: number;
  handleBounds: Record<string, HandleBounds>;
  isParent: boolean;
}

export interface HandleBounds {
  id?: string;
  position: XYPosition;
  dimensions: Dimensions;
}

/**
 * 計算節點的Z-index
 */
export function calculateNodeZIndex(
  node: AngularNode,
  parentId?: string
): number {
  const baseZ = node.zIndex ?? 0;
  const selectedZ = node.selected ? 1000 : 0;
  const parentZ = parentId ? 1 : 0;

  return baseZ + selectedZ + parentZ;
}

// ===================
// 節點分組和層級
// ===================

/**
 * 獲取節點的所有子節點
 */
export function getNodeChildren<NodeType extends AngularNode>(
  parentId: string,
  nodes: NodeType[]
): NodeType[] {
  return nodes.filter(node => node.parentId === parentId);
}

/**
 * 獲取節點的所有後代節點
 */
export function getNodeDescendants<NodeType extends AngularNode>(
  parentId: string,
  nodes: NodeType[]
): NodeType[] {
  const descendants: NodeType[] = [];
  const children = getNodeChildren(parentId, nodes);

  for (const child of children) {
    descendants.push(child);
    descendants.push(...getNodeDescendants(child.id, nodes));
  }

  return descendants;
}

/**
 * 獲取節點的父節點
 */
export function getNodeParent<NodeType extends AngularNode>(
  node: NodeType,
  nodes: NodeType[]
): NodeType | undefined {
  if (!node.parentId) {
    return undefined;
  }

  return nodes.find(n => n.id === node.parentId);
}

/**
 * 獲取節點的所有祖先節點
 */
export function getNodeAncestors<NodeType extends AngularNode>(
  node: NodeType,
  nodes: NodeType[]
): NodeType[] {
  const ancestors: NodeType[] = [];
  let currentNode: NodeType | undefined = node;

  while (currentNode?.parentId) {
    const parent: NodeType | undefined = getNodeParent(currentNode, nodes);
    if (parent) {
      ancestors.push(parent);
      currentNode = parent;
    } else {
      break;
    }
  }

  return ancestors;
}

/**
 * 檢查節點是否為另一節點的後代
 */
export function isNodeDescendant(
  nodeId: string,
  ancestorId: string,
  nodes: AngularNode[]
): boolean {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) {
    return false;
  }

  const ancestors = getNodeAncestors(node, nodes);
  return ancestors.some(ancestor => ancestor.id === ancestorId);
}

// ===================
// 節點操作輔助函數
// ===================

/**
 * 更新節點
 */
export function updateNode<NodeType extends AngularNode>(
  nodes: NodeType[],
  nodeId: string,
  updates: Partial<NodeType>
): NodeType[] {
  return nodes.map(node =>
    node.id === nodeId ? { ...node, ...updates } : node
  );
}

/**
 * 更新多個節點
 */
export function updateNodes<NodeType extends AngularNode>(
  nodes: NodeType[],
  updates: Map<string, Partial<NodeType>>
): NodeType[] {
  return nodes.map(node => {
    const nodeUpdates = updates.get(node.id);
    return nodeUpdates ? { ...node, ...nodeUpdates } : node;
  });
}

/**
 * 添加節點
 */
export function addNode<NodeType extends AngularNode>(
  nodes: NodeType[],
  node: NodeType
): NodeType[] {
  // 檢查節點是否已存在
  if (nodes.some(n => n.id === node.id)) {
    console.warn(`Node with id ${node.id} already exists`);
    return nodes;
  }

  return [...nodes, node];
}

/**
 * 添加多個節點
 */
export function addNodes<NodeType extends AngularNode>(
  nodes: NodeType[],
  newNodes: NodeType[]
): NodeType[] {
  const existingIds = new Set(nodes.map(n => n.id));
  const nodesToAdd = newNodes.filter(node => {
    if (existingIds.has(node.id)) {
      console.warn(`Node with id ${node.id} already exists`);
      return false;
    }
    return true;
  });

  return [...nodes, ...nodesToAdd];
}

/**
 * 移除節點
 */
export function removeNode<NodeType extends AngularNode>(
  nodes: NodeType[],
  nodeId: string
): NodeType[] {
  return nodes.filter(node => node.id !== nodeId);
}

/**
 * 移除多個節點
 */
export function removeNodes<NodeType extends AngularNode>(
  nodes: NodeType[],
  nodeIds: string[]
): NodeType[] {
  const idsToRemove = new Set(nodeIds);
  return nodes.filter(node => !idsToRemove.has(node.id));
}

/**
 * 移除節點及其所有後代
 */
export function removeNodeAndDescendants<NodeType extends AngularNode>(
  nodes: NodeType[],
  nodeId: string
): NodeType[] {
  const descendants = getNodeDescendants(nodeId, nodes);
  const idsToRemove = new Set([nodeId, ...descendants.map(d => d.id)]);
  return nodes.filter(node => !idsToRemove.has(node.id));
}

// ===================
// 節點查找和過濾
// ===================

/**
 * 根據類型查找節點
 */
export function getNodesByType<NodeType extends AngularNode>(
  nodes: NodeType[],
  type: string
): NodeType[] {
  return nodes.filter(node => node.type === type);
}

/**
 * 獲取可選擇的節點
 */
export function getSelectableNodes<NodeType extends AngularNode>(
  nodes: NodeType[]
): NodeType[] {
  return nodes.filter(node => node.selectable !== false);
}

/**
 * 獲取可連接的節點
 */
export function getConnectableNodes<NodeType extends AngularNode>(
  nodes: NodeType[]
): NodeType[] {
  return nodes.filter(node => node.connectable !== false);
}

/**
 * 獲取可拖拽的節點
 */
export function getDraggableNodes<NodeType extends AngularNode>(
  nodes: NodeType[]
): NodeType[] {
  return nodes.filter(node => node.draggable !== false);
}

/**
 * 獲取可見節點
 */
export function getVisibleNodes<NodeType extends AngularNode>(
  nodes: NodeType[]
): NodeType[] {
  return nodes.filter(node => !node.hidden);
}

/**
 * 獲取選中的節點
 */
export function getSelectedNodes<NodeType extends AngularNode>(
  nodes: NodeType[]
): NodeType[] {
  return nodes.filter(node => node.selected);
}

// ===================
// 節點排序
// ===================

/**
 * 按Z-index排序節點
 */
export function sortNodesByZIndex<NodeType extends AngularNode>(
  nodes: NodeType[]
): NodeType[] {
  return [...nodes].sort((a, b) => {
    const aZ = a.zIndex ?? 0;
    const bZ = b.zIndex ?? 0;
    return aZ - bZ;
  });
}

/**
 * 按位置排序節點（從左到右，從上到下）
 */
export function sortNodesByPosition<NodeType extends AngularNode>(
  nodes: NodeType[]
): NodeType[] {
  return [...nodes].sort((a, b) => {
    if (a.position.y !== b.position.y) {
      return a.position.y - b.position.y;
    }
    return a.position.x - b.position.x;
  });
}