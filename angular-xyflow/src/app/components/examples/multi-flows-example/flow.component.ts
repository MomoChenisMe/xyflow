// Angular 核心模組
import {
  Component,
  signal,
  input,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// XyFlow 系統模組
import { Position, MarkerType } from '@xyflow/system';

// 專案內部模組
import {
  AngularXYFlowComponent,
  BackgroundComponent,
  MinimapComponent,
  AngularNode,
  AngularEdge,
  BackgroundVariant,
  AngularXYFlowInstance,
  NodeChange,
  EdgeChange,
} from '../../angular-xyflow';
import { applyNodeChanges, applyEdgeChanges } from '../../angular-xyflow/utils/changes';

@Component({
  selector: 'app-flow',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    BackgroundComponent,
    MinimapComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <angular-xyflow
      #angularFlow
      [id]="id()"
      [nodes]="nodes()"
      [edges]="edges()"
      [fitView]="true"
      (onNodesChange)="onNodesChange($event)"
      (onEdgesChange)="onEdgesChange($event)"
      (onConnect)="onConnect($event)"
      className="multi-flow"
    >
      <angular-xyflow-background [variant]="backgroundVariant.Dots" />
      <angular-xyflow-minimap />
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
export class FlowComponent {
  // 輸入屬性
  id = input.required<string>();

  // 視圖子元素引用
  angularFlow = viewChild.required(AngularXYFlowComponent);

  // 背景變體枚舉
  backgroundVariant = BackgroundVariant;

  // 初始節點數據
  private initialNodes: AngularNode[] = [
    {
      id: '1',
      type: 'input',
      data: { label: 'Node 1' },
      position: { x: 250, y: 5 },
      className: 'light',
      sourcePosition: Position.Bottom,
    },
    {
      id: '2',
      data: { label: 'Node 2' },
      position: { x: 100, y: 100 },
      className: 'light',
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    },
    {
      id: '3',
      data: { label: 'Node 3' },
      position: { x: 400, y: 100 },
      className: 'light',
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    },
    {
      id: '4',
      data: { label: 'Node 4' },
      position: { x: 400, y: 200 },
      className: 'light',
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    },
  ];

  // 初始邊數據
  private initialEdges: AngularEdge[] = [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      animated: true,
      markerEnd: { type: MarkerType.Arrow },
    },
    {
      id: 'e1-3',
      source: '1',
      target: '3',
    },
  ];

  // 控制狀態的信號（Controlled 模式）
  nodes = signal<AngularNode[]>(this.initialNodes);
  edges = signal<AngularEdge[]>(this.initialEdges);

  // 獲取流程實例
  private get _flow(): AngularXYFlowInstance<AngularNode, AngularEdge> {
    return this.angularFlow().getFlow();
  }

  // 事件處理方法
  onNodesChange(changes: NodeChange<AngularNode>[]): void {
    this.nodes.update(nodes => applyNodeChanges(changes, nodes));
  }

  onEdgesChange(changes: EdgeChange<AngularEdge>[]): void {
    this.edges.update(edges => applyEdgeChanges(changes, edges));
  }

  // 連接事件處理
  onConnect(params: any): void {
    // 創建新的邊，使用與 React 版本相同的邏輯
    const newEdge: AngularEdge = {
      ...params,
      id: `${params.source}-${params.target}`,
    };
    
    this.edges.update(edges => [...edges, newEdge]);
  }
}