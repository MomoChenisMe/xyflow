import { Injectable, signal, computed } from '@angular/core';

/**
 * NodeIdService - Angular equivalent of React NodeIdContext
 * 
 * 節點 ID 服務 - 為節點內部的組件提供當前節點的 ID
 * 這個服務應該在 NodeWrapper 組件級別提供，確保每個節點都有自己的實例
 * 
 * 主要功能：
 * - 管理和提供當前節點的 ID
 * - 避免 prop drilling，讓子組件可以直接訪問節點 ID
 * - 使用 Angular 的分層注入器確保隔離性
 * 
 * @example
 * ```typescript
 * // 在 NodeWrapper 組件中提供
 * @Component({
 *   selector: 'xy-node-wrapper',
 *   providers: [NodeIdService], // 每個節點實例都有自己的服務實例
 *   template: `...`
 * })
 * export class NodeWrapperComponent {
 *   constructor(private nodeIdService: NodeIdService) {
 *     this.nodeIdService.setNodeId(this.id);
 *   }
 * }
 * 
 * // 在子組件中使用
 * @Component({
 *   selector: 'xy-custom-handle',
 *   template: `...`
 * })
 * export class CustomHandleComponent {
 *   constructor(private nodeIdService: NodeIdService) {
 *     const nodeId = this.nodeIdService.getNodeId();
 *     console.log('Current node ID:', nodeId);
 *   }
 * }
 * ```
 */
@Injectable()
export class NodeIdService {
  /** 當前節點 ID 的信號 */
  private nodeIdSignal = signal<string | null>(null);

  /** 節點 ID 的計算屬性 */
  nodeId$ = computed(() => this.nodeIdSignal());

  /**
   * 設置節點 ID
   * @param id - 節點 ID
   */
  setNodeId(id: string | null) {
    this.nodeIdSignal.set(id);
  }

  /**
   * 獲取當前節點 ID
   * @returns 節點 ID 或 null
   */
  getNodeId(): string | null {
    return this.nodeIdSignal();
  }

  /**
   * 檢查是否有有效的節點 ID
   * @returns 是否有節點 ID
   */
  hasNodeId(): boolean {
    return this.nodeIdSignal() !== null;
  }

  /**
   * 清除節點 ID
   */
  clearNodeId() {
    this.nodeIdSignal.set(null);
  }
}