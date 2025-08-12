import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

// XyFlow 系統模組
import { Connection, addEdge } from '@xyflow/system';

// 專案內部模組
import {
  AngularXYFlowComponent,
  AngularNode,
  AngularEdge,
  NodeChange,
  EdgeChange,
} from '../../angular-xyflow';
import { applyNodeChanges, applyEdgeChanges } from '../../angular-xyflow/utils/changes';

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
      [nodes]="nodes()"
      [edges]="edges()"
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
  // Controlled 模式：節點和邊的狀態管理 - 與 React 版本一致
  nodes = signal<AngularNode[]>([
    {
      id: '1a',
      type: 'input',
      data: { label: 'Node 1' },
      position: { x: 250, y: 5 },
      className: 'light',
      ariaLabel: 'Input Node 1',
    },
    {
      id: '2a',
      data: { label: 'Node 2' },
      position: { x: 100, y: 100 },
      className: 'light',
      ariaLabel: 'Default Node 2',
    },
    {
      id: '3a',
      data: { label: 'Node 3' },
      position: { x: 400, y: 100 },
      className: 'light',
    },
    {
      id: '4a',
      data: { label: 'Node 4' },
      position: { x: 400, y: 200 },
      className: 'light',
    },
  ]);

  edges = signal<AngularEdge[]>([
    { id: 'e1-2', source: '1a', target: '2a', ariaLabel: undefined },
    { id: 'e1-3', source: '1a', target: '3a' },
  ]);

  // Controlled 模式事件處理方法 - 與 React 版本一致
  onNodesChange(changes: NodeChange<AngularNode>[]): void {
    // 在 controlled 模式下更新 nodes signal
    this.nodes.update(nodes => applyNodeChanges(changes, nodes));
  }

  onEdgesChange(changes: EdgeChange<AngularEdge>[]): void {
    // 在 controlled 模式下更新 edges signal
    this.edges.update(edges => applyEdgeChanges(changes, edges));
  }

  // onConnect 處理函數 - 添加新邊
  onConnect(connection: Connection): void {
    this.edges.set(addEdge(connection, this.edges()));
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

    // 在 controlled 模式下更新 nodes signal
    this.nodes.set(
      this.nodes().map((item: AngularNode) => {
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
      })
    );
  }
}
