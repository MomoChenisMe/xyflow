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
  AngularXYFlowComponent,
  BackgroundComponent,
  PanelComponent,
  AngularNode,
  AngularEdge,
  BackgroundVariant,
  AngularXYFlowInstance,
} from '../../angular-xyflow';

@Component({
  selector: 'app-controlled-uncontrolled-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    BackgroundComponent,
    PanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 
      警告：這個模板故意展示錯誤的用法！
      同時使用 controlled ([nodes]/[edges]) 和 uncontrolled ([defaultNodes]/[defaultEdges]) 模式
      這會導致：
      1. 新建立的 edge 在點擊後可能消失
      2. 狀態不一致和意外行為
      3. 使用者體驗不佳
      
      正確做法：只選擇其中一種模式
      - Controlled：只使用 [nodes] 和 [edges]
      - Uncontrolled：只使用 [defaultNodes] 和 [defaultEdges]
    -->
    <angular-xyflow
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
      <angular-xyflow-background [variant]="backgroundVariant.Lines" />

      <angular-xyflow-panel position="top-right">
        <div class="angular-xyflow-panel">
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
      </angular-xyflow-panel>
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
    `,
  ],
})
export class ControlledUncontrolledExampleComponent {
  // 視圖子元素引用
  readonly angularFlow = viewChild.required(AngularXYFlowComponent);

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
  // 警告：這是不良實踐！不應該同時使用 controlled 和 uncontrolled 模式
  // 這個範例故意展示錯誤用法，會導致狀態衝突和意外行為（如新 edge 點擊後消失）
  // 正確做法是只選擇其中一種模式：要麼只用 [nodes]/[edges]，要麼只用 [defaultNodes]/[defaultEdges]
  readonly nodes = signal<AngularNode[]>(this.defaultNodes);
  readonly edges = signal<AngularEdge[]>(this.defaultEdges);
  
  // 防止無限循環的標記
  private _isProcessingBug = false;

  // 獲取流程實例
  private get _flow(): AngularXYFlowInstance<AngularNode, AngularEdge> {
    return this.angularFlow().getFlow();
  }

  // 事件處理方法
  // 注意：這些方法故意實作得很簡單，不處理 controlled/uncontrolled 衝突
  // 這會導致狀態不一致，新建的 edge 點擊後可能消失
  onNodesChange(nodes: AngularNode[]): void {
    // 直接更新受控狀態，不考慮與 defaultNodes 的衝突
    this.nodes.set(nodes);
  }

  onEdgesChange(edges: AngularEdge[]): void {
    // 直接更新受控狀態，不保留任何樣式或做智能合併
    // 這會導致與 defaultEdges 的狀態衝突，造成意外行為
    
    // 防止無限循環
    if (this._isProcessingBug) {
      return;
    }
    
    // 檢測controlled/uncontrolled衝突場景
    const hasSelectedEdges = edges.some(edge => edge.selected);
    const hasMoreThanDefault = edges.length > this.defaultEdges.length;
    
    if (hasSelectedEdges && hasMoreThanDefault && !this._isProcessingBug) {
      // 觸發bug：當選中edge且有新edge時，強制回退到defaultEdges
      // 這模擬了controlled/uncontrolled混合使用導致的狀態丟失
      
      this._isProcessingBug = true;
      
      // 重置controlled state
      this.edges.set(this.defaultEdges);
      
      // 關鍵：同步清理service層的edge狀態，移除新添加的edges
      // 這確保了所有層級的狀態都被重置，避免後續操作重新觸發
      const flow = this._flow;
      const serviceEdges = flow.getEdges();
      const edgesToRemove = serviceEdges.filter((edge: AngularEdge) => 
        !this.defaultEdges.some(defaultEdge => defaultEdge.id === edge.id)
      );
      
      if (edgesToRemove.length > 0) {
        // 一次性移除所有不屬於defaultEdges的邊
        flow.deleteElements({ 
          edges: edgesToRemove.map((edge: AngularEdge) => ({ id: edge.id }))
        });
      }
      
      // 延遲重置標記以避免立即重新觸發
      setTimeout(() => {
        this._isProcessingBug = false;
      }, 100);
    } else {
      this.edges.set(edges);
    }
  }

  // 按鈕操作方法
  resetTransform(): void {
    // 重置視窗變換到初始位置（這個操作相對安全，不涉及狀態衝突）
    this._flow.setViewport({ x: 0, y: 0, zoom: 1 });
  }

  updateNodePositions(): void {
    // 警告：這個操作直接修改 controlled 狀態，會加劇與 defaultNodes 的衝突
    // 在混合模式下，這種直接修改可能導致意外的重置行為
    this._flow.setNodes((nodes: AngularNode[]) =>
      nodes.map((node: AngularNode) => ({
        ...node,
        position: {
          x: Math.random() * 400,
          y: Math.random() * 400,
        },
      }))
    );
  }

  updateEdgeColors(): void {
    // 警告：這個操作直接修改 controlled 狀態，會加劇與 defaultEdges 的衝突
    // 在混合模式下，修改樣式後的 edge 點擊可能會消失或重置
    this._flow.setEdges((edges: AngularEdge[]) =>
      edges.map((edge: AngularEdge) => ({
        ...edge,
        style: {
          stroke: '#ff5050',
        },
      }))
    );
  }

  logToObject(): void {
    // 輸出當前 flow 狀態到 console（類似 React 版本的 instance.toObject）
    // 注意：輸出的狀態可能不一致，因為 controlled 和 uncontrolled 狀態混合
    console.log(this._flow.toObject());
  }
}
