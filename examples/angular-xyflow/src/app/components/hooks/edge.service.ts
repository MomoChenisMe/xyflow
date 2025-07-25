import { Injectable, computed, signal, effect } from '@angular/core';
import { FlowStoreService } from '../contexts/flow-store.service';
import { Connection } from '../components/Handle/handle.types';

/**
 * Edge 基礎接口
 */
export interface Edge<T = any> {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: string;
  data?: T;
  label?: string | any; // React.ReactNode equivalent
  labelStyle?: { [key: string]: any }; // React.CSSProperties equivalent
  labelShowBg?: boolean;
  labelBgStyle?: { [key: string]: any }; // React.CSSProperties equivalent
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;
  style?: { [key: string]: any }; // React.CSSProperties equivalent
  animated?: boolean;
  hidden?: boolean;
  deletable?: boolean;
  focusable?: boolean;
  className?: string;
  zIndex?: number;
  ariaLabel?: string;
  interactionWidth?: number;
  markerStart?: string;
  markerEnd?: string;
  pathOptions?: any;
  selected?: boolean;
}

/**
 * EdgeChange 類型
 */
export interface EdgeChange {
  id: string;
  type: 'add' | 'remove' | 'select' | 'position' | 'dimensions';
  item?: Edge;
}

/**
 * EdgeUpdate 類型
 */
export type EdgeUpdate<T = any> = Partial<Edge<T>> | ((edge: Edge<T>) => Partial<Edge<T>>);

/**
 * DataUpdate 類型
 */
export type DataUpdate<T = any> = T | ((data: T) => T);

/**
 * AddEdge 工具函數
 */
export function addEdge<T = any>(connection: Connection, edges: Edge<T>[]): Edge<T>[] {
  const edgeId = connection.source + '-' + connection.target + '-' + (connection.sourceHandle || '') + '-' + (connection.targetHandle || '');
  
  const newEdge: Edge<T> = {
    id: `edge-${Date.now()}`,
    sourceHandle: null,
    targetHandle: null,
    type: 'default',
    ...connection,
  };
  
  return [...edges, newEdge];
}

