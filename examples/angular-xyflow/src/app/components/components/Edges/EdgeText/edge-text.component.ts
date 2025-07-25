import {
  Component,
  input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  signal,
  computed,
  ViewChild,
  ElementRef,
  effect,
  NO_ERRORS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EdgeTextProps } from '../edges.types';

/**
 * 矩形邊界框接口 - 模擬 @xyflow/system 的 Rect
 */
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * EdgeText - Angular equivalent of React EdgeText component
 * 
 * 邊緣文字組件 - 用於在自定義邊緣中顯示文字的輔助組件
 * 這個組件可以自動計算文字邊界框並提供背景顯示功能
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <xy-edge-text
 *       [x]="100"
 *       [y]="100"
 *       [label]="label"
 *       [labelStyle]="{ fill: 'white' }"
 *       [labelShowBg]="true"
 *       [labelBgStyle]="{ fill: 'red' }"
 *       [labelBgPadding]="[2, 4]"
 *       [labelBgBorderRadius]="2">
 *     </xy-edge-text>
 *   `
 * })
 * export class CustomEdgeLabelComponent {
 *   label = 'Custom Label';
 * }
 * ```
 */
@Component({
  selector: 'xy-edge-text',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    @if (label()) {
      <g
        [attr.transform]="transform()"
        [class]="edgeTextClasses()"
        [attr.visibility]="visibility()"
        [attr.data-testid]="'rf__edge-text'">
        
        <!-- 背景矩形 -->
        @if (labelShowBg() && edgeTextBbox().width > 0) {
          <rect
            [attr.width]="bgWidth()"
            [attr.x]="bgX()"
            [attr.y]="bgY()"
            [attr.height]="bgHeight()"
            [attr.rx]="labelBgBorderRadius()"
            [attr.ry]="labelBgBorderRadius()"
            [style]="labelBgStyle()"
            class="react-flow__edge-textbg">
          </rect>
        }
        
        <!-- 文字元素 -->
        <text
          #edgeTextRef
          [attr.y]="textY()"
          [attr.dy]="'0.3em'"
          [style]="labelStyle()"
          class="react-flow__edge-text">
          {{ label() }}
        </text>
        
        <!-- 額外內容插槽 -->
        <ng-content></ng-content>
      </g>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }
    
    .react-flow__edge-textwrapper {
      pointer-events: all;
    }
    
    .react-flow__edge-text {
      font-size: 10px;
      text-anchor: middle;
      user-select: none;
      pointer-events: none;
    }
    
    .react-flow__edge-textbg {
      fill: #ffffff;
      stroke-width: 0;
    }
  `]
})
export class EdgeTextComponent implements OnInit, OnChanges {
  x = input.required<number>();
  y = input.required<number>();
  label = input<string>();
  labelStyle = input<any>();
  labelShowBg = input<boolean>(true);
  labelBgStyle = input<any>();
  labelBgPadding = input<[number, number]>([2, 4]);
  labelBgBorderRadius = input<number>(2);
  className = input<string>();

  @ViewChild('edgeTextRef', { static: false }) edgeTextRef?: ElementRef<SVGTextElement>;

  // 邊界框信號
  protected edgeTextBbox = signal<Rect>({ x: 1, y: 0, width: 0, height: 0 });

  // 計算屬性
  edgeTextClasses = computed(() => {
    const classes = ['react-flow__edge-textwrapper'];
    if (this.className()) {
      classes.push(this.className()!);
    }
    return classes.join(' ');
  });

  // 變換屬性
  transform = computed(() => {
    const bbox = this.edgeTextBbox();
    return `translate(${this.x() - bbox.width / 2} ${this.y() - bbox.height / 2})`;
  });

  // 可見性
  visibility = computed(() => {
    return this.edgeTextBbox().width ? 'visible' : 'hidden';
  });

  // 背景尺寸和位置
  bgWidth = computed(() => {
    return this.edgeTextBbox().width + 2 * this.labelBgPadding()[0];
  });

  bgHeight = computed(() => {
    return this.edgeTextBbox().height + 2 * this.labelBgPadding()[1];
  });

  bgX = computed(() => {
    return -this.labelBgPadding()[0];
  });

  bgY = computed(() => {
    return -this.labelBgPadding()[1];
  });

  // 文字 Y 位置
  textY = computed(() => {
    return this.edgeTextBbox().height / 2;
  });

  constructor() {
    // 監聽標籤變化，更新邊界框
    effect(() => {
      if (this.label()) {
        // 延遲計算邊界框，確保 DOM 已更新
        setTimeout(() => this.updateBbox(), 0);
      }
    });
  }

  ngOnInit() {
    this.updateBbox();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['label']) {
      // 標籤改變時，延遲更新邊界框
      setTimeout(() => this.updateBbox(), 0);
    }
  }

  /**
   * 更新文字邊界框
   */
  private updateBbox() {
    if (this.edgeTextRef?.nativeElement && this.label()) {
      try {
        const textBbox = this.edgeTextRef.nativeElement.getBBox();
        
        this.edgeTextBbox.set({
          x: textBbox.x,
          y: textBbox.y,
          width: textBbox.width,
          height: textBbox.height,
        });
      } catch (error) {
        // getBBox 可能在某些情況下失敗，使用默認值
        this.edgeTextBbox.set({
          x: 0,
          y: 0,
          width: this.label()!.length * 6, // 估算寬度
          height: 12, // 估算高度
        });
      }
    } else {
      this.edgeTextBbox.set({ x: 1, y: 0, width: 0, height: 0 });
    }
  }
}