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
      [elementsSelectable]="elementsSelectable()"
      (onNodesChange)="onNodesChange($event)"
      (onEdgesChange)="onEdgesChange($event)"
      (onConnect)="onConnect($event)"
      [fitView]="true"
    >
      <!-- 🔑 統一的 DevTools 組件 -->
      <angular-xyflow-devtools position="top-left" />
      
      <!-- 測試控制面板 -->
      <div style="position: absolute; top: 10px; right: 10px; background: white; padding: 10px; border: 1px solid #ccc; border-radius: 4px; z-index: 1000;">
        <h4>Selection Test</h4>
        <label>
          <input 
            type="checkbox" 
            [checked]="elementsSelectable()" 
            (change)="toggleElementsSelectable()"
          />
          Elements Selectable
        </label>
        <br>
        <label>
          <input 
            type="checkbox" 
            [checked]="node2Selectable()" 
            (change)="toggleNode2Selectable()"
          />
          Node 2 Selectable
        </label>
        <div style="margin-top: 10px; font-size: 12px;">
          <div>Elements Selectable: {{ elementsSelectable() }}</div>
          <div>Node 2 Selectable: {{ node2Selectable() }}</div>
        </div>
      </div>
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
  // 測試控制信號
  elementsSelectable = signal<boolean>(true);
  node2Selectable = signal<boolean | undefined>(undefined);

  // 測試控制方法
  toggleElementsSelectable(): void {
    this.elementsSelectable.update(value => !value);
  }

  toggleNode2Selectable(): void {
    this.node2Selectable.update(value => {
      if (value === undefined) return true;
      if (value === true) return false;
      return undefined;
    });

    // 更新節點狀態
    this.nodes.update(nodes => {
      return nodes.map(node => {
        if (node.id === '2a') {
          return { ...node, selectable: this.node2Selectable() };
        }
        return node;
      });
    });
  }

  // 初始節點資料 - 使用computed來響應配置變化
  nodes = signal<AngularNode[]>([
    {
      id: '1a',
      type: 'input',
      data: { label: 'Node 1 (always inherits)' },
      position: { x: 250, y: 5 },
    },
    {
      id: '2a',
      data: { label: 'Node 2 (configurable)' },
      position: { x: 100, y: 100 },
      selectable: this.node2Selectable(),
    },
    {
      id: '3a',
      data: { label: 'Node 3 (always selectable)' },
      position: { x: 400, y: 100 },
      selectable: true,
    },
    {
      id: '4a',
      data: { label: 'Node 4 (always unselectable)' },
      position: { x: 400, y: 200 },
      selectable: false,
    },
  ]);

  // 初始邊資料
  edges = signal<AngularEdge[]>([
    { id: 'e1-2', source: '1a', target: '2a' },
    { id: 'e1-3', source: '1a', target: '3a' },
  ]);

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