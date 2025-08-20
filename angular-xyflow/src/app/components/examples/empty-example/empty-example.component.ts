import {
  Component,
  signal,
  ChangeDetectionStrategy,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularXYFlowComponent } from '../../angular-xyflow/container/angular-xyflow/angular-xyflow.component';
import { BackgroundComponent } from '../../angular-xyflow/additional-components/background/background.component';
import { ControlsComponent } from '../../angular-xyflow/additional-components/controls/controls.component';
import { PanelComponent } from '../../angular-xyflow/additional-components/panel/panel.component';
import {
  AngularNode,
  AngularEdge,
  BackgroundVariant,
  NodeChange,
  EdgeChange,
  AngularXYFlowInstance,
  Viewport,
} from '../../angular-xyflow/types';
import { Connection, addEdge } from '@xyflow/system';
import {
  applyNodeChanges,
  applyEdgeChanges,
} from '../../angular-xyflow/utils/changes';

@Component({
  selector: 'app-empty-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    BackgroundComponent,
    ControlsComponent,
    PanelComponent,
  ],
  template: `
    <angular-xyflow
      #flow
      [nodes]="nodes()"
      [edges]="edges()"
      (onInit)="onInit($event)"
      (onNodesChange)="onNodesChange($event)"
      (onEdgesChange)="onEdgesChange($event)"
      (onConnect)="onConnect($event)"
      (onNodeClick)="onNodeClick($event)"
      (onNodeDragStop)="onNodeDragStop($event)"
    >
      <angular-xyflow-controls />
      <angular-xyflow-background [variant]="backgroundVariant.Lines" />

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

    `,
  ],
})
export class EmptyExampleComponent {
  // 視圖子元素引用
  flow = viewChild.required(AngularXYFlowComponent);

  // 背景變體枚舉
  backgroundVariant = BackgroundVariant;

  // 節點和邊的數據信號 - 初始為空陣列
  nodes = signal<AngularNode[]>([]);
  edges = signal<AngularEdge[]>([]);


  // 節點計數器
  private nodeCounter = 1;

  // 獲取流程實例
  private get _flow(): AngularXYFlowInstance<AngularNode, AngularEdge> {
    return this.flow().getFlow();
  }

  // 初始化事件處理
  onInit(data: { nodes: AngularNode[]; edges: AngularEdge[]; viewport: Viewport }): void {
    console.log('flow loaded:', data);
  }

  // Controlled mode 事件處理
  onNodesChange(changes: NodeChange<AngularNode>[]): void {
    this.nodes.update((nodes) => applyNodeChanges(changes, nodes));
  }

  onEdgesChange(changes: EdgeChange<AngularEdge>[]): void {
    this.edges.update((edges) => applyEdgeChanges(changes, edges));
  }

  onConnect(params: Connection): void {
    this.edges.update((edges) => addEdge(params, edges));
  }

  // 節點點擊事件
  onNodeClick(data: { event: MouseEvent; node: AngularNode }): void {
    console.log('click', data.node);
  }

  // 節點拖拽停止事件
  onNodeDragStop(data: {
    event: MouseEvent;
    node: AngularNode;
    nodes: AngularNode[];
  }): void {
    console.log('drag stop', data.node);
  }

  // 添加隨機節點功能
  addRandomNode(): void {
    const nodeId = this.nodeCounter.toString();
    const newNode: AngularNode = {
      id: nodeId,
      data: { label: `Node: ${nodeId}` },
      position: {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
      },
    };
    
    this.nodes.update((nodes) => [...nodes, newNode]);
    this.nodeCounter++;
  }
}