import { Injectable, signal, computed, effect, Signal } from '@angular/core';
import { NodeBase, InternalNode, NodeChange } from '../components/Nodes/nodes.types';
import { Connection, HandleType, ConnectionMode } from '../components/Handle/handle.types';
import { UserSelectionRect } from '../components/UserSelection/user-selection.types';

/**
 * 變換矩陣類型 [x, y, zoom]
 */
export type Transform = [number, number, number];

/**
 * 連接狀態
 */
export interface ConnectionState {
  inProgress: boolean;
  fromHandle?: {
    nodeId: string;
    id: string | null;
    type: HandleType;
    position?: any;
  } | null;
  toHandle?: {
    nodeId: string;
    id: string | null;
    type: HandleType;
    position?: any;
  } | null;
  isValid: boolean;
}

/**
 * 完整的 Flow 狀態接口
 */
export interface FlowState {
  // 節點和邊緣狀態
  nodes: NodeBase[];
  edges: any[];
  nodeLookup: Map<string, InternalNode>;
  edgeLookup: Map<string, any>;
  parentLookup: Map<string, Set<string>>;
  
  // 視口和變換狀態
  transform: Transform;
  width: number;
  height: number;
  minZoom: number;
  maxZoom: number;
  panZoom: any;
  
  // 交互狀態
  isDragging: boolean;
  paneDragging: boolean;
  preventScrolling: boolean;
  nodesSelectionActive: boolean;
  userSelectionActive: boolean;
  userSelectionRect: UserSelectionRect | null;
  multiSelectionActive: boolean;
  
  // 連接狀態
  connectionMode: ConnectionMode;
  connection: ConnectionState;
  connectionClickStartHandle: {
    nodeId: string;
    type: HandleType;
    id: string | null;
  } | null;
  connectionRadius: number;
  connectionDragThreshold: number;
  
  // 選擇狀態
  selectedNodes: Set<string>;
  selectedEdges: Set<string>;
  
  // 配置選項
  nodesDraggable: boolean;
  nodesConnectable: boolean;
  nodesFocusable: boolean;
  edgesFocusable: boolean;
  edgesReconnectable: boolean;
  elementsSelectable: boolean;
  selectNodesOnDrag: boolean;
  elevateNodesOnSelect: boolean;
  elevateEdgesOnSelect: boolean;
  autoPanOnConnect: boolean;
  autoPanOnNodeFocus: boolean;
  autoPanSpeed: number;
  fitViewQueued: boolean;
  
  // 默認選項
  defaultEdgeOptions?: any;
  hasDefaultNodes: boolean;
  hasDefaultEdges: boolean;
  
  // DOM 相關
  domNode: Element | null;
  rfId: string;
  noPanClassName?: string;
  
  // 回調函數
  onNodesChange?: (changes: NodeChange[]) => void;
  onEdgesChange?: (changes: any[]) => void;
  onConnect?: (connection: Connection) => void;
  onConnectStart?: (event: any, params: any) => void;
  onConnectEnd?: (event: any, connectionState: any) => void;
  onClickConnectStart?: (event: any, params: any) => void;
  onClickConnectEnd?: (event: any, connectionState: any) => void;
  onError?: (code: string, message: string) => void;
  onSelectionChangeHandlers: Array<(params: any) => void>;
  
  // 操作方法
  panBy: (delta: { x: number; y: number }) => void;
  setCenter: (x: number, y: number, options?: any) => void;
  fitView: (options?: any) => void;
  updateConnection: (connection: Partial<ConnectionState>) => void;
  cancelConnection: () => void;
  addSelectedNodes: (nodeIds: string[]) => void;
  addSelectedEdges: (edgeIds: string[]) => void;
  unselectNodesAndEdges: (params: { nodes?: any[]; edges?: any[] }) => void;
  setNodes: (nodes: NodeBase[]) => void;
  setEdges: (edges: any[]) => void;
  
  // 其他狀態
  ariaLiveMessage: string;
  ariaLabelConfig: Record<string, any>;
  lib: string;
  isValidConnection?: (connection: Connection) => boolean;
  nodeDragThreshold: number;
  nodeClickDistance: number;
  connectOnClick: boolean;
}

