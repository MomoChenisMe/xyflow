import { Injectable, signal, computed, Signal } from '@angular/core';
import { 
  AngularFlowProviderConfig, 
  FlowState, 
  StoreApi,
  NodeOrigin,
  CoordinateExtent,
  FitViewOptions 
} from './react-flow-provider.types';
import { NodeBase } from '../Nodes/nodes.types';

/**
 * 創建 Flow Store - 模擬 React Flow 的 createStore 函數
 */
function createFlowStore(config: AngularFlowProviderConfig = {}): StoreApi {
  const {
    initialNodes = [],
    initialEdges = [],
    defaultNodes,
    defaultEdges,
    initialWidth = 1000,
    initialHeight = 600,
    fitView = false,
    initialMinZoom = 0.5,
    initialMaxZoom = 2,
    initialFitViewOptions,
    nodeOrigin = [0, 0],
    nodeExtent,
  } = config;

  // 創建初始狀態
  const initialState: FlowState = {
    nodes: initialNodes,
    edges: initialEdges,
    nodeLookup: new Map(initialNodes.map(node => [node.id, node])),
    edgeLookup: new Map(initialEdges.map(edge => [edge.id, edge])),
    transform: [0, 0, 1],
    width: initialWidth,
    height: initialHeight,
    minZoom: initialMinZoom,
    maxZoom: initialMaxZoom,
    connectionMode: 'strict',
    isDragging: false,
    selectedNodes: new Set(),
    selectedEdges: new Set(),
  };

  const state = signal(initialState);
  const listeners: ((state: FlowState) => void)[] = [];

  return {
    getState: () => state(),
    setState: (partial) => {
      state.update(current => {
        const newState = { ...current, ...partial };
        
        // 更新查找表
        if (partial.nodes) {
          newState.nodeLookup = new Map(partial.nodes.map(node => [node.id, node]));
        }
        if (partial.edges) {
          newState.edgeLookup = new Map(partial.edges.map(edge => [edge.id, edge]));
        }
        
        // 通知監聽器
        listeners.forEach(listener => listener(newState));
        
        return newState;
      });
    },
    subscribe: (listener) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      };
    },
  };
}

/**
 * AngularFlowProvider - Angular equivalent of React ReactFlowProvider
 * 
 * Angular Flow 提供者服務 - 類似 React 的 Context Provider
 * 讓 flow 的內部狀態可以在 ReactFlow 組件外部訪問
 * 
 * 主要功能：
 * - 管理 flow 的全局狀態
 * - 提供節點和邊緣的增刪改查
 * - 處理變換和視口操作
 * - 管理選擇狀態
 * - 提供事件訂閱機制
 * 
 * @example
 * ```typescript
 * // 在模組中提供服務
 * @Component({
 *   providers: [AngularFlowProviderService],
 *   template: `
 *     <xy-angular-flow [nodes]="nodes" [edges]="edges">
 *     </xy-angular-flow>
 *     <xy-sidebar></xy-sidebar>
 *   `
 * })
 * export class FlowComponent {
 *   nodes = [{ id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } }];
 *   edges = [];
 * }
 * 
 * @Component({
 *   template: `<aside>{{ nodeCount() }} nodes</aside>`
 * })
 * export class SidebarComponent {
 *   private flowProvider = inject(AngularFlowProviderService);
 *   nodeCount = computed(() => this.flowProvider.getNodes().length);
 * }
 * ```
 */
@Injectable()
export class AngularFlowProviderService {
  private store: StoreApi;
  private stateSignal: Signal<FlowState>;

  constructor() {
    // 創建默認配置的 store
    this.store = createFlowStore();
    this.stateSignal = signal(this.store.getState());
    
    // 訂閱 store 變化並更新 signal
    this.store.subscribe(state => {
      (this.stateSignal as any).set(state);
    });
  }

  /**
   * 初始化 Flow Provider
   */
  initialize(config: AngularFlowProviderConfig) {
    this.store = createFlowStore(config);
    (this.stateSignal as any).set(this.store.getState());
    
    // 重新訂閱新 store
    this.store.subscribe(state => {
      (this.stateSignal as any).set(state);
    });
  }

