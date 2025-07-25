/**
 * Angular XYFlow 變更處理工具
 * 
 * 提供節點和邊線的變更處理功能
 * 包括變更應用、變更創建、選擇變更等
 */

import { AngularNode } from '../types/nodes';
import { AngularEdge } from '../types/edges';
import { XYPosition, Dimensions } from '../types/system-types';

// ===================
// 變更類型定義
// ===================

export type NodeChange<NodeType = AngularNode> = 
  | NodeDimensionChange
  | NodePositionChange<NodeType>
  | NodeSelectionChange
  | NodeRemoveChange
  | NodeAddChange<NodeType>
  | NodeReplaceChange<NodeType>
  | NodeResetChange<NodeType>;

export type EdgeChange<EdgeType = AngularEdge> =
  | EdgeSelectionChange
  | EdgeRemoveChange
  | EdgeAddChange<EdgeType>
  | EdgeReplaceChange<EdgeType>
  | EdgeResetChange<EdgeType>;

export interface NodeDimensionChange {
  id: string;
  type: 'dimensions';
  dimensions?: Dimensions;
  updateStyle?: boolean;
  resizing?: boolean;
}

export interface NodePositionChange<NodeType = AngularNode> {
  id: string;
  type: 'position';
  position?: XYPosition;
  positionAbsolute?: XYPosition;
  dragging?: boolean;
  from?: XYPosition;
}

export interface NodeSelectionChange {
  id: string;
  type: 'select';
  selected: boolean;
}

export interface NodeRemoveChange {
  id: string;
  type: 'remove';
}

export interface NodeAddChange<NodeType = AngularNode> {
  item: NodeType;
  type: 'add';
}

export interface NodeReplaceChange<NodeType = AngularNode> {
  id: string;
  item: NodeType;
  type: 'replace';
}

export interface NodeResetChange<NodeType = AngularNode> {
  item: NodeType;
  type: 'reset';
}

export interface EdgeSelectionChange {
  id: string;
  type: 'select';
  selected: boolean;
}

export interface EdgeRemoveChange {
  id: string;
  type: 'remove';
}

export interface EdgeAddChange<EdgeType = AngularEdge> {
  item: EdgeType;
  type: 'add';
}

export interface EdgeReplaceChange<EdgeType = AngularEdge> {
  id: string;
  item: EdgeType;
  type: 'replace';
}

export interface EdgeResetChange<EdgeType = AngularEdge> {
  item: EdgeType;
  type: 'reset';
}

// ===================
// 節點變更處理
// ===================

/**
 * 應用節點變更
 */
export function applyNodeChanges<NodeType extends AngularNode>(
  changes: NodeChange<NodeType>[],
  nodes: NodeType[]
): NodeType[] {
  if (changes.length === 0) {
    return nodes;
  }

  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  
  for (const change of changes) {
    switch (change.type) {
      case 'add': {
        if (!nodeMap.has(change.item.id)) {
          nodeMap.set(change.item.id, change.item);
        }
        break;
      }
      
      case 'remove': {
        nodeMap.delete(change.id);
        break;
      }
      
      case 'replace': {
        nodeMap.set(change.id, change.item);
        break;
      }
      
      case 'reset': {
        return [change.item];
      }
      
      case 'select': {
        const node = nodeMap.get(change.id);
        if (node) {
          nodeMap.set(change.id, {
            ...node,
            selected: change.selected
          });
        }
        break;
      }
      
      case 'position': {
        const node = nodeMap.get(change.id);
        if (node) {
          const updatedNode = { ...node };
          
          if (change.position !== undefined) {
            updatedNode.position = change.position;
          }
          
          if (change.positionAbsolute !== undefined) {
            updatedNode.positionAbsolute = change.positionAbsolute;
          }
          
          if (change.dragging !== undefined) {
            updatedNode.dragging = change.dragging;
          }
          
          nodeMap.set(change.id, updatedNode);
        }
        break;
      }
      
      case 'dimensions': {
        const node = nodeMap.get(change.id);
        if (node) {
          const updatedNode = { ...node };
          
          if (change.dimensions) {
            updatedNode.width = change.dimensions.width;
            updatedNode.height = change.dimensions.height;
          }
          
          if (change.resizing !== undefined) {
            updatedNode.resizing = change.resizing;
          }
          
          nodeMap.set(change.id, updatedNode);
        }
        break;
      }
    }
  }
  
  return Array.from(nodeMap.values());
}

/**
 * 應用邊線變更
 */
export function applyEdgeChanges<EdgeType extends AngularEdge>(
  changes: EdgeChange<EdgeType>[],
  edges: EdgeType[]
): EdgeType[] {
  if (changes.length === 0) {
    return edges;
  }

  const edgeMap = new Map(edges.map(edge => [edge.id, edge]));
  
  for (const change of changes) {
    switch (change.type) {
      case 'add': {
        if (!edgeMap.has(change.item.id)) {
          edgeMap.set(change.item.id, change.item);
        }
        break;
      }
      
      case 'remove': {
        edgeMap.delete(change.id);
        break;
      }
      
      case 'replace': {
        edgeMap.set(change.id, change.item);
        break;
      }
      
      case 'reset': {
        return [change.item];
      }
      
      case 'select': {
        const edge = edgeMap.get(change.id);
        if (edge) {
          edgeMap.set(change.id, {
            ...edge,
            selected: change.selected
          });
        }
        break;
      }
    }
  }
  
  return Array.from(edgeMap.values());
}

