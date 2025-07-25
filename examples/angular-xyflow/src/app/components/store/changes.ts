import { NodeBase } from '../components/Nodes/nodes.types';
import { Edge } from '../hooks/edge.service';

/**
 * 變化處理工具
 * 
 * 提供處理節點和邊緣變化的工具函數，等價於 React Flow 的 applyChanges 系統
 */

// ===================
// 節點變化類型
// ===================

/**
 * 節點變化基礎接口
 */
export interface NodeChangeBase {
  id: string;
  type: string;
}

/**
 * 添加節點變化
 */
export interface NodeAddChange extends NodeChangeBase {
  type: 'add';
  item: NodeBase;
}

/**
 * 移除節點變化
 */
export interface NodeRemoveChange extends NodeChangeBase {
  type: 'remove';
}

/**
 * 選擇節點變化
 */
export interface NodeSelectionChange extends NodeChangeBase {
  type: 'select';
  selected: boolean;
}

/**
 * 位置變化
 */
export interface NodePositionChange extends NodeChangeBase {
  type: 'position';
  position?: { x: number; y: number };
  dragging?: boolean;
}

/**
 * 尺寸變化
 */
export interface NodeDimensionsChange extends NodeChangeBase {
  type: 'dimensions';
  dimensions?: { width: number; height: number };
  updateStyle?: boolean;
}

/**
 * 替換節點變化
 */
export interface NodeReplaceChange extends NodeChangeBase {
  type: 'replace';
  item: NodeBase;
}

/**
 * 重置節點變化
 */
export interface NodeResetChange extends NodeChangeBase {
  type: 'reset';
}

/**
 * 所有節點變化類型
 */
export type NodeChange = 
  | NodeAddChange 
  | NodeRemoveChange 
  | NodeSelectionChange 
  | NodePositionChange 
  | NodeDimensionsChange 
  | NodeReplaceChange
  | NodeResetChange;

// ===================
// 邊緣變化類型
// ===================

/**
 * 邊緣變化基礎接口
 */
export interface EdgeChangeBase {
  id: string;
  type: string;
}

/**
 * 添加邊緣變化
 */
export interface EdgeAddChange extends EdgeChangeBase {
  type: 'add';
  item: Edge;
}

/**
 * 移除邊緣變化
 */
export interface EdgeRemoveChange extends EdgeChangeBase {
  type: 'remove';
}

/**
 * 選擇邊緣變化
 */
export interface EdgeSelectionChange extends EdgeChangeBase {
  type: 'select';
  selected: boolean;
}

/**
 * 替換邊緣變化
 */
export interface EdgeReplaceChange extends EdgeChangeBase {
  type: 'replace';
  item: Edge;
}

/**
 * 重置邊緣變化
 */
export interface EdgeResetChange extends EdgeChangeBase {
  type: 'reset';
}

/**
 * 所有邊緣變化類型
 */
export type EdgeChange = 
  | EdgeAddChange 
  | EdgeRemoveChange 
  | EdgeSelectionChange 
  | EdgeReplaceChange
  | EdgeResetChange;

// ===================
// 節點變化應用器
// ===================

/**
 * 應用節點變化
 */
export function applyNodeChanges(changes: NodeChange[], nodes: NodeBase[]): NodeBase[] {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const nodesToAdd: NodeBase[] = [];
  const nodeIdsToRemove = new Set<string>();
  
  for (const change of changes) {
    switch (change.type) {
      case 'add':
        nodesToAdd.push(change.item);
        break;
        
      case 'remove':
        nodeIdsToRemove.add(change.id);
        nodeMap.delete(change.id);
        break;
        
      case 'select': {
        const node = nodeMap.get(change.id);
        if (node) {
          nodeMap.set(change.id, { ...node, selected: change.selected });
        }
        break;
      }
      
      case 'position': {
        const node = nodeMap.get(change.id);
        if (node) {
          const updates: Partial<NodeBase> = {};
          
          if (change.position !== undefined) {
            updates.position = change.position;
          }
          
          if (change.dragging !== undefined) {
            updates.dragging = change.dragging;
          }
          
          nodeMap.set(change.id, { ...node, ...updates });
        }
        break;
      }
      
      case 'dimensions': {
        const node = nodeMap.get(change.id);
        if (node && change.dimensions) {
          const updates: Partial<NodeBase> = {
            width: change.dimensions.width,
            height: change.dimensions.height,
          };
          
          // 如果需要更新樣式
          if (change.updateStyle && node.style) {
            updates.style = {
              ...node.style,
              width: change.dimensions.width,
              height: change.dimensions.height,
            };
          }
          
          nodeMap.set(change.id, { ...node, ...updates });
        }
        break;
      }
      
      case 'replace': {
        nodeMap.set(change.id, change.item);
        break;
      }
      
      case 'reset': {
        // 重置特定節點到初始狀態
        const node = nodeMap.get(change.id);
        if (node) {
          nodeMap.set(change.id, {
            ...node,
            selected: false,
            dragging: false,
            position: node.position, // 保持位置
          });
        }
        break;
      }
    }
  }
  
  // 組合結果
  const result = Array.from(nodeMap.values()).filter(node => !nodeIdsToRemove.has(node.id));
  result.push(...nodesToAdd);
  
  return result;
}

