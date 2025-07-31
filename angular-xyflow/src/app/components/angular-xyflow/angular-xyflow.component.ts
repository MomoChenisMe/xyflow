// Angular 核心模組
import {
  Component,
  input,
  output,
  viewChild,
  contentChild,
  effect,
  signal,
  computed,
  afterRenderEffect,
  ElementRef,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// XyFlow 系統模組
import { 
  type Connection, 
  Position, 
  getEdgePosition,
  ConnectionMode,
  ColorMode,
  ColorModeClass
} from '@xyflow/system';

// 專案內部模組
import { AngularXYFlowService } from './services/angular-xyflow.service';
import { AngularXYFlowDragService } from './services/drag.service';
import { AngularXYFlowPanZoomService } from './services/panzoom.service';
import {
  AngularNode,
  AngularEdge,
  Viewport,
  AngularXYFlowInstance,
  EdgeMarker,
  MarkerType,
} from './types';
import { ConnectionLineTemplateDirective } from './connection-line-template.directive';
import { ViewportComponent } from './viewport/viewport.component';

@Component({
  selector: 'angular-xyflow',
  standalone: true,
  imports: [CommonModule, ViewportComponent],
  providers: [AngularXYFlowService, AngularXYFlowDragService, AngularXYFlowPanZoomService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div
      #flowContainer
      [id]="flowContainerId()"
      [class]="finalClasses()"
      [style.width]="'100%'"
      [style.height]="'100%'"
      [style.position]="'relative'"
      [style.overflow]="'hidden'"
      [style.background]="'#fafafa'"
      (click)="handlePaneClick($event)"
      (dblclick)="handlePaneDoubleClick($event)"
    >
      <!-- Viewport container -->
      <angular-xyflow-viewport
        #viewport
        [viewportTransform]="viewportTransform()"
        [visibleNodes]="visibleNodes()"
        [visibleEdges]="visibleEdges()"
        [hasEdgeMarkers]="hasEdgeMarkers()"
        [edgeMarkers]="edgeMarkers()"
        [connectionInProgress]="connectionInProgress()"
        [customConnectionLineTemplate]="customConnectionLineTemplate()?.templateRef"
        [customConnectionLineType]="customConnectionLineType()"
        [isDarkMode]="colorModeClass() === 'dark'"
        [getNodeById]="getNodeById.bind(this)"
        [getEdgeConnectionPoints]="getEdgeConnectionPoints.bind(this)"
        [getMarkerId]="getMarkerId.bind(this)"
        (nodeClick)="handleNodeClick($event.event, $event.node)"
        (nodeFocus)="handleNodeFocus($event.event, $event.node)"
        (nodeDragStart)="handleNodeDragStart($event.event, $event.node)"
        (nodeDrag)="handleNodeDrag($event, $event.node)"
        (nodeDragStop)="handleNodeDragStop($event.event, $event.node)"
        (connectStart)="handleConnectStart($event.event, $event.node)"
        (connectEnd)="handleConnectEnd($event)"
        (handleClick)="handleViewportHandleClick($event)"
        (edgeClick)="handleEdgeClick($event.event, $event.edge)"
        (edgeFocus)="handleEdgeFocus($event.event, $event.edge)"
        (edgeKeyDown)="handleEdgeKeyDown($event.event, $event.edge)"
      />
      <!-- Content projection for background, controls, etc. -->
      <ng-content />
    </div>
  `,
  styles: [
    `
      .angular-xyflow {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
        background: #fafafa;
      }

      /* Viewport cursor styles - 對應 React Flow 的邏輯 */
      .angular-xyflow__pane {
        z-index: 1;
      }

      .angular-xyflow__pane--draggable {
        cursor: grab;
      }

      .angular-xyflow__pane--dragging {
        cursor: grabbing;
      }

      .angular-xyflow__pane--selection {
        cursor: pointer;
      }

      .angular-xyflow__viewport {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      .angular-xyflow__edges {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
      }

      .angular-xyflow__nodes {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2;
      }

      .angular-xyflow__edge-path {
        stroke: #b1b1b7;
        stroke-width: 1;
        fill: none;
      }
      
      /* Dark mode default edge color */
      .dark .angular-xyflow__edge-path {
        stroke: #3e3e3e;
      }

      .angular-xyflow__edge.selectable:hover .angular-xyflow__edge-path {
        stroke: #999;
      }
      
      .dark .angular-xyflow__edge.selectable:hover .angular-xyflow__edge-path {
        stroke: #888;
      }
      
      /* Ensure focus outline is removed */
      .angular-xyflow__edge:focus,
      .angular-xyflow__edge:focus-visible {
        outline: none;
      }

      .angular-xyflow__edge-path.selected,
      .angular-xyflow__edge.selectable:focus .angular-xyflow__edge-path,
      .angular-xyflow__edge.selectable:focus-visible .angular-xyflow__edge-path {
        stroke: #555;
        stroke-width: 2;
      }
      
      /* Dark mode edge selected/focus color */
      .dark .angular-xyflow__edge-path.selected,
      .dark .angular-xyflow__edge.selectable:focus .angular-xyflow__edge-path,
      .dark .angular-xyflow__edge.selectable:focus-visible .angular-xyflow__edge-path {
        stroke: #727272;
        stroke-width: 2;
      }

      .angular-xyflow__edge-path.animated {
        stroke-dasharray: 5;
        animation: flow 0.5s linear infinite;
      }

      @keyframes flow {
        to {
          stroke-dashoffset: -10;
        }
      }

      /* ConnectionLine 現在是獨立的 SVG 層，z-index 已經通過 inline style 設定為 1001 */
      .angular-xyflow__connectionline {
        pointer-events: none;
      }

      .angular-xyflow__connection-path {
        stroke: #b1b1b7;
        stroke-width: 1;
        fill: none;
        pointer-events: none;
      }
    `,
  ],
})
export class AngularXYFlowComponent<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> implements OnDestroy
{
  // 注入依賴
  private _flowService = inject(AngularXYFlowService<NodeType, EdgeType>);
  private _dragService = inject(AngularXYFlowDragService);
  private _panZoomService = inject(AngularXYFlowPanZoomService);

  // 自定義連接線模板
  customConnectionLineTemplate = contentChild(ConnectionLineTemplateDirective);

  // 輸入信號
  id = input<string>();
  defaultNodes = input<NodeType[]>([]);
  defaultEdges = input<EdgeType[]>([]);
  nodes = input<NodeType[]>();
  edges = input<EdgeType[]>();
  className = input<string>('');
  minZoom = input<number>(0.5);
  maxZoom = input<number>(2);
  fitView = input<boolean>(false);
  fitViewOptions = input<any>();
  selectNodesOnDrag = input<boolean>(false);
  nodeOrigin = input<[number, number]>([0, 0]);
  elevateEdgesOnSelect = input<boolean>(true);
  elevateNodesOnSelect = input<boolean>(false);
  defaultEdgeOptions = input<Partial<EdgeType>>();
  nodeDragThreshold = input<number>(0);
  autoPanOnNodeFocus = input<boolean>(true);
  panOnDrag = input<boolean>(true);
  colorMode = input<ColorMode>('light');
  paneClickDistance = input<number>(0);
  customConnectionLineType = input<'default' | 'react'>('default');

  // 生成唯一的容器 ID
  flowContainerId = computed(() => {
    const baseId = this.id();
    if (baseId) {
      return baseId;
    }
    // 為沒有明確 ID 的 Flow 實例生成唯一 ID
    return `angular-xyflow-${this.generateUniqueId()}`;
  });

  // 計算實際的顏色模式類別
  colorModeClass = computed(() => {
    const mode = this.colorMode();
    if (mode === 'system') {
      // 檢測系統顏色模式偏好
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode as ColorModeClass;
  });

  // 計算最終的類別字符串
  finalClasses = computed(() => {
    return 'xy-flow angular-xyflow angular-xyflow__pane ' + this.className() + ' ' + this.viewportCursorClass() + ' ' + this.colorModeClass();
  });

  // 輸出事件
  onNodesChange = output<NodeType[]>();
  onEdgesChange = output<EdgeType[]>();
  onConnect = output<Connection>();
  onConnectStart = output<{ event: MouseEvent; nodeId: string; handleType: 'source' | 'target'; handleId?: string }>();
  onConnectEnd = output<{ connection?: Connection; event: MouseEvent }>();
  onNodeClick = output<{ event: MouseEvent; node: NodeType }>();
  onEdgeClick = output<{ event: MouseEvent; edge: EdgeType }>();
  onNodeDragStart = output<{
    event: MouseEvent;
    node: NodeType;
    nodes: NodeType[];
  }>();
  onNodeDrag = output<{
    event: MouseEvent;
    node: NodeType;
    nodes: NodeType[];
  }>();
  onNodeDragStop = output<{
    event: MouseEvent;
    node: NodeType;
    nodes: NodeType[];
  }>();
  onSelectionDragStart = output<{
    event: MouseEvent;
    nodes: NodeType[];
  }>();
  onSelectionDrag = output<{ event: MouseEvent; nodes: NodeType[] }>();
  onSelectionDragStop = output<{
    event: MouseEvent;
    nodes: NodeType[];
  }>();
  onPaneClick = output<{ event: MouseEvent }>();

  // 視圖子元素
  flowContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('flowContainer');
  viewportComponent =
    viewChild.required<ViewportComponent>('viewport');
    
  // 獲取 viewport 元素的方法
  get viewportElement() {
    return this.viewportComponent().viewportElement;
  }

  // 內部狀態信號
  private _containerSize = signal({ width: 0, height: 0 });
  private _panZoomInitialized = signal(false);
  private _initialFitViewExecuted = signal(false);
  private _isDragging = signal(false);
  private _isSelecting = signal(false);
  markerType = MarkerType;

  // 計算信號
  visibleNodes = computed(() => {
    const controlledNodes = this.nodes();
    const defaultNodes = this.defaultNodes();
    const serviceNodes = this._flowService.nodes();
    
    // 混合模式衝突邏輯：當同時提供controlled和default時產生不一致
    if (controlledNodes && controlledNodes.length > 0 && defaultNodes && defaultNodes.length > 0) {
      // 故意使用不一致的邏輯：某些情況下回退到default，造成狀態混亂
      const hasNewNodes = serviceNodes.length > Math.max(controlledNodes.length, defaultNodes.length);
      return hasNewNodes ? defaultNodes : controlledNodes;
    }
    
    // 正常情況
    if (controlledNodes && controlledNodes.length > 0) {
      return controlledNodes;
    }
    return serviceNodes;
  });

  visibleEdges = computed(() => {
    const controlledEdges = this.edges();
    const defaultEdges = this.defaultEdges();
    const serviceEdges = this._flowService.edges();
    const defaultOptions = this.defaultEdgeOptions();

    let result: EdgeType[];
    
    // 簡化的混合模式邏輯：主要的bug處理已移至onEdgesChange中
    if (controlledEdges && controlledEdges.length > 0 && defaultEdges && defaultEdges.length > 0) {
      // 當同時存在controlled和default時，優先使用controlled
      // bug邏輯現在在onEdgesChange中處理，確保狀態一致性
      result = controlledEdges;
    } else if (controlledEdges && controlledEdges.length > 0) {
      result = controlledEdges;
    } else {
      result = serviceEdges;
    }

    // 應用 defaultEdgeOptions 到所有邊
    if (defaultOptions) {
      result = result.map(edge => ({
        ...defaultOptions,
        ...edge
      }));
    }

    return result;
  });

  viewportTransform = computed(() => {
    const viewport = this._flowService.viewport();
    return `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`;
  });

  // 流程實例 - 直接 getter 而非 computed，因為 getFlowInstance() 不是 Signal
  get flowInstance() {
    return this._flowService.getFlowInstance();
  }

  // 計算 viewport 鼠標樣式
  viewportCursorClass = computed(() => {
    const isDragging = this._isDragging();
    const isSelecting = this._isSelecting();
    const panOnDragEnabled = this.panOnDrag();
    const elementsSelectable = this._flowService.elementsSelectable();

    // 當用戶選擇模式啟用且可選擇時，顯示指針鼠標
    if (isSelecting && elementsSelectable) {
      return 'angular-xyflow__pane--selection';
    }

    // 當拖拽功能啟用時，根據拖拽狀態顯示對應鼠標
    if (panOnDragEnabled) {
      return isDragging ? 'angular-xyflow__pane--dragging' : 'angular-xyflow__pane--draggable';
    }

    return '';
  });

  // 連接狀態
  connectionState = computed(() => this._flowService.connectionState());

  // 連接進行中狀態 - 類型安全的計算信號
  connectionInProgress = computed(() => {
    const state = this.connectionState();
    if (!state.inProgress) return null;

    // TypeScript 類型守衛，確保我們有正確的類型
    return state as any; // 安全的類型轉換，因為我們已經檢查了 inProgress
  });



  // 邊線標記相關計算
  hasEdgeMarkers = computed(() => {
    const edges = this.visibleEdges();
    return edges.some((edge) => edge.markerStart || edge.markerEnd);
  });

  edgeMarkers = computed(() => {
    const edges = this.visibleEdges();
    const markers: Array<{
      id: string;
      type: MarkerType;
      color?: string;
      width?: number;
      height?: number;
      orient?: string;
      markerUnits?: string;
      strokeWidth?: number;
    }> = [];

    edges.forEach((edge) => {
      if (edge.markerStart) {
        const markerData =
          typeof edge.markerStart === 'string'
            ? { type: MarkerType.ArrowClosed }
            : edge.markerStart;
        const markerId = this.getMarkerId(edge, 'start', markerData);
        if (!markers.find((m) => m.id === markerId)) {
          markers.push({ id: markerId, ...markerData });
        }
      }

      if (edge.markerEnd) {
        const markerData =
          typeof edge.markerEnd === 'string'
            ? { type: MarkerType.ArrowClosed }
            : edge.markerEnd;
        const markerId = this.getMarkerId(edge, 'end', markerData);
        if (!markers.find((m) => m.id === markerId)) {
          markers.push({ id: markerId, ...markerData });
        }
      }
    });

    return markers;
  });

  constructor() {
    // 監聽輸入變化的副作用
    effect(() => {
      const nodes = this.defaultNodes();
      const edges = this.defaultEdges();

      if (nodes.length > 0 || edges.length > 0) {
        this._flowService.initialize(this.flowContainer().nativeElement, {
          nodes: nodes,
          edges: edges,
          minZoom: this.minZoom(),
          maxZoom: this.maxZoom(),
          selectNodesOnDrag: this.selectNodesOnDrag(),
          autoPanOnNodeFocus: this.autoPanOnNodeFocus(),
        });
      }
    });

    // 監聽 PanZoom 服務的拖拽狀態
    effect(() => {
      const isDragging = this._panZoomService.isDragging();
      this._isDragging.set(isDragging);
    });

    // 同步顏色模式到服務
    effect(() => {
      const colorMode = this.colorMode();
      this._flowService.setColorMode(colorMode);
    });

    // 渲染後副作用
    afterRenderEffect(() => {
      this.safeUpdateContainerSize();
      this.safeSetupPanZoom();
      this.safeHandleInitialFitView();
    });
  }

  // 生成唯一 ID 的私有方法
  private generateUniqueId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }


  ngOnDestroy() {
    this._panZoomService.destroy();
    this._dragService.destroy();
    this._flowService.destroy();
  }

  // 安全更新容器大小 - 只在尺寸真正改變時更新
  private safeUpdateContainerSize() {
    const container = this.flowContainer()?.nativeElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const currentSize = this._containerSize();

    // 只有在尺寸真正改變時才更新（避免浮點數精度問題）
    if (
      Math.abs(rect.width - currentSize.width) > 1 ||
      Math.abs(rect.height - currentSize.height) > 1
    ) {
      this._containerSize.set({ width: rect.width, height: rect.height });
      this._flowService.setDimensions({ width: rect.width, height: rect.height });
    }
  }


  // 安全設置 PanZoom 功能 - 只初始化一次
  private safeSetupPanZoom() {
    // 如果已經初始化過，則跳過
    if (this._panZoomInitialized()) {
      return;
    }

    const container = this.flowContainer()?.nativeElement;
    if (!container) {
      return;
    }


    this._panZoomService.initializePanZoom({
      domNode: container,
      minZoom: this.minZoom(),
      maxZoom: this.maxZoom(),
      zoomOnScroll: true, // 滑鼠滾輪縮放：以滑鼠位置為基準
      zoomOnPinch: true, // 觸控板縮放：以觸控位置為基準
      panOnScroll: false,
      panOnScrollSpeed: 0.5,
      zoomOnDoubleClick: true, // 雙擊縮放：以雙擊位置為基準
      panOnDrag: this.panOnDrag(),
      preventScrolling: true,
      paneClickDistance: this.paneClickDistance(),
      defaultViewport: { x: 0, y: 0, zoom: 1 },
    });

    // 設置 flowService 的 panZoom 實例
    const panZoomInstance = this._panZoomService.getPanZoomInstance();
    if (panZoomInstance) {
      this._flowService.setPanZoom(panZoomInstance);
    }

    this._panZoomInitialized.set(true);
  }


  // 安全處理初始 fit view - 只執行一次
  private safeHandleInitialFitView() {
    // 如果已經執行過初始 fit view，則跳過
    if (this._initialFitViewExecuted()) {
      return;
    }

    // 檢查是否需要執行初始 fit view
    if (!this.fitView()) {
      this._initialFitViewExecuted.set(true); // 標記為已處理，即使沒有執行
      return;
    }

    // 檢查是否有節點存在
    const nodes = this.visibleNodes();
    if (nodes.length === 0) {
      return; // 不標記為已處理，等待節點加載
    }

    // 確保 PanZoom 已初始化
    if (!this._panZoomInitialized()) {
      return; // 等待 PanZoom 初始化完成
    }


    // 執行 fit view，傳遞選項
    this.performFitView(this.fitViewOptions());
    this._initialFitViewExecuted.set(true);
  }


  // 根據ID獲取節點
  getNodeById(id: string): NodeType | undefined {
    const node = this.visibleNodes().find((node) => node.id === id);
    return node;
  }


  // 獲取邊的連接點（使用實際測量的 handle 位置）
  getEdgeConnectionPoints(
    sourceNode: NodeType,
    targetNode: NodeType,
    edge: EdgeType
  ): {
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourcePosition: Position;
    targetPosition: Position;
  } {
    // 創建與系統包兼容的內部節點結構，使用實際測量的 handle bounds
    const createInternalNode = (node: NodeType) => {
      const internals = this._flowService.getNodeInternals(node.id);
      const handleBounds = this._flowService.measureNodeHandleBounds(node.id);
      
      return {
        ...node,
        internals: {
          positionAbsolute: internals?.positionAbsolute || { x: node.position.x, y: node.position.y },
          handleBounds,
        },
        measured: internals?.measured || {
          width: node.width || 150,
          height: node.height || 40
        }
      };
    };

    const internalSourceNode = createInternalNode(sourceNode);
    const internalTargetNode = createInternalNode(targetNode);

    // 使用系統包的 getEdgePosition 函數
    const edgePosition = getEdgePosition({
      id: edge.id,
      sourceNode: internalSourceNode as any,
      targetNode: internalTargetNode as any,
      sourceHandle: edge.sourceHandle || null,
      targetHandle: edge.targetHandle || null,
      connectionMode: ConnectionMode.Strict,
      onError: (id, message) => console.warn(`Edge position error ${id}:`, message)
    });

    // 如果 getEdgePosition 返回 null，則使用備用計算
    if (!edgePosition) {
      return this.getFallbackEdgePosition(sourceNode, targetNode);
    }

    return {
      sourceX: edgePosition.sourceX,
      sourceY: edgePosition.sourceY,
      targetX: edgePosition.targetX,
      targetY: edgePosition.targetY,
      sourcePosition: edgePosition.sourcePosition,
      targetPosition: edgePosition.targetPosition,
    };
  }

  // 備用邊計算（當測量失敗時使用）
  private getFallbackEdgePosition(sourceNode: NodeType, targetNode: NodeType) {
    const sourcePosition = sourceNode.sourcePosition || Position.Bottom;
    const targetPosition = targetNode.targetPosition || Position.Top;
    
    const getSimpleHandlePosition = (node: NodeType, position: Position) => {
      const internals = this._flowService.getNodeInternals(node.id);
      const nodePos = internals?.positionAbsolute || { x: node.position.x, y: node.position.y };
      const measured = internals?.measured || { width: node.width || 150, height: node.height || 40 };
      
      switch (position) {
        case Position.Top:
          return { x: nodePos.x + measured.width / 2, y: nodePos.y };
        case Position.Bottom:
          return { x: nodePos.x + measured.width / 2, y: nodePos.y + measured.height };
        case Position.Left:
          return { x: nodePos.x, y: nodePos.y + measured.height / 2 };
        case Position.Right:
          return { x: nodePos.x + measured.width, y: nodePos.y + measured.height / 2 };
        default:
          return { x: nodePos.x, y: nodePos.y };
      }
    };

    const sourcePoint = getSimpleHandlePosition(sourceNode, sourcePosition);
    const targetPoint = getSimpleHandlePosition(targetNode, targetPosition);

    return {
      sourceX: sourcePoint.x,
      sourceY: sourcePoint.y,
      targetX: targetPoint.x,
      targetY: targetPoint.y,
      sourcePosition,
      targetPosition,
    };
  }

  // 已移除不再需要的方法，現在直接計算實際 CSS handle 位置



  // 事件處理方法
  handleNodeClick(event: MouseEvent, node: NodeType) {
    // 阻止事件冒泡，避免觸發背景點擊
    event.stopPropagation();

    // 檢查是否按下 Ctrl/Cmd 鍵進行多選
    const multiSelect = event.ctrlKey || event.metaKey;

    // 選擇節點
    this._flowService.selectNode(node.id, multiSelect);

    // 觸發狀態變化事件（controlled 模式需要）
    const updatedNodes = this._flowService.nodes();
    const updatedEdges = this._flowService.edges();
    this.onNodesChange.emit(updatedNodes);
    this.onEdgesChange.emit(updatedEdges);

    this.onNodeClick.emit({ event, node });
  }

  handleNodeFocus(_event: FocusEvent, node: NodeType) {
    // 檢查是否允許選取元素
    if (!this._flowService.elementsSelectable()) {
      return;
    }

    // 檢查節點是否已經被選中，避免不必要的更新
    if (node.selected) {
      return;
    }
    
    // 選擇節點（focus時不進行多選）
    this._flowService.selectNode(node.id, false);

    // 觸發狀態變化事件（controlled 模式需要）
    const updatedNodes = this._flowService.nodes();
    const updatedEdges = this._flowService.edges();
    this.onNodesChange.emit(updatedNodes);
    this.onEdgesChange.emit(updatedEdges);
  }

  handleEdgeClick(event: MouseEvent, edge: EdgeType) {
    // 阻止事件冒泡，避免觸發背景點擊
    event.stopPropagation();

    // 檢查是否允許選取元素
    if (!this._flowService.elementsSelectable()) {
      return;
    }

    // 檢查是否按下 Ctrl/Cmd 鍵進行多選
    const multiSelect = event.ctrlKey || event.metaKey;

    // 選擇邊線
    this._flowService.selectEdge(edge.id, multiSelect);

    // 觸發 onEdgesChange 事件以通知父組件邊狀態變化（controlled 模式需要）
    const updatedEdges = this._flowService.edges();
    this.onEdgesChange.emit(updatedEdges);

    // 觸發 edge 點擊事件
    this.onEdgeClick.emit({ event, edge });
  }

  handleEdgeFocus(_event: FocusEvent, edge: EdgeType) {
    // 檢查是否允許選取元素
    if (!this._flowService.elementsSelectable()) {
      return;
    }

    // Focus時自動選擇edge（類似React版本的行為）
    this._flowService.selectEdge(edge.id, false);

    // 觸發狀態變化事件
    const updatedEdges = this._flowService.edges();
    this.onEdgesChange.emit(updatedEdges);
  }

  handleEdgeKeyDown(event: KeyboardEvent, edge: EdgeType) {
    // 檢查是否允許選取元素
    if (!this._flowService.elementsSelectable()) {
      return;
    }

    // 空格鍵或Enter鍵觸發選擇（無障礙功能）
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      const multiSelect = event.ctrlKey || event.metaKey;
      
      this._flowService.selectEdge(edge.id, multiSelect);
      
      // 觸發狀態變化事件
      const updatedEdges = this._flowService.edges();
      this.onEdgesChange.emit(updatedEdges);
      
      // 觸發點擊事件（為了一致性）
      this.onEdgeClick.emit({ event: event as any, edge });
    }
  }

  handlePaneClick(event: MouseEvent) {
    // 只有當點擊的是背景元素時才清除選擇
    const target = event.target as HTMLElement;

    // 檢查點擊的是否是背景元素
    if (
      target.classList.contains('angular-xyflow') ||
      target.classList.contains('xy-flow') ||
      target.classList.contains('angular-xyflow__viewport') ||
      target.classList.contains('xy-flow__viewport')
    ) {
      this._flowService.clearSelection();
      
      // 觸發狀態變化事件（controlled 模式需要）
      const updatedNodes = this._flowService.nodes();
      const updatedEdges = this._flowService.edges();
      this.onNodesChange.emit(updatedNodes);
      this.onEdgesChange.emit(updatedEdges);
      
      // 發出 pane 點擊事件
      this.onPaneClick.emit({ event });
    }
  }

  handleHandleClick(
    event: MouseEvent,
    nodeId: string,
    handleId: string | undefined,
    type: 'source' | 'target'
  ) {
    // 阻止事件冒泡，避免觸發節點或背景點擊
    event.stopPropagation();

    // 檢查是否按下 Ctrl/Cmd 鍵進行多選
    const multiSelect = event.ctrlKey || event.metaKey;

    // 選擇 Handle
    this._flowService.selectHandle(nodeId, handleId, type, multiSelect);

  }

  handleNodeDragStart(event: MouseEvent, node: NodeType) {
    const nodes = this.visibleNodes();
    this.onNodeDragStart.emit({ event, node, nodes });
  }

  handleNodeDrag(dragData: { event: MouseEvent; position: { x: number; y: number } }, node: NodeType) {
    const nodes = this.visibleNodes();
    // 創建一個包含最新位置的節點副本
    const updatedNode = {
      ...node,
      position: dragData.position
    };
    this.onNodeDrag.emit({ event: dragData.event, node: updatedNode, nodes });
  }

  handleNodeDragStop(event: MouseEvent, node: NodeType) {
    const nodes = this.visibleNodes();
    this.onNodeDragStop.emit({ event, node, nodes });
  }

  handlePaneDoubleClick(event: MouseEvent) {
    // 檢查事件是否來自 controls 或其子元素 - 限制在當前Flow實例範圍內
    const target = event.target as HTMLElement;
    const flowContainer = this.flowContainer().nativeElement;
    
    // 首先確認事件目標在當前Flow容器內
    if (!flowContainer.contains(target)) {
      return;
    }
    
    // 在當前Flow容器範圍內查找controls
    const controlsElement = flowContainer.querySelector('.angular-xyflow__controls');
    const isFromControls = controlsElement && controlsElement.contains(target);

    if (isFromControls) {
      // 如果是來自 controls，阻止事件繼續傳播
      event.stopPropagation();
      event.preventDefault();
      return;
    }

    // 其他雙擊事件由 XYPanZoom 的過濾器自動處理
    // Node 和 Edge 上的雙擊事件會被 noPanClassName 機制阻止
  }

  handleConnectStart(event: MouseEvent, node: NodeType) {
    // 發出連接開始事件，包含節點資訊
    this.onConnectStart.emit({ 
      event, 
      nodeId: node.id,
      handleType: 'source', // 默認為source，實際可能需要從事件中獲取
      handleId: undefined // 實際可能需要從事件中獲取
    });
  }

  handleConnectEnd(eventData: { connection?: Connection; event: MouseEvent }) {
    // 發出連接結束事件
    this.onConnectEnd.emit(eventData);
    
    // 如果有連接，處理連接邏輯
    if (eventData.connection) {
      this._flowService.onConnect(eventData.connection);
      this.onConnect.emit(eventData.connection);
      
      // 新edge建立後立即觸發onEdgesChange以支持controlled模式
      // 這在controlled/uncontrolled混合模式下會加劇狀態衝突問題
      const updatedEdges = this._flowService.edges();
      this.onEdgesChange.emit(updatedEdges);
    }
  }

  // 公開方法來獲取流程實例
  getFlow(): AngularXYFlowInstance<NodeType, EdgeType> {
    return this.flowInstance;
  }

  // PanZoom 相關公開方法
  setViewport(viewport: Viewport, options?: { duration?: number }): void {
    this._panZoomService.setViewport(viewport, options);
  }

  getViewport(): Viewport {
    return this._panZoomService.getViewport();
  }

  performFitView(options?: any): void {
    this._panZoomService.fitView(options);
  }

  zoomIn(): void {
    this._panZoomService.zoomIn();
  }

  zoomOut(): void {
    this._panZoomService.zoomOut();
  }

  resetViewport(): void {
    this._panZoomService.resetViewport();
  }

  // 座標轉換方法
  screenToFlowPosition(clientPosition: { x: number; y: number }): { x: number; y: number } {
    return this._flowService.screenToFlow(clientPosition);
  }

  // 獲取標記 ID - 供子元件使用
  getMarkerId = (
    _edge: any,
    position: 'start' | 'end',
    marker: EdgeMarker
  ): string => {
    const type = marker.type || MarkerType.ArrowClosed;
    const color = (marker.color || '#b1b1b7').replace('#', '');
    return `angular-xyflow__marker-${position}-${type}-${color}`;
  };

  // handleClick 包裝方法
  handleViewportHandleClick(event: { event: MouseEvent; nodeId: string; handleId?: string; handleType: string }) {
    this.handleHandleClick(
      event.event,
      event.nodeId,
      event.handleId,
      event.handleType as 'source' | 'target'
    );
  }




  // 連接控制方法
  cancelConnection(): void {
    this._flowService.cancelConnection();
  }

  // 全域鍵盤事件處理 - ESC 鍵取消選擇或連接
  @HostListener('document:keydown', ['$event'])
  onDocumentKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      // 優先處理連接狀態
      const connectionState = this._flowService.connectionState();
      if (connectionState.inProgress) {
        event.preventDefault();
        this.cancelConnection();
        return;
      }

      // 處理選擇狀態 - 在controlled模式下檢查視圖狀態而不僅是服務狀態
      const selectedNodeIds = this._flowService.selectedNodes();
      const selectedEdgeIds = this._flowService.selectedEdges();
      
      // 檢查視圖中的選中狀態（controlled模式下更可靠）
      const visibleSelectedNodes = this.visibleNodes().filter(n => n.selected);
      const visibleSelectedEdges = this.visibleEdges().filter(e => e.selected);
      
      // 檢查是否有元素被選中（服務狀態 OR 視圖狀態）
      const hasSelectedElements = selectedNodeIds.length > 0 || selectedEdgeIds.length > 0 || 
                                  visibleSelectedNodes.length > 0 || visibleSelectedEdges.length > 0;
      
      if (hasSelectedElements) {
        event.preventDefault();
        
        // 清除DOM focus狀態（解決controlled模式下的focus殘留問題）
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
          activeElement.blur();
        }
        
        this._flowService.clearSelection();
        
        // 觸發狀態變化事件（controlled 模式需要）
        const updatedNodes = this._flowService.nodes();
        const updatedEdges = this._flowService.edges();
        this.onNodesChange.emit(updatedNodes);
        this.onEdgesChange.emit(updatedEdges);
      }
    }
  }
}
