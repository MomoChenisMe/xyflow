import { Component, ChangeDetectionStrategy, signal, computed, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

// XyFlow 系統模組
import { Connection, addEdge } from '@xyflow/system';

// 專案內部模組
import {
  AngularXYFlowComponent,
  BackgroundComponent,
  AngularNode,
  AngularEdge,
  BackgroundVariant,
  ConnectionLineTemplateDirective,
  NodeChange,
  EdgeChange,
} from '../../angular-xyflow';
import { applyNodeChanges, applyEdgeChanges } from '../../angular-xyflow/utils/changes';

@Component({
  selector: 'app-custom-connection-line-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    BackgroundComponent,
    ConnectionLineTemplateDirective,
  ],
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <angular-xyflow
      [nodes]="initialNodes()"
      [edges]="initialEdges()"
      [className]="'custom-connection-line-flow'"
      [connectionLineStyle]="{ stroke: '#ff6b6b', strokeWidth: '2' }"
      (onNodesChange)="onNodesChange($event)"
      (onEdgesChange)="onEdgesChange($event)"
      (onConnect)="onConnect($event)"
    >
      <!-- 自定義連接線模板 - 相當於React的ConnectionLine組件 -->
      <ng-template
        angularXyFlowConnectionLine
        let-fromX="fromX"
        let-fromY="fromY"
        let-toX="toX"
        let-toY="toY"
        let-fromPosition="fromPosition"
        let-toPosition="toPosition"
        let-isValid="isValid"
        let-connectionLineStyle="connectionLineStyle"
      >
        <svg:g class="angular-xyflow__connection-line xy-flow__connection-line">
          <!-- React風格的連接線路徑：使用動態樣式 -->
          <svg:path
            [attr.d]="'M' + fromX + ',' + fromY + ' C ' + fromX + ' ' + toY + ' ' + fromX + ' ' + toY + ' ' + toX + ',' + toY"
            fill="none"
            [attr.stroke]="connectionLineStyle?.stroke || '#222'"
            [attr.stroke-width]="connectionLineStyle?.['stroke-width'] || connectionLineStyle?.strokeWidth || '1.5'"
            class="animated"
          />
          
          <!-- 終點圓圈：使用動態樣式 -->
          <svg:circle
            [attr.cx]="toX"
            [attr.cy]="toY"
            fill="#fff"
            r="3"
            [attr.stroke]="connectionLineStyle?.stroke || '#222'"
            [attr.stroke-width]="connectionLineStyle?.['stroke-width'] || connectionLineStyle?.strokeWidth || '1.5'"
          />
        </svg:g>
      </ng-template>

      <angular-xyflow-background [variant]="backgroundVariant.Lines" />
    </angular-xyflow>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      angular-xyflow {
        width: 100%;
        height: 100%;
      }

      /* 連接線動畫效果 - 與React版本保持一致的簡潔動畫 */
      :host ::ng-deep .animated {
        stroke-dasharray: 5;
        animation: dashdraw 0.5s linear infinite;
      }

      @keyframes dashdraw {
        to {
          stroke-dashoffset: -10;
        }
      }
    `,
  ],
})
export class CustomConnectionLineExampleComponent {
  // 背景變體枚舉
  readonly backgroundVariant = BackgroundVariant;

  // 初始節點數據
  initialNodes = signal<AngularNode[]>([
    {
      id: '1',
      type: 'default',
      data: { label: 'Node 1' },
      position: { x: 250, y: 5 },
    },
  ]);

  // 初始邊數據
  initialEdges = signal<AngularEdge[]>([]);

  // 連接事件處理
  // Controlled mode event handlers
  onNodesChange(changes: NodeChange<AngularNode>[]): void {
    this.initialNodes.update(nodes => applyNodeChanges(changes, nodes));
  }

  onEdgesChange(changes: EdgeChange<AngularEdge>[]): void {
    this.initialEdges.update(edges => applyEdgeChanges(changes, edges));
  }

  onConnect(connection: Connection): void {

    // 更新邊資料
    this.initialEdges.update(edges => addEdge(connection, edges));
  }
}