  /**
   * 獲取當前狀態
   */
  getState(): FlowState {
    return this.store.getState();
  }

  /**
   * 設置狀態
   */
  setState(partial: Partial<FlowState>) {
    this.store.setState(partial);
  }

  /**
   * 訂閱狀態變化
   */
  subscribe(listener: (state: FlowState) => void): () => void {
    return this.store.subscribe(listener);
  }

  /**
   * 獲取狀態 Signal
   */
  getStateSignal(): Signal<FlowState> {
    return this.stateSignal;
  }

  // 便捷的狀態訪問方法
  
  /**
   * 獲取所有節點
   */
  getNodes = computed(() => this.stateSignal().nodes);

  /**
   * 獲取所有邊緣
   */
  getEdges = computed(() => this.stateSignal().edges);

  /**
   * 獲取節點查找表
   */
  getNodeLookup = computed(() => this.stateSignal().nodeLookup);

  /**
   * 獲取邊緣查找表
   */
  getEdgeLookup = computed(() => this.stateSignal().edgeLookup);

  /**
   * 獲取當前變換
   */
  getTransform = computed(() => this.stateSignal().transform);

  /**
   * 獲取視口尺寸
   */
  getViewport = computed(() => {
    const state = this.stateSignal();
    return { width: state.width, height: state.height };
  });

  /**
   * 獲取縮放範圍
   */
  getZoomRange = computed(() => {
    const state = this.stateSignal();
    return { minZoom: state.minZoom, maxZoom: state.maxZoom };
  });

  /**
   * 獲取選中的節點
   */
  getSelectedNodes = computed(() => {
    const state = this.stateSignal();
    return Array.from(state.selectedNodes);
  });

  /**
   * 獲取選中的邊緣
   */
  getSelectedEdges = computed(() => {
    const state = this.stateSignal();
    return Array.from(state.selectedEdges);
  });

  // 操作方法

  /**
   * 設置節點
   */
  setNodes(nodes: NodeBase[]) {
    this.setState({ nodes });
  }

  /**
   * 添加節點
   */
  addNode(node: NodeBase) {
    const currentNodes = this.getNodes();
    this.setNodes([...currentNodes, node]);
  }

  /**
   * 移除節點
   */
  removeNode(nodeId: string) {
    const currentNodes = this.getNodes();
    this.setNodes(currentNodes.filter(node => node.id !== nodeId));
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
   * 設置邊緣
   */
  setEdges(edges: any[]) {
    this.setState({ edges });
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
  setTransform(transform: [number, number, number]) {
    this.setState({ transform });
  }

  /**
   * 設置視口尺寸
   */
  setViewport(width: number, height: number) {
    this.setState({ width, height });
  }

  /**
   * 選擇節點
   */
  selectNodes(nodeIds: string[]) {
    this.setState({ selectedNodes: new Set(nodeIds) });
  }

  /**
   * 選擇邊緣
   */
  selectEdges(edgeIds: string[]) {
    this.setState({ selectedEdges: new Set(edgeIds) });
  }

  /**
   * 清除選擇
   */
  clearSelection() {
    this.setState({ 
      selectedNodes: new Set(), 
      selectedEdges: new Set() 
    });
  }

  /**
   * 適應視圖
   */
  fitView(options: FitViewOptions = {}) {
    const state = this.getState();
    const { nodes } = state;
    
    if (nodes.length === 0) {
      return;
    }

    // 簡化的 fit view 實現
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      const x = node.position.x;
      const y = node.position.y;
      const width = node.width || 150;
      const height = node.height || 40;
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    const padding = options.padding || 50;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;
    
    const scaleX = state.width / contentWidth;
    const scaleY = state.height / contentHeight;
    const scale = Math.min(scaleX, scaleY, options.maxZoom || state.maxZoom);
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const x = state.width / 2 - centerX * scale;
    const y = state.height / 2 - centerY * scale;
    
    this.setTransform([x, y, scale]);
  }
}