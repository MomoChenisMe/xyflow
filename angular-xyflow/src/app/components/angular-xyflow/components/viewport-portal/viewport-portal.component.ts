import { 
  Component, 
  ChangeDetectionStrategy, 
  OnInit, 
  OnDestroy, 
  inject,
  TemplateRef,
  viewChild
} from '@angular/core';
import { ViewportPortalService } from '../../services/viewport-portal.service';

/**
 * ViewportPortal 組件
 * 
 * 完全模擬 React Flow 的 ViewportPortal 行為。
 * 此組件將其內容註冊到 ViewportPortalService，
 * 然後由 ViewportComponent 將內容渲染到 viewport 內的 portal 容器中。
 * 
 * 使用方式：
 * ```html
 * <angular-xyflow-viewport-portal>
 *   <div>這個內容會在 viewport 座標系統中渲染</div>
 * </angular-xyflow-viewport-portal>
 * ```
 */
@Component({
  selector: 'angular-xyflow-viewport-portal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 🔑 關鍵：捕獲內容作為模板，不在此處渲染 -->
    <ng-template #contentTemplate>
      <ng-content></ng-content>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: none; /* 隱藏原始位置，內容會在viewport portal中顯示 */
      }
    `,
  ],
})
export class ViewportPortalComponent implements OnInit, OnDestroy {
  private _portalService = inject(ViewportPortalService);
  
  // 捕獲投影內容的模板引用
  contentTemplate = viewChild.required<TemplateRef<any>>('contentTemplate');
  
  private _itemId?: string;

  ngOnInit() {
    // 🔑 關鍵：將內容註冊到 ViewportPortalService
    const template = this.contentTemplate();
    this._itemId = this._portalService.registerTemplate(
      'viewport-portal',  // 類別
      template,          // 模板引用
      null,             // 資料
      0                 // 優先權
    );
  }

  ngOnDestroy() {
    // 清理註冊的內容
    if (this._itemId) {
      this._portalService.unregister(this._itemId);
    }
  }
}