import { 
  Component, 
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
  ElementRef,
  viewChild,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '../../../types/node';
import { AngularEdge } from '../../types/edges';
import { PaneComponent } from '../Pane/pane.component';

/**
 * ZoomPane 組件
 * 對應 React Flow 的 ZoomPane 組件
 * 負責縮放和平移功能
 */
@Component({
  selector: 'angular-zoom-pane',
  standalone: true,
  imports: [CommonModule, PaneComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      #zoomPane
      class="xy-flow__zoompane"
      style="width: 100%; height: 100%; position: relative;"
    >
      <angular-pane
        [nodes]="nodes()"
        [edges]="edges()"
        [viewport]="viewport()"
        [transform]="transform()"
        [selectionOnDrag]="selectionOnDrag()"
        [selectionMode]="selectionMode()"
        [multiSelectionKeyCode]="multiSelectionKeyCode()"
        [deleteKeyCode]="deleteKeyCode()"
        [panOnDrag]="isPanEnabled()"
        (onViewportChange)="onViewportChange.emit($event)"
        (onNodesChange)="onNodesChange.emit($event)"
        (onAngularEdgesChange)="onEdgesChange.emit($event)"
        (onNodeClick)="onNodeClick.emit($event)"
        (onNodeDragStart)="onNodeDragStart.emit($event)"
        (onNodeDrag)="onNodeDrag.emit($event)"
        (onNodeDragStop)="onNodeDragStop.emit($event)"
        (onAngularEdgeClick)="onEdgeClick.emit($event)"
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
export class ZoomPaneComponent implements AfterViewInit, OnDestroy {
  zoomPaneElement = viewChild.required<ElementRef<HTMLDivElement>>('zoomPane');
  
  // === 輸入屬性 ===
  
  // 核心數據 - 使用signals以支持響應式更新
  /** 節點陣列 */
  public nodes = input.required<Node[]>();
  /** 邊緣陣列 */
  public edges = input.required<AngularEdge[]>();
  /** 視口狀態 */
  public viewport = input.required<{ x: number; y: number; zoom: number }>();
  
  // 縮放和平移設定
  /** 最小縮放比例 */
  public minZoom = input<number>(0.5);
  /** 最大縮放比例 */
  public maxZoom = input<number>(2);
  /** 是否可拖拽平移 */
  public panOnDrag = input<boolean>(true);
  /** 是否可滾輪平移 */
  public panOnScroll = input<boolean>(false);
  /** 是否可滾輪縮放 */
  public zoomOnScroll = input<boolean>(true);
  /** 是否可手勢縮放 */
  public zoomOnPinch = input<boolean>(true);
  /** 是否可雙擊縮放 */
  public zoomOnDoubleClick = input<boolean>(true);
  /** 是否阻止滾動 */
  public preventScrolling = input<boolean>(true);
  /** 平移激活鍵代碼 */
  public panActivationKeyCode = input<string>('Space');
  
  // 選擇設定
  /** 是否可拖拽選擇 */
  public selectionOnDrag = input<boolean>(false);
  /** 選擇模式 */
  public selectionMode = input<'partial' | 'full'>('full');
  /** 多選鍵代碼 */
  public multiSelectionKeyCode = input<string>('Meta');
  /** 刪除鍵代碼 */
  public deleteKeyCode = input<string>('Backspace');
  
  // === 事件輸出 ===
  
  /** 視口變化事件 */
  public onViewportChange = output<{ x: number; y: number; zoom: number }>();
  /** 節點變化事件 */
  public onNodesChange = output<Node[]>();
  /** 邊緣變化事件 */
  public onEdgesChange = output<AngularEdge[]>();
  /** 節點點擊事件 */
  public onNodeClick = output<{ event: MouseEvent; node: Node }>();
  /** 節點拖拽開始事件 */
  public onNodeDragStart = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  /** 節點拖拽進行中事件 */
  public onNodeDrag = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  /** 節點拖拽結束事件 */
  public onNodeDragStop = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  /** 邊緣點擊事件 */
  public onEdgeClick = output<{ event: MouseEvent; edge: AngularEdge }>();
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
  
  private isPanning = signal(false);
  private isSpacePressed = signal(false);
  
  // 計算變換字符串
  public transform = computed(() => {
    const vp = this.viewport();
    return `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`;
  });
  
  ngAfterViewInit() {
    // 添加滾輪事件監聽
    this.zoomPaneElement().nativeElement.addEventListener('wheel', this.handleWheel, { passive: false });
    
    // 添加雙擊事件監聽
    if (this.zoomOnDoubleClick()) {
      this.zoomPaneElement().nativeElement.addEventListener('dblclick', this.handleDoubleClick);
    }
    
    // 添加鍵盤事件監聽
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }
  
  ngOnDestroy() {
    this.zoomPaneElement().nativeElement.removeEventListener('wheel', this.handleWheel);
    this.zoomPaneElement().nativeElement.removeEventListener('dblclick', this.handleDoubleClick);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }
  
  public isPanEnabled(): boolean {
    return this.panOnDrag() || (this.panOnDrag() && this.isSpacePressed());
  }
  
  private handleWheel = (event: WheelEvent) => {
    if (!this.zoomOnScroll() && !this.panOnScroll()) return;
    
    event.preventDefault();
    
    const currentViewport = this.viewport();
    
    if (this.zoomOnScroll() && !event.ctrlKey) {
      // 縮放處理
      const delta = event.deltaY;
      const scaleFactor = delta > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(
        this.minZoom(),
        Math.min(this.maxZoom(), currentViewport.zoom * scaleFactor)
      );
      
      // 以鼠標位置為中心縮放
      const rect = this.zoomPaneElement().nativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const scaleChange = newZoom / currentViewport.zoom;
      const newX = x - (x - currentViewport.x) * scaleChange;
      const newY = y - (y - currentViewport.y) * scaleChange;
      
      const newViewport = { x: newX, y: newY, zoom: newZoom };
      this.onViewportChange.emit(newViewport);
    } else if (this.panOnScroll()) {
      // 平移處理
      const deltaX = event.deltaX;
      const deltaY = event.deltaY;
      
      const newViewport = {
        x: currentViewport.x - deltaX,
        y: currentViewport.y - deltaY,
        zoom: currentViewport.zoom
      };
      this.onViewportChange.emit(newViewport);
    }
  };
  
  private handleDoubleClick = (event: MouseEvent) => {
    if (!this.zoomOnDoubleClick()) return;
    
    const currentViewport = this.viewport();
    const newZoom = currentViewport.zoom >= 1.5 ? 1 : 2;
    
    // 以點擊位置為中心縮放
    const rect = this.zoomPaneElement().nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const scaleChange = newZoom / currentViewport.zoom;
    const newX = x - (x - currentViewport.x) * scaleChange;
    const newY = y - (y - currentViewport.y) * scaleChange;
    
    const newViewport = { x: newX, y: newY, zoom: newZoom };
    this.onViewportChange.emit(newViewport);
  };
  
  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === this.panActivationKeyCode()) {
      this.isSpacePressed.set(true);
    }
  };
  
  private handleKeyUp = (event: KeyboardEvent) => {
    if (event.code === this.panActivationKeyCode()) {
      this.isSpacePressed.set(false);
    }
  };
  
  protected handleViewportChange(newViewport: { x: number; y: number; zoom: number }) {
    this.onViewportChange.emit(newViewport);
  }
}