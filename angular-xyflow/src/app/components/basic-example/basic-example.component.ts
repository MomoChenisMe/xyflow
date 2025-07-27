import { 
  Component, 
  signal,
  computed,
  inject,
  viewChild,
  ElementRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  AngularFlowComponent,
  AngularFlowService,
  BackgroundComponent,
  ControlsComponent,
  PanelComponent,
  MinimapComponent,
  AngularNode,
  AngularEdge,
  BackgroundVariant,
  AngularFlowInstance
} from '../angular-flow';
import { Connection, Position } from '@xyflow/system';

@Component({
  selector: 'app-basic-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularFlowComponent,
    BackgroundComponent,
    ControlsComponent,
    PanelComponent,
    MinimapComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="basic-example-container">
      <angular-flow
        #angularFlow
        [defaultNodes]="initialNodes()"
        [defaultEdges]="initialEdges()"
        [minZoom]="0.2"
        [maxZoom]="4"
        [fitView]="true"
        [fitViewOptions]="fitViewOptions()"
        [selectNodesOnDrag]="false"
        className="react-flow-basic-example"
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
        <angular-flow-background 
          [variant]="backgroundVariant.Dots"
        />
        
        <angular-flow-minimap />
        
        <angular-flow-controls />

        <angular-flow-panel position="top-right">
          <button (click)="resetTransform()">reset transform</button>
          <button (click)="updatePos()">change pos</button>
          <button (click)="toggleClassnames()">toggle classnames</button>
          <button (click)="logToObject()">toObject</button>
          <button (click)="deleteSelectedElements()">deleteSelectedElements</button>
          <button (click)="deleteSomeElements()">deleteSomeElements</button>
          <button (click)="onSetNodes()">setNodes</button>
          <button (click)="onUpdateNode()">updateNode</button>
          <button (click)="addNode()">addNode</button>
        </angular-flow-panel>
      </angular-flow>
    </div>
  `,
  styles: [`
    .basic-example-container {
      width: 100vw;
      height: 100vh;
      background: #fafafa;
    }

    angular-flow-panel button {
      display: block;
      margin: 4px 0;
      padding: 8px 12px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      white-space: nowrap;
    }

    angular-flow-panel button:hover {
      background: #f5f5f5;
      border-color: #ccc;
    }

    angular-flow-panel button:active {
      background: #eee;
    }

    /* Light/Dark node styles */
    :host ::ng-deep .angular-flow__node.light {
      background: #fff;
      border-color: #ddd;
      color: #222;
    }

    :host ::ng-deep .angular-flow__node.dark {
      background: #333;
      border-color: #555;
      color: #fff;
    }
  `]
})
export class BasicExampleComponent {
  // 注入服務
  private flowService = inject(AngularFlowService<AngularNode, AngularEdge>);
  
  // 視圖子元素引用
  readonly angularFlow = viewChild.required(AngularFlowComponent);
  
  // 背景變體枚舉
  readonly backgroundVariant = BackgroundVariant;
  
  // 初始節點數據
  readonly initialNodes = signal<AngularNode[]>([
    {
      id: '1',
      type: 'input',
      data: { label: 'Input Node' },
      position: { x: 250, y: 5 },
      className: 'light',
      sourcePosition: Position.Bottom,
    },
    {
      id: '2',
      type: 'default',
      data: { label: 'Default Node' },
      position: { x: 100, y: 100 },
      className: 'light',
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    },
    {
      id: '3',
      type: 'default',
      data: { label: 'Processing Node' },
      position: { x: 400, y: 100 },
      className: 'light',
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    },
    {
      id: '4',
      type: 'output',
      data: { label: 'Output Node' },
      position: { x: 300, y: 200 },
      className: 'light',
      targetPosition: Position.Top,
    },
  ]);

  // 初始邊數據
  readonly initialEdges = signal<AngularEdge[]>([
    { 
      id: 'e1-2', 
      source: '1', 
      target: '2', 
      animated: true,
      type: 'default'
    },
    { 
      id: 'e1-3', 
      source: '1', 
      target: '3',
      type: 'default'
    },
    { 
      id: 'e2-4', 
      source: '2', 
      target: '4',
      type: 'default'
    },
    { 
      id: 'e3-4', 
      source: '3', 
      target: '4',
      type: 'default'
    },
  ]);

  // FitView 選項
  readonly fitViewOptions = signal({
    padding: { top: 100, left: 0, right: 50, bottom: 10 }
  });

  // 獲取流程實例
  private get flow(): AngularFlowInstance<AngularNode, AngularEdge> {
    return this.angularFlow().getFlow();
  }

  // 事件處理方法
  onNodesChange(nodes: AngularNode[]) {
    console.log('nodes change', nodes);
  }

  onConnect(connection: Connection) {
    console.log('onConnect', connection);
    this.flow.setEdges((edges) => {
      const newEdge: AngularEdge = {
        id: `e${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle || undefined,
        targetHandle: connection.targetHandle || undefined,
      };
      return [...edges, newEdge];
    });
  }

  onNodeClick(data: { event: MouseEvent; node: AngularNode }) {
    console.log('click', data.node);
  }

  onNodeDragStart(data: { event: MouseEvent; node: AngularNode; nodes: AngularNode[] }) {
    console.log('drag start', data.node, data.nodes);
  }

  onNodeDrag(data: { event: MouseEvent; node: AngularNode; nodes: AngularNode[] }) {
    console.log('drag', data.node, data.nodes);
  }

  onNodeDragStop(data: { event: MouseEvent; node: AngularNode; nodes: AngularNode[] }) {
    console.log('drag stop', data.node, data.nodes);
  }

  onSelectionDragStart(data: { event: MouseEvent; nodes: AngularNode[] }) {
    console.log('selection drag start', data.nodes);
  }

  onSelectionDrag(data: { event: MouseEvent; nodes: AngularNode[] }) {
    console.log('selection drag', data.nodes);
  }

  onSelectionDragStop(data: { event: MouseEvent; nodes: AngularNode[] }) {
    console.log('selection drag stop', data.nodes);
  }

  // Panel 按鈕方法
  resetTransform() {
    this.angularFlow().resetViewport();
  }

  updatePos() {
    this.flow.setNodes((nodes) =>
      nodes.map((node) => ({
        ...node,
        position: {
          x: Math.random() * 400,
          y: Math.random() * 400,
        },
      }))
    );
  }

  toggleClassnames() {
    this.flow.setNodes((nodes) =>
      nodes.map((node) => ({
        ...node,
        className: node.className === 'light' ? 'dark' : 'light',
      }))
    );
  }

  logToObject() {
    console.log(this.flow.toObject());
  }

  deleteSelectedElements() {
    const selectedNodes = this.flow.getNodes().filter((node) => node.selected);
    const selectedEdges = this.flow.getEdges().filter((edge) => edge.selected);
    this.flow.deleteElements({ nodes: selectedNodes, edges: selectedEdges });
  }

  deleteSomeElements() {
    this.flow.deleteElements({ 
      nodes: [{ id: '2' }], 
      edges: [{ id: 'e1-3' }] 
    });
  }

  onSetNodes() {
    this.flow.setNodes([
      { id: 'a', position: { x: 0, y: 0 }, data: { label: 'Node a' }, sourcePosition: Position.Bottom },
      { id: 'b', position: { x: 0, y: 150 }, data: { label: 'Node b' }, targetPosition: Position.Bottom },
    ]);

    this.flow.setEdges([{ id: 'a-b', source: 'a', target: 'b' }]);
    this.flow.fitView();
  }

  onUpdateNode() {
    this.flow.updateNodeData('1', { label: 'update' });
    this.flow.updateNodeData('2', { label: 'update' });
  }

  addNode() {
    const nodeTypes = ['input', 'default', 'output'];
    const randomType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
    
    const newNode: AngularNode = {
      id: `${Math.random()}`,
      type: randomType,
      data: { label: `${randomType.charAt(0).toUpperCase() + randomType.slice(1)} Node` },
      position: { x: Math.random() * 300, y: Math.random() * 300 },
      className: 'light',
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
    
    this.flow.addNodes(newNode);
    this.flow.fitView();
  }
}