import {
  Component,
  input,
  ChangeDetectionStrategy,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelProps, PanelPosition } from './panel.types';

/**
 * Panel - Angular equivalent of React Panel component
 * 
 * 面板組件 - 幫助你在視口上方定位內容
 * 用於內部的 MiniMap 和 Controls 組件，也可以單獨使用
 * 
 * 支持六個預定位置：
 * - top-left, top-center, top-right
 * - bottom-left, bottom-center, bottom-right
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <xy-panel position="top-left">頂部左側</xy-panel>
 *     <xy-panel position="top-center">頂部中央</xy-panel>
 *     <xy-panel position="top-right">頂部右側</xy-panel>
 *     <xy-panel position="bottom-left">底部左側</xy-panel>
 *     <xy-panel position="bottom-center">底部中央</xy-panel>
 *     <xy-panel position="bottom-right">底部右側</xy-panel>
 *   `
 * })
 * export class FlowComponent {}
 * ```
 */
@Component({
  selector: 'xy-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      [class]="panelClasses()"
      [style]="style()"
      [attr.data-testid]="'rf__panel-' + position()">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .react-flow__panel {
      position: absolute;
      z-index: 5;
      margin: 15px;
    }
    
    /* 頂部位置 */
    .react-flow__panel.top {
      top: 0;
    }
    
    /* 底部位置 */
    .react-flow__panel.bottom {
      bottom: 0;
    }
    
    /* 左側位置 */
    .react-flow__panel.left {
      left: 0;
    }
    
    /* 右側位置 */
    .react-flow__panel.right {
      right: 0;
    }
    
    /* 中央位置 */
    .react-flow__panel.center {
      left: 50%;
      transform: translateX(-50%);
    }
    
    /* 組合位置樣式 */
    .react-flow__panel.top.left {
      top: 0;
      left: 0;
    }
    
    .react-flow__panel.top.center {
      top: 0;
      left: 50%;
      transform: translateX(-50%);
    }
    
    .react-flow__panel.top.right {
      top: 0;
      right: 0;
    }
    
    .react-flow__panel.bottom.left {
      bottom: 0;
      left: 0;
    }
    
    .react-flow__panel.bottom.center {
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
    }
    
    .react-flow__panel.bottom.right {
      bottom: 0;
      right: 0;
    }
    
    /* 響應式設計 */
    @media screen and (max-width: 768px) {
      .react-flow__panel {
        margin: 10px;
      }
    }
    
    @media screen and (max-width: 480px) {
      .react-flow__panel {
        margin: 5px;
      }
    }
  `]
})
export class PanelComponent {
  position = input<PanelPosition>('top-left');
  className = input<string>();
  style = input<any>();

  // 計算面板 CSS 類名
  panelClasses = computed(() => {
    const baseClasses = ['react-flow__panel'];
    
    // 添加自定義類名
    const className = this.className();
    if (className) {
      baseClasses.push(className);
    }
    
    // 解析位置並添加對應的類名
    const position = this.position();
    const positionClasses = position.split('-');
    baseClasses.push(...positionClasses);
    
    return baseClasses.join(' ');
  });
}