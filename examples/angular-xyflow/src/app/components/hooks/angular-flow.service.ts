import { Injectable, computed, signal, effect } from '@angular/core';
import { FlowStoreService } from '../contexts/flow-store.service';
import { NodeBase, InternalNode, NodeChange } from '../components/Nodes/nodes.types';
import { Connection } from '../components/Handle/handle.types';

/**
 * Transform 類型：[x, y, zoom]
 */
export type Transform = [number, number, number];

/**
 * Viewport 視窗狀態
 */
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

/**
 * FitView 選項
 */
export interface FitViewOptions {
  padding?: number;
  includeHiddenNodes?: boolean;
  minZoom?: number;
  maxZoom?: number;
  duration?: number;
}

/**
 * Zoom 選項
 */
export interface ZoomOptions {
  duration?: number;
}

/**
 * SetCenter 選項
 */
export interface SetCenterOptions {
  zoom?: number;
  duration?: number;
}

/**
 * ViewportHelperFunctions 接口
 */
export interface ViewportHelperFunctions {
  zoomIn: (options?: ZoomOptions) => void;
  zoomOut: (options?: ZoomOptions) => void;
  zoomTo: (zoomLevel: number, options?: ZoomOptions) => void;
  getZoom: () => number;
  setViewport: (viewport: Viewport, options?: { duration?: number }) => void;
  getViewport: () => Viewport;
  fitView: (options?: FitViewOptions) => void;
  setCenter: (x: number, y: number, options?: SetCenterOptions) => void;
  fitBounds: (bounds: [[number, number], [number, number]], options?: FitViewOptions) => void;
  project: (position: { x: number; y: number }) => { x: number; y: number };
  screenToFlowPosition: (position: { x: number; y: number }) => { x: number; y: number };
  flowToScreenPosition: (position: { x: number; y: number }) => { x: number; y: number };
}

/**
 * AngularFlow 實例接口
 */
export interface AngularFlowInstance extends ViewportHelperFunctions {
  // 節點操作
  getNodes: () => NodeBase[];
  setNodes: (nodes: NodeBase[] | ((nodes: NodeBase[]) => NodeBase[])) => void;
  addNodes: (nodes: NodeBase | NodeBase[]) => void;
  getNode: (id: string) => NodeBase | undefined;
  getInternalNode: (id: string) => InternalNode | undefined;
  updateNode: (id: string, nodeUpdate: Partial<NodeBase> | ((node: NodeBase) => Partial<NodeBase>)) => void;
  updateNodeData: (id: string, dataUpdate: any | ((data: any) => any)) => void;
  deleteElements: (params: { nodes?: { id: string }[]; edges?: { id: string }[] }) => void;
  
  // 邊緣操作
  getEdges: () => any[];
  setEdges: (edges: any[] | ((edges: any[]) => any[])) => void;
  addEdges: (edges: any | any[]) => void;
  getEdge: (id: string) => any | undefined;
  updateEdge: (oldEdge: any, newConnection: Connection) => void;
  updateEdgeData: (id: string, dataUpdate: any | ((data: any) => any)) => void;
  
  // 視窗和變換
  getViewport: () => Viewport;
  setViewport: (viewport: Viewport, options?: { duration?: number }) => void;
  
  // 查詢方法
  getIntersectingNodes: (node: NodeBase | { x: number; y: number; width: number; height: number }, partially?: boolean, nodes?: NodeBase[]) => NodeBase[];
  isNodeIntersecting: (node: NodeBase | { x: number; y: number; width: number; height: number }, area: { x: number; y: number; width: number; height: number }, partially?: boolean) => boolean;
  
  // 工具方法
  toObject: () => { nodes: NodeBase[]; edges: any[]; viewport: Viewport };
  fromObject: (data: { nodes: NodeBase[]; edges: any[]; viewport?: Viewport }) => void;
}

