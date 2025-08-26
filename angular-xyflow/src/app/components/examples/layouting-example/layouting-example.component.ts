// Angular 核心模組
import {
  Component,
  signal,
  viewChild,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  afterNextRender,
  Injector,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Dagre 佈局庫
import * as dagre from '@dagrejs/dagre';

// XyFlow 系統模組
import { Position, Connection } from '@xyflow/system';

// 專案內部模組
import {
  AngularXYFlowComponent,
  ControlsComponent,
  PanelComponent,
  DevToolsComponent,
  AngularNode,
  AngularEdge,
  AngularXYFlowInstance,
  NodeChange,
  EdgeChange,
  MarkerType,
  EdgeMarker,
} from '../../angular-xyflow';
import { initialItems } from './initial-elements';

@Component({
  selector: 'app-layouting-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    ControlsComponent,
    PanelComponent,
    DevToolsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="layouting-example">
      <angular-xyflow
        #angularFlow
        [nodes]="nodes()"
        [edges]="edges()"
        (onNodesChange)="handleNodesChange($event)"
        (onEdgesChange)="handleEdgesChange($event)"
        (onConnect)="handleConnect($event)"
      >
        <angular-xyflow-controls />

        <angular-xyflow-panel position="top-right">
          <div class="control-panel">
            <button (click)="onLayout('TB')" class="flow-button">
              vertical layout
            </button>
            <button (click)="onLayout('LR')" class="flow-button">
              horizontal layout
            </button>
            <button (click)="unselect()" class="flow-button">
              unselect nodes
            </button>
            <button (click)="changeMarker()" class="flow-button">
              change marker
            </button>
            <button (click)="fitView()" class="flow-button">
              fitView
            </button>
            <button (click)="fitViewPartially()" class="flow-button">
              fitView partially
            </button>
          </div>
        </angular-xyflow-panel>
        
        <angular-xyflow-devtools position="top-left" />
        
      </angular-xyflow>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .layouting-example {
      flex-grow: 1;
      position: relative;
      width: 100%;
      height: 100%;
    }

    angular-xyflow {
      width: 100%;
      height: 100%;
    }

    .control-panel {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 10px;
    }

    .flow-button {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
      font-size: 12px;
      transition: background-color 0.2s;
    }

    .flow-button:hover {
      background: #f5f5f5;
    }
  `],
})
export class LayoutingExampleComponent implements OnInit {
  // 視圖子元素引用
  angularFlow = viewChild.required<AngularXYFlowComponent>('angularFlow');

  // 依賴注入
  private injector = inject(Injector);

  // Dagre 圖形實例
  private dagreGraph = new dagre.graphlib.Graph();

  // 節點和邊的狀態 (controlled 模式)
  nodes = signal<AngularNode[]>(initialItems.nodes);
  edges = signal<AngularEdge[]>(initialItems.edges);

  constructor() {
    // 初始化 Dagre 設置
    this.dagreGraph.setDefaultEdgeLabel(() => ({}));

    // 在 constructor 中調用 afterNextRender（推薦做法）
    afterNextRender(() => {
      this.onLayout('TB');
    });
  }

  ngOnInit(): void {
    // ngOnInit 不再需要處理初始化布局
  }

  // 獲取流程實例
  private get _flow(): AngularXYFlowInstance<AngularNode, AngularEdge> {
    return this.angularFlow().getFlow();
  }

  // 節點變更處理
  handleNodesChange(changes: NodeChange<AngularNode>[]): void {
    // 在 controlled 模式下，我們需要手動應用變更
    this.nodes.update(currentNodes => {
      return this.applyNodeChanges(changes, currentNodes);
    });
  }

  // 邊變更處理
  handleEdgesChange(changes: EdgeChange<AngularEdge>[]): void {
    // 在 controlled 模式下，我們需要手動應用變更
    this.edges.update(currentEdges => {
      return this.applyEdgeChanges(changes, currentEdges);
    });
  }

  // 連接處理
  handleConnect(connection: Connection): void {
    const newEdge: AngularEdge = {
      id: `e${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle || undefined,
      targetHandle: connection.targetHandle || undefined,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.Arrow },
    };

    this.edges.update(currentEdges => [...currentEdges, newEdge]);
  }


  // Dagre 布局算法 - 優化版本（與 React Flow 行為一致）
  onLayout(direction: 'TB' | 'LR'): void {
    const isHorizontal = direction === 'LR';
    const currentNodes = this.nodes();
    const currentEdges = this.edges();

    // 設置圖形屬性
    this.dagreGraph.setGraph({ rankdir: direction });

    // 直接設置節點，Dagre 會自動更新現有節點
    currentNodes.forEach(node => {
      this.dagreGraph.setNode(node.id, {
        width: 150,
        height: 50
      });
    });

    currentEdges.forEach(edge => {
      this.dagreGraph.setEdge(edge.source, edge.target);
    });

    // 執行布局計算
    dagre.layout(this.dagreGraph);

    // 更新節點位置和連接點位置
    const layoutedNodes = currentNodes.map(node => {
      const nodeWithPosition = this.dagreGraph.node(node.id);
      return {
        ...node,
        // 🔑 關鍵：設定 handle 的位置
        targetPosition: isHorizontal ? Position.Left : Position.Top,
        sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
        // 更新節點位置
        position: {
          x: nodeWithPosition.x,
          y: nodeWithPosition.y,
        },
      };
    });

    // 直接更新節點，讓 Angular 的變更檢測和 Signal 系統自動處理
    // 不需要手動刷新或延遲，系統會自動重新計算 edges
    this.nodes.set(layoutedNodes);
  }

  // 取消選擇所有節點
  unselect(): void {
    const currentNodes = this.nodes();
    const unselectedNodes = currentNodes.map(node => ({
      ...node,
      selected: false
    }));
    this.nodes.set(unselectedNodes);
  }

  // 切換邊箭頭標記
  changeMarker(): void {
    const currentEdges = this.edges();
    const updatedEdges = currentEdges.map(edge => ({
      ...edge,
      markerEnd: {
        type: (edge.markerEnd as EdgeMarker)?.type === MarkerType.Arrow
          ? MarkerType.ArrowClosed
          : MarkerType.Arrow,
      },
    }));
    this.edges.set(updatedEdges);
  }

  // 適應視窗
  fitView(): void {
    const flowComponent = this.angularFlow();
    if (flowComponent) {
      flowComponent.performFitView();
    }
  }

  // 部分適應視窗
  fitViewPartially(): void {
    const flowComponent = this.angularFlow();
    if (flowComponent) {
      const firstTwoNodes = this.nodes().slice(0, 2);
      flowComponent.performFitView({ nodes: firstTwoNodes });
    }
  }

  // 簡化的變更應用函數（模仿 @xyflow/system 的 applyNodeChanges）
  private applyNodeChanges(changes: NodeChange<AngularNode>[], nodes: AngularNode[]): AngularNode[] {
    let updatedNodes = [...nodes];

    for (const change of changes) {
      switch (change.type) {
        case 'add':
          if ('item' in change) {
            updatedNodes.push(change.item);
          }
          break;
        case 'remove':
          if ('id' in change) {
            updatedNodes = updatedNodes.filter(node => node.id !== change.id);
          }
          break;
        case 'replace':
          if ('id' in change && 'item' in change) {
            const index = updatedNodes.findIndex(node => node.id === change.id);
            if (index !== -1) {
              updatedNodes[index] = change.item;
            }
          }
          break;
        case 'position':
        case 'dimensions':
        case 'select':
          if ('id' in change) {
            const index = updatedNodes.findIndex(node => node.id === change.id);
            if (index !== -1) {
              const node = updatedNodes[index];
              switch (change.type) {
                case 'position':
                  updatedNodes[index] = {
                    ...node,
                    position: change.position || node.position,
                    dragging: change.dragging || false,
                  };
                  break;
                case 'dimensions':
                  updatedNodes[index] = {
                    ...node,
                    width: change.dimensions?.width || node.width,
                    height: change.dimensions?.height || node.height,
                  };
                  break;
                case 'select':
                  updatedNodes[index] = {
                    ...node,
                    selected: change.selected,
                  };
                  break;
              }
            }
          }
          break;
      }
    }

    return updatedNodes;
  }

  // 簡化的邊變更應用函數
  private applyEdgeChanges(changes: EdgeChange<AngularEdge>[], edges: AngularEdge[]): AngularEdge[] {
    let updatedEdges = [...edges];

    for (const change of changes) {
      switch (change.type) {
        case 'add':
          if ('item' in change) {
            updatedEdges.push(change.item);
          }
          break;
        case 'remove':
          if ('id' in change) {
            updatedEdges = updatedEdges.filter(edge => edge.id !== change.id);
          }
          break;
        case 'replace':
          if ('id' in change && 'item' in change) {
            const index = updatedEdges.findIndex(edge => edge.id === change.id);
            if (index !== -1) {
              updatedEdges[index] = change.item;
            }
          }
          break;
        case 'select':
          if ('id' in change) {
            const index = updatedEdges.findIndex(edge => edge.id === change.id);
            if (index !== -1) {
              updatedEdges[index] = {
                ...updatedEdges[index],
                selected: change.selected,
              };
            }
          }
          break;
      }
    }

    return updatedEdges;
  }
}
