import {
  Component,
  signal,
  computed,
  inject,
  viewChild,
  ChangeDetectionStrategy,
  afterRenderEffect,
  ComponentRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// XYFlow 系統模組
import { Position, type Connection, type NodeChange, type EdgeChange } from '@xyflow/system';

// XYFlow 組件
import { AngularXYFlowComponent } from '../../angular-xyflow/container/angular-xyflow/angular-xyflow.component';
import { BackgroundComponent } from '../../angular-xyflow/additional-components/background/background.component';
import { ControlsComponent } from '../../angular-xyflow/additional-components/controls/controls.component';

// 類型和工具
import type { AngularNode, AngularEdge } from '../../angular-xyflow/types';
import { applyNodeChanges, applyEdgeChanges } from '../../angular-xyflow/utils/changes';

// 自定義節點
import { MovingHandleNodeComponent } from './moving-handle-node.component';

// 服務
import { AngularXYFlowService } from '../../angular-xyflow/services/angular-xyflow.service';

// 定義節點和邊類型 - 使用預設類型
type MyNode = AngularNode;
type MyEdge = AngularEdge;

@Component({
  selector: 'app-moving-handles-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    BackgroundComponent,
    ControlsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <angular-xyflow
      #angularFlow
      [nodes]="nodes()"
      [edges]="edges()"
      [nodeTypes]="nodeTypes"
      [minZoom]="0.2"
      [fitView]="true"
      (onNodesChange)="onNodesChange($event)"
      (onEdgesChange)="onEdgesChange($event)"
      (onConnect)="onConnect($event)"
      className="moving-handles-example">
      
      <angular-xyflow-controls />
      <angular-xyflow-background />
    </angular-xyflow>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    angular-xyflow {
      width: 100%;
      height: 100%;
    }
  `]
})
export class MovingHandlesExampleComponent {
  // 視圖子元素引用
  angularFlow = viewChild.required(AngularXYFlowComponent);
  
  // 注入服務
  private _flowService = inject(AngularXYFlowService);
  
  // 節點類型定義
  readonly nodeTypes = {
    movingHandle: MovingHandleNodeComponent as any
  };
  
  // 狀態管理 - 使用 Controlled 模式
  nodes = signal<MyNode[]>(this.createInitialNodes());
  edges = signal<MyEdge[]>([]);
  
  // 連接狀態監聽
  connectionInProgress = computed(() => this._flowService.connectionInProgress());
  private updateLoopRunning = signal(false);
  
  constructor() {
    // 實現 NodeUpdater 功能：監聽連接狀態變化並進行高頻更新
    afterRenderEffect(() => {
      const isInProgress = this.connectionInProgress();
      
      // 只在連接狀態從 false 變為 true 時啟動更新循環
      if (isInProgress && !this.updateLoopRunning()) {
        this.startNodeInternalsUpdater();
      }
    });
  }
  
  /**
   * 創建初始節點
   * 複製 React 版本的節點結構：1個 input 節點 + 10個 movingHandle 節點
   */
  private createInitialNodes(): MyNode[] {
    const initialNodes: MyNode[] = [
      {
        id: 'input',
        type: 'input',
        data: { label: 'input' },
        position: { x: -300, y: 0 },
        sourcePosition: Position.Right,
      }
    ];
    
    // 動態生成 10 個 movingHandle 節點
    for (let i = 0; i < 10; i++) {
      initialNodes.push({
        id: `${i}`,
        type: 'movingHandle',
        position: { x: 0, y: i * 60 },
        data: {},
      });
    }
    
    return initialNodes;
  }
  
  /**
   * 實現 NodeUpdater 功能
   * 在連接進行時進行 500ms 的高頻更新，確保 handle 位置準確計算
   */
  private startNodeInternalsUpdater(): void {
    this.updateLoopRunning.set(true);
    const startTime = Date.now();
    const nodeIds = this.nodes().map(node => node.id);
    
    const updateLoop = () => {
      if (Date.now() - startTime < 500) {
        // 觸發節點內部更新，確保連接線精確渲染
        this._flowService.updateNodeInternals(nodeIds);
        requestAnimationFrame(updateLoop);
      } else {
        // 更新循環結束
        this.updateLoopRunning.set(false);
      }
    };
    
    requestAnimationFrame(updateLoop);
  }
  
  // 受控模式事件處理
  
  /**
   * 處理節點變更（拖拽、選擇等）
   */
  onNodesChange(changes: NodeChange<MyNode>[]): void {
    this.nodes.update(currentNodes => 
      applyNodeChanges(changes, currentNodes)
    );
  }
  
  /**
   * 處理邊緣變更（選擇、刪除等）
   */
  onEdgesChange(changes: EdgeChange<MyEdge>[]): void {
    this.edges.update(currentEdges =>
      applyEdgeChanges(changes, currentEdges)
    );
  }
  
  /**
   * 處理新連接建立
   * 為新連接添加動畫效果，與 React 版本一致
   */
  onConnect(connection: Connection): void {
    const newEdge: MyEdge = {
      id: `${connection.source}${connection.sourceHandle || ''}-${connection.target}${connection.targetHandle || ''}`,
      source: connection.source!,
      target: connection.target!,
      sourceHandle: connection.sourceHandle ?? undefined,
      targetHandle: connection.targetHandle ?? undefined,
      animated: true, // 與 React 版本一致的動畫效果
    };
    
    this.edges.update(currentEdges => [
      ...currentEdges,
      newEdge
    ]);
  }
}