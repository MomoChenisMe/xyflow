import { 
  Component, 
  input, 
  output,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  signal,
  computed,
  effect,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '../../../types/node';
import { AngularEdge } from '../../types/edges';
import { GraphViewComponent } from '../GraphView/graph-view.component';
import { StoreUpdaterComponent } from '../../components/StoreUpdater/store-updater.component';
import { FlowStoreService } from '../../contexts/flow-store.service';

/**
 * Wrapper 組件
 * 對應 ReactFlow 的 Wrapper 組件
 * 負責容器邏輯、狀態初始化和子組件協調
 */
@Component({
  selector: 'angular-flow-wrapper',
  standalone: true,
  imports: [CommonModule, GraphViewComponent, StoreUpdaterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      #wrapperContainer
      class="react-flow__wrapper"
      style="position: relative; width: 100%; height: 100%;"
    >
      <!-- GraphView 組件 - 負責渲染和交互 -->
      <angular-flow-graph-view
        [internalNodes]="internalNodes()"
        [internalEdges]="internalEdges()"
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
        (onNodeClick)="onNodeClick.emit($event)"
        (onEdgeClick)="onEdgeClick.emit($event)"
        (onNodeMouseEnter)="onNodeMouseEnter.emit($event)"
        (onNodeMouseMove)="onNodeMouseMove.emit($event)"
        (onNodeMouseLeave)="onNodeMouseLeave.emit($event)"
        (onNodeContextMenu)="onNodeContextMenu.emit($event)"
        (onNodeDoubleClick)="onNodeDoubleClick.emit($event)"
        (onSelectionContextMenu)="onSelectionContextMenu.emit($event)"
        (onSelectionStart)="onSelectionStart.emit($event)"
        (onSelectionEnd)="onSelectionEnd.emit($event)"
        (onReconnect)="onReconnect.emit($event)"
        (onReconnectStart)="onReconnectStart.emit($event)"
        (onReconnectEnd)="onReconnectEnd.emit($event)"
        (onEdgeContextMenu)="onEdgeContextMenu.emit($event)"
        (onEdgeDoubleClick)="onEdgeDoubleClick.emit($event)"
        (onEdgeMouseEnter)="onEdgeMouseEnter.emit($event)"
        (onEdgeMouseMove)="onEdgeMouseMove.emit($event)"
        (onEdgeMouseLeave)="onEdgeMouseLeave.emit($event)"
        (onPaneClick)="onPaneClick.emit($event)"
        (onPaneMouseEnter)="onPaneMouseEnter.emit($event)"
        (onPaneMouseMove)="onPaneMouseMove.emit($event)"
        (onPaneMouseLeave)="onPaneMouseLeave.emit($event)"
        (onPaneScroll)="onPaneScroll.emit($event)"
        (onPaneContextMenu)="onPaneContextMenu.emit($event)"
        (onViewportChange)="handleViewportChange($event)"
        (onNodesChange)="handleNodesChange($event)"
        (onNodePositionChange)="handleNodePositionChange($event)"
        (onConnect)="onConnect.emit($event)"
        (onConnectionStart)="onConnectStart.emit($event)"
        (onConnectionEnd)="onConnectEnd.emit($event)"
      />
      
      <!-- StoreUpdater 組件 - 負責狀態管理和更新 -->
      <angular-flow-store-updater
        [nodes]="nodes()"
        [edges]="edges()"
        [defaultNodes]="defaultNodes()"
        [defaultEdges]="defaultEdges()"
        [nodesDraggable]="nodesDraggable()"
        [nodesConnectable]="nodesConnectable()"
        [nodesFocusable]="nodesFocusable()"
        [edgesFocusable]="edgesFocusable()"
        [edgesReconnectable]="edgesReconnectable()"
        [elementsSelectable]="elementsSelectable()"
        [elevateNodesOnSelect]="elevateNodesOnSelect()"
        [elevateAngularEdgesOnSelect]="elevateEdgesOnSelect()"
        [snapToGrid]="snapToGrid()"
        [snapGrid]="snapGrid()"
        [connectionMode]="connectionMode()"
        [connectOnClick]="connectOnClick()"
        [defaultAngularEdgeOptions]="defaultEdgeOptions()"
        [selectNodesOnDrag]="selectNodesOnDrag()"
        [nodeDragThreshold]="nodeDragThreshold()"
        [connectionDragThreshold]="connectionDragThreshold()"
        [fitView]="fitView()"
        [fitViewOptions]="fitViewOptions()"
        [nodeOrigin]="nodeOrigin()"
        [rfId]="rfId()"
        [paneClickDistance]="paneClickDistance()"
        [internalNodes]="internalNodes"
        [internalAngularEdges]="internalEdges"
        [viewport]="viewport"
        (onConnect)="onConnect.emit($event)"
        (onConnectStart)="onConnectStart.emit($event)"
        (onConnectEnd)="onConnectEnd.emit($event)"
        (onClickConnectStart)="onClickConnectStart.emit($event)"
        (onClickConnectEnd)="onClickConnectEnd.emit($event)"
        (onNodeDragStart)="onNodeDragStart.emit($event)"
        (onNodeDrag)="onNodeDrag.emit($event)"
        (onNodeDragStop)="onNodeDragStop.emit($event)"
        (onSelectionDrag)="onSelectionDrag.emit($event)"
        (onSelectionDragStart)="onSelectionDragStart.emit($event)"
        (onSelectionDragStop)="onSelectionDragStop.emit($event)"
        (onMove)="onMove.emit($event)"
        (onMoveStart)="onMoveStart.emit($event)"
        (onMoveEnd)="onMoveEnd.emit($event)"
        (onNodesDelete)="onNodesDelete.emit($event)"
        (onEdgesDelete)="onEdgesDelete.emit($event)"
        (onDelete)="onDelete.emit($event)"
        (onBeforeDelete)="onBeforeDelete.emit($event)"
        (onNodesChange)="handleNodesChange($event)"
        (onEdgesChange)="onEdgesChange.emit($event)"
        (onSelectionChange)="onSelectionChange.emit($event)"
        (onError)="onError.emit($event)"
        (onInit)="handleInit($event)"
      />

      <!-- 內容投影 - 對應 React 的 children -->
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    
    .react-flow__wrapper {
      position: relative;
      width: 100%;
      height: 100%;
    }
  `]
})
export class WrapperComponent implements AfterViewInit, OnDestroy {
  @ViewChild('wrapperContainer') wrapperContainer!: ElementRef<HTMLDivElement>;

  // === 輸入屬性 ===
  
  // 節點和邊
  public nodes = input<Node[]>();
  public edges = input<AngularEdge[]>();
  public defaultNodes = input<Node[]>([]);
  public defaultEdges = input<AngularEdge[]>([]);
  
  // 尺寸
  public width = input<number>();
  public height = input<number>();
  
  // 視口控制
  public fitView = input<boolean>(false);
  public fitViewOptions = input<any>();
  public minZoom = input<number>(0.5);
  public maxZoom = input<number>(2);
  public nodeOrigin = input<[number, number]>([0, 0]);
  public nodeExtent = input<any>();
  
  // 組件類型和樣式
  public className = input<string>('');
  public nodeTypes = input<any>();
  public edgeTypes = input<any>();
  
  // 連接相關
  public connectionLineType = input<string>('default');
  public connectionLineStyle = input<any>();
  public connectionMode = input<string>();
  public connectOnClick = input<boolean>(true);
  public defaultEdgeOptions = input<any>();
  public connectionDragThreshold = input<number>(1);
  public reconnectRadius = input<number>(10);
  
  // 選擇相關
  public selectionKeyCode = input<string>('Shift');
  public selectionOnDrag = input<boolean>(false);
  public selectionMode = input<'partial' | 'full'>('full');
  public multiSelectionKeyCode = input<string>('Meta');
  public elementsSelectable = input<boolean>(true);
  public selectNodesOnDrag = input<boolean>(true);
  
  // 平移和縮放
  public panActivationKeyCode = input<string>('Space');
  public zoomActivationKeyCode = input<string>('Meta');
  public translateExtent = input<any>();
  public preventScrolling = input<boolean>(true);
  public zoomOnScroll = input<boolean>(true);
  public zoomOnPinch = input<boolean>(true);
  public zoomOnDoubleClick = input<boolean>(true);
  public panOnScroll = input<boolean>(false);
  public panOnScrollSpeed = input<number>(0.5);
  public panOnScrollMode = input<string>('free');
  public panOnDrag = input<boolean>(true);
  
  // 鍵盤
  public deleteKeyCode = input<string>('Backspace');
  public disableKeyboardA11y = input<boolean>(false);
  
  // 渲染
  public onlyRenderVisibleElements = input<boolean>(false);
  
  // 節點行為
  public nodesDraggable = input<boolean>(true);
  public nodesConnectable = input<boolean>(true);
  public nodesFocusable = input<boolean>(true);
  public nodeDragThreshold = input<number>(1);
  
  // 邊行為
  public edgesFocusable = input<boolean>(true);
  public edgesReconnectable = input<boolean>(true);
  public elevateEdgesOnSelect = input<boolean>(false);
  public elevateNodesOnSelect = input<boolean>(true);
  
  // 網格對齊
  public snapToGrid = input<boolean>(false);
  public snapGrid = input<[number, number]>([15, 15]);
  
  // 樣式類名
  public noDragClassName = input<string>('nodrag');
  public noWheelClassName = input<string>('nowheel');
  public noPanClassName = input<string>('nopan');
  
  // 其他
  public paneClickDistance = input<number>(0);
  public nodeClickDistance = input<number>(0);
  public defaultMarkerColor = input<string>('#b1b1b7');
  public rfId = input<string>('1');
  public debug = input<boolean>(false);
  public ariaLabelConfig = input<any>();
  public inputViewport = input<any>();
  
  // === 事件輸出 ===
  
  // 初始化
  public onInit = output<any>();
  
  // 節點事件
  public onNodeClick = output<any>();
  public onNodeMouseEnter = output<any>();
  public onNodeMouseMove = output<any>();
  public onNodeMouseLeave = output<any>();
  public onNodeContextMenu = output<any>();
  public onNodeDoubleClick = output<any>();
  public onNodeDragStart = output<any>();
  public onNodeDrag = output<any>();
  public onNodeDragStop = output<any>();
  
  // 邊事件
  public onEdgeClick = output<any>();
  public onEdgeContextMenu = output<any>();
  public onEdgeDoubleClick = output<any>();
  public onEdgeMouseEnter = output<any>();
  public onEdgeMouseMove = output<any>();
  public onEdgeMouseLeave = output<any>();
  
  // 選擇事件
  public onSelectionChange = output<any>();
  public onSelectionDragStart = output<any>();
  public onSelectionDrag = output<any>();
  public onSelectionDragStop = output<any>();
  public onSelectionContextMenu = output<any>();
  public onSelectionStart = output<any>();
  public onSelectionEnd = output<any>();
  
  // 連接事件
  public onConnect = output<any>();
  public onConnectStart = output<any>();
  public onConnectEnd = output<any>();
  public onClickConnectStart = output<any>();
  public onClickConnectEnd = output<any>();
  public onReconnect = output<any>();
  public onReconnectStart = output<any>();
  public onReconnectEnd = output<any>();
  
  // 刪除事件
  public onNodesDelete = output<any>();
  public onEdgesDelete = output<any>();
  public onDelete = output<any>();
  public onBeforeDelete = output<any>();
  
  // 視口事件
  public onMove = output<any>();
  public onMoveStart = output<any>();
  public onMoveEnd = output<any>();
  public onViewportChange = output<any>();
  
  // 畫面事件
  public onPaneClick = output<any>();
  public onPaneMouseEnter = output<any>();
  public onPaneMouseMove = output<any>();
  public onPaneMouseLeave = output<any>();
  public onPaneScroll = output<any>();
  public onPaneContextMenu = output<any>();
  
  // 變更事件
  public onNodesChange = output<any>();
  public onEdgesChange = output<any>();
  public onNodePositionChange = output<{ node: Node; position: { x: number; y: number } }>();
  
  // 其他事件
  public onError = output<any>();
  public onScroll = output<any>();

  // === 內部狀態管理 ===
  
  // 內部節點和邊狀態 - 將被傳遞給子組件
  public internalNodes = signal<Node[]>([]);
  public internalEdges = signal<AngularEdge[]>([]);
  public viewport = signal({ x: 0, y: 0, zoom: 1 });
  
  // 容器尺寸
  public containerWidth = computed(() => {
    const container = this.wrapperContainer?.nativeElement;
    return this.width() || (container ? container.offsetWidth : 800);
  });
  
  public containerHeight = computed(() => {
    const container = this.wrapperContainer?.nativeElement;
    return this.height() || (container ? container.offsetHeight : 600);
  });

  // 注入FlowStoreService來監聽store狀態變化
  private store = inject(FlowStoreService, { optional: true });

  constructor() {
    // 監聽節點變化
    effect(() => {
      const inputNodes = this.nodes();
      const defaultNodes = this.defaultNodes();
      
      if (inputNodes) {
        this.internalNodes.set(inputNodes);
      } else if (defaultNodes.length > 0) {
        this.internalNodes.set(defaultNodes);
      }
    });
    
    // 監聽邊變化 - 包括input屬性和store狀態
    effect(() => {
      const inputEdges = this.edges();
      const defaultEdges = this.defaultEdges();
      
      // 優先使用input edges
      if (inputEdges) {
        console.log('📦 WrapperComponent: Setting edges from input:', inputEdges.length);
        this.internalEdges.set(inputEdges);
      } else if (defaultEdges.length > 0) {
        console.log('📦 WrapperComponent: Setting edges from defaultEdges:', defaultEdges.length);
        this.internalEdges.set(defaultEdges);
      }
    });

    // 監聽FlowStoreService中的edge狀態變化
    effect(() => {
      if (this.store) {
        const storeEdges = this.store.getEdges();
        console.log('📦 WrapperComponent: Store edges changed:', storeEdges.length, storeEdges);
        
        // 如果沒有input edges但store中有edges，使用store的edges
        const inputEdges = this.edges();
        const defaultEdges = this.defaultEdges();
        
        if (!inputEdges && (!defaultEdges || defaultEdges.length === 0) && storeEdges.length > 0) {
          console.log('📦 WrapperComponent: Using store edges as fallback:', storeEdges.length);
          this.internalEdges.set(storeEdges as any);
        } else if (storeEdges.length > (defaultEdges?.length || 0)) {
          console.log('📦 WrapperComponent: Store has more edges, updating internalEdges');
          this.internalEdges.set(storeEdges as any);
        }
      }
    });
    
    // 監聽視口變化
    effect(() => {
      const inputViewport = this.inputViewport();
      if (inputViewport) {
        this.viewport.set(inputViewport);
      }
    });
  }

  ngAfterViewInit() {  
    // 🔥 CRITICAL: 設置domNode - XYHandle需要這個來進行連線拖拉
    if (this.wrapperContainer && this.store) {
      console.log('🔥 Setting domNode for XYHandle functionality');
      this.store.updateState({
        domNode: this.wrapperContainer.nativeElement
      } as any);
      console.log('✅ domNode set successfully:', this.wrapperContainer.nativeElement);
    }
    
    // 如果設置了 fitView，初始化時適應視圖
    if (this.fitView()) {
      setTimeout(() => this.handleFitView(), 100);
    }
    
    // 發送初始化事件
    this.handleInit({
      getNodes: () => this.internalNodes(),
      getEdges: () => this.internalEdges(),
      getViewport: () => this.viewport(),
      setNodes: (nodes: Node[]) => this.internalNodes.set(nodes),
      setEdges: (edges: AngularEdge[]) => this.internalEdges.set(edges),
      setViewport: (viewport: any) => this.viewport.set(viewport),
      fitView: () => this.handleFitView(),
      project: (position: { x: number; y: number }) => this.project(position),
      flowToScreenPosition: (position: { x: number; y: number }) => this.flowToScreenPosition(position)
    });
  }

  ngOnDestroy() {
    // 清理邏輯
  }

  // === 事件處理方法 ===
  
  protected handleInit(reactFlowInstance: any) {
    this.onInit.emit(reactFlowInstance);
  }
  
  protected handleViewportChange(newViewport: any) {
    this.viewport.set(newViewport);
    this.onViewportChange.emit(newViewport);
  }
  
  // 適應視圖方法
  private handleFitView() {
    const nodes = this.internalNodes();
    if (nodes.length === 0) return;
    
    // 計算所有節點的邊界
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      const nodeWidth = 150; // 預設節點寬度
      const nodeHeight = 36;  // 預設節點高度
      
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });
    
    // 獲取容器尺寸
    const containerWidth = this.containerWidth();
    const containerHeight = this.containerHeight();
    
    // 計算適應視圖的參數
    const padding = 0.1; // 10% padding
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    const paddingX = contentWidth * padding;
    const paddingY = contentHeight * padding;
    
    const boundingBox = {
      x: minX - paddingX,
      y: minY - paddingY,
      width: contentWidth + paddingX * 2,
      height: contentHeight + paddingY * 2
    };
    
    // 計算縮放比例
    const scaleX = containerWidth / boundingBox.width;
    const scaleY = containerHeight / boundingBox.height;
    const zoom = Math.min(scaleX, scaleY);
    
    // 限制縮放範圍
    const finalZoom = Math.max(this.minZoom(), Math.min(zoom, this.maxZoom()));
    
    // 計算居中位置
    const x = containerWidth / 2 - ((boundingBox.x + boundingBox.width / 2) * finalZoom);
    const y = containerHeight / 2 - ((boundingBox.y + boundingBox.height / 2) * finalZoom);
    
    // 更新視口
    this.viewport.set({ x, y, zoom: finalZoom });
    this.onViewportChange.emit({ x, y, zoom: finalZoom });
  }
  
  // 座標轉換方法
  private project(position: { x: number; y: number }) {
    const vp = this.viewport();
    return {
      x: (position.x - vp.x) / vp.zoom,
      y: (position.y - vp.y) / vp.zoom
    };
  }
  
  private flowToScreenPosition(position: { x: number; y: number }) {
    const vp = this.viewport();
    return {
      x: position.x * vp.zoom + vp.x,
      y: position.y * vp.zoom + vp.y
    };
  }
  
  protected handleNodesChange(nodes: Node[]) {
    console.log('📦 WrapperComponent handleNodesChange called with', nodes.length, 'nodes');
    nodes.forEach((node, index) => {
      console.log(`WrapperComponent - Node ${node.id} position: (${node.position.x}, ${node.position.y})`);
    });
    this.onNodesChange.emit(nodes);
    console.log('📦 WrapperComponent emitted onNodesChange');
  }

  protected handleNodePositionChange(event: { node: Node; position: { x: number; y: number } }) {
    console.log('📦 WrapperComponent handleNodePositionChange called:', {
      nodeId: event.node.id,
      oldPosition: event.node.position,
      newPosition: event.position
    });
    
    // Update the internal nodes with the new position
    this.internalNodes.update(nodes =>
      nodes.map(n => 
        n.id === event.node.id 
          ? { ...n, position: event.position }
          : n
      )
    );
    
    console.log('📦 WrapperComponent emitting onNodePositionChange');
    this.onNodePositionChange.emit(event);
  }
}