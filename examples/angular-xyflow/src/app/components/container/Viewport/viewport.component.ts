import { 
  Component, 
  input,
  output,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '../../../types/node';
import { AngularEdge } from '../../types/edges';
import { NodeRendererComponent } from '../NodeRenderer/node-renderer.component';
import { EdgeRendererComponent } from '../EdgeRenderer/edge-renderer.component';
import { ConnectionLineComponent } from '../../components/ConnectionLine/connection-line.component';
import { FlowStoreService } from '../../store/flow-store.service';

/**
 * Viewport 組件
 * 對應 React Flow 的 Viewport 組件
 * 負責視口變換和包含節點/邊渲染器
 */
@Component({
  selector: 'angular-viewport',
  standalone: true,
  imports: [CommonModule, NodeRendererComponent, EdgeRendererComponent, ConnectionLineComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="react-flow__viewport xy-flow__viewport xyflow__viewport react-flow__container"
      [style.transform]="transform()"
      [style.transform-origin]="'0 0'"
      [style.z-index]="2"
      [style.width]="'100%'"
      [style.height]="'100%'"
      [style.pointer-events]="'none'"
    >
      <!-- 邊渲染器 -->
      <angular-edge-renderer
        [edges]="edges()"
        [nodes]="nodes()"
        [viewport]="viewport()"
        (onEdgeClick)="onAngularEdgeClick.emit($event)"
        (onEdgesChange)="onAngularEdgesChange.emit($event)"
      />
      
      <!-- 連接線 -->
      <angular-connection-line
        [connectionState]="connectionState().connection"
      />
      
      <!-- 節點渲染器 -->
      <angular-node-renderer
        [nodes]="nodes()"
        [viewport]="viewport()"
        [multiSelectionKeyCode]="multiSelectionKeyCode()"
        (onNodesChange)="onNodesChange.emit($event)"
        (onNodeClick)="onNodeClick.emit($event)"
        (onNodeDragStart)="onNodeDragStart.emit($event)"
        (onNodeDrag)="onNodeDrag.emit($event)"
        (onNodeDragStop)="onNodeDragStop.emit($event)"
        (onConnect)="handleConnect($event)"
        (onConnectionStart)="handleConnectionStart($event)"
        (onConnectionEnd)="handleConnectionEnd($event)"
        (onNodePositionChange)="onNodePositionChange.emit($event)"
      />
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    
    .react-flow__viewport,
    .xy-flow__viewport {
      pointer-events: none !important;
      transform-origin: 0 0;
      z-index: 2;
      width: 100%;
      height: 100%;
    }
  `]
})
export class ViewportComponent {
  // === 輸入屬性 ===
  
  // 核心數據 - 使用signals以支持響應式更新
  public nodes = input.required<Node[]>();
  public edges = input.required<AngularEdge[]>();
  public viewport = input.required<{ x: number; y: number; zoom: number }>();
  public transform = input.required<string>();
  public multiSelectionKeyCode = input<string>('Meta');
  
  // === 事件輸出 ===
  
  public onNodesChange = output<Node[]>();
  public onAngularEdgesChange = output<AngularEdge[]>();
  public onNodeClick = output<{ event: MouseEvent; node: Node }>();
  public onNodeDragStart = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  public onNodeDrag = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  public onNodeDragStop = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  public onAngularEdgeClick = output<{ event: MouseEvent; edge: AngularEdge }>();
  public onConnect = output<{ source: string; target: string; sourceHandle?: string; targetHandle?: string }>();
  public onConnectionStart = output<{ nodeId: string; handleType: string; position: { x: number; y: number } }>();
  public onConnectionEnd = output<{ nodeId: string | null; handleType: string | null }>();
  public onNodePositionChange = output<{ node: Node; position: { x: number; y: number } }>();
  
  // === 服務注入 ===
  
  private store = inject(FlowStoreService);
  
  // === 連接狀態（從store獲取） ===
  
  public connectionState = computed(() => {
    const connection = this.store.getConnection()();
    return {
      isConnecting: connection.inProgress,
      fromNode: connection.fromHandle?.nodeId || null,
      fromHandle: connection.fromHandle?.id || null,
      toPosition: connection.to || { x: 0, y: 0 },
      connection: connection
    };
  });
  
  // === 連接處理 ===
  
  protected handleConnectionStart(event: { nodeId: string; handleType: string; position: { x: number; y: number } }) {
    // 連接現在由 FlowStoreService 和 Handle 組件處理
    this.onConnectionStart.emit(event);
  }
  
  protected handleConnectionEnd(event: { nodeId: string | null; handleType: string | null }) {
    // 連接現在由 FlowStoreService 和 Handle 組件處理
    this.onConnectionEnd.emit(event);
  }
  
  protected handleConnect(event: { source: string; target: string; sourceHandle?: string; targetHandle?: string }) {
    // 添加新邊
    const edges = this.edges();
    const newAngularEdge: AngularEdge = {
      id: `e${event.source}-${event.target}`,
      source: event.source,
      target: event.target,
      sourceHandle: event.sourceHandle,
      targetHandle: event.targetHandle,
      selected: false
    };
    
    // 檢查是否已存在相同的邊
    const currentEdges = this.edges();
    const edgeExists = currentEdges.some((e: any) => 
      e.source === event.source && 
      e.target === event.target &&
      e.sourceHandle === event.sourceHandle &&
      e.targetHandle === event.targetHandle
    );
    
    if (!edgeExists) {
      this.onAngularEdgesChange.emit([...currentEdges, newAngularEdge]);
      this.onConnect.emit(event);
    }
  }
  
  // 更新連接線位置（由 NodeRenderer 調用）
  public updateConnectionPosition(position: { x: number; y: number }) {
    // TODO: 實現正確的連接狀態更新，匹配新的Union type
    // const currentState = this.connectionState();
    // if (currentState.isConnecting) {
    //   const store = this.store;
    //   if (store) {
    //     // 需要構造完整的ConnectionInProgress對象
    //   }
    // }
  }
}