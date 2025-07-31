import {
  Component,
  input,
  TemplateRef,
  ChangeDetectionStrategy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position } from '@xyflow/system';
import { ConnectionLineTemplateContext } from '../types';

export interface ConnectionState {
  inProgress: boolean;
  from: { x: number; y: number };
  to: { x: number; y: number };
  fromPosition: Position;
  toPosition: Position;
  isValid?: boolean | null;
}

@Component({
  selector: '[angular-flow-connection-line]',
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
      <svg:g class="angular-flow__connection xy-flow__connection">
        <svg:path
          [attr.d]="connectionPath()"
          [attr.stroke]="connectionStroke()"
          [attr.stroke-width]="connectionStrokeWidth()"
          [attr.fill]="'none'"
          [class]="connectionClass()"
          style="pointer-events: none;"
        />
        @if (connectionType() === 'react' && connectionState()) {
          @let state = connectionState()!;
          <svg:circle 
            [attr.cx]="state.to.x" 
            [attr.cy]="state.to.y" 
            [attr.fill]="'#fff'" 
            [attr.r]="'3'" 
            [attr.stroke]="'#222'" 
            [attr.stroke-width]="'1.5'"
            style="pointer-events: none;"
          />
        }
      </svg:g>
    }
  `,
})
export class ConnectionLineComponent {
  // 輸入信號
  connectionState = input.required<ConnectionState | null>();
  customTemplate = input<TemplateRef<ConnectionLineTemplateContext> | undefined>();
  connectionType = input<'default' | 'react'>('default');

  // 計算信號
  connectionPath = computed(() => {
    const state = this.connectionState();
    if (!state) return null;

    const { from, to, fromPosition, toPosition } = state;
    const type = this.connectionType();

    // 根據自定義連接線類型選擇不同的路徑算法
    if (type === 'react') {
      // 使用React樣式的路徑算法
      return `M${from.x},${from.y} C ${from.x} ${to.y} ${from.x} ${to.y} ${to.x},${to.y}`;
    }

    // 預設使用貝茲曲線路徑
    return this.getBezierPath(
      from.x,
      from.y,
      fromPosition,
      to.x,
      to.y,
      toPosition
    );
  });

  connectionStroke = computed(() => {
    const state = this.connectionState();
    if (!state) return '#b1b1b7';

    const type = this.connectionType();
    if (type === 'react') {
      return '#222';
    }

    return state.isValid === true
      ? '#10b981'
      : state.isValid === false
      ? '#f87171'
      : '#b1b1b7';
  });

  connectionStrokeWidth = computed(() => {
    const type = this.connectionType();
    return type === 'react' ? '1.5' : '1';
  });

  connectionClass = computed(() => {
    const baseClass = 'angular-flow__connection-path xy-flow__connection-path';
    const type = this.connectionType();
    return type === 'react' ? `${baseClass} animated` : baseClass;
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
      connectionLineStyle: undefined,
    };

    // 使用 $implicit 作為預設值，並提供所有變數作為具名屬性
    return {
      $implicit: props,
      ...props,
    };
  });

  private getBezierPath(
    sourceX: number,
    sourceY: number,
    sourcePosition: Position,
    targetX: number,
    targetY: number,
    targetPosition: Position,
    curvature: number = 0.25
  ): string {
    const getControlPoint = (
      pos: Position,
      x: number,
      y: number,
      targetX: number,
      targetY: number
    ): [number, number] => {
      const distance = Math.sqrt((targetX - x) ** 2 + (targetY - y) ** 2);
      const offset = Math.max(distance * curvature, 20);

      switch (pos) {
        case Position.Left:
          return [x - offset, y];
        case Position.Right:
          return [x + offset, y];
        case Position.Top:
          return [x, y - offset];
        case Position.Bottom:
          return [x, y + offset];
        default:
          return [x, y];
      }
    };

    const [sourceControlX, sourceControlY] = getControlPoint(
      sourcePosition,
      sourceX,
      sourceY,
      targetX,
      targetY
    );
    const [targetControlX, targetControlY] = getControlPoint(
      targetPosition,
      targetX,
      targetY,
      sourceX,
      sourceY
    );

    return `M ${sourceX},${sourceY} C ${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`;
  }
}