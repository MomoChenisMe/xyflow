import { Component, signal, computed, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AngularXYFlowComponent,
  ConnectionLineTemplateDirective,
  AngularNode,
  AngularEdge,
  MarkerType,
  NodeChange,
  EdgeChange
} from '../../angular-xyflow';
import { CustomNodeComponent } from './custom-node.component';
import { FloatingEdgeComponent } from './floating-edge.component';
import { Connection, addEdge } from '@xyflow/system';
import { applyNodeChanges, applyEdgeChanges } from '../../angular-xyflow/utils/changes';

@Component({
  selector: 'app-easy-connect-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    ConnectionLineTemplateDirective,
    CustomNodeComponent,
    FloatingEdgeComponent
  ],
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <angular-xyflow
      [nodes]="nodes()"
      [edges]="edges()"
      [nodeTypes]="nodeTypes"
      [edgeTypes]="edgeTypes"
      [defaultEdgeOptions]="defaultEdgeOptions"
      [connectionLineStyle]="connectionLineStyle"
      [fitView]="true"
      [nodeDragThreshold]="0"
      [panOnDrag]="true"
      [selectNodesOnDrag]="false"
      (onNodesChange)="onNodesChange($event)"
      (onEdgesChange)="onEdgesChange($event)"
      (onConnect)="onConnect($event)"
    >
      <!-- 自定義連接線模板 -->
      <ng-template
        angularXyFlowConnectionLine
        let-fromX="fromX"
        let-fromY="fromY"
        let-toX="toX"
        let-toY="toY"
        let-connectionLineStyle="connectionLineStyle"
      >
        <svg:g class="angular-xyflow__connection-line xy-flow__connection-line">
          <svg:path
            [attr.d]="'M' + fromX + ',' + fromY + ' L ' + toX + ',' + toY"
            [attr.stroke]="connectionLineStyle?.stroke || 'black'"
            [attr.stroke-width]="connectionLineStyle?.['stroke-width'] || connectionLineStyle?.strokeWidth || 3"
            fill="none"
          />
          <svg:circle
            [attr.cx]="toX"
            [attr.cy]="toY"
            [attr.fill]="'black'"
            [attr.r]="3"
            [attr.stroke]="'black'"
            [attr.stroke-width]="1.5"
          />
        </svg:g>
      </ng-template>
    </angular-xyflow>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class EasyConnectExampleComponent {
  // 使用 Signal 管理節點和邊緣狀態
  nodes = signal<AngularNode[]>([
    {
      id: '1',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: {},
    },
    {
      id: '2',
      type: 'custom',
      position: { x: 250, y: 320 },
      data: {},
    },
    {
      id: '3',
      type: 'custom',
      position: { x: 40, y: 300 },
      data: {},
    },
    {
      id: '4',
      type: 'custom',
      position: { x: 300, y: 0 },
      data: {},
    }
  ]);

  edges = signal<AngularEdge[]>([]);

  // 自定義節點和邊緣類型
  nodeTypes = {
    custom: CustomNodeComponent
  };

  edgeTypes = {
    floating: FloatingEdgeComponent
  };

  // 預設邊緣選項
  defaultEdgeOptions = {
    style: { strokeWidth: 3, stroke: 'black' },
    type: 'floating',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'black'
    }
  };

  // 連線樣式
  connectionLineStyle = {
    strokeWidth: 3,
    stroke: 'black'
  };

  onNodesChange(changes: NodeChange[]) {
    // 處理節點變更
    this.nodes.update(nodes => applyNodeChanges(changes, nodes));
  }

  onEdgesChange(changes: EdgeChange[]) {
    // 處理邊緣變更
    this.edges.update(edges => applyEdgeChanges(changes, edges));
  }

  onConnect(connection: Connection) {
    // 處理連線，確保有 handle ID 並應用 defaultEdgeOptions
    const newConnection = {
      ...this.defaultEdgeOptions,
      ...connection,
      sourceHandle: connection.sourceHandle || 'source',
      targetHandle: connection.targetHandle || 'target'
    };

    this.edges.update(edges => {
      const newEdges = addEdge(newConnection, edges);
      return newEdges as AngularEdge[];
    });
  }
}
