// Angular 核心模組
import {
  Component,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// 專案內部模組
import {
  AngularFlowComponent,
  BackgroundComponent,
  PanelComponent,
  AngularNode,
  AngularEdge,
  BackgroundVariant,
  AngularFlowInstance,
} from '../../angular-flow';

@Component({
  selector: 'app-controlled-uncontrolled-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularFlowComponent,
    BackgroundComponent,
    PanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <angular-flow
      #angularFlow
      [nodes]="nodes()"
      [edges]="edges()"
      [defaultNodes]="defaultNodes"
      [defaultEdges]="defaultEdges"
      [defaultEdgeOptions]="defaultEdgeOptions"
      [fitView]="true"
      (onNodesChange)="onNodesChange($event)"
      (onEdgesChange)="onEdgesChange($event)"
      className="controlled-uncontrolled-flow"
    >
      <angular-flow-background [variant]="backgroundVariant.Lines" />

      <angular-flow-panel position="top-right">
        <div class="angular-flow-panel">
          <button (click)="resetTransform()" class="flow-button">
            reset transform
          </button>
          <button (click)="updateNodePositions()" class="flow-button">
            change pos
          </button>
          <button (click)="updateEdgeColors()" class="flow-button">
            red edges
          </button>
          <button (click)="logToObject()" class="flow-button">
            toObject
          </button>
        </div>
      </angular-flow-panel>
    </angular-flow>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      angular-flow {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class ControlledUncontrolledExampleComponent {
  // 視圖子元素引用
  readonly angularFlow = viewChild.required(AngularFlowComponent);

  // 背景變體枚舉
  readonly backgroundVariant = BackgroundVariant;

  // 預設節點數據（uncontrolled）
  readonly defaultNodes: AngularNode[] = [
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

  // 預設邊數據（uncontrolled）
  readonly defaultEdges: AngularEdge[] = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e1-3', source: '1', target: '3' },
  ];

  // 預設邊選項
  readonly defaultEdgeOptions = {
    animated: true,
    selectable: true,
  };

  // 控制狀態的信號（controlled）
  // 注意：這是不良實踐，同時使用 controlled 和 uncontrolled 模式僅為測試 API
  readonly nodes = signal<AngularNode[]>(this.defaultNodes);
  readonly edges = signal<AngularEdge[]>(this.defaultEdges);

  // 獲取流程實例
  private get _flow(): AngularFlowInstance<AngularNode, AngularEdge> {
    return this.angularFlow().getFlow();
  }

  // 事件處理方法
  onNodesChange(nodes: AngularNode[]): void {
    // 更新受控狀態
    this.nodes.set(nodes);
  }

  onEdgesChange(edges: AngularEdge[]): void {
    // 智能合併：保留現有edge的自定義樣式
    const currentEdges = this.edges();
    const currentEdgeStyles = new Map(
      currentEdges.map(edge => [edge.id, edge.style])
    );
    
    // 更新edges，但保留已存在edge的樣式
    const mergedEdges = edges.map(edge => {
      const existingStyle = currentEdgeStyles.get(edge.id);
      return existingStyle ? { ...edge, style: existingStyle } : edge;
    });
    
    this.edges.set(mergedEdges);
  }

  // 按鈕操作方法
  resetTransform(): void {
    // 重置視窗變換到初始位置
    this._flow.setViewport({ x: 0, y: 0, zoom: 1 });
  }

  updateNodePositions(): void {
    // 在 controlled 模式下，需要通過父組件狀態更新來觸發視圖更新
    // 直接更新父組件信號，這會觸發 Angular Flow 組件的 visibleNodes 重新計算
    this.nodes.update((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        position: {
          x: Math.random() * 400,
          y: Math.random() * 400,
        },
      }))
    );
  }

  updateEdgeColors(): void {
    // 在 controlled 模式下，需要通過父組件狀態更新來觸發視圖更新
    // 直接更新父組件信號，這會觸發 Angular Flow 組件的 visibleEdges 重新計算
    this.edges.update((currentEdges) =>
      currentEdges.map((edge) => ({
        ...edge,
        style: {
          stroke: '#ff5050',
        },
      }))
    );
  }

  logToObject(): void {
    // 輸出當前 flow 狀態到 console（類似 React 版本的 instance.toObject）
    console.log(this._flow.toObject());
  }
}
