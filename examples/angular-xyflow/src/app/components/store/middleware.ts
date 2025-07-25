import { StoreMiddleware, ReactFlowState, PersistenceConfig, PerformanceMetric } from './store-types';

/**
 * Store 中間件集合
 * 
 * 提供各種預定義的中間件，用於增強 store 的功能
 * 包括日誌記錄、性能監控、持久化、調試等功能
 */

// ===================
// 日誌中間件
// ===================

/**
 * 日誌中間件選項
 */
export interface LoggingMiddlewareOptions {
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  logActions?: boolean;
  logStateChanges?: boolean;
  logPerformance?: boolean;
  filter?: (actionName: string, payload: any) => boolean;
  transformer?: (state: ReactFlowState) => any;
}

/**
 * 創建日誌中間件
 */
export function createLoggingMiddleware(options: LoggingMiddlewareOptions = {}): StoreMiddleware {
  const {
    logLevel = 'info',
    logActions = true,
    logStateChanges = true,
    logPerformance = false,
    filter,
    transformer
  } = options;

  return {
    name: 'logging',
    
    onAction: (actionName, payload, state) => {
      if (!logActions) return;
      if (filter && !filter(actionName, payload)) return;
      
      const group = `🚀 Action: ${actionName}`;
      console.group(group);
      console.log('Payload:', payload);
      
      if (logPerformance) {
        console.time(`⏱️ ${actionName} execution`);
      }
      
      console.groupEnd();
    },
    
    afterStateChange: (newState, previousState) => {
      if (!logStateChanges) return;
      
      const transformedNew = transformer ? transformer(newState) : newState;
      const transformedPrev = transformer ? transformer(previousState) : previousState;
      
      console.group('📊 State Change');
      console.log('Previous:', transformedPrev);
      console.log('Current:', transformedNew);
      
      // 計算變化的字段
      const changes: Record<string, any> = {};
      Object.keys(newState).forEach(key => {
        const newValue = (newState as any)[key];
        const prevValue = (previousState as any)[key];
        
        if (newValue !== prevValue) {
          changes[key] = { from: prevValue, to: newValue };
        }
      });
      
      if (Object.keys(changes).length > 0) {
        console.log('Changes:', changes);
      }
      
      console.groupEnd();
    }
  };
}

/**
 * 簡單日誌中間件
 */
export const loggingMiddleware: StoreMiddleware = createLoggingMiddleware();

// ===================
// 性能監控中間件
// ===================

/**
 * 性能監控中間件選項
 */
export interface PerformanceMiddlewareOptions {
  sampleRate?: number;
  slowActionThreshold?: number;
  onSlowAction?: (actionName: string, duration: number) => void;
  onMetric?: (metric: PerformanceMetric) => void;
}

/**
 * 創建性能監控中間件
 */
export function createPerformanceMiddleware(options: PerformanceMiddlewareOptions = {}): StoreMiddleware {
  const {
    sampleRate = 1,
    slowActionThreshold = 16, // 一個動畫幀的時間
    onSlowAction,
    onMetric
  } = options;
  
  const actionStartTimes = new Map<string, number>();
  
  return {
    name: 'performance',
    
    onAction: (actionName, payload, state) => {
      // 採樣
      if (Math.random() > sampleRate) return;
      
      const startTime = performance.now();
      actionStartTimes.set(actionName, startTime);
    },
    
    afterStateChange: (newState, previousState) => {
      // 從最近的動作名稱推斷（這是簡化實現）
      const lastActionName = 'unknown'; // 在實際實現中需要從其他地方獲取
      const startTime = actionStartTimes.get(lastActionName);
      
      if (startTime) {
        const duration = performance.now() - startTime;
        actionStartTimes.delete(lastActionName);
        
        const metric: PerformanceMetric = {
          name: lastActionName,
          duration,
          timestamp: Date.now(),
          metadata: {
            nodeCount: newState.nodes.length,
            edgeCount: newState.edges.length,
            selectedCount: newState.selectedNodes.size + newState.selectedEdges.size
          }
        };
        
        // 回調
        if (onMetric) {
          onMetric(metric);
        }
        
        // 慢動作警告
        if (duration > slowActionThreshold) {
          console.warn(`🐌 Slow action detected: ${lastActionName} (${duration.toFixed(2)}ms)`);
          if (onSlowAction) {
            onSlowAction(lastActionName, duration);
          }
        }
      }
    }
  };
}

/**
 * 默認性能監控中間件
 */
export const performanceMiddleware: StoreMiddleware = createPerformanceMiddleware();

// ===================
// 持久化中間件
// ===================

/**
 * 創建持久化中間件
 */
