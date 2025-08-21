import { Component, ChangeDetectionStrategy, input, computed, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularNode } from '../../angular-xyflow/types';
import { Position, getBezierPath } from '@xyflow/system';
import { getEdgeParams } from './floating-edges.utils';

@Component({
  selector: 'app-floating-connection-line',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @if (connectionPath()) {
      <svg:g>
        <svg:path 
          fill="none" 
          stroke="#222" 
          stroke-width="1.5" 
          class="animated" 
          [attr.d]="connectionPath()"
        />
        <svg:circle 
          [attr.cx]="toX()" 
          [attr.cy]="toY()" 
          fill="#fff" 
          r="3" 
          stroke="#222" 
          stroke-width="1.5"
        />
      </svg:g>
    }
  `,
  styles: [`
    .animated {
      stroke-dasharray: 5;
      animation: dashdraw 0.5s linear infinite;
    }
    
    @keyframes dashdraw {
      0% {
        stroke-dashoffset: 10;
      }
      100% {
        stroke-dashoffset: 0;
      }
    }
  `]
})
export class FloatingConnectionLineComponent {
  // 與React版本的ConnectionLineComponentProps一致的輸入
  toX = input.required<number>();
  toY = input.required<number>();
  fromPosition = input.required<Position>();
  toPosition = input.required<Position>();
  fromNode = input.required<AngularNode | null>();

  // 計算連接線路徑 - 與React版本完全一致的邏輯
  connectionPath = computed(() => {
    const fromNodeValue = this.fromNode();
    
    if (!fromNodeValue) {
      return null;
    }

    // 為from節點添加絕對位置信息（如果它是從服務獲取的話，應該已經包含）
    // 但為了安全起見，我們確保positionAbsolute存在
    const fromNodeWithAbsolute = {
      ...fromNodeValue,
      positionAbsolute: (fromNodeValue as any).positionAbsolute || fromNodeValue.position
    } as any;

    // 創建虛擬目標節點 - 與React版本完全一樣
    const targetNode: AngularNode = {
      id: 'connection-target',
      type: 'default',
      data: {},
      measured: {
        width: 1,
        height: 1,
      },
      position: { x: this.toX(), y: this.toY() },
      positionAbsolute: { x: this.toX(), y: this.toY() }, // 添加絕對位置
    } as any;

    // 使用getEdgeParams計算浮動連接點
    const { sx, sy } = getEdgeParams(fromNodeWithAbsolute, targetNode);

    // 生成貝茲曲線路徑
    const [path] = getBezierPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: this.fromPosition(),
      targetPosition: this.toPosition(),
      targetX: this.toX(),
      targetY: this.toY(),
    });

    return path;
  });
}