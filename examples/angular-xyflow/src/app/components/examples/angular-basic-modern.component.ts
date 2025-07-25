import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  viewChild,
  ChangeDetectionStrategy,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Import Angular Flow components
import { AngularFlowComponent } from '../container/ReactFlow/angular-flow.component';
import { BackgroundComponent } from '../additional-components/Background/background.component';
import { BackgroundVariant } from '../additional-components/Background/background.types';
import { MiniMapComponent } from '../additional-components/MiniMap/minimap.component';
import { ControlsComponent } from '../additional-components/Controls/controls.component';
import { PanelComponent } from '../components/Panel/panel.component';

// Import Angular Flow service (equivalent to useReactFlow)
import { AngularFlowService } from '../hooks/angular-flow.service';
import { FlowStoreService } from '../store/flow-store.service';

// Import types
import { Node } from '../types/nodes';
import { AngularEdge } from '../types/edges';

// Initial data (from React example)
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Node 1' },
    position: { x: 250, y: 5 },
    className: 'light',
  },
  {
    id: '2',
    data: { label: 'Node 2' },
    position: { x: 100, y: 100 },
    className: 'light',
  },
  {
    id: '3',
    data: { label: 'Node 3' },
    position: { x: 400, y: 100 },
    className: 'light',
  },
  {
    id: '4',
    data: { label: 'Node 4' },
    position: { x: 400, y: 200 },
    className: 'light',
  },
];

const initialEdges: AngularEdge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3' },
];

const defaultEdgeOptions = {};
const fitViewOptions = {
  padding: 50,
};

/**
 * Angular Basic Flow Component
 * Modern Angular equivalent of React Flow Basic example
 * Uses new Angular Signals API and template syntax
 */
