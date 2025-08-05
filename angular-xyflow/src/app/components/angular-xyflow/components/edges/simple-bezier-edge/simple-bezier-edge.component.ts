import { Component, input, computed, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position, getBezierEdgeCenter, isNumeric } from '@xyflow/system';
import { EdgeTextComponent } from '../edge-text/edge-text.component';

export interface SimpleBezierEdgeProps {
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

export interface GetSimpleBezierPathParams {
  sourceX: number;
  sourceY: number;
  sourcePosition?: Position;
  targetX: number;
  targetY: number;
  targetPosition?: Position;
}

interface GetControlParams {
  pos: Position;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function getControl({ pos, x1, y1, x2, y2 }: GetControlParams): [number, number] {
  if (pos === Position.Left || pos === Position.Right) {
    return [0.5 * (x1 + x2), y1];
  }

  return [x1, 0.5 * (y1 + y2)];
}

/**
 * getSimpleBezierPath 函數返回渲染兩個節點之間的簡單貝茲邊所需的一切。
 * 
 * @returns
 * - `path`: 用於 SVG `<path>` 元素的路徑
 * - `labelX`: 用於渲染此邊標籤的 `x` 位置
 * - `labelY`: 用於渲染此邊標籤的 `y` 位置
 * - `offsetX`: 源 `x` 位置與此路徑中點的 `x` 位置之間的絕對差異
 * - `offsetY`: 源 `y` 位置與此路徑中點的 `y` 位置之間的絕對差異
 */
export function getSimpleBezierPath({
  sourceX,
  sourceY,
  sourcePosition = Position.Bottom,
  targetX,
  targetY,
  targetPosition = Position.Top,
}: GetSimpleBezierPathParams): [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number] {
  const [sourceControlX, sourceControlY] = getControl({
    pos: sourcePosition,
    x1: sourceX,
    y1: sourceY,
    x2: targetX,
    y2: targetY,
  });
  const [targetControlX, targetControlY] = getControl({
    pos: targetPosition,
    x1: targetX,
    y1: targetY,
    x2: sourceX,
    y2: sourceY,
  });
  const [labelX, labelY, offsetX, offsetY] = getBezierEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourceControlX,
    sourceControlY,
    targetControlX,
    targetControlY,
  });

  return [
    `M${sourceX},${sourceY} C${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`,
    labelX,
    labelY,
    offsetX,
    offsetY,
  ];
}

/**
 * 可以在自定義邊內使用的組件，用於渲染簡單貝茲曲線。
 * 
 * @example
 * ```typescript
 * import { SimpleBezierEdgeComponent } from './components/edges/simple-bezier-edge/simple-bezier-edge.component';
 * 
 * @Component({
 *   template: `
 *     <app-simple-bezier-edge
 *       [sourceX]="sourceX"
 *       [sourceY]="sourceY"
 *       [targetX]="targetX"
 *       [targetY]="targetY"
 *       [sourcePosition]="sourcePosition"
 *       [targetPosition]="targetPosition" />
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
  selector: '[angular-xyflow-simple-bezier-edge]',
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
export class SimpleBezierEdgeComponent {
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
    return getSimpleBezierPath({
      sourceX: this.sourceX(),
      sourceY: this.sourceY(),
      sourcePosition: this.sourcePosition(),
      targetX: this.targetX(),
      targetY: this.targetY(),
      targetPosition: this.targetPosition(),
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