import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Panel } from '../../additional-components/Controls/panel.component';
import { PanelPosition } from '../../additional-components/Controls/controls.types';

/**
 * Pro options interface
 */
export interface ProOptions {
  /** Hide the React Flow attribution */
  hideAttribution?: boolean;
  /** Other pro options... */
  [key: string]: any;
}

/**
 * Attribution component props
 */
export interface AttributionProps {
  /** Pro options configuration */
  proOptions?: ProOptions;
  /** Position of the attribution panel */
  position?: PanelPosition;
}

/**
 * Attribution 組件 - 顯示 React Flow 歸屬連結
 * 
 * 這個組件使用最新的 Angular Signal API 實現，完全匹配 React Flow 的歸屬實現。
 * 提供可配置的歸屬顯示，支持 Pro 版本的隱藏功能。
 * 
 * @component
 * @selector xy-attribution
 * @example
 * ```html
 * <xy-attribution 
 *   [proOptions]="proConfig" 
 *   [position]="PanelPosition.BottomRight">
 * </xy-attribution>
 * ```
 * 
 * @remarks 歸屬組件是 React Flow 開源許可的一部分，只有 Pro 版本用戶才能隱藏。
 * 這是對開源社區和開發者的支持表現。
 */
@Component({
  selector: 'xy-attribution',
  standalone: true,
  imports: [CommonModule, Panel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (shouldShowAttribution()) {
      <xy-panel
        [position]="position()"
        className="react-flow__attribution"
        [attr.data-message]="attributionMessage"
      >
        <a 
          href="https://reactflow.dev" 
          target="_blank" 
          rel="noopener noreferrer" 
          aria-label="React Flow attribution"
        >
          React Flow
        </a>
      </xy-panel>
    }
  `,
  styles: [`
    .react-flow__attribution {
      font-size: 10px;
      background: var(--xy-attribution-background-color, var(--xy-attribution-background-color-default));
      padding: 2px 3px;
      margin: 0;
    }
    
    .react-flow__attribution a {
      text-decoration: none;
      color: #999;
    }
    
    .react-flow__attribution a:hover {
      color: #666;
    }
  `]
})
export class Attribution {
  /** Pro 選項配置 */
  proOptions = input<ProOptions>();
  
  /** 歸屬面板的位置 */
  position = input<PanelPosition>(PanelPosition.BottomRight);

  /** 計算屬性 - 是否應該顯示歸屬 */
  shouldShowAttribution = computed(() => {
    const proOptions = this.proOptions();
    return !proOptions?.hideAttribution;
  });

  /** Pro 用戶的歸屬訊息 */
  readonly attributionMessage = 'Please only hide this attribution when you are subscribed to React Flow Pro: https://pro.reactflow.dev';
}