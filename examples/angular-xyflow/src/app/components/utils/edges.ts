/**
 * Angular XYFlow 邊線工具
 * 
 * 提供邊線相關的計算和操作功能
 * 包括邊線中心點、路徑計算、可見性檢測等
 */

import { AngularNode } from '../types/nodes';
import { AngularEdge } from '../types/edges';
import { XYPosition, Position, Transform } from '../types/system-types';
import { getBoundsOfBoxes, nodeToBox, boxToRect, getOverlappingArea } from './general';
import { Connection } from './connections';

// ===================
// 邊線幾何計算
// ===================

/**
 * 計算邊線中心點
 */
export function getEdgeCenter(params: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}): [number, number, number, number] {
  const { sourceX, sourceY, targetX, targetY } = params;
  
  const xOffset = Math.abs(targetX - sourceX) / 2;
  const centerX = targetX < sourceX ? targetX + xOffset : targetX - xOffset;

  const yOffset = Math.abs(targetY - sourceY) / 2;
  const centerY = targetY < sourceY ? targetY + yOffset : targetY - yOffset;

  return [centerX, centerY, xOffset, yOffset];
}

/**
 * 計算邊線長度
 */
export function getEdgeLength(params: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}): number {
  const { sourceX, sourceY, targetX, targetY } = params;
  return Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2));
}

/**
 * 計算邊線角度
 */
export function getEdgeAngle(params: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}): number {
  const { sourceX, sourceY, targetX, targetY } = params;
  return Math.atan2(targetY - sourceY, targetX - sourceX);
}

/**
 * 獲取邊線的邊界框
 */