/**
 * EdgeService - Angular equivalent of React Flow's edge-related hooks
 * 
 * 邊緣服務 - 提供完整的邊緣管理和操作功能
 * 等價於 React Flow 的 useEdges, useEdgesData, addEdge 等功能
 * 
 * 主要功能：
 * - 邊緣數據管理和查詢
 * - 邊緣狀態監聽和更新
 * - 邊緣連接操作
 * - 邊緣選擇管理
 * - 邊緣樣式和屬性管理
 * - 響應式邊緣數據訂閱
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <div>總邊緣數: {{ totalEdges() }}</div>
 *     <div>選中邊緣: {{ selectedEdges().length }}</div>
 *     <div>動畫邊緣: {{ animatedEdges().length }}</div>
 *     
 *     <button (click)="addEdge()">添加邊緣</button>
 *     <button (click)="updateEdgeStyle()">更新邊緣樣式</button>
 *     <button (click)="toggleAnimation()">切換動畫</button>
 *   `
 * })
 * export class EdgeManagementComponent {
 *   totalEdges = computed(() => this.edgeService.getEdges().length);
 *   selectedEdges = computed(() => this.edgeService.getSelectedEdges());
 *   animatedEdges = computed(() => this.edgeService.getEdges().filter(e => e.animated));
 *   
 *   constructor(private edgeService: EdgeService) {
 *     // 監聽邊緣變化
 *     effect(() => {
 *       const edges = this.edgeService.getEdges();
 *       console.log('Edges changed:', edges.length);
 *     });
 *   }
 *   
 *   addEdge() {
 *     this.edgeService.addEdgeFromConnection({
 *       source: 'node-1',
 *       target: 'node-2',
 *       sourceHandle: null,
 *       targetHandle: null
 *     });
 *   }
 *   
 *   updateEdgeStyle() {
 *     const edges = this.edgeService.getEdges();
 *     if (edges.length > 0) {
 *       this.edgeService.updateEdge(edges[0].id, {
 *         style: { stroke: '#ff0071', strokeWidth: 3 }
 *       });
 *     }
 *   }
 *   
 *   toggleAnimation() {
 *     const edges = this.edgeService.getEdges();
 *     edges.forEach(edge => {
 *       this.edgeService.updateEdge(edge.id, { animated: !edge.animated });
 *     });
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class EdgeService {
  /** 所有邊緣的響應式信號 */
  edges = computed(() => this.store.getEdges());

  /** 邊緣查找表的響應式信號 */
  edgeLookup = computed(() => this.store.getEdgeLookup());

  /** 選中邊緣 ID 集合 */
  selectedEdgeIds = computed(() => this.store.getSelectedEdges());

  /** 選中的邊緣對象 */
  selectedEdges = computed(() => {
    const selectedIds = this.selectedEdgeIds();
    const edges = this.edges();
    return edges.filter(edge => selectedIds.includes(edge.id));
  });

  /** 可見邊緣 */
  visibleEdges = computed(() => {
    const edges = this.edges();
    return edges.filter(edge => !edge.hidden);
  });

  /** 可見邊緣 ID */
  visibleEdgeIds = computed(() => {
    return this.visibleEdges().map(edge => edge.id);
  });

  /** 動畫邊緣 */
  animatedEdges = computed(() => {
    const edges = this.edges();
    return edges.filter(edge => edge.animated);
  });

  constructor(private store: FlowStoreService) {
    // 監聽邊緣變化
    effect(() => {
      const edges = this.edges();
      console.log('EdgeService: Edges updated:', edges.length);
    });

    // 監聽選擇變化
    effect(() => {
      const selectedIds = this.selectedEdgeIds();
      console.log('EdgeService: Edge selection changed:', selectedIds);
    });
  }

  // ===================
  // 基礎邊緣操作
  // ===================

  /**
   * 獲取所有邊緣
   */
  getEdges<T = any>(): Edge<T>[] {
    return this.edges() as Edge<T>[];
  }

  /**
   * 設置邊緣
   */
  setEdges<T = any>(edges: Edge<T>[]): void {
    this.store.setEdges(edges);
  }

  /**
   * 添加邊緣
   */
  addEdge<T = any>(edge: Edge<T>): void {
    this.store.addEdge(edge);
  }

  /**
   * 添加多個邊緣
   */
  addEdges<T = any>(edges: Edge<T>[]): void {
    const currentEdges = this.getEdges();
    this.store.setEdges([...currentEdges, ...edges]);
  }

  /**
   * 從連接添加邊緣
   */
  addEdgeFromConnection<T = any>(connection: Connection, edgeOptions?: Partial<Edge<T>>): Edge<T> {
    const currentEdges = this.getEdges<T>();
    const newEdges = addEdge(connection, currentEdges);
    const newEdge = newEdges[newEdges.length - 1];
    
    // 應用額外選項
    if (edgeOptions) {
      Object.assign(newEdge, edgeOptions);
    }
    
    this.setEdges(newEdges);
    return newEdge;
  }

  /**
   * 獲取單個邊緣
   */
  getEdge<T = any>(id: string): Edge<T> | undefined {
    return this.edges().find(edge => edge.id === id) as Edge<T> | undefined;
  }

  /**
   * 更新邊緣
   */
  updateEdge<T = any>(id: string, edgeUpdate: EdgeUpdate<T>): void {
    const currentEdges = this.getEdges<T>();
    const edgeIndex = currentEdges.findIndex(edge => edge.id === id);
    
    if (edgeIndex === -1) {
      console.warn(`Edge with id ${id} not found`);
      return;
    }
    
    const currentEdge = currentEdges[edgeIndex];
    const updates = typeof edgeUpdate === 'function' ? edgeUpdate(currentEdge) : edgeUpdate;
    
    const updatedEdges = [...currentEdges];
    updatedEdges[edgeIndex] = { ...currentEdge, ...updates };
    
    this.store.setEdges(updatedEdges);
  }

  /**
   * 移除邊緣
   */
  removeEdge(id: string): void {
    this.store.removeEdge(id);
  }

  /**
   * 移除多個邊緣
   */
  removeEdges(ids: string[]): void {
    const currentEdges = this.getEdges();
    const idsSet = new Set(ids);
    this.store.setEdges(currentEdges.filter(edge => !idsSet.has(edge.id)));
  }

  /**
   * 更新邊緣連接
   */
  updateEdgeConnection(edgeId: string, newConnection: Connection): void {
    this.updateEdge(edgeId, {
      source: newConnection.source,
      target: newConnection.target,
      sourceHandle: newConnection.sourceHandle,
      targetHandle: newConnection.targetHandle,
    });
  }

  // ===================
  // 邊緣數據操作
  // ===================

  /**
   * 更新邊緣數據
   */
  updateEdgeData<T = any>(id: string, dataUpdate: DataUpdate<T>): void {
    this.updateEdge(id, (edge) => {
      const currentData = edge.data as T;
      const newData = typeof dataUpdate === 'function' 
        ? (dataUpdate as (data: T) => T)(currentData)
        : dataUpdate;
      
      return { data: newData };
    });
  }

  /**
   * 批量更新邊緣數據
   */
  updateEdgesData<T = any>(updates: Array<{ id: string; data: DataUpdate<T> }>): void {
    const currentEdges = this.getEdges<T>();
    const updatesMap = new Map(updates.map(u => [u.id, u.data]));
    
    const updatedEdges = currentEdges.map(edge => {
      if (updatesMap.has(edge.id)) {
        const dataUpdate = updatesMap.get(edge.id)!;
        const newData = typeof dataUpdate === 'function'
          ? (dataUpdate as (data: T) => T)(edge.data as T)
          : dataUpdate;
        
        return { ...edge, data: newData };
      }
      return edge;
    });
    
    this.store.setEdges(updatedEdges);
  }

  // ===================
  // 邊緣選擇操作
  // ===================

  /**
   * 獲取選中的邊緣 ID
   */
  getSelectedEdgeIds(): string[] {
    return this.selectedEdgeIds();
  }

  /**
   * 獲取選中的邊緣
   */
  getSelectedEdges<T = any>(): Edge<T>[] {
    return this.selectedEdges() as Edge<T>[];
  }

  /**
   * 選擇邊緣
   */
  selectEdges(edgeIds: string[]): void {
    this.store.addSelectedEdges(edgeIds);
  }

  /**
   * 選擇單個邊緣
   */
  selectEdge(edgeId: string): void {
    this.selectEdges([edgeId]);
  }

  /**
   * 取消選擇邊緣
   */
  unselectEdges(edgeIds: string[]): void {
    const edges = edgeIds.map(id => ({ id }));
    this.store.unselectNodesAndEdges({ edges });
  }

  /**
   * 取消選擇單個邊緣
   */
  unselectEdge(edgeId: string): void {
    this.unselectEdges([edgeId]);
  }

  /**
   * 切換邊緣選擇狀態
   */
  toggleEdgeSelection(edgeId: string): void {
    const selectedIds = this.selectedEdgeIds();
    if (selectedIds.includes(edgeId)) {
      this.unselectEdge(edgeId);
    } else {
      this.selectEdge(edgeId);
    }
  }

  /**
   * 選擇所有邊緣
   */
  selectAllEdges(): void {
    const allEdgeIds = this.edges().map(edge => edge.id);
    this.selectEdges(allEdgeIds);
  }

  // ===================
  // 邊緣狀態檢查
  // ===================

  /**
   * 檢查邊緣是否存在
   */
  hasEdge(edgeId: string): boolean {
    return this.edgeLookup().has(edgeId);
  }

  /**
   * 檢查邊緣是否被選中
   */
  isEdgeSelected(edgeId: string): boolean {
    return this.selectedEdgeIds().includes(edgeId);
  }

  /**
   * 檢查邊緣是否可見
   */
  isEdgeVisible(edgeId: string): boolean {
    const edge = this.getEdge(edgeId);
    return edge ? !edge.hidden : false;
  }

  /**
   * 檢查邊緣是否動畫
   */
  isEdgeAnimated(edgeId: string): boolean {
    const edge = this.getEdge(edgeId);
    return edge ? !!edge.animated : false;
  }

  /**
   * 檢查邊緣是否可刪除
   */
  isEdgeDeletable(edgeId: string): boolean {
    const edge = this.getEdge(edgeId);
    return edge ? edge.deletable !== false : true;
  }

  // ===================
  // 邊緣查詢工具
  // ===================

  /**
   * 根據節點 ID 查找邊緣
   */
  getEdgesByNodeId(nodeId: string, type?: 'source' | 'target'): Edge[] {
    const edges = this.edges();
    
    if (type === 'source') {
      return edges.filter(edge => edge.source === nodeId);
    } else if (type === 'target') {
      return edges.filter(edge => edge.target === nodeId);
    } else {
      return edges.filter(edge => edge.source === nodeId || edge.target === nodeId);
    }
  }

  /**
   * 查找連接兩個節點的邊緣
   */
  getEdgesBetweenNodes(sourceId: string, targetId: string): Edge[] {
    const edges = this.edges();
    return edges.filter(edge => 
      (edge.source === sourceId && edge.target === targetId) ||
      (edge.source === targetId && edge.target === sourceId)
    );
  }

  /**
   * 根據 Handle 查找邊緣
   */
  getEdgesByHandle(nodeId: string, handleId: string, type: 'source' | 'target'): Edge[] {
    const edges = this.edges();
    
    if (type === 'source') {
      return edges.filter(edge => 
        edge.source === nodeId && edge.sourceHandle === handleId
      );
    } else {
      return edges.filter(edge => 
        edge.target === nodeId && edge.targetHandle === handleId
      );
    }
  }

  /**
   * 根據類型過濾邊緣
   */
  getEdgesByType(type: string): Edge[] {
    const edges = this.edges();
    return edges.filter(edge => edge.type === type);
  }

  /**
   * 檢查連接是否已存在
   */
  connectionExists(connection: Connection): boolean {
    const edges = this.edges();
    return edges.some(edge => 
      edge.source === connection.source &&
      edge.target === connection.target &&
      edge.sourceHandle === connection.sourceHandle &&
      edge.targetHandle === connection.targetHandle
    );
  }

  // ===================
  // 邊緣樣式操作
  // ===================

  /**
   * 更新邊緣樣式
   */
  updateEdgeStyle(edgeId: string, style: { [key: string]: any }): void {
    this.updateEdge(edgeId, { style });
  }

  /**
   * 批量更新邊緣樣式
   */
  updateEdgesStyle(edgeIds: string[], style: { [key: string]: any }): void {
    const currentEdges = this.getEdges();
    const idsSet = new Set(edgeIds);
    
    const updatedEdges = currentEdges.map(edge => 
      idsSet.has(edge.id) ? { ...edge, style: { ...edge.style, ...style } } : edge
    );
    
    this.store.setEdges(updatedEdges);
  }

  /**
   * 設置邊緣動畫
   */
  setEdgeAnimated(edgeId: string, animated: boolean): void {
    this.updateEdge(edgeId, { animated });
  }

  /**
   * 批量設置邊緣動畫
   */
  setEdgesAnimated(edgeIds: string[], animated: boolean): void {
    const currentEdges = this.getEdges();
    const idsSet = new Set(edgeIds);
    
    const updatedEdges = currentEdges.map(edge => 
      idsSet.has(edge.id) ? { ...edge, animated } : edge
    );
    
    this.store.setEdges(updatedEdges);
  }

  /**
   * 設置邊緣可見性
   */
  setEdgeVisibility(edgeId: string, hidden: boolean): void {
    this.updateEdge(edgeId, { hidden });
  }

  /**
   * 批量設置邊緣可見性
   */
  setEdgesVisibility(edgeIds: string[], hidden: boolean): void {
    const currentEdges = this.getEdges();
    const idsSet = new Set(edgeIds);
    
    const updatedEdges = currentEdges.map(edge => 
      idsSet.has(edge.id) ? { ...edge, hidden } : edge
    );
    
    this.store.setEdges(updatedEdges);
  }

  // ===================
  // 邊緣工具方法
  // ===================

  /**
   * 克隆邊緣
   */
  cloneEdge<T = any>(edgeId: string, options?: { id?: string; source?: string; target?: string }): Edge<T> | null {
    const edge = this.getEdge<T>(edgeId);
    if (!edge) return null;
    
    const clonedEdge: Edge<T> = {
      ...edge,
      id: options?.id || `${edge.id}-clone-${Date.now()}`,
      source: options?.source || edge.source,
      target: options?.target || edge.target,
      selected: false,
    };
    
    this.addEdge(clonedEdge);
    return clonedEdge;
  }

  /**
   * 反轉邊緣方向
   */
  reverseEdge(edgeId: string): void {
    const edge = this.getEdge(edgeId);
    if (!edge) return;
    
    this.updateEdge(edgeId, {
      source: edge.target,
      target: edge.source,
      sourceHandle: edge.targetHandle,
      targetHandle: edge.sourceHandle,
    });
  }

  /**
   * 清除所有邊緣
   */
  clearAllEdges(): void {
    this.store.setEdges([]);
  }

  /**
   * 移除節點相關的所有邊緣
   */
  removeNodeEdges(nodeId: string): void {
    const edges = this.getEdgesByNodeId(nodeId);
    const edgeIds = edges.map(edge => edge.id);
    this.removeEdges(edgeIds);
  }
}

/**
 * Angular 版本的 useEdges hook
 */
export function useEdges<T = any>(): Edge<T>[] {
  const edgeService = new EdgeService(new FlowStoreService());
  return edgeService.getEdges<T>();
}

// addEdge 已經在上面導出了