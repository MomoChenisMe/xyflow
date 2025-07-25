/**
 * Angular XYFlow 驗證工具
 * 
 * 提供數據驗證相關的工具函數
 * 包括節點、邊線、連接的驗證等
 */

import { AngularNode } from '../types/nodes';
import { AngularEdge } from '../types/edges';
import { XYPosition, Dimensions, Viewport } from '../types/system-types';
import { Connection } from './connections';

// ===================
// 基礎類型驗證
// ===================

/**
 * 檢查是否為有效數字
 */
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * 檢查是否為正數
 */
export function isPositiveNumber(value: any): boolean {
  return isValidNumber(value) && value > 0;
}

/**
 * 檢查是否為非負數
 */
export function isNonNegativeNumber(value: any): boolean {
  return isValidNumber(value) && value >= 0;
}

/**
 * 檢查是否為有效字符串
 */
export function isValidString(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * 檢查是否為有效ID
 */
export function isValidId(id: any): boolean {
  return isValidString(id) && id.trim() !== '';
}

// ===================
// 座標和尺寸驗證
// ===================

/**
 * 檢查是否為有效位置
 */
export function isValidPosition(position: any): position is XYPosition {
  return (
    position &&
    typeof position === 'object' &&
    isValidNumber(position.x) &&
    isValidNumber(position.y)
  );
}

/**
 * 檢查是否為有效尺寸
 */
export function isValidDimensions(dimensions: any): dimensions is Dimensions {
  return (
    dimensions &&
    typeof dimensions === 'object' &&
    isPositiveNumber(dimensions.width) &&
    isPositiveNumber(dimensions.height)
  );
}

/**
 * 檢查是否為有效視窗
 */
export function isValidViewport(viewport: any): viewport is Viewport {
  return (
    viewport &&
    typeof viewport === 'object' &&
    isValidNumber(viewport.x) &&
    isValidNumber(viewport.y) &&
    isPositiveNumber(viewport.zoom)
  );
}

// ===================
// 節點驗證
// ===================

/**
 * 檢查是否為有效節點
 */
export function isValidNode(node: any): node is AngularNode {
  if (!node || typeof node !== 'object') {
    return false;
  }

  // 必需字段
  if (!isValidId(node.id)) {
    return false;
  }

  if (!isValidPosition(node.position)) {
    return false;
  }

  // 可選字段驗證
  if (node.width !== undefined && !isPositiveNumber(node.width)) {
    return false;
  }

  if (node.height !== undefined && !isPositiveNumber(node.height)) {
    return false;
  }

  if (node.zIndex !== undefined && !isValidNumber(node.zIndex)) {
    return false;
  }

  if (node.type !== undefined && !isValidString(node.type)) {
    return false;
  }

  if (node.parentId !== undefined && !isValidId(node.parentId)) {
    return false;
  }

  if (node.positionAbsolute !== undefined && !isValidPosition(node.positionAbsolute)) {
    return false;
  }

  return true;
}

/**
 * 驗證節點數組
 */
export function validateNodes(nodes: any[]): {
  isValid: boolean;
  errors: string[];
  validNodes: AngularNode[];
} {
  const errors: string[] = [];
  const validNodes: AngularNode[] = [];
  const seenIds = new Set<string>();

  if (!Array.isArray(nodes)) {
    return {
      isValid: false,
      errors: ['節點必須是數組'],
      validNodes: []
    };
  }

  nodes.forEach((node, index) => {
    if (!isValidNode(node)) {
      errors.push(`節點 ${index} 無效`);
      return;
    }

    if (seenIds.has(node.id)) {
      errors.push(`重複的節點ID: ${node.id}`);
      return;
    }

    seenIds.add(node.id);
    validNodes.push(node);
  });

  return {
    isValid: errors.length === 0,
    errors,
    validNodes
  };
}

// ===================
// 邊線驗證
// ===================

/**
 * 檢查是否為有效邊線
 */
export function isValidEdge(edge: any): edge is AngularEdge {
  if (!edge || typeof edge !== 'object') {
    return false;
  }

  // 必需字段
  if (!isValidId(edge.id)) {
    return false;
  }

  if (!isValidId(edge.source)) {
    return false;
  }

  if (!isValidId(edge.target)) {
    return false;
  }

  // 可選字段驗證
  if (edge.type !== undefined && !isValidString(edge.type)) {
    return false;
  }

  if (edge.sourceHandle !== undefined && edge.sourceHandle !== null && !isValidString(edge.sourceHandle)) {
    return false;
  }

  if (edge.targetHandle !== undefined && edge.targetHandle !== null && !isValidString(edge.targetHandle)) {
    return false;
  }

  if (edge.zIndex !== undefined && !isValidNumber(edge.zIndex)) {
    return false;
  }

  return true;
}

/**
 * 驗證邊線數組
 */
export function validateEdges(edges: any[]): {
  isValid: boolean;
  errors: string[];
  validEdges: AngularEdge[];
} {
  const errors: string[] = [];
  const validEdges: AngularEdge[] = [];
  const seenIds = new Set<string>();

  if (!Array.isArray(edges)) {
    return {
      isValid: false,
      errors: ['邊線必須是數組'],
      validEdges: []
    };
  }

  edges.forEach((edge, index) => {
    if (!isValidEdge(edge)) {
      errors.push(`邊線 ${index} 無效`);
      return;
    }

    if (seenIds.has(edge.id)) {
      errors.push(`重複的邊線ID: ${edge.id}`);
      return;
    }

    seenIds.add(edge.id);
    validEdges.push(edge);
  });

  return {
    isValid: errors.length === 0,
    errors,
    validEdges
  };
}

// ===================
// 連接驗證
// ===================

/**
 * 檢查是否為有效連接
 */
export function isValidConnection(connection: any): connection is Connection {
  if (!connection || typeof connection !== 'object') {
    return false;
  }

  if (!isValidId(connection.source)) {
    return false;
  }

  if (!isValidId(connection.target)) {
    return false;
  }

  if (connection.sourceHandle !== undefined && connection.sourceHandle !== null && !isValidString(connection.sourceHandle)) {
    return false;
  }

  if (connection.targetHandle !== undefined && connection.targetHandle !== null && !isValidString(connection.targetHandle)) {
    return false;
  }

  return true;
}

/**
 * 驗證連接數組
 */
export function validateConnections(connections: any[]): {
  isValid: boolean;
  errors: string[];
  validConnections: Connection[];
} {
  const errors: string[] = [];
  const validConnections: Connection[] = [];

  if (!Array.isArray(connections)) {
    return {
      isValid: false,
      errors: ['連接必須是數組'],
      validConnections: []
    };
  }

  connections.forEach((connection, index) => {
    if (!isValidConnection(connection)) {
      errors.push(`連接 ${index} 無效`);
      return;
    }

    validConnections.push(connection);
  });

  return {
    isValid: errors.length === 0,
    errors,
    validConnections
  };
}

// ===================
// 圖結構驗證
// ===================

/**
 * 驗證節點和邊線的一致性
 */
export function validateGraphConsistency(
  nodes: AngularNode[],
  edges: AngularEdge[]
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const nodeIds = new Set(nodes.map(node => node.id));

  // 檢查邊線引用的節點是否存在
  edges.forEach(edge => {
    if (!nodeIds.has(edge.source)) {
      errors.push(`邊線 ${edge.id} 引用了不存在的源節點: ${edge.source}`);
    }

    if (!nodeIds.has(edge.target)) {
      errors.push(`邊線 ${edge.id} 引用了不存在的目標節點: ${edge.target}`);
    }
  });

  // 檢查父子節點關係
  nodes.forEach(node => {
    if (node.parentId) {
      if (!nodeIds.has(node.parentId)) {
        errors.push(`節點 ${node.id} 引用了不存在的父節點: ${node.parentId}`);
      }

      // 檢查循環引用
      if (hasCircularParentReference(node, nodes)) {
        errors.push(`節點 ${node.id} 存在循環父節點引用`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 檢查循環父節點引用
 */
function hasCircularParentReference(
  node: AngularNode,
  nodes: AngularNode[]
): boolean {
  const visited = new Set<string>();
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  let current = node;
  
  while (current.parentId) {
    if (visited.has(current.parentId)) {
      return true; // 發現循環
    }
    
    visited.add(current.id);
    const parent = nodeMap.get(current.parentId);
    
    if (!parent) {
      break; // 父節點不存在
    }
    
    current = parent;
  }
  
  return false;
}

// ===================
// 範圍驗證
// ===================

/**
 * 驗證值是否在指定範圍內
 */
export function isInRange(
  value: number,
  min: number,
  max: number,
  inclusive: boolean = true
): boolean {
  if (inclusive) {
    return value >= min && value <= max;
  } else {
    return value > min && value < max;
  }
}

/**
 * 驗證縮放等級
 */
export function isValidZoom(zoom: number, minZoom: number = 0.1, maxZoom: number = 4): boolean {
  return isValidNumber(zoom) && isInRange(zoom, minZoom, maxZoom);
}

/**
 * 驗證位置是否在邊界內
 */
export function isPositionInBounds(
  position: XYPosition,
  bounds: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    position.x >= bounds.x &&
    position.x <= bounds.x + bounds.width &&
    position.y >= bounds.y &&
    position.y <= bounds.y + bounds.height
  );
}

// ===================
// 數據清理和修復
// ===================

/**
 * 清理節點數據
 */
export function sanitizeNode(node: any): AngularNode | null {
  if (!node || typeof node !== 'object') {
    return null;
  }

  const sanitized: any = {};

  // 必需字段
  if (!isValidId(node.id)) {
    return null;
  }
  sanitized.id = String(node.id).trim();

  if (!isValidPosition(node.position)) {
    return null;
  }
  sanitized.position = {
    x: Number(node.position.x),
    y: Number(node.position.y)
  };

  // 可選字段
  if (node.type !== undefined) {
    sanitized.type = String(node.type);
  }

  if (node.data !== undefined) {
    sanitized.data = node.data;
  }

  if (isPositiveNumber(node.width)) {
    sanitized.width = Number(node.width);
  }

  if (isPositiveNumber(node.height)) {
    sanitized.height = Number(node.height);
  }

  if (isValidNumber(node.zIndex)) {
    sanitized.zIndex = Number(node.zIndex);
  }

  if (node.selected === true || node.selected === false) {
    sanitized.selected = Boolean(node.selected);
  }

  if (node.dragging === true || node.dragging === false) {
    sanitized.dragging = Boolean(node.dragging);
  }

  if (node.selectable === true || node.selectable === false) {
    sanitized.selectable = Boolean(node.selectable);
  }

  if (node.connectable === true || node.connectable === false) {
    sanitized.connectable = Boolean(node.connectable);
  }

  if (node.deletable === true || node.deletable === false) {
    sanitized.deletable = Boolean(node.deletable);
  }

  if (node.hidden === true || node.hidden === false) {
    sanitized.hidden = Boolean(node.hidden);
  }

  if (isValidId(node.parentId)) {
    sanitized.parentId = String(node.parentId).trim();
  }

  if (isValidPosition(node.positionAbsolute)) {
    sanitized.positionAbsolute = {
      x: Number(node.positionAbsolute.x),
      y: Number(node.positionAbsolute.y)
    };
  }

  return sanitized as AngularNode;
}

/**
 * 清理邊線數據
 */
export function sanitizeEdge(edge: any): AngularEdge | null {
  if (!edge || typeof edge !== 'object') {
    return null;
  }

  const sanitized: any = {};

  // 必需字段
  if (!isValidId(edge.id)) {
    return null;
  }
  sanitized.id = String(edge.id).trim();

  if (!isValidId(edge.source)) {
    return null;
  }
  sanitized.source = String(edge.source).trim();

  if (!isValidId(edge.target)) {
    return null;
  }
  sanitized.target = String(edge.target).trim();

  // 可選字段
  if (edge.type !== undefined) {
    sanitized.type = String(edge.type);
  }

  if (edge.data !== undefined) {
    sanitized.data = edge.data;
  }

  if (edge.sourceHandle !== undefined && edge.sourceHandle !== null) {
    sanitized.sourceHandle = String(edge.sourceHandle);
  }

  if (edge.targetHandle !== undefined && edge.targetHandle !== null) {
    sanitized.targetHandle = String(edge.targetHandle);
  }

  if (isValidNumber(edge.zIndex)) {
    sanitized.zIndex = Number(edge.zIndex);
  }

  if (edge.selected === true || edge.selected === false) {
    sanitized.selected = Boolean(edge.selected);
  }

  if (edge.deletable === true || edge.deletable === false) {
    sanitized.deletable = Boolean(edge.deletable);
  }

  if (edge.hidden === true || edge.hidden === false) {
    sanitized.hidden = Boolean(edge.hidden);
  }

  return sanitized as AngularEdge;
}