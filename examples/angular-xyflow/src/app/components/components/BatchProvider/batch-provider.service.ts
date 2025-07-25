import { Injectable, signal, computed, effect } from '@angular/core';
import { Queue, QueueItem, NodeChange, EdgeChange } from './batch-provider.types';

/**
 * Angular equivalent of the React useQueue hook
 * 創建用於批次更新的隊列
 */
export function createQueue<T>(onUpdate: () => void): Queue<T> {
  let queue: QueueItem<T>[] = [];

  return {
    get: () => queue,
    reset: () => {
      queue = [];
    },
    push: (item) => {
      queue.push(item);
      onUpdate();
    },
  };
}

/**
 * Mock store API service - 模擬 React Flow 的 store API
 * 在實際實現中，這應該連接到真正的 Angular state management
 */
@Injectable({
  providedIn: 'root'
})
export class MockStoreApiService {
  // 模擬 store state
  private state = {
    nodes: [] as any[],
    edges: [] as any[],
    setNodes: (nodes: any[]) => { this.state.nodes = nodes; },
    setEdges: (edges: any[]) => { this.state.edges = edges; },
    hasDefaultNodes: true,
    hasDefaultEdges: true,
    onNodesChange: null as ((changes: NodeChange[]) => void) | null,
    onEdgesChange: null as ((changes: EdgeChange[]) => void) | null,
    nodeLookup: new Map(),
    edgeLookup: new Map(),
    fitViewQueued: false,
  };

  getState() {
    return this.state;
  }
}

/**
 * Mock utility function - 模擬 getElementsDiffChanges
 * 在實際實現中，這應該從 @xyflow/system 導入
 */
function getElementsDiffChanges({ items, lookup }: { items: any[], lookup: Map<string, any> }): any[] {
  // 簡化的實現 - 實際應該比較 items 和 lookup 來產生變更
  return items.map((item, index) => ({
    id: item.id || `item-${index}`,
    type: 'update',
    item,
  }));
}

/**
 * BatchProvider service - Angular equivalent of React BatchProvider
 * 批次處理節點和邊緣更新的服務
 */
@Injectable({
  providedIn: 'root'
})
export class BatchProviderService {
  private storeApi = new MockStoreApiService();
  
  // 用於觸發隊列處理的信號
  private nodeQueueSerial = signal(BigInt(0));
  private edgeQueueSerial = signal(BigInt(0));

  // 創建隊列
  private nodeQueue = createQueue<any>(() => {
    this.nodeQueueSerial.update(n => n + BigInt(1));
  });

  private edgeQueue = createQueue<any>(() => {
    this.edgeQueueSerial.update(n => n + BigInt(1));
  });

  constructor() {
    // 處理節點隊列更新
    effect(() => {
      const serial = this.nodeQueueSerial();
      if (serial > BigInt(0)) {
        this.processNodeQueue();
      }
    });

    // 處理邊緣隊列更新
    effect(() => {
      const serial = this.edgeQueueSerial();
      if (serial > BigInt(0)) {
        this.processEdgeQueue();
      }
    });
  }

  /**
   * 處理節點隊列 - 對應 React 的 nodeQueueHandler
   */
  private processNodeQueue() {
    const queueItems = this.nodeQueue.get();
    
    if (queueItems.length === 0) {
      return;
    }

    const { nodes = [], setNodes, hasDefaultNodes, onNodesChange, nodeLookup, fitViewQueued } = this.storeApi.getState();

    // 處理隊列項目 - 與 React 版本相同的邏輯
    let next = nodes;
    for (const payload of queueItems) {
      next = typeof payload === 'function' ? payload(next) : payload;
    }

    const changes = getElementsDiffChanges({
      items: next,
      lookup: nodeLookup,
    }) as NodeChange[];

    if (hasDefaultNodes) {
      setNodes(next);
    }

    // 只有在有變更時才觸發 onNodesChange
    if (changes.length > 0) {
      onNodesChange?.(changes);
    } else if (fitViewQueued) {
      // 如果沒有變更但需要 fitView，在下一幀觸發重新渲染
      requestAnimationFrame(() => {
        const { fitViewQueued, nodes, setNodes } = this.storeApi.getState();
        if (fitViewQueued) {
          setNodes(nodes);
        }
      });
    }

    this.nodeQueue.reset();
  }

  /**
   * 處理邊緣隊列 - 對應 React 的 edgeQueueHandler
   */
  private processEdgeQueue() {
    const queueItems = this.edgeQueue.get();
    
    if (queueItems.length === 0) {
      return;
    }

    const { edges = [], setEdges, hasDefaultEdges, onEdgesChange, edgeLookup } = this.storeApi.getState();

    let next = edges;
    for (const payload of queueItems) {
      next = typeof payload === 'function' ? payload(next) : payload;
    }

    if (hasDefaultEdges) {
      setEdges(next);
    } else if (onEdgesChange) {
      onEdgesChange(
        getElementsDiffChanges({
          items: next,
          lookup: edgeLookup,
        }) as EdgeChange[]
      );
    }

    this.edgeQueue.reset();
  }

  /**
   * 獲取節點隊列 - 對應 React 的 nodeQueue
   */
  getNodeQueue(): Queue<any> {
    return this.nodeQueue;
  }

  /**
   * 獲取邊緣隊列 - 對應 React 的 edgeQueue
   */
  getEdgeQueue(): Queue<any> {
    return this.edgeQueue;
  }

  /**
   * 獲取批次上下文 - 對應 React 的 useBatchContext
   */
  getBatchContext() {
    return {
      nodeQueue: this.nodeQueue,
      edgeQueue: this.edgeQueue,
    };
  }
}