import {
  Component,
  input,
  signal,
  computed,
  viewChild,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  untracked,
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
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
 * 這個組件必須在 SVG 上下文中使用。
 *
 * @example
 * ```typescript
 * import { EdgeTextComponent } from './components/edges/edge-text/edge-text.component';
 *
 * @Component({
 *   template: `
 *     <svg:g angular-xyflow-edge-text
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
  selector: '[angular-xyflow-edge-text]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @if (label()) {
    <!-- 標籤背景（必須在文字前面） -->
    @if (labelShowBg()) {
    <svg:rect
      [attr.width]="bgWidth()"
      [attr.x]="bgX()"
      [attr.y]="bgY()"
      [attr.height]="bgHeight()"
      class="angular-xyflow__edge-textbg"
      [attr.style]="labelBgStyleString()"
      [attr.rx]="labelBgBorderRadius()"
      [attr.ry]="labelBgBorderRadius()"
    />
    }

    <!-- 標籤文字 -->
    <svg:text
      #edgeTextRef
      class="angular-xyflow__edge-text"
      [attr.x]="textX()"
      [attr.y]="textY()"
      dy="0.3em"
      text-anchor="middle"
      [attr.style]="labelStyleString()"
    >
      @if (hasMultipleLines()) {
      <!-- 多行文字使用 tspan -->
      @for (line of textLines(); track $index; let i = $index) {
      <svg:tspan [attr.x]="textX()" [attr.dy]="i === 0 ? '0' : '1.2em'">
        {{ line }}
      </svg:tspan>
      } } @else {
      <!-- 單行文字直接顯示 -->
      {{ label() }}
      }
    </svg:text>
    }
  `,
  host: {
    '[attr.transform]': 'transform()',
    '[class]': 'edgeTextClasses()',
    '[attr.visibility]': 'visibility()',
  },
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

  // 狀態 - 與 React 版本一致的初始值
  private edgeTextBbox = signal<Rect>({ x: 1, y: 0, width: 0, height: 0 });

  // 計算屬性
  edgeTextClasses = computed(() => {
    const baseClasses = ['angular-xyflow__edge-textwrapper'];
    const customClass = this.className();
    if (customClass) {
      baseClasses.push(customClass);
    }
    return baseClasses.join(' ');
  });

  // 檢查是否有多行文字
  hasMultipleLines = computed(() => {
    const label = this.label();
    if (typeof label === 'string') {
      return label.includes('\n');
    }
    return false;
  });

  // 分割文字為多行
  textLines = computed(() => {
    const label = this.label();
    if (typeof label === 'string') {
      return label.split('\n');
    }
    return [label?.toString() ?? ''];
  });

  transform = computed(() => {
    const bbox = this.edgeTextBbox();
    const x = this.x() - bbox.width / 2;
    const y = this.y() - bbox.height / 2;
    return `translate(${x} ${y})`;
  });

  // 使用 visibility 控制顯示
  visibility = computed(() => {
    const bbox = this.edgeTextBbox();
    // 當有寬度時顯示
    return bbox.width > 0 ? 'visible' : 'hidden';
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

  textX = computed(() => {
    const bbox = this.edgeTextBbox();
    return bbox.width / 2;
  });

  textY = computed(() => {
    const bbox = this.edgeTextBbox();
    // 單行和多行都使用相同的基準線
    return bbox.height / 2;
  });

  // 將樣式對象轉換為 CSS 字符串
  labelBgStyleString = computed(() => {
    const style = this.labelBgStyle();
    if (!style) return '';
    return (
      Object.entries(style)
        // 過濾掉 'color' 屬性，因為它不是 SVG rect 的有效屬性
        .filter(([key]) => key !== 'color')
        .map(
          ([key, value]) =>
            `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`
        )
        .join('; ')
    );
  });

  labelStyleString = computed(() => {
    const style = this.labelStyle();
    if (!style) return '';
    return Object.entries(style)
      .map(
        ([key, value]) =>
          `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`
      )
      .join('; ');
  });

  // 追蹤是否已經有待處理的測量
  private hasPendingMeasurement = false;

  constructor() {
    // 使用 afterRenderEffect 來響應 label 變化並測量
    // afterRenderEffect 會自動追蹤依賴並在渲染後執行
    afterRenderEffect(() => {
      const label = this.label();
      const textElement = this.edgeTextRef()?.nativeElement;
      
      if (textElement && label && !this.hasPendingMeasurement) {
        // 使用 untracked 避免建立不必要的依賴
        untracked(() => {
          // 標記有待處理的測量，避免重複觸發
          this.hasPendingMeasurement = true;
          
          // 延遲測量以確保 DOM 完全更新
          requestAnimationFrame(() => {
            try {
              // 等待字體載入完成
              if ('fonts' in document) {
                document.fonts.ready.then(() => {
                  this.measureTextElement(textElement);
                  this.hasPendingMeasurement = false;
                });
              } else {
                // 如果 fonts API 不可用，直接測量
                this.measureTextElement(textElement);
                this.hasPendingMeasurement = false;
              }
            } catch (error) {
              // 測量失敗時使用估算值
              this.estimateTextSize(label);
              this.hasPendingMeasurement = false;
            }
          });
        });
      }
    });

    // 初始測量 - 在下次渲染後執行一次
    afterNextRender({
      read: () => {
        untracked(() => {
          const textElement = this.edgeTextRef()?.nativeElement;
          const label = this.label();

          if (textElement && label) {
            // 等待字體載入
            if ('fonts' in document) {
              document.fonts.ready.then(() => {
                this.measureTextElement(textElement);
              });
            } else {
              this.measureTextElement(textElement);
            }
          }
        });
      }
    });
  }

  // 測量文字元素的輔助方法
  private measureTextElement(textElement: SVGTextElement) {
    try {
      const bbox = textElement.getBBox();
      const currentBbox = this.edgeTextBbox();

      // 使用容差來避免微小變化觸發更新
      const tolerance = 0.01;
      if (
        Math.abs(bbox.width - currentBbox.width) > tolerance ||
        Math.abs(bbox.height - currentBbox.height) > tolerance ||
        Math.abs(bbox.x - currentBbox.x) > tolerance ||
        Math.abs(bbox.y - currentBbox.y) > tolerance
      ) {
        this.edgeTextBbox.set({
          x: bbox.x,
          y: bbox.y,
          width: bbox.width,
          height: bbox.height,
        });
      }
    } catch (error) {
      console.warn('Failed to measure text element:', error);
      this.estimateTextSize(this.label());
    }
  }

  // 估算文字尺寸的輔助方法
  private estimateTextSize(label: string | number) {
    const labelStr = String(label);
    if (typeof labelStr === 'string') {
      const lines = labelStr.split('\n');
      const maxLineLength = Math.max(...lines.map((line) => line.length));
      const estimatedWidth = maxLineLength * 6; // 預估每字元寬度
      const estimatedHeight = lines.length * 12; // 預估行高

      this.edgeTextBbox.set({
        x: 0,
        y: 0,
        width: estimatedWidth,
        height: estimatedHeight,
      });
    }
  }

}
