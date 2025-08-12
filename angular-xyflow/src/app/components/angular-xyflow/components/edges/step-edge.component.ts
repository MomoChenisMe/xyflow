import { Component, ChangeDetectionStrategy, input, computed, output, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position, getSmoothStepPath } from '@xyflow/system';
import { BaseEdgeComponent } from './base-edge.component';
import { EdgeWrapperComponent } from '../edge-wrapper/edge-wrapper.component';

export interface StepEdgeProps {
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
    offset?: number;
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
 * Component that can be used inside a custom edge to render a step edge.
 *
 * @example
 * ```typescript
 * import { StepEdgeComponent } from './components/edges/step-edge/step-edge.component';
 *
 * @Component({
 *   template: `
 *     <svg:g angular-xyflow-step-edge
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
  selector: 'svg:svg[angular-xyflow-step-edge]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BaseEdgeComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <svg:g angular-xyflow-base-edge
      [id]="id()"
      [path]="edgePath()"
      [labelX]="labelX()"
      [labelY]="labelY()"
      [label]="label()"
      [labelStyle]="labelStyle()"
      [labelShowBg]="labelShowBg()"
      [labelBgStyle]="labelBgStyle()"
      [labelBgPadding]="labelBgPadding()"
      [labelBgBorderRadius]="labelBgBorderRadius()"
      [style]="mergedStyle()"
      [className]="className()"
      [markerEnd]="markerEnd()"
      [markerStart]="markerStart()"
      [interactionWidth]="interactionWidth() || 20"
      [selectable]="selectable() ?? true"
      (edgeClick)="handleEdgeClick($event)"
      (edgeDoubleClick)="handleEdgeDoubleClick($event)"
      (edgeContextMenu)="handleEdgeContextMenu($event)"
      (edgeMouseEnter)="handleEdgeMouseEnter($event)"
      (edgeMouseLeave)="handleEdgeMouseLeave($event)"
      (edgeMouseMove)="handleEdgeMouseMove($event)" />
  `
})
export class StepEdgeComponent {
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
  pathOptions = input<{ offset?: number }>();
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

  // 計算路徑數據
  pathData = computed(() => {
    const options = this.pathOptions();
    return getSmoothStepPath({
      sourceX: this.sourceX(),
      sourceY: this.sourceY(),
      sourcePosition: this.sourcePosition(),
      targetX: this.targetX(),
      targetY: this.targetY(),
      targetPosition: this.targetPosition(),
      borderRadius: 0, // StepEdge 的關鍵差異：無圓角
      offset: options?.offset,
    });
  });

  // 計算屬性
  edgePath = computed(() => this.pathData()[0]);
  labelX = computed(() => this.pathData()[1]);
  labelY = computed(() => this.pathData()[2]);

  // 計算 className
  className = computed(() => {
    const classes = [];
    if (this.selected()) {
      classes.push('selected');
    }
    if (this.animated()) {
      classes.push('animated');
    }
    return classes.join(' ');
  });

  // 合併樣式
  mergedStyle = computed(() => {
    const isSelected = this.selected();
    const defaultStyle = {
      stroke: isSelected ? '#555' : '#b1b1b7',
      strokeWidth: 1 // 與 React 版本保持一致，選中狀態不改變寬度
    };
    return { ...defaultStyle, ...this.style() };
  });

  // 注入 EdgeWrapper 以傳遞事件
  private edgeWrapper = inject(EdgeWrapperComponent, { optional: true });

  // 事件處理方法
  handleEdgeClick(event: MouseEvent): void {
    if (this.edgeWrapper) {
      const edge = this.edgeWrapper.edge();
      this.edgeWrapper.edgeClick.emit({ event, edge });
    }
  }

  handleEdgeDoubleClick(event: MouseEvent): void {
    if (this.edgeWrapper) {
      const edge = this.edgeWrapper.edge();
      this.edgeWrapper.edgeDoubleClick.emit({ event, edge });
    }
  }

  handleEdgeContextMenu(event: MouseEvent): void {
    if (this.edgeWrapper) {
      const edge = this.edgeWrapper.edge();
      this.edgeWrapper.edgeContextMenu.emit({ event, edge });
    }
  }

  handleEdgeMouseEnter(event: MouseEvent): void {
    // 可以在這裡處理 hover 效果
  }

  handleEdgeMouseLeave(event: MouseEvent): void {
    // 可以在這裡處理 hover 效果
  }

  handleEdgeMouseMove(event: MouseEvent): void {
    // 可以在這裡處理 mouse move
  }
}
