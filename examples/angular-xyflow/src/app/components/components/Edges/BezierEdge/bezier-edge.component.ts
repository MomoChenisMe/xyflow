import {
  Component,
  input,
  ChangeDetectionStrategy,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseEdgeComponent } from '../BaseEdge/base-edge.component';
import { BezierEdgeProps, Position } from '../edges.types';

/**
 * Mock getBezierPath function - 模擬 @xyflow/system 的 getBezierPath
 * 在實際實現中，這應該從 @xyflow/system 導入
 */
function getBezierPath(params: {
  sourceX: number;
  sourceY: number;
  sourcePosition: Position;
  targetX: number;
  targetY: number;
  targetPosition: Position;
  curvature?: number;
}): [string, number, number] {
  const {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature = 0.25
  } = params;

  // 計算控制點
  const distance = Math.sqrt((targetX - sourceX) ** 2 + (targetY - sourceY) ** 2);
  const offset = distance * curvature;

  let sourceControlX = sourceX;
  let sourceControlY = sourceY;
  let targetControlX = targetX;
  let targetControlY = targetY;

  // 根據位置計算控制點
  switch (sourcePosition) {
    case Position.Left:
      sourceControlX = sourceX - offset;
      break;
    case Position.Right:
      sourceControlX = sourceX + offset;
      break;
    case Position.Top:
      sourceControlY = sourceY - offset;
      break;
    case Position.Bottom:
      sourceControlY = sourceY + offset;
      break;
  }

  switch (targetPosition) {
    case Position.Left:
      targetControlX = targetX - offset;
      break;
    case Position.Right:
      targetControlX = targetX + offset;
      break;
    case Position.Top:
      targetControlY = targetY - offset;
      break;
    case Position.Bottom:
      targetControlY = targetY + offset;
      break;
  }

  // 構建貝茲曲線路徑
  const path = `M ${sourceX},${sourceY} C ${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`;
  
  // 計算標籤位置（曲線中點）
  const labelX = (sourceX + targetX) / 2;
  const labelY = (sourceY + targetY) / 2;

  return [path, labelX, labelY];
}

/**
 * BezierEdge - Angular equivalent of React BezierEdge component
 * 
 * 貝茲曲線邊緣組件 - 用於渲染平滑的貝茲曲線邊緣
 * 可以在自定義邊緣中使用來渲染貝茲曲線
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <xy-bezier-edge
 *       [sourceX]="sourceX"
 *       [sourceY]="sourceY"
 *       [targetX]="targetX"
 *       [targetY]="targetY"
 *       [sourcePosition]="sourcePosition"
 *       [targetPosition]="targetPosition"
 *       [pathOptions]="{ curvature: 0.3 }">
 *     </xy-bezier-edge>
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
  selector: 'xy-bezier-edge',
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
export class BezierEdgeComponent {
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
  pathOptions = input<{ curvature?: number }>();
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

  // 計算貝茲曲線路徑
  private bezierPath = computed(() => {
    return getBezierPath({
      sourceX: this.sourceX(),
      sourceY: this.sourceY(),
      sourcePosition: this.sourcePosition(),
      targetX: this.targetX(),
      targetY: this.targetY(),
      targetPosition: this.targetPosition(),
      curvature: this.pathOptions()?.curvature,
    });
  });

  // 提取路徑和標籤位置
  path = computed(() => this.bezierPath()[0]);
  labelX = computed(() => this.bezierPath()[1]);
  labelY = computed(() => this.bezierPath()[2]);
}