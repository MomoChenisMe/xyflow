import { Directive } from '@angular/core';

/**
 * ViewportPortal 指令
 * 
 * 用於標記需要渲染在 viewport 座標系統中的內容。
 * 被標記的元素會被投影到 viewport 中，並跟隨縮放和平移。
 * 
 * @example
 * ```html
 * <angular-xyflow>
 *   <div viewportPortal>
 *     <div style="position: absolute; transform: translate(100px, 100px)">
 *       這個內容會在 flow 座標系統的 [100, 100] 位置
 *     </div>
 *   </div>
 * </angular-xyflow>
 * ```
 */
@Directive({
  selector: '[viewportPortal]',
  standalone: true,
})
export class ViewportPortalDirective {
  // 這個指令主要是作為標記使用，實際的投影邏輯在 viewport.component.ts 中處理
}