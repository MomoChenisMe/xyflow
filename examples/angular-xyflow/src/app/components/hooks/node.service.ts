import { Injectable, computed, signal, effect } from '@angular/core';
import { FlowStoreService } from '../contexts/flow-store.service';
import { NodeBase, InternalNode, NodeChange } from '../components/Nodes/nodes.types';

/**
 * NodeData 類型
 */
export type NodeData<T = any> = Pick<NodeBase<T>, 'id' | 'type' | 'data'>;

/**
 * NodeUpdate 類型
 */
export type NodeUpdate<T = any> = Partial<NodeBase<T>> | ((node: NodeBase<T>) => Partial<NodeBase<T>>);

/**
 * DataUpdate 類型
 */
export type DataUpdate<T = any> = T | ((data: T) => T);

/**
 * NodeConnection 連接信息
 */
export interface NodeConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle: string | null;
  targetHandle: string | null;
}

/**
 * NodeConnections 查詢選項
 */
export interface NodeConnectionsOptions {
  id?: string;
  handleType?: 'source' | 'target';
  handleId?: string;
  onConnect?: (connections: NodeConnection[]) => void;
  onDisconnect?: (connections: NodeConnection[]) => void;
}

/**
 * NodeService - Angular equivalent of React Flow's node-related hooks
 * 
 * 節點服務 - 提供完整的節點管理和操作功能
 * 等價於 React Flow 的 useNodes, useNodesData, useInternalNode, useNodeConnections 等 hooks
 * 
 * 主要功能：
 * - 節點數據管理和查詢
 * - 節點狀態監聽和更新
 * - 節點連接信息管理
 * - 節點初始化狀態檢查
 * - 節點內部狀態更新
 * - 響應式節點數據訂閱
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <div>總節點數: {{ totalNodes() }}</div>
 *     <div>選中節點: {{ selectedNodes().length }}</div>
 *     <div>特定節點數據: {{ specificNodeData()?.label }}</div>
 *     
 *     <button (click)="addNode()">添加節點</button>
 *     <button (click)="updateNodeData()">更新節點數據</button>
 *     <button (click)="selectAll()">全選節點</button>
 *   `
 * })
 * export class NodeManagementComponent {
 *   totalNodes = computed(() => this.nodeService.getNodes().length);
 *   selectedNodes = computed(() => this.nodeService.getSelectedNodes());
 *   specificNodeData = computed(() => this.nodeService.getNodeData('node-1')?.data);
 *   
 *   constructor(private nodeService: NodeService) {
 *     // 監聽節點變化
 *     effect(() => {
 *       const nodes = this.nodeService.getNodes();
 *       console.log('Nodes changed:', nodes.length);
 *     });
 *   }
 *   
 *   addNode() {
 *     this.nodeService.addNode({
 *       id: `node-${Date.now()}`,
 *       type: 'default',
 *       position: { x: Math.random() * 300, y: Math.random() * 300 },
 *       data: { label: `節點 ${Date.now()}` }
 *     });
 *   }
 *   
 *   updateNodeData() {
 *     this.nodeService.updateNodeData('node-1', (data) => ({
 *       ...data,
 *       label: `更新於 ${new Date().toLocaleTimeString()}`
 *     }));
 *   }
 *   
 *   selectAll() {
 *     const allNodeIds = this.nodeService.getNodes().map(n => n.id);
 *     this.nodeService.selectNodes(allNodeIds);
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class NodeService {
  /** 所有節點的響應式信號 */
  nodes = computed(() => this.store.getNodes());

  /** 節點查找表的響應式信號 */
  nodeLookup = computed(() => this.store.getNodeLookup());

  /** 選中節點 ID 集合 */
  selectedNodeIds = computed(() => this.store.getSelectedNodes());

  /** 選中的節點對象 */
  selectedNodes = computed(() => {
    const selectedIds = this.selectedNodeIds();
    const nodes = this.nodes();
    return nodes.filter(node => selectedIds.includes(node.id));
  });

  /** 節點是否已初始化（有尺寸信息）*/
  nodesInitialized = computed(() => {
    const nodes = this.nodes();
    return nodes.length > 0 && nodes.every(node => this.hasNodeDimensions(node));
  });

  /** 可見節點 ID */
  visibleNodeIds = computed(() => {
    const nodes = this.nodes();
    return nodes.filter(node => !node.hidden).map(node => node.id);
  });

  constructor(private store: FlowStoreService) {
    // 監聽節點變化
    effect(() => {
      const nodes = this.nodes();
      console.log('NodeService: Nodes updated:', nodes.length);
    });

    // 監聽選擇變化
    effect(() => {
      const selectedIds = this.selectedNodeIds();
      console.log('NodeService: Selection changed:', selectedIds);
    });
  }

  // ===================
  // 基礎節點操作
  // ===================

  /**
   * 獲取所有節點
   */
  getNodes<T = any>(): NodeBase<T>[] {
    return this.nodes() as NodeBase<T>[];
  }

  /**
   * 設置節點
   */
  setNodes<T = any>(nodes: NodeBase<T>[]): void {
    this.store.setNodes(nodes);
  }

  /**
   * 添加節點
   */
  addNode<T = any>(node: NodeBase<T>): void {
    this.store.addNode(node);
  }

  /**
   * 添加多個節點
   */
  addNodes<T = any>(nodes: NodeBase<T>[]): void {
    const currentNodes = this.getNodes();
    this.store.setNodes([...currentNodes, ...nodes]);
  }

  /**
   * 獲取單個節點
   */
  getNode<T = any>(id: string): NodeBase<T> | undefined {
    return this.nodes().find(node => node.id === id) as NodeBase<T> | undefined;
  }

  /**
   * 獲取內部節點
   */
  getInternalNode(id: string): InternalNode | undefined {
    return this.nodeLookup().get(id);
  }

  /**
   * 更新節點
   */
  updateNode<T = any>(id: string, nodeUpdate: NodeUpdate<T>): void {
    if (typeof nodeUpdate === 'function') {
      const currentNode = this.store.getNodes().find((n: NodeBase<any>) => n.id === id);
      if (currentNode) {
        const updates = nodeUpdate(currentNode as NodeBase<T>);
        this.store.updateNode(id, updates);
      }
    } else {
      this.store.updateNode(id, nodeUpdate);
    }
  }

  /**
   * 移除節點
   */
  removeNode(id: string): void {
    this.store.removeNode(id);
  }

  /**
   * 移除多個節點
   */
  removeNodes(ids: string[]): void {
    const currentNodes = this.getNodes();
    const idsSet = new Set(ids);
    this.store.setNodes(currentNodes.filter(node => !idsSet.has(node.id)));
  }

  // ===================
  // 節點數據操作
  // ===================

  /**
   * 獲取節點數據（單個節點）
   */
  getNodeData<T = any>(nodeId: string): NodeData<T> | null {
    const node = this.getNode<T>(nodeId);
    if (!node) return null;
    
    return {
      id: node.id,
      type: node.type,
      data: node.data
    };
  }

  /**
   * 獲取多個節點數據
   */
  getNodesData<T = any>(nodeIds: string[]): NodeData<T>[] {
    return nodeIds
      .map(id => this.getNodeData<T>(id))
      .filter((nodeData): nodeData is NodeData<T> => nodeData !== null);
  }

  /**
   * 更新節點數據
   */
  updateNodeData<T = any>(id: string, dataUpdate: DataUpdate<T>): void {
    this.updateNode(id, (node: NodeBase<T>) => {
      const currentData = node.data as T;
      const newData = typeof dataUpdate === 'function' 
        ? (dataUpdate as (data: T) => T)(currentData)
        : dataUpdate;
      
      return { data: newData };
    });
  }

  /**
   * 批量更新節點數據
   */
  updateNodesData<T = any>(updates: Array<{ id: string; data: DataUpdate<T> }>): void {
    const currentNodes = this.getNodes();
    const updatesMap = new Map(updates.map(u => [u.id, u.data]));
    
    const updatedNodes = currentNodes.map(node => {
      if (updatesMap.has(node.id)) {
        const dataUpdate = updatesMap.get(node.id)!;
        const newData = typeof dataUpdate === 'function'
          ? (dataUpdate as (data: T) => T)(node.data as T)
          : dataUpdate;
        
        return { ...node, data: newData };
      }
      return node;
    });
    
    this.store.setNodes(updatedNodes);
  }

  // ===================
  // 節點選擇操作
  // ===================

  /**
   * 獲取選中的節點 ID
   */
  getSelectedNodeIds(): string[] {
    return this.selectedNodeIds();
  }

  /**
   * 獲取選中的節點
   */
  getSelectedNodes<T = any>(): NodeBase<T>[] {
    return this.selectedNodes() as NodeBase<T>[];
  }

  /**
   * 選擇節點
   */
  selectNodes(nodeIds: string[]): void {
    this.store.addSelectedNodes(nodeIds);
  }

  /**
   * 選擇單個節點
   */
  selectNode(nodeId: string): void {
    this.selectNodes([nodeId]);
  }

  /**
   * 取消選擇節點
   */
  unselectNodes(nodeIds: string[]): void {
    const nodes = nodeIds.map(id => ({ id }));
    this.store.unselectNodesAndEdges({ nodes });
  }

  /**
   * 取消選擇單個節點
   */
  unselectNode(nodeId: string): void {
    this.unselectNodes([nodeId]);
  }

  /**
   * 清除所有選擇
   */
  clearSelection(): void {
    this.store.clearSelection();
  }

  /**
   * 切換節點選擇狀態
   */
  toggleNodeSelection(nodeId: string): void {
    const selectedIds = this.selectedNodeIds();
    if (selectedIds.includes(nodeId)) {
      this.unselectNode(nodeId);
    } else {
      this.selectNode(nodeId);
    }
  }

  /**
   * 選擇所有節點
   */
  selectAllNodes(): void {
    const allNodeIds = this.nodes().map(node => node.id);
    this.selectNodes(allNodeIds);
  }

  // ===================
  // 節點狀態檢查
  // ===================

  /**
   * 檢查節點是否存在
   */
  hasNode(nodeId: string): boolean {
    return this.nodeLookup().has(nodeId);
  }

  /**
   * 檢查節點是否被選中
   */
  isNodeSelected(nodeId: string): boolean {
    return this.selectedNodeIds().includes(nodeId);
  }

  /**
   * 檢查節點是否有尺寸信息
   */
  hasNodeDimensions(node: NodeBase): boolean {
    return !!(node.width && node.height);
  }

  /**
   * 檢查節點是否已初始化
   */
  isNodeInitialized(nodeId: string): boolean {
    const node = this.getNode(nodeId);
    return node ? this.hasNodeDimensions(node) : false;
  }

  /**
   * 檢查所有節點是否已初始化
   */
  areNodesInitialized(options?: { includeHiddenNodes?: boolean }): boolean {
    const nodes = options?.includeHiddenNodes 
      ? this.nodes()
      : this.nodes().filter(node => !node.hidden);
    
    return nodes.length > 0 && nodes.every(node => this.hasNodeDimensions(node));
  }

  /**
   * 檢查節點是否可見
   */
  isNodeVisible(nodeId: string): boolean {
    const node = this.getNode(nodeId);
    return node ? !node.hidden : false;
  }

  // ===================
  // 節點連接信息
  // ===================

  /**
   * 獲取節點連接信息
   */
  getNodeConnections(options: NodeConnectionsOptions = {}): NodeConnection[] {
    const edges = this.store.getEdges();
    const { id, handleType, handleId } = options;
    
    let connections = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || null,
      targetHandle: edge.targetHandle || null,
    }));
    
    if (id) {
      connections = connections.filter(conn => 
        conn.source === id || conn.target === id
      );
    }
    
    if (handleType && id) {
      if (handleType === 'source') {
        connections = connections.filter(conn => conn.source === id);
      } else {
        connections = connections.filter(conn => conn.target === id);
      }
    }
    
    if (handleId) {
      connections = connections.filter(conn => 
        conn.sourceHandle === handleId || conn.targetHandle === handleId
      );
    }
    
    return connections;
  }

  /**
   * 檢查節點是否有連接
   */
  hasNodeConnections(nodeId: string, handleType?: 'source' | 'target'): boolean {
    const connections = this.getNodeConnections({ id: nodeId, handleType });
    return connections.length > 0;
  }

  /**
   * 獲取節點的輸入連接
   */
  getNodeInputConnections(nodeId: string): NodeConnection[] {
    return this.getNodeConnections({ id: nodeId, handleType: 'target' });
  }

  /**
   * 獲取節點的輸出連接
   */
  getNodeOutputConnections(nodeId: string): NodeConnection[] {
    return this.getNodeConnections({ id: nodeId, handleType: 'source' });
  }

  // ===================
  // 節點操作工具
  // ===================

  /**
   * 更新節點內部狀態
   */
  updateNodeInternals(nodeId?: string): void {
    if (nodeId) {
      console.log(`Updating internals for node: ${nodeId}`);
      // 在實際實現中，這裡會觸發節點重新計算
    } else {
      console.log('Updating internals for all nodes');
      // 更新所有節點
    }
    
    // 觸發重新渲染
    this.store.updateState({ 
      nodeLookup: new Map(this.nodeLookup()) 
    });
  }

  /**
   * 重置節點位置
   */
  resetNodePositions(): void {
    const nodes = this.getNodes();
    const resetNodes = nodes.map((node, index) => ({
      ...node,
      position: { x: index * 200, y: 100 }
    }));
    
    this.setNodes(resetNodes);
  }

  /**
   * 克隆節點
   */
  cloneNode<T = any>(nodeId: string, options?: { position?: { x: number; y: number }; id?: string }): NodeBase<T> | null {
    const node = this.getNode<T>(nodeId);
    if (!node) return null;
    
    const clonedNode: NodeBase<T> = {
      ...node,
      id: options?.id || `${node.id}-clone-${Date.now()}`,
      position: options?.position || { 
        x: node.position.x + 50, 
        y: node.position.y + 50 
      },
      selected: false,
    };
    
    this.addNode(clonedNode);
    return clonedNode;
  }

  /**
   * 獲取節點邊界框
   */
  getNodeBounds(nodeId: string): { x: number; y: number; width: number; height: number } | null {
    const node = this.getNode(nodeId);
    if (!node) return null;
    
    return {
      x: node.position.x,
      y: node.position.y,
      width: node.width || 150,
      height: node.height || 40,
    };
  }

  /**
   * 查找節點中心點
   */
  getNodeCenter(nodeId: string): { x: number; y: number } | null {
    const bounds = this.getNodeBounds(nodeId);
    if (!bounds) return null;
    
    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };
  }
}

