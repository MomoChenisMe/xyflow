import {
  Component,
  input,
  computed,
  output,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { isNumeric } from '@xyflow/system';
import { EdgeTextComponent } from '../edge-text/edge-text.component';
import { EdgeEventDirective } from '../../../directives/edge-event.directive';

export interface BaseEdgeProps {
  path: string;
  labelX?: number;
  labelY?: number;
  label?: string | number;
  labelStyle?: Record<string, any>;
  labelShowBg?: boolean;
  labelBgStyle?: Record<string, any>;
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;
  interactionWidth?: number;
  className?: string;
  style?: Record<string, any>;
  markerEnd?: string | any;
  markerStart?: string | any;
  id?: string;
}

/**
 * BaseEdge 組件用於所有邊的內部實現。它可以在自定義邊中使用，
 * 並為您處理不可見的輔助邊和邊標籤。
 *
 * @example
 * ```typescript
 * import { BaseEdgeComponent } from './components/edges/base-edge/base-edge.component';
 * import { getStraightPath } from '@xyflow/system';
 *
 * @Component({
 *   template: `
 *     <svg:g angular-xyflow-base-edge
 *       [path]="edgePath()"
 *       [labelX]="labelX()"
 *       [labelY]="labelY()"
 *       [label]="label"
 *       [style]="style" />
 *   `
 * })
 * export class CustomEdgeComponent {
 *   // 計算路徑邏輯
 * }
 * ```
 */
@Component({
  selector: 'svg:g[angular-xyflow-base-edge]',
  standalone: true,
  imports: [CommonModule, EdgeTextComponent],
  hostDirectives: [
    {
      directive: EdgeEventDirective,
      inputs: ['selectable']
    }
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <!-- 主要邊路徑 -->
    <svg:path
      [attr.id]="id()"
      [attr.d]="path()"
      fill="none"
      [class]="edgePathClasses()"
      [attr.style]="styleString()"
      [attr.marker-end]="markerEnd()"
      [attr.marker-start]="markerStart()"
      [attr.pathLength]="pathLength()"
    />

    <!-- 互動區域（不可見但可互動） -->
    @if (interactionWidth()) {
    <svg:path
      [attr.d]="path()"
      fill="none"
      stroke="transparent"
      [attr.stroke-width]="interactionWidth()"
      class="angular-xyflow__edge-interaction"
      [style.pointer-events]="'stroke'"
    />
    }

    <!-- 邊標籤 -->
    @if (shouldShowLabel()) {
    <svg:g
      angular-xyflow-edge-text
      [x]="labelX()!"
      [y]="labelY()!"
      [label]="label()!"
      [labelStyle]="labelStyle()"
      [labelShowBg]="labelShowBg() !== false"
      [labelBgStyle]="labelBgStyle()"
      [labelBgPadding]="labelBgPadding() || [2, 4]"
      [labelBgBorderRadius]="labelBgBorderRadius() || 2"
    />
    }
  `,
})
export class BaseEdgeComponent {
  // 輸入屬性
  path = input.required<string>();
  labelX = input<number>();
  labelY = input<number>();
  label = input<string | number>();
  labelStyle = input<Record<string, any>>();
  labelShowBg = input<boolean>();
  labelBgStyle = input<Record<string, any>>();
  labelBgPadding = input<[number, number]>();
  labelBgBorderRadius = input<number>();
  interactionWidth = input<number>(20);
  className = input<string>();
  style = input<Record<string, any>>();
  markerEnd = input<string | any>();
  markerStart = input<string | any>();
  id = input<string>();
  pathLength = input<number>();
  selectable = input<boolean>(true);

  // 輸出事件（現在由 EdgeEventDirective 處理）
  edgeClick = output<MouseEvent>();
  edgeDoubleClick = output<MouseEvent>();
  edgeContextMenu = output<MouseEvent>();
  edgeMouseEnter = output<MouseEvent>();
  edgeMouseLeave = output<MouseEvent>();
  edgeMouseMove = output<MouseEvent>();

  // 計算屬性
  edgePathClasses = computed(() => {
    const baseClasses = ['angular-xyflow__edge-path'];
    const customClass = this.className();
    if (customClass) {
      baseClasses.push(customClass);
    }
    return baseClasses.join(' ');
  });

  shouldShowLabel = computed(() => {
    const label = this.label();
    const labelX = this.labelX();
    const labelY = this.labelY();
    return label && isNumeric(labelX) && isNumeric(labelY);
  });

  // 將樣式對象轉換為 CSS 字符串
  styleString = computed(() => {
    const style = this.style();
    if (!style) return undefined; // 不設置默認樣式，讓 CSS 類生效

    return Object.entries(style)
      .map(
        ([key, value]) =>
          `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`
      )
      .join('; ');
  });

}
