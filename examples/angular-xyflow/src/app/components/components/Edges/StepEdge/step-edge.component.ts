import {
  Component,
  input,
  ChangeDetectionStrategy,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SmoothStepEdgeComponent } from '../SmoothStepEdge/smooth-step-edge.component';
import { StepEdgeProps, Position } from '../edges.types';

/**
 * StepEdge - Angular equivalent of React StepEdge component
 * 
 * 階梯邊緣組件 - 用於渲染直角階梯式邊緣（無圓角）
 * 本質上是一個 borderRadius 為 0 的 SmoothStepEdge
 * 可以在自定義邊緣中使用來渲染直角階梯路徑
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <xy-step-edge
 *       [sourceX]="sourceX"
 *       [sourceY]="sourceY"
 *       [targetX]="targetX"
 *       [targetY]="targetY"
 *       [sourcePosition]="sourcePosition"
 *       [targetPosition]="targetPosition"
 *       [pathOptions]="{ offset: 30 }">
 *     </xy-step-edge>
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
  selector: 'xy-step-edge',
  standalone: true,
  imports: [CommonModule, SmoothStepEdgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <xy-smooth-step-edge
      [id]="isInternal() ? '' : (id() || '')"
      [sourceX]="sourceX()"
      [sourceY]="sourceY()"
      [targetX]="targetX()"
      [targetY]="targetY()"
      [source]="source()"
      [target]="target()"
      [sourcePosition]="sourcePosition()"
      [targetPosition]="targetPosition()"
      [label]="label()"
      [labelStyle]="labelStyle()"
      [labelShowBg]="labelShowBg()"
      [labelBgStyle]="labelBgStyle()"
      [labelBgPadding]="labelBgPadding()"
      [labelBgBorderRadius]="labelBgBorderRadius()"
      [style]="style()"
      [markerEnd]="markerEnd()"
      [markerStart]="markerStart()"
      [pathOptions]="computedPathOptions()"
      [interactionWidth]="interactionWidth()"
      [isInternal]="true">
    </xy-smooth-step-edge>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class StepEdgeComponent {
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
  pathOptions = input<{ offset?: number }>();
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

  // 計算路徑選項 - StepEdge 的 borderRadius 始終為 0
  computedPathOptions = computed(() => ({
    borderRadius: 0,
    offset: this.pathOptions()?.offset
  }));
}