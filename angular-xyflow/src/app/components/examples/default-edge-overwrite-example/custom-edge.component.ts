import {
  Component,
  input,
  ChangeDetectionStrategy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position } from '@xyflow/system';
import { EdgeProps } from '../../angular-xyflow/types';

@Component({
  selector: 'svg:svg[app-custom-edge]',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg:path
      [attr.d]="edgePath()"
      [attr.stroke]="pathStroke()"
      stroke-width="3"
      fill="none"
      stroke-dasharray="5,5"
      style="pointer-events: none;"
    />
    
    <!-- 不可見的交互路徑，用於擴大點擊和 hover 範圍 -->
    <svg:path
      [attr.d]="edgePath()"
      stroke="transparent"
      [attr.stroke-width]="interactionWidth() || 20"
      fill="none"
      style="pointer-events: stroke; cursor: pointer;"
    />
  `,
})
export class CustomEdgeComponent {
  // 定義 input 屬性以接收 EdgeProps（與 React 版本一致）
  id = input<string>();
  data = input<Record<string, unknown>>();
  type = input<string>();
  selected = input<boolean>();
  sourceX = input.required<number>();
  sourceY = input.required<number>();
  targetX = input.required<number>();
  targetY = input.required<number>();
  sourcePosition = input<Position>();
  targetPosition = input<Position>();
  sourceHandleId = input<string>();
  targetHandleId = input<string>();
  markerStart = input<any>();
  markerEnd = input<any>();
  style = input<Record<string, any>>();
  animated = input<boolean>();
  hidden = input<boolean>();
  deletable = input<boolean>();
  selectable = input<boolean>();
  interactionWidth = input<number>();
  pathOptions = input<any>();

  // 計算邊顏色（基於選中狀態）
  pathStroke = computed(() => {
    const isSelected = this.selected();
    return isSelected ? '#555' : 'red'; // 選中時使用統一顏色，未選中時使用紅色
  });

  // 計算邊路徑（類似 React 版本的 getBezierPath）
  edgePath = computed(() => {
    const sourceX = this.sourceX();
    const sourceY = this.sourceY();
    const targetX = this.targetX();
    const targetY = this.targetY();
    const sourcePosition = this.sourcePosition() || Position.Bottom;
    const targetPosition = this.targetPosition() || Position.Top;

    // 檢查必需的值是否已設置
    if (
      sourceX === undefined ||
      sourceY === undefined ||
      targetX === undefined ||
      targetY === undefined
    ) {
      return 'M 0,0 L 0,0'; // 返回一個空路徑
    }

    return this.getBezierPath(
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition
    );
  });

  // 貝塞爾曲線路徑計算（簡化版本）
  private getBezierPath(
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    sourcePosition: Position,
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
