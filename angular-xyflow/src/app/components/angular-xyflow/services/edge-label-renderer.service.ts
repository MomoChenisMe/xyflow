import {
  Injectable,
  ComponentRef,
  ViewContainerRef,
  TemplateRef,
  EmbeddedViewRef,
} from '@angular/core';

export interface EdgeLabel {
  id: string;
  content: TemplateRef<any> | ComponentRef<any>;
  context?: any;
}

/**
 * EdgeLabelRenderer 服務
 *
 * 管理邊標籤的註冊和渲染，類似 React Portal 的功能。
 * 這個服務允許邊組件將標籤內容註冊到一個中央位置，
 * 然後由 angular-xyflow 組件中的專門容器進行渲染。
 */
@Injectable({
  providedIn: 'root'
})
export class EdgeLabelRendererService {
  private labelContainer: ViewContainerRef | null = null;
  private labels = new Map<string, EmbeddedViewRef<any>>();
  private pendingLabels = new Map<string, { template: TemplateRef<any>; context?: any }>();

  /**
   * 設置標籤容器
   */
  setContainer(container: ViewContainerRef): void {
    this.labelContainer = container;
    
    // 先處理待註冊的標籤，再清空
    // 因為 clear() 會清空 pendingLabels
    this.processPendingLabels();
  }

  /**
   * 註冊一個標籤模板
   */
  registerLabel(id: string, template: TemplateRef<any>, context?: any): void {
    if (!this.labelContainer) {
      // 容器尚未初始化，將標籤加入待處理隊列
      this.pendingLabels.set(id, { template, context });
      return;
    }

    // 如果已存在，先移除舊的
    this.unregisterLabel(id);

    // 創建並插入新的視圖
    const viewRef = this.labelContainer.createEmbeddedView(template, context);
    this.labels.set(id, viewRef);
  }

  /**
   * 處理待註冊的標籤
   */
  private processPendingLabels(): void {
    if (!this.labelContainer) return;
    
    this.pendingLabels.forEach(({ template, context }, id) => {
      const viewRef = this.labelContainer!.createEmbeddedView(template, context);
      this.labels.set(id, viewRef);
    });
    
    this.pendingLabels.clear();
  }

  /**
   * 取消註冊標籤
   */
  unregisterLabel(id: string): void {
    // 檢查是否在待處理隊列中
    if (this.pendingLabels.has(id)) {
      this.pendingLabels.delete(id);
      return;
    }

    // 檢查是否已渲染
    const viewRef = this.labels.get(id);
    if (viewRef) {
      const index = this.labelContainer?.indexOf(viewRef);
      if (index !== undefined && index >= 0) {
        this.labelContainer?.remove(index);
      }
      this.labels.delete(id);
    }
  }

  /**
   * 清空所有標籤
   */
  clear(): void {
    // 移除所有視圖
    if (this.labelContainer) {
      // 逐個移除視圖
      while (this.labelContainer.length > 0) {
        this.labelContainer.remove(0);
      }
    }
    // 清空標籤記錄
    this.labels.clear();
    // 注意：不清空 pendingLabels，因為它們可能還需要被處理
  }

  /**
   * 銷毀服務
   */
  destroy(): void {
    this.clear();
    this.pendingLabels.clear(); // 銷毀時清空待處理標籤
    this.labelContainer = null;
  }
}
