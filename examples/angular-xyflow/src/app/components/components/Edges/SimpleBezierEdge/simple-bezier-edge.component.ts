import {
  Component,
  input,
  ChangeDetectionStrategy,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseEdgeComponent } from '../BaseEdge/base-edge.component';
import { SimpleBezierEdgeProps, Position } from '../edges.types';

/**
 * 控制點計算參數
 */
interface GetControlParams {
  pos: Position;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * 獲取控制點位置
 */
function getControl({ pos, x1, y1, x2, y2 }: GetControlParams): [number, number] {
  if (pos === Position.Left || pos === Position.Right) {
    return [0.5 * (x1 + x2), y1];
  }

  return [x1, 0.5 * (y1 + y2)];
}

/**
 * Mock getBezierEdgeCenter function - 模擬 @xyflow/system 的 getBezierEdgeCenter
 */
function getBezierEdgeCenter(params: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourceControlX: number;
  sourceControlY: number;
  targetControlX: number;
  targetControlY: number;
}): [number, number, number, number] {
  // 簡化的實現 - 計算貝茲曲線中心點
  const { sourceX, sourceY, targetX, targetY } = params;
  
  const labelX = (sourceX + targetX) / 2;
  const labelY = (sourceY + targetY) / 2;
  const offsetX = Math.abs(labelX - sourceX);
  const offsetY = Math.abs(labelY - sourceY);

  return [labelX, labelY, offsetX, offsetY];
}

/**
 * 簡化貝茲曲線路徑計算參數
 */
export interface GetSimpleBezierPathParams {
  sourceX: number;
  sourceY: number;
  sourcePosition?: Position;
  targetX: number;
  targetY: number;
  targetPosition?: Position;
}

/**
 * getSimpleBezierPath - 計算簡化貝茲曲線路徑
 * 
 * 工具函數，返回渲染簡化貝茲曲線所需的所有數據
 * 
 * @returns 
 * - path: SVG path 元素使用的路徑
 * - labelX: 渲染標籤的 x 位置
 * - labelY: 渲染標籤的 y 位置
 * - offsetX: 源 x 位置與路徑中間 x 位置的絕對差值
 * - offsetY: 源 y 位置與路徑中間 y 位置的絕對差值
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
 * SimpleBezierEdge - Angular equivalent of React SimpleBezierEdge component
 * 
 * 簡化貝茲曲線邊緣組件 - 用於渲染簡化版的貝茲曲線邊緣
 * 控制點計算更簡單，適合大多數使用場景
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <xy-simple-bezier-edge
 *       [sourceX]="sourceX"
 *       [sourceY]="sourceY"
 *       [targetX]="targetX"
 *       [targetY]="targetY"
 *       [sourcePosition]="sourcePosition"
 *       [targetPosition]="targetPosition">
 *     </xy-simple-bezier-edge>
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
  selector: 'xy-simple-bezier-edge',
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
export class SimpleBezierEdgeComponent {
  id = input<string>('');
  sourceX = input.required<number>();
  sourceY = input.required<number>();
  targetX = input.required<number>();
  targetY = input.required<number>();
  sourcePosition = input<Position>();
  targetPosition = input<Position>();
  label = input<string>();
  labelStyle = input<any>();
  labelShowBg = input<boolean>();
  labelBgStyle = input<any>();
  labelBgPadding = input<[number, number]>();
  labelBgBorderRadius = input<number>();
  style = input<any>();
  markerEnd = input<string>();
  markerStart = input<string>();
  interactionWidth = input<number>();
  isInternal = input<boolean>(false);
  pathOptions = input<any>();
  
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

  // 計算簡化貝茲曲線路徑
  private simpleBezierPath = computed(() => {
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
  path = computed(() => this.simpleBezierPath()[0]);
  labelX = computed(() => this.simpleBezierPath()[1]);
  labelY = computed(() => this.simpleBezierPath()[2]);
  offsetX = computed(() => this.simpleBezierPath()[3]);
  offsetY = computed(() => this.simpleBezierPath()[4]);
}