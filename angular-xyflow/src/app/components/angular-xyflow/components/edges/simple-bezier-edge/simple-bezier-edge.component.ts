import { Component, input, computed, output, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position, getBezierEdgeCenter } from '@xyflow/system';
import { BaseEdgeComponent } from '../base-edge/base-edge.component';
import { EdgeWrapperComponent } from '../../../edge-wrapper/edge-wrapper.component';

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
 * Component that can be used inside a custom edge to render a simple bezier curve.
 *
 * @example
 * ```typescript
 * import { SimpleBezierEdgeComponent } from './components/edges/simple-bezier-edge/simple-bezier-edge.component';
 *
 * @Component({
 *   template: `
 *     <svg:g angular-xyflow-simple-bezier-edge
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
  selector: 'svg:svg[angular-xyflow-simple-bezier-edge]',
  standalone: true,
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

  // 計算路徑數據
  pathData = computed(() => {
    return getSimpleBezierPath({
      sourceX: this.sourceX(),
      sourceY: this.sourceY(),
      sourcePosition: this.sourcePosition(),
      targetX: this.targetX(),
      targetY: this.targetY(),
      targetPosition: this.targetPosition(),
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