export function getEdgeBounds(params: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  strokeWidth?: number;
}): { x: number; y: number; width: number; height: number } {
  const { sourceX, sourceY, targetX, targetY, strokeWidth = 1 } = params;
  
  const minX = Math.min(sourceX, targetX) - strokeWidth / 2;
  const minY = Math.min(sourceY, targetY) - strokeWidth / 2;
  const maxX = Math.max(sourceX, targetX) + strokeWidth / 2;
  const maxY = Math.max(sourceY, targetY) + strokeWidth / 2;

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

// ===================
// 邊線路徑計算
// ===================

/**
 * 獲取直線邊線路徑
 */
export function getStraightPath(params: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}): string {
  const { sourceX, sourceY, targetX, targetY } = params;
  return `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
}

/**
 * 獲取平滑步驟邊線路徑
 */
export function getSmoothStepPath(params: {
  sourceX: number;
  sourceY: number;
  sourcePosition: Position;
  targetX: number;
  targetY: number;
  targetPosition: Position;
  borderRadius?: number;
  centerX?: number;
  centerY?: number;
}): string {
  const {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius = 5,
    centerX,
    centerY
  } = params;

  const [_centerX, _centerY] = centerX !== undefined && centerY !== undefined
    ? [centerX, centerY]
    : getEdgeCenter({ sourceX, sourceY, targetX, targetY });

  const cornerWidth = Math.min(borderRadius, Math.abs(targetX - sourceX));
  const cornerHeight = Math.min(borderRadius, Math.abs(targetY - sourceY));

  const leftToRight = sourceX <= targetX;
  const topToBottom = sourceY <= targetY;

  // 根據連接點位置調整路徑
  if (sourcePosition === Position.Left || sourcePosition === Position.Right) {
    if (sourcePosition === Position.Left) {
      return leftToRight
        ? `M ${sourceX},${sourceY} L ${_centerX - cornerWidth},${sourceY} Q ${_centerX},${sourceY} ${_centerX},${sourceY + (topToBottom ? cornerHeight : -cornerHeight)} L ${_centerX},${targetY - (topToBottom ? cornerHeight : -cornerHeight)} Q ${_centerX},${targetY} ${_centerX + cornerWidth},${targetY} L ${targetX},${targetY}`
        : `M ${sourceX},${sourceY} L ${_centerX + cornerWidth},${sourceY} Q ${_centerX},${sourceY} ${_centerX},${sourceY + (topToBottom ? cornerHeight : -cornerHeight)} L ${_centerX},${targetY - (topToBottom ? cornerHeight : -cornerHeight)} Q ${_centerX},${targetY} ${_centerX - cornerWidth},${targetY} L ${targetX},${targetY}`;
    } else {
      return leftToRight
        ? `M ${sourceX},${sourceY} L ${_centerX - cornerWidth},${sourceY} Q ${_centerX},${sourceY} ${_centerX},${sourceY + (topToBottom ? cornerHeight : -cornerHeight)} L ${_centerX},${targetY - (topToBottom ? cornerHeight : -cornerHeight)} Q ${_centerX},${targetY} ${_centerX + cornerWidth},${targetY} L ${targetX},${targetY}`
        : `M ${sourceX},${sourceY} L ${_centerX + cornerWidth},${sourceY} Q ${_centerX},${sourceY} ${_centerX},${sourceY + (topToBottom ? cornerHeight : -cornerHeight)} L ${_centerX},${targetY - (topToBottom ? cornerHeight : -cornerHeight)} Q ${_centerX},${targetY} ${_centerX - cornerWidth},${targetY} L ${targetX},${targetY}`;
    }
  } else {
    if (sourcePosition === Position.Top) {
      return topToBottom
        ? `M ${sourceX},${sourceY} L ${sourceX},${_centerY - cornerHeight} Q ${sourceX},${_centerY} ${sourceX + (leftToRight ? cornerWidth : -cornerWidth)},${_centerY} L ${targetX - (leftToRight ? cornerWidth : -cornerWidth)},${_centerY} Q ${targetX},${_centerY} ${targetX},${_centerY + cornerHeight} L ${targetX},${targetY}`
        : `M ${sourceX},${sourceY} L ${sourceX},${_centerY + cornerHeight} Q ${sourceX},${_centerY} ${sourceX + (leftToRight ? cornerWidth : -cornerWidth)},${_centerY} L ${targetX - (leftToRight ? cornerWidth : -cornerWidth)},${_centerY} Q ${targetX},${_centerY} ${targetX},${_centerY - cornerHeight} L ${targetX},${targetY}`;
    } else {
      return topToBottom
        ? `M ${sourceX},${sourceY} L ${sourceX},${_centerY - cornerHeight} Q ${sourceX},${_centerY} ${sourceX + (leftToRight ? cornerWidth : -cornerWidth)},${_centerY} L ${targetX - (leftToRight ? cornerWidth : -cornerWidth)},${_centerY} Q ${targetX},${_centerY} ${targetX},${_centerY + cornerHeight} L ${targetX},${targetY}`
        : `M ${sourceX},${sourceY} L ${sourceX},${_centerY + cornerHeight} Q ${sourceX},${_centerY} ${sourceX + (leftToRight ? cornerWidth : -cornerWidth)},${_centerY} L ${targetX - (leftToRight ? cornerWidth : -cornerWidth)},${_centerY} Q ${targetX},${_centerY} ${targetX},${_centerY - cornerHeight} L ${targetX},${targetY}`;
    }
  }
}

/**
 * 獲取貝塞爾曲線路徑
 */
export function getBezierPath(params: {
  sourceX: number;
  sourceY: number;
  sourcePosition: Position;
  targetX: number;
  targetY: number;
  targetPosition: Position;
  curvature?: number;
}): string {
  const {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature = 0.25
  } = params;

  const hx = Math.abs(targetX - sourceX) * curvature;
  const hy = Math.abs(targetY - sourceY) * curvature;

  let c1x = sourceX;
  let c1y = sourceY;
  let c2x = targetX;
  let c2y = targetY;

  // 根據連接點位置調整控制點
  switch (sourcePosition) {
    case Position.Left:
      c1x = sourceX - hx;
      break;
    case Position.Right:
      c1x = sourceX + hx;
      break;
    case Position.Top:
      c1y = sourceY - hy;
      break;
    case Position.Bottom:
      c1y = sourceY + hy;
      break;
  }

  switch (targetPosition) {
    case Position.Left:
      c2x = targetX - hx;
      break;
    case Position.Right:
      c2x = targetX + hx;
      break;
    case Position.Top:
      c2y = targetY - hy;
      break;
    case Position.Bottom:
      c2y = targetY + hy;
      break;
  }

  return `M ${sourceX},${sourceY} C ${c1x},${c1y} ${c2x},${c2y} ${targetX},${targetY}`;
}

// ===================
// 邊線可見性和Z-index
// ===================

/**
 * 檢查邊線是否可見
 */
export function isEdgeVisible(params: {
  sourceNode: AngularNode;
  targetNode: AngularNode;
  width: number;
  height: number;
  transform: Transform;
}): boolean {
  const { sourceNode, targetNode, width, height, transform } = params;
  
  const edgeBox = getBoundsOfBoxes([nodeToBox(sourceNode), nodeToBox(targetNode)]);

  if (edgeBox.x === edgeBox.x2) {
    edgeBox.x2 += 1;
  }

  if (edgeBox.y === edgeBox.y2) {
    edgeBox.y2 += 1;
  }

  const viewRect = {
    x: -transform[0] / transform[2],
    y: -transform[1] / transform[2],
    width: width / transform[2],
    height: height / transform[2]
  };

  return getOverlappingArea(viewRect, boxToRect(edgeBox)) > 0;
}

/**
 * 獲取邊線的Z-index
 */
export function getEdgeZIndex(params: {
  sourceNode: AngularNode;
  targetNode: AngularNode;
  selected?: boolean;
  zIndex?: number;
  elevateOnSelect?: boolean;
}): number {
  const { sourceNode, targetNode, selected = false, zIndex, elevateOnSelect = false } = params;

  if (zIndex !== undefined) {
    return zIndex;
  }

  const edgeZ = elevateOnSelect && selected ? 1000 : 0;

  // 如果節點有父節點，使用父節點的Z-index
  const sourceZ = sourceNode.parentId ? (sourceNode.zIndex || 0) + 1 : 0;
  const targetZ = targetNode.parentId ? (targetNode.zIndex || 0) + 1 : 0;
  const nodeZ = Math.max(sourceZ, targetZ);

  return edgeZ + nodeZ;
}

// ===================
// 邊線操作工具
// ===================

/**
 * 生成邊線ID
 */
export function getEdgeId(connection: Connection): string {
  const sourceHandle = connection.sourceHandle || '';
  const targetHandle = connection.targetHandle || '';
  return `xy-edge__${connection.source}${sourceHandle}-${connection.target}${targetHandle}`;
}

/**
 * 添加邊線到邊線列表
 */
export function addEdge<EdgeType extends AngularEdge>(
  edgeParams: EdgeType | Connection,
  edges: EdgeType[]
): EdgeType[] {
  if (!edgeParams.source || !edgeParams.target) {
    console.warn('Source and target are required for edge creation');
    return edges;
  }

  let edge: EdgeType;
  
  if ('id' in edgeParams) {
    edge = { ...edgeParams };
  } else {
    edge = {
      ...edgeParams,
      id: getEdgeId(edgeParams)
    } as EdgeType;
  }

  // 檢查連接是否已存在
  const connectionExists = edges.some(existingEdge =>
    existingEdge.source === edge.source &&
    existingEdge.target === edge.target &&
    (existingEdge.sourceHandle === edge.sourceHandle || (!existingEdge.sourceHandle && !edge.sourceHandle)) &&
    (existingEdge.targetHandle === edge.targetHandle || (!existingEdge.targetHandle && !edge.targetHandle))
  );

  if (connectionExists) {
    return edges;
  }

  // 清理null handles
  if (edge.sourceHandle === null) {
    delete edge.sourceHandle;
  }

  if (edge.targetHandle === null) {
    delete edge.targetHandle;
  }

  return edges.concat(edge);
}

/**
 * 重新連接邊線
 */
export function reconnectEdge<EdgeType extends AngularEdge>(
  oldEdge: EdgeType,
  newConnection: Connection,
  edges: EdgeType[],
  options: { shouldReplaceId?: boolean } = { shouldReplaceId: true }
): EdgeType[] {
  const { id: oldEdgeId, ...rest } = oldEdge;

  if (!newConnection.source || !newConnection.target) {
    console.warn('Source and target are required for edge reconnection');
    return edges;
  }

  const foundEdge = edges.find(e => e.id === oldEdge.id);

  if (!foundEdge) {
    console.warn(`Edge with id ${oldEdgeId} not found`);
    return edges;
  }

  const edge = {
    ...rest,
    id: options.shouldReplaceId ? getEdgeId(newConnection) : oldEdgeId,
    source: newConnection.source,
    target: newConnection.target,
    sourceHandle: newConnection.sourceHandle,
    targetHandle: newConnection.targetHandle
  } as EdgeType;

  return edges.filter(e => e.id !== oldEdgeId).concat(edge);
}

/**
 * 更新邊線
 */
export function updateEdge<EdgeType extends AngularEdge>(
  edges: EdgeType[],
  edgeId: string,
  updates: Partial<EdgeType>
): EdgeType[] {
  return edges.map(edge => 
    edge.id === edgeId ? { ...edge, ...updates } : edge
  );
}

/**
 * 移除邊線
 */
export function removeEdge<EdgeType extends AngularEdge>(
  edges: EdgeType[],
  edgeId: string
): EdgeType[] {
  return edges.filter(edge => edge.id !== edgeId);
}

/**
 * 移除多條邊線
 */
export function removeEdges<EdgeType extends AngularEdge>(
  edges: EdgeType[],
  edgeIds: string[]
): EdgeType[] {
  const idsToRemove = new Set(edgeIds);
  return edges.filter(edge => !idsToRemove.has(edge.id));
}

/**
 * 根據節點ID移除相關邊線
 */
export function removeEdgesByNodeId<EdgeType extends AngularEdge>(
  edges: EdgeType[],
  nodeId: string
): EdgeType[] {
  return edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);
}

/**
 * 根據多個節點ID移除相關邊線
 */
export function removeEdgesByNodeIds<EdgeType extends AngularEdge>(
  edges: EdgeType[],
  nodeIds: string[]
): EdgeType[] {
  const idsToCheck = new Set(nodeIds);
  return edges.filter(edge => !idsToCheck.has(edge.source) && !idsToCheck.has(edge.target));
}

// ===================
// 邊線查找工具
// ===================

/**
 * 根據源節點查找邊線
 */
export function getEdgesBySource<EdgeType extends AngularEdge>(
  edges: EdgeType[],
  sourceId: string
): EdgeType[] {
  return edges.filter(edge => edge.source === sourceId);
}

/**
 * 根據目標節點查找邊線
 */
export function getEdgesByTarget<EdgeType extends AngularEdge>(
  edges: EdgeType[],
  targetId: string
): EdgeType[] {
  return edges.filter(edge => edge.target === targetId);
}

/**
 * 根據節點ID查找所有相關邊線
 */
export function getEdgesByNodeId<EdgeType extends AngularEdge>(
  edges: EdgeType[],
  nodeId: string
): EdgeType[] {
  return edges.filter(edge => edge.source === nodeId || edge.target === nodeId);
}