import { Directive, Input, TemplateRef, inject, OnInit, OnDestroy, OnChanges, SimpleChanges, ElementRef, Optional } from '@angular/core';
import { ViewportPortalService } from '../services/viewport-portal.service';

/**
 * ViewportPortal 指令
 * 
 * 用於標記需要渲染在 viewport 座標系統中的內容。
 * 被標記的元素會被投影到 viewport 中，並跟隨縮放和平移。
 * 
 * 新版本支援：
 * - 自動註冊到 ViewportPortal 服務
 * - 動態啟用/停用
 * - 優先權控制
 * - 生命週期自動管理
 * 
 * @example
 * ```html
 * <angular-xyflow>
 *   <ng-template viewportPortal="devtools" [priority]="10" [data]="nodeData">
 *     <div style="position: absolute; transform: translate(100px, 100px)">
 *       這個內容會在 flow 座標系統的 [100, 100] 位置
 *     </div>
 *   </ng-template>
 * </angular-xyflow>
 * ```
 */
@Directive({
  selector: '[viewportPortal]',
  standalone: true,
})
export class ViewportPortalDirective implements OnInit, OnDestroy, OnChanges {
  // 內容分類，用於管理和分組
  @Input('viewportPortal') category = 'default';
  
  // 優先權，數字越大優先權越高
  @Input() priority = 0;
  
  // 傳遞給模板的資料
  @Input() data: any;
  
  // 是否啟用（預設為 true）
  @Input() enabled = true;

  // 注入依賴
  private _portalService = inject(ViewportPortalService);
  private _templateRef = inject(TemplateRef, { optional: true });
  private _elementRef = inject(ElementRef, { optional: true });
  
  // 註冊的項目 ID
  private _itemId?: string;

  ngOnInit(): void {
    // 自動註冊模板到 ViewportPortal 服務
    if (this._templateRef) {
      this._itemId = this._portalService.registerTemplate(
        this.category,
        this._templateRef,
        this.data,
        this.priority
      );
    } else {
      console.warn('ViewportPortalDirective: TemplateRef not found. This directive should be used on ng-template elements.');
    }

    // 設定初始啟用狀態
    if (this._itemId) {
      this._portalService.setItemActive(this._itemId, this.enabled);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // 監聽 enabled 狀態變化
    if (changes['enabled'] && this._itemId) {
      this._portalService.setItemActive(this._itemId, this.enabled);
    }
    
    // 監聽 data 變化
    if (changes['data'] && this._itemId) {
      this._portalService.updateItemData(this._itemId, this.data);
    }
  }
  
  ngOnDestroy(): void {
    // 自動登出註冊的內容
    if (this._itemId) {
      this._portalService.unregister(this._itemId);
    }
  }

  /**
   * 更新啟用狀態
   * @param enabled 是否啟用
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this._itemId) {
      this._portalService.setItemActive(this._itemId, enabled);
    }
  }

  /**
   * 更新資料
   * @param data 新的資料
   */
  updateData(data: any): void {
    this.data = data;
    if (this._itemId) {
      this._portalService.updateItemData(this._itemId, data);
    }
  }

  /**
   * 取得註冊的項目 ID
   */
  get itemId(): string | undefined {
    return this._itemId;
  }
}