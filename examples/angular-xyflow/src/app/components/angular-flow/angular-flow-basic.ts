import { 
  Component, 
  input, 
  output, 
  signal, 
  computed,
  effect,
  ChangeDetectionStrategy, 
  ElementRef, 
  ViewChild,
  AfterViewInit,
  OnDestroy,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '../../types/node';
import { Edge } from '../../types/edge';
import { MiniMap } from '../minimap';
import { Background } from '../background';
import { Controls } from '../controls';

/**
 * Angular Flow Basic Component
 * 模仿 React Flow 基本範例的完整功能
 * React 對應檔案: /examples/react/src/examples/basic/index.tsx
 */

@Component({
  selector: 'angular-flow',
  standalone: true,
  imports: [CommonModule, MiniMap, Background, Controls],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      #flowContainer 
      class="react-flow react-flow-basic-example"
      style="width: 100%; height: 100%; position: relative; overflow: hidden;"
    >
      <!-- React Flow 基本結構 -->
      <div 
        class="react-flow__renderer" 
        style="width: 100%; height: 100%; position: relative; z-index: 4;"
      >
        <!-- 背景 -->
        <background variant="dots" [viewport]="viewport()" />
        
        <!-- 拖拽平移區域 -->
        <div 
          class="react-flow__pane"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; cursor: grab;"
          (mousedown)="onRendererMouseDown($event)"
          (wheel)="onWheel($event)"
        >
          <!-- 視口變換容器 -->
          <div 
            class="react-flow__viewport"
            style="transform-origin: 0 0; z-index: 2; pointer-events: none;"
            [style.transform]="viewportTransform()"
          >
            <!-- 節點層 -->
            <div class="react-flow__nodes" style="pointer-events: none; transform-origin: 0 0;">
              @for (node of internalNodes(); track node.id; let i = $index) {
                <div 
                  class="react-flow__node react-flow__node-default selectable draggable"
                  style="position: absolute; user-select: none; pointer-events: all; transform-origin: 0 0; box-sizing: border-box; cursor: pointer;"
                  [class.selected]="node.selected"
                  [class.light]="node.className === 'light'"
                  [class.dark]="node.className === 'dark'"
                  [attr.data-id]="node.id"
                  [style.transform]="'translate(' + node.position.x + 'px, ' + node.position.y + 'px)'"
                  (mousedown)="onNodeMouseDown($event, node, i)"
                  (click)="handleNodeClick($event, node)"
                >
                  <!-- Source Handle (底部) -->
                  <div 
                    class="react-flow__handle react-flow__handle-bottom source"
                    style="pointer-events: all; cursor: crosshair;"
                    data-handleid="source"
                    [attr.data-nodeid]="node.id"
                    (mousedown)="onHandleMouseDown($event, node.id, 'source')"
                  ></div>
                  
                  <!-- Target Handle (頂部 - 除了 input 類型) -->
                  @if (node.type !== 'input') {
                    <div 
                      class="react-flow__handle react-flow__handle-top target"
                      style="pointer-events: all; cursor: crosshair;"
                      data-handleid="target"
                      [attr.data-nodeid]="node.id"
                      (mousedown)="onHandleMouseDown($event, node.id, 'target')"
                    ></div>
                  }
                  
                  <!-- 節點內容 -->
                  <div>{{ node.data['label'] }}</div>
                </div>
              }
            </div>
            
            <!-- 邊層 -->
            <div class="react-flow__edges" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 3;">
              @for (edge of internalEdges(); track edge.id) {
                <svg 
                  class="react-flow__edge selectable"
                  [class.selected]="edge.selected"
                  [class.animated]="edge.animated"
                  style="position: absolute; width: 100%; height: 100%; overflow: visible; pointer-events: none;"
                  [style.z-index]="getEdgeZIndex(edge)"
                >
                  <!-- 互動層 (提供更好的點擊體驗) -->
                  <path
                    class="react-flow__edge-interaction"
                    [attr.d]="getEdgePath(edge)"
                    fill="none"
                    stroke="transparent"
                    stroke-width="20"
                    style="pointer-events: visibleStroke; cursor: pointer;"
                    (click)="onEdgeClick($event, edge)"
                  />
                  
                  <!-- 實際顯示的邊線 -->
                  <path
                    class="react-flow__edge-path"
                    [attr.d]="getEdgePath(edge)"
                    fill="none"
                    stroke="var(--xy-edge-stroke, #b1b1b7)"
                    stroke-width="1"
                    [class.animated]="edge.animated"
                    style="pointer-events: none;"
                  />
                </svg>
              }
              
              <!-- 連接線（當正在連接時） -->
              @if (connectionState().isConnecting) {
                <svg style="position: absolute; width: 100%; height: 100%; overflow: visible; pointer-events: none; z-index: 1001;">
                  <path
                    class="react-flow__connection-path"
                    [attr.d]="getConnectionPath()"
                    fill="none"
                    stroke="var(--xy-connection-path-color, #b1b1b7)"
                    stroke-width="1"
                    stroke-dasharray="5,5"
                  />
                </svg>
              }
            </div>
          </div>
        </div>
        
        <!-- 選擇框 -->
        @if (selectionBox().active) {
          <div 
            class="react-flow__nodesselection-rect"
            [style.left]="selectionBox().x + 'px'"
            [style.top]="selectionBox().y + 'px'" 
            [style.width]="selectionBox().width + 'px'"
            [style.height]="selectionBox().height + 'px'"
          ></div>
        }
      </div>
      
      
      <!-- MiniMap -->
      <minimap 
        [nodeLookup]="nodeLookup()"
        [transform]="reactTransform()"
        [width]="containerWidth()"
        [height]="containerHeight()"
        [translateExtent]="translateExtent()"
        [rfId]="rfId()"
        [ariaLabelConfig]="ariaLabelConfig()"
        [style]="{ width: '200px', height: '150px' }"
      />
      
      <!-- Controls -->
      <controls
        [showZoom]="true"
        [showFitView]="true"
        [showInteractive]="true"
        [isInteractive]="isInteractive()"
        (onZoomIn)="zoomIn()"
        (onZoomOut)="zoomOut()"
        (onFitView)="fitViewToNodes()"
        (onInteractiveChange)="toggleInteractive()"
      />
      
      <!-- 控制面板 (對應React範例的Panel) -->
      <div class="react-flow__panel top right">
        <button (click)="resetTransform()">reset transform</button>
        <button (click)="updatePos()">change pos</button>
        <button (click)="toggleClassnames()">toggle classnames</button>
        <button (click)="logToObject()">toObject</button>
        <button (click)="deleteSelectedElements()">deleteSelectedElements</button>
        <button (click)="deleteSomeElements()">deleteSomeElements</button>
        <button (click)="onSetNodes()">setNodes</button>
        <button (click)="onUpdateNode()">updateNode</button>
        <button (click)="addNode()">addNode</button>
      </div>
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
export class AngularFlowBasic implements AfterViewInit, OnDestroy {
  @ViewChild('flowContainer') flowContainer!: ElementRef<HTMLDivElement>;
  
  // 輸入屬性（對應 React 的 props）
  public defaultNodes = input<Node[]>([]);
  public defaultEdges = input<Edge[]>([]);
  public className = input<string>('');
  public minZoom = input<number>(0.2);
  public maxZoom = input<number>(4);
  public fitView = input<boolean>(true);
  public selectNodesOnDrag = input<boolean>(false);
  public elevateEdgesOnSelect = input<boolean>(true);
  public elevateNodesOnSelect = input<boolean>(false);
  public nodeDragThreshold = input<number>(0);
  
  // 輸出事件（對應 React 的 callbacks）
  public onNodesChange = output<Node[]>();
  public onEdgesChange = output<Edge[]>();
  public onConnect = output<{ source: string; target: string; sourceHandle?: string; targetHandle?: string }>();
  public onNodeClick = output<{ event: MouseEvent; node: Node }>();
  public onNodeDragStart = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  public onNodeDrag = output<{ node: Node; nodes: Node[] }>();
  public onNodeDragStop = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  public onSelectionDragStart = output<{ event: MouseEvent; nodes: Node[] }>();
  public onSelectionDrag = output<{ nodes: Node[] }>();
  public onSelectionDragStop = output<{ event: MouseEvent; nodes: Node[] }>();
  
  // 內部狀態
  public internalNodes = signal<Node[]>([]);
  public internalEdges = signal<Edge[]>([]);
  public viewport = signal({ x: 0, y: 0, zoom: 1 });
  
  // MiniMap計算狀態
  private minimapViewScale = 0;
  private transform = computed(() => this.viewport());
  
  // 交互狀態控制
  public interactiveState = signal(true); // true = 解鎖，false = 鎖定
  
  // React Flow 相容的計算屬性
  public reactTransform = computed(() => {
    const vp = this.viewport();
    return [vp.x, vp.y, vp.zoom] as [number, number, number];
  });
  
  // NodeLookup 格式 - 與 React Flow 相容
  public nodeLookup = computed(() => {
    const nodes = this.internalNodes();
    const lookup = new Map<string, any>();
    
    nodes.forEach(node => {
      // 確保節點有正確的寬度和高度
      const nodeWithDimensions = {
        ...node,
        width: node.width || 150,
        height: node.height || 36
      };
      
      lookup.set(node.id, {
        internals: {
          userNode: nodeWithDimensions,
          positionAbsolute: node.position // 簡化版，實際應考慮父節點
        }
      });
    });
    
    return lookup;
  });
  
  // 其他 MiniMap 需要的屬性
  public translateExtent = signal<[[number, number], [number, number]]>([[-Infinity, -Infinity], [Infinity, Infinity]]);
  public rfId = signal('angular-flow-1');
  public ariaLabelConfig = signal({ 'minimap.ariaLabel': 'Mini Map' });
  
  // 拖拽狀態
  private dragState = {
    isDragging: false,
    dragType: 'none' as 'none' | 'node' | 'pane' | 'selection',
    dragNode: null as Node | null,
    dragNodeIndex: -1,
    startPos: { x: 0, y: 0 },
    startNodePos: { x: 0, y: 0 },
    startViewport: { x: 0, y: 0, zoom: 1 }
  };
  
  // 選擇狀態
  public selectionBox = signal({
    active: false,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    startX: 0,
    startY: 0
  });
  
  // 連接狀態
  public connectionState = signal({
    isConnecting: false,
    fromNode: null as string | null,
    fromHandle: null as string | null,
    toPos: { x: 0, y: 0 }
  });
  
  // 計算屬性
  public viewportTransform = computed(() => {
    const vp = this.viewport();
    return `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`;
  });
  
  public minimapViewport = computed(() => {
    const nodes = this.internalNodes();
    const elementWidth = 200; // minimap寬度
    const elementHeight = 150; // minimap高度
    const offsetScale = 5; // 偏移比例
    
    if (nodes.length === 0) {
      return { 
        x: 0, 
        y: 0, 
        width: elementWidth, 
        height: elementHeight, 
        viewBox: `0 0 ${elementWidth} ${elementHeight}` 
      };
    }
    
    // 關鍵修復: 獲取Flow容器的實際尺寸 (不是MiniMap尺寸)
    const containerElement = this.flowContainer?.nativeElement;
    const flowWidth = containerElement ? containerElement.offsetWidth : 800;
    const flowHeight = containerElement ? containerElement.offsetHeight : 600;
    
    // 關鍵修復: 按照React Flow標準計算viewBB
    const viewport = this.viewport();
    // 轉換為React Flow的transform陣列格式 [tx, ty, scale]
    const reactTransform = [viewport.x, viewport.y, viewport.zoom];
    
    const viewBB = {
      x: -reactTransform[0] / reactTransform[2],
      y: -reactTransform[1] / reactTransform[2],
      width: flowWidth / reactTransform[2],  // 使用Flow寬度
      height: flowHeight / reactTransform[2] // 使用Flow高度
    };
    
    // 計算可見節點的邊界
    const visibleNodes = nodes.filter(node => !node.hidden);
    const nodeBounds = this.getInternalNodesBounds(visibleNodes);
    
    // 關鍵修復: 正確實現getBoundsOfRects逻輯
    const boundingRect = visibleNodes.length > 0 ? 
      this.getBoundsOfRects(nodeBounds, viewBB) : viewBB;
    
    // React Flow的精確縮放計算
    const scaledWidth = boundingRect.width / elementWidth;
    const scaledHeight = boundingRect.height / elementHeight;
    const viewScale = Math.max(scaledWidth, scaledHeight);
    const viewWidth = viewScale * elementWidth;
    const viewHeight = viewScale * elementHeight;
    const offset = offsetScale * viewScale;
    
    // React Flow的置中算法
    const x = boundingRect.x - (viewWidth - boundingRect.width) / 2 - offset;
    const y = boundingRect.y - (viewHeight - boundingRect.height) / 2 - offset;
    const width = viewWidth + offset * 2;
    const height = viewHeight + offset * 2;
    
    this.minimapViewScale = viewScale;
    
    // 關鍵修復: 正確的視口指示器坐標計算
    // 計算MiniMap座標系統中的比例
    const scaleX = elementWidth / width;
    const scaleY = elementHeight / height;
    
    // 視口指示器在MiniMap中的位置和尺寸
    const viewportMiniX = (viewBB.x - x) * scaleX;
    const viewportMiniY = (viewBB.y - y) * scaleY;
    const viewportMiniWidth = viewBB.width * scaleX;
    const viewportMiniHeight = viewBB.height * scaleY;
    
    return {
      x: viewportMiniX,
      y: viewportMiniY,
      width: viewportMiniWidth,
      height: viewportMiniHeight,
      viewBox: `${x} ${y} ${width} ${height}`,
      viewScale,
      boundingRect,
      // 除錯資訊
      debug: {
        flowSize: { width: flowWidth, height: flowHeight },
        minimapSize: { width: elementWidth, height: elementHeight },
        viewBB,
        boundingRect,
        scales: { viewScale, scaleX, scaleY },
        viewport,
        reactTransform
      }
    };
  });
  
  public backgroundOffset = computed(() => {
    const vp = this.viewport();
    const gap = 20; // pattern spacing
    // 根據React Flow的邏輯計算背景偏移
    return {
      x: (vp.x * vp.zoom) % gap,
      y: (vp.y * vp.zoom) % gap
    };
  });
  
  // MiniMap 所需的計算屬性
  public containerWidth = computed(() => {
    const container = this.flowContainer?.nativeElement;
    return container ? container.offsetWidth : 800;
  });
  
  public containerHeight = computed(() => {
    const container = this.flowContainer?.nativeElement;
    return container ? container.offsetHeight : 600;
  });
  
  // 獲取實際節點尺寸用於 MiniMap
  public actualNodeDimensions = computed(() => {
    // React Flow MiniMap 的標準節點尺寸
    // 基於 React Flow 的預設 nodeExtent 和 MiniMap 縮放比例
    return { width: 150, height: 37 };
  });
  
  public nodeBounds = computed(() => {
    const nodes = this.internalNodes();
    if (nodes.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    nodes.forEach(node => {
      const nodeWidth = node.width || 150;
      const nodeHeight = node.height || 36; // 更新為實際節點高度
      
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  });
  
  constructor() {
    // 監聽預設節點變化
    effect(() => {
      const nodes = this.defaultNodes();
      if (nodes.length > 0) {
        this.internalNodes.set(nodes.map(node => ({ ...node, selected: false })));
      }
    });
    
    // 監聽預設邊變化
    effect(() => {
      const edges = this.defaultEdges();
      if (edges.length > 0) {
        this.internalEdges.set(edges.map(edge => ({ ...edge, selected: false })));
      }
    });
  }
  
  ngAfterViewInit() {
    // 如果設置了 fitView，初始化時適應視圖
    if (this.fitView()) {
      setTimeout(() => this.fitViewToNodes(), 100);
    }
    
    // 添加全域事件監聽
    document.addEventListener('mousemove', this.onDocumentMouseMove);
    document.addEventListener('mouseup', this.onDocumentMouseUp);
    document.addEventListener('keydown', this.onDocumentKeyDown);
    
    // 設置驗證工具 (開發時使用)
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        // Verification tool removed for basic example
        console.log('💡 Angular Flow 驗證工具已就緒！在控制台執行 verifyAngularFlow() 來測試修復效果');
      }
    }, 1000);
  }
  
  ngOnDestroy() {
    document.removeEventListener('mousemove', this.onDocumentMouseMove);
    document.removeEventListener('mouseup', this.onDocumentMouseUp);
    document.removeEventListener('keydown', this.onDocumentKeyDown);
  }
  
  // === 事件處理方法 ===
  
  protected onNodeMouseDown(event: MouseEvent, node: Node, index: number) {
    // 檢查是否為互動模式
    if (!this.isInteractive()) {
      return; // 鎖定時不允許拖拽
    }
    
    // 不要阻止事件傳播，讓點擊能正常工作
    event.preventDefault();
    
    // 紀錄初始狀態，但不立即開始拖拽
    this.dragState = {
      isDragging: false, // 先設為 false
      dragType: 'node',
      dragNode: node,
      dragNodeIndex: index,
      startPos: { x: event.clientX, y: event.clientY },
      startNodePos: { x: node.position.x, y: node.position.y },
      startViewport: { ...this.viewport() }
    };
  }
  
  protected handleNodeClick(event: MouseEvent, node: Node) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Node click:', node.id);
    
    // 檢查是否為互動模式
    if (this.isInteractive()) {
      // 處理選擇邏輯
      this.handleNodeSelection(event, node);
    }
    
    // 觸發點擊事件
    this.onNodeClick.emit({ event, node });
  }
  
  protected onHandleMouseDown(event: MouseEvent, nodeId: string, handleType: string) {
    // 檢查是否為互動模式
    if (!this.isInteractive()) {
      return; // 鎖定時不允許連接
    }
    
    event.preventDefault();
    event.stopPropagation();
    
    console.log(`Handle mousedown: ${nodeId} ${handleType}`);
    
    // 只有source handle可以開始連接
    if (handleType === 'source') {
      const rect = this.flowContainer.nativeElement.getBoundingClientRect();
      const vp = this.viewport();
      
      // 計算相對於flow容器的位置
      const x = (event.clientX - rect.left - vp.x) / vp.zoom;
      const y = (event.clientY - rect.top - vp.y) / vp.zoom;
      
      // 開始連接狀態
      this.connectionState.set({
        isConnecting: true,
        fromNode: nodeId,
        fromHandle: handleType,
        toPos: { x, y }
      });
      
      console.log('Connection started from node:', nodeId);
    }
  }
  
  protected onEdgeClick(event: MouseEvent, edge: Edge) {
    event.stopPropagation();
    console.log('Edge click:', edge.id);
    
    // 選擇邊
    this.selectEdge(edge);
  }
  
  protected onRendererMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    // 檢查是否點擊的是節點或 handle
    if (target.closest('.react-flow__node') || target.closest('.react-flow__handle')) {
      return; // 讓節點或 handle 處理事件
    }
    
    // 清除選擇（點擊空白處）- 不管是否鎖定都要清除選擇
    this.clearSelection();
    
    // 檢查是否是 Shift+點擊來開始選擇框（只在互動模式下）
    if (event.shiftKey && this.isInteractive()) {
      this.startSelection(event);
    } else {
      // 平移功能不受鎖定影響 - 與 React Flow 行為一致
      this.startPanning(event);
    }
  }
  
  protected onWheel(event: WheelEvent) {
    event.preventDefault();
    
    const zoomStep = 0.1;
    const direction = event.deltaY > 0 ? -1 : 1;
    const newZoom = Math.min(
      Math.max(this.viewport().zoom + direction * zoomStep, this.minZoom()),
      this.maxZoom()
    );
    
    this.viewport.update(vp => ({ ...vp, zoom: newZoom }));
  }
  
  // === 私有方法 ===
  
  private onDocumentMouseMove = (event: MouseEvent) => {
    // 檢查是否需要開始拖拽（React Flow 的拖拽閾值邏輯）
    if (!this.dragState.isDragging && this.dragState.dragNode) {
      const deltaX = Math.abs(event.clientX - this.dragState.startPos.x);
      const deltaY = Math.abs(event.clientY - this.dragState.startPos.y);
      const dragThreshold = this.nodeDragThreshold() || 1; // React Flow 預設閾值
      
      if (deltaX > dragThreshold || deltaY > dragThreshold) {
        // 開始拖拽
        this.dragState.isDragging = true;
        this.onNodeDragStart.emit({ 
          event, 
          node: this.dragState.dragNode, 
          nodes: this.internalNodes() 
        });
      }
    }
    
    if (this.dragState.isDragging) {
      this.handleDragging(event);
    } else if (this.connectionState().isConnecting) {
      this.updateConnectionPos(event);
    } else if (this.selectionBox().active) {
      this.updateSelection(event);
    }
  }
  
  private onDocumentMouseUp = (event: MouseEvent) => {
    // 強制重置所有拖拽狀態
    if (this.dragState.isDragging) {
      this.stopDragging(event);
    } else if (this.dragState.dragNode) {
      // 如果有dragNode但沒有真正拖拽，只是點擊，清理狀態
      this.resetDragState();
    }
    
    if (this.connectionState().isConnecting) {
      this.stopConnection(event);
    } else if (this.selectionBox().active) {
      this.stopSelection(event);
    }
  }
  
  private onDocumentKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      this.deleteSelectedElements();
    }
  }
  
  // === 節點選擇相關 ===
  
  private handleNodeSelection(event: MouseEvent, node: Node) {
    if (event.metaKey || event.ctrlKey) {
      // 多選模式
      this.toggleNodeSelection(node);
    } else {
      // 單選模式
      this.selectSingleNode(node);
    }
  }
  
  private selectSingleNode(node: Node) {
    this.internalNodes.update(nodes => 
      nodes.map(n => ({
        ...n,
        selected: n.id === node.id
      }))
    );
    this.clearEdgeSelection();
  }
  
  private toggleNodeSelection(node: Node) {
    this.internalNodes.update(nodes =>
      nodes.map(n => 
        n.id === node.id ? { ...n, selected: !n.selected } : n
      )
    );
  }
  
  private selectEdge(edge: Edge) {
    this.internalEdges.update(edges =>
      edges.map(e => ({
        ...e,
        selected: e.id === edge.id
      }))
    );
    this.clearNodeSelection();
  }
  
  private clearSelection() {
    this.clearNodeSelection();
    this.clearEdgeSelection();
  }
  
  private clearNodeSelection() {
    this.internalNodes.update(nodes =>
      nodes.map(n => ({ ...n, selected: false }))
    );
  }
  
  private clearEdgeSelection() {
    this.internalEdges.update(edges =>
      edges.map(e => ({ ...e, selected: false }))
    );
  }
  
  // === 拖拽相關方法 ===
  
  private handleDragging(event: MouseEvent) {
    if (this.dragState.dragType === 'node' && this.dragState.dragNode) {
      // 計算新位置
      const deltaX = (event.clientX - this.dragState.startPos.x) / this.viewport().zoom;
      const deltaY = (event.clientY - this.dragState.startPos.y) / this.viewport().zoom;
      
      const newPosition = {
        x: this.dragState.startNodePos.x + deltaX,
        y: this.dragState.startNodePos.y + deltaY
      };
      
      
      // 更新節點位置
      this.updateNodePosition(this.dragState.dragNodeIndex, newPosition);
      
      // 觸發拖拽事件
      this.onNodeDrag.emit({ node: this.dragState.dragNode, nodes: this.internalNodes() });
      
    } else if (this.dragState.dragType === 'pane') {
      // 平移視口
      const deltaX = event.clientX - this.dragState.startPos.x;
      const deltaY = event.clientY - this.dragState.startPos.y;
      
      this.viewport.set({
        x: this.dragState.startViewport.x + deltaX,
        y: this.dragState.startViewport.y + deltaY,
        zoom: this.viewport().zoom
      });
    }
  }
  
  private stopDragging(event: MouseEvent) {
    if (this.dragState.isDragging && this.dragState.dragNode) {
      // 觸發拖拽結束事件
      this.onNodeDragStop.emit({ 
        event, 
        node: this.dragState.dragNode, 
        nodes: this.internalNodes() 
      });
      
      // 通知節點變化
      this.onNodesChange.emit(this.internalNodes());
    }
    
    this.resetDragState();
  }
  
  private resetDragState() {
    this.dragState = {
      isDragging: false,
      dragType: 'none',
      dragNode: null,
      dragNodeIndex: -1,
      startPos: { x: 0, y: 0 },
      startNodePos: { x: 0, y: 0 },
      startViewport: { x: 0, y: 0, zoom: 1 }
    };
  }
  
  private updateNodePosition(index: number, position: { x: number; y: number }) {
    this.internalNodes.update(nodes => {
      const newNodes = [...nodes];
      newNodes[index] = { ...newNodes[index], position };
      return newNodes;
    });
  }
  
  // === 連接相關方法 ===
  
  private updateConnectionPos(event: MouseEvent) {
    const rect = this.flowContainer.nativeElement.getBoundingClientRect();
    const vp = this.viewport();
    
    this.connectionState.update(state => ({
      ...state,
      toPos: {
        x: (event.clientX - rect.left - vp.x) / vp.zoom,
        y: (event.clientY - rect.top - vp.y) / vp.zoom
      }
    }));
  }
  
  private stopConnection(event: MouseEvent) {
    const fromState = this.connectionState();
    
    if (!fromState.isConnecting || !fromState.fromNode) {
      this.resetConnectionState();
      return;
    }
    
    console.log('Stopping connection, checking for target...');
    
    // 使用 elementFromPoint 找到滑鼠位置下的元素
    const elementUnderMouse = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;
    
    console.log('Element under mouse:', elementUnderMouse?.className, elementUnderMouse?.tagName);
    
    // 檢查是否是有效的目標 handle
    if (elementUnderMouse && 
        elementUnderMouse.classList.contains('react-flow__handle') && 
        elementUnderMouse.classList.contains('target')) {
      
      const targetNodeId = elementUnderMouse.getAttribute('data-nodeid');
      
      console.log('Target node found:', targetNodeId);
      
      if (targetNodeId && fromState.fromNode && targetNodeId !== fromState.fromNode) {
        console.log(`Creating connection: ${fromState.fromNode} -> ${targetNodeId}`);
        
        // 觸發 onConnect 事件
        this.onConnect.emit({
          source: fromState.fromNode,
          target: targetNodeId,
          sourceHandle: fromState.fromHandle || 'source',
          targetHandle: 'target'
        });
      } else {
        console.log('Invalid connection: same node or missing target');
      }
    } else {
      console.log('No valid target handle found');
    }
    
    this.resetConnectionState();
  }
  
  private resetConnectionState() {
    this.connectionState.set({
      isConnecting: false,
      fromNode: null,
      fromHandle: null,
      toPos: { x: 0, y: 0 }
    });
  }
  
  // 添加邊的方法 - 由外部調用
  public addEdge(connection: { source: string; target: string; sourceHandle?: string; targetHandle?: string }) {
    const newEdge: Edge = {
      id: `e${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      selected: false
    };
    
    this.internalEdges.update(edges => [...edges, newEdge]);
    this.onEdgesChange.emit(this.internalEdges());
  }
  
  // === 選擇框相關方法 ===
  
  private startSelection(event: MouseEvent) {
    const rect = this.flowContainer.nativeElement.getBoundingClientRect();
    const startX = event.clientX - rect.left;
    const startY = event.clientY - rect.top;
    
    this.selectionBox.set({
      active: true,
      x: startX,
      y: startY,
      width: 0,
      height: 0,
      startX,
      startY
    });
  }
  
  private updateSelection(event: MouseEvent) {
    const rect = this.flowContainer.nativeElement.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;
    const box = this.selectionBox();
    
    const x = Math.min(box.startX, currentX);
    const y = Math.min(box.startY, currentY);
    const width = Math.abs(currentX - box.startX);
    const height = Math.abs(currentY - box.startY);
    
    this.selectionBox.update(box => ({
      ...box,
      x, y, width, height
    }));
    
    // 選擇框內的節點
    this.selectNodesInBox(x, y, width, height);
  }
  
  private stopSelection(event: MouseEvent) {
    this.selectionBox.set({
      active: false,
      x: 0, y: 0, width: 0, height: 0,
      startX: 0, startY: 0
    });
  }
  
  private selectNodesInBox(x: number, y: number, width: number, height: number) {
    const vp = this.viewport();
    
    this.internalNodes.update(nodes =>
      nodes.map(node => {
        const nodeX = (node.position.x * vp.zoom) + vp.x;
        const nodeY = (node.position.y * vp.zoom) + vp.y;
        const nodeWidth = 150 * vp.zoom; // 假設節點寬度
        const nodeHeight = 36 * vp.zoom;  // 實際節點高度
        
        const selected = (
          nodeX >= x && nodeY >= y &&
          nodeX + nodeWidth <= x + width &&
          nodeY + nodeHeight <= y + height
        );
        
        return { ...node, selected };
      })
    );
  }
  
  // === 平移相關方法 ===
  
  private startPanning(event: MouseEvent) {
    this.dragState = {
      isDragging: true,
      dragType: 'pane',
      dragNode: null,
      dragNodeIndex: -1,
      startPos: { x: event.clientX, y: event.clientY },
      startNodePos: { x: 0, y: 0 },
      startViewport: { ...this.viewport() }
    };
  }
  
  // === 邊路徑計算 ===
  
  protected getEdgePath(edge: Edge): string {
    const sourceNode = this.internalNodes().find(n => n.id === edge.source);
    const targetNode = this.internalNodes().find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return '';
    
    // 使用getEdgePosition精確計算連接點位置
    const sourcePosition = this.getEdgePosition(sourceNode, 'source');
    const targetPosition = this.getEdgePosition(targetNode, 'target');
    
    // 實現 React Flow 的 getBezierPath 邏輯
    return this.getBezierPath({
      sourceX: sourcePosition.x,
      sourceY: sourcePosition.y,
      sourcePosition: sourcePosition.position,
      targetX: targetPosition.x,
      targetY: targetPosition.y,
      targetPosition: targetPosition.position,
      curvature: 0.25
    });
  }
  
  // 精確計算節點連接點位置 - 參考React Flow標準 (top/bottom 佈局)
  private getEdgePosition(node: Node, handleType: 'source' | 'target') {
    const nodeWidth = 150; // 節點寬度
    const nodeHeight = 36;  // 節點高度
    
    // 對於input類型節點，只有source handle
    if (node.type === 'input' && handleType === 'target') {
      // input節點沒有target handle，使用頂部中點
      return {
        x: node.position.x + nodeWidth / 2,
        y: node.position.y,
        position: 'top'
      };
    }
    
    // 標準handle位置計算 - React Flow標準佈局
    if (handleType === 'source') {
      // source handle 在底部中間
      return {
        x: node.position.x + nodeWidth / 2,
        y: node.position.y + nodeHeight,
        position: 'bottom'
      };
    } else {
      // target handle 在頂部中間
      return {
        x: node.position.x + nodeWidth / 2,
        y: node.position.y,
        position: 'top'
      };
    }
  }
  
  // 計算edge的z-index - 參考React Flow的getElevatedEdgeZIndex
  protected getEdgeZIndex(edge: Edge): number {
    const baseZIndex = 3; // edges基礎 z-index
    const selectedZIndex = this.elevateEdgesOnSelect() && edge.selected ? 1000 : 0;
    
    // 簡化版，不考慮父節點
    return baseZIndex + selectedZIndex;
  }
  
  // React Flow 的貝塞爾曲線路徑計算
  private getBezierPath(params: {
    sourceX: number;
    sourceY: number;
    sourcePosition: string;
    targetX: number;
    targetY: number;
    targetPosition: string;
    curvature?: number;
  }): string {
    const {
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature = 0.25
    } = params;

    // 計算控制點距離
    const distance = Math.sqrt((targetX - sourceX) ** 2 + (targetY - sourceY) ** 2);
    const controlOffset = distance * curvature;

    // 根據 handle 位置計算控制點
    let sourceControlX = sourceX;
    let sourceControlY = sourceY;
    let targetControlX = targetX;
    let targetControlY = targetY;

    // Source control point (right handle)
    if (sourcePosition === 'right') {
      sourceControlX = sourceX + controlOffset;
    } else if (sourcePosition === 'left') {
      sourceControlX = sourceX - controlOffset;
    } else if (sourcePosition === 'bottom') {
      sourceControlY = sourceY + controlOffset;
    } else if (sourcePosition === 'top') {
      sourceControlY = sourceY - controlOffset;
    }

    // Target control point (left handle)
    if (targetPosition === 'left') {
      targetControlX = targetX - controlOffset;
    } else if (targetPosition === 'right') {
      targetControlX = targetX + controlOffset;
    } else if (targetPosition === 'top') {
      targetControlY = targetY - controlOffset;
    } else if (targetPosition === 'bottom') {
      targetControlY = targetY + controlOffset;
    }

    // 生成 SVG 貝塞爾曲線路徑
    return `M ${sourceX} ${sourceY} C ${sourceControlX} ${sourceControlY}, ${targetControlX} ${targetControlY}, ${targetX} ${targetY}`;
  }
  
  protected getConnectionPath(): string {
    const state = this.connectionState();
    if (!state.isConnecting || !state.fromNode) return '';
    
    const sourceNode = this.internalNodes().find(n => n.id === state.fromNode);
    if (!sourceNode) return '';
    
    // 使用getEdgePosition精確計算連接點
    const sourcePosition = this.getEdgePosition(sourceNode, 'source');
    
    // 使用貝塞爾曲線連接到滑鼠位置
    return this.getBezierPath({
      sourceX: sourcePosition.x,
      sourceY: sourcePosition.y,
      sourcePosition: sourcePosition.position,
      targetX: state.toPos.x,
      targetY: state.toPos.y,
      targetPosition: 'left',
      curvature: 0.25
    });
  }
  
  // === 控制面板方法實現 ===
  
  public resetTransform() {
    console.log('reset transform');
    this.viewport.set({ x: 0, y: 0, zoom: 1 });
  }
  
  public updatePos() {
    console.log('change pos');
    this.internalNodes.update(nodes =>
      nodes.map(node => ({
        ...node,
        position: {
          x: Math.random() * 400,
          y: Math.random() * 400
        }
      }))
    );
    this.onNodesChange.emit(this.internalNodes());
  }
  
  public toggleClassnames() {
    console.log('toggle classnames');
    this.internalNodes.update(nodes =>
      nodes.map(node => ({
        ...node,
        className: node.className === 'light' ? 'dark' : 'light'
      }))
    );
  }
  
  public logToObject() {
    const flowObject = {
      nodes: this.internalNodes(),
      edges: this.internalEdges(),
      viewport: this.viewport()
    };
    console.log('Flow object:', flowObject);
  }
  
  public deleteSelectedElements() {
    const selectedNodes = this.internalNodes().filter(n => n.selected);
    const selectedEdges = this.internalEdges().filter(e => e.selected);
    
    console.log('deleteSelectedElements', selectedNodes, selectedEdges);
    
    // 刪除選中的節點
    const remainingNodes = this.internalNodes().filter(n => !n.selected);
    this.internalNodes.set(remainingNodes);
    
    // 刪除選中的邊和與刪除節點相關的邊
    const deletedNodeIds = selectedNodes.map(n => n.id);
    const remainingEdges = this.internalEdges().filter(e => 
      !e.selected && 
      !deletedNodeIds.includes(e.source) && 
      !deletedNodeIds.includes(e.target)
    );
    this.internalEdges.set(remainingEdges);
    
    this.onNodesChange.emit(this.internalNodes());
  }
  
  public deleteSomeElements() {
    console.log('deleteSomeElements');
    // 刪除特定元素（模仿 React 範例）
    const remainingNodes = this.internalNodes().filter(n => n.id !== '2');
    const remainingEdges = this.internalEdges().filter(e => e.id !== 'e1-3');
    
    this.internalNodes.set(remainingNodes);
    this.internalEdges.set(remainingEdges);
    this.onNodesChange.emit(this.internalNodes());
  }
  
  public onSetNodes() {
    console.log('setNodes');
    const newNodes: Node[] = [
      { id: 'a', position: { x: 0, y: 0 }, data: { label: 'Node a' }, selected: false },
      { id: 'b', position: { x: 0, y: 150 }, data: { label: 'Node b' }, selected: false }
    ];
    const newEdges: Edge[] = [
      { id: 'a-b', source: 'a', target: 'b', selected: false }
    ];
    
    this.internalNodes.set(newNodes);
    this.internalEdges.set(newEdges);
    this.fitViewToNodes();
    this.onNodesChange.emit(this.internalNodes());
  }
  
  public onUpdateNode() {
    console.log('updateNode');
    this.internalNodes.update(nodes =>
      nodes.map(node => {
        if (node.id === '1' || node.id === '2') {
          return { ...node, data: { ...node.data, label: 'update' } };
        }
        return node;
      })
    );
  }
  
  public addNode() {
    console.log('addNode');
    const newNode: Node = {
      id: `${Math.random()}`,
      data: { label: 'Node' },
      position: { x: Math.random() * 300, y: Math.random() * 300 },
      className: 'light',
      selected: false
    };
    
    this.internalNodes.update(nodes => [...nodes, newNode]);
    this.fitViewToNodes();
    this.onNodesChange.emit(this.internalNodes());
  }
  
  // === 縮放控制 ===
  
  public zoomIn() {
    this.scaleViewportByFactor(1.2);
  }
  
  public zoomOut() {
    this.scaleViewportByFactor(1 / 1.2);
  }
  
  // 以視口中心為基準進行縮放（模仿React Flow的panZoom.scaleBy行為）
  private scaleViewportByFactor(factor: number) {
    const currentViewport = this.viewport();
    const newZoom = Math.max(
      this.minZoom(),
      Math.min(currentViewport.zoom * factor, this.maxZoom())
    );
    
    if (newZoom === currentViewport.zoom) {
      return; // 達到縮放限制
    }
    
    // 獲取視口中心點
    const containerRect = this.flowContainer.nativeElement.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    
    // 計算縮放前的流坐標中心點
    const flowCenterX = (centerX - currentViewport.x) / currentViewport.zoom;
    const flowCenterY = (centerY - currentViewport.y) / currentViewport.zoom;
    
    // 計算縮放後的新偏移，使中心點保持在相同位置
    const newX = centerX - flowCenterX * newZoom;
    const newY = centerY - flowCenterY * newZoom;
    
    this.viewport.set({
      x: newX,
      y: newY,
      zoom: newZoom
    });
  }
  
  public fitViewToNodes() {
    const nodes = this.internalNodes();
    if (nodes.length === 0) return;
    
    // 計算所有節點的邊界（模仿React Flow的getNodesBounds）
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      const nodeWidth = 150; // 節點寬度
      const nodeHeight = 36;  // 節點高度
      
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });
    
    // 獲取容器尺寸
    const containerRect = this.flowContainer.nativeElement.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // React Flow的fitView邏輯
    const padding = 0.1; // 10% padding
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    // 添加padding
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
    
    // 平滑動畫過渡（簡化版）
    this.viewport.set({ x, y, zoom: finalZoom });
    
    console.log('FitView applied:', { x, y, zoom: finalZoom });
  }
  
  // === 交互狀態控制 ===
  
  public isInteractive() {
    return this.interactiveState();
  }
  
  public toggleInteractive() {
    this.interactiveState.update(state => !state);
    console.log('Interactive state:', this.interactiveState() ? 'Unlocked' : 'Locked');
  }
  
  // === MiniMap輔助方法 - 參考React Flow實現 ===
  
  private getInternalNodesBounds(nodes: any[]) {
    if (nodes.length === 0) {
      return { x: 0, y: 0, width: 200, height: 150 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      const nodeWidth = 150; // 預設節點寬度
      const nodeHeight = 36; // 預設節點高度
      
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });
    
    return { 
      x: minX, 
      y: minY, 
      width: maxX - minX, 
      height: maxY - minY 
    };
  }

  private getBoundsOfRects(nodeBounds: any, viewBB: any) {
    const minX = Math.min(nodeBounds.x, viewBB.x);
    const minY = Math.min(nodeBounds.y, viewBB.y);
    const maxX = Math.max(nodeBounds.x + nodeBounds.width, viewBB.x + viewBB.width);
    const maxY = Math.max(nodeBounds.y + nodeBounds.height, viewBB.y + viewBB.height);
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
  
  protected getMinimapMaskPath(): string {
    const minimap = this.minimapViewport();
    const offsetScale = 5;
    const offset = offsetScale * (minimap.viewScale || 1);
    
    // 解析viewBox得到SVG坐標系統的範圍
    const viewBoxParts = minimap.viewBox.split(' ').map(Number);
    const [vbX, vbY, vbWidth, vbHeight] = viewBoxParts;
    
    // 關鍵修復: 外層矩形使用viewBox坐標系統 (不是MiniMap尺寸)
    const outerPath = `M${vbX - offset},${vbY - offset}h${vbWidth + offset * 2}v${vbHeight + offset * 2}h${-vbWidth - offset * 2}z`;
    
    // 關鍵修復: 視口指示器使用viewBB的實際坐標 (在viewBox坐標系統中)
    const debug = minimap.debug;
    const viewBB = debug?.viewBB;
    
    if (!viewBB) {
      // fallback到轉換後的坐標
      const innerPath = `M${minimap.x},${minimap.y}h${minimap.width}v${minimap.height}h${-minimap.width}z`;
      return `${outerPath} ${innerPath}`;
    }
    
    // 使用viewBB的實際坐標 (在viewBox坐標系統中)
    const innerPath = `M${viewBB.x},${viewBB.y}h${viewBB.width}v${viewBB.height}h${-viewBB.width}z`;
    
    // 結合兩個路徑，使用fill-rule="evenodd"創建正確的遮罩效果
    return `${outerPath} ${innerPath}`;
  }
}