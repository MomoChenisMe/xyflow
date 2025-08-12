// Angular 核心模組
import {
  Component,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// XyFlow 系統模組
import { Connection, addEdge } from '@xyflow/system';

// 專案內部模組
import {
  AngularXYFlowComponent,
  AngularNode,
  AngularEdge,
  AngularXYFlowInstance,
  NodeTypes,
} from '../../angular-xyflow';

// 自定義節點組件
import { DragHandleNodeComponent } from './drag-handle-node.component';

@Component({
  selector: 'app-drag-handle-example',
  standalone: true,
  imports: [CommonModule, AngularXYFlowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <angular-xyflow
      #angularFlow
      [defaultNodes]="initialNodes()"
      [defaultEdges]="initialEdges()"
      [nodeTypes]="nodeTypes"
      [nodeDragThreshold]="0"
      className="angular-xyflow-drag-handle-example"
      (onNodeClick)="onNodeClick($event)"
    >
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
    `,
  ],
})
export class DragHandleExampleComponent {
  // 視圖子元素引用
  angularFlow = viewChild.required(AngularXYFlowComponent);

  // 註冊自定義節點類型
  readonly nodeTypes: NodeTypes = {
    dragHandleNode: DragHandleNodeComponent,
  };

  // 初始節點數據
  initialNodes = signal<AngularNode[]>([
    {
      id: '1',
      type: 'dragHandleNode',
      dragHandle: '.custom-drag-handle',
      style: { border: '1px solid #ddd', padding: '20px 40px' },
      position: { x: 200, y: 100 },
      data: { label: 'V1 (原始版本)' },
    },
  ]);

  // 初始邊數據（空陣列）
  initialEdges = signal<AngularEdge[]>([]);

  // 節點點擊事件處理
  onNodeClick(data: { event: MouseEvent; node: AngularNode }): void {
    console.log('click', data.node);
  }
}