// ===================
// 變更創建函數
// ===================

/**
 * 創建節點選擇變更
 */
export function createNodeSelectionChange(
  nodeId: string,
  selected: boolean
): NodeSelectionChange {
  return {
    id: nodeId,
    type: 'select',
    selected
  };
}

/**
 * 創建邊線選擇變更
 */
export function createEdgeSelectionChange(
  edgeId: string,
  selected: boolean
): EdgeSelectionChange {
  return {
    id: edgeId,
    type: 'select',
    selected
  };
}

/**
 * 創建節點位置變更
 */
export function createNodePositionChange<NodeType = AngularNode>(
  nodeId: string,
  position?: XYPosition,
  positionAbsolute?: XYPosition,
  dragging?: boolean
): NodePositionChange<NodeType> {
  return {
    id: nodeId,
    type: 'position',
    position,
    positionAbsolute,
    dragging
  };
}

/**
 * 創建節點尺寸變更
 */
export function createNodeDimensionChange(
  nodeId: string,
  dimensions?: Dimensions,
  updateStyle?: boolean,
  resizing?: boolean
): NodeDimensionChange {
  return {
    id: nodeId,
    type: 'dimensions',
    dimensions,
    updateStyle,
    resizing
  };
}

/**
 * 創建節點移除變更
 */
export function createNodeRemoveChange(nodeId: string): NodeRemoveChange {
  return {
    id: nodeId,
    type: 'remove'
  };
}

/**
 * 創建邊線移除變更
 */
export function createEdgeRemoveChange(edgeId: string): EdgeRemoveChange {
  return {
    id: edgeId,
    type: 'remove'
  };
}

/**
 * 創建節點添加變更
 */
export function createNodeAddChange<NodeType extends AngularNode>(
  node: NodeType
): NodeAddChange<NodeType> {
  return {
    item: node,
    type: 'add'
  };
}

/**
 * 創建邊線添加變更
 */
export function createEdgeAddChange<EdgeType extends AngularEdge>(
  edge: EdgeType
): EdgeAddChange<EdgeType> {
  return {
    item: edge,
    type: 'add'
  };
}

/**
 * 創建選擇變更（多個節點）
 */
export function createSelectionChange(
  nodeIds: string[],
  selected: boolean
): NodeSelectionChange[] {
  return nodeIds.map(nodeId => createNodeSelectionChange(nodeId, selected));
}

/**
 * 批量創建節點移除變更
 */
export function createNodesRemoveChange(nodeIds: string[]): NodeRemoveChange[] {
  return nodeIds.map(nodeId => createNodeRemoveChange(nodeId));
}

/**
 * 批量創建邊線移除變更
 */
export function createEdgesRemoveChange(edgeIds: string[]): EdgeRemoveChange[] {
  return edgeIds.map(edgeId => createEdgeRemoveChange(edgeId));
}

// ===================
// 變更工具函數
// ===================

/**
 * 過濾出特定類型的變更
 */
export function filterChanges<T extends NodeChange | EdgeChange>(
  changes: T[],
  type: T['type']
): T[] {
  return changes.filter(change => change.type === type);
}

/**
 * 檢查是否包含特定類型的變更
 */
export function hasChangeType<T extends NodeChange | EdgeChange>(
  changes: T[],
  type: T['type']
): boolean {
  return changes.some(change => change.type === type);
}

/**
 * 獲取變更的目標ID列表
 */
export function getChangeTargetIds<T extends NodeChange | EdgeChange>(
  changes: T[]
): string[] {
  return changes
    .filter(change => 'id' in change)
    .map(change => (change as any).id);
}

/**
 * 合併相同ID的變更
 */
export function mergeChanges<T extends NodeChange>(changes: T[]): T[] {
  const changeMap = new Map<string, T>();
  
  for (const change of changes) {
    if ('id' in change) {
      const existingChange = changeMap.get(change.id);
      if (existingChange && existingChange.type === change.type) {
        // 合併同類型變更
        changeMap.set(change.id, { ...existingChange, ...change });
      } else {
        changeMap.set(change.id, change);
      }
    } else {
      // 對於沒有ID的變更（如reset），直接添加
      changeMap.set(Math.random().toString(), change);
    }
  }
  
  return Array.from(changeMap.values());
}

/**
 * 檢查變更是否有效
 */
export function isValidChange(change: NodeChange | EdgeChange): boolean {
  if (!change || !change.type) {
    return false;
  }
  
  switch (change.type) {
    case 'add':
    case 'replace':
    case 'reset':
      return 'item' in change && change.item != null;
    case 'remove':
    case 'select':
    case 'position':
    case 'dimensions':
      return 'id' in change && typeof change.id === 'string';
    default:
      return false;
  }
}

/**
 * 過濾有效變更
 */
export function filterValidChanges<T extends NodeChange | EdgeChange>(
  changes: T[]
): T[] {
  return changes.filter(isValidChange);
}