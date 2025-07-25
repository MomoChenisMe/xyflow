import {
  Component,
  input,
  ChangeDetectionStrategy,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseEdgeComponent } from '../BaseEdge/base-edge.component';
import { SmoothStepEdgeProps, Position } from '../edges.types';

/**
 * Mock getSmoothStepPath function - 模擬 @xyflow/system 的 getSmoothStepPath
 * 在實際實現中，這應該從 @xyflow/system 導入
 */
function getSmoothStepPath(params: {
  sourceX: number;
  sourceY: number;
  sourcePosition: Position;
  targetX: number;
  targetY: number;
  targetPosition: Position;
  borderRadius?: number;
  offset?: number;
}): [string, number, number] {
  const {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius = 5,
    offset = 20
  } = params;

  // 計算中間點和轉折點
  let firstCornerX: number;
  let firstCornerY: number;
  let secondCornerX: number;
  let secondCornerY: number;

  // 根據源和目標位置計算路徑
  const isHorizontalStart = sourcePosition === Position.Left || sourcePosition === Position.Right;
  const isHorizontalEnd = targetPosition === Position.Left || targetPosition === Position.Right;

  if (isHorizontalStart && isHorizontalEnd) {
    // 水平到水平
    const midX = (sourceX + targetX) / 2;
    firstCornerX = midX;
    firstCornerY = sourceY;
    secondCornerX = midX;
    secondCornerY = targetY;
  } else if (!isHorizontalStart && !isHorizontalEnd) {
    // 垂直到垂直
    const midY = (sourceY + targetY) / 2;
    firstCornerX = sourceX;
    firstCornerY = midY;
    secondCornerX = targetX;
    secondCornerY = midY;
  } else if (isHorizontalStart && !isHorizontalEnd) {
    // 水平到垂直
    firstCornerX = sourcePosition === Position.Left ? sourceX - offset : sourceX + offset;
    firstCornerY = sourceY;
    secondCornerX = firstCornerX;
    secondCornerY = targetPosition === Position.Top ? targetY - offset : targetY + offset;
  } else {
    // 垂直到水平
    firstCornerX = sourceX;
    firstCornerY = sourcePosition === Position.Top ? sourceY - offset : sourceY + offset;
    secondCornerX = targetPosition === Position.Left ? targetX - offset : targetX + offset;
    secondCornerY = firstCornerY;
  }

  // 構建平滑階梯路徑
  let path = `M ${sourceX},${sourceY}`;
  
  if (borderRadius > 0) {
    // 添加圓角
    const dx1 = firstCornerX - sourceX;
    const dy1 = firstCornerY - sourceY;
    const dx2 = secondCornerX - firstCornerX;
    const dy2 = secondCornerY - firstCornerY;
    const dx3 = targetX - secondCornerX;
    const dy3 = targetY - secondCornerY;

    // 第一段
    if (Math.abs(dx1) > borderRadius) {
      const sign = dx1 > 0 ? 1 : -1;
      path += ` L ${firstCornerX - sign * borderRadius},${sourceY}`;
      path += ` Q ${firstCornerX},${sourceY} ${firstCornerX},${sourceY + (dy1 > 0 ? borderRadius : -borderRadius)}`;
    } else if (Math.abs(dy1) > borderRadius) {
      const sign = dy1 > 0 ? 1 : -1;
      path += ` L ${sourceX},${firstCornerY - sign * borderRadius}`;
      path += ` Q ${sourceX},${firstCornerY} ${sourceX + (dx1 > 0 ? borderRadius : -borderRadius)},${firstCornerY}`;
    }

    // 第二段
    if (Math.abs(dx2) > borderRadius) {
      const sign = dx2 > 0 ? 1 : -1;
      path += ` L ${secondCornerX - sign * borderRadius},${firstCornerY}`;
      path += ` Q ${secondCornerX},${firstCornerY} ${secondCornerX},${firstCornerY + (dy2 > 0 ? borderRadius : -borderRadius)}`;
    } else if (Math.abs(dy2) > borderRadius) {
      const sign = dy2 > 0 ? 1 : -1;
      path += ` L ${firstCornerX},${secondCornerY - sign * borderRadius}`;
      path += ` Q ${firstCornerX},${secondCornerY} ${firstCornerX + (dx2 > 0 ? borderRadius : -borderRadius)},${secondCornerY}`;
    }

    // 第三段
    if (Math.abs(dx3) > borderRadius) {
      const sign = dx3 > 0 ? 1 : -1;
      path += ` L ${targetX - sign * borderRadius},${secondCornerY}`;
      path += ` Q ${targetX},${secondCornerY} ${targetX},${secondCornerY + (dy3 > 0 ? borderRadius : -borderRadius)}`;
    } else if (Math.abs(dy3) > borderRadius) {
      const sign = dy3 > 0 ? 1 : -1;
      path += ` L ${secondCornerX},${targetY - sign * borderRadius}`;
      path += ` Q ${secondCornerX},${targetY} ${secondCornerX + (dx3 > 0 ? borderRadius : -borderRadius)},${targetY}`;
    }

    path += ` L ${targetX},${targetY}`;
  } else {
    // 無圓角的直角路徑
    path += ` L ${firstCornerX},${firstCornerY}`;
    path += ` L ${secondCornerX},${secondCornerY}`;
    path += ` L ${targetX},${targetY}`;
  }

  // 計算標籤位置（路徑中點）
  const labelX = (sourceX + targetX) / 2;
  const labelY = (sourceY + targetY) / 2;

  return [path, labelX, labelY];
}

