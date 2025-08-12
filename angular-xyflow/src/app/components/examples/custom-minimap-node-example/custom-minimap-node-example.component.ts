// Angular 核心模組
import {
  Component,
  signal,
  viewChild,
  ChangeDetectionStrategy,
  inject,
  ViewEncapsulation,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// XyFlow 系統模組
import { Connection, addEdge } from '@xyflow/system';

// 專案內部模組
import {
  AngularXYFlowComponent,
  BackgroundComponent,
  ControlsComponent,
  PanelComponent,
  MinimapComponent,
  AngularNode,
  AngularEdge,
  BackgroundVariant,
  AngularXYFlowInstance,
  MinimapNodeTemplateDirective,
  NodeChange,
  EdgeChange,
} from '../../angular-xyflow';
import { applyNodeChanges, applyEdgeChanges } from '../../angular-xyflow/utils/changes';


@Component({
  selector: 'app-custom-minimap-node-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    BackgroundComponent,
    ControlsComponent,
    PanelComponent,
    MinimapComponent,
    MinimapNodeTemplateDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <angular-xyflow
      #angularFlow
      [nodes]="nodes()"
      [edges]="edges()"
      [minZoom]="0.2"
      [maxZoom]="4"
      className="angular-xyflow-custom-minimap-node-example"
      (onNodesChange)="onNodesChange($event)"
      (onEdgesChange)="onEdgesChange($event)"
      (onConnect)="onConnect($event)"
      (onNodeClick)="onNodeClick($event)"
      (onNodeDragStop)="onNodeDragStop($event)"
    >
      <angular-xyflow-background [variant]="backgroundVariant.Lines" />
      
      <angular-xyflow-controls />
      
      <!-- 使用標準 Minimap 組件搭配自定義節點模板 -->
      <angular-xyflow-minimap [pannable]="true" [zoomable]="true">
        <!-- 自定義 minimap 節點模板 - 圓形節點 -->
        <ng-template
          angularXyFlowMinimapNode
          let-node="node"
          let-x="x"
          let-y="y"
          let-width="width"
          let-height="height"
          let-selected="selected"
        >
          <svg:circle
            [attr.cx]="x + width / 2"
            [attr.cy]="y + height / 2"
            [attr.r]="Math.max(width, height) / 2"
            [attr.fill]="'#ffcc00'"
            [attr.stroke]="selected ? '#ff0072' : 'transparent'"
            [attr.stroke-width]="selected ? 2 : 0"
            class="custom-circle-node"
          />
        </ng-template>
      </angular-xyflow-minimap>
      
      <angular-xyflow-panel position="top-left">
        <div class="angular-xyflow-panel">
          <button (click)="addRandomNode()" class="flow-button">add node</button>
        </div>
      </angular-xyflow-panel>
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
      
      .angular-xyflow-panel {
        padding: 8px;
      }
      
      .flow-button {
        background: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
      }
      
      .flow-button:hover {
        background: #e0e0e0;
        border-color: #ccc;
      }
      
      .flow-button:active {
        background: #d0d0d0;
      }
      
      /* 自定義圓形節點樣式 */
      :host ::ng-deep .custom-circle-node {
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      :host ::ng-deep .custom-circle-node:hover {
        stroke: #ff8800 !important;
        stroke-width: 2 !important;
      }
    `,
  ],
})
export class CustomMinimapNodeExampleComponent {
  // 視圖子元素引用
  angularFlow = viewChild.required(AngularXYFlowComponent);

  // 背景變體枚舉
  readonly backgroundVariant = BackgroundVariant;
  
  // 提供 Math 函數給模板使用
  readonly Math = Math;

  // 節點和邊的信號
  nodes = signal<AngularNode[]>([]);
  edges = signal<AngularEdge[]>([]);

  // 節點 ID 計數器
  private nodeId = 1;

  // 獲取流程實例
  private get _flow(): AngularXYFlowInstance<AngularNode, AngularEdge> {
    return this.angularFlow().getFlow();
  }

  // 節點變化回調
  onNodesChange(changes: NodeChange<AngularNode>[]): void {
    this.nodes.update(nodes => applyNodeChanges(changes, nodes));
  }

  onEdgesChange(changes: EdgeChange<AngularEdge>[]): void {
    this.edges.update(edges => applyEdgeChanges(changes, edges));
  }

  // 連接回調
  onConnect(connection: Connection): void {
    this._flow.setEdges((edges: AngularEdge[]) => addEdge(connection, edges));
  }

  // 節點點擊回調
  onNodeClick(data: { event: MouseEvent; node: AngularNode }): void {
    console.log('click', data.node);
  }

  // 節點拖動停止回調
  onNodeDragStop(data: {
    event: MouseEvent;
    node: AngularNode;
    nodes: AngularNode[];
  }): void {
    console.log('drag stop', data.node);
  }

  // 添加隨機節點
  addRandomNode(): void {
    const newNode: AngularNode = {
      id: this.nodeId.toString(),
      data: { label: `Node: ${this.nodeId}` },
      position: {
        x: Math.random() * window.innerWidth * 0.8,
        y: Math.random() * window.innerHeight * 0.8,
      },
    };
    
    // 更新節點列表
    this.nodes.update(currentNodes => [...currentNodes, newNode]);
    
    // 增加節點 ID 計數器
    this.nodeId++;
  }
}