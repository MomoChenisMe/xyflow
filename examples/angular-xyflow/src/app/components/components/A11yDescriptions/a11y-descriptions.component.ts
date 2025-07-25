import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

// Aria constants matching React Flow
export const ARIA_NODE_DESC_KEY = 'react-flow__node-desc';
export const ARIA_EDGE_DESC_KEY = 'react-flow__edge-desc';
export const ARIA_LIVE_MESSAGE = 'react-flow__aria-live';

/**
 * Aria label configuration interface
 */
export interface AriaLabelConfig {
  'node.a11yDescription.default'?: string;
  'node.a11yDescription.keyboardDisabled'?: string;
  'edge.a11yDescription.default'?: string;
}

/**
 * Default aria label configuration
 */
const defaultAriaLabelConfig: Required<AriaLabelConfig> = {
  'node.a11yDescription.default': 'Node',
  'node.a11yDescription.keyboardDisabled': 'Node (keyboard navigation disabled)',
  'edge.a11yDescription.default': 'Edge'
};

/**
 * AriaLiveMessage component for announcing dynamic content changes to screen readers
 */
@Component({
  selector: 'xy-aria-live-message',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      [id]="ariaLiveId()"
      aria-live="assertive" 
      aria-atomic="true" 
      [ngStyle]="ariaLiveStyle"
    >
      {{ ariaLiveMessage() }}
    </div>
  `,
  styles: []
})
export class AriaLiveMessage {
  /** React Flow 實例 ID - 必需輸入 */
  rfId = input.required<string>();
  
  /** 無障礙即時訊息 */
  ariaLiveMessage = input<string>();

  /** 計算屬性 - 無障礙即時區域 ID */
  ariaLiveId = computed(() => `${ARIA_LIVE_MESSAGE}-${this.rfId()}`);

  /** 視覺隱藏但對螢幕閱讀器可見的樣式 */
  readonly ariaLiveStyle = {
    position: 'absolute',
    width: '1px',
    height: '1px',
    margin: '-1px',
    border: '0',
    padding: '0',
    overflow: 'hidden',
    clip: 'rect(0px, 0px, 0px, 0px)',
    clipPath: 'inset(100%)',
  };
}

/**
 * A11yDescriptions 組件 - 為節點和邊緣提供無障礙描述
 * 
 * 這個組件使用最新的 Angular Signal API 實現，完全匹配 React Flow 的無障礙功能實現。
 * 提供螢幕閱讀器支援、鍵盤導航提示和即時訊息廣播功能。
 * 
 * @component
 * @selector xy-a11y-descriptions
 * @example
 * ```html
 * <xy-a11y-descriptions 
 *   [rfId]="flowId" 
 *   [disableKeyboardA11y]="false"
 *   [ariaLabelConfig]="customAriaConfig"
 *   [ariaLiveMessage]="currentMessage">
 * </xy-a11y-descriptions>
 * ```
 * 
 * @remarks 這個組件是無障礙功能的核心，確保視覺障礙用戶可以有效使用流程圖，
 * 包括節點和邊緣的描述、鍵盤導航支援等功能。
 */
@Component({
  selector: 'xy-a11y-descriptions',
  standalone: true,
  imports: [CommonModule, AriaLiveMessage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hidden node description for screen readers -->
    <div 
      [id]="nodeDescId()" 
      [ngStyle]="hiddenStyle"
    >
      {{ nodeDescription() }}
    </div>
    
    <!-- Hidden edge description for screen readers -->
    <div 
      [id]="edgeDescId()" 
      [ngStyle]="hiddenStyle"
    >
      {{ edgeDescription() }}
    </div>
    
    <!-- Aria live message region (only when keyboard a11y is enabled) -->
    @if (!disableKeyboardA11y()) {
      <xy-aria-live-message 
        [rfId]="rfId()" 
        [ariaLiveMessage]="ariaLiveMessage()">
      </xy-aria-live-message>
    }
  `,
  styles: []
})
export class A11yDescriptions {
  /** React Flow 實例 ID - 必需輸入 */
  rfId = input.required<string>();
  
  /** 是否禁用鍵盤無障礙功能 */
  disableKeyboardA11y = input<boolean>(false);
  
  /** 自訂無障礙標籤配置 */
  ariaLabelConfig = input<Partial<AriaLabelConfig>>({});
  
  /** 當前的無障礙即時訊息 */
  ariaLiveMessage = input<string>();

  /** 計算屬性 - 節點描述 ID */
  nodeDescId = computed(() => `${ARIA_NODE_DESC_KEY}-${this.rfId()}`);
  
  /** 計算屬性 - 邊緣描述 ID */
  edgeDescId = computed(() => `${ARIA_EDGE_DESC_KEY}-${this.rfId()}`);

  /** 計算屬性 - 有效的無障礙標籤配置 */
  effectiveAriaLabelConfig = computed(() => ({
    ...defaultAriaLabelConfig,
    ...this.ariaLabelConfig()
  }));

  /** 計算屬性 - 基於鍵盤無障礙狀態的節點描述 */
  nodeDescription = computed(() => {
    const config = this.effectiveAriaLabelConfig();
    return this.disableKeyboardA11y()
      ? config['node.a11yDescription.keyboardDisabled']
      : config['node.a11yDescription.default'];
  });

  /** 計算屬性 - 邊緣描述 */
  edgeDescription = computed(() => {
    const config = this.effectiveAriaLabelConfig();
    return config['edge.a11yDescription.default'];
  });

  /** 視覺隱藏但保持無障礙可訪問的樣式 */
  readonly hiddenStyle = {
    display: 'none'
  };
}