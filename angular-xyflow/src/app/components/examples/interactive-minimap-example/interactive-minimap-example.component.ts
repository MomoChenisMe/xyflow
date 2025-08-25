// Angular 核心模組
import {
  Component,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// XyFlow 系統模組
import { XYPosition } from '@xyflow/system';

// 專案內部模組
import {
  AngularXYFlowComponent,
  ControlsComponent,
  MinimapComponent,
  BackgroundComponent,
  AngularNode,
  AngularEdge,
  BackgroundVariant,
} from '../../angular-xyflow';

// 初始節點數據 - 與 React 範例完全相同
const INITIAL_NODES: AngularNode[] = [
  {
    id: '1',
    data: { label: 'Node 1' },
    position: { x: 0, y: 0 },
  },
  {
    id: '2',
    data: { label: 'Node 2' },
    position: { x: 0, y: 200 },
  },
  {
    id: '3',
    data: { label: 'Node 3' },
    position: { x: 200, y: 0 },
  },
  {
    id: '4',
    data: { label: 'Node 4' },
    position: { x: 1000, y: 0 },
  },
  {
    id: '5',
    data: { label: 'Node 5' },
    position: { x: 1000, y: 200 },
  },
  {
    id: '6',
    data: { label: 'Node 6' },
    position: { x: 800, y: 0 },
  },
  {
    id: '7',
    data: { label: 'Node 7' },
    position: { x: 0, y: 1000 },
  },
  {
    id: '8',
    data: { label: 'Node 8' },
    position: { x: 0, y: 800 },
  },
  {
    id: '9',
    data: { label: 'Node 9' },
    position: { x: 200, y: 1000 },
  },
  {
    id: '10',
    data: { label: 'Node 10' },
    position: { x: 1000, y: 1000 },
  },
  {
    id: '11',
    data: { label: 'Node 11' },
    position: { x: 800, y: 1000 },
  },
  {
    id: '12',
    data: { label: 'Node 12' },
    position: { x: 1000, y: 800 },
  },
];

// 初始邊數據 - 空陣列，與 React 範例一致
const INITIAL_EDGES: AngularEdge[] = [];

@Component({
  selector: 'app-interactive-minimap-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    ControlsComponent,
    MinimapComponent,
    BackgroundComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <angular-xyflow
      #angularFlow
      [defaultNodes]="nodes()"
      [defaultEdges]="edges()"
      [minZoom]="0.2"
      [maxZoom]="4"
      [selectNodesOnDrag]="false"
      [fitView]="true"
      className="angular-xyflow-interactive-minimap-example"
      (onNodeClick)="handleNodeClick($event)"
      (onNodeDrag)="handleNodeDrag($event)"
      (onNodeDragStop)="handleNodeDragStop($event)"
    >
      <!-- 背景 -->
      <angular-xyflow-background [variant]="backgroundVariant.Dots" />

      <!-- MiniMap -->
      <angular-xyflow-minimap
        [pannable]="true"
        [zoomable]="true"
        [inversePan]="inversePan()"
        [onClick]="onMiniMapClick"
        [onNodeClick]="onMiniMapNodeClick"
      />

      <!-- 控制器 -->
      <angular-xyflow-controls />

      <!-- 控制按鈕面板 -->
      <div class="control-panel">
        <button (click)="resetTransform()">reset transform</button>
        <button (click)="updatePos()">change pos</button>
        <button (click)="toggleClassnames()">toggle classnames</button>
        <button (click)="logToObject()">toObject</button>
        <button (click)="toggleInverse()">
          {{ inversePan() ? 'un-inverse pan' : 'inverse pan' }}
        </button>
      </div>
    </angular-xyflow>
  `,
  styles: [
    `
      .control-panel {
        position: absolute;
        right: 10px;
        top: 10px;
        z-index: 4;
        display: flex;
        gap: 5px;
        flex-wrap: wrap;
      }

      .control-panel button {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        font-size: 12px;
        white-space: nowrap;
      }

      .control-panel button:hover {
        background: #f0f0f0;
      }

      .dark .control-panel button {
        background: #333;
        border-color: #555;
        color: white;
      }

      .dark .control-panel button:hover {
        background: #444;
      }

      /* 節點類名樣式 */
      :host ::ng-deep {
        .angular-xyflow__node.light {
          background: #ffffff;
          border: 2px solid #1a73e8;
        }

        .angular-xyflow__node.light .angular-xyflow__node-default {
          background: #ffffff;
        }

        .angular-xyflow__node.dark {
          background: #333333;
          border: 2px solid #f59e0b;
          color: white;
        }

        .angular-xyflow__node.dark .angular-xyflow__node-default {
          background: #333333;
          color: white;
        }
      }
    `,
  ],
})
export class InteractiveMinimapExampleComponent {
  // ViewChild 引用 AngularXYFlowComponent
  angularFlow = viewChild.required<AngularXYFlowComponent>('angularFlow');

  // 核心狀態管理
  private _nodes = signal<AngularNode[]>(INITIAL_NODES);
  private _edges = signal<AngularEdge[]>(INITIAL_EDGES);
  private _inversePan = signal<boolean>(false);

  // 背景變體引用
  backgroundVariant = BackgroundVariant;

  // 公開的只讀狀態
  nodes = this._nodes.asReadonly();
  edges = this._edges.asReadonly();
  inversePan = this._inversePan.asReadonly();

  // ========================================
  // 按鈕功能實現 - 與 React 範例完全對應
  // ========================================

  // 1. 更新節點位置（隨機化）
  updatePos = (): void => {
    const flowInstance = this.angularFlow().getFlow();
    flowInstance.setNodes((currentNodes: AngularNode[]) =>
      currentNodes.map((node) => ({
        ...node,
        position: {
          x: Math.random() * 400,
          y: Math.random() * 400,
        },
      }))
    );
  };

  // 2. 重置視口
  resetTransform = (): void => {
    const flowInstance = this.angularFlow().getFlow();
    flowInstance.setViewport({ x: 0, y: 0, zoom: 1 });
  };

  // 3. 切換節點類名
  toggleClassnames = (): void => {
    const flowInstance = this.angularFlow().getFlow();
    flowInstance.setNodes((currentNodes: AngularNode[]) =>
      currentNodes.map((node) => ({
        ...node,
        className: node.className === 'light' ? 'dark' : 'light',
      }))
    );
  };

  // 4. 導出數據
  logToObject = (): void => {
    const flowInstance = this.angularFlow().getFlow();
    console.log(flowInstance.toObject());
  };

  // 5. 切換反向平移
  toggleInverse = (): void => {
    this._inversePan.update((current) => !current);
  };

  // ========================================
  // MiniMap 事件處理 - 與 React 範例完全對應
  // ========================================

  // MiniMap 背景點擊
  onMiniMapClick = (event: MouseEvent, position: XYPosition): void => {
    console.log(position);
  };

  // MiniMap 節點點擊
  onMiniMapNodeClick = (event: MouseEvent, node: AngularNode): void => {
    console.log(node);
  };

  // ========================================
  // 流程節點事件處理 - 與 React 範例完全對應
  // ========================================

  handleNodeClick(data: { event: MouseEvent; node: AngularNode }): void {
    console.log('click', data.node);
  }

  handleNodeDrag(data: { event: MouseEvent; node: AngularNode }): void {
    console.log('drag', data.node);
  }

  handleNodeDragStop(data: { event: MouseEvent; node: AngularNode }): void {
    console.log('drag stop', data.node);
  }
}
