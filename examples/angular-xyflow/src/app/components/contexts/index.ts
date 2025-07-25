// Context 服務導出
export * from './node-id.service';
export * from './flow-store.service';

// 類型導出
export type { FlowState, Transform, ConnectionState } from './flow-store.service';

/**
 * Angular XYFlow Context 服務
 * 
 * 這些服務替代了 React Flow 的 Context API：
 * 
 * 1. NodeIdService - 替代 NodeIdContext
 *    - 提供節點 ID 給節點內部的組件
 *    - 應該在 NodeWrapper 組件級別提供
 * 
 * 2. FlowStoreService - 替代 StoreContext
 *    - 管理整個 Flow 的全局狀態
 *    - 提供所有狀態管理功能
 *    - 應該在應用或模組級別提供
 * 
 * @example
 * ```typescript
 * // 在模組中提供全局服務
 * @NgModule({
 *   providers: [FlowStoreService]
 * })
 * export class AppModule {}
 * 
 * // 在組件中使用
 * @Component({
 *   selector: 'xy-node-wrapper',
 *   providers: [NodeIdService], // 組件級別提供
 *   template: `...`
 * })
 * export class NodeWrapperComponent {
 *   constructor(
 *     private flowStore: FlowStoreService, // 注入全局服務
 *     private nodeIdService: NodeIdService  // 注入組件級別服務
 *   ) {}
 * }
 * ```
 */
export const ANGULAR_FLOW_CONTEXTS = {
  NodeIdService: 'NodeIdService',
  FlowStoreService: 'FlowStoreService',
} as const;