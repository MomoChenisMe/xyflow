import { 
  Component, 
  input, 
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  WritableSignal,
  HostListener,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '../../../types/node';
import { AngularEdge } from '../../types/edges';
import { FlowRendererComponent } from '../FlowRenderer/flow-renderer.component';

/**
 * GraphView 組件
 * 對應 ReactFlow 的 GraphView 組件
 * 負責核心的渲染邏輯、交互處理和視口管理
 */
@Component({
  selector: 'angular-flow-graph-view',
  standalone: true,
  imports: [CommonModule, FlowRendererComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <angular-flow-renderer
      [nodes]="internalNodes()"
      [edges]="internalEdges()"
      [viewport]="viewport()"
      [minZoom]="minZoom()"
      [maxZoom]="maxZoom()"
      [panOnDrag]="panOnDrag()"
      [panOnScroll]="panOnScroll()"
      [zoomOnScroll]="zoomOnScroll()"
      [zoomOnPinch]="zoomOnPinch()"
      [zoomOnDoubleClick]="zoomOnDoubleClick()"
      [preventScrolling]="preventScrolling()"
      [selectionOnDrag]="selectionOnDrag()"
      [selectionMode]="selectionMode()"
      [deleteKeyCode]="deleteKeyCode()"
      [multiSelectionKeyCode]="multiSelectionKeyCode()"
      [panActivationKeyCode]="panActivationKeyCode()"
      (onViewportChange)="handleViewportChange($event)"
      (onNodesChange)="handleNodesChange($event)"
      (onEdgesChange)="handleEdgesChange($event)"
      (onNodeClick)="onNodeClick.emit($event)"
      (onNodeDragStart)="onNodeDragStart.emit($event)"
      (onNodeDrag)="onNodeDrag.emit($event)"
      (onNodeDragStop)="onNodeDragStop.emit($event)"
      (onEdgeClick)="onEdgeClick.emit($event)"
      (onConnect)="handleConnect($event)"
      (onConnectionStart)="handleConnectionStart($event)"
      (onConnectionEnd)="handleConnectionEnd($event)"
      (onSelectionChange)="handleSelectionChange($event)"
      (onPaneClick)="onPaneClick.emit($event)"
      (onPaneContextMenu)="onPaneContextMenu.emit($event)"
      (onNodePositionChange)="onNodePositionChange.emit($event)"
    />
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class GraphViewComponent {
  // === 輸入屬性 ===
  
  // 核心數據
  public internalNodes = input.required<Node[]>();
  public internalEdges = input.required<AngularEdge[]>();
  public viewport = input.required<{ x: number; y: number; zoom: number }>();
  
  // 縮放和平移設定
  public minZoom = input<number>(0.5);
  public maxZoom = input<number>(2);
  public panOnDrag = input<boolean>(true);
  public panOnScroll = input<boolean>(false);
  public zoomOnScroll = input<boolean>(true);
  public zoomOnPinch = input<boolean>(true);
  public zoomOnDoubleClick = input<boolean>(true);
  public preventScrolling = input<boolean>(true);
  
  // 選擇設定
  public selectionOnDrag = input<boolean>(false);
  public selectionMode = input<'partial' | 'full'>('full');
  public multiSelectionKeyCode = input<string>('Meta');
  public deleteKeyCode = input<string>('Backspace');
  public panActivationKeyCode = input<string>('Space');
  
  // === 事件輸出 ===
  
  public onNodeClick = output<{ event: MouseEvent; node: Node }>();
  public onNodeDragStart = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  public onNodeDrag = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  public onNodeDragStop = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  public onEdgeClick = output<{ event: MouseEvent; edge: AngularEdge }>();
  public onConnect = output<{ source: string; target: string; sourceHandle?: string; targetHandle?: string }>();
  public onConnectionStart = output<{ nodeId: string; handleType: string; position: { x: number; y: number } }>();
  public onConnectionEnd = output<{ nodeId: string | null; handleType: string | null }>();
  public onPaneClick = output<MouseEvent>();
  public onPaneContextMenu = output<MouseEvent>();
  public onViewportChange = output<{ x: number; y: number; zoom: number }>();
  public onNodesChange = output<Node[]>();
  public onEdgesChange = output<AngularEdge[]>();
  public onNodePositionChange = output<{ node: Node; position: { x: number; y: number } }>();

  // === 事件處理方法 ===
  
  protected handleViewportChange(viewport: { x: number; y: number; zoom: number }) {
    this.onViewportChange.emit(viewport);
  }
  
  private cdr = inject(ChangeDetectorRef);

  protected handleNodesChange(nodes: Node[]) {
    console.log('📊 GraphView handleNodesChange called with', nodes.length, 'nodes');
    nodes.forEach((node, index) => {
      console.log(`GraphView - Node ${node.id} position: (${node.position.x}, ${node.position.y})`);
    });
    this.onNodesChange.emit(nodes);
    console.log('📊 GraphView emitted onNodesChange');
    
    // 手動觸發變更檢測以確保事件正確傳播
    this.cdr.markForCheck();
    console.log('📊 GraphView triggered change detection');
  }
  
  protected handleEdgesChange(edges: AngularEdge[]) {
    this.onEdgesChange.emit(edges);
  }
  
  protected handleConnect(connection: { source: string; target: string; sourceHandle?: string; targetHandle?: string }) {
    this.onConnect.emit(connection);
  }
  
  protected handleConnectionStart(event: { nodeId: string; handleType: string; position: { x: number; y: number } }) {
    this.onConnectionStart.emit(event);
  }
  
  protected handleConnectionEnd(event: { nodeId: string | null; handleType: string | null }) {
    this.onConnectionEnd.emit(event);
  }
  
  protected handleSelectionChange(selection: { nodes: Node[]; edges: AngularEdge[] }) {
    // 可以在這裡處理選擇變更邏輯
  }
}