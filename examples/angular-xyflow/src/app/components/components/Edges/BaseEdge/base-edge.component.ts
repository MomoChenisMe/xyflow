import {
  Component,
  input,
  ChangeDetectionStrategy,
  computed,
  NO_ERRORS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EdgeTextComponent } from '../EdgeText/edge-text.component';
import { BaseEdgeProps } from '../edges.types';

/**
 * Mock isNumeric function - 模擬 @xyflow/system 的 isNumeric
 */
function isNumeric(value: any): boolean {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * BaseEdge - Angular equivalent of React BaseEdge component
 * 
 * 基礎邊緣組件 - 所有邊緣類型的核心組件
 * 處理隱形的輔助邊緣和邊緣標籤顯示
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <xy-base-edge 
 *       [path]="edgePath" 
 *       [labelX]="labelX"
 *       [labelY]="labelY"
 *       [label]="label"
 *       [markerEnd]="markerEnd">
 *     </xy-base-edge>
 *   `
 * })
 * export class CustomEdgeComponent {
 *   edgePath = 'M 100,100 L 200,200';
 *   labelX = 150;
 *   labelY = 150;
 *   label = 'Custom Edge';
 * }
 * ```
 * 
 * @remarks 如果要在 BaseEdge 組件中使用邊緣標記，可以將傳遞給自定義邊緣的
 * markerStart 或 markerEnd 屬性傳遞給 BaseEdge 組件
 */
@Component({
  selector: 'xy-base-edge',
  standalone: true,
  imports: [CommonModule, EdgeTextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <!-- 主要邊緣路徑 -->
    <path
      [attr.d]="path()"
      [attr.fill]="'none'"
      [class]="edgePathClasses()"
      [style]="style()"
      [attr.stroke]="stroke()"
      [attr.stroke-width]="strokeWidth()"
      [attr.stroke-dasharray]="strokeDasharray()"
      [attr.marker-start]="markerStart()"
      [attr.marker-end]="markerEnd()"
      [attr.data-testid]="'rf__edge-path'">
    </path>
    
    <!-- 隱形交互區域 -->
    @if (interactionWidth()) {
      <path
        [attr.d]="path()"
        [attr.fill]="'none'"
        [attr.stroke-opacity]="0"
        [attr.stroke-width]="interactionWidth()"
        class="react-flow__edge-interaction"
        [attr.data-testid]="'rf__edge-interaction'">
      </path>
    }
    
    <!-- 邊緣標籤 -->
    @if (shouldShowLabel()) {
      <xy-edge-text
        [x]="labelX()!"
        [y]="labelY()!"
        [label]="label()"
        [labelStyle]="labelStyle()"
        [labelShowBg]="labelShowBg() ?? true"
        [labelBgStyle]="labelBgStyle()"
        [labelBgPadding]="labelBgPadding() ?? [2, 4]"
        [labelBgBorderRadius]="labelBgBorderRadius() ?? 2">
      </xy-edge-text>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }
    
    .react-flow__edge-path {
      fill: none;
      stroke-width: 1;
      stroke: #b1b1b7;
    }
    
    .react-flow__edge-path.selected {
      stroke: #555;
    }
    
    .react-flow__edge-path.animated {
      stroke-dasharray: 5;
      animation: dashdraw 0.5s linear infinite;
    }
    
    .react-flow__edge-interaction {
      fill: none;
      stroke-opacity: 0;
      stroke-width: 20;
      cursor: pointer;
    }
    
    @keyframes dashdraw {
      from {
        stroke-dashoffset: 10;
      }
    }
  `]
})
export class BaseEdgeComponent {
  /** 邊緣唯一標識符 */
  id = input.required<string>();
  /** SVG 路徑字符串 */
  path = input.required<string>();
  /** 源點 X 坐標 */
  sourceX = input.required<number>();
  /** 源點 Y 坐標 */
  sourceY = input.required<number>();
  /** 目標點 X 坐標 */
  targetX = input.required<number>();
  /** 目標點 Y 坐標 */
  targetY = input.required<number>();
  /** 源點位置 */
  sourcePosition = input<any>();
  /** 目標點位置 */
  targetPosition = input<any>();
  /** 邊緣數據 */
  data = input<any>();
  /** 邊緣樣式 */
  style = input<any>();
  /** 是否選中 */
  selected = input<boolean>();
  /** 是否動畫 */
  animated = input<boolean>();
  /** 標籤文本 */
  label = input<string>();
  /** 標籤樣式 */
  labelStyle = input<any>();
  /** 是否顯示標籤背景 */
  labelShowBg = input<boolean>();
  /** 標籤背景樣式 */
  labelBgStyle = input<any>();
  /** 標籤背景內邊距 */
  labelBgPadding = input<[number, number]>();
  /** 標籤背景邊框半徑 */
  labelBgBorderRadius = input<number>();
  /** 交互區域寬度 */
  interactionWidth = input<number>(20);
  /** 起始標記 */
  markerStart = input<string>();
  /** 結束標記 */
  markerEnd = input<string>();
  
  // 額外的樣式屬性
  /** CSS 類名 */
  className = input<string>();
  /** 描邊顏色 */
  stroke = input<string>();
  /** 描邊寬度 */
  strokeWidth = input<number | string>();
  /** 描邊虛線樣式 */
  strokeDasharray = input<string>();
  /** 標籤 X 坐標 */
  labelX = input<number>();
  /** 標籤 Y 坐標 */
  labelY = input<number>();

  // 計算 CSS 類名
  edgePathClasses = computed(() => {
    const classes = ['react-flow__edge-path'];
    
    const className = this.className();
    if (className) {
      classes.push(className);
    }
    
    if (this.selected()) {
      classes.push('selected');
    }
    
    if (this.animated()) {
      classes.push('animated');
    }
    
    return classes.join(' ');
  });

  // 判斷是否顯示標籤
  shouldShowLabel = computed(() => {
    return this.label() && 
           isNumeric(this.labelX()) && 
           isNumeric(this.labelY());
  });
}