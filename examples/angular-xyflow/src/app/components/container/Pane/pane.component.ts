import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
  ElementRef,
  viewChild,
  HostListener,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '../../../types/node';
import { AngularEdge } from '../../types/edges';
import { ViewportComponent } from '../Viewport/viewport.component';

/**
 * Pane 組件
 * 對應 React Flow 的 Pane 組件
 * 負責選擇框功能和鼠標/指針事件
 */
@Component({
  selector: 'angular-pane',
  standalone: true,
  imports: [CommonModule, ViewportComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #pane
      class="xy-flow__pane"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;"
      [style.cursor]="getCursor()"
      (mousedown)="handleMouseDown($event)"
      (click)="handleClick($event)"
      (contextmenu)="handleContextMenu($event)"
    >
      <!-- 視口 -->
      <angular-viewport
        [nodes]="nodes()"
        [edges]="edges()"
        [viewport]="viewport()"
        [transform]="transform()"
        [multiSelectionKeyCode]="multiSelectionKeyCode()"
        (onNodesChange)="onNodesChange.emit($event)"
        (onAngularEdgesChange)="onAngularEdgesChange.emit($event)"
        (onNodeClick)="onNodeClick.emit($event)"
        (onNodeDragStart)="handleNodeDragStart($event)"
        (onNodeDrag)="handleNodeDrag($event)"
        (onNodeDragStop)="handleNodeDragStop($event)"
        (onAngularEdgeClick)="onAngularEdgeClick.emit($event)"
        (onConnect)="onConnect.emit($event)"
        (onConnectionStart)="onConnectionStart.emit($event)"
        (onConnectionEnd)="onConnectionEnd.emit($event)"
        (onNodePositionChange)="onNodePositionChange.emit($event)"
      />

      <!-- 選擇框 -->
      @if (selectionRect().isActive) {
        <div
          class="xy-flow__selection"
          [style.left.px]="selectionRect().x"
          [style.top.px]="selectionRect().y"
          [style.width.px]="selectionRect().width"
          [style.height.px]="selectionRect().height"
        ></div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .xy-flow__selection {
      position: absolute;
      background: rgba(0, 89, 220, 0.08);
      border: 1px dotted rgba(0, 89, 220, 0.8);
      pointer-events: none;
    }

    .xy-flow__pane.dragging {
      cursor: grabbing;
    }

    .xy-flow__pane.selection {
      cursor: crosshair;
    }
  `]
})
export class PaneComponent implements OnInit, OnDestroy {
  paneElement = viewChild.required<ElementRef<HTMLDivElement>>('pane');

  // === 輸入屬性 ===

  // 核心數據 - 使用signals以支持響應式更新
  /** 節點陣列 */
  public nodes = input.required<Node[]>();
  /** 邊緣陣列 */
  public edges = input.required<AngularEdge[]>();
  /** 視口狀態 */
  public viewport = input.required<{ x: number; y: number; zoom: number }>();
  /** 變換字串 */
  public transform = input.required<string>();
  /** 是否可拖拽選擇 */
  public selectionOnDrag = input<boolean>(false);
  /** 選擇模式 */
  public selectionMode = input<'partial' | 'full'>('full');
  /** 多選鍵代碼 */
  public multiSelectionKeyCode = input<string>('Meta');
  /** 是否可拖拽平移 */
  public panOnDrag = input<boolean>(true);
  /** 刪除鍵代碼 */
  public deleteKeyCode = input<string>('Backspace');

  // === 事件輸出 ===

  /** 視口變化事件 */
  public onViewportChange = output<{ x: number; y: number; zoom: number }>();
  /** 節點變化事件 */
  public onNodesChange = output<Node[]>();
  /** 邊緣變化事件 */
  public onAngularEdgesChange = output<AngularEdge[]>();
  /** 節點點擊事件 */
  public onNodeClick = output<{ event: MouseEvent; node: Node }>();
  /** 節點拖拽開始事件 */
  public onNodeDragStart = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  /** 節點拖拽進行中事件 */
  public onNodeDrag = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  /** 節點拖拽結束事件 */
  public onNodeDragStop = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  /** 邊緣點擊事件 */
  public onAngularEdgeClick = output<{ event: MouseEvent; edge: AngularEdge }>();
  /** 連接事件 */
  public onConnect = output<{ source: string; target: string; sourceHandle?: string; targetHandle?: string }>();
  /** 連接開始事件 */
  public onConnectionStart = output<{ nodeId: string; handleType: string; position: { x: number; y: number } }>();
  /** 連接結束事件 */
  public onConnectionEnd = output<{ nodeId: string | null; handleType: string | null }>();
  /** 選擇變化事件 */
  public onSelectionChange = output<{ nodes: Node[]; edges: AngularEdge[] }>();
  /** 面板點擊事件 */
  public onPaneClick = output<MouseEvent>();
  /** 面板右鍵菜單事件 */
  public onPaneContextMenu = output<MouseEvent>();
  /** 節點位置變化事件 */
  public onNodePositionChange = output<{ node: Node; position: { x: number; y: number } }>();

  // === 內部狀態 ===

  private isDraggingPane = signal(false);
  private isSelectingNodes = signal(false);
  private dragStartPos = { x: 0, y: 0 };
  private dragStartViewport = { x: 0, y: 0, zoom: 1 };

  // 選擇框狀態
  public selectionRect = signal({
    isActive: false,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    width: 0,
    height: 0
  });

  // 拖拽節點狀態
  private draggingNodes: Node[] = [];

  ngOnInit() {
    // 添加全局鼠標事件監聽
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  ngOnDestroy() {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  getCursor(): string {
    if (this.isDraggingPane()) return 'grabbing';
    if (this.isSelectingNodes()) return 'crosshair';
    if (this.panOnDrag()) return 'grab';
    return 'default';
  }

  handleMouseDown(event: MouseEvent) {
    // 如果點擊在節點或邊上，不處理
    const target = event.target as HTMLElement;
    if (target.closest('.xy-flow__node') ||
        target.closest('.xy-flow__edge') ||
        target.closest('.xy-flow__handle')) {
      return;
    }

    const rect = this.paneElement().nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.dragStartPos = { x: event.clientX, y: event.clientY };

    // 檢查是否開始選擇
    if (event.shiftKey || this.selectionOnDrag()) {
      this.startSelection(x, y);
    } else if (this.panOnDrag()) {
      // 開始平移
      this.startPanning();
    }
  }

  handleClick(event: MouseEvent) {
    // 如果點擊在節點或邊上，不處理
    const target = event.target as HTMLElement;
    if (target.closest('.xy-flow__node') ||
        target.closest('.xy-flow__edge') ||
        target.closest('.xy-flow__handle')) {
      return;
    }

    // 清除選擇
    if (!event.shiftKey && !event.metaKey && !event.ctrlKey) {
      this.clearSelection();
    }

    this.onPaneClick.emit(event);
  }

  handleContextMenu(event: MouseEvent) {
    event.preventDefault();
    this.onPaneContextMenu.emit(event);
  }

  private handleMouseMove = (event: MouseEvent) => {
    if (this.isSelectingNodes()) {
      this.updateSelection(event);
    } else if (this.isDraggingPane()) {
      this.updatePanning(event);
    }
  };

  private handleMouseUp = (event: MouseEvent) => {
    if (this.isSelectingNodes()) {
      this.endSelection();
    } else if (this.isDraggingPane()) {
      this.endPanning();
    }
  };

  // === 選擇功能 ===

  private startSelection(x: number, y: number) {
    this.isSelectingNodes.set(true);
    this.selectionRect.set({
      isActive: true,
      startX: x,
      startY: y,
      x: x,
      y: y,
      width: 0,
      height: 0
    });
  }

  private updateSelection(event: MouseEvent) {
    const rect = this.paneElement().nativeElement.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;
    const selection = this.selectionRect();

    const x = Math.min(selection.startX, currentX);
    const y = Math.min(selection.startY, currentY);
    const width = Math.abs(currentX - selection.startX);
    const height = Math.abs(currentY - selection.startY);

    this.selectionRect.set({
      ...selection,
      x,
      y,
      width,
      height
    });

    // 更新選中的節點
    this.updateSelectedNodes(x, y, width, height);
  }

  private endSelection() {
    this.isSelectingNodes.set(false);
    this.selectionRect.set({
      isActive: false,
      startX: 0,
      startY: 0,
      x: 0,
      y: 0,
      width: 0,
      height: 0
    });

    // 觸發選擇變更事件
    const nodes = this.nodes();
    const edges = this.edges();
    const selectedNodes = nodes.filter(n => n.selected);
    const selectedAngularEdges = edges.filter(e => e.selected);

    this.onSelectionChange.emit({ nodes: selectedNodes, edges: selectedAngularEdges });
  }

  private updateSelectedNodes(x: number, y: number, width: number, height: number) {
    const nodes = this.nodes();
    const viewport = this.viewport();
    const selectionMode = this.selectionMode();

    const updatedNodes = nodes.map((node: Node) => {
      const nodeX = node.position.x * viewport.zoom + viewport.x;
      const nodeY = node.position.y * viewport.zoom + viewport.y;
      const nodeWidth = (node.width || 150) * viewport.zoom;
      const nodeHeight = (node.height || 36) * viewport.zoom;

      let isInSelection = false;

      if (selectionMode === 'full') {
        // 節點必須完全在選擇框內
        isInSelection =
          nodeX >= x &&
          nodeY >= y &&
          nodeX + nodeWidth <= x + width &&
          nodeY + nodeHeight <= y + height;
      } else {
        // 節點部分在選擇框內即可
        isInSelection = !(
          nodeX > x + width ||
          nodeX + nodeWidth < x ||
          nodeY > y + height ||
          nodeY + nodeHeight < y
        );
      }

      return { ...node, selected: isInSelection };
    });

    this.onNodesChange.emit(updatedNodes);
  }

  // === 平移功能 ===

  private startPanning() {
    this.isDraggingPane.set(true);
    this.dragStartViewport = { ...this.viewport() };
  }

  private updatePanning(event: MouseEvent) {
    const deltaX = event.clientX - this.dragStartPos.x;
    const deltaY = event.clientY - this.dragStartPos.y;

    const newViewport = {
      x: this.dragStartViewport.x + deltaX,
      y: this.dragStartViewport.y + deltaY,
      zoom: this.dragStartViewport.zoom
    };

    this.onViewportChange.emit(newViewport);
  }

  private endPanning() {
    this.isDraggingPane.set(false);
  }

  // === 節點拖拽處理 ===

  protected handleNodeDragStart(event: { event: MouseEvent; node: Node; nodes: Node[] }) {
    this.draggingNodes = event.nodes;
    this.onNodeDragStart.emit(event);
  }

  protected handleNodeDrag(event: { event: MouseEvent; node: Node; nodes: Node[] }) {
    this.onNodeDrag.emit(event);
  }

  protected handleNodeDragStop(event: { event: MouseEvent; node: Node; nodes: Node[] }) {
    this.draggingNodes = [];
    this.onNodeDragStop.emit(event);
  }

  // === 輔助方法 ===

  private clearSelection() {
    const nodes = this.nodes();
    const edges = this.edges();

    const updatedNodes = nodes.map((n: Node) => ({ ...n, selected: false }));
    const updatedAngularEdges = edges.map((e: AngularEdge) => ({ ...e, selected: false }));

    this.onNodesChange.emit(updatedNodes);
    this.onAngularEdgesChange.emit(updatedAngularEdges);

    this.onSelectionChange.emit({ nodes: [], edges: [] });
  }
}