@Component({
  selector: 'app-angular-basic-modern',
  standalone: true,
  imports: [
    CommonModule,
    AngularFlowComponent,
    BackgroundComponent,
    MiniMapComponent,
    ControlsComponent,
    PanelComponent
  ],
  providers: [FlowStoreService, AngularFlowService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <angular-flow
      #angularFlowRef
      [defaultNodes]="defaultNodes()"
      [defaultEdges]="defaultEdges()"
      [className]="className()"
      [minZoom]="minZoom()"
      [maxZoom]="maxZoom()"
      [fitView]="fitView()"
      [fitViewOptions]="fitViewOptions()"
      [defaultEdgeOptions]="defaultEdgeOptions()"
      [selectNodesOnDrag]="selectNodesOnDrag()"
      [elevateEdgesOnSelect]="elevateEdgesOnSelect()"
      [elevateNodesOnSelect]="elevateNodesOnSelect()"
      [nodeDragThreshold]="nodeDragThreshold()"
      [connectOnClick]="true"
      (onNodesChange)="handleNodesChange($event)"
      (onConnect)="handleConnect($event)"
      (onNodeClick)="handleNodeClick($event)"
      (onNodeDragStop)="handleNodeDragStop($event)"
      (onNodeDragStart)="handleNodeDragStart($event)"
      (onNodeDrag)="handleNodeDrag($event)"
      (onSelectionDragStart)="handleSelectionDragStart($event)"
      (onSelectionDrag)="handleSelectionDrag($event)"
      (onSelectionDragStop)="handleSelectionDragStop($event)"
    >
      <!-- Background with dots pattern -->
      <xy-background [variant]="backgroundVariant.Dots" />
      
      <!-- MiniMap -->
      <xy-minimap />
      
      <!-- Controls -->
      <xy-controls />
      
      <!-- Control Panel (equivalent to React's Panel) -->
      <xy-panel position="top-right">
        <button (click)="resetTransform()">reset transform</button>
        <button (click)="updatePos()">change pos</button>
        <button (click)="toggleClassnames()">toggle classnames</button>
        <button (click)="logToObject()">toObject</button>
        <button (click)="deleteSelectedElements()">deleteSelectedElements</button>
        <button (click)="deleteSomeElements()">deleteSomeElements</button>
        <button (click)="onSetNodes()">setNodes</button>
        <button (click)="onUpdateNode()">updateNode</button>
        <button (click)="addNode()">addNode</button>
      </xy-panel>
    </angular-flow>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class AngularBasicModernComponent implements AfterViewInit, OnDestroy {
  
  // Inject Angular Flow service (equivalent to useReactFlow)
  private angularFlow = inject(AngularFlowService);
  
  // ViewChild for Angular Flow component
  angularFlowRef = viewChild<AngularFlowComponent>('angularFlowRef');
  
  // Input properties (equivalent to React props)
  defaultNodes = input<Node[]>(initialNodes);
  defaultEdges = input<AngularEdge[]>(initialEdges);
  className = input<string>('react-flow-basic-example react-flow');
  minZoom = input<number>(0.2);
  maxZoom = input<number>(4);
  fitView = input<boolean>(true);
  selectNodesOnDrag = input<boolean>(false);
  elevateEdgesOnSelect = input<boolean>(true);
  elevateNodesOnSelect = input<boolean>(false);
  nodeDragThreshold = input<number>(0);
  
  // Constants
  readonly backgroundVariant = BackgroundVariant;
  readonly fitViewOptions = signal(fitViewOptions);
  readonly defaultEdgeOptions = signal(defaultEdgeOptions);
  
  // Output events (equivalent to React callbacks)
  onNodesChange = output<Node[]>();
  onConnect = output<any>();
  onNodeClick = output<{ event: MouseEvent; node: Node }>();
  onNodeDragStart = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  onNodeDrag = output<{ node: Node; nodes: Node[] }>();
  onNodeDragStop = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  onSelectionDragStart = output<{ event: MouseEvent; nodes: Node[] }>();
  onSelectionDrag = output<{ nodes: Node[] }>();
  onSelectionDragStop = output<{ event: MouseEvent; nodes: Node[] }>();
  
  constructor() {
    // Setup effects to react to input changes
    effect(() => {
      const nodes = this.defaultNodes();
      console.log('🔧 defaultNodes effect triggered:', { 
        nodesCount: nodes?.length,
        hasAngularFlow: !!this.angularFlow,
        nodes 
      });
      if (nodes && nodes.length > 0) {
        console.log('🔧 Calling angularFlow.setNodes...');
        this.angularFlow.setNodes(nodes);
        console.log('🔧 Called angularFlow.setNodes successfully');
        
        // Verify nodes were set in store
        const storeNodes = this.angularFlow.getNodes();
        console.log('🔧 Nodes in store after setNodes:', storeNodes.length);
        console.log('🔧 AngularFlow service store:', (this.angularFlow as any).store);
        console.log('🔧 AngularFlow service store constructor:', (this.angularFlow as any).store.constructor.name);
      }
    });

    effect(() => {
      const edges = this.defaultEdges();
      if (edges && edges.length > 0) {
        this.angularFlow.setEdges(edges);
      }
    });
  }

  ngAfterViewInit() {
    // Initial fit view if enabled
    if (this.fitView()) {
      setTimeout(() => {
        this.angularFlow.fitView(this.fitViewOptions());
      }, 100);
    }

    // Update node internals (including handle bounds) after DOM is ready
    setTimeout(() => {
      console.log('Updating node internals after view init...');
      console.log('🔍 Angular Flow service:', !!this.angularFlow);
      console.log('🔍 Store exists:', !!(this.angularFlow as any).store);
      console.log('🔍 updateNodeInternals method exists:', typeof this.angularFlow.updateNodeInternals);
      
      try {
        this.angularFlow.updateNodeInternals();
        console.log('✅ updateNodeInternals called successfully');
      } catch (error) {
        console.error('❌ Error calling updateNodeInternals:', error);
      }
    }, 200);
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  // Event handlers (equivalent to React event callbacks)
  
  handleNodesChange(nodes: Node[]) {
    console.log('nodes change:', nodes);
    // 重要：更新實際的節點狀態，這樣拖拽的變更才會生效
    this.angularFlow.setNodes(nodes);
    this.onNodesChange.emit(nodes);
  }

  handleConnect(connection: any) {
    console.log('🔗 CONNECTION CREATED:', connection);
    console.log('Current edges before adding:', this.angularFlow.getEdges());
    this.angularFlow.setEdges((edges) => this.addEdge(connection, edges));
    console.log('Current edges after adding:', this.angularFlow.getEdges());
    this.onConnect.emit(connection);
  }

  handleNodeClick({ event, node }: { event: MouseEvent; node: Node }) {
    console.log('click', node);
    this.onNodeClick.emit({ event, node });
  }

  handleNodeDragStart({ event, node, nodes }: { event: MouseEvent; node: Node; nodes: Node[] }) {
    console.log('drag start', node, nodes);
    this.onNodeDragStart.emit({ event, node, nodes });
  }

  handleNodeDrag({ node, nodes }: { node: Node; nodes: Node[] }) {
    console.log('drag', node, nodes);
    this.onNodeDrag.emit({ node, nodes });
  }

  handleNodeDragStop({ event, node, nodes }: { event: MouseEvent; node: Node; nodes: Node[] }) {
    console.log('drag stop', node, nodes);
    this.onNodeDragStop.emit({ event, node, nodes });
  }

  handleSelectionDragStart({ event, nodes }: { event: MouseEvent; nodes: Node[] }) {
    console.log('selection drag start', nodes);
    this.onSelectionDragStart.emit({ event, nodes });
  }

  handleSelectionDrag({ nodes }: { nodes: Node[] }) {
    console.log('selection drag', nodes);
    this.onSelectionDrag.emit({ nodes });
  }

  handleSelectionDragStop({ event, nodes }: { event: MouseEvent; nodes: Node[] }) {
    console.log('selection drag stop', nodes);
    this.onSelectionDragStop.emit({ event, nodes });
  }

  // Helper method to add edge (equivalent to React's addEdge function)
  private addEdge(connection: any, edges: AngularEdge[]): AngularEdge[] {
    const newEdge: AngularEdge = {
      ...connection,
      id: `e${connection.source}-${connection.target}`,
    };
    return [...edges, newEdge];
  }

  // Panel button methods (equivalent to React example methods)
  
  resetTransform() {
    console.log('reset transform');
    this.angularFlow.setViewport({ x: 0, y: 0, zoom: 1 });
  }

  updatePos() {
    console.log('change pos');
    this.angularFlow.setNodes((nodes) =>
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
    console.log('toggle classnames');
    this.angularFlow.setNodes((nodes) =>
      nodes.map((node) => ({
        ...node,
        className: node.className === 'light' ? 'dark' : 'light',
      }))
    );
  }

  logToObject() {
    const flowObject = this.angularFlow.toObject();
    console.log('Flow object:', flowObject);
  }

  deleteSelectedElements() {
    const nodes = this.angularFlow.getNodes();
    const edges = this.angularFlow.getEdges();
    const selectedNodes = nodes.filter((node) => node.selected);
    const selectedEdges = edges.filter((edge) => edge.selected);
    
    console.log('deleteSelectedElements', selectedNodes, selectedEdges);
    this.angularFlow.deleteElements({ nodes: selectedNodes, edges: selectedEdges });
  }

  deleteSomeElements() {
    console.log('deleteSomeElements');
    this.angularFlow.deleteElements({ 
      nodes: [{ id: '2' }], 
      edges: [{ id: 'e1-3' }] 
    });
  }

  onSetNodes() {
    console.log('setNodes');
    const newNodes: Node[] = [
      { id: 'a', position: { x: 0, y: 0 }, data: { label: 'Node a' } },
      { id: 'b', position: { x: 0, y: 150 }, data: { label: 'Node b' } },
    ];
    const newEdges: AngularEdge[] = [
      { id: 'a-b', source: 'a', target: 'b' }
    ];

    this.angularFlow.setNodes(newNodes);
    this.angularFlow.setEdges(newEdges);
    this.angularFlow.fitView();
  }

  onUpdateNode() {
    console.log('updateNode');
    this.angularFlow.updateNodeData('1', { label: 'update' });
    this.angularFlow.updateNodeData('2', { label: 'update' });
  }

  addNode() {
    console.log('addNode');
    const newNode: Node = {
      id: `${Math.random()}`,
      data: { label: 'Node' },
      position: { x: Math.random() * 300, y: Math.random() * 300 },
      className: 'light',
    };

    this.angularFlow.addNodes(newNode);
    this.angularFlow.fitView();
  }
}