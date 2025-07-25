import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
  ElementRef,
  HostListener,
  WritableSignal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '../../../types/node';
import { AngularEdge } from '../../types/edges';
import { ZoomPaneComponent } from '../ZoomPane/zoom-pane.component';

/**
 * FlowRenderer 組件
 * 對應 React Flow 的 FlowRenderer 組件
 * 負責鍵盤交互和包裝縮放/平移功能
 */
@Component({
  selector: 'angular-flow-renderer',
  standalone: true,
  imports: [CommonModule, ZoomPaneComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="xy-flow__renderer"
      style="width: 100%; height: 100%; position: relative; z-index: 4;"
      tabindex="0"
      [attr.data-testid]="'rf__renderer'"
    >
      <angular-zoom-pane
        [nodes]="nodes()"
        [edges]="edges()"
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
        (onViewportChange)="onViewportChange.emit($event)"
        (onNodesChange)="onNodesChange.emit($event)"
        (onEdgesChange)="onEdgesChange.emit($event)"
        (onNodeClick)="onNodeClick.emit($event)"
        (onNodeDragStart)="onNodeDragStart.emit($event)"
        (onNodeDrag)="onNodeDrag.emit($event)"
        (onNodeDragStop)="onNodeDragStop.emit($event)"
        (onEdgeClick)="onEdgeClick.emit($event)"
        (onConnect)="onConnect.emit($event)"
        (onConnectionStart)="onConnectionStart.emit($event)"
        (onConnectionEnd)="onConnectionEnd.emit($event)"
        (onSelectionChange)="onSelectionChange.emit($event)"
        (onPaneClick)="onPaneClick.emit($event)"
        (onPaneContextMenu)="onPaneContextMenu.emit($event)"
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
  `]
})
export class FlowRendererComponent {
  // === 輸入屬性 ===

  // 核心數據
  public nodes = input.required<Node[]>();
  public edges = input.required<AngularEdge[]>();
  public viewport = input.required<{ x: number; y: number; zoom: number }>();

  // 縮放和平移
  public minZoom = input<number>(0.5);
  public maxZoom = input<number>(2);
  public panOnDrag = input<boolean>(true);
  public panOnScroll = input<boolean>(false);
  public zoomOnScroll = input<boolean>(true);
  public zoomOnPinch = input<boolean>(true);
  public zoomOnDoubleClick = input<boolean>(true);
  public preventScrolling = input<boolean>(true);

  // 選擇
  public selectionOnDrag = input<boolean>(false);
  public selectionMode = input<'partial' | 'full'>('full');
  public multiSelectionKeyCode = input<string>('Meta');
  public deleteKeyCode = input<string>('Backspace');
  public panActivationKeyCode = input<string>('Space');

  // === 事件輸出 ===

  public onViewportChange = output<{ x: number; y: number; zoom: number }>();
  public onNodesChange = output<Node[]>();
  public onEdgesChange = output<AngularEdge[]>();
  public onNodeClick = output<{ event: MouseEvent; node: Node }>();
  public onNodeDragStart = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  public onNodeDrag = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  public onNodeDragStop = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  public onEdgeClick = output<{ event: MouseEvent; edge: AngularEdge }>();
  public onConnect = output<{ source: string; target: string; sourceHandle?: string; targetHandle?: string }>();
  public onConnectionStart = output<{ nodeId: string; handleType: string; position: { x: number; y: number } }>();
  public onConnectionEnd = output<{ nodeId: string | null; handleType: string | null }>();
  public onSelectionChange = output<{ nodes: Node[]; edges: AngularEdge[] }>();
  public onPaneClick = output<MouseEvent>();
  public onPaneContextMenu = output<MouseEvent>();
  public onNodePositionChange = output<{ node: Node; position: { x: number; y: number } }>();

  // === 鍵盤事件處理 ===

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // 刪除鍵處理
    if (event.key === this.deleteKeyCode() || event.key === 'Delete') {
      event.preventDefault();
      this.deleteSelectedElements();
    }

    // 全選 (Cmd/Ctrl + A)
    if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
      event.preventDefault();
      this.selectAllElements();
    }
  }

  private deleteSelectedElements() {
    const nodes = this.nodes();
    const edges = this.edges();

    const selectedNodeIds = nodes.filter(n => n.selected).map(n => n.id);
    const remainingNodes = nodes.filter(n => !n.selected);
    const remainingEdges = edges.filter(e =>
      !e.selected &&
      !selectedNodeIds.includes(e.source) &&
      !selectedNodeIds.includes(e.target)
    );

    this.onNodesChange.emit(remainingNodes);
    this.onEdgesChange.emit(remainingEdges);
  }

  private selectAllElements() {
    const nodes = this.nodes();
    const edges = this.edges();

    const selectedNodes = nodes.map(n => ({ ...n, selected: true }));
    const selectedEdges = edges.map(e => ({ ...e, selected: true }));

    this.onSelectionChange.emit({ nodes: selectedNodes, edges: selectedEdges });
  }
}
