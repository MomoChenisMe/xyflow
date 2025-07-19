import { Component, signal, ViewChild } from '@angular/core';
import { AngularFlowBasic } from './components/angular-flow/angular-flow-basic';
import { Node } from './types/node';
import { Edge } from './types/edge';

/**
 * Angular 基本範例 App 組件
 * 對應 React Flow 的基本範例
 * React 對應檔案: /examples/react/src/examples/basic/index.tsx
 */

// 初始節點資料 - 與 React 範例完全對應
const initialNodes: Node[] = [
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
  },
];

// 初始邊資料 - 與 React 範例完全對應
const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, selected: false },
  { id: 'e1-3', source: '1', target: '3', selected: false },
];

@Component({
  selector: 'app-basic',
  standalone: true,
  imports: [AngularFlowBasic],
  template: `
    <div class="app-basic" style="width: 100vw; height: 100vh;">
      <angular-flow
        #angularFlow
        [defaultNodes]="defaultNodes"
        [defaultEdges]="defaultEdges"
        [className]="'react-flow-basic-example'"
        [minZoom]="0.2"
        [maxZoom]="4"
        [fitView]="true"
        [selectNodesOnDrag]="false"
        [elevateEdgesOnSelect]="true"
        [elevateNodesOnSelect]="false"
        [nodeDragThreshold]="0"
        (onNodesChange)="onNodesChange($event)"
        (onEdgesChange)="onEdgesChange($event)"
        (onConnect)="onConnect($event)"
        (onNodeClick)="onNodeClick($event)"
        (onNodeDragStart)="onNodeDragStart($event)"
        (onNodeDrag)="onNodeDrag($event)"
        (onNodeDragStop)="onNodeDragStop($event)"
        (onSelectionDragStart)="onSelectionDragStart($event)"
        (onSelectionDrag)="onSelectionDrag($event)"
        (onSelectionDragStop)="onSelectionDragStop($event)"
      />
    </div>
  `,
  styles: [`
    .app-basic {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  `]
})
export class AppBasic {
  @ViewChild('angularFlow') angularFlow!: AngularFlowBasic;
  
  public defaultNodes = initialNodes;
  public defaultEdges = initialEdges;
  
  // === 事件處理器（對應 React 範例） ===
  
  public onNodeDragStart(event: { event: MouseEvent; node: Node; nodes: Node[] }): void {
    console.log('drag start', event.node, event.nodes);
  }
  
  public onNodeDrag(event: { node: Node; nodes: Node[] }): void {
    console.log('drag', event.node, event.nodes);
  }
  
  public onNodeDragStop(event: { event: MouseEvent; node: Node; nodes: Node[] }): void {
    console.log('drag stop', event.node, event.nodes);
  }
  
  public onNodeClick(event: { event: MouseEvent; node: Node }): void {
    console.log('click', event.node);
  }
  
  public onSelectionDragStart(event: { event: MouseEvent; nodes: Node[] }): void {
    console.log('selection drag start', event.nodes);
  }
  
  public onSelectionDrag(event: { nodes: Node[] }): void {
    console.log('selection drag', event.nodes);
  }
  
  public onSelectionDragStop(event: { event: MouseEvent; nodes: Node[] }): void {
    console.log('selection drag stop', event.nodes);
  }
  
  public onNodesChange(nodes: Node[]): void {
    console.log('nodes change', nodes);
    // 在 React 範例中，這會更新 nodes 狀態
    // 在我們的 Angular 實現中，這由 AngularFlowBasic 內部處理
  }

  public onEdgesChange(edges: Edge[]): void {
    console.log('edges change', edges);
  }

  public onConnect(connection: { source: string; target: string; sourceHandle?: string; targetHandle?: string }): void {
    console.log('onConnect', connection);
    // 添加新邊，類似 React Flow 的 addEdge 函數
    this.angularFlow.addEdge(connection);
  }
}