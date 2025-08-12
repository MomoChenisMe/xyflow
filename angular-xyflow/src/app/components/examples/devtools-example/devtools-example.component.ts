import { Component, ChangeDetectionStrategy, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Connection, addEdge } from '@xyflow/system';
import {
  AngularXYFlowComponent,
  AngularNode,
  AngularEdge,
  PanelComponent,
  ViewportPortalDirective,
  NodeChange,
} from '../../angular-xyflow';
import { NodeInspectorComponent } from './devtools/node-inspector.component';
import { ChangeLoggerComponent } from './devtools/change-logger.component';

@Component({
  selector: 'app-devtools-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    PanelComponent,
    ViewportPortalDirective,
    NodeInspectorComponent,
    ChangeLoggerComponent,
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
      <!-- DevTools Panel -->
      <angular-xyflow-panel position="top-left">
        <button
          class="devtool-button"
          [class.active]="nodeInspectorActive()"
          (click)="toggleNodeInspector()"
          title="Toggle Node Inspector"
        >
          Node Inspector
        </button>
        <button
          class="devtool-button"
          [class.active]="changeLoggerActive()"
          (click)="toggleChangeLogger()"
          title="Toggle Change Logger"
        >
          Change Logger
        </button>
      </angular-xyflow-panel>
      
      <!-- Change Logger (outside viewport) -->
      @if (changeLoggerActive()) {
        <app-change-logger #changeLogger />
      }
      
      <!-- Node Inspector (inside viewport) -->
      <div viewportPortal>
        @if (nodeInspectorActive()) {
          <app-node-inspector [nodes]="nodes()" />
        }
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
    
    .devtool-button {
      background: white;
      border: none;
      padding: 5px 15px;
      color: #222;
      font-weight: bold;
      font-size: 12px;
      cursor: pointer;
      font-family: monospace, sans-serif;
      background-color: #f4f4f4;
    }

    .devtool-button:hover {
      background: rgba(238, 58, 115, 1);
      color: white;
    }

    .devtool-button.active {
      background: rgba(238, 58, 115, 1);
      color: white;
    }

    .devtool-button:first-child {
      border-radius: 4px 0 0 4px;
      border-right: 1px solid #ddd;
    }

    .devtool-button:last-child {
      border-radius: 0 4px 4px 0;
    }
  `],
})
export class DevToolsExampleComponent {
  // 控制工具的顯示狀態
  nodeInspectorActive = signal(false);
  changeLoggerActive = signal(false);
  
  // 取得 ChangeLogger 組件參考
  changeLogger = viewChild(ChangeLoggerComponent);
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
    // 如果 ChangeLogger 存在，將變更傳遞給它
    const logger = this.changeLogger();
    if (logger) {
      logger.onNodesChange(changes);
    }
    
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
  
  // 切換 Node Inspector
  toggleNodeInspector(): void {
    this.nodeInspectorActive.update((active) => !active);
  }

  // 切換 Change Logger
  toggleChangeLogger(): void {
    this.changeLoggerActive.update((active) => !active);
  }
}