// ===================
// 邊緣變化應用器
// ===================

/**
 * 應用邊緣變化
 */
export function applyEdgeChanges(changes: EdgeChange[], edges: Edge[]): Edge[] {
  const edgeMap = new Map(edges.map(edge => [edge.id, edge]));
  const edgesToAdd: Edge[] = [];
  const edgeIdsToRemove = new Set<string>();
  
  for (const change of changes) {
    switch (change.type) {
      case 'add':
        edgesToAdd.push(change.item);
        break;
        
      case 'remove':
        edgeIdsToRemove.add(change.id);
        edgeMap.delete(change.id);
        break;
        
      case 'select': {
        const edge = edgeMap.get(change.id);
        if (edge) {
          edgeMap.set(change.id, { ...edge, selected: change.selected });
        }
        break;
      }
      
      case 'replace': {
        edgeMap.set(change.id, change.item);
        break;
      }
      
      case 'reset': {
        // 重置特定邊緣到初始狀態
        const edge = edgeMap.get(change.id);
        if (edge) {
          edgeMap.set(change.id, {
            ...edge,
            selected: false,
          });
        }
        break;
      }
    }
  }
  
  // 組合結果
  const result = Array.from(edgeMap.values()).filter(edge => !edgeIdsToRemove.has(edge.id));
  result.push(...edgesToAdd);
  
  return result;
}

// ===================
// 變化創建器
// ===================

/**
 * 節點變化創建器
 */
export const createNodeChanges = {
  /**
   * 創建添加節點變化
   */
  add: (item: NodeBase): NodeAddChange => ({
    id: item.id,
    type: 'add',
    item,
  }),
  
  /**
   * 創建移除節點變化
   */
  remove: (id: string): NodeRemoveChange => ({
    id,
    type: 'remove',
  }),
  
  /**
   * 創建選擇變化
   */
  select: (id: string, selected: boolean): NodeSelectionChange => ({
    id,
    type: 'select',
    selected,
  }),
  
  /**
   * 創建位置變化
   */
  position: (
    id: string, 
    position?: { x: number; y: number },
    dragging?: boolean
  ): NodePositionChange => ({
    id,
    type: 'position',
    position,
    dragging,
  }),
  
  /**
   * 創建尺寸變化
   */
  dimensions: (
    id: string,
    dimensions: { width: number; height: number },
    updateStyle = false
  ): NodeDimensionsChange => ({
    id,
    type: 'dimensions',
    dimensions,
    updateStyle,
  }),
  
  /**
   * 創建替換變化
   */
  replace: (item: NodeBase): NodeReplaceChange => ({
    id: item.id,
    type: 'replace',
    item,
  }),
  
  /**
   * 創建重置變化
   */
  reset: (id: string): NodeResetChange => ({
    id,
    type: 'reset',
  }),
};

/**
 * 邊緣變化創建器
 */
export const createEdgeChanges = {
  /**
   * 創建添加邊緣變化
   */
  add: (item: Edge): EdgeAddChange => ({
    id: item.id,
    type: 'add',
    item,
  }),
  
  /**
   * 創建移除邊緣變化
   */
  remove: (id: string): EdgeRemoveChange => ({
    id,
    type: 'remove',
  }),
  
  /**
   * 創建選擇變化
   */
  select: (id: string, selected: boolean): EdgeSelectionChange => ({
    id,
    type: 'select',
    selected,
  }),
  
  /**
   * 創建替換變化
   */
  replace: (item: Edge): EdgeReplaceChange => ({
    id: item.id,
    type: 'replace',
    item,
  }),
  
  /**
   * 創建重置變化
   */
  reset: (id: string): EdgeResetChange => ({
    id,
    type: 'reset',
  }),
};

// ===================
// 批量變化工具
// ===================

/**
 * 批量選擇節點
 */
export function createBulkNodeSelection(nodeIds: string[], selected: boolean): NodeChange[] {
  return nodeIds.map(id => createNodeChanges.select(id, selected));
}

/**
 * 批量選擇邊緣
 */
export function createBulkEdgeSelection(edgeIds: string[], selected: boolean): EdgeChange[] {
  return edgeIds.map(id => createEdgeChanges.select(id, selected));
}

/**
 * 批量移除節點
 */
export function createBulkNodeRemoval(nodeIds: string[]): NodeChange[] {
  return nodeIds.map(id => createNodeChanges.remove(id));
}

/**
 * 批量移除邊緣
 */
export function createBulkEdgeRemoval(edgeIds: string[]): EdgeChange[] {
  return edgeIds.map(id => createEdgeChanges.remove(id));
}

/**
 * 批量移動節點
 */
export function createBulkNodeMove(
  moves: Array<{ id: string; position: { x: number; y: number } }>
): NodeChange[] {
  return moves.map(({ id, position }) => createNodeChanges.position(id, position));
}

// ===================
// 變化分析工具
// ===================

/**
 * 分析節點變化
 */
