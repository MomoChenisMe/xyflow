/**
 * Angular XYFlow Store - 統一狀態管理導出
 * 
 * 這個文件提供了完整的狀態管理系統，等價於 React Flow 的 store
 * 使用 Angular Signals 實現響應式狀態管理
 */

// 核心 store 服務
export * from './flow-store.service';
export * from './store-types';
// export * from './store-utils'; // TODO: Implement store-utils when needed
export * from './initial-state';

// 選擇器和工具
export * from './selectors';
export * from './middleware';

// 狀態變化處理
export * from './changes';

// 類型定義
export type {
  ReactFlowState,
  StoreApi,
  FlowStoreActions,
  NodeChanges,
  EdgeChanges,
  ViewportState,
  ConnectionState,
  SelectionState,
  InternalState
} from './store-types';

/**
 * Store 常量
 */
export const STORE_CONSTANTS = {
  // 默認值
  DEFAULT_ZOOM_RANGE: { min: 0.1, max: 10 },
  DEFAULT_NODE_SIZE: { width: 150, height: 40 },
  DEFAULT_CONNECTION_RADIUS: 20,
  DEFAULT_SNAP_GRID: [15, 15] as [number, number],
  
  // 事件類型
  EVENT_TYPES: {
    NODES_CHANGE: 'nodes-change',
    EDGES_CHANGE: 'edges-change',
    SELECTION_CHANGE: 'selection-change',
    VIEWPORT_CHANGE: 'viewport-change',
    CONNECTION_START: 'connection-start',
    CONNECTION_END: 'connection-end',
  },
  
  // 錯誤代碼
  ERROR_CODES: {
    NODE_NOT_FOUND: 'node-not-found',
    EDGE_NOT_FOUND: 'edge-not-found',
    INVALID_NODE_TYPE: 'invalid-node-type',
    INVALID_EDGE_TYPE: 'invalid-edge-type',
    CONNECTION_INVALID: 'connection-invalid',
  },
} as const;

/**
 * Store 工具函數
 */
export const StoreUtils = {
  /**
   * 創建唯一 ID
   */
  createId: (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  
  /**
   * 深度克隆對象
   */
  deepClone: <T>(obj: T): T => JSON.parse(JSON.stringify(obj)),
  
  /**
   * 淺比較兩個對象
   */
  shallowEqual: (a: any, b: any): boolean => {
    if (a === b) return true;
    if (!a || !b) return false;
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (a[key] !== b[key]) return false;
    }
    
    return true;
  },
  
  /**
   * 合併對象
   */
  merge: <T extends object>(target: T, ...sources: Partial<T>[]): T => {
    return Object.assign({}, target, ...sources);
  },
  
  /**
   * 安全獲取嵌套屬性
   */
  get: (obj: any, path: string, defaultValue?: any) => {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result == null) return defaultValue;
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  },
} as const;

/**
 * 使用示例
 * 
 * @example
 * ```typescript
 * // 在組件中使用完整的 store 系統
 * @Component({
 *   template: `
 *     <div>節點數量: {{ nodeCount() }}</div>
 *     <div>當前縮放: {{ currentZoom() | number:'1.2-2' }}</div>
 *     <button (click)="resetStore()">重置</button>
 *   `
 * })
 * export class FlowComponent {
 *   nodeCount = computed(() => this.store.getNodes().length);
 *   currentZoom = computed(() => this.store.getTransform()[2]);
 *   
 *   constructor(private store: FlowStoreService) {
 *     // 監聽狀態變化
 *     effect(() => {
 *       const state = this.store.getState();
 *       console.log('Store state changed:', {
 *         nodes: state.nodes.length,
 *         edges: state.edges.length,
 *         transform: state.transform
 *       });
 *     });
 *   }
 *   
 *   resetStore() {
 *     this.store.reset();
 *   }
 * }
 * 
 * // 使用選擇器
 * @Component({
 *   template: `<div>選中的節點</div>`
 * })
 * export class SelectionComponent {
 *   selectedNodes = computed(() => 
 *     selectSelectedNodes(this.store.getState())
 *   );
 *   
 *   constructor(private store: FlowStoreService) {}
 * }
 * 
 * // 使用中間件
 * @Component({
 *   providers: [
 *     {
 *       provide: FlowStoreService,
 *       useFactory: () => {
 *         const store = new FlowStoreService();
 *         
 *         // 應用日誌中間件
 *         store.addMiddleware(loggingMiddleware);
 *         
 *         // 應用本地存儲中間件
 *         store.addMiddleware(persistenceMiddleware({
 *           key: 'my-flow-state',
 *           storage: localStorage
 *         }));
 *         
 *         return store;
 *       }
 *     }
 *   ]
 * })
 * export class EnhancedFlowComponent {}
 * ```
 */