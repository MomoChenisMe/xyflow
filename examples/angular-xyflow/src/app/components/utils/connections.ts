/**
 * Angular XYFlow 連接工具
 * 
 * 提供連接檢測、連接驗證、連接創建等功能
 * 包括連接點計算、連接規則驗證等
 */

import { AngularNode } from '../types/nodes';
import { AngularEdge } from '../types/edges';
import { XYPosition, HandleType, Position } from '../types/system-types';

// ===================
// 連接類型定義
// ===================

export interface Connection {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface ConnectionWithPositions extends Connection {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

export interface HandleElement {
  id?: string;
  type: HandleType;
  position: Position;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface ConnectionStatus {
  isValid: boolean;
  reason?: string;
}

export interface ConnectionRule {
  sourceHandle?: string;
  targetHandle?: string;
  sourceNode?: string;
  targetNode?: string;
  sourceType?: string;
  targetType?: string;
  isValid: (connection: Connection, sourceNode: AngularNode, targetNode: AngularNode) => boolean;
}

// ===================
// 連接檢測
// ===================

/**
 * 檢查連接是否已存在
 */
export function connectionExists(
  connection: Connection,
  edges: AngularEdge[]
): boolean {
  return edges.some(edge => 
    edge.source === connection.source &&
    edge.target === connection.target &&
    (edge.sourceHandle === connection.sourceHandle || (!edge.sourceHandle && !connection.sourceHandle)) &&
    (edge.targetHandle === connection.targetHandle || (!edge.targetHandle && !connection.targetHandle))
  );
}

/**
 * 檢查是否為自循環連接
 */
export function isSelfConnection(connection: Connection): boolean {
  return connection.source === connection.target;
}

/**
 * 檢查連接是否有效
 */
export function isValidConnection(
  connection: Connection,
  nodes: AngularNode[],
  edges: AngularEdge[],
  rules: ConnectionRule[] = []
): ConnectionStatus {
  // 基本驗證
  if (!connection.source || !connection.target) {
    return { isValid: false, reason: '源節點或目標節點為空' };
  }

  // 檢查節點是否存在
  const sourceNode = nodes.find(node => node.id === connection.source);
  const targetNode = nodes.find(node => node.id === connection.target);

  if (!sourceNode) {
    return { isValid: false, reason: '源節點不存在' };
  }

  if (!targetNode) {
    return { isValid: false, reason: '目標節點不存在' };
  }

  // 檢查是否為自循環（如果不允許）
  if (isSelfConnection(connection) && !sourceNode.data?.['allowSelfConnections']) {
    return { isValid: false, reason: '不允許自循環連接' };
  }

  // 檢查連接是否已存在
  if (connectionExists(connection, edges)) {
    return { isValid: false, reason: '連接已存在' };
  }

  // 檢查節點是否可連接
  if (sourceNode.connectable === false || targetNode.connectable === false) {
    return { isValid: false, reason: '節點不允許連接' };
  }

  // 應用自定義規則
  for (const rule of rules) {
    if (!rule.isValid(connection, sourceNode, targetNode)) {
      return { isValid: false, reason: '違反連接規則' };
    }
  }

  return { isValid: true };
}

// ===================
// 連接點計算
// ===================

/**
 * 獲取節點的連接點位置
 */
export function getHandlePosition(
  node: AngularNode,
  handleId: string | undefined | null,
  handleType: HandleType,
  fallbackPosition: Position = Position.Top
): Position {
  if (!handleId || !node.data?.['handles']) {
    return fallbackPosition;
  }

  const handles = node.data['handles'] as any[];
  const handle = handles.find((h: any) => h.id === handleId && h.type === handleType);
  return handle?.position || fallbackPosition;
}

/**
 * 計算連接點的絕對座標
 */
export function getHandleCoordinates(
  node: AngularNode,
  handleId: string | undefined | null,
  handleType: HandleType,
  defaultPosition: Position = Position.Top
): XYPosition {
  const nodeWidth = node.width || 150;
  const nodeHeight = node.height || 40;
  const position = getHandlePosition(node, handleId, handleType, defaultPosition);

  let x = node.position.x;
  let y = node.position.y;

  switch (position) {
    case Position.Top:
      x += nodeWidth / 2;
      break;
    case Position.Right:
      x += nodeWidth;
      y += nodeHeight / 2;
      break;
    case Position.Bottom:
      x += nodeWidth / 2;
      y += nodeHeight;
      break;
    case Position.Left:
      y += nodeHeight / 2;
      break;
  }

  return { x, y };
}

/**
 * 計算連接的起止坐標
 */
export function getConnectionCoordinates(
  connection: Connection,
  nodes: AngularNode[]
): ConnectionWithPositions | null {
  const sourceNode = nodes.find(node => node.id === connection.source);
  const targetNode = nodes.find(node => node.id === connection.target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const sourceCoords = getHandleCoordinates(
    sourceNode,
    connection.sourceHandle,
    HandleType.Source,
    Position.Right
  );

  const targetCoords = getHandleCoordinates(
    targetNode,
    connection.targetHandle,
    HandleType.Target,
    Position.Left
  );

  return {
    ...connection,
    sourceX: sourceCoords.x,
    sourceY: sourceCoords.y,
    targetX: targetCoords.x,
    targetY: targetCoords.y
  };
}

// ===================
// 自動連接功能
// ===================

/**
 * 查找最近的連接點
 */
export function findClosestHandle(
  position: XYPosition,
  node: AngularNode,
  handleType: HandleType
): string | null {
  if (!node.data?.['handles']) {
    return null;
  }

  const handles = (node.data['handles'] as any[]).filter((h: any) => h.type === handleType);
  let closestHandle: string | null = null;
  let minDistance = Infinity;

  for (const handle of handles) {
    const handleCoords = getHandleCoordinates(node, handle.id, handleType);
    const distance = Math.sqrt(
      Math.pow(position.x - handleCoords.x, 2) + 
      Math.pow(position.y - handleCoords.y, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestHandle = handle.id || null;
    }
  }

  return closestHandle;
}

/**
 * 自動創建連接
 */
export function createAutoConnection(
  sourceNodeId: string,
  targetNodeId: string,
  nodes: AngularNode[],
  sourcePosition?: XYPosition,
  targetPosition?: XYPosition
): Connection | null {
  const sourceNode = nodes.find(node => node.id === sourceNodeId);
  const targetNode = nodes.find(node => node.id === targetNodeId);

  if (!sourceNode || !targetNode) {
    return null;
  }

  let sourceHandle: string | null = null;
  let targetHandle: string | null = null;

  // 如果提供了位置，查找最近的連接點
  if (sourcePosition) {
    sourceHandle = findClosestHandle(sourcePosition, sourceNode, HandleType.Source);
  }

  if (targetPosition) {
    targetHandle = findClosestHandle(targetPosition, targetNode, HandleType.Target);
  }

  return {
    source: sourceNodeId,
    target: targetNodeId,
    sourceHandle,
    targetHandle
  };
}

// ===================
// 連接工具函數
// ===================

/**
 * 生成連接ID
 */
export function generateConnectionId(connection: Connection): string {
  const sourceHandle = connection.sourceHandle || '';
  const targetHandle = connection.targetHandle || '';
  return `xy-edge__${connection.source}${sourceHandle}-${connection.target}${targetHandle}`;
}

/**
 * 從邊線創建連接對象
 */
export function edgeToConnection(edge: AngularEdge): Connection {
  return {
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle
  };
}

/**
 * 從連接創建邊線
 */
export function connectionToEdge(
  connection: Connection,
  edgeData?: any,
  edgeType?: string
): AngularEdge {
  return {
    id: generateConnectionId(connection),
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle,
    targetHandle: connection.targetHandle,
    type: edgeType,
    data: edgeData
  };
}

/**
 * 過濾可連接的節點
 */
export function getConnectableNodes(
  nodes: AngularNode[],
  sourceNodeId: string,
  rules: ConnectionRule[] = []
): AngularNode[] {
  const sourceNode = nodes.find(node => node.id === sourceNodeId);
  if (!sourceNode) {
    return [];
  }

  return nodes.filter(node => {
    if (node.id === sourceNodeId) {
      return false; // 排除自己
    }

    if (node.connectable === false) {
      return false; // 排除不可連接的節點
    }

    // 檢查自定義規則
    const connection: Connection = {
      source: sourceNodeId,
      target: node.id
    };

    return rules.every(rule => rule.isValid(connection, sourceNode, node));
  });
}

/**
 * 批量驗證連接
 */
export function validateConnections(
  connections: Connection[],
  nodes: AngularNode[],
  edges: AngularEdge[],
  rules: ConnectionRule[] = []
): Map<Connection, ConnectionStatus> {
  const results = new Map<Connection, ConnectionStatus>();

  for (const connection of connections) {
    const status = isValidConnection(connection, nodes, edges, rules);
    results.set(connection, status);
  }

  return results;
}

/**
 * 獲取節點的所有可能連接點
 */
export function getNodeConnections(
  nodeId: string,
  edges: AngularEdge[]
): { incoming: Connection[]; outgoing: Connection[] } {
  const incoming: Connection[] = [];
  const outgoing: Connection[] = [];

  for (const edge of edges) {
    if (edge.source === nodeId) {
      outgoing.push(edgeToConnection(edge));
    }
    if (edge.target === nodeId) {
      incoming.push(edgeToConnection(edge));
    }
  }

  return { incoming, outgoing };
}

/**
 * 檢查連接是否會形成環
 */
export function wouldCreateCycle(
  connection: Connection,
  edges: AngularEdge[]
): boolean {
  // 簡單的環檢測：從目標節點開始，看是否能回到源節點
  const visited = new Set<string>();
  const stack = [connection.target];

  while (stack.length > 0) {
    const currentNodeId = stack.pop()!;

    if (currentNodeId === connection.source) {
      return true; // 發現環
    }

    if (visited.has(currentNodeId)) {
      continue;
    }

    visited.add(currentNodeId);

    // 添加所有從當前節點出發的目標節點
    const outgoingConnections = edges.filter(edge => edge.source === currentNodeId);
    for (const edge of outgoingConnections) {
      if (!visited.has(edge.target)) {
        stack.push(edge.target);
      }
    }
  }

  return false;
}