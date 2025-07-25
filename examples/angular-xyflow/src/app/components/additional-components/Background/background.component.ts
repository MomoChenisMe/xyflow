import { Component, computed, signal, inject, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA, input, effect, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { LinePattern, DotPattern } from './patterns.component'; // 暫時禁用
import { BackgroundVariant, BackgroundProps } from './background.types';

// 從 Angular Flow 狀態服務獲取 transform 和 rfId
// 這裡暫時使用 signal 作為示例，實際使用時需要從服務獲取
const defaultTransform = signal([0, 0, 1]);
const defaultRfId = signal('1');

const defaultSize = {
  [BackgroundVariant.Dots]: 1,
  [BackgroundVariant.Lines]: 1,
  [BackgroundVariant.Cross]: 6,
};

/**
 * Background 組件 - 提供節點編輯器常用的背景樣式
 * 
 * 這個組件使用最新的 Angular Signal API 實現，提供點狀、線狀和十字背景樣式。
 * 支持多個背景層疊使用，並能響應視圖變換(縮放、平移)進行適當的樣式調整。
 * 
 * @component
 * @selector xy-background
 * @example
 * ```html
 * <xy-background 
 *   variant="BackgroundVariant.Dots"
 *   [gap]="20"
 *   color="#ccc">
 * </xy-background>
 * ```
 */
@Component({
  selector: 'xy-background',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <svg
      #svgElement
      [class]="containerClass()"
      [ngStyle]="containerStyle()"
      [attr.data-testid]="'rf__background'"
    >
      <pattern
        [id]="patternId()"
        [attr.x]="patternX()"
        [attr.y]="patternY()"
        [attr.width]="scaledGap()[0]"
        [attr.height]="scaledGap()[1]"
        patternUnits="userSpaceOnUse"
        [attr.patternTransform]="patternTransform()"
      >
        @if (isDots()) {
          <circle 
            [attr.cx]="scaledGap()[0] / 2"
            [attr.cy]="scaledGap()[1] / 2"
            [attr.r]="scaledSize() / 2"
            [attr.class]="patternClassName()">
          </circle>
        } @else {
          <g [attr.class]="patternClassName()">
            <rect 
              [attr.width]="scaledGap()[0]" 
              [attr.height]="lineWidth()"
              [attr.fill]="patternColor()">
            </rect>
            <rect 
              [attr.width]="lineWidth()" 
              [attr.height]="scaledGap()[1]"
              [attr.fill]="patternColor()">
            </rect>
          </g>
        }
      </pattern>
      <rect x="0" y="0" width="100%" height="100%" [attr.fill]="fillUrl()" />
    </svg>
  `,
  styleUrls: ['./background.styles.css'],
  styles: [`
    :host {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      pointer-events: none;
    }
    
    svg {
      width: 100%;
      height: 100%;
    }
  `]
})
export class BackgroundComponent {
  /** 背景圖案唯一識別碼 */
  id = input<string | undefined>();
  
  /** 背景變化類型 - Dots, Lines, Cross */
  variant = input<BackgroundVariant>(BackgroundVariant.Dots);
  
  /** 圖案間距 - 可以是單一數值或 [x, y] 數組 */
  gap = input<number | [number, number]>(20);
  
  /** 圖案大小(僅適用於點和十字圖案) */
  size = input<number | undefined>();
  
  /** 線條寬度(僅適用於線和十字圖案) */
  lineWidth = input<number>(1);
  
  /** 圖案偏移 - 可以是單一數值或 [x, y] 數組 */
  offset = input<number | [number, number]>(0);
  
  /** 圖案顏色 */
  color = input<string | undefined>();
  
  /** 背景顏色 */
  bgColor = input<string | undefined>();
  
  /** 內聯樣式 */
  style = input<{ [key: string]: any } | undefined>();
  
  /** CSS 類名 */
  className = input<string | undefined>();
  
  /** 圖案元素的 CSS 類名 */
  patternClassName = input<string | undefined>();
  
  /** 視圖變換參數 [x, y, zoom] - 這些需要從 Angular Flow 服務注入 */
  transform = input<[number, number, number]>([0, 0, 1]);
  
  /** Flow 實例 ID */
  rfId = input<string>('1');
  
  /** SVG 元素引用 */
  svgElement = viewChild<ElementRef<SVGSVGElement>>('svgElement');

  /** 計算屬性 - 圖案大小 */
  patternSize = computed(() => this.size() || defaultSize[this.variant()]);
  
  /** 計算屬性 - 是否為點狀圖案 */
  isDots = computed(() => this.variant() === BackgroundVariant.Dots);
  
  /** 計算屬性 - 是否為十字圖案 */
  isCross = computed(() => this.variant() === BackgroundVariant.Cross);
  
  /** 計算屬性 - 間距的 [x, y] 數組 */
  gapXY = computed(() => {
    const gap = this.gap();
    return Array.isArray(gap) ? gap : [gap, gap] as [number, number];
  });
  
  /** 計算屬性 - 縮放後的間距 */
  scaledGap = computed(() => {
    const gap = this.gapXY();
    const transform = this.transform();
    return [gap[0] * transform[2] || 1, gap[1] * transform[2] || 1] as [number, number];
  });
  
  /** 計算屬性 - 縮放後的大小 */
  scaledSize = computed(() => this.patternSize() * this.transform()[2]);
  
  /** 計算屬性 - 偏移的 [x, y] 數組 */
  offsetXY = computed(() => {
    const offset = this.offset();
    return Array.isArray(offset) ? offset : [offset, offset] as [number, number];
  });
  
  /** 計算屬性 - 圖案尺寸 */
  patternDimensions = computed(() => {
    const scaledGap = this.scaledGap();
    const scaledSize = this.scaledSize();
    return this.isCross() ? [scaledSize, scaledSize] : scaledGap;
  });
  
  /** 計算屬性 - 縮放後的偏移 */
  scaledOffset = computed(() => {
    const offsetXY = this.offsetXY();
    const patternDimensions = this.patternDimensions();
    const transform = this.transform();
    return [
      offsetXY[0] * transform[2] || 1 + patternDimensions[0] / 2,
      offsetXY[1] * transform[2] || 1 + patternDimensions[1] / 2,
    ] as [number, number];
  });

  /** 計算屬性 - 圖案 ID */
  patternId = computed(() => {
    const rfId = this.rfId();
    const id = this.id();
    return `pattern-${rfId}${id ? id : ''}`;
  });
  
  /** 計算屬性 - 圖案 X 偏移 */
  patternX = computed(() => this.transform()[0] % this.scaledGap()[0]);
  
  /** 計算屬性 - 圖案 Y 偏移 */
  patternY = computed(() => this.transform()[1] % this.scaledGap()[1]);
  
  /** 計算屬性 - 圖案變換字符串 */
  patternTransform = computed(() => {
    const offset = this.scaledOffset();
    return `translate(-${offset[0]},-${offset[1]})`;
  });
  
  /** 計算屬性 - 填充 URL */
  fillUrl = computed(() => `url(#${this.patternId()})`);
  
  /** 計算屬性 - 圖案顏色 */
  patternColor = computed(() => this.color() || 'var(--xy-background-pattern-color, #e2e8f0)');
  
  /** 計算屬性 - 容器 CSS 類名 */
  containerClass = computed(() => {
    const classes = ['react-flow__background'];
    const className = this.className();
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  });
  
  /** 計算屬性 - 容器樣式 */
  containerStyle = computed(() => {
    const dynamicStyle: { [key: string]: any } = {};
    const bgColor = this.bgColor();
    const color = this.color();
    const style = this.style();
    
    if (bgColor) {
      dynamicStyle['--xy-background-color-props'] = bgColor;
    }
    
    if (color) {
      dynamicStyle['--xy-background-pattern-color-props'] = color;
    }
    
    return {
      ...dynamicStyle,
      ...style
    };
  });
}