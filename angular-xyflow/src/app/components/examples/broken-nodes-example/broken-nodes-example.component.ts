import { Component, signal, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

// XyFlow 系統模組
import { Connection, addEdge } from '@xyflow/system';

// 專案內部模組
import {
  AngularXYFlowComponent,
  AngularNode,
  AngularEdge,
  AngularXYFlowInstance,
} from '../../angular-xyflow';

@Component({
  selector: 'app-broken-nodes-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <angular-xyflow
      #angularFlow
      [defaultNodes]="initialNodes()"
      [defaultEdges]="initialEdges()"
      [selectNodesOnDrag]="false"
      [elevateEdgesOnSelect]="true"
      [elevateNodesOnSelect]="false"
      [nodeDragThreshold]="0"
      [panOnDrag]="true"
      className="broken-nodes-flow"
      (onNodesChange)="onNodesChange($event)"
      (onEdgesChange)="onEdgesChange($event)"
      (onConnect)="onConnect($event)"
      (onNodeDrag)="onNodeDrag($event)"
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
export class BrokenNodesExampleComponent {
  // 視圖子元素引用
  readonly angularFlow = viewChild.required(AngularXYFlowComponent);

  // 初始節點數據 - 直接設置 NaN 值，與 React 版本一致
  readonly initialNodes = signal<AngularNode[]>([
    {
      id: '1a',
      type: 'input',
      data: { label: 'Node 1' },
      position: { x: 250, y: 5 },
    },
    {
      id: '2a',
      data: { label: 'Node 2' },
      position: { x: 100, y: 100 },
    },
    {
      id: '3a',
      data: { label: 'Node 3' },
      position: { x: 400, y: 100 },
    },
    {
      id: '4a',
      data: { label: 'Node 4' },
      position: { x: NaN, y: 200 }, // 直接使用 NaN，與 React 版本一致
    },
  ]);

  // 初始邊數據 - 從 React 範例轉換
  readonly initialEdges = signal<AngularEdge[]>([
    { id: 'e1-2', source: '1a', target: '2a' },
    { id: 'e1-3', source: '1a', target: '3a' },
  ]);

  // 獲取流程實例
  private get _flow(): AngularXYFlowInstance<AngularNode, AngularEdge> {
    return this.angularFlow().getFlow();
  }

  // 事件處理方法 - 空的 onNodesChange 和 onEdgesChange 如 React 範例
  onNodesChange(_nodes: AngularNode[]): void {
    // 空的處理函數，如 React 範例中的空函數
  }

  onEdgesChange(_edges: AngularEdge[]): void {
    // 空的處理函數，如 React 範例中的空函數
  }

  // onConnect 處理函數 - 添加新邊
  onConnect(connection: Connection): void {
    this._flow.setEdges((edges: AngularEdge[]) => addEdge(connection, edges));
  }

  // onNodeDrag 處理函數 - 檢查 NaN 值並更新節點位置
  onNodeDrag(data: {
    event: MouseEvent;
    node: AngularNode;
    nodes: AngularNode[];
  }): void {
    const { node } = data;

    // 檢查 NaN 值，如 React 範例中的邏輯
    if (isNaN(node.position.x) || isNaN(node.position.y)) {
      console.log('received NaN', node.position);
    }

    // 更新節點位置
    this._flow.setNodes((nodes: AngularNode[]) => {
      return nodes.map((item: AngularNode) => {
        if (item.id === node.id) {
          return {
            ...item,
            position: {
              x: node.position.x,
              y: node.position.y,
            },
          };
        }
        return item;
      });
    });
  }
}
