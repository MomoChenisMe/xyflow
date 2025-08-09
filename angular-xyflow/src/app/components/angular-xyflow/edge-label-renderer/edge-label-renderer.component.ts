import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  TemplateRef,
  viewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EdgeLabelRendererService } from '../services/edge-label-renderer.service';

/**
 * EdgeLabelRenderer 組件
 * 
 * 提供在 HTML 層渲染邊標籤的能力，使其可以包含互動式 HTML 元素。
 * 類似 React 的 Portal 功能，將內容渲染到獨立的 HTML 層而非 SVG 內部。
 * 
 * @example
 * ```html
 * <angular-xyflow-edge-label-renderer>
 *   <ng-template>
 *     <div style="position: absolute; transform: translate(100px, 100px)">
 *       <input type="text" />
 *       <button>Click me</button>
 *     </div>
 *   </ng-template>
 * </angular-xyflow-edge-label-renderer>
 * ```
 */
@Component({
  selector: 'angular-xyflow-edge-label-renderer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #labelTemplate>
      <ng-content></ng-content>
    </ng-template>
  `,
  styles: [`
    :host {
      display: none; /* 組件本身不顯示，內容會被渲染到其他地方 */
    }
  `]
})
export class EdgeLabelRendererComponent implements OnInit, OnDestroy {
  // 使用 Angular 20 的 viewChild Signal API
  labelTemplate = viewChild.required<TemplateRef<any>>('labelTemplate');
  
  private edgeLabelService = inject(EdgeLabelRendererService);
  private labelId = `edge-label-${Math.random().toString(36).substring(2, 11)}`;

  ngOnInit(): void {
    // 註冊標籤模板到服務
    // 如果容器尚未初始化，服務會將其加入待處理隊列
    this.edgeLabelService.registerLabel(this.labelId, this.labelTemplate());
  }

  ngOnDestroy(): void {
    // 清理註冊的標籤
    this.edgeLabelService.unregisterLabel(this.labelId);
  }
}