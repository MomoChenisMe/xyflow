import {
  Component,
  signal,
  computed,
  ChangeDetectionStrategy,
  AfterViewInit,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '../../types/node';
import { AngularEdge } from '../types/edges';
import { AngularFlowComponent } from '../container/ReactFlow/angular-flow.component';
import { BackgroundComponent } from '../additional-components/Background/background.component';
import { BackgroundVariant } from '../additional-components/Background/background.types';
import { ControlsComponent } from '../additional-components/Controls/controls.component';
import { MiniMapComponent } from '../additional-components/MiniMap/minimap.component';
import { PanelComponent } from '../components/Panel/panel.component';

/**
 * Angular Flow Basic Component (重構版)
 * 使用新的模塊化 AngularFlow 架構
 * 對應 React Flow 基本範例的完整功能
 */
@Component({
  selector: 'angular-flow-basic',
  standalone: true,
  imports: [CommonModule, AngularFlowComponent, BackgroundComponent, ControlsComponent, MiniMapComponent, PanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="xy-flow-basic-example" style="width: 100%; height: 100vh; position: relative;">
      <!-- Main Angular Flow Component -->
      <angular-flow
        #angularFlow
        [nodes]="_nodes()"
        [edges]="_edges()"
        [viewport]="_viewport()"
        [className]="'react-flow-basic-example'"
        [minZoom]="0.2"
        [maxZoom]="4"
        [fitView]="true"
        [fitViewOptions]="fitViewOptions"
        [selectNodesOnDrag]="false"
        [elevateEdgesOnSelect]="true"
        [elevateNodesOnSelect]="false"
        [nodeDragThreshold]="0"
        (onConnect)="onConnect($event)"
        (onNodesChange)="onNodesChange($event)"
        (onEdgesChange)="onAngularEdgesChange($event)"
        (onViewportChange)="onViewportChange($event)"
        (onNodeClick)="onNodeClick($event)"
        (onNodeDragStart)="onNodeDragStart($event)"
        (onNodeDrag)="onNodeDrag($event)"
        (onNodeDragStop)="onNodeDragStop($event)"
      >
        <!-- Background with dots variant like React -->
        <xy-background [variant]="backgroundVariant" />

        <!-- MiniMap -->
        <xy-minimap
          [nodeLookup]="nodeLookup()"
          [transform]="transform()"
          [width]="flowWidth()"
          [height]="flowHeight()"
          [translateExtent]="translateExtent()"
          [rfId]="rfId()"
        ></xy-minimap>

        <!-- Controls -->
        <xy-controls
          [showZoom]="true"
          [showFitView]="true"
          [showInteractive]="true"
          [isInteractive]="isInteractive()"
          (onZoomIn)="zoomIn()"
          (onZoomOut)="zoomOut()"
          (onFitView)="fitView()"
          (onInteractiveChange)="toggleInteractive()"
        ></xy-controls>

        <!-- Panel matching React Basic example -->
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
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .xy-flow-basic-example {
      /* Ensure proper container for the flow */
      width: 100%;
      height: 100vh;
      position: relative;
      overflow: hidden;
    }

    /* Panel button styles matching React Basic example */
    xy-panel button {
      margin: 2px 0;
      padding: 5px 10px;
      border: 1px solid #eee;
      background: #fefefe;
      color: inherit;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
      display: block;
      width: 100%;
      min-width: 140px;
      text-align: left;
      white-space: nowrap;
      transition: background-color 0.2s ease;
    }

    xy-panel button:hover {
      background: #f4f4f4;
    }

    xy-panel button:active {
      background: #e8e8e8;
    }
  `]
})
export class AngularFlowBasicNew implements AfterViewInit, OnDestroy {
  @ViewChild('angularFlow') angularFlow!: AngularFlowComponent;

  // Match React Basic example exactly
  public defaultNodes: Node[] = [
    {
      id: '1',
      type: 'input',
      data: { label: 'Node 1' },
      position: { x: 250, y: 5 },
      className: 'light',
      selected: false
    },
    {
      id: '2',
      data: { label: 'Node 2' },
      position: { x: 100, y: 100 },
      className: 'light',
      selected: false
    },
    {
      id: '3',
      data: { label: 'Node 3' },
      position: { x: 400, y: 100 },
      className: 'light',
      selected: false
    },
    {
      id: '4',
      data: { label: 'Node 4' },
      position: { x: 400, y: 200 },
      className: 'light',
      selected: false
    }
  ];

  public defaultAngularEdges: AngularEdge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true, selected: false },
    { id: 'e1-3', source: '1', target: '3', selected: false }
  ];

  // React Basic fitViewOptions
  public fitViewOptions = {
    padding: { top: 100, left: 0, right: 100, bottom: 100 }
  };

  // Internal state for current nodes/edges
  public _nodes = signal<Node[]>([]);
  public _edges = signal<AngularEdge[]>([]);
  public _viewport = signal({ x: 0, y: 0, zoom: 1 });
  private _isInteractive = signal(true);

  // Computed properties
  public viewport = computed(() => this._viewport());
  public isInteractive = computed(() => this._isInteractive());

  // MiniMap required computed properties
  public nodeLookup = computed(() => {
    const lookup = new Map<string, any>();
    this._nodes().forEach(node => {
      lookup.set(node.id, {
        internals: {
          userNode: node,
          positionAbsolute: node.position
        }
      });
    });
    return lookup;
  });

  public transform = computed(() => {
    const vp = this._viewport();
    return [vp.x, vp.y, vp.zoom] as [number, number, number];
  });

  public flowWidth = computed(() => 800); // Default width
  public flowHeight = computed(() => 600); // Default height
  public translateExtent = computed(() => [[-Infinity, -Infinity], [Infinity, Infinity]] as [[number, number], [number, number]]);
  public rfId = computed(() => 'angular-flow-basic');
  public backgroundVariant = BackgroundVariant.Dots;

  ngAfterViewInit() {
    console.log('💡 Angular Flow Basic (React-compatible) initialized!');
    // Initialize with default nodes/edges
    this._nodes.set([...this.defaultNodes]);
    this._edges.set([...this.defaultAngularEdges]);
  }

  ngOnDestroy() {
    // Cleanup
  }

  // Event handlers matching React Basic example
  public onConnect(connection: { source: string; target: string; sourceHandle?: string; targetHandle?: string }) {
    console.log('onConnect', connection);

    const newAngularEdge: AngularEdge = {
      id: `e${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      selected: false
    };

    this._edges.update(edges => [...edges, newAngularEdge]);
  }

  public onNodesChange(nodes: Node[]) {
    console.log('onNodesChange', nodes);
    this._nodes.set(nodes);
  }

  public onAngularEdgesChange(edges: AngularEdge[]) {
    console.log('onAngularEdgesChange', edges);
    this._edges.set(edges);
  }

  public onNodeClick(event: { event: MouseEvent; node: Node }) {
    console.log('click', event.node);
  }

  public onNodeDragStart(event: { event: MouseEvent; node: Node; nodes: Node[] }) {
    console.log('drag start', event.node, event.nodes);
  }

  public onNodeDrag(event: { node: Node; nodes: Node[] }) {
    console.log('drag', event.node, event.nodes);
  }

  public onNodeDragStop(event: { event: MouseEvent; node: Node; nodes: Node[] }) {
    console.log('drag stop', event.node, event.nodes);
  }

  public onViewportChange(viewport: { x: number; y: number; zoom: number }) {
    // Sync viewport changes from AngularFlow back to local state
    this._viewport.set(viewport);
  }

  // Control panel methods matching React Basic exactly
  public resetTransform() {
    this._viewport.set({ x: 0, y: 0, zoom: 1 });
  }

  public updatePos() {
    const nodes = this._nodes().map(node => ({
      ...node,
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400
      }
    }));
    this._nodes.set(nodes);
  }

  public toggleClassnames() {
    const nodes = this._nodes().map(node => ({
      ...node,
      className: node.className === 'light' ? 'dark' : 'light'
    }));
    this._nodes.set(nodes);
  }

  public logToObject() {
    const flowObject = {
      nodes: this._nodes(),
      edges: this._edges(),
      viewport: this._viewport()
    };
    console.log(flowObject);
  }

  public deleteSelectedElements() {
    const selectedNodes = this._nodes().filter(node => node.selected);

    // Remove selected nodes and edges
    const remainingNodes = this._nodes().filter(node => !node.selected);
    const remainingAngularEdges = this._edges().filter(edge =>
      !edge.selected &&
      !selectedNodes.some(n => n.id === edge.source || n.id === edge.target)
    );

    this._nodes.set(remainingNodes);
    this._edges.set(remainingAngularEdges);
  }

  public deleteSomeElements() {
    // Match React: deleteElements({ nodes: [{ id: '2' }], edges: [{ id: 'e1-3' }] })
    const remainingNodes = this._nodes().filter(node => node.id !== '2');
    const remainingAngularEdges = this._edges().filter(edge => edge.id !== 'e1-3');

    this._nodes.set(remainingNodes);
    this._edges.set(remainingAngularEdges);
  }

  public onSetNodes() {
    // Match React Basic example exactly
    const newNodes: Node[] = [
      { id: 'a', position: { x: 0, y: 0 }, data: { label: 'Node a' }, selected: false },
      { id: 'b', position: { x: 0, y: 150 }, data: { label: 'Node b' }, selected: false }
    ];
    const newAngularEdges: AngularEdge[] = [
      { id: 'a-b', source: 'a', target: 'b', selected: false }
    ];

    this._nodes.set(newNodes);
    this._edges.set(newAngularEdges);
    this.fitView(); // Call fitView like React
  }

  public onUpdateNode() {
    // Match React: updateNodeData('1', { label: 'update' })
    const nodes = this._nodes().map(node => {
      if (node.id === '1' || node.id === '2') {
        return { ...node, data: { ...node.data, label: 'update' } };
      }
      return node;
    });
    this._nodes.set(nodes);
  }

  public addNode() {
    const newNode: Node = {
      id: `${Math.random()}`,
      data: { label: 'Node' },
      position: { x: Math.random() * 300, y: Math.random() * 300 },
      className: 'light',
      selected: false
    };

    this._nodes.update(nodes => [...nodes, newNode]);
    this.fitView(); // Call fitView like React
  }

  // Controls event handlers
  public zoomIn() {
    const viewport = this._viewport();
    const newZoom = Math.min(viewport.zoom * 1.2, 4); // maxZoom = 4
    this._viewport.update(vp => ({ ...vp, zoom: newZoom }));
  }

  public zoomOut() {
    const viewport = this._viewport();
    const newZoom = Math.max(viewport.zoom / 1.2, 0.2); // minZoom = 0.2
    this._viewport.update(vp => ({ ...vp, zoom: newZoom }));
  }

  public fitView() {
    // Simple fitView implementation
    this._viewport.set({ x: 0, y: 0, zoom: 1 });
  }

  public toggleInteractive() {
    this._isInteractive.update(state => !state);
    console.log('Interactive state:', this._isInteractive() ? 'Unlocked' : 'Locked');
  }
}
