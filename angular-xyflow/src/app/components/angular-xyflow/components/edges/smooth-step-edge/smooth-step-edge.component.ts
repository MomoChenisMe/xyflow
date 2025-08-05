import { Component, input, computed, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position, getSmoothStepPath, isNumeric } from '@xyflow/system';
import { EdgeTextComponent } from '../edge-text/edge-text.component';

export interface SmoothStepEdgeProps {
  id?: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition?: Position;
  targetPosition?: Position;
  label?: string | number;
  labelStyle?: Record<string, any>;
  labelShowBg?: boolean;
  labelBgStyle?: Record<string, any>;
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;
  style?: Record<string, any>;
  markerEnd?: string;
  markerStart?: string;
  pathOptions?: {
    borderRadius?: number;
    offset?: number;
    stepPosition?: number;
  };
  interactionWidth?: number;
  data?: any;
  type?: string;
  selected?: boolean;
  sourceHandleId?: string;
  targetHandleId?: string;
  animated?: boolean;
  hidden?: boolean;
  deletable?: boolean;
  selectable?: boolean;
}

/**
 * 可以在自定義邊內使用的組件，用於渲染平滑階梯邊。
 * 
 * @example
 * ```typescript
 * import { SmoothStepEdgeComponent } from './components/edges/smooth-step-edge/smooth-step-edge.component';
 * 
 * @Component({
 *   template: `
 *     <app-smooth-step-edge
 *       [sourceX]="sourceX"
 *       [sourceY]="sourceY"
 *       [targetX]="targetX"
 *       [targetY]="targetY"
 *       [sourcePosition]="sourcePosition"
 *       [targetPosition]="targetPosition"
 *       [pathOptions]="{ borderRadius: 5, offset: 20 }" />
 *   `
 * })
 * export class CustomEdgeComponent {
 *   sourceX = 100;
 *   sourceY = 100;
 *   targetX = 200;
 *   targetY = 200;
 *   sourcePosition = Position.Right;
 *   targetPosition = Position.Left;
 * }
 * ```
 */
@Component({
  selector: '[angular-xyflow-smooth-step-edge]',
  standalone: true,
  imports: [CommonModule, EdgeTextComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <!-- 主要邊路徑 -->
    <svg:path 
      [attr.d]="path()"
      fill="none"
      [class]="edgePathClasses()"
      [attr.style]="styleString()"
      [attr.marker-end]="markerEnd()"
      [attr.marker-start]="markerStart()" />
    
    <!-- 互動區域（不可見但可點擊） -->
    @if (interactionWidth()) {
      <svg:path
        [attr.d]="path()"
        fill="none"
        stroke="transparent"
        [attr.stroke-width]="interactionWidth()"
        [style.pointer-events]="'stroke'"
        class="angular-xyflow__edge-interaction" />
    }
    
    <!-- 邊標籤 -->
    @if (shouldShowLabel()) {
      <app-edge-text
        [x]="labelX()!"
        [y]="labelY()!"
        [label]="label()!"
        [labelStyle]="labelStyle()"
        [labelShowBg]="labelShowBg() !== false"
        [labelBgStyle]="labelBgStyle()"
        [labelBgPadding]="labelBgPadding() || [2, 4]"
        [labelBgBorderRadius]="labelBgBorderRadius() || 2" />
    }
  `
})
export class SmoothStepEdgeComponent {
  // 輸入屬性
  id = input<string>();
  sourceX = input.required<number>();
  sourceY = input.required<number>();
  targetX = input.required<number>();
  targetY = input.required<number>();
  sourcePosition = input<Position>(Position.Bottom);
  targetPosition = input<Position>(Position.Top);
  label = input<string | number>();
  labelStyle = input<Record<string, any>>();
  labelShowBg = input<boolean>();
  labelBgStyle = input<Record<string, any>>();
  labelBgPadding = input<[number, number]>();
  labelBgBorderRadius = input<number>();
  style = input<Record<string, any>>();
  markerEnd = input<string | any>();
  markerStart = input<string | any>();
  pathOptions = input<{ borderRadius?: number; offset?: number; stepPosition?: number }>();
  interactionWidth = input<number>();
  data = input<any>();
  type = input<string>();
  selected = input<boolean>();
  sourceHandleId = input<string>();
  targetHandleId = input<string>();
  animated = input<boolean>();
  hidden = input<boolean>();
  deletable = input<boolean>();
  selectable = input<boolean>();

  // 計算路徑
  private pathResult = computed(() => {
    const options = this.pathOptions();
    return getSmoothStepPath({
      sourceX: this.sourceX(),
      sourceY: this.sourceY(),
      sourcePosition: this.sourcePosition(),
      targetX: this.targetX(),
      targetY: this.targetY(),
      targetPosition: this.targetPosition(),
      borderRadius: options?.borderRadius,
      offset: options?.offset,
      stepPosition: options?.stepPosition,
    });
  });

  // 提取路徑和標籤位置
  path = computed(() => this.pathResult()[0]);
  labelX = computed(() => this.pathResult()[1]);
  labelY = computed(() => this.pathResult()[2]);

  // 計算屬性
  edgePathClasses = computed(() => {
    const baseClasses = ['angular-xyflow__edge-path'];
    if (this.selected()) {
      baseClasses.push('selected');
    }
    if (this.animated()) {
      baseClasses.push('animated');
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
    const isSelected = this.selected();
    const defaultStyle = {
      stroke: isSelected ? '#555' : '#b1b1b7',
      strokeWidth: isSelected ? 2 : 1
    };
    const mergedStyle = { ...defaultStyle, ...style };
    return Object.entries(mergedStyle)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ');
  });
}