/**
 * SmoothStepEdge - Angular equivalent of React SmoothStepEdge component
 * 
 * 平滑階梯邊緣組件 - 用於渲染帶圓角的階梯式邊緣
 * 可以在自定義邊緣中使用來渲染平滑的階梯路徑
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <xy-smooth-step-edge
 *       [sourceX]="sourceX"
 *       [sourceY]="sourceY"
 *       [targetX]="targetX"
 *       [targetY]="targetY"
 *       [sourcePosition]="sourcePosition"
 *       [targetPosition]="targetPosition"
 *       [pathOptions]="{ borderRadius: 10, offset: 30 }">
 *     </xy-smooth-step-edge>
 *   `
 * })
 * export class CustomEdgeComponent {
 *   sourceX = 100;
 *   sourceY = 100;
 *   targetX = 300;
 *   targetY = 200;
 *   sourcePosition = Position.Right;
 *   targetPosition = Position.Left;
 * }
 * ```
 */
@Component({
  selector: 'xy-smooth-step-edge',
  standalone: true,
  imports: [CommonModule, BaseEdgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <xy-base-edge
      [id]="isInternal() ? '' : (id() || '')"
      [path]="path()"
      [labelX]="labelX()"
      [labelY]="labelY()"
      [label]="label()"
      [labelStyle]="labelStyle()"
      [labelShowBg]="labelShowBg()"
      [labelBgStyle]="labelBgStyle()"
      [labelBgPadding]="labelBgPadding()"
      [labelBgBorderRadius]="labelBgBorderRadius()"
      [style]="style()"
      [markerEnd]="markerEnd()"
      [markerStart]="markerStart()"
      [interactionWidth]="interactionWidth() || 0"
      [sourceX]="sourceX()"
      [sourceY]="sourceY()"
      [targetX]="targetX()"
      [targetY]="targetY()">
    </xy-base-edge>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class SmoothStepEdgeComponent {
  id = input<string>('');
  sourceX = input.required<number>();
  sourceY = input.required<number>();
  targetX = input.required<number>();
  targetY = input.required<number>();
  sourcePosition = input<Position>(Position.Bottom);
  targetPosition = input<Position>(Position.Top);
  label = input<string>();
  labelStyle = input<any>();
  labelShowBg = input<boolean>();
  labelBgStyle = input<any>();
  labelBgPadding = input<[number, number]>();
  labelBgBorderRadius = input<number>();
  style = input<any>();
  markerEnd = input<string>();
  markerStart = input<string>();
  pathOptions = input<{ borderRadius?: number; offset?: number }>();
  interactionWidth = input<number>();
  isInternal = input<boolean>(false);
  
  // 其他邊緣屬性
  type = input<string>();
  source = input.required<string>();
  target = input.required<string>();
  sourceHandleId = input<string | null>();
  targetHandleId = input<string | null>();
  selected = input<boolean>();
  animated = input<boolean>();
  selectable = input<boolean>();
  deletable = input<boolean>();
  data = input<any>();

  // 計算平滑階梯路徑
  private smoothStepPath = computed(() => {
    return getSmoothStepPath({
      sourceX: this.sourceX(),
      sourceY: this.sourceY(),
      sourcePosition: this.sourcePosition(),
      targetX: this.targetX(),
      targetY: this.targetY(),
      targetPosition: this.targetPosition(),
      borderRadius: this.pathOptions()?.borderRadius,
      offset: this.pathOptions()?.offset,
    });
  });

  // 提取路徑和標籤位置
  path = computed(() => this.smoothStepPath()[0]);
  labelX = computed(() => this.smoothStepPath()[1]);
  labelY = computed(() => this.smoothStepPath()[2]);
}