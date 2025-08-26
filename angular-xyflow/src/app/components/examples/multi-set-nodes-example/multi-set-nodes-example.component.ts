import {
  Component,
  signal,
  effect,
  viewChild,
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular XYFlow 相關導入
import { AngularXYFlowComponent } from '../../angular-xyflow/container/angular-xyflow/angular-xyflow.component';
import { ControlsComponent } from '../../angular-xyflow/additional-components/controls/controls.component';
import { BackgroundComponent } from '../../angular-xyflow/additional-components/background/background.component';
import { PanelComponent } from '../../angular-xyflow/additional-components/panel/panel.component';

// 類型導入
import type { Connection, NodeChange, EdgeChange } from '@xyflow/system';
import type { AngularNode, AngularEdge } from '../../angular-xyflow/types';

// 變更處理函數導入 - 對應React Flow的applyNodeChanges
import {
  applyNodeChanges,
  applyEdgeChanges,
} from '../../angular-xyflow/utils/changes';

// 定義節點和邊緣類型
type NodeType = AngularNode;
type EdgeType = AngularEdge;

@Component({
  selector: 'app-multi-set-nodes-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    ControlsComponent,
    BackgroundComponent,
    PanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="multi-set-nodes-container">
      <angular-xyflow
        [nodes]="nodes()"
        [edges]="edges()"
        (onNodesChange)="handleNodesChange($event)"
        (onEdgesChange)="handleEdgesChange($event)"
        (onConnect)="handleConnect($event)"
        [fitView]="true"
        className="multiset"
      >
        <angular-xyflow-controls />
        <angular-xyflow-background />

        <angular-xyflow-panel [position]="'top-right'">
          <div class="panel-buttons">
            <button
              class="control-button"
              (click)="multiSetNodes()"
            >
              set nodes
            </button>
            <button
              class="control-button"
              (click)="multiUpdateNodes()"
            >
              update nodes
            </button>
            <button
              class="control-button"
              (click)="multiUpdateEdges()"
            >
              update edges
            </button>
          </div>
        </angular-xyflow-panel>
      </angular-xyflow>
    </div>
  `,
  styles: [
    `
      .multi-set-nodes-container {
        width: 100vw;
        height: 100vh;
        position: relative;
      }

      :host ::ng-deep .multiset .angular-xyflow__node {
        width: 50px;
      }

      .panel-buttons {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 200px;
      }

      .control-button {
        padding: 8px 16px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: #fff;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }

      .control-button:hover {
        background: #f5f5f5;
        border-color: #1890ff;
      }

    `,
  ],
})
export class MultiSetNodesExampleComponent {
  // ViewChild 獲取 flow instance - 對應React版本的useReactFlow
  angularFlow = viewChild.required(AngularXYFlowComponent);
  
  // 狀態信號 - 對應React版本的useNodesState和useEdgesState
  nodes = signal<NodeType[]>(this.generateInitialNodes());
  edges = signal<EdgeType[]>([]);
  
  // getter 獲取 flow instance - 對應React版本的useReactFlow返回的方法
  private get _flow() {
    return this.angularFlow().getFlow();
  }

  constructor() {
    // 生成初始邊緣（在節點創建後）
    effect(() => {
      const initialNodes = this.nodes();
      if (initialNodes.length > 0 && this.edges().length === 0) {
        this.edges.set(this.generateInitialEdges(initialNodes));
      }
    });
  }

  // 生成初始節點（100個節點，10x10網格）
  private generateInitialNodes(): NodeType[] {
    const initNodes: NodeType[] = [];

    for (let i = 0; i < 100; i++) {
      initNodes.push({
        id: i.toString(),
        data: {
          label: `node ${i + 1}`,
        },
        position: {
          x: (i % 10) * 60,
          y: Math.floor(i / 10) * 60,
        },
        type: 'default',
      });
    }

    return initNodes;
  }

  // 生成初始邊緣（連接相鄰節點）
  private generateInitialEdges(nodes: NodeType[]): EdgeType[] {
    return nodes.reduce<EdgeType[]>((edges, _, index) => {
      if (index > 0) {
        edges.push({
          id: `${index - 1}-${index}`,
          source: (index - 1).toString(),
          target: index.toString(),
        });
      }
      return edges;
    }, []);
  }

  // 節點變更處理 - 實現controlled模式的核心邏輯
  handleNodesChange(changes: NodeChange<NodeType>[]): void {
    // ✅ 正確的controlled模式實作：使用applyNodeChanges保持所有變更（包括拖拽位置）
    const currentNodes = this.nodes();
    const newNodes = applyNodeChanges(changes, currentNodes);
    this.nodes.set(newNodes);
  }

  // 邊緣變更處理 - 實現controlled模式的邊緣變更處理
  handleEdgesChange(changes: EdgeChange<EdgeType>[]): void {
    // ✅ 正確的controlled模式實作：使用applyEdgeChanges保持所有變更
    const currentEdges = this.edges();
    const newEdges = applyEdgeChanges(changes, currentEdges);
    this.edges.set(newEdges);
  }

  // 連接處理
  handleConnect(connection: Connection): void {
    const newEdge: EdgeType = {
      id: `${connection.source}-${connection.target}`,
      source: connection.source!,
      target: connection.target!,
      sourceHandle: connection.sourceHandle ?? undefined,
      targetHandle: connection.targetHandle ?? undefined,
    };

    this.edges.update((edges) => [...edges, newEdge]);
  }

  // 批量設置節點 - 完全對應React版本的multiSetNodes
  multiSetNodes(): void {
    // ✅ React模式：使用組件當前狀態，包含所有拖拽位置變更
    const currentNodes = this.nodes();
    
    // ✅ 對應React版本：nodes.forEach((node) => setNodes(...))
    currentNodes.forEach((node) => {
      this.nodes.set(
        this.nodes().map((n) => {
          if (n.id === node.id) {
            return { ...n, data: { label: 'node set' } };
          }
          return n;
        })
      );
    });
  }

  // 批量更新節點數據 - 完全對應React版本的multiUpdateNodes
  multiUpdateNodes(): void {
    // ✅ 對應React版本：nodes.forEach((node) => updateNodeData(node.id, { label: 'node update' }))
    const currentNodes = this.nodes();
    const flowInstance = this._flow;
    
    currentNodes.forEach((node) => {
      flowInstance.updateNodeData(node.id, { label: 'node update' });
    });
  }

  // 批量更新邊緣 - 完全對應React版本的multiUpdateEdges
  multiUpdateEdges(): void {
    // ✅ 對應React版本：edges.forEach((edge) => updateEdge(edge.id, { label: 'edge update' }))
    const currentEdges = this.edges();
    const flowInstance = this._flow;
    
    currentEdges.forEach((edge) => {
      flowInstance.updateEdge(edge.id, { label: 'edge update' });
    });
  }
}
