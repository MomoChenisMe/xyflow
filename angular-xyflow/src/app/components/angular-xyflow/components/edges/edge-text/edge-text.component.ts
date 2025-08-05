import { Component, input, signal, computed, viewChild, ElementRef, afterRenderEffect, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface EdgeTextProps {
  x: number;
  y: number;
  label: string | number;
  labelStyle?: Record<string, any>;
  labelShowBg?: boolean;
  labelBgStyle?: Record<string, any>;
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;
  className?: string;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * EdgeText 組件可以作為輔助組件在自定義邊中顯示文字。
 * 
 * @example
 * ```typescript
 * import { EdgeTextComponent } from './components/edges/edge-text/edge-text.component';
 * 
 * @Component({
 *   template: `
 *     <app-edge-text
 *       [x]="100"
 *       [y]="100"
 *       [label]="label"
 *       [labelStyle]="{ fill: 'white' }"
 *       [labelShowBg]="true"
 *       [labelBgStyle]="{ fill: 'red' }"
 *       [labelBgPadding]="[2, 4]"
 *       [labelBgBorderRadius]="2" />
 *   `
 * })
 * export class CustomEdgeLabelComponent {
 *   label = 'Custom Label';
 * }
 * ```
 */
@Component({
  selector: 'app-edge-text',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @if (label()) {
      <svg:g 
        [attr.transform]="transform()"
        [class]="edgeTextClasses()"
        [attr.visibility]="visibility()">
        
        <!-- 標籤背景 -->
        @if (labelShowBg()) {
          <svg:rect
            [attr.width]="bgWidth()"
            [attr.x]="bgX()"
            [attr.y]="bgY()"
            [attr.height]="bgHeight()"
            class="angular-xyflow__edge-textbg"
            [attr.style]="labelBgStyleString()"
            [attr.rx]="labelBgBorderRadius()"
            [attr.ry]="labelBgBorderRadius()" />
        }
        
        <!-- 標籤文字 -->
        <svg:text
          #edgeTextRef
          class="angular-xyflow__edge-text"
          [attr.y]="textY()"
          dy="0.3em"
          [attr.style]="labelStyleString()">
          {{ label() }}
        </svg:text>
      </svg:g>
    }
  `
})
export class EdgeTextComponent {
  // 輸入屬性
  x = input.required<number>();
  y = input.required<number>();
  label = input.required<string | number>();
  labelStyle = input<Record<string, any>>();
  labelShowBg = input<boolean>(true);
  labelBgStyle = input<Record<string, any>>();
  labelBgPadding = input<[number, number]>([2, 4]);
  labelBgBorderRadius = input<number>(2);
  className = input<string>();

  // 視圖查詢
  edgeTextRef = viewChild<ElementRef<SVGTextElement>>('edgeTextRef');

  // 狀態
  private edgeTextBbox = signal<Rect>({ x: 0, y: 0, width: 0, height: 0 });

  // 計算屬性
  edgeTextClasses = computed(() => {
    const baseClasses = ['angular-xyflow__edge-textwrapper'];
    const customClass = this.className();
    if (customClass) {
      baseClasses.push(customClass);
    }
    return baseClasses.join(' ');
  });

  transform = computed(() => {
    const bbox = this.edgeTextBbox();
    const x = this.x() - bbox.width / 2;
    const y = this.y() - bbox.height / 2;
    return `translate(${x} ${y})`;
  });

  visibility = computed(() => {
    const bbox = this.edgeTextBbox();
    return bbox.width ? 'visible' : 'hidden';
  });

  bgWidth = computed(() => {
    const bbox = this.edgeTextBbox();
    const padding = this.labelBgPadding();
    return bbox.width + 2 * padding[0];
  });

  bgHeight = computed(() => {
    const bbox = this.edgeTextBbox();
    const padding = this.labelBgPadding();
    return bbox.height + 2 * padding[1];
  });

  bgX = computed(() => {
    const padding = this.labelBgPadding();
    return -padding[0];
  });

  bgY = computed(() => {
    const padding = this.labelBgPadding();
    return -padding[1];
  });

  textY = computed(() => {
    const bbox = this.edgeTextBbox();
    return bbox.height / 2;
  });

  // 將樣式對象轉換為 CSS 字符串
  labelBgStyleString = computed(() => {
    const style = this.labelBgStyle();
    if (!style) return '';
    return Object.entries(style)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ');
  });

  labelStyleString = computed(() => {
    const style = this.labelStyle();
    if (!style) return '';
    return Object.entries(style)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ');
  });

  constructor() {
    // 監聽標籤變化以更新邊界框
    afterRenderEffect(() => {
      const textElement = this.edgeTextRef()?.nativeElement;
      const label = this.label(); // 確保響應 label 變化
      
      if (textElement) {
        try {
          const textBbox = textElement.getBBox();
          this.edgeTextBbox.set({
            x: textBbox.x,
            y: textBbox.y,
            width: textBbox.width,
            height: textBbox.height,
          });
        } catch (error) {
          // 如果 getBBox() 失敗（例如元素不可見），使用默認值
          this.edgeTextBbox.set({ x: 0, y: 0, width: 0, height: 0 });
        }
      }
    });
  }
}