export function analyzeNodeChanges(changes: NodeChange[]): {
  added: string[];
  removed: string[];
  selected: string[];
  deselected: string[];
  moved: string[];
  resized: string[];
  replaced: string[];
} {
  const analysis = {
    added: [] as string[],
    removed: [] as string[],
    selected: [] as string[],
    deselected: [] as string[],
    moved: [] as string[],
    resized: [] as string[],
    replaced: [] as string[],
  };
  
  for (const change of changes) {
    switch (change.type) {
      case 'add':
        analysis.added.push(change.id);
        break;
      case 'remove':
        analysis.removed.push(change.id);
        break;
      case 'select':
        if (change.selected) {
          analysis.selected.push(change.id);
        } else {
          analysis.deselected.push(change.id);
        }
        break;
      case 'position':
        analysis.moved.push(change.id);
        break;
      case 'dimensions':
        analysis.resized.push(change.id);
        break;
      case 'replace':
        analysis.replaced.push(change.id);
        break;
    }
  }
  
  return analysis;
}

/**
 * 分析邊緣變化
 */
export function analyzeEdgeChanges(changes: EdgeChange[]): {
  added: string[];
  removed: string[];
  selected: string[];
  deselected: string[];
  replaced: string[];
} {
  const analysis = {
    added: [] as string[],
    removed: [] as string[],
    selected: [] as string[],
    deselected: [] as string[],
    replaced: [] as string[],
  };
  
  for (const change of changes) {
    switch (change.type) {
      case 'add':
        analysis.added.push(change.id);
        break;
      case 'remove':
        analysis.removed.push(change.id);
        break;
      case 'select':
        if (change.selected) {
          analysis.selected.push(change.id);
        } else {
          analysis.deselected.push(change.id);
        }
        break;
      case 'replace':
        analysis.replaced.push(change.id);
        break;
    }
  }
  
  return analysis;
}

// ===================
// 變化驗證
// ===================

/**
 * 驗證節點變化
 */
export function validateNodeChanges(changes: NodeChange[], currentNodes: NodeBase[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const nodeIds = new Set(currentNodes.map(node => node.id));
  
  for (const change of changes) {
    switch (change.type) {
      case 'add':
        if (nodeIds.has(change.id)) {
          warnings.push(`Node ${change.id} already exists, will be replaced`);
        }
        break;
        
      case 'remove':
      case 'select':
      case 'position':
      case 'dimensions':
      case 'replace':
        if (!nodeIds.has(change.id)) {
          errors.push(`Node ${change.id} does not exist`);
        }
        break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 驗證邊緣變化
 */
export function validateEdgeChanges(changes: EdgeChange[], currentEdges: Edge[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const edgeIds = new Set(currentEdges.map(edge => edge.id));
  
  for (const change of changes) {
    switch (change.type) {
      case 'add':
        if (edgeIds.has(change.id)) {
          warnings.push(`Edge ${change.id} already exists, will be replaced`);
        }
        break;
        
      case 'remove':
      case 'select':
      case 'replace':
        if (!edgeIds.has(change.id)) {
          errors.push(`Edge ${change.id} does not exist`);
        }
        break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ===================
// 變化優化
// ===================

/**
 * 優化節點變化（合併重複操作）
 */
export function optimizeNodeChanges(changes: NodeChange[]): NodeChange[] {
  const changeMap = new Map<string, NodeChange>();
  
  for (const change of changes) {
    const existing = changeMap.get(change.id);
    
    if (!existing) {
      changeMap.set(change.id, change);
      continue;
    }
    
    // 合併邏輯
    if (existing.type === 'position' && change.type === 'position') {
      // 合併位置變化
      changeMap.set(change.id, {
        ...change,
        position: change.position ?? existing.position,
        dragging: change.dragging ?? existing.dragging,
      });
    } else if (existing.type === 'select' && change.type === 'select') {
      // 保留最新的選擇狀態
      changeMap.set(change.id, change);
    } else {
      // 其他情況保留最新的變化
      changeMap.set(change.id, change);
    }
  }
  
  return Array.from(changeMap.values());
}

/**
 * 優化邊緣變化
 */
export function optimizeEdgeChanges(changes: EdgeChange[]): EdgeChange[] {
  const changeMap = new Map<string, EdgeChange>();
  
  for (const change of changes) {
    changeMap.set(change.id, change);
  }
  
  return Array.from(changeMap.values());
}

/**
 * 變化工具集合
 */
export const ChangeUtils = {
  // 應用器
  applyNodeChanges,
  applyEdgeChanges,
  
  // 創建器
  createNodeChanges,
  createEdgeChanges,
  
  // 批量操作
  createBulkNodeSelection,
  createBulkEdgeSelection,
  createBulkNodeRemoval,
  createBulkEdgeRemoval,
  createBulkNodeMove,
  
  // 分析工具
  analyzeNodeChanges,
  analyzeEdgeChanges,
  
  // 驗證工具
  validateNodeChanges,
  validateEdgeChanges,
  
  // 優化工具
  optimizeNodeChanges,
  optimizeEdgeChanges,
} as const;