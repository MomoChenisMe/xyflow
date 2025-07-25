/**
 * Queue item type - can be either a direct array or a function that transforms an array
 */
export type QueueItem<T> = T[] | ((items: T[]) => T[]);

/**
 * Queue interface for batching updates
 */
export interface Queue<T> {
  /** Get all items in the queue */
  get(): QueueItem<T>[];
  /** Clear the queue */
  reset(): void;
  /** Add an item to the queue */
  push(item: QueueItem<T>): void;
}

/**
 * Batch context interface
 */
export interface BatchContext {
  /** Queue for node updates */
  nodeQueue: Queue<any>;
  /** Queue for edge updates */
  edgeQueue: Queue<any>;
}

/**
 * Node change types from @xyflow/system
 */
export interface NodeChange<T = any> {
  id: string;
  type: string;
  [key: string]: any;
}

/**
 * Edge change types from @xyflow/system  
 */
export interface EdgeChange<T = any> {
  id: string;
  type: string;
  [key: string]: any;
}