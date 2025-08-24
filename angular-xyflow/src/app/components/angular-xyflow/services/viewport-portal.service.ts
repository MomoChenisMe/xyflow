import { Injectable, signal, computed, TemplateRef, ComponentRef, ViewContainerRef, Type } from '@angular/core';

/**
 * ViewportPortal 內容項目介面
 * 定義投影到 viewport 的內容類型
 */
export interface ViewportPortalItem {
  id: string;
  content: TemplateRef<any> | ComponentRef<any> | Type<any>;
  data?: any;
  isActive: boolean;
  priority?: number;
}

/**
 * ViewportPortal 服務
 * 
 * 管理投影到 viewport 座標系統的動態內容，提供類似 React Portal 的功能。
 * 支援動態註冊/登出內容、條件式渲染和響應式狀態管理。
 * 
 * 核心特性：
 * - Signal-based 響應式內容管理
 * - 支援 Template 和 Component 兩種內容類型
 * - 優先權排序和條件式渲染
 * - 生命週期自動管理
 * 
 * @example
 * ```typescript
 * // 註冊模板內容
 * const itemId = this.portalService.registerTemplate('devtools', templateRef, { nodeId: '1' });
 * 
 * // 啟用/停用內容
 * this.portalService.setItemActive(itemId, true);
 * 
 * // 登出內容
 * this.portalService.unregister(itemId);
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class ViewportPortalService {
  // 私有狀態
  private _items = signal<Map<string, ViewportPortalItem>>(new Map());
  private _nextId = 0;

  // 計算活躍內容項目（按優先權排序）
  activeItems = computed(() => {
    const items = this._items();
    return Array.from(items.values())
      .filter(item => item.isActive)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  });

  // 計算是否有任何活躍內容
  hasActiveContent = computed(() => this.activeItems().length > 0);

  /**
   * 註冊模板內容到 viewport portal
   * @param category 內容分類（如 'devtools', 'overlay' 等）
   * @param template 要投影的模板引用
   * @param data 傳遞給模板的資料
   * @param priority 優先權（數字越大優先權越高）
   * @returns 註冊項目的唯一 ID
   */
  registerTemplate(
    category: string,
    template: TemplateRef<any>,
    data?: any,
    priority: number = 0
  ): string {
    const id = this._generateId(category);
    const item: ViewportPortalItem = {
      id,
      content: template,
      data,
      isActive: true,
      priority,
    };

    this._items.update(items => new Map(items.set(id, item)));
    return id;
  }

  /**
   * 註冊元件內容到 viewport portal
   * @param category 內容分類
   * @param component 要投影的元件類型
   * @param data 傳遞給元件的資料
   * @param priority 優先權
   * @returns 註冊項目的唯一 ID
   */
  registerComponent<T>(
    category: string,
    component: Type<T>,
    data?: any,
    priority: number = 0
  ): string {
    const id = this._generateId(category);
    const item: ViewportPortalItem = {
      id,
      content: component,
      data,
      isActive: true,
      priority,
    };

    this._items.update(items => new Map(items.set(id, item)));
    return id;
  }

  /**
   * 設定項目的啟用狀態
   * @param id 項目 ID
   * @param active 是否啟用
   */
  setItemActive(id: string, active: boolean): void {
    this._items.update(items => {
      const newItems = new Map(items);
      const item = newItems.get(id);
      if (item) {
        newItems.set(id, { ...item, isActive: active });
      }
      return newItems;
    });
  }

  /**
   * 更新項目資料
   * @param id 項目 ID
   * @param data 新的資料
   */
  updateItemData(id: string, data: any): void {
    this._items.update(items => {
      const newItems = new Map(items);
      const item = newItems.get(id);
      if (item) {
        newItems.set(id, { ...item, data });
      }
      return newItems;
    });
  }

  /**
   * 登出內容項目
   * @param id 項目 ID
   */
  unregister(id: string): void {
    this._items.update(items => {
      const newItems = new Map(items);
      newItems.delete(id);
      return newItems;
    });
  }

  /**
   * 批次設定分類項目的啟用狀態
   * @param category 分類名稱
   * @param active 是否啟用
   */
  setCategoryActive(category: string, active: boolean): void {
    this._items.update(items => {
      const newItems = new Map(items);
      for (const [id, item] of newItems) {
        if (id.startsWith(category + '_')) {
          newItems.set(id, { ...item, isActive: active });
        }
      }
      return newItems;
    });
  }

  /**
   * 清除所有內容項目
   */
  clear(): void {
    this._items.set(new Map());
  }

  /**
   * 清除特定分類的項目
   * @param category 分類名稱
   */
  clearCategory(category: string): void {
    this._items.update(items => {
      const newItems = new Map(items);
      for (const id of newItems.keys()) {
        if (id.startsWith(category + '_')) {
          newItems.delete(id);
        }
      }
      return newItems;
    });
  }

  /**
   * 取得項目詳細資訊
   * @param id 項目 ID
   * @returns 項目資訊或 undefined
   */
  getItem(id: string): ViewportPortalItem | undefined {
    return this._items().get(id);
  }

  /**
   * 取得所有項目
   * @returns 所有項目的陣列
   */
  getAllItems(): ViewportPortalItem[] {
    return Array.from(this._items().values());
  }

  /**
   * 產生唯一 ID
   * @private
   */
  private _generateId(category: string): string {
    return `${category}_${++this._nextId}_${Date.now()}`;
  }
}