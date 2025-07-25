import {
  Component,
  input,
  ChangeDetectionStrategy,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseEdgeComponent } from '../BaseEdge/base-edge.component';
import { StraightEdgeProps } from '../edges.types';

/**
 * Mock getStraightPath function - 模擬 @xyflow/system 的 getStraightPath
 * 在實際實現中，這應該從 @xyflow/system 導入
 */
function getStraightPath(params: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}): [string, number, number] {
  const { sourceX, sourceY, targetX, targetY } = params;
  
  // 創建直線路徑
  const path = `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
  
  // 計算標籤位置（線段中點）
  const labelX = (sourceX + targetX) / 2;
  const labelY = (sourceY + targetY) / 2;

  return [path, labelX, labelY];
}

/**
 * StraightEdge - Angular equivalent of React StraightEdge component
 * 
 * 直線邊緣組件 - 用於渲染簡單的直線邊緣
 * 可以在自定義邊緣中使用來渲染直線
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <xy-straight-edge
 *       [sourceX]="sourceX"
 *       [sourceY]="sourceY"
 *       [targetX]="targetX"
 *       [targetY]="targetY">
 *     </xy-straight-edge>
 *   `
 * })
 * export class CustomEdgeComponent {
 *   sourceX = 100;
 *   sourceY = 100;
 *   targetX = 300;
 *   targetY = 200;
 * }
 * ```
 */
@Component({
  selector: 'xy-straight-edge',
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
export class StraightEdgeComponent {
  id = input<string>('');
  sourceX = input.required<number>();
  sourceY = input.required<number>();
  targetX = input.required<number>();
  targetY = input.required<number>();
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
  sourcePosition = input<any>();
  targetPosition = input<any>();

  // 計算直線路徑
  private straightPath = computed(() => {
    return getStraightPath({
      sourceX: this.sourceX(),
      sourceY: this.sourceY(),
      targetX: this.targetX(),
      targetY: this.targetY(),
    });
  });

  // 提取路徑和標籤位置
  path = computed(() => this.straightPath()[0]);
  labelX = computed(() => this.straightPath()[1]);
  labelY = computed(() => this.straightPath()[2]);
}