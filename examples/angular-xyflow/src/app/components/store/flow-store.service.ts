import { Injectable, computed, signal, effect, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { 
  ReactFlowState, 
  StoreApi, 
  FlowStoreActions, 
  ReactiveStoreApi, 
  StoreMiddleware, 
  StoreEvent, 
  StoreEventListener,
  CreateStoreOptions,
  PerformanceMetric,
  PersistenceConfig,
  Selector
} from './store-types';
import { createInitialState } from './initial-state';
import { NodeBase, InternalNode } from '../components/Nodes/nodes.types';
import { Edge } from '../hooks/edge.service';
import { Connection } from '../components/Handle/handle.types';

/**
 * Enhanced FlowStoreService - 完整的 Angular XYFlow 狀態管理
 * 
 * 這是一個功能完整的狀態管理服務，等價於 React Flow 的 Zustand store
 * 使用 Angular Signals 提供響應式狀態管理，並支持中間件、持久化等高級功能
 * 
 * 主要特性：
 * - 基於 Angular Signals 的響應式狀態管理
 * - 完整的 React Flow API 兼容性
 * - 中間件系統支持
 * - 狀態持久化
 * - 性能監控
 * - 調試工具支持
 * - 事件系統
 * 
 * @example
 * ```typescript
 * @Component({
 *   providers: [FlowStoreService]
 * })
 * export class FlowComponent {
 *   constructor(private store: FlowStoreService) {
 *     // 配置 store
 *     this.store.configure({
 *       debug: true,
 *       enableMiddleware: true
 *     });
 *     
 *     // 添加中間件
 *     this.store.addMiddleware({
 *       name: 'logger',
 *       afterStateChange: (newState, prevState) => {
 *         console.log('State changed:', { newState, prevState });
 *       }
 *     });
 *     
 *     // 監聽狀態變化
 *     effect(() => {
 *       const nodes = this.store.getNodes();
 *       console.log('Nodes updated:', nodes.length);
 *     });
 *   }
 * }
 * ```
 */
@Injectable()
export class FlowStoreService implements ReactiveStoreApi, FlowStoreActions {
  private destroyRef = inject(DestroyRef);
  
  /** 主要狀態信號 */
  private stateSignal = signal<ReactFlowState>(createInitialState());
  
  /** 上一個狀態（用於比較） */
  private previousState: ReactFlowState = createInitialState();
  
  /** 中間件列表 */
  private middleware: StoreMiddleware[] = [];
  
  /** 事件監聽器 */
  private eventListeners: StoreEventListener[] = [];
  
  /** 訂閱者列表 */
  private subscribers: Array<(state: ReactFlowState) => void> = [];
  
  /** 性能指標 */
  private metrics: PerformanceMetric[] = [];
  
  /** 狀態歷史（調試用） */
  private stateHistory: ReactFlowState[] = [];
  
  /** 配置選項 */
  private options: CreateStoreOptions = {
    enableMiddleware: true,
    enableDevtools: false,
    enablePersistence: false,
    debug: false,
  };
  
  /** 持久化配置 */
  private persistenceConfig?: PersistenceConfig;
  
  /** 響應式狀態 */
  state$ = computed(() => this.stateSignal());

  constructor() {
    // 設置狀態變化監聽
    effect(() => {
      const currentState = this.state$();
      this.handleStateChange(currentState);
    }, { allowSignalWrites: true });
  }

  // ===================
  // 核心 Store API
  // ===================

  /**
   * 獲取當前狀態
   */
  getState(): ReactFlowState {
    return this.stateSignal();
  }

  /**
   * 獲取狀態信號
   */
  getStateSignal() {
    return this.state$;
  }

  /**
   * 設置狀態
   */
  setState(partial: Partial<ReactFlowState>): void {
    const currentState = this.getState();
    let nextState = { ...currentState, ...partial };
    
    // 應用中間件（beforeStateChange）
    if (this.options.enableMiddleware) {
      for (const middleware of this.middleware) {
        if (middleware.beforeStateChange) {
          const middlewareResult = middleware.beforeStateChange(partial, currentState);
          nextState = { ...currentState, ...middlewareResult };
        }
      }
    }
    
    // 更新狀態
    this.stateSignal.set(nextState);
  }

  /**
   * 訂閱狀態變化
   */
  subscribe(listener: (state: ReactFlowState) => void): () => void {
    this.subscribers.push(listener);
    
    // 返回取消訂閱函數
    return () => {
      const index = this.subscribers.indexOf(listener);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * 選擇狀態片段
   */
  selectSignal<T>(selector: Selector<T>) {
    return computed(() => selector(this.state$()));
  }

  // ===================
  // 配置和中間件
  // ===================

  /**
   * 配置 store
   */
  configure(options: Partial<CreateStoreOptions>): void {
    this.options = { ...this.options, ...options };
    
    if (options.initialState) {
      this.setState(options.initialState);
    }
    
    if (options.middleware) {
      options.middleware.forEach(middleware => this.addMiddleware(middleware));
    }
    
    if (options.persistence) {
      this.persistenceConfig = options.persistence;
      this.restore();
    }
  }

  /**
   * 添加中間件
   */
  addMiddleware(middleware: StoreMiddleware): void {
    this.middleware.push(middleware);
  }

  /**
   * 移除中間件
   */
  removeMiddleware(middlewareName: string): void {
    this.middleware = this.middleware.filter(m => m.name !== middlewareName);
  }

  // ===================
  // 事件系統
  // ===================

  /**
   * 添加事件監聽器
   */
  addEventListener(listener: StoreEventListener): () => void {
    this.eventListeners.push(listener);
    
    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * 移除事件監聽器
   */
  removeEventListener(listener: StoreEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * 派發事件
   */
  private dispatchEvent(event: StoreEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }

  /**
   * 派發動作事件
   */
  private dispatchAction(actionName: string, payload?: any): void {
    // 記錄性能指標
    const start = performance.now();
    
    // 通知中間件
    if (this.options.enableMiddleware) {
      const currentState = this.getState();
      this.middleware.forEach(middleware => {
        if (middleware.onAction) {
          middleware.onAction(actionName, payload, currentState);
        }
      });
    }
    
    // 派發事件
    this.dispatchEvent({
      type: 'action-dispatched',
      payload: { action: actionName, payload }
    });
    
    // 記錄性能
    const duration = performance.now() - start;
    this.recordMetric({
      name: `action-${actionName}`,
      duration,
      timestamp: Date.now(),
      metadata: { payload }
    });
  }

  // ===================
  // 狀態變化處理
  // ===================

  /**
   * 處理狀態變化
   */
  private handleStateChange(newState: ReactFlowState): void {
    const previousState = this.previousState;
    
    // 應用中間件（afterStateChange）
    if (this.options.enableMiddleware) {
      this.middleware.forEach(middleware => {
        if (middleware.afterStateChange) {
          try {
            middleware.afterStateChange(newState, previousState);
          } catch (error) {
            this.dispatchEvent({
              type: 'middleware-error',
              payload: { error: error as Error, middleware: middleware.name }
            });
          }
        }
      });
    }
    
    // 通知訂閱者
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(newState);
      } catch (error) {
        console.error('Subscriber error:', error);
      }
    });
    
    // 派發狀態變化事件
    this.dispatchEvent({
      type: 'state-changed',
      payload: { newState, previousState }
    });
    
    // 更新歷史
    if (this.options.debug) {
      this.stateHistory.push({ ...newState });
      if (this.stateHistory.length > 100) {
        this.stateHistory.shift();
      }
    }
    
    // 持久化
    if (this.persistenceConfig) {
      this.persistState(newState);
    }
    
    // 更新上一個狀態
    this.previousState = { ...newState };
  }

  // ===================
  // 節點操作
  // ===================

  /**
   * 獲取所有節點
   */
  getNodes(): NodeBase[] {
    return this.getState().nodes;
  }

  /**
   * 設置節點
   */
  setNodes(nodes: NodeBase[]): void {
    this.dispatchAction('setNodes', nodes);
    
    const updatedLookup = new Map<string, InternalNode>();
    nodes.forEach(node => {
      updatedLookup.set(node.id, this.createInternalNode(node));
    });
    
    this.setState({
      nodes,
      nodeLookup: updatedLookup
    });
  }

  /**
   * 添加節點
   */
  addNode(node: NodeBase): void {
    this.dispatchAction('addNode', node);
    
    const currentNodes = this.getNodes();
    this.setNodes([...currentNodes, node]);
  }

  /**
   * 更新節點
   */
  updateNode(nodeId: string, updates: Partial<NodeBase>): void {
    this.dispatchAction('updateNode', { nodeId, updates });
    
    const currentNodes = this.getNodes();
    const updatedNodes = currentNodes.map(node =>
      node.id === nodeId ? { ...node, ...updates } : node
    );
    
    this.setNodes(updatedNodes);
  }

  /**
   * 更新節點數據
   */
  updateNodeData(nodeId: string, data: any): void {
    this.updateNode(nodeId, { data });
  }


  /**
   * 移除節點
   */
  removeNode(nodeId: string): void {
    this.dispatchAction('removeNode', nodeId);
    
    const currentNodes = this.getNodes();
    const filteredNodes = currentNodes.filter(node => node.id !== nodeId);
    this.setNodes(filteredNodes);
  }

  // ===================
  // 邊緣操作
  // ===================

  /**
   * 獲取所有邊緣
   */
  getEdges(): Edge[] {
    return this.getState().edges;
  }

  /**
   * 設置邊緣
   */
  setEdges(edges: Edge[]): void {
    this.dispatchAction('setEdges', edges);
    
    const updatedLookup = new Map<string, Edge>();
    edges.forEach(edge => {
      updatedLookup.set(edge.id, edge);
    });
    
    this.setState({
      edges,
      edgeLookup: updatedLookup,
      hasDefaultEdges: true  // Enable default edges management when edges are set
    });
  }

  /**
   * 添加邊緣
   */
  addEdge(edge: Edge): void {
    this.dispatchAction('addEdge', edge);
    
    const currentEdges = this.getEdges();
    this.setEdges([...currentEdges, edge]);
  }

  /**
   * 更新邊緣
   */
  updateEdge(edgeId: string, updates: Partial<Edge>): void {
    this.dispatchAction('updateEdge', { edgeId, updates });
    
    const currentEdges = this.getEdges();
    const updatedEdges = currentEdges.map(edge =>
      edge.id === edgeId ? { ...edge, ...updates } : edge
    );
    
    this.setEdges(updatedEdges);
  }

  /**
   * 更新邊緣數據
   */
  updateEdgeData(edgeId: string, data: any): void {
    this.updateEdge(edgeId, { data });
  }

  /**
   * 移除邊緣
   */
  removeEdge(edgeId: string): void {
    this.dispatchAction('removeEdge', edgeId);
    
    const currentEdges = this.getEdges();
    const filteredEdges = currentEdges.filter(edge => edge.id !== edgeId);
    this.setEdges(filteredEdges);
  }

  // ===================
  // 視窗操作
  // ===================

  /**
   * 獲取變換矩陣
   */
  getTransform() {
    return computed(() => this.state$().transform);
  }

  /**
   * 設置視窗
   */
  setViewport(viewport: { x: number; y: number; zoom: number }): void {
    this.dispatchAction('setViewport', viewport);
    
    this.setState({
      x: viewport.x,
      y: viewport.y,
      zoom: viewport.zoom,
      transform: [viewport.x, viewport.y, viewport.zoom]
    });
  }

  /**
   * 設置變換矩陣
   */
  setTransform(transform: [number, number, number]): void {
    this.dispatchAction('setTransform', transform);
    
    this.setState({
      transform,
      x: transform[0],
      y: transform[1],
      zoom: transform[2]
    });
  }

  /**
   * 平移
   */
  panBy(delta: { x: number; y: number }): void {
    this.dispatchAction('panBy', delta);
    
    const [x, y, zoom] = this.getState().transform;
    this.setTransform([x + delta.x, y + delta.y, zoom]);
  }

  /**
   * 設置中心點
   */
  setCenter(x: number, y: number, options?: { zoom?: number }): void {
    this.dispatchAction('setCenter', { x, y, options });
    
    const state = this.getState();
    const zoom = options?.zoom || state.zoom;
    const centerX = state.width / 2 - x * zoom;
    const centerY = state.height / 2 - y * zoom;
    
    this.setTransform([centerX, centerY, zoom]);
  }

  /**
   * 縮放
   */
  zoomIn(options?: any): void {
    this.dispatchAction('zoomIn', options);
    
    const state = this.getState();
    const newZoom = Math.min(state.zoom * 1.2, state.maxZoom);
    this.setViewport({ x: state.x, y: state.y, zoom: newZoom });
  }

  /**
   * 縮小
   */
  zoomOut(options?: any): void {
    this.dispatchAction('zoomOut', options);
    
    const state = this.getState();
    const newZoom = Math.max(state.zoom / 1.2, state.minZoom);
    this.setViewport({ x: state.x, y: state.y, zoom: newZoom });
  }

  /**
   * 縮放到指定級別
   */
  zoomTo(zoom: number, options?: any): void {
    this.dispatchAction('zoomTo', { zoom, options });
    
    const state = this.getState();
    const clampedZoom = Math.max(state.minZoom, Math.min(state.maxZoom, zoom));
    this.setViewport({ x: state.x, y: state.y, zoom: clampedZoom });
  }

  /**
   * 適應視圖
   */
  fitView(options?: any): Promise<boolean> {
    this.dispatchAction('fitView', options);
    
    return new Promise((resolve) => {
      const state = this.getState();
      
      // 如果已經有正在進行的 fitView，解決之前的 Promise
      if (state.fitViewResolver) {
        state.fitViewResolver(false);
      }
      
      // 設置新的 resolver
      this.setState({
        fitViewQueued: true,
        fitViewResolver: resolve
      });
      
      // 模擬 fitView 邏輯
      setTimeout(() => {
        this.setState({
          fitViewQueued: false,
          fitViewResolver: null
        });
        resolve(true);
      }, 16); // 下一個動畫幀
    });
  }

  // ===================
  // 選擇操作
  // ===================

  /**
   * 獲取選中的節點 ID
   */
  getSelectedNodes(): string[] {
    return Array.from(this.getState().selectedNodes);
  }

  /**
   * 獲取選中的邊緣 ID
   */
  getSelectedEdges(): string[] {
    return Array.from(this.getState().selectedEdges);
  }

  /**
   * 選擇節點
   */
  selectNodes(nodeIds: string[]): void {
    this.dispatchAction('selectNodes', nodeIds);
    
    this.setState({
      selectedNodes: new Set(nodeIds)
    });
  }

  /**
   * 選擇邊緣
   */
  selectEdges(edgeIds: string[]): void {
    this.dispatchAction('selectEdges', edgeIds);
    
    this.setState({
      selectedEdges: new Set(edgeIds)
    });
  }

  /**
   * 添加選中節點
   */
  addSelectedNodes(nodeIds: string[]): void {
    this.dispatchAction('addSelectedNodes', nodeIds);
    
    const currentSelected = this.getState().selectedNodes;
    const newSelected = new Set([...currentSelected, ...nodeIds]);
    
    this.setState({
      selectedNodes: newSelected
    });
  }

  /**
   * 添加選中邊緣
   */
  addSelectedEdges(edgeIds: string[]): void {
    this.dispatchAction('addSelectedEdges', edgeIds);
    
    const currentSelected = this.getState().selectedEdges;
    const newSelected = new Set([...currentSelected, ...edgeIds]);
    
    this.setState({
      selectedEdges: newSelected
    });
  }

  /**
   * 取消選擇
   */
  unselectNodesAndEdges(params: { nodes?: any[]; edges?: any[] }): void {
    this.dispatchAction('unselectNodesAndEdges', params);
    
    const state = this.getState();
    let newSelectedNodes = new Set(state.selectedNodes);
    let newSelectedEdges = new Set(state.selectedEdges);
    
    if (params.nodes) {
      params.nodes.forEach(node => newSelectedNodes.delete(node.id));
    }
    
    if (params.edges) {
      params.edges.forEach(edge => newSelectedEdges.delete(edge.id));
    }
    
    this.setState({
      selectedNodes: newSelectedNodes,
      selectedEdges: newSelectedEdges
    });
  }

  /**
   * 清除選擇
   */
  clearSelection(): void {
    this.dispatchAction('clearSelection');
    
    this.setState({
      selectedNodes: new Set(),
      selectedEdges: new Set()
    });
  }

  // ===================
  // 連接操作
  // ===================

  /**
   * 獲取連接狀態
   */
  getConnection() {
    return computed(() => this.state$().connection);
  }

  /**
   * 開始連接
   */
  startConnection(fromHandle: any): void {
    this.dispatchAction('startConnection', fromHandle);
    
    // 這裡需要實現完整的ConnectionInProgress
    // 目前只是一個占位實現
  }

  /**
   * 結束連接
   */
  endConnection(): void {
    this.dispatchAction('endConnection');
    
    this.setState({
      connection: {
        inProgress: false,
        isValid: null,
        from: null,
        fromHandle: null,
        fromPosition: null,
        fromNode: null,
        to: null,
        toHandle: null,
        toPosition: null,
        toNode: null
      }
    });
  }

  /**
   * 更新連接狀態
   */
  updateConnection(connection: import('./store-types').ConnectionState): void {
    this.dispatchAction('updateConnection', connection);
    
    this.setState({
      connection
    });
  }

  /**
   * 取消連接
   */
  cancelConnection(): void {
    this.dispatchAction('cancelConnection');
    this.endConnection();
  }

  // ===================
  // 變化觸發
  // ===================

  /**
   * 觸發節點變化
   */
  triggerNodeChanges(changes: any[]): void {
    this.dispatchAction('triggerNodeChanges', changes);
    
    const state = this.getState();
    
    if (state.hasDefaultNodes && changes.length > 0) {
      // 應用變化到節點
      const updatedNodes = this.applyNodeChanges(changes, state.nodes);
      this.setNodes(updatedNodes);
    }
    
    // 調用回調
    if (state.onNodesChange) {
      state.onNodesChange(changes);
    }
  }

  /**
   * 觸發邊緣變化
   */
  triggerEdgeChanges(changes: any[]): void {
    this.dispatchAction('triggerEdgeChanges', changes);
    
    const state = this.getState();
    
    if (state.hasDefaultEdges && changes.length > 0) {
      // 應用變化到邊緣
      const updatedEdges = this.applyEdgeChanges(changes, state.edges);
      this.setEdges(updatedEdges);
    }
    
    // 調用回調
    if (state.onEdgesChange) {
      state.onEdgesChange(changes);
    }
  }

  // ===================
  // 工具方法
  // ===================

  /**
   * 獲取節點查找表
   */
  getNodeLookup() {
    return computed(() => this.state$().nodeLookup);
  }

  /**
   * 獲取邊緣查找表
   */
  getEdgeLookup() {
    return computed(() => this.state$().edgeLookup);
  }

  /**
   * 創建內部節點
   */
  private createInternalNode(node: NodeBase): InternalNode {
    return {
      ...node,
      measured: {
        width: node.width,
        height: node.height,
      },
      internals: {
        positionAbsolute: node.position,
        z: node.zIndex || 0,
        handleBounds: {
          source: [],
          target: [],
        },
      },
    };
  }

  /**
   * 計算節點的握把邊界
   * 基於 React Flow 的 getHandleBounds 實現
   */
  private getHandleBounds(
    type: 'source' | 'target',
    nodeElement: HTMLElement,
    nodeBounds: DOMRect,
    zoom: number,
    nodeId: string
  ): any[] {
    // 找出節點內所有指定類型的 handle 元素
    const handles = nodeElement.querySelectorAll(`.${type}`);

    if (!handles || !handles.length) {
      return [];
    }

    return Array.from(handles).map((handle: Element): any => {
      const handleElement = handle as HTMLElement;
      const handleBounds = handleElement.getBoundingClientRect();

      return {
        id: handleElement.getAttribute('data-handleid'),
        type,
        nodeId,
        position: handleElement.getAttribute('data-handlepos'),
        x: (handleBounds.left - nodeBounds.left) / zoom,
        y: (handleBounds.top - nodeBounds.top) / zoom,
        width: handleBounds.width / zoom,
        height: handleBounds.height / zoom,
      };
    });
  }

  /**
   * 更新節點內部資料（包括握把邊界）
   * 基於 React Flow 的 updateNodeInternals 實現
   */
  updateNodeInternals(nodeIds?: string[]): void {
    console.log('🔧 updateNodeInternals called', { nodeIds });
    this.dispatchAction('updateNodeInternals', nodeIds);
    
    const state = this.getState();
    console.log('🔧 Current state:', { 
      hasDomNode: !!state.domNode, 
      nodeLookupSize: state.nodeLookup.size,
      transform: state.transform
    });
    
    const { domNode, transform } = state;
    
    if (!domNode) {
      console.log('❌ No domNode available for updateNodeInternals');
      return;
    }

    const zoom = transform[2]; // Transform is [x, y, zoom]
    const targetIds = nodeIds || Array.from(state.nodeLookup.keys());
    let hasChanges = false;

    console.log('Processing nodes for internals update:', targetIds);

    targetIds.forEach(nodeId => {
      const node = state.nodeLookup.get(nodeId);
      if (!node) {
        console.log(`Node ${nodeId} not found in nodeLookup`);
        return;
      }

      // 找到對應的 DOM 節點
      const nodeElement = domNode.querySelector(`[data-id="${nodeId}"]`) as HTMLElement;
      if (!nodeElement) {
        console.log(`DOM element not found for node ${nodeId}`);
        return;
      }

      const nodeBounds = nodeElement.getBoundingClientRect();
      
      // 計算握把邊界
      const sourceHandles = this.getHandleBounds('source', nodeElement, nodeBounds, zoom, nodeId);
      const targetHandles = this.getHandleBounds('target', nodeElement, nodeBounds, zoom, nodeId);
      
      console.log(`Node ${nodeId} handle bounds:`, {
        sourceHandles: sourceHandles.length,
        targetHandles: targetHandles.length,
        sourceDetails: sourceHandles,
        targetDetails: targetHandles
      });

      // 更新節點的 handleBounds
      if (sourceHandles.length > 0 || targetHandles.length > 0) {
        node.internals.handleBounds = {
          source: sourceHandles.length > 0 ? sourceHandles : undefined,
          target: targetHandles.length > 0 ? targetHandles : undefined,
        };
        hasChanges = true;
        console.log(`Updated handleBounds for node ${nodeId}:`, node.internals.handleBounds);
      }
    });

    if (hasChanges) {
      // 觸發狀態更新
      this.setState({ nodeLookup: new Map(state.nodeLookup) });
      console.log('Node internals updated successfully');
    }
  }

  /**
   * 計算絕對位置
   */
  private calculateAbsolutePosition(node: InternalNode): { x: number; y: number } {
    // 簡化實現，實際應該考慮父節點等因素
    return node.position;
  }

  /**
   * 計算 Handle 邊界
   */
  private calculateHandleBounds(node: InternalNode): { source: any[]; target: any[] } {
    // 簡化實現
    return {
      source: [],
      target: [],
    };
  }

  /**
   * 應用節點變化
   */
  private applyNodeChanges(changes: any[], nodes: NodeBase[]): NodeBase[] {
    // 簡化實現
    return nodes;
  }

  /**
   * 應用邊緣變化
   */
  private applyEdgeChanges(changes: any[], edges: Edge[]): Edge[] {
    // 簡化實現
    return edges;
  }

  // ===================
  // 性能監控
  // ===================

  /**
   * 記錄性能指標
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // 限制指標數量
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
    
    // 派發性能事件
    this.dispatchEvent({
      type: 'performance-metric',
      payload: metric
    });
  }

  /**
   * 獲取性能指標
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * 清除性能指標
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  // ===================
  // 調試工具
  // ===================

  /**
   * 獲取狀態歷史
   */
  getHistory(): ReactFlowState[] {
    return [...this.stateHistory];
  }

  /**
   * 清除狀態歷史
   */
  clearHistory(): void {
    this.stateHistory = [];
  }

  // ===================
  // 持久化
  // ===================

  /**
   * 配置持久化
   */
  persist(config: PersistenceConfig): void {
    this.persistenceConfig = config;
    this.restore();
  }

  /**
   * 保存狀態
   */
  private persistState(state: ReactFlowState): void {
    if (!this.persistenceConfig) return;
    
    try {
      const config = this.persistenceConfig;
      let dataToSave: Partial<ReactFlowState> = state;
      
      // 應用包含/排除過濾器
      if (config.include) {
        dataToSave = config.include.reduce((acc, key) => {
          acc[key] = state[key];
          return acc;
        }, {} as Partial<ReactFlowState>);
      }
      
      if (config.exclude) {
        dataToSave = { ...state };
        config.exclude.forEach(key => {
          delete dataToSave[key];
        });
      }
      
      // 序列化
      const serialized = config.serialize ? 
        config.serialize(state) : 
        JSON.stringify(dataToSave);
      
      // 保存到存儲
      config.storage.setItem(config.key, serialized);
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }

  /**
   * 恢復狀態
   */
  async restore(): Promise<void> {
    if (!this.persistenceConfig) return;
    
    try {
      const config = this.persistenceConfig;
      const serialized = config.storage.getItem(config.key);
      
      if (serialized) {
        const data = config.deserialize ? 
          config.deserialize(serialized) : 
          JSON.parse(serialized);
        
        this.setState(data);
      }
    } catch (error) {
      console.error('Failed to restore state:', error);
    }
  }

  // ===================
  // 重置和清理
  // ===================

  /**
   * 重置 store
   */
  reset(): void {
    this.dispatchAction('reset');
    
    const initialState = createInitialState();
    this.stateSignal.set(initialState);
    this.previousState = initialState;
    this.clearMetrics();
    this.clearHistory();
  }

  /**
   * 銷毀 store
   */
  /**
   * 更新連接預覽
   */
  updateConnectionPreview(position: { x: number; y: number }): void {
    this.dispatchAction('updateConnectionPreview', position);
    // Implementation would update the connection preview position
  }

  /**
   * 更新查找表
   */
  updateLookupTables(): void {
    this.dispatchAction('updateLookupTables');
    const state = this.getState();
    
    console.log('🔄 updateLookupTables called:', {
      nodesCount: state.nodes?.length || 0,
      edgesCount: state.edges?.length || 0,
      nodes: state.nodes
    });
    
    // Update node lookup
    state.nodeLookup.clear();
    if (state.nodes && state.nodes.length > 0) {
      state.nodes.forEach(node => {
        console.log('📝 Adding node to lookup:', node.id, node);
        state.nodeLookup.set(node.id, node as any);
      });
    } else {
      console.log('⚠️ No nodes to add to lookup table');
    }
    
    // Update edge lookup
    state.edgeLookup.clear();
    if (state.edges && state.edges.length > 0) {
      state.edges.forEach(edge => {
        state.edgeLookup.set(edge.id, edge as any);
      });
    }
    
    console.log('✅ Lookup tables updated:', {
      nodeLookupSize: state.nodeLookup.size,
      edgeLookupSize: state.edgeLookup.size
    });
  }

  destroy(): void {
    this.dispatchAction('destroy');
    
    // 清理所有資源
    this.subscribers = [];
    this.eventListeners = [];
    this.middleware = [];
    this.clearMetrics();
    this.clearHistory();
  }
}