export function createPersistenceMiddleware(config: PersistenceConfig): StoreMiddleware {
  return {
    name: 'persistence',
    
    afterStateChange: (newState, previousState) => {
      try {
        let dataToSave: Partial<ReactFlowState> = newState;
        
        // 應用包含/排除過濾器
        if (config.include) {
          dataToSave = config.include.reduce((acc, key) => {
            acc[key] = newState[key];
            return acc;
          }, {} as Partial<ReactFlowState>);
        }
        
        if (config.exclude) {
          dataToSave = { ...newState };
          config.exclude.forEach(key => {
            delete dataToSave[key];
          });
        }
        
        // 序列化
        const serialized = config.serialize ? 
          config.serialize(newState) : 
          JSON.stringify(dataToSave);
        
        // 保存到存儲
        config.storage.setItem(config.key, serialized);
      } catch (error) {
        console.error('Persistence middleware error:', error);
      }
    }
  };
}

// ===================
// 調試中間件
// ===================

/**
 * 調試中間件選項
 */
export interface DebugMiddlewareOptions {
  maxHistorySize?: number;
  enableTimeTravel?: boolean;
  onError?: (error: Error, context: string) => void;
}

/**
 * 創建調試中間件
 */
export function createDebugMiddleware(options: DebugMiddlewareOptions = {}): StoreMiddleware {
  const {
    maxHistorySize = 50,
    enableTimeTravel = false,
    onError
  } = options;
  
  const stateHistory: ReactFlowState[] = [];
  const actionHistory: Array<{ name: string; payload: any; timestamp: number }> = [];
  
  return {
    name: 'debug',
    
    onAction: (actionName, payload, state) => {
      try {
        // 記錄動作歷史
        actionHistory.push({
          name: actionName,
          payload: JSON.parse(JSON.stringify(payload)), // 深度克隆
          timestamp: Date.now()
        });
        
        // 限制歷史大小
        if (actionHistory.length > maxHistorySize) {
          actionHistory.shift();
        }
        
        // 在全局對象上暴露調試信息
        if (typeof window !== 'undefined') {
          (window as any).__ANGULAR_FLOW_DEBUG__ = {
            actionHistory,
            stateHistory,
            currentState: state,
            replayActions: enableTimeTravel ? () => {
              // 時間旅行邏輯
              console.log('Time travel not implemented yet');
            } : undefined
          };
        }
      } catch (error) {
        if (onError) {
          onError(error as Error, 'debug-onAction');
        }
      }
    },
    
    afterStateChange: (newState, previousState) => {
      try {
        // 記錄狀態歷史
        stateHistory.push(JSON.parse(JSON.stringify(newState))); // 深度克隆
        
        // 限制歷史大小
        if (stateHistory.length > maxHistorySize) {
          stateHistory.shift();
        }
      } catch (error) {
        if (onError) {
          onError(error as Error, 'debug-afterStateChange');
        }
      }
    }
  };
}

/**
 * 默認調試中間件
 */
export const debugMiddleware: StoreMiddleware = createDebugMiddleware();

// ===================
// 驗證中間件
// ===================

/**
 * 驗證規則
 */
export interface ValidationRule {
  name: string;
  validate: (state: ReactFlowState) => boolean | string;
  level: 'error' | 'warn' | 'info';
}

/**
 * 驗證中間件選項
 */
export interface ValidationMiddlewareOptions {
  rules?: ValidationRule[];
  onValidationFailed?: (rule: ValidationRule, state: ReactFlowState, message: string) => void;
  throwOnError?: boolean;
}

/**
 * 創建驗證中間件
 */
export function createValidationMiddleware(options: ValidationMiddlewareOptions = {}): StoreMiddleware {
  const {
    rules = [],
    onValidationFailed,
    throwOnError = false
  } = options;
  
  return {
    name: 'validation',
    
    beforeStateChange: (nextState, currentState) => {
      const mergedState = { ...currentState, ...nextState };
      
      for (const rule of rules) {
        const result = rule.validate(mergedState);
        
        if (result !== true) {
          const message = typeof result === 'string' ? result : `Validation failed: ${rule.name}`;
          
          if (onValidationFailed) {
            onValidationFailed(rule, mergedState, message);
          }
          
          switch (rule.level) {
            case 'error':
              console.error(`❌ ${message}`);
              if (throwOnError) {
                throw new Error(message);
              }
              break;
            case 'warn':
              console.warn(`⚠️ ${message}`);
              break;
            case 'info':
              console.info(`ℹ️ ${message}`);
              break;
          }
        }
      }
      
      return nextState;
    }
  };
}

/**
 * 常用驗證規則
 */