/**
 * FlowStoreService - Angular equivalent of React Flow's StoreContext
 * 
 * Flow 狀態管理服務 - 管理整個 Flow 的全局狀態
 * 這是 Angular XYFlow 的核心服務，提供完整的狀態管理功能
 * 
 * 主要功能：
 * - 管理節點和邊緣的狀態
 * - 處理視口和變換
 * - 管理交互狀態（拖拽、選擇、連接）
 * - 提供配置選項
 * - 處理事件回調
 * - 提供操作方法
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `...`
 * })
 * export class FlowComponent {
 *   constructor(private flowStore: FlowStoreService) {
 *     // 獲取節點
 *     const nodes = this.flowStore.getNodes();
 *     
 *     // 監聽狀態變化
 *     effect(() => {
 *       const selectedNodes = this.flowStore.getSelectedNodes();
 *       console.log('Selected nodes:', selectedNodes);
 *     });
 *     
 *     // 更新節點
 *     this.flowStore.updateNode('node-1', { position: { x: 100, y: 100 } });
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class FlowStoreService {
  /** 主要狀態信號 */
  private stateSignal = signal<FlowState>(this.createInitialState());
  
  /** 狀態計算屬性 */
  state$ = computed(() => this.stateSignal());

  constructor() {
    // 設置一些默認的操作方法
    this.setupDefaultMethods();
  }

  /**
   * 創建初始狀態
   */
  private createInitialState(): FlowState {
    return {
      // 節點和邊緣狀態
      nodes: [],
      edges: [],
      nodeLookup: new Map(),
      edgeLookup: new Map(),
      parentLookup: new Map(),
      
      // 視口和變換狀態
      transform: [0, 0, 1],
      width: 1000,
      height: 600,
      minZoom: 0.5,
      maxZoom: 2,
      panZoom: null,
      
      // 交互狀態
      isDragging: false,
      paneDragging: false,
      preventScrolling: false,
      nodesSelectionActive: false,
      userSelectionActive: false,
      userSelectionRect: null,
      multiSelectionActive: false,
      
      // 連接狀態
      connectionMode: ConnectionMode.Strict,
      connection: {
        inProgress: false,
        fromHandle: null,
        toHandle: null,
        isValid: false,
      },
      connectionClickStartHandle: null,
      connectionRadius: 20,
      connectionDragThreshold: 1,
      
      // 選擇狀態
      selectedNodes: new Set(),
      selectedEdges: new Set(),
      
      // 配置選項
      nodesDraggable: true,
      nodesConnectable: true,
      nodesFocusable: true,
      edgesFocusable: true,
      edgesReconnectable: true,
      elementsSelectable: true,
      selectNodesOnDrag: true,
      elevateNodesOnSelect: true,
      elevateEdgesOnSelect: false,
      autoPanOnConnect: true,
      autoPanOnNodeFocus: true,
      autoPanSpeed: 15,
      fitViewQueued: false,
      
      // 默認選項
      defaultEdgeOptions: undefined,
      hasDefaultNodes: false,
      hasDefaultEdges: false,
      
      // DOM 相關
      domNode: null,
      rfId: 'flow-1',
      noPanClassName: 'nopan',
      
      // 回調函數
      onNodesChange: undefined,
      onEdgesChange: undefined,
      onConnect: undefined,
      onConnectStart: undefined,
      onConnectEnd: undefined,
      onClickConnectStart: undefined,
      onClickConnectEnd: undefined,
      onError: undefined,
      onSelectionChangeHandlers: [],
      
      // 操作方法（在 setupDefaultMethods 中設置）
      panBy: () => {},
      setCenter: () => {},
      fitView: () => {},
      updateConnection: () => {},
      cancelConnection: () => {},
      addSelectedNodes: () => {},
      addSelectedEdges: () => {},
      unselectNodesAndEdges: () => {},
      setNodes: () => {},
      setEdges: () => {},
      
      // 其他狀態
      ariaLiveMessage: '',
      ariaLabelConfig: {
        'node.a11yDescription.ariaLiveMessage': (params: any) => 
          `Node moved to position ${params.x}, ${params.y}`,
      },
      lib: 'angular',
      isValidConnection: undefined,
      nodeDragThreshold: 1,
      nodeClickDistance: 2,
      connectOnClick: false,
    };
  }

  /**
   * 設置默認操作方法
   */
  private setupDefaultMethods() {
    const methods = {
      panBy: (delta: { x: number; y: number }) => {
        this.panBy(delta);
      },
      setCenter: (x: number, y: number, options?: any) => {
        this.setCenter(x, y, options);
      },
      fitView: (options?: any) => {
        this.fitView(options);
      },
      updateConnection: (connection: Partial<ConnectionState>) => {
        this.updateConnection(connection);
      },
      cancelConnection: () => {
        this.cancelConnection();
      },
      addSelectedNodes: (nodeIds: string[]) => {
        this.addSelectedNodes(nodeIds);
      },
      addSelectedEdges: (edgeIds: string[]) => {
        this.addSelectedEdges(edgeIds);
      },
      unselectNodesAndEdges: (params: { nodes?: any[]; edges?: any[] }) => {
        this.unselectNodesAndEdges(params);
      },
      setNodes: (nodes: NodeBase[]) => {
        this.setNodes(nodes);
      },
      setEdges: (edges: any[]) => {
        this.setEdges(edges);
      },
    };

    this.updateState(methods);
  }

  /**
   * 獲取當前狀態
   */
  getState(): FlowState {
    return this.stateSignal();
  }

  /**
   * 更新狀態
   */
  updateState(partial: Partial<FlowState>) {
    this.stateSignal.update(current => {
      const newState = { ...current, ...partial };
      
      // 更新查找表
      if (partial.nodes) {
        newState.nodeLookup = new Map(
          partial.nodes.map(node => [
            node.id,
            this.createInternalNode(node)
          ])
        );
      }
      
      if (partial.edges) {
        newState.edgeLookup = new Map(
          partial.edges.map(edge => [edge.id, edge])
        );
      }
      
      return newState;
    });
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

  // 便捷的狀態訪問方法
  getNodes = computed(() => this.state$().nodes);
  getEdges = computed(() => this.state$().edges);
  getNodeLookup = computed(() => this.state$().nodeLookup);
  getEdgeLookup = computed(() => this.state$().edgeLookup);
  getTransform = computed(() => this.state$().transform);
  getSelectedNodes = computed(() => Array.from(this.state$().selectedNodes));
  getSelectedEdges = computed(() => Array.from(this.state$().selectedEdges));
  getConnection = computed(() => this.state$().connection);
  
  // 操作方法
  
  /**
   * 設置節點
   */
  setNodes(nodes: NodeBase[]) {
    this.updateState({ nodes });
  }

  /**
   * 添加節點
   */
  addNode(node: NodeBase) {
    const currentNodes = this.getNodes();
    this.setNodes([...currentNodes, node]);
  }

  /**
   * 更新節點
   */
  updateNode(nodeId: string, updates: Partial<NodeBase>) {
    const currentNodes = this.getNodes();
    this.setNodes(
      currentNodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    );
  }

  /**
   * 移除節點
   */
  removeNode(nodeId: string) {
    const currentNodes = this.getNodes();
    this.setNodes(currentNodes.filter(node => node.id !== nodeId));
  }

  /**
   * 設置邊緣
   */
  setEdges(edges: any[]) {
    this.updateState({ edges });
  }

  /**
   * 添加邊緣
   */
  addEdge(edge: any) {
    const currentEdges = this.getEdges();
    this.setEdges([...currentEdges, edge]);
  }

  /**
   * 移除邊緣
   */
  removeEdge(edgeId: string) {
    const currentEdges = this.getEdges();
    this.setEdges(currentEdges.filter(edge => edge.id !== edgeId));
  }

  /**
   * 設置變換
   */
  setTransform(transform: Transform) {
    this.updateState({ transform });
  }

  /**
   * 平移視口
   */
  panBy(delta: { x: number; y: number }) {
    const [x, y, zoom] = this.getTransform();
    this.setTransform([x + delta.x, y + delta.y, zoom]);
  }

  /**
   * 設置中心點
   */
  setCenter(x: number, y: number, options?: { zoom?: number }) {
    const state = this.getState();
    const zoom = options?.zoom || state.transform[2];
    const newX = state.width / 2 - x * zoom;
    const newY = state.height / 2 - y * zoom;
    this.setTransform([newX, newY, zoom]);
  }

  /**
   * 適應視圖
   */
  fitView(options?: any) {
    this.updateState({ fitViewQueued: true });
    // 實際的 fitView 邏輯應該在這裡實現
  }

  /**
   * 更新連接狀態
   */
  updateConnection(connection: Partial<ConnectionState>) {
    const currentConnection = this.getConnection();
    this.updateState({
      connection: { ...currentConnection, ...connection }
    });
  }

  /**
   * 取消連接
   */
  cancelConnection() {
    this.updateState({
      connection: {
        inProgress: false,
        fromHandle: null,
        toHandle: null,
        isValid: false,
      }
    });
  }

  /**
   * 添加選中的節點
   */
  addSelectedNodes(nodeIds: string[]) {
    const selectedNodes = new Set(this.getSelectedNodes());
    nodeIds.forEach(id => selectedNodes.add(id));
    this.updateState({ selectedNodes });
  }

  /**
   * 添加選中的邊緣
   */
  addSelectedEdges(edgeIds: string[]) {
    const selectedEdges = new Set(this.getSelectedEdges());
    edgeIds.forEach(id => selectedEdges.add(id));
    this.updateState({ selectedEdges });
  }

  /**
   * 取消選擇節點和邊緣
   */
  unselectNodesAndEdges(params: { nodes?: any[]; edges?: any[] }) {
    const selectedNodes = new Set(this.getSelectedNodes());
    const selectedEdges = new Set(this.getSelectedEdges());
    
    params.nodes?.forEach(node => selectedNodes.delete(node.id));
    params.edges?.forEach(edge => selectedEdges.delete(edge.id));
    
    this.updateState({ selectedNodes, selectedEdges });
  }

  /**
   * 清除所有選擇
   */
  clearSelection() {
    this.updateState({
      selectedNodes: new Set(),
      selectedEdges: new Set(),
    });
  }

  /**
   * 設置視口尺寸
   */
  setViewport(width: number, height: number) {
    this.updateState({ width, height });
  }

  /**
   * 設置 DOM 節點
   */
  setDomNode(domNode: Element | null) {
    this.updateState({ domNode });
  }

  /**
   * 註冊選擇變化處理器
   */
  addSelectionChangeHandler(handler: (params: any) => void) {
    const handlers = [...this.getState().onSelectionChangeHandlers, handler];
    this.updateState({ onSelectionChangeHandlers: handlers });
  }

  /**
   * 移除選擇變化處理器
   */
  removeSelectionChangeHandler(handler: (params: any) => void) {
    const handlers = this.getState().onSelectionChangeHandlers.filter(h => h !== handler);
    this.updateState({ onSelectionChangeHandlers: handlers });
  }
}