/**
 * AngularFlowService - Angular equivalent of React Flow's useReactFlow hook
 * 
 * Angular Flow 服務 - 提供完整的 Angular XYFlow 實例 API
 * 這是 Angular XYFlow 的主要 API 入口，等價於 React Flow 的 useReactFlow hook
 * 
 * 主要功能：
 * - 節點和邊緣的 CRUD 操作
 * - 視窗控制和變換管理
 * - 查詢和碰撞檢測
 * - 數據導入導出
 * - 響應式狀態管理
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <button (click)="addNode()">添加節點</button>
 *     <button (click)="fitView()">適應視圖</button>
 *     <div>節點數量: {{ nodeCount() }}</div>
 *   `
 * })
 * export class FlowControlComponent {
 *   nodeCount = computed(() => this.angularFlow.getNodes().length);
 *   
 *   constructor(private angularFlow: AngularFlowService) {}
 *   
 *   addNode() {
 *     this.angularFlow.addNodes({
 *       id: `node-${Date.now()}`,
 *       type: 'default',
 *       position: { x: 100, y: 100 },
 *       data: { label: '新節點' }
 *     });
 *   }
 *   
 *   fitView() {
 *     this.angularFlow.fitView({ padding: 20 });
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class AngularFlowService implements AngularFlowInstance {
  constructor(private store: FlowStoreService) {}

  // ===================
  // 節點操作
  // ===================
  
  /**
   * 獲取所有節點
   */
  getNodes(): NodeBase[] {
    return this.store.getNodes();
  }

  /**
   * 設置節點
   */
  setNodes(nodes: NodeBase[] | ((nodes: NodeBase[]) => NodeBase[])): void {
    if (typeof nodes === 'function') {
      const currentNodes = this.getNodes();
      this.store.setNodes(nodes(currentNodes));
    } else {
      this.store.setNodes(nodes);
    }
  }

  /**
   * 添加節點
   */
  addNodes(nodes: NodeBase | NodeBase[]): void {
    const nodesToAdd = Array.isArray(nodes) ? nodes : [nodes];
    const currentNodes = this.getNodes();
    this.store.setNodes([...currentNodes, ...nodesToAdd]);
  }

  /**
   * 獲取單個節點
   */
  getNode(id: string): NodeBase | undefined {
    return this.getNodes().find(node => node.id === id);
  }

  /**
   * 獲取內部節點
   */
  getInternalNode(id: string): InternalNode | undefined {
    return this.store.getNodeLookup().get(id);
  }

  /**
   * 更新節點內部資料（包括握把邊界）
   * Equivalent to React Flow's updateNodeInternals
   */
  updateNodeInternals(nodeIds?: string[]): void {
    console.log('🔧 AngularFlowService.updateNodeInternals called', { nodeIds });
    console.log('🔧 This is a placeholder - handle bounds will be populated by XYHandle.isValid when needed');
    
    // Instead of trying to calculate handle bounds here, we'll let XYHandle.isValid fail gracefully
    // and then provide an alternative way to ensure nodes have handle bounds populated
    // This is the approach used by React Flow - handle bounds are calculated on-demand
  }

  /**
   * 更新節點
   */
  updateNode(id: string, nodeUpdate: Partial<NodeBase> | ((node: NodeBase) => Partial<NodeBase>)): void {
    const currentNodes = this.getNodes();
    const nodeIndex = currentNodes.findIndex(node => node.id === id);
    
    if (nodeIndex === -1) return;
    
    const currentNode = currentNodes[nodeIndex];
    const updates = typeof nodeUpdate === 'function' ? nodeUpdate(currentNode) : nodeUpdate;
    
    const updatedNodes = [...currentNodes];
    updatedNodes[nodeIndex] = { ...currentNode, ...updates };
    
    this.store.setNodes(updatedNodes);
  }

  /**
   * 更新節點數據
   */
  updateNodeData(id: string, dataUpdate: any | ((data: any) => any)): void {
    this.updateNode(id, (node) => {
      const newData = typeof dataUpdate === 'function' ? dataUpdate(node.data) : dataUpdate;
      return { data: newData };
    });
  }

  /**
   * 刪除元素
   */
  deleteElements(params: { nodes?: { id: string }[]; edges?: { id: string }[] }): void {
    if (params.nodes) {
      const nodeIdsToDelete = new Set(params.nodes.map(n => n.id));
      const currentNodes = this.getNodes();
      this.store.setNodes(currentNodes.filter(node => !nodeIdsToDelete.has(node.id)));
    }
    
    if (params.edges) {
      const edgeIdsToDelete = new Set(params.edges.map(e => e.id));
      const currentEdges = this.getEdges();
      this.store.setEdges(currentEdges.filter(edge => !edgeIdsToDelete.has(edge.id)));
    }
  }

  // ===================
  // 邊緣操作
  // ===================
  
  /**
   * 獲取所有邊緣
   */
  getEdges(): any[] {
    return this.store.getEdges();
  }

  /**
   * 設置邊緣
   */
  setEdges(edges: any[] | ((edges: any[]) => any[])): void {
    if (typeof edges === 'function') {
      const currentEdges = this.getEdges();
      this.store.setEdges(edges(currentEdges));
    } else {
      this.store.setEdges(edges);
    }
  }

  /**
   * 添加邊緣
   */
  addEdges(edges: any | any[]): void {
    const edgesToAdd = Array.isArray(edges) ? edges : [edges];
    const currentEdges = this.getEdges();
    this.store.setEdges([...currentEdges, ...edgesToAdd]);
  }

  /**
   * 獲取單個邊緣
   */
  getEdge(id: string): any | undefined {
    return this.getEdges().find(edge => edge.id === id);
  }

  /**
   * 更新邊緣
   */
  updateEdge(oldEdge: any, newConnection: Connection): void {
    const currentEdges = this.getEdges();
    const edgeIndex = currentEdges.findIndex(edge => edge.id === oldEdge.id);
    
    if (edgeIndex === -1) return;
    
    const updatedEdges = [...currentEdges];
    updatedEdges[edgeIndex] = {
      ...oldEdge,
      source: newConnection.source,
      target: newConnection.target,
      sourceHandle: newConnection.sourceHandle,
      targetHandle: newConnection.targetHandle,
    };
    
    this.store.setEdges(updatedEdges);
  }

  /**
   * 更新邊緣數據
   */
  updateEdgeData(id: string, dataUpdate: any | ((data: any) => any)): void {
    const currentEdges = this.getEdges();
    const edgeIndex = currentEdges.findIndex(edge => edge.id === id);
    
    if (edgeIndex === -1) return;
    
    const currentEdge = currentEdges[edgeIndex];
    const newData = typeof dataUpdate === 'function' ? dataUpdate(currentEdge.data) : dataUpdate;
    
    const updatedEdges = [...currentEdges];
    updatedEdges[edgeIndex] = { ...currentEdge, data: newData };
    
    this.store.setEdges(updatedEdges);
  }

  // ===================
  // 視窗控制
  // ===================
  
  /**
   * 獲取視窗狀態
   */
  getViewport(): Viewport {
    const [x, y, zoom] = this.store.getTransform();
    return { x, y, zoom };
  }

  /**
   * 設置視窗
   */
  setViewport(viewport: Viewport, options?: { duration?: number }): void {
    this.store.setTransform([viewport.x, viewport.y, viewport.zoom]);
    // 在實際實現中，這裡會處理動畫選項
  }

  /**
   * 放大
   */
  zoomIn(options?: ZoomOptions): void {
    const { zoom } = this.getViewport();
    const state = this.store.getState();
    const newZoom = Math.min(zoom * 1.2, state.maxZoom);
    this.zoomTo(newZoom, options);
  }

  /**
   * 縮小
   */
  zoomOut(options?: ZoomOptions): void {
    const { zoom } = this.getViewport();
    const state = this.store.getState();
    const newZoom = Math.max(zoom / 1.2, state.minZoom);
    this.zoomTo(newZoom, options);
  }

  /**
   * 縮放到指定級別
   */
  zoomTo(zoomLevel: number, options?: ZoomOptions): void {
    const { x, y } = this.getViewport();
    this.setViewport({ x, y, zoom: zoomLevel }, options);
  }

  /**
   * 獲取當前縮放級別
   */
  getZoom(): number {
    return this.getViewport().zoom;
  }

  /**
   * 適應視圖
   */
  fitView(options?: FitViewOptions): void {
    const nodes = this.getNodes();
    const state = this.store.getState();
    
    if (nodes.length === 0) return;
    
    // 計算節點邊界
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      const x = node.position.x;
      const y = node.position.y;
      const width = node.width || 150;
      const height = node.height || 40;
      
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + width);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + height);
    });
    
    const padding = options?.padding || 20;
    const boundingBox = {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + 2 * padding,
      height: maxY - minY + 2 * padding,
    };
    
    this.fitBounds([[boundingBox.x, boundingBox.y], [boundingBox.x + boundingBox.width, boundingBox.y + boundingBox.height]], options);
  }

  /**
   * 設置中心點
   */
  setCenter(x: number, y: number, options?: SetCenterOptions): void {
    const state = this.store.getState();
    const zoom = options?.zoom || this.getZoom();
    const centerX = state.width / 2 - x * zoom;
    const centerY = state.height / 2 - y * zoom;
    
    this.setViewport({ x: centerX, y: centerY, zoom }, { duration: options?.duration });
  }

  /**
   * 適應邊界
   */
  fitBounds(bounds: [[number, number], [number, number]], options?: FitViewOptions): void {
    const state = this.store.getState();
    const [[x1, y1], [x2, y2]] = bounds;
    const padding = options?.padding || 20;
    
    const boundWidth = x2 - x1;
    const boundHeight = y2 - y1;
    
    const scaleX = (state.width - 2 * padding) / boundWidth;
    const scaleY = (state.height - 2 * padding) / boundHeight;
    const zoom = Math.min(scaleX, scaleY);
    
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    
    this.setCenter(centerX, centerY, { zoom, duration: options?.duration });
  }

  /**
   * 投影座標
   */
  project(position: { x: number; y: number }): { x: number; y: number } {
    const { x, y, zoom } = this.getViewport();
    return {
      x: position.x * zoom + x,
      y: position.y * zoom + y,
    };
  }

  /**
   * 螢幕座標轉流程座標
   */
  screenToFlowPosition(position: { x: number; y: number }): { x: number; y: number } {
    const { x, y, zoom } = this.getViewport();
    return {
      x: (position.x - x) / zoom,
      y: (position.y - y) / zoom,
    };
  }

  /**
   * 流程座標轉螢幕座標
   */
  flowToScreenPosition(position: { x: number; y: number }): { x: number; y: number } {
    return this.project(position);
  }

  // ===================
  // 查詢方法
  // ===================
  
  /**
   * 獲取相交的節點
   */
  getIntersectingNodes(
    node: NodeBase | { x: number; y: number; width: number; height: number },
    partially = true,
    nodes?: NodeBase[]
  ): NodeBase[] {
    const targetNodes = nodes || this.getNodes();
    const targetBounds = this.getNodeBounds(node);
    
    return targetNodes.filter(n => {
      if ('id' in node && n.id === node.id) return false;
      
      const nodeBounds = this.getNodeBounds(n);
      return this.isIntersecting(targetBounds, nodeBounds, partially);
    });
  }

  /**
   * 檢查節點是否與區域相交
   */
  isNodeIntersecting(
    node: NodeBase | { x: number; y: number; width: number; height: number },
    area: { x: number; y: number; width: number; height: number },
    partially = true
  ): boolean {
    const nodeBounds = this.getNodeBounds(node);
    return this.isIntersecting(nodeBounds, area, partially);
  }

  /**
   * 獲取節點邊界
   */
  private getNodeBounds(node: NodeBase | { x: number; y: number; width: number; height: number }) {
    if ('position' in node) {
      return {
        x: node.position.x,
        y: node.position.y,
        width: node.width || 150,
        height: node.height || 40,
      };
    }
    return node;
  }

  /**
   * 檢查兩個矩形是否相交
   */
  private isIntersecting(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number },
    partially: boolean
  ): boolean {
    const r1 = {
      left: rect1.x,
      right: rect1.x + rect1.width,
      top: rect1.y,
      bottom: rect1.y + rect1.height,
    };
    
    const r2 = {
      left: rect2.x,
      right: rect2.x + rect2.width,
      top: rect2.y,
      bottom: rect2.y + rect2.height,
    };
    
    if (partially) {
      // 部分相交：任何重疊
      return !(r1.right < r2.left || r2.right < r1.left || r1.bottom < r2.top || r2.bottom < r1.top);
    } else {
      // 完全包含：rect1 完全在 rect2 內
      return r1.left >= r2.left && r1.right <= r2.right && r1.top >= r2.top && r1.bottom <= r2.bottom;
    }
  }

  // ===================
  // 工具方法
  // ===================
  
  /**
   * 導出為對象
   */
  toObject(): { nodes: NodeBase[]; edges: any[]; viewport: Viewport } {
    return {
      nodes: this.getNodes(),
      edges: this.getEdges(),
      viewport: this.getViewport(),
    };
  }

  /**
   * 從對象導入
   */
  fromObject(data: { nodes: NodeBase[]; edges: any[]; viewport?: Viewport }): void {
    this.setNodes(data.nodes);
    this.setEdges(data.edges);
    
    if (data.viewport) {
      this.setViewport(data.viewport);
    }
  }
}

/**
 * Angular 版本的 useReactFlow hook
 * 提供與 React Flow 相同的 API 體驗
 */
export function useAngularFlow(): AngularFlowService {
  // 在組件中使用：const angularFlow = useAngularFlow();
  return new AngularFlowService(new FlowStoreService());
}