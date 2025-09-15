// Angular 核心模組
import {
  Component,
  signal,
  computed,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// 專案內部模組
import { 
  AngularXYFlowComponent, 
  AngularXYFlowService,
  ControlsComponent,
  PanelComponent,
  AngularNode,
  AngularEdge,
  NodeChange,
  EdgeChange
} from '../../angular-xyflow';

// 節點組件
import { DefaultResizerComponent } from './default-resizer.component';
import { CustomResizerComponent } from './custom-resizer.component';
import { VerticalResizerComponent } from './vertical-resizer.component';
import { HorizontalResizerComponent } from './horizontal-resizer.component';
import { BottomRightResizerComponent } from './bottom-right-resizer.component';

const nodeTypes = {
  defaultResizer: DefaultResizerComponent,
  customResizer: CustomResizerComponent,
  verticalResizer: VerticalResizerComponent,
  horizontalResizer: HorizontalResizerComponent,
  bottomRightResizer: BottomRightResizerComponent,
};

const nodeStyle = {
  border: '1px solid #222',
  fontSize: 10,
  backgroundColor: '#ddd',
};

const initialEdges: AngularEdge[] = [];

const initialNodes: AngularNode[] = [
  {
    id: '1',
    type: 'defaultResizer',
    data: { label: 'default resizer' },
    position: { x: 0, y: 0 },
    origin: [1, 1] as [number, number],
    style: { ...nodeStyle },
  },
  {
    id: '1a',
    type: 'defaultResizer',
    data: {
      label: 'default resizer with min and max dimensions',
      minWidth: 100,
      minHeight: 80,
      maxWidth: 200,
      maxHeight: 200,
    },
    position: { x: 0, y: 60 },
    width: 100,
    height: 80,
    style: { ...nodeStyle },
  },
  {
    id: '1b',
    type: 'defaultResizer',
    data: {
      label: 'default resizer with initial size and aspect ratio',
      keepAspectRatio: true,
      minWidth: 100,
      minHeight: 60,
      maxWidth: 400,
      maxHeight: 400,
    },
    position: { x: 250, y: 0 },
    width: 174,
    height: 123,
    style: { ...nodeStyle },
  },
  {
    id: '2',
    type: 'customResizer',
    data: { label: 'custom resize icon' },
    position: { x: 0, y: 200 },
    width: 100,
    height: 60,
    style: { ...nodeStyle },
  },
  {
    id: '3',
    type: 'verticalResizer',
    data: { label: 'vertical resizer' },
    position: { x: 250, y: 200 },
    style: { ...nodeStyle },
  },
  {
    id: '3a',
    type: 'verticalResizer',
    data: {
      label: 'vertical resizer with min/maxHeight and aspect ratio',
      minHeight: 50,
      maxHeight: 200,
      keepAspectRatio: true,
    },
    position: { x: 400, y: 200 },
    height: 50,
    style: { ...nodeStyle },
  },
  {
    id: '4',
    type: 'horizontalResizer',
    data: {
      label: 'horizontal resizer with aspect ratio',
      keepAspectRatio: true,
      minHeight: 20,
      maxHeight: 80,
      maxWidth: 300,
    },
    position: { x: 250, y: 300 },
    style: { ...nodeStyle },
  },
  {
    id: '4a',
    type: 'horizontalResizer',
    data: { label: 'horizontal resizer with maxWidth', maxWidth: 300 },
    position: { x: 250, y: 400 },
    style: { ...nodeStyle },
  },
  {
    id: '5',
    type: 'defaultResizer',
    data: { label: 'Parent', keepAspectRatio: true },
    position: { x: 700, y: 0 },
    width: 300,
    height: 300,
    style: { ...nodeStyle },
  },
  {
    id: '5a',
    type: 'defaultResizer',
    data: {
      label: 'Child with extent: parent',
    },
    position: { x: 50, y: 50 },
    parentId: '5',
    extent: 'parent',
    width: 50,
    height: 100,
    style: { ...nodeStyle },
  },
  {
    id: '5b',
    type: 'defaultResizer',
    data: { label: 'Child with expandParent' },
    position: { x: 100, y: 100 },
    width: 100,
    height: 100,
    parentId: '5',
    expandParent: true,
    style: { ...nodeStyle },
  },
  {
    id: '5c',
    type: 'defaultResizer',
    data: { label: 'Child with expandParent & keepAspectRatio' },
    position: { x: 250, y: 200 },
    height: 100,
    width: 100,
    parentId: '5',
    expandParent: true,
    style: { ...nodeStyle },
  },
  {
    id: '6',
    type: 'bottomRightResizer',
    data: { label: 'Bottom Right with horizontal direction' },
    position: { x: 500, y: 500 },
    style: { ...nodeStyle },
  },
];

@Component({
  selector: 'app-node-resizer-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    ControlsComponent,
    PanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="node-resizer-example">
      <angular-xyflow
        [nodes]="nodes()"
        [edges]="edges()"
        [nodeTypes]="nodeTypes"
        [minZoom]="0.2"
        [maxZoom]="5"
        [snapToGrid]="snapToGrid()"
        [fitView]="true"
        (onNodesChange)="onNodesChange($event)"
        (onEdgesChange)="onEdgesChange($event)"
        (onConnect)="onConnect($event)"
      >
        <angular-xyflow-controls />
        <angular-xyflow-panel position="bottom-right">
          <button (click)="toggleSnapToGrid()">
            snapToGrid: {{ snapToGrid() ? 'on' : 'off' }}
          </button>
        </angular-xyflow-panel>
      </angular-xyflow>
    </div>
  `,
  styles: [`
    .node-resizer-example {
      width: 100%;
      height: 100%;
    }
  `],
})
export class NodeResizerExampleComponent {
  private _flowService = inject(AngularXYFlowService<AngularNode, AngularEdge>);
  
  // 狀態信號
  private _snapToGrid = signal(false);
  private _nodes = signal<AngularNode[]>(initialNodes);
  private _edges = signal<AngularEdge[]>(initialEdges);

  // 公開屬性
  nodes = computed(() => this._nodes());
  edges = computed(() => this._edges());
  snapToGrid = computed(() => this._snapToGrid());
  nodeTypes = nodeTypes;

  toggleSnapToGrid(): void {
    this._snapToGrid.set(!this._snapToGrid());
  }

  onNodesChange(changes: NodeChange[]): void {
    console.log('Nodes changed:', changes);
    
    // 受控模式：根據變化更新節點狀態
    const currentNodes = this._nodes();
    let updatedNodes = [...currentNodes];
    
    changes.forEach(change => {
      switch (change.type) {
        case 'position':
          const positionNodeIndex = updatedNodes.findIndex(node => node.id === change.id);
          if (positionNodeIndex !== -1 && change.position) {
            updatedNodes[positionNodeIndex] = {
              ...updatedNodes[positionNodeIndex],
              position: change.position
            };
          }
          break;
          
        case 'dimensions':
          const dimensionsNodeIndex = updatedNodes.findIndex(node => node.id === change.id);
          if (dimensionsNodeIndex !== -1 && change.dimensions) {
            updatedNodes[dimensionsNodeIndex] = {
              ...updatedNodes[dimensionsNodeIndex],
              width: change.dimensions.width,
              height: change.dimensions.height
            };
          }
          break;
          
        case 'select':
          const selectNodeIndex = updatedNodes.findIndex(node => node.id === change.id);
          if (selectNodeIndex !== -1) {
            updatedNodes[selectNodeIndex] = {
              ...updatedNodes[selectNodeIndex],
              selected: change.selected
            };
          }
          break;
          
        case 'remove':
          updatedNodes = updatedNodes.filter(node => node.id !== change.id);
          break;
          
        case 'add':
          if (change.item) {
            updatedNodes.push(change.item);
          }
          break;
          
        case 'replace':
          const replaceNodeIndex = updatedNodes.findIndex(node => node.id === change.id);
          if (replaceNodeIndex !== -1 && change.item) {
            updatedNodes[replaceNodeIndex] = change.item;
          }
          break;
      }
    });
    
    // 更新狀態
    this._nodes.set(updatedNodes);
  }

  onEdgesChange(changes: EdgeChange[]): void {
    console.log('Edges changed:', changes);
    
    // 受控模式：根據變化更新邊狀態  
    const currentEdges = this._edges();
    let updatedEdges = [...currentEdges];
    
    changes.forEach(change => {
      switch (change.type) {
        case 'select':
          const selectEdgeIndex = updatedEdges.findIndex(edge => edge.id === change.id);
          if (selectEdgeIndex !== -1) {
            updatedEdges[selectEdgeIndex] = {
              ...updatedEdges[selectEdgeIndex],
              selected: change.selected
            };
          }
          break;
          
        case 'remove':
          updatedEdges = updatedEdges.filter(edge => edge.id !== change.id);
          break;
          
        case 'add':
          if (change.item) {
            updatedEdges.push(change.item);
          }
          break;
          
        case 'replace':
          const replaceEdgeIndex = updatedEdges.findIndex(edge => edge.id === change.id);
          if (change.item && replaceEdgeIndex !== -1) {
            updatedEdges[replaceEdgeIndex] = change.item;
          }
          break;
      }
    });
    
    // 更新狀態
    this._edges.set(updatedEdges);
  }

  onConnect(connection: any): void {
    console.log('Connection made:', connection);
    // 在這裡處理連接
  }
}