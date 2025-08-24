import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Connection, addEdge } from '@xyflow/system';
import {
  AngularXYFlowComponent,
  AngularNode,
  AngularEdge,
  DevToolsComponent,
  NodeChange,
} from '../../angular-xyflow';

@Component({
  selector: 'app-devtools-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    DevToolsComponent,
  ],
  template: `
    <angular-xyflow
      [nodes]="nodes()"
      [edges]="edges()"
      (onNodesChange)="onNodesChange($event)"
      (onEdgesChange)="onEdgesChange($event)"
      (onConnect)="onConnect($event)"
      [fitView]="true"
    >
      <!-- 🔑 統一的 DevTools 組件 -->
      <angular-xyflow-devtools position="top-left" />
    </angular-xyflow>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    angular-xyflow {
      width: 100%;
      height: 100%;
    }
  `],
})
export class DevToolsExampleComponent {
  // 初始節點資料
  private readonly initNodes: AngularNode[] = [
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
      position: { x: 400, y: 200 },
    },
  ];

  // 初始邊資料
  private readonly initEdges: AngularEdge[] = [
    { id: 'e1-2', source: '1a', target: '2a' },
    { id: 'e1-3', source: '1a', target: '3a' },
  ];

  // 使用信號來管理節點和邊的狀態
  nodes = signal<AngularNode[]>(this.initNodes);
  edges = signal<AngularEdge[]>(this.initEdges);

  // 處理節點變更
  onNodesChange(changes: NodeChange[]): void {
    // 統一的 DevTools 組件會自動處理變更記錄
    
    // 套用節點變更
    const updatedNodes = changes.reduce((acc, change) => {
      if (change.type === 'position' && change.dragging && change.position) {
        const nodeIndex = acc.findIndex((n: AngularNode) => n.id === change.id);
        if (nodeIndex !== -1) {
          acc[nodeIndex] = {
            ...acc[nodeIndex],
            position: change.position,
          };
        }
      } else if (change.type === 'select') {
        const nodeIndex = acc.findIndex((n: AngularNode) => n.id === change.id);
        if (nodeIndex !== -1) {
          acc[nodeIndex] = {
            ...acc[nodeIndex],
            selected: change.selected,
          };
        }
      } else if (change.type === 'dimensions') {
        const nodeIndex = acc.findIndex((n: AngularNode) => n.id === change.id);
        if (nodeIndex !== -1) {
          acc[nodeIndex] = {
            ...acc[nodeIndex],
            measured: {
              width: change.dimensions?.width || 0,
              height: change.dimensions?.height || 0,
            },
          };
        }
      }
      return acc;
    }, [...this.nodes()]);

    this.nodes.set(updatedNodes);
  }

  // 處理邊變更
  onEdgesChange(changes: any[]): void {
    // 套用邊變更
    const updatedEdges = changes.reduce((acc, change) => {
      if (change.type === 'select') {
        const edgeIndex = acc.findIndex((e: AngularEdge) => e.id === change.id);
        if (edgeIndex !== -1) {
          acc[edgeIndex] = {
            ...acc[edgeIndex],
            selected: change.selected,
          };
        }
      }
      return acc;
    }, [...this.edges()]);

    this.edges.set(updatedEdges);
  }

  // 處理連接事件
  onConnect(connection: Connection): void {
    this.edges.update((edges) => addEdge(connection, edges));
  }
}