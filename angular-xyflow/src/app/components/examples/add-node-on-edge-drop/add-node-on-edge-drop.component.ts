import { Component, signal, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularFlowComponent } from '../../angular-flow/angular-flow.component';
import { AngularFlowService } from '../../angular-flow/angular-flow.service';
import { AngularNode, AngularEdge } from '../../angular-flow/types';
import { Connection } from '@xyflow/system';

@Component({
  selector: 'app-add-node-on-edge-drop',
  standalone: true,
  imports: [CommonModule, AngularFlowComponent],
  template: `
    <div class="wrapper" #wrapper style="height: 100vh; width: 100%;">
      <angular-flow
        #flow
        [defaultNodes]="nodes()"
        [defaultEdges]="edges()"
        [fitView]="true"
        (onConnect)="onConnect($event)"
        (onConnectStart)="onConnectStart($event)"
        (onConnectEnd)="onConnectEnd($event)"
      >
        <!-- 可以添加背景、控制項等 -->
      </angular-flow>
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
  @ViewChild('flow') flowComponent!: AngularFlowComponent;
  @ViewChild('wrapper') wrapper!: ElementRef;

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

  onConnect(params: Connection): void {
    // 重置連接節點ID
    this.connectingNodeId = null;
    
    // 添加新的邊
    this.addEdge(params);
  }

  onConnectStart(event: { event: MouseEvent; nodeId: string; handleType: 'source' | 'target'; handleId?: string }): void {
    // 記錄開始連接的節點ID
    this.connectingNodeId = event.nodeId;
  }

  onConnectEnd(eventData: { connection?: Connection; event: MouseEvent }): void {
    if (!this.connectingNodeId) return;

    // 如果已經有連接，就不創建新節點
    if (eventData.connection) {
      this.connectingNodeId = null;
      return;
    }

    // 檢查結束的目標是否為空白區域（pane）
    const target = eventData.event.target as HTMLElement;
    const targetIsPane = target?.classList?.contains('angular-flow') || 
                        target?.classList?.contains('xy-flow') ||
                        target?.classList?.contains('angular-flow__pane') ||
                        target?.classList?.contains('xy-flow__pane');

    if (targetIsPane && 'clientX' in eventData.event && 'clientY' in eventData.event) {
      // 在空白區域結束連接，創建新節點
      this.createNodeAtPosition(eventData.event);
    }
  }

  private createNodeAtPosition(event: MouseEvent): void {
    if (!this.connectingNodeId || !this.flowComponent) return;

    // 獲取新節點ID
    const id = this.getId();

    // 使用screenToFlowPosition轉換座標
    const position = this.flowComponent.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    // 創建新節點
    const newNode: AngularNode = {
      id,
      position,
      data: { label: `Node ${id}` },
      origin: [0.5, 0.0], // 使用頂部中心作為定位基準，與React版本一致
    };

    // 創建新邊
    const newEdge: AngularEdge = {
      id,
      source: this.connectingNodeId,
      target: id,
    };

    // 使用flow API添加節點和邊
    const flow = this.flowComponent.getFlow();
    flow.addNodes(newNode);
    flow.addEdges(newEdge);

    // 重置連接節點ID
    this.connectingNodeId = null;
  }

  private addEdge(connection: Connection): void {
    const flow = this.flowComponent.getFlow();
    const newEdge: AngularEdge = {
      id: this.getId(),
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle || undefined,
      targetHandle: connection.targetHandle || undefined,
    };
    flow.addEdges(newEdge);
  }
}