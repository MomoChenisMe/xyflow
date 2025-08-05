import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position } from '@xyflow/system';
import { EdgeMarker, MarkerType } from '../types';

@Component({
  selector: '[angular-xyflow-edge]',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 可見的邊路徑 -->
    <svg:path
      [attr.d]="edgePath()"
      [attr.fill]="'none'"
      [attr.marker-start]="markerStartUrl()"
      [attr.marker-end]="markerEndUrl()"
      [class]="'angular-xyflow__edge-path xy-flow__edge-path'"
      [ngStyle]="edgeStyles()"
      style="pointer-events: none;"
    />
    
    <!-- 不可見的交互路徑，用於擴大點擊和 hover 範圍 -->
    <svg:path
      [attr.d]="edgePath()"
      [attr.stroke]="'transparent'"
      [attr.stroke-width]="20"
      [attr.fill]="'none'"
      [class]="'angular-xyflow__edge-interaction xy-flow__edge-interaction'"
      [ngStyle]="interactionStyles()"
      style="pointer-events: stroke; cursor: pointer;"
      (click)="handleClick($event)"
      (dblclick)="handleDoubleClick($event)"
      (contextmenu)="handleContextMenu($event)"
    />

    <!-- Edge label -->
    @if (edge().data?.['label']) {
      <svg:text
        [attr.x]="labelX()"
        [attr.y]="labelY()"
        text-anchor="middle"
        dominant-baseline="middle"
        class="angular-xyflow__edge-label xy-flow__edge-label"
        style="font-size: 12px; fill: #222; pointer-events: none;"
      >
        {{ edge().data?.['label'] }}
      </svg:text>
    }
  `,
})
export class EdgeComponent {
  // 輸入信號
  edge = input.required<any>();
  sourceX = input.required<number>();
  sourceY = input.required<number>();
  targetX = input.required<number>();
  targetY = input.required<number>();
  sourcePosition = input.required<Position>();
  targetPosition = input.required<Position>();
  isDarkMode = input<boolean>(false);
  getMarkerId = input.required<(edge: any, position: 'start' | 'end', marker: EdgeMarker) => string>();

  // 輸出事件
  edgeClick = output<{ event: MouseEvent; edge: any }>();
  edgeDoubleClick = output<{ event: MouseEvent; edge: any }>();
  edgeContextMenu = output<{ event: MouseEvent; edge: any }>();

  // 計算信號
  edgePath = computed(() => {
    return this.calculateEdgePath();
  });

  labelX = computed(() => {
    return (this.sourceX() + this.targetX()) / 2;
  });

  labelY = computed(() => {
    return (this.sourceY() + this.targetY()) / 2;
  });

  edgeStyles = computed(() => {
    const isDark = this.isDarkMode();
    const edge = this.edge();
    const selectedStroke = isDark ? '#727272' : '#555';
    const defaultStroke = isDark ? '#3e3e3e' : '#b1b1b7';
    
    const defaultStyles = {
      stroke: edge.selected ? selectedStroke : defaultStroke,
      strokeWidth: edge.selected ? 2 : 1,
      fill: 'none',
    };

    // 合併自定義樣式，優先級高於默認樣式
    const styles = edge.style ? { ...defaultStyles, ...edge.style } : defaultStyles;
    
    // 如果是 animated edge，添加動畫相關的樣式
    if (edge.animated) {
      styles.strokeDasharray = '5';
      styles.animation = 'dashdraw 0.5s linear infinite';
    }
    
    return styles;
  });

  interactionStyles = computed(() => {
    // 交互路徑永遠不應該有動畫效果
    return {
      strokeDasharray: 'none',
      animation: 'none',
    };
  });

  markerStartUrl = computed(() => {
    return this.getMarkerUrl('start');
  });

  markerEndUrl = computed(() => {
    return this.getMarkerUrl('end');
  });


  private calculateEdgePath(): string {
    // 根據邊類型返回不同的路徑
    const edge = this.edge();
    const edgeType = (edge as any).type || 'default';
    const sourceX = this.sourceX();
    const sourceY = this.sourceY();
    const targetX = this.targetX();
    const targetY = this.targetY();
    const sourcePosition = this.sourcePosition();
    const targetPosition = this.targetPosition();

    switch (edgeType) {
      case 'straight':
        return `M ${sourceX},${sourceY} L ${targetX},${targetY}`;

      case 'step':
        const midX = (sourceX + targetX) / 2;
        return `M ${sourceX},${sourceY} L ${midX},${sourceY} L ${midX},${targetY} L ${targetX},${targetY}`;

      case 'smoothstep':
        // 簡化的 smooth step 實現
        const offsetX = Math.abs(targetX - sourceX) * 0.5;

        if (
          sourcePosition === Position.Right &&
          targetPosition === Position.Left
        ) {
          const midX = sourceX + offsetX;
          return `M ${sourceX},${sourceY} L ${midX},${sourceY} Q ${
            midX + 10
          },${sourceY} ${midX + 10},${sourceY + 10} L ${midX + 10},${
            targetY - 10
          } Q ${midX + 10},${targetY} ${
            midX + 20
          },${targetY} L ${targetX},${targetY}`;
        }

        return this.getBezierPath(0.1);

      case 'default':
      case 'bezier':
      default:
        return this.getBezierPath();
    }
  }

  private getBezierPath(curvature: number = 0.25): string {
    const sourceX = this.sourceX();
    const sourceY = this.sourceY();
    const targetX = this.targetX();
    const targetY = this.targetY();
    const sourcePosition = this.sourcePosition();
    const targetPosition = this.targetPosition();

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

  private getMarkerUrl(position: 'start' | 'end'): string | null {
    const edge = this.edge();
    const marker = position === 'start' ? edge.markerStart : edge.markerEnd;
    if (!marker) return null;

    const markerData =
      typeof marker === 'string' ? { type: MarkerType.ArrowClosed } : marker;
    const markerId = this.getMarkerId()(edge, position, markerData);
    return `url(#${markerId})`;
  }

  handleClick(event: MouseEvent): void {
    event.stopPropagation();
    this.edgeClick.emit({ event, edge: this.edge() });
  }

  handleDoubleClick(event: MouseEvent): void {
    event.stopPropagation();
    this.edgeDoubleClick.emit({ event, edge: this.edge() });
  }

  handleContextMenu(event: MouseEvent): void {
    event.stopPropagation();
    // React Flow 邏輯：不阻止瀏覽器預設的右鍵菜單，讓開發者自行決定
    this.edgeContextMenu.emit({ event, edge: this.edge() });
  }
}