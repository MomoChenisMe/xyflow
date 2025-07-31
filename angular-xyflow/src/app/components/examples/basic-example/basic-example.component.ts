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
  AngularFlowComponent,
  BackgroundComponent,
  ControlsComponent,
  PanelComponent,
  MinimapComponent,
  AngularNode,
  AngularEdge,
  BackgroundVariant,
  AngularFlowInstance,
} from '../../angular-flow';

@Component({
  selector: 'app-basic-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularFlowComponent,
    BackgroundComponent,
    ControlsComponent,
    PanelComponent,
    MinimapComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <angular-xyflow
      #angularFlow
      [defaultNodes]="initialNodes()"
      [defaultEdges]="initialEdges()"
      [minZoom]="0.2"
      [maxZoom]="4"
      [fitView]="true"
      [fitViewOptions]="fitViewOptions()"
      [defaultEdgeOptions]="defaultEdgeOptions()"
      [selectNodesOnDrag]="false"
      [elevateEdgesOnSelect]="true"
      [elevateNodesOnSelect]="false"
      [nodeDragThreshold]="0"
      [panOnDrag]="true"
      className="angular-xyflow-basic-example"
      (onNodesChange)="onNodesChange($event)"
      (onConnect)="onConnect($event)"
      (onNodeClick)="onNodeClick($event)"
      (onNodeDragStart)="onNodeDragStart($event)"
      (onNodeDrag)="onNodeDrag($event)"
      (onNodeDragStop)="onNodeDragStop($event)"
      (onSelectionDragStart)="onSelectionDragStart($event)"
      (onSelectionDrag)="onSelectionDrag($event)"
      (onSelectionDragStop)="onSelectionDragStop($event)"
    >
      <angular-xyflow-background [variant]="backgroundVariant.Dots" />

      <angular-xyflow-minimap [pannable]="true" [zoomable]="true" />

      <angular-xyflow-controls />

      <angular-xyflow-panel position="top-right">
        <div class="angular-xyflow-panel">
          <button (click)="resetTransform()" class="flow-button">reset transform</button>
          <button (click)="updatePos()" class="flow-button">change pos</button>
          <button (click)="toggleClassnames()" class="flow-button">toggle classnames</button>
          <button (click)="logToObject()" class="flow-button">toObject</button>
          <button (click)="deleteSelectedElements()" class="flow-button">
            deleteSelectedElements
          </button>
          <button (click)="deleteSomeElements()" class="flow-button">deleteSomeElements</button>
          <button (click)="onSetNodes()" class="flow-button">setNodes</button>
          <button (click)="onUpdateNode()" class="flow-button">updateNode</button>
          <button (click)="addNode()" class="flow-button">addNode</button>
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
export class BasicExampleComponent {
  // 視圖子元素引用
  readonly angularFlow = viewChild.required(AngularFlowComponent);

  // 背景變體枚舉
  readonly backgroundVariant = BackgroundVariant;

  // 初始節點數據
  readonly initialNodes = signal<AngularNode[]>([
    {
      id: '1',
      type: 'input',
      data: { label: 'Node 1' },
      position: { x: 250, y: 5 },
    },
    {
      id: '2',
      data: { label: 'Node 2' },
      position: { x: 100, y: 100 },
    },
    {
      id: '3',
      data: { label: 'Node 3' },
      position: { x: 400, y: 100 },
    },
    {
      id: '4',
      data: { label: 'Node 4' },
      position: { x: 400, y: 200 },
    },
  ]);

  // 初始邊數據
  readonly initialEdges = signal<AngularEdge[]>([
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e1-3', source: '1', target: '3' },
  ]);

  // FitView 選項
  readonly fitViewOptions = signal({
    padding: { top: '100px', left: '0%', right: '10%', bottom: 0.1 },
  });

  // 默認邊選項
  readonly defaultEdgeOptions = signal({});

  // 獲取流程實例
  private get _flow(): AngularFlowInstance<AngularNode, AngularEdge> {
    return this.angularFlow().getFlow();
  }

  // 事件處理方法
  onNodesChange(nodes: AngularNode[]): void {
    console.log('nodes change', nodes);
  }

  onConnect(connection: Connection): void {
    console.log('onConnect', connection);
    this._flow.setEdges((edges) => addEdge(connection, edges));
  }

  onNodeClick(data: { event: MouseEvent; node: AngularNode }): void {
    console.log('click', data.node);
  }

  onNodeDragStart(data: {
    event: MouseEvent;
    node: AngularNode;
    nodes: AngularNode[];
  }): void {
    console.log('drag start', data.node, data.nodes);
  }

  onNodeDrag(data: {
    event: MouseEvent;
    node: AngularNode;
    nodes: AngularNode[];
  }): void {
    console.log('drag', data.node, data.nodes);
  }

  onNodeDragStop(data: {
    event: MouseEvent;
    node: AngularNode;
    nodes: AngularNode[];
  }): void {
    console.log('drag stop', data.node, data.nodes);
  }

  onSelectionDragStart(data: {
    event: MouseEvent;
    nodes: AngularNode[];
  }): void {
    console.log('selection drag start', data.nodes);
  }

  onSelectionDrag(data: { event: MouseEvent; nodes: AngularNode[] }): void {
    console.log('selection drag', data.nodes);
  }

  onSelectionDragStop(data: { event: MouseEvent; nodes: AngularNode[] }): void {
    console.log('selection drag stop', data.nodes);
  }

  // Panel 按鈕方法
  resetTransform(): void {
    this.angularFlow().resetViewport();
  }

  updatePos(): void {
    this._flow.setNodes((nodes) =>
      nodes.map((node) => ({
        ...node,
        position: {
          x: Math.random() * 400,
          y: Math.random() * 400,
        },
      }))
    );
  }

  toggleClassnames(): void {
    this._flow.setNodes((nodes) =>
      nodes.map((node) => ({
        ...node,
        className: node.className === 'light' ? 'dark' : 'light',
      }))
    );
  }

  logToObject(): void {
    console.log(this._flow.toObject());
  }

  deleteSelectedElements(): void {
    const selectedNodes = this._flow.getNodes().filter((node) => node.selected);
    const selectedEdges = this._flow.getEdges().filter((edge) => edge.selected);
    this._flow.deleteElements({ nodes: selectedNodes, edges: selectedEdges });
  }

  deleteSomeElements(): void {
    this._flow.deleteElements({
      nodes: [{ id: '2' }],
      edges: [{ id: 'e1-3' }],
    });
  }

  onSetNodes(): void {
    this._flow.setNodes([
      { id: 'a', position: { x: 0, y: 0 }, data: { label: 'Node a' } },
      { id: 'b', position: { x: 0, y: 150 }, data: { label: 'Node b' } },
    ]);

    this._flow.setEdges([{ id: 'a-b', source: 'a', target: 'b' }]);
    this._flow.fitView();
  }

  onUpdateNode(): void {
    this._flow.updateNodeData('1', { label: 'update' });
    this._flow.updateNodeData('2', { label: 'update' });
  }

  addNode(): void {
    this._flow.addNodes({
      id: `${Math.random()}`,
      data: { label: 'Node' },
      position: { x: Math.random() * 300, y: Math.random() * 300 },
    });
    this._flow.fitView();
  }
}