/**
 * Angular 版本的 useNodes hook
 */
export function useNodes<T = any>(): NodeBase<T>[] {
  const nodeService = new NodeService(new FlowStoreService());
  return nodeService.getNodes<T>();
}

/**
 * Angular 版本的 useNodesData hook
 */
export function useNodesData<T = any>(nodeId: string): NodeData<T> | null;
export function useNodesData<T = any>(nodeIds: string[]): NodeData<T>[];
export function useNodesData<T = any>(nodeIdOrIds: string | string[]): NodeData<T> | NodeData<T>[] | null {
  const nodeService = new NodeService(new FlowStoreService());
  
  if (Array.isArray(nodeIdOrIds)) {
    return nodeService.getNodesData<T>(nodeIdOrIds);
  } else {
    return nodeService.getNodeData<T>(nodeIdOrIds);
  }
}

/**
 * Angular 版本的 useInternalNode hook
 */
export function useInternalNode(nodeId: string): InternalNode | undefined {
  const nodeService = new NodeService(new FlowStoreService());
  return nodeService.getInternalNode(nodeId);
}

/**
 * Angular 版本的 useNodesInitialized hook
 */
export function useNodesInitialized(options?: { includeHiddenNodes?: boolean }): boolean {
  const nodeService = new NodeService(new FlowStoreService());
  return nodeService.areNodesInitialized(options);
}

/**
 * Angular 版本的 useNodeConnections hook
 */
export function useNodeConnections(options: NodeConnectionsOptions = {}): NodeConnection[] {
  const nodeService = new NodeService(new FlowStoreService());
  return nodeService.getNodeConnections(options);
}

/**
 * Angular 版本的 useUpdateNodeInternals hook
 */
export function useUpdateNodeInternals(): (nodeId?: string) => void {
  const nodeService = new NodeService(new FlowStoreService());
  return (nodeId?: string) => nodeService.updateNodeInternals(nodeId);
}