export const commonValidationRules: ValidationRule[] = [
  {
    name: 'unique-node-ids',
    validate: (state) => {
      const ids = state.nodes.map(node => node.id);
      const uniqueIds = new Set(ids);
      return ids.length === uniqueIds.size || 'Duplicate node IDs found';
    },
    level: 'error'
  },
  {
    name: 'unique-edge-ids',
    validate: (state) => {
      const ids = state.edges.map(edge => edge.id);
      const uniqueIds = new Set(ids);
      return ids.length === uniqueIds.size || 'Duplicate edge IDs found';
    },
    level: 'error'
  },
  {
    name: 'valid-zoom-range',
    validate: (state) => {
      return state.minZoom < state.maxZoom || 'minZoom must be less than maxZoom';
    },
    level: 'error'
  },
  {
    name: 'valid-viewport-dimensions',
    validate: (state) => {
      return state.width > 0 && state.height > 0 || 'Viewport dimensions must be positive';
    },
    level: 'error'
  },
  {
    name: 'edge-nodes-exist',
    validate: (state) => {
      const nodeIds = new Set(state.nodes.map(node => node.id));
      const invalidEdges = state.edges.filter(edge => 
        !nodeIds.has(edge.source) || !nodeIds.has(edge.target)
      );
      return invalidEdges.length === 0 || `Found ${invalidEdges.length} edges with missing nodes`;
    },
    level: 'warn'
  }
];

/**
 * 默認驗證中間件
 */
export const validationMiddleware: StoreMiddleware = createValidationMiddleware({
  rules: commonValidationRules
});

// ===================
// 快照中間件
// ===================

/**
 * 快照中間件選項
 */
export interface SnapshotMiddlewareOptions {
  interval?: number; // 自動快照間隔（毫秒）
  maxSnapshots?: number;
  onSnapshot?: (snapshot: ReactFlowState, index: number) => void;
}

/**
 * 創建快照中間件
 */
export function createSnapshotMiddleware(options: SnapshotMiddlewareOptions = {}): StoreMiddleware {
  const {
    interval,
    maxSnapshots = 10,
    onSnapshot
  } = options;
  
  const snapshots: ReactFlowState[] = [];
  let lastSnapshotTime = 0;
  
  return {
    name: 'snapshot',
    
    afterStateChange: (newState, previousState) => {
      const now = Date.now();
      
      // 檢查是否應該創建快照
      let shouldSnapshot = false;
      
      if (interval && now - lastSnapshotTime >= interval) {
        shouldSnapshot = true;
      }
      
      // 檢查重大變化（節點/邊緣數量變化）
      if (newState.nodes.length !== previousState.nodes.length ||
          newState.edges.length !== previousState.edges.length) {
        shouldSnapshot = true;
      }
      
      if (shouldSnapshot) {
        // 創建快照
        const snapshot = JSON.parse(JSON.stringify(newState));
        snapshots.push(snapshot);
        
        // 限制快照數量
        if (snapshots.length > maxSnapshots) {
          snapshots.shift();
        }
        
        lastSnapshotTime = now;
        
        if (onSnapshot) {
          onSnapshot(snapshot, snapshots.length - 1);
        }
        
        // 暴露到全局對象（調試用）
        if (typeof window !== 'undefined') {
          (window as any).__ANGULAR_FLOW_SNAPSHOTS__ = snapshots;
        }
      }
    }
  };
}

// ===================
// 中間件組合器
// ===================

/**
 * 組合多個中間件
 */
export function combineMiddleware(...middleware: StoreMiddleware[]): StoreMiddleware[] {
  return middleware;
}

/**
 * 條件中間件
 */
export function conditionalMiddleware(
  condition: () => boolean,
  middleware: StoreMiddleware
): StoreMiddleware {
  return {
    name: `conditional-${middleware.name}`,
    
    beforeStateChange: (nextState, currentState) => {
      if (condition() && middleware.beforeStateChange) {
        return middleware.beforeStateChange(nextState, currentState);
      }
      return nextState;
    },
    
    afterStateChange: (newState, previousState) => {
      if (condition() && middleware.afterStateChange) {
        middleware.afterStateChange(newState, previousState);
      }
    },
    
    onAction: (actionName, payload, state) => {
      if (condition() && middleware.onAction) {
        middleware.onAction(actionName, payload, state);
      }
    }
  };
}

/**
 * 預定義中間件組合
 */
export const middlewarePresets = {
  /**
   * 開發模式中間件
   */
  development: combineMiddleware(
    loggingMiddleware,
    performanceMiddleware,
    debugMiddleware,
    validationMiddleware
  ),
  
  /**
   * 生產模式中間件
   */
  production: combineMiddleware(
    createPerformanceMiddleware({ sampleRate: 0.1 }),
    createValidationMiddleware({ 
      rules: commonValidationRules.filter(rule => rule.level === 'error'),
      throwOnError: false 
    })
  ),
  
  /**
   * 調試模式中間件
   */
  debug: combineMiddleware(
    createLoggingMiddleware({ logLevel: 'debug', logPerformance: true }),
    createDebugMiddleware({ enableTimeTravel: true }),
    createSnapshotMiddleware({ interval: 5000 })
  ),
  
  /**
   * 性能監控中間件
   */
  performance: combineMiddleware(
    createPerformanceMiddleware({
      slowActionThreshold: 10,
      onSlowAction: (action, duration) => {
        console.warn(`Performance issue: ${action} took ${duration}ms`);
      }
    })
  )
} as const;