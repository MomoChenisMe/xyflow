import {
  Component,
  input,
  TemplateRef,
  ChangeDetectionStrategy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position } from '@xyflow/system';
import { ConnectionLineTemplateContext } from '../../types';

export interface ConnectionState {
  inProgress: boolean;
  from: { x: number; y: number };
  to: { x: number; y: number };
  fromPosition: Position;
  toPosition: Position;
  isValid?: boolean | null;
}

@Component({
  selector: '[angular-xyflow-connection-line]',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (customTemplate() && templateContext()) {
      <!-- 使用自定義連接線模板 -->
      <ng-container
        [ngTemplateOutlet]="customTemplate()!"
        [ngTemplateOutletContext]="templateContext()!"
      />
    } @else if (connectionPath()) {
      <!-- 使用預設連接線 -->
      <svg:g [class]="connectionWrapperClass()">
        <svg:path
          [attr.d]="connectionPath()"
          [ngStyle]="connectionStyle()"
          [class]="connectionClass()"
          style="pointer-events: none;"
        />
      </svg:g>
    }
  `,
})
export class ConnectionLineComponent {
  // 輸入信號
  connectionState = input.required<ConnectionState | null>();
  customTemplate = input<TemplateRef<ConnectionLineTemplateContext> | undefined>();
  connectionLineStyle = input<Record<string, any>>();

  // 計算信號
  connectionPath = computed(() => {
    const state = this.connectionState();
    if (!state) return null;

    const { from, to, fromPosition, toPosition } = state;

    // 使用 React Flow 預設的貝茲曲線路徑算法
    const [path] = this.getBezierPath({
      sourceX: from.x,
      sourceY: from.y,
      sourcePosition: fromPosition,
      targetX: to.x,
      targetY: to.y,
      targetPosition: toPosition
    });

    return path;
  });

  connectionStroke = computed(() => {
    const style = this.connectionLineStyle();

    // 始終優先使用自定義樣式中的stroke
    if (style?.['stroke']) {
      return style['stroke'];
    }

    const state = this.connectionState();
    if (!state) return '#b1b1b7';

    // 使用 React Flow 的預設行為：預設為灰色
    return state.isValid === true
      ? '#10b981'
      : state.isValid === false
      ? '#f87171'
      : '#b1b1b7';
  });

  connectionStrokeWidth = computed(() => {
    const style = this.connectionLineStyle();

    // 優先使用自定義樣式中的 stroke-width
    if (style?.['stroke-width']) {
      return style['stroke-width'];
    }
    if (style?.['strokeWidth']) {
      return style['strokeWidth'];
    }

    // React Flow 預設寬度
    return '1';
  });

  connectionClass = computed(() => {
    return 'angular-xyflow__connection-path xy-flow__connection-path';
  });

  // 包裝器類別，包含連接狀態
  connectionWrapperClass = computed(() => {
    const state = this.connectionState();
    const baseClass = 'angular-xyflow__connection xy-flow__connection';

    if (!state) return baseClass;

    // 添加連接狀態類別 (valid/invalid)
    const statusClass = state.isValid === null
      ? ''
      : state.isValid
        ? 'valid'
        : 'invalid';

    return statusClass ? `${baseClass} ${statusClass}` : baseClass;
  });

  connectionStyle = computed(() => {
    const stroke = this.connectionStroke();
    const strokeWidth = this.connectionStrokeWidth();
    return {
      stroke,
      'stroke-width': strokeWidth,
      fill: 'none'
    };
  });

  templateContext = computed<ConnectionLineTemplateContext | null>(() => {
    const state = this.connectionState();
    if (!state) return null;

    const { from, to, fromPosition, toPosition } = state;

    const props = {
      fromX: from.x,
      fromY: from.y,
      toX: to.x,
      toY: to.y,
      fromPosition,
      toPosition,
      isValid: state.isValid ?? null,
      connectionLineStyle: this.connectionLineStyle(),
    };

    // 使用 $implicit 作為預設值，並提供所有變數作為具名屬性
    return {
      $implicit: props,
      ...props,
    };
  });

  // 實現 React Flow 的貝茲曲線路徑算法
  private getBezierPath(params: {
    sourceX: number;
    sourceY: number;
    sourcePosition: Position;
    targetX: number;
    targetY: number;
    targetPosition: Position;
    curvature?: number;
  }): [string, number, number, number, number] {
    const {
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature = 0.25,
    } = params;

    const [sourceControlX, sourceControlY] = this.getControlWithCurvature({
      pos: sourcePosition,
      x1: sourceX,
      y1: sourceY,
      x2: targetX,
      y2: targetY,
      c: curvature,
    });

    const [targetControlX, targetControlY] = this.getControlWithCurvature({
      pos: targetPosition,
      x1: targetX,
      y1: targetY,
      x2: sourceX,
      y2: sourceY,
      c: curvature,
    });

    // 計算中心點（用於標籤，但連接線不需要）
    const centerX = sourceX * 0.125 + sourceControlX * 0.375 + targetControlX * 0.375 + targetX * 0.125;
    const centerY = sourceY * 0.125 + sourceControlY * 0.375 + targetControlY * 0.375 + targetY * 0.125;
    const offsetX = Math.abs(centerX - sourceX);
    const offsetY = Math.abs(centerY - sourceY);

    return [
      `M${sourceX},${sourceY} C${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`,
      centerX,
      centerY,
      offsetX,
      offsetY,
    ];
  }

  private calculateControlOffset(distance: number, curvature: number): number {
    if (distance >= 0) {
      return 0.5 * distance;
    }
    return curvature * 25 * Math.sqrt(-distance);
  }

  private getControlWithCurvature(params: {
    pos: Position;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    c: number;
  }): [number, number] {
    const { pos, x1, y1, x2, y2, c } = params;

    switch (pos) {
      case Position.Left:
        return [x1 - this.calculateControlOffset(x1 - x2, c), y1];
      case Position.Right:
        return [x1 + this.calculateControlOffset(x2 - x1, c), y1];
      case Position.Top:
        return [x1, y1 - this.calculateControlOffset(y1 - y2, c)];
      case Position.Bottom:
        return [x1, y1 + this.calculateControlOffset(y2 - y1, c)];
      default:
        return [x1, y1];
    }
  }
}
