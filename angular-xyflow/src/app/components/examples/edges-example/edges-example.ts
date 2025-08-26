import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularXYFlowComponent } from '../../angular-xyflow/container/angular-xyflow/angular-xyflow.component';
import { ControlsComponent } from '../../angular-xyflow/additional-components/controls/controls.component';
import { BackgroundComponent } from '../../angular-xyflow/additional-components/background/background.component';
import { MinimapComponent } from '../../angular-xyflow/additional-components/minimap/minimap.component';
import { CustomEdgeComponent } from './custom-edge.component';
import { CustomEdge2Component } from './custom-edge2.component';
import { CustomEdge3Component } from './custom-edge3.component';
import {
  AngularNode,
  AngularEdge,
  MarkerType,
  NodeChange,
  EdgeChange,
} from '../../angular-xyflow/types';
import { Connection, addEdge } from '@xyflow/system';
import {
  applyNodeChanges,
  applyEdgeChanges,
} from '../../angular-xyflow/utils/changes';

@Component({
  selector: 'app-edges-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    ControlsComponent,
    BackgroundComponent,
    MinimapComponent,
  ],
  template: `
    <angular-xyflow
      [nodes]="nodes()"
      [edges]="edges()"
      [edgeTypes]="edgeTypes"
      [defaultEdgeOptions]="defaultEdgeOptions"
      [snapToGrid]="true"
      (onNodesChange)="onNodesChange($event)"
      (onEdgesChange)="onEdgesChange($event)"
      (onNodeClick)="onNodeClick($event)"
      (onNodeDragStop)="onNodeDragStop($event)"
      (onEdgeClick)="onEdgeClick($event)"
      (onEdgeDoubleClick)="onEdgeDoubleClick($event)"
      (onConnect)="onConnect($event)"
    >
      <angular-xyflow-minimap />
      <angular-xyflow-controls />
      <angular-xyflow-background />
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

      :host ::ng-deep .normal-edge {
        stroke: #b1b1b7;
      }
    `,
  ],
})
export class EdgesExample {
  // 初始節點
  initialNodes = signal<AngularNode[]>([
    {
      id: '1',
      type: 'input',
      position: { x: 250, y: 0 },
      data: { label: 'Input 1' },
    },
    { id: '2', position: { x: 150, y: 100 }, data: { label: 'Node 2' } },
    { id: '2a', position: { x: 0, y: 180 }, data: { label: 'Node 2a' } },
    { id: '2b', position: { x: -40, y: 300 }, data: { label: 'Node 2b' } },
    { id: '3', position: { x: 250, y: 200 }, data: { label: 'Node 3' } },
    { id: '4', position: { x: 400, y: 300 }, data: { label: 'Node 4' } },
    { id: '3a', position: { x: 150, y: 300 }, data: { label: 'Node 3a' } },
    { id: '5', position: { x: 250, y: 400 }, data: { label: 'Node 5' } },
    {
      id: '6',
      type: 'output',
      position: { x: 50, y: 550 },
      data: { label: 'Output 6' },
    },
    {
      id: '7',
      type: 'output',
      position: { x: 250, y: 550 },
      data: { label: 'Output 7' },
    },
    {
      id: '8',
      type: 'output',
      position: { x: 525, y: 600 },
      data: { label: 'Output 8' },
    },
    {
      id: '9',
      type: 'output',
      position: { x: 675, y: 500 },
      data: { label: 'Output 9' },
    },
    {
      id: '10',
      type: 'output',
      position: { x: 50, y: 400 },
      data: { label: 'Output 10' },
    },
  ]);

  // 初始邊
  initialEdges = signal<AngularEdge[]>([
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      label: 'bezier edge (default)',
      className: 'normal-edge',
    },
    {
      id: 'e2-2a',
      source: '2',
      target: '2a',
      type: 'smoothstep',
      label: 'smoothstep edge',
    },
    {
      id: 'e2a-2b',
      source: '2a',
      target: '2b',
      type: 'simplebezier',
      label: 'simple bezier edge',
    },
    {
      id: 'e2-3',
      source: '2',
      target: '3',
      type: 'step',
      label: 'step edge',
    },
    {
      id: 'e3-4',
      source: '3',
      target: '4',
      type: 'straight',
      label: 'straight edge',
    },
    {
      id: 'e3-3a',
      source: '3',
      target: '3a',
      type: 'straight',
      label: 'label only edge',
      style: { stroke: 'none' },
    },
    {
      id: 'e3-5',
      source: '4',
      target: '5',
      animated: true,
      label: 'animated styled edge',
      style: { stroke: 'red' },
    },
    {
      id: 'e5-7',
      source: '5',
      target: '7',
      label: 'label with styled bg',
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 4,
      labelBgStyle: { fill: '#FFCC00', color: '#fff', fillOpacity: 0.7 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    },
    {
      id: 'e5-8',
      source: '5',
      target: '8',
      type: 'custom',
      data: { text: 'custom edge' },
    },
    {
      id: 'e5-9',
      source: '5',
      target: '9',
      type: 'custom2',
      data: { text: 'custom edge 2' },
    },
    {
      id: 'e3a-10',
      source: '3a',
      target: '10',
      type: 'custom3',
      data: { text: 'custom edge 3' },
    },
    {
      id: 'e5-6',
      source: '5',
      target: '6',
      label: 'i am using\n<tspan>',
      labelStyle: { fill: 'red', fontWeight: 700 },
      style: { stroke: '#ffcc00' },
      markerEnd: {
        type: MarkerType.Arrow,
        color: '#FFCC00',
        markerUnits: 'userSpaceOnUse',
        width: 20,
        height: 20,
        strokeWidth: 2,
      },
      markerStart: {
        type: MarkerType.ArrowClosed,
        color: '#FFCC00',
        orient: 'auto-start-reverse',
        markerUnits: 'userSpaceOnUse',
        width: 20,
        height: 20,
      },
    },
  ]);

  // 節點和邊的狀態信號
  nodes = signal<AngularNode[]>(this.initialNodes());
  edges = signal<AngularEdge[]>(this.initialEdges());

  // 自定義邊類型
  edgeTypes = {
    custom: CustomEdgeComponent,
    custom2: CustomEdge2Component,
    custom3: CustomEdge3Component,
  };

  // 默認邊選項
  defaultEdgeOptions = {
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'red',
      width: 20,
      height: 20,
    },
  };

  // 事件處理方法
  onNodeDragStop(event: { event: MouseEvent; node: AngularNode }): void {
    console.log('drag stop', event.node);
  }

  onNodeClick(event: { event: MouseEvent; node: AngularNode }): void {
    console.log('click', event.node);
  }

  onEdgeClick(event: { event: MouseEvent; edge: AngularEdge }): void {
    console.log('click', event.edge);
  }

  onEdgeDoubleClick(event: { event: MouseEvent; edge: AngularEdge }): void {
    console.log('dblclick', event.edge);
  }


  // 變更處理方法
  onNodesChange(changes: NodeChange<AngularNode>[]): void {
    this.nodes.update(nodes => applyNodeChanges(changes, nodes));
  }

  onEdgesChange(changes: EdgeChange<AngularEdge>[]): void {
    this.edges.update(edges => applyEdgeChanges(changes, edges));
  }

  onConnect(params: Connection): void {
    this.edges.update((edges) => addEdge(params, edges));
  }

}
