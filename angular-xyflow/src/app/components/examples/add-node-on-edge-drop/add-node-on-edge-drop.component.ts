import { Component, signal, effect, ViewChild, ElementRef, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularXYFlowComponent } from '../../angular-xyflow/angular-xyflow.component';
import { AngularXYFlowService } from '../../angular-xyflow/services/angular-xyflow.service';
import { AngularNode, AngularEdge } from '../../angular-xyflow/types';
import { Connection, addEdge } from '@xyflow/system';

@Component({
  selector: 'app-add-node-on-edge-drop',
  standalone: true,
  imports: [CommonModule, AngularXYFlowComponent],
  template: `
    <div class="wrapper" #wrapper style="height: 100vh; width: 100%;">
      <angular-xyflow
        #flow
        [nodes]="nodes()"
        [edges]="edges()"
        [fitView]="true"
        (onNodesChange)="onNodesChange($event)"
        (onEdgesChange)="onEdgesChange($event)"
        (onConnect)="onConnect($event)"
        (onConnectStart)="onConnectStart($event)"
        (onConnectEnd)="onConnectEnd($event)"
      >
        <!-- 可以添加背景、控制項等 -->
      </angular-xyflow>
    </div>
  `,
  styles: [`
    .wrapper {
      height: 100vh;
      width: 100%;
    }
  `]
})
export class AddNodeOnEdgeDropComponent {
  @ViewChild('flow') flowComponent!: AngularXYFlowComponent;
  @ViewChild('wrapper') wrapper!: ElementRef;

  private cdr = inject(ChangeDetectorRef);

  // 節點和邊的數據
  nodes = signal<AngularNode[]>([
    {
      id: '0',
      type: 'input',
      data: { label: 'Node' },
      position: { x: 0, y: 50 },
    },
  ]);

  edges = signal<AngularEdge[]>([]);

  // 追蹤連接開始的節點ID
  private connectingNodeId: string | null = null;
  private nodeIdCounter = 1;

  constructor() {
    // 可以在這裡初始化其他邏輯
  }

  private getId(): string {
    return `${this.nodeIdCounter++}`;
  }

  // Controlled mode event handlers
  onNodesChange(newNodes: AngularNode[]): void {
    this.nodes.set(newNodes);
  }

  onEdgesChange(newEdges: AngularEdge[]): void {
    this.edges.set(newEdges);
  }

  onConnect(params: Connection): void {
    // 重置連接節點ID - 與 React 版本邏輯一致
    this.connectingNodeId = null;
    
    // 添加新的邊
    this.edges.update(edges => addEdge(params, edges));
  }

  onConnectStart(event: { event: MouseEvent; nodeId: string; handleType: 'source' | 'target'; handleId?: string }): void {
    // 記錄開始連接的節點ID
    this.connectingNodeId = event.nodeId;
  }

  onConnectEnd(eventData: { connection?: Connection; event: MouseEvent }): void {
    if (!this.connectingNodeId) {
      return;
    }

    // 與 React 版本邏輯完全一致：檢查 target 是否包含 pane 類別
    const target = eventData.event.target as Partial<Element> | null;
    const targetIsPane = target?.classList?.contains('angular-xyflow__pane');
    
    if (targetIsPane && 'clientX' in eventData.event && 'clientY' in eventData.event) {
      // 在空白區域結束連接，創建新節點
      this.createNodeAtPosition(eventData.event);
    }
  }

  private createNodeAtPosition(event: MouseEvent): void {
    if (!this.connectingNodeId || !this.flowComponent) {
      return;
    }

    // 獲取新節點ID
    const id = this.getId();

    // 使用screenToFlowPosition轉換座標
    const screenPosition = { x: event.clientX, y: event.clientY };
    const position = this.flowComponent.screenToFlowPosition(screenPosition);

    // 創建新節點 - 與 React 版本一致，並添加 measured 屬性
    const newNode: AngularNode = {
      id,
      position,
      data: { label: `Node ${id}` },
      origin: [0.5, 0.0],
      measured: {
        width: 150,  // 默認寬度與 CSS 一致
        height: 40   // 默認高度
      }
    };
    
    // 創建新邊 - 與 React 版本一致
    const newEdge: AngularEdge = {
      id,
      source: this.connectingNodeId,
      target: id,
    };

    // 在controlled模式下，我們需要更新signals而不是直接調用flow方法
    // 但確保新節點有正確的屬性（如measured）
    this.nodes.update(nodes => {
      const updated = nodes.concat(newNode);
      return updated;
    });
    
    this.edges.update(edges => {
      const updated = edges.concat(newEdge);
      return updated;
    });

    // 手動觸發變更檢測，確保 Angular XYFlow 組件能檢測到 input signals 的變化
    this.cdr.detectChanges();

    // 重置連接節點ID
    this.connectingNodeId = null;
  }

}