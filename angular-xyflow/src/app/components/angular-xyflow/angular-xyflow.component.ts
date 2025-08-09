// Angular 核心模組
import {
  Component,
  input,
  output,
  viewChild,
  contentChild,
  contentChildren,
  effect,
  signal,
  computed,
  afterNextRender,
  afterEveryRender,
  ElementRef,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
  HostListener,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// XyFlow 系統模組
import {
  type Connection,
  Position,
  getEdgePosition,
  ConnectionMode,
  ColorMode,
  ColorModeClass,
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
  NodeTypes,
  EdgeTypes,
  NodeChange,
  EdgeChange,
} from './types';
import { ConnectionLineTemplateDirective } from './connection-line-template.directive';
import { NodeTemplateDirective } from './node-template.directive';
import { ViewportComponent } from './viewport/viewport.component';

@Component({
  selector: 'angular-xyflow',
  standalone: true,
  imports: [CommonModule, ViewportComponent],
  providers: [
    AngularXYFlowService,
    AngularXYFlowDragService,
    AngularXYFlowPanZoomService,
  ],
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
      (click)="handlePaneClick($event)"
      (dblclick)="handlePaneDoubleClick($event)"
      (contextmenu)="handlePaneContextMenu($event)"
    >
      <!-- Viewport container -->
      <angular-xyflow-viewport
        #viewport
        [viewportTransform]="viewportTransform()"
        [visibleNodes]="visibleNodes()"
        [visibleEdges]="visibleEdges()"
        [connectionInProgress]="connectionInProgress()"
        [customConnectionLineTemplate]="
          customConnectionLineTemplate()?.templateRef
        "
        [connectionLineStyle]="connectionLineStyle()"
        [customNodeTemplates]="customNodeTemplates()"
        [nodeTypes]="nodeTypes()"
        [edgeTypes]="edgeTypes()"
        [isDarkMode]="colorModeClass() === 'dark'"
        [defaultMarkerColor]="defaultMarkerColor()"
        [rfId]="id()"
        [defaultMarkerStart]="defaultEdgeOptions()?.markerStart"
        [defaultMarkerEnd]="defaultEdgeOptions()?.markerEnd"
        [getNodeById]="getNodeById.bind(this)"
        [getEdgeConnectionPoints]="getEdgeConnectionPoints.bind(this)"
        [getMarkerId]="getMarkerId.bind(this)"
        (nodeClick)="handleNodeClick($event.event, $event.node)"
        (nodeDoubleClick)="handleNodeDoubleClick($event.event, $event.node)"
        (nodeContextMenu)="handleNodeContextMenu($event.event, $event.node)"
        (nodeFocus)="handleNodeFocus($event.event, $event.node)"
        (nodeDragStart)="handleNodeDragStart($event.event, $event.node)"
        (nodeDrag)="handleNodeDrag($event, $event.node)"
        (nodeDragStop)="handleNodeDragStop($event.event, $event.node)"
        (connectStart)="handleConnectStart($event.event, $event.node)"
        (connectEnd)="handleConnectEnd($event)"
        (handleClick)="handleViewportHandleClick($event)"
        (edgeClick)="handleEdgeClick($event.event, $event.edge)"
        (edgeDoubleClick)="handleEdgeDoubleClick($event.event, $event.edge)"
        (edgeContextMenu)="handleEdgeContextMenu($event.event, $event.edge)"
        (edgeFocus)="handleEdgeFocus($event.event, $event.edge)"
        (edgeKeyDown)="handleEdgeKeyDown($event.event, $event.edge)"
      />
      <!-- Viewport portal content projection - rendered as overlay -->
      <div
        class="angular-xyflow__viewport-portal"
        [style.transform]="viewportTransform()"
      >
        <ng-content select="[viewportPortal]"></ng-content>
      </div>
      <!-- Content projection for background, controls, etc. -->
      <ng-content />
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      .angular-xyflow {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
      }

      .xy-flow {
        background-color: var(
          --xy-background-color,
          var(--xy-background-color-default)
        );
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

      .angular-xyflow__viewport-portal {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        transform-origin: 0 0;
        z-index: 10;
      }

      .angular-xyflow__viewport-portal > * {
        pointer-events: none;
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
      .angular-xyflow__edge.selectable:focus-visible
        .angular-xyflow__edge-path {
        stroke: #555;
        stroke-width: 2;
      }

      /* Dark mode edge selected/focus color */
      .dark .angular-xyflow__edge-path.selected,
      .dark .angular-xyflow__edge.selectable:focus .angular-xyflow__edge-path,
      .dark
        .angular-xyflow__edge.selectable:focus-visible
        .angular-xyflow__edge-path {
        stroke: #727272;
        stroke-width: 2;
      }

      .angular-xyflow__edge.animated path {
        stroke-dasharray: 5;
        animation: dashdraw 0.5s linear infinite;
      }

      /* 針對交互路徑禁用動畫（與 React 版本保持一致） */
      .angular-xyflow__edge.animated path.angular-xyflow__edge-interaction {
        stroke-dasharray: none;
        animation: none;
      }

      @keyframes dashdraw {
        from {
          stroke-dashoffset: 10;
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
  // 自定義節點模板
  customNodeTemplates = contentChildren(NodeTemplateDirective);

  // 輸入信號
  id = input<string>();
  defaultNodes = input<NodeType[]>([]);
  defaultEdges = input<EdgeType[]>([]);
  nodes = input<NodeType[]>();
  edges = input<EdgeType[]>();
  nodeTypes = input<NodeTypes>();
  edgeTypes = input<EdgeTypes>();
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
  panOnDrag = input<boolean | number[]>(true);
  colorMode = input<ColorMode>('light');
  paneClickDistance = input<number>(0);
  connectionLineStyle = input<Record<string, any>>();
  edgesFocusable = input<boolean>(true);
  defaultMarkerColor = input<string>('#b1b1b7');

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
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return mode as ColorModeClass;
  });

  // 計算最終的類別字符串
  finalClasses = computed(() => {
    return (
      'xy-flow angular-xyflow angular-xyflow__pane ' +
      this.className() +
      ' ' +
      this.viewportCursorClass() +
      ' ' +
      this.colorModeClass()
    );
  });

  // 輸出事件
  onNodesChange = output<NodeChange<NodeType>[]>();
  onEdgesChange = output<EdgeChange<EdgeType>[]>();
  onConnect = output<Connection>();
  onConnectStart = output<{
    event: MouseEvent;
    nodeId: string;
    handleType: 'source' | 'target';
    handleId?: string;
  }>();
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

  // 視窗移動事件
  onMove = output<{
    event?: MouseEvent | TouchEvent | null;
    viewport: Viewport;
  }>();
  onMoveStart = output<{
    event?: MouseEvent | TouchEvent | null;
    viewport: Viewport;
  }>();
  onMoveEnd = output<{
    event?: MouseEvent | TouchEvent | null;
    viewport: Viewport;
  }>();

  // 選擇變化事件
  onSelectionChange = output<{ nodes: NodeType[]; edges: EdgeType[] }>();

  // 節點鼠標事件
  onNodeDoubleClick = output<{ event: MouseEvent; node: NodeType }>();
  onNodeContextMenu = output<{ event: MouseEvent; node: NodeType }>();

  // 邊線鼠標事件
  onEdgeDoubleClick = output<{ event: MouseEvent; edge: EdgeType }>();
  onEdgeContextMenu = output<{ event: MouseEvent; edge: EdgeType }>();

  // 背景事件
  onPaneContextMenu = output<{ event: MouseEvent }>();

  // 初始化事件
  onInit = output<{
    nodes: NodeType[];
    edges: EdgeType[];
    viewport: Viewport;
  }>();

  // 視圖子元素
  flowContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('flowContainer');
  viewportComponent = viewChild.required<ViewportComponent>('viewport');

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
  private _resizeObserver?: ResizeObserver;
  private _windowResizeHandler?: () => void;
  private _resizeObserverInitialized = signal(false);
  markerType = MarkerType;

  // 計算信號
  visibleNodes = computed(() => {
    const controlledNodes = this.nodes();
    const serviceNodes = this._flowService.nodes();
    const initialized = this._flowService.initialized();

    // 如果提供了 controlled nodes（即使是空陣列），就使用它們
    if (controlledNodes !== undefined) {
      return controlledNodes;
    }

    // 在 uncontrolled 模式下：
    // - 如果服務已初始化，使用服務內部狀態（允許動態更新）
    // - 如果服務未初始化，使用 defaultNodes 作為初始值
    if (initialized) {
      return serviceNodes;
    } else {
      return this.defaultNodes();
    }
  });

  visibleEdges = computed(() => {
    const controlledEdges = this.edges();
    const serviceEdges = this._flowService.edges();
    const initialized = this._flowService.initialized();
    const defaultOptions = this.defaultEdgeOptions();

    let result: EdgeType[];

    // 如果提供了 controlled edges（即使是空陣列），就使用它們
    if (controlledEdges !== undefined) {
      result = controlledEdges;
    } else {
      // 在 uncontrolled 模式下：
      // - 如果服務已初始化，使用服務內部狀態（允許動態更新）
      // - 如果服務未初始化，使用 defaultEdges 作為初始值
      if (initialized) {
        result = serviceEdges;
      } else {
        result = this.defaultEdges();
      }
    }

    // 應用 defaultEdgeOptions 到所有邊
    if (defaultOptions) {
      result = result.map((edge) => ({
        ...defaultOptions,
        ...edge,
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
      return isDragging
        ? 'angular-xyflow__pane--dragging'
        : 'angular-xyflow__pane--draggable';
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

  // 邊線標記相關計算 - 現在由 MarkerDefinitions 組件內部處理

  constructor() {
    // 設置 controlled/uncontrolled 模式標誌（與 React Flow 邏輯一致）
    effect(() => {
      const defaultNodes = this.defaultNodes();
      const defaultEdges = this.defaultEdges();

      // React Flow 邏輯：只要提供了 defaultNodes/defaultEdges 就是 uncontrolled 模式
      const hasDefaultNodes = defaultNodes && defaultNodes.length > 0;
      const hasDefaultEdges = defaultEdges && defaultEdges.length > 0;

      this._flowService.setHasDefaultNodes(hasDefaultNodes);
      this._flowService.setHasDefaultEdges(hasDefaultEdges);
    });

    // 設置 nodeOrigin
    effect(() => {
      const origin = this.nodeOrigin();
      this._flowService.setNodeOrigin(origin);
    });

    // 設置事件回調
    this._flowService.setOnNodesChange((nodes) => {
      this.onNodesChange.emit(nodes);
    });

    this._flowService.setOnEdgesChange((edges) => {
      this.onEdgesChange.emit(edges);
    });

    this._flowService.setOnConnect((connection) => {
      this.onConnect.emit(connection);
    });

    this._flowService.setOnConnectStart((data) => {
      this.onConnectStart.emit(data);
    });

    this._flowService.setOnConnectEnd((data) => {
      this.onConnectEnd.emit(data);
    });

    this._flowService.setOnSelectionChange((data) => {
      this.onSelectionChange.emit(data);
    });

    // 設置視窗移動事件回調
    this._panZoomService.setOnMoveStart((data) => {
      this.onMoveStart.emit({
        event: data.event,
        viewport: this._flowService.viewport(),
      });
    });

    this._panZoomService.setOnMove((data) => {
      this.onMove.emit({
        event: data.event,
        viewport: this._flowService.viewport(),
      });
    });

    this._panZoomService.setOnMoveEnd((data) => {
      this.onMoveEnd.emit({
        event: data.event,
        viewport: this._flowService.viewport(),
      });
    });

    // 監聽輸入變化的副作用
    effect(() => {
      const defaultNodes = this.defaultNodes();
      const defaultEdges = this.defaultEdges();
      const controlledNodes = this.nodes();
      const controlledEdges = this.edges();

      // 優先使用 controlled（即使是空數組），只有在 undefined 時才使用 default
      // 與 React Flow 的邏輯一致：controlled 模式下即使是空數組也要使用
      const nodes =
        controlledNodes !== undefined ? controlledNodes : defaultNodes;
      const edges =
        controlledEdges !== undefined ? controlledEdges : defaultEdges;

      // 在 controlled 模式下，即使是空數組也要同步
      const isControlled =
        controlledNodes !== undefined || controlledEdges !== undefined;

      // 確保容器已初始化
      if (this.flowContainer()) {
        if (!this._flowService.containerElement) {
          // 首次初始化
          this._flowService.initialize(this.flowContainer().nativeElement, {
            nodes: nodes,
            edges: edges,
            minZoom: this.minZoom(),
            maxZoom: this.maxZoom(),
            selectNodesOnDrag: this.selectNodesOnDrag(),
            autoPanOnNodeFocus: this.autoPanOnNodeFocus(),
          });
        } else if (isControlled) {
          // Controlled 模式：同步狀態
          if (controlledNodes !== undefined) {
            this._flowService.syncNodesFromControlled(controlledNodes);
          }
          if (controlledEdges !== undefined) {
            this._flowService.syncEdgesFromControlled(controlledEdges);
          }
        }
      }
    });

    // 監聽初始化完成並觸發 onInit 事件
    let hasEmittedInit = false;
    effect(() => {
      const initialized = this._flowService.initialized();

      // 只在第一次初始化完成時觸發 onInit 事件
      if (initialized && !hasEmittedInit) {
        hasEmittedInit = true;

        // 獲取當前狀態
        const nodes = this.visibleNodes();
        const edges = this.visibleEdges();
        const viewport = this._flowService.viewport();

        // 觸發 onInit 事件
        this.onInit.emit({ nodes, edges, viewport });
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

    // 同步 edgesFocusable 到服務
    effect(() => {
      const edgesFocusable = this.edgesFocusable();
      this._flowService.setEdgesFocusable(edgesFocusable);
    });

    // 渲染後副作用 - 根據 Angular 20 最佳實踐
    // 雖然混合讀寫不是最佳實踐，但由於 TypeScript 類型推斷限制，暫時使用簡化版本

    // 首次渲染後的初始化操作
    afterNextRender(() => {
      // 測量容器尺寸並執行初始化
      const container = this.flowContainer()?.nativeElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      // 更新容器尺寸
      const currentSize = this._containerSize();
      if (
        Math.abs(rect.width - currentSize.width) > 1 ||
        Math.abs(rect.height - currentSize.height) > 1
      ) {
        this._containerSize.set({ width: rect.width, height: rect.height });
        this._flowService.setDimensions({
          width: rect.width,
          height: rect.height,
        });
      }

      // 設置 PanZoom（只初始化一次）
      if (!this._panZoomInitialized()) {
        this.setupPanZoomWithContainer(container);
      }

      // 設置 ResizeObserver（只初始化一次）
      if (!this._resizeObserverInitialized()) {
        this.setupResizeObserverForContainer(container);
      }

      // 處理初始 fitView
      this.safeHandleInitialFitView();
    });

    // 每次渲染後的尺寸檢查（用於響應容器變化）
    afterEveryRender(() => {
      // 跳過首次渲染（已由 afterNextRender 處理）
      if (!this._panZoomInitialized()) {
        return;
      }

      const container = this.flowContainer()?.nativeElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const currentSize = this._containerSize();

      // 只有在尺寸真正改變時才更新
      if (
        Math.abs(rect.width - currentSize.width) > 1 ||
        Math.abs(rect.height - currentSize.height) > 1
      ) {
        this._containerSize.set({ width: rect.width, height: rect.height });
        this._flowService.setDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    });
  }

  // 新增輔助方法，從原本的 safeSetupPanZoom 重構
  private setupPanZoomWithContainer(container: HTMLDivElement): void {
    this._panZoomService.initializePanZoom({
      domNode: container,
      minZoom: this.minZoom(),
      maxZoom: this.maxZoom(),
      zoomOnScroll: true,
      zoomOnPinch: true,
      panOnScroll: false,
      panOnScrollSpeed: 0.5,
      zoomOnDoubleClick: true,
      panOnDrag: this.panOnDrag(),
      preventScrolling: true,
      paneClickDistance: this.paneClickDistance(),
      defaultViewport: { x: 0, y: 0, zoom: 1 },
    });

    const panZoomInstance = this._panZoomService.getPanZoomInstance();
    if (panZoomInstance) {
      this._flowService.setPanZoom(panZoomInstance);
    }

    this._panZoomInitialized.set(true);
  }

  // 新增輔助方法，從原本的 safeSetupResizeObserver 重構
  private setupResizeObserverForContainer(container: HTMLDivElement): void {
    const updateDimensions = () => {
      if (!container) {
        return false;
      }

      const rect = container.getBoundingClientRect();
      const size = { width: rect.width, height: rect.height };

      if (size.height === 0 || size.width === 0) {
        console.warn(
          'Angular XYFlow: Container dimensions are zero, this might affect the minimap and other functionality'
        );
      }

      untracked(() => {
        this._flowService.setDimensions({
          width: size.width || 500,
          height: size.height || 500,
        });

        this._containerSize.set({
          width: size.width || 500,
          height: size.height || 500,
        });
      });

      return true;
    };

    // 立即更新一次尺寸
    updateDimensions();

    // 設置 window resize listener
    this._windowResizeHandler = updateDimensions;
    window.addEventListener('resize', this._windowResizeHandler);

    // 設置 ResizeObserver
    this._resizeObserver = new ResizeObserver(() => updateDimensions());
    this._resizeObserver.observe(container);

    this._resizeObserverInitialized.set(true);
  }

  // 生成唯一 ID 的私有方法
  private generateUniqueId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  ngOnDestroy() {
    // 清理 ResizeObserver 和 window resize listener
    this.cleanupResizeObserver();

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
      this._flowService.setDimensions({
        width: rect.width,
        height: rect.height,
      });
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

  // 安全處理初始 fit view - 只執行一次，僅基於初始提供的節點
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

    // 【關鍵修正】檢查初始提供的節點，支持 controlled 和 uncontrolled 模式
    // 在 controlled 模式下使用 nodes()，在 uncontrolled 模式下使用 defaultNodes()
    const controlledNodes = this.nodes();
    const defaultNodes = this.defaultNodes();
    const initialNodes =
      controlledNodes && controlledNodes.length > 0
        ? controlledNodes
        : defaultNodes;

    if (initialNodes.length === 0) {
      // 如果沒有初始節點但設置了 fitView，標記為已處理以避免後續自動觸發
      // 這樣保持與 React Flow 的行為一致：fitView 只基於初始節點，不會因動態添加節點而觸發
      this._initialFitViewExecuted.set(true);
      return;
    }

    // 確保 PanZoom 已初始化
    if (!this._panZoomInitialized()) {
      return; // 等待 PanZoom 初始化完成
    }

    // 延遲執行 fitView 以確保節點已完全測量
    // 使用 requestAnimationFrame 來確保在下一個渲染週期執行
    requestAnimationFrame(() => {
      // 再次檢查以避免重複執行
      if (!this._initialFitViewExecuted()) {
        // console.log('📐 Executing initial fitView');
        this.performFitView(this.fitViewOptions());
        this._initialFitViewExecuted.set(true);
      }
    });
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

      // 模仿 React Flow 的邏輯：
      // 1. 優先使用 internals 中的 handleBounds（來自 DOM 測量）
      // 2. 如果沒有，嘗試從 DOM 測量
      // 3. 如果 DOM 不存在，使用快取的值

      let handleBounds = internals?.handleBounds;

      if (!handleBounds) {
        // 嘗試從 DOM 測量
        const measuredBounds = this._flowService.measureNodeHandleBounds(
          node.id
        );

        // 如果測量成功且有內容，更新快取
        if (
          measuredBounds &&
          (measuredBounds.source?.length > 0 ||
            measuredBounds.target?.length > 0)
        ) {
          this._flowService.setNodeHandleBounds(node.id, measuredBounds);
          handleBounds = measuredBounds;
        } else {
          // 測量失敗，使用快取
          const cachedBounds = this._flowService.getNodeHandleBounds(node.id);
          if (cachedBounds) {
            handleBounds = cachedBounds;
          } else {
            handleBounds = undefined;
          }
        }
      }

      return {
        ...node,
        internals: {
          positionAbsolute: internals?.positionAbsolute || {
            x: node.position.x,
            y: node.position.y,
          },
          handleBounds,
        },
        measured: internals?.measured || {
          width: node.width || 150,
          height: node.height || 40,
        },
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
      onError: (id, message) =>
        console.warn(`Edge position error ${id}:`, message),
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
      const nodePos = internals?.positionAbsolute || {
        x: node.position.x,
        y: node.position.y,
      };
      const measured = internals?.measured || {
        width: node.width || 150,
        height: node.height || 40,
      };

      switch (position) {
        case Position.Top:
          return { x: nodePos.x + measured.width / 2, y: nodePos.y };
        case Position.Bottom:
          return {
            x: nodePos.x + measured.width / 2,
            y: nodePos.y + measured.height,
          };
        case Position.Left:
          return { x: nodePos.x, y: nodePos.y + measured.height / 2 };
        case Position.Right:
          return {
            x: nodePos.x + measured.width,
            y: nodePos.y + measured.height / 2,
          };
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

    this.onNodeClick.emit({ event, node });
  }

  handleNodeDoubleClick(event: MouseEvent, node: NodeType) {
    // 阻止事件冒泡，避免觸發背景雙擊
    event.stopPropagation();

    this.onNodeDoubleClick.emit({ event, node });
  }

  handleNodeContextMenu(event: MouseEvent, node: NodeType) {
    // 阻止事件冒泡，避免觸發背景右鍵菜單
    event.stopPropagation();

    this.onNodeContextMenu.emit({ event, node });
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

    // 觸發 edge 點擊事件
    this.onEdgeClick.emit({ event, edge });
  }

  handleEdgeDoubleClick(event: MouseEvent, edge: EdgeType) {
    // 阻止事件冒泡，避免觸發背景雙擊
    event.stopPropagation();

    this.onEdgeDoubleClick.emit({ event, edge });
  }

  handleEdgeContextMenu(event: MouseEvent, edge: EdgeType) {
    // 阻止事件冒泡，避免觸發背景右鍵菜單
    event.stopPropagation();

    this.onEdgeContextMenu.emit({ event, edge });
  }

  handleEdgeFocus(_event: FocusEvent, edge: EdgeType) {
    // 檢查是否允許選取元素
    if (!this._flowService.elementsSelectable()) {
      return;
    }

    // Focus時自動選擇edge（類似React版本的行為）
    this._flowService.selectEdge(edge.id, false);
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

      // 發出 pane 點擊事件
      this.onPaneClick.emit({ event });
    }
  }

  handlePaneContextMenu(event: MouseEvent) {
    // 只有當右鍵點擊的是背景元素時才觸發右鍵菜單事件
    const target = event.target as HTMLElement;

    // 檢查點擊的是否是背景元素
    if (
      target.classList.contains('angular-xyflow') ||
      target.classList.contains('xy-flow') ||
      target.classList.contains('angular-xyflow__viewport') ||
      target.classList.contains('xy-flow__viewport')
    ) {
      const panOnDragConfig = this.panOnDrag();

      // React Flow 邏輯：只有當 panOnDrag 包含右鍵（2）時才阻止預設右鍵菜單
      if (Array.isArray(panOnDragConfig) && panOnDragConfig.includes(2)) {
        event.preventDefault();
        return;
      }

      // 發出 pane 右鍵菜單事件（不阻止預設行為，除非明確配置）
      this.onPaneContextMenu.emit({ event });
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

  handleNodeDrag(
    dragData: { event: MouseEvent; position: { x: number; y: number } },
    node: NodeType
  ) {
    const nodes = this.visibleNodes();
    // 創建一個包含最新位置的節點副本
    const updatedNode = {
      ...node,
      position: dragData.position,
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
    const controlsElement = flowContainer.querySelector(
      '.angular-xyflow__controls'
    );
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
      handleId: undefined, // 實際可能需要從事件中獲取
    });
  }

  handleConnectEnd(eventData: { connection?: Connection; event: MouseEvent }) {
    // 發出連接結束事件 - 無論是否有連接都要發出（這是關鍵！）
    this.onConnectEnd.emit(eventData);

    // 如果有連接，處理連接邏輯
    if (eventData.connection) {
      // 先發出 onConnect 事件給父組件，讓父組件有機會處理
      this.onConnect.emit(eventData.connection);

      // 檢查是否在 controlled 模式 - 與 React Flow 邏輯一致
      const isControlled =
        !this._flowService.hasDefaultNodes() &&
        !this._flowService.hasDefaultEdges();

      if (isControlled) {
        // 在 controlled 模式下，只發出事件，不自動創建連接
        // 完全依賴父組件處理 onConnect 事件
        return;
      }

      // 在 uncontrolled 模式下，檢查父組件是否已經處理了 edges
      const currentEdgeCount = this._flowService.edges().length;

      // 使用 setTimeout 確保父組件的事件處理完成後再檢查
      setTimeout(() => {
        const newEdgeCount = this._flowService.edges().length;

        // 如果父組件沒有添加新的 edge，則使用默認邏輯創建
        if (newEdgeCount === currentEdgeCount) {
          this._flowService.onConnect(eventData.connection!);
        }
      }, 0);
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
  screenToFlowPosition(clientPosition: { x: number; y: number }): {
    x: number;
    y: number;
  } {
    return this._flowService.screenToFlow(clientPosition);
  }

  // 獲取標記 ID - 供子元件使用（使用與 @xyflow/system 相同的邏輯）
  getMarkerId = (
    _edge: any,
    _position: 'start' | 'end',
    marker: EdgeMarker | string
  ): string => {
    if (!marker) {
      return '';
    }

    if (typeof marker === 'string') {
      return marker;
    }

    // 使用與 MarkerDefinitionsComponent 相同的邏輯
    const rfId = this.id();
    const idPrefix = rfId ? `${rfId}__` : '';

    return `${idPrefix}${Object.keys(marker)
      .sort()
      .map((key) => `${key}=${marker[key as keyof EdgeMarker]}`)
      .join('&')}`;
  };

  // handleClick 包裝方法
  handleViewportHandleClick(event: {
    event: MouseEvent;
    nodeId: string;
    handleId?: string;
    handleType: string;
  }) {
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
      const visibleSelectedNodes = this.visibleNodes().filter(
        (n) => n.selected
      );
      const visibleSelectedEdges = this.visibleEdges().filter(
        (e) => e.selected
      );

      // 檢查是否有元素被選中（服務狀態 OR 視圖狀態）
      const hasSelectedElements =
        selectedNodeIds.length > 0 ||
        selectedEdgeIds.length > 0 ||
        visibleSelectedNodes.length > 0 ||
        visibleSelectedEdges.length > 0;

      if (hasSelectedElements) {
        event.preventDefault();

        // 清除DOM focus狀態（解決controlled模式下的focus殘留問題）
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
          activeElement.blur();
        }

        this._flowService.clearSelection();
      }
    }
  }

  // 安全設置 ResizeObserver 和 window resize listener - 與 React useResizeHandler 一致的實現
  private safeSetupResizeObserver() {
    // 如果已經初始化過，則跳過
    if (this._resizeObserverInitialized()) {
      return;
    }

    const container = this.flowContainer()?.nativeElement;
    if (!container) {
      return;
    }

    // 創建 updateDimensions 函數 - 與 React 版本一致
    const updateDimensions = () => {
      if (!container) {
        return false;
      }

      const rect = container.getBoundingClientRect();
      const size = { width: rect.width, height: rect.height };

      // 與 React 版本一致的錯誤處理
      if (size.height === 0 || size.width === 0) {
        console.warn(
          'Angular XYFlow: Container dimensions are zero, this might affect the minimap and other functionality'
        );
      }

      // 使用 untracked 避免在 resize 過程中觸發變更偵測循環
      untracked(() => {
        // 更新服務的尺寸 - 與 React store.setState({ width, height }) 等效
        this._flowService.setDimensions({
          width: size.width || 500,
          height: size.height || 500,
        });

        // 同時更新本地信號
        this._containerSize.set({
          width: size.width || 500,
          height: size.height || 500,
        });
      });

      return true;
    };

    // 立即更新一次尺寸
    updateDimensions();

    // 設置 window resize listener - 與 React 版本一致
    this._windowResizeHandler = updateDimensions;
    window.addEventListener('resize', this._windowResizeHandler);

    // 設置 ResizeObserver - 與 React 版本一致
    this._resizeObserver = new ResizeObserver(() => updateDimensions());
    this._resizeObserver.observe(container);

    // 標記為已初始化
    this._resizeObserverInitialized.set(true);
  }

  // 清理 ResizeObserver 和 window resize listener
  private cleanupResizeObserver() {
    // 清理 window resize listener
    if (this._windowResizeHandler) {
      window.removeEventListener('resize', this._windowResizeHandler);
      this._windowResizeHandler = undefined;
    }

    // 清理 ResizeObserver
    if (this._resizeObserver) {
      const container = this.flowContainer()?.nativeElement;
      if (container) {
        this._resizeObserver.unobserve(container);
      }
      this._resizeObserver.disconnect();
      this._resizeObserver = undefined;
    }

    // 重置初始化標記
    this._resizeObserverInitialized.set(false);
  }
}
