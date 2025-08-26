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
  ViewContainerRef,
  ComponentRef,
  EmbeddedViewRef,
  TemplateRef,
  Injector,
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
  PanOnScrollMode,
} from '@xyflow/system';

// 專案內部模組
import { AngularXYFlowService } from '../../services/angular-xyflow.service';
import { AngularXYFlowDragService } from '../../services/drag.service';
import { AngularXYFlowPanZoomService } from '../../services/panzoom.service';
import { EdgeLabelRendererService } from '../../services/edge-label-renderer.service';
import { KeyboardService } from '../../services/keyboard.service';
import { SelectionService } from '../../services/selection.service';
import { ViewportPortalService } from '../../services/viewport-portal.service';
import { PaneComponent } from '../pane/pane.component';
import { NodesSelectionComponent } from '../nodes-selection/nodes-selection.component';
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
  SelectionMode,
  ZoomActivationKeyCode,
  MultiSelectionKeyCode,
  SelectionKeyCode,
  SelectionContextMenuEvent,
  SelectionChangeEvent,
  SelectionStartEvent,
  SelectionEndEvent,
} from '../../types';
import { ConnectionLineTemplateDirective } from '../../directives/connection-line-template.directive';
import { NodeTemplateDirective } from '../../directives/node-template.directive';
import { ViewportComponent } from '../viewport/viewport.component';

@Component({
  selector: 'angular-xyflow',
  standalone: true,
  imports: [CommonModule, ViewportComponent, PaneComponent, NodesSelectionComponent],
  providers: [
    AngularXYFlowService,
    AngularXYFlowDragService,
    AngularXYFlowPanZoomService,
    SelectionService,
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
    >
      <!-- Pane container - 處理選取事件，與 React 版本一致 -->
      <angular-xyflow-pane
        [isSelectionActive]="isSelectionActive()"
        [panOnDrag]="panOnDrag()"
        [isDragging]="false"
        [elementsSelectable]="elementsSelectable()"
        [selectionKeyPressed]="false"
        [selectionOnDrag]="selectionOnDrag()"
        [paneClickDistance]="paneClickDistance()"
        [captureOnPaneClick]="captureOnPaneClick()"
        [captureOnPaneScroll]="captureOnPaneScroll()"
        (onPaneClick)="handlePaneClick($event)"
        (onPaneDoubleClick)="handlePaneDoubleClick($event)"
        (onPaneContextMenu)="handlePaneContextMenu($event)"
        (onPaneScroll)="handlePaneScroll($event)"
        (onSelectionStart)="handleSelectionStart($event)"
        (onSelectionEnd)="handleSelectionEnd($event)"
        (onSelectionContextMenu)="handleSelectionContextMenu($event)"
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

        <!-- NodesSelection - 選中多個節點時顯示的邊界框 -->
        <angular-xyflow-nodes-selection />
      </angular-xyflow-pane>
      <!-- Edge Label Renderer container - 獨立的 HTML 層用於渲染邊標籤 -->
      <div
        #edgeLabelRendererContainer
        class="angular-xyflow__edgelabel-renderer"
        [style.position]="'absolute'"
        [style.width]="'100%'"
        [style.height]="'100%'"
        [style.pointer-events]="'none'"
        [style.z-index]="'1000'"
        [style.transform-origin]="'0 0'"
      >
        <ng-container #edgeLabelContainer></ng-container>
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

      /* 🔑 多重選擇器保障：確保選中狀態樣式能正確應用到所有可能的 DOM 結構 */
      .angular-xyflow__edge-path.selected,
      .angular-xyflow__edge.selected .angular-xyflow__edge-path,
      .angular-xyflow__edge.selectable:focus .angular-xyflow__edge-path,
      .angular-xyflow__edge.selectable:focus-visible .angular-xyflow__edge-path,
      angular-xyflow-edge-wrapper.selected .angular-xyflow__edge-path,
      .selected .angular-xyflow__edge-path {
        stroke: #555 !important;
        stroke-width: 2 !important;
      }

      /* 🔑 暗模式多重選擇器保障 */
      .dark .angular-xyflow__edge-path.selected,
      .dark .angular-xyflow__edge.selected .angular-xyflow__edge-path,
      .dark .angular-xyflow__edge.selectable:focus .angular-xyflow__edge-path,
      .dark .angular-xyflow__edge.selectable:focus-visible .angular-xyflow__edge-path,
      .dark angular-xyflow-edge-wrapper.selected .angular-xyflow__edge-path,
      .dark .selected .angular-xyflow__edge-path {
        stroke: #727272 !important;
        stroke-width: 2 !important;
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

      /* Edge text wrapper - 與 React 版本保持一致 */
      .angular-xyflow__edge-textwrapper {
        pointer-events: all;
      }

      .angular-xyflow__edge-text {
        pointer-events: none;
        user-select: none;
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
  private _edgeLabelService = inject(EdgeLabelRendererService);
  private _keyboardService = inject(KeyboardService);
  private _selectionService = inject(SelectionService<NodeType, EdgeType>);
  private _portalService = inject(ViewportPortalService);
  private _injector = inject(Injector);

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
  elevateNodesOnSelect = input<boolean>(true);
  defaultEdgeOptions = input<Partial<EdgeType>>();
  nodeDragThreshold = input<number>(0);
  autoPanOnNodeFocus = input<boolean>(true);
  panOnDrag = input<boolean | number[]>(true);
  colorMode = input<ColorMode>('light');
  paneClickDistance = input<number>(0);
  connectionLineStyle = input<Record<string, any>>();
  nodesFocusable = input<boolean>(true);
  edgesFocusable = input<boolean>(true);
  defaultMarkerColor = input<string>('#b1b1b7');
  snapToGrid = input<boolean>(false);
  snapGrid = input<[number, number]>([15, 15]);
  elementsSelectable = input<boolean>(true);
  nodesDraggable = input<boolean>(true);
  nodesConnectable = input<boolean>(true);
  connectOnClick = input<boolean>(true);
  connectionMode = input<ConnectionMode>(ConnectionMode.Strict);

  // 新增高級交互功能的輸入屬性
  selectionOnDrag = input<boolean>(false);
  selectionMode = input<SelectionMode>('full' as SelectionMode);
  panOnScroll = input<boolean>(false);
  panOnScrollSpeed = input<number>(0.5);
  panOnScrollMode = input<PanOnScrollMode>(PanOnScrollMode.Free);
  zoomOnScroll = input<boolean>(true);
  zoomOnPinch = input<boolean>(true);
  zoomOnDoubleClick = input<boolean>(true);
  zoomActivationKeyCode = input<ZoomActivationKeyCode>();
  multiSelectionKeyCode = input<MultiSelectionKeyCode>();
  selectionKeyCode = input<SelectionKeyCode>('shift');
  
  // 🔑 捕獲事件輸入屬性 - 與 React Flow 完全對應
  captureElementClick = input<boolean>(false);
  captureOnPaneScroll = input<boolean>(true);
  
  // 🔑 事件處理器輸入 - 與 React Flow 完全對應
  onPaneClickHandler = input<((event: MouseEvent) => void) | undefined>(undefined);
  onNodeClickHandler = input<((data: { event: MouseEvent; node: NodeType }) => void) | undefined>(undefined);
  onEdgeClickHandler = input<((data: { event: MouseEvent; edge: EdgeType }) => void) | undefined>(undefined);
  onPaneScrollHandler = input<((event: WheelEvent) => void) | undefined>(undefined);

  // 🔑 計算是否捕獲事件 - 與 React Flow 完全一致的邏輯
  captureOnPaneClick = computed(() => this.onPaneClickHandler() !== undefined);

  // 選取相關計算屬性 - 與 React 版本完全一致
  isSelectionActive = computed(() => {
    // React 版本邏輯：
    // isSelecting = selectionKeyPressed || userSelectionActive || _selectionOnDrag
    const elementsSelectable = this.elementsSelectable();
    const selectionKeyPressed = this._keyboardService.isKeyPressed(this.selectionKeyCode());
    const userSelectionActive = this._selectionService.isSelectionActive();
    const _selectionOnDrag = this.selectionOnDrag() && this.panOnDrag() !== true;

    return elementsSelectable && (selectionKeyPressed || userSelectionActive || _selectionOnDrag);
  });

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
      'xy-flow angular-xyflow ' +
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
  onPaneScroll = output<{ event: WheelEvent }>();

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

  // 選擇相關事件
  onSelectionChange = output<{ nodes: NodeType[]; edges: EdgeType[] }>();
  onSelectionStart = output<SelectionStartEvent>();
  onSelectionEnd = output<SelectionEndEvent<NodeType, EdgeType>>();
  onSelectionContextMenu = output<SelectionContextMenuEvent<NodeType, EdgeType>>();

  // 節點鼠標事件
  onNodeDoubleClick = output<{ event: MouseEvent; node: NodeType }>();
  onNodeContextMenu = output<{ event: MouseEvent; node: NodeType }>();
  onNodeFocus = output<{ event: FocusEvent; node: NodeType }>();

  // 邊線鼠標事件
  onEdgeDoubleClick = output<{ event: MouseEvent; edge: EdgeType }>();
  onEdgeContextMenu = output<{ event: MouseEvent; edge: EdgeType }>();
  onEdgeFocus = output<{ event: FocusEvent; edge: EdgeType }>();

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
  edgeLabelContainer = viewChild('edgeLabelContainer', {
    read: ViewContainerRef,
  });
  edgeLabelRendererContainer = viewChild<ElementRef<HTMLDivElement>>(
    'edgeLabelRendererContainer'
  );

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
    const serviceNodesWithZ = this._flowService.nodesWithZ();
    const initialized = this._flowService.initialized();

    // 在 controlled 模式下，需要將用戶提供的節點與動態 z-index 計算結合
    if (controlledNodes !== undefined) {
      const selectedNodeIds = this._flowService.selectedNodes();
      const elevateOnSelect = this._flowService.elevateNodesOnSelect();
      
      // 🔑 關鍵修正：為 controlled nodes 應用完整的節點增強，確保包含邊緣計算所需的屬性
      return controlledNodes.map((node, index) => {
        // 獲取或創建節點的 internals 屬性
        const nodeInternals = this._flowService.getNodeInternals(node.id);
        const positionAbsolute = this._flowService.getNodePositionAbsolute(node.id);
        
        // 🔑 確保 measured 屬性總是存在且有效
        const defaultMeasured = { width: node.width || 150, height: node.height || 40 };
        const measured = nodeInternals?.measured || defaultMeasured;
        
        // 🔑 關鍵修正：確保 handles 配置使用最新的 position 值
        const handles = [
          { 
            id: 'default-source', 
            type: 'source', 
            position: node.sourcePosition || Position.Bottom,
            x: 0, y: 0 // 預設值，實際計算在 handleBounds 中
          },
          { 
            id: 'default-target', 
            type: 'target', 
            position: node.targetPosition || Position.Top,
            x: 0, y: 0 // 預設值，實際計算在 handleBounds 中
          }
        ];
        
        return {
          ...node,
          selected: selectedNodeIds.includes(node.id), // 同步選中狀態
          zIndex: this._flowService.calculateNodeZIndex(node, index, selectedNodeIds, elevateOnSelect),
          // 🔑 關鍵：添加邊緣計算所需的屬性，確保結構完整
          positionAbsolute: positionAbsolute || node.position,
          measured: measured, // 直接在節點層級添加 measured 屬性
          handles: handles, // 添加 handles 配置
          internals: {
            positionAbsolute: positionAbsolute || node.position,
            measured: measured,
            ...(nodeInternals || {})
          }
        };
      });
    }

    // 在 uncontrolled 模式下：
    // - 如果服務已初始化，使用帶有動態 z-index 的服務內部狀態
    // - 如果服務未初始化，使用 defaultNodes 作為初始值
    if (initialized) {
      return serviceNodesWithZ;
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
        // 確保 selected 狀態不被 defaultOptions 覆蓋
        selected: edge.selected
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
    // 初始化邊標籤容器
    afterNextRender(() => {
      const container = this.edgeLabelContainer();
      if (container) {
        this._edgeLabelService.setContainer(container);
      }
    });

    // 初始化 ViewportPortal 動態內容渲染 - 使用 ViewportComponent 中的容器
    afterNextRender(() => {
      const viewportComponent = this.viewportComponent();
      const dynamicContainer = viewportComponent.viewportPortalDynamic();
      if (dynamicContainer) {
        this._setupPortalRendering(dynamicContainer);
      }
    });

    // 手動更新 edge label renderer 容器的 transform
    // 使用 untracked 避免建立依賴關係，防止無限變更檢測
    afterEveryRender(() => {
      untracked(() => {
        const container = this.edgeLabelRendererContainer();
        if (container) {
          const viewport = this._flowService.viewport();
          const transform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`;
          container.nativeElement.style.transform = transform;
        }
      });
    });

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

    // 實時監聽鍵盤狀態，更新 multiSelectionActive（對應React版本的 useGlobalKeyHandler）
    effect(() => {
      const multiSelectionKeyCode = this.multiSelectionKeyCode();
      const customKeys = Array.isArray(multiSelectionKeyCode)
        ? multiSelectionKeyCode
        : multiSelectionKeyCode ? [multiSelectionKeyCode] : undefined;

      // multiSelectionActive 現在直接從鍵盤服務動態計算，不需要手動設置
      // const isActive = this._keyboardService.shouldUseMultiSelection(customKeys);
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

    // 同步 nodesFocusable 到服務
    effect(() => {
      const nodesFocusable = this.nodesFocusable();
      this._flowService.setNodesFocusable(nodesFocusable);
    });

    // 同步 edgesFocusable 到服務
    effect(() => {
      const edgesFocusable = this.edgesFocusable();
      this._flowService.setEdgesFocusable(edgesFocusable);
    });

    // 同步 elementsSelectable 到服務
    effect(() => {
      const elementsSelectable = this.elementsSelectable();
      this._flowService.setElementsSelectable(elementsSelectable);
    });

    // 同步 nodesDraggable 到服務
    effect(() => {
      const nodesDraggable = this.nodesDraggable();
      this._flowService.setNodesDraggable(nodesDraggable);
    });

    // 同步 nodesConnectable 到服務
    effect(() => {
      const nodesConnectable = this.nodesConnectable();
      this._flowService.setNodesConnectable(nodesConnectable);
    });

    // 同步 connectOnClick 到服務
    effect(() => {
      const connectOnClick = this.connectOnClick();
      this._flowService.setConnectOnClick(connectOnClick);
    });

    // 同步 connectionMode 到服務
    effect(() => {
      const connectionMode = this.connectionMode();
      this._flowService.setConnectionMode(connectionMode);
    });

    // 同步 snapToGrid 和 snapGrid 到服務
    effect(() => {
      const snapToGrid = this.snapToGrid();
      const snapGrid = this.snapGrid();
      this._flowService.setSnapToGrid(snapToGrid);
      this._flowService.setSnapGrid(snapGrid);
    });

    // 同步 defaultEdgeOptions 到服務
    effect(() => {
      const defaultEdgeOptions = this.defaultEdgeOptions();
      this._flowService.setDefaultEdgeOptions(defaultEdgeOptions);
    });

    // 監聽縮放激活按鍵狀態變化
    effect(() => {
      const zoomActivationKeyCode = this.zoomActivationKeyCode();
      const keyboardService = this._keyboardService;

      // 根據自定義按鍵或使用預設按鍵判斷是否應該激活縮放
      const shouldActivateZoom = zoomActivationKeyCode
        ? keyboardService.shouldActivateZoom(zoomActivationKeyCode)
        : keyboardService.shouldActivateZoom();

      // 更新 PanZoomService 的縮放激活狀態
      this._panZoomService.updateZoomActivationKeyPressed(shouldActivateZoom);
    });

    // 監聽 panOnScroll 屬性變化
    effect(() => {
      const panOnScroll = this.panOnScroll();
      this._panZoomService.updatePanOnScroll(panOnScroll);
    });

    // 監聽 panOnScrollSpeed 屬性變化
    effect(() => {
      const panOnScrollSpeed = this.panOnScrollSpeed();
      this._panZoomService.updatePanOnScrollSpeed(panOnScrollSpeed);
    });

    // 監聽 panOnScrollMode 屬性變化
    effect(() => {
      const panOnScrollMode = this.panOnScrollMode();
      this._panZoomService.updatePanOnScrollMode(panOnScrollMode);
    });

    // 監聽 zoomOnScroll 屬性變化
    effect(() => {
      const zoomOnScroll = this.zoomOnScroll();
      this._panZoomService.updateZoomOnScroll(zoomOnScroll);
    });

    // 監聽 zoomOnPinch 屬性變化
    effect(() => {
      const zoomOnPinch = this.zoomOnPinch();
      this._panZoomService.updateZoomOnPinch(zoomOnPinch);
    });

    // 監聽 zoomOnDoubleClick 屬性變化
    effect(() => {
      const zoomOnDoubleClick = this.zoomOnDoubleClick();
      this._panZoomService.updateZoomOnDoubleClick(zoomOnDoubleClick);
    });

    // 監聽 panOnDrag 屬性變化
    effect(() => {
      const panOnDrag = this.panOnDrag();
      this._panZoomService.updatePanOnDrag(panOnDrag);
    });

    // 監聽 multiSelectionKeyCode 屬性變化
    effect(() => {
      const multiSelectionKeyCode = this.multiSelectionKeyCode();
      this._dragService.setMultiSelectionKeyCode(multiSelectionKeyCode);
    });

    // 監聽選擇相關屬性變化並同步到 SelectionService
    effect(() => {
      const selectionMode = this.selectionMode();
      const selectionOnDrag = this.selectionOnDrag();
      const selectionKeyCode = this.selectionKeyCode();

      this._selectionService.setSelectionMode(selectionMode);
      this._selectionService.setSelectionOnDrag(selectionOnDrag);
      this._selectionService.setSelectionKeyCode(selectionKeyCode);
    });

    // 監聽用戶選擇狀態變化並同步到 PanZoom
    effect(() => {
      const userSelectionActive = this._flowService.userSelectionActive();
      this._panZoomService.updateUserSelectionActive(userSelectionActive);
    });

    // 監聽縮放激活按鍵狀態變化並同步到 PanZoom
    effect(() => {
      const zoomActivationKeyPressed = this._keyboardService.zoomActivationActive();
      this._panZoomService.updateZoomActivationKeyPressed(zoomActivationKeyPressed);
    });

    // SelectionService 事件回調現在由 PaneComponent 處理

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

      // SelectionService 現在由 PaneComponent 負責初始化

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
      zoomOnScroll: this.zoomOnScroll(),
      zoomOnPinch: this.zoomOnPinch(),
      panOnScroll: this.panOnScroll(),
      panOnScrollSpeed: this.panOnScrollSpeed(),
      zoomOnDoubleClick: this.zoomOnDoubleClick(),
      panOnDrag: this.panOnDrag(),
      preventScrolling: true,
      paneClickDistance: this.paneClickDistance(),
      defaultViewport: { x: 0, y: 0, zoom: 1 },
      onPaneContextMenu: (event: MouseEvent) => {
        this.onPaneContextMenu.emit({ event });
      },
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

  // ========================================
  // ViewportPortal 動態內容管理
  // ========================================

  // 動態內容渲染容器管理
  private _portalViewRefs = new Map<string, ComponentRef<any> | EmbeddedViewRef<any>>();

  /**
   * 設置 ViewportPortal 動態內容渲染
   * @param container ViewContainerRef 容器
   */
  private _setupPortalRendering(container: ViewContainerRef): void {
    // 監聽 portal 服務的活躍內容變化，使用 injector 選項
    effect(() => {
      const activeItems = this._portalService.activeItems();
      this._renderPortalItems(container, activeItems);
    }, { injector: this._injector });
  }

  /**
   * 渲染 portal 項目到容器
   * @param container ViewContainerRef 容器
   * @param items 要渲染的項目列表
   */
  private _renderPortalItems(container: ViewContainerRef, items: any[]): void {
    // 清除所有現有的動態內容
    this._clearPortalViews(container);

    // 渲染新的內容項目
    items.forEach((item) => {
      try {
        if (item.content instanceof TemplateRef) {
          // 渲染模板
          const viewRef = container.createEmbeddedView(item.content, {
            $implicit: item.data,
            data: item.data,
          });
          this._portalViewRefs.set(item.id, viewRef);
        } else if (typeof item.content === 'function') {
          // 渲染組件
          const componentRef = container.createComponent(item.content);
          
          // 如果組件有 data 屬性，設置數據
          if (item.data && componentRef.instance && typeof componentRef.instance === 'object' && 'data' in componentRef.instance) {
            (componentRef.instance as any).data = item.data;
          }

          this._portalViewRefs.set(item.id, componentRef);
        }
      } catch (error) {
        console.error('ViewportPortal 渲染錯誤:', error, item);
      }
    });

    // 手動觸發變更檢測（ViewContainerRef 沒有 detectChanges 方法，會由 Angular 自動檢測）
    // container.detectChanges?.();
  }

  /**
   * 清除所有 portal 視圖
   * @param container ViewContainerRef 容器
   */
  private _clearPortalViews(container: ViewContainerRef): void {
    // 銷毀所有視圖引用
    this._portalViewRefs.forEach((viewRef, id) => {
      try {
        if ('destroy' in viewRef) {
          viewRef.destroy();
        }
      } catch (error) {
        console.warn('清除 Portal 視圖時發生錯誤:', error);
      }
    });
    
    // 清空容器和映射
    container.clear();
    this._portalViewRefs.clear();
  }


  ngOnDestroy() {
    // 清理 ViewportPortal 動態內容 - 使用 ViewportComponent 中的容器
    const viewportComponent = this.viewportComponent();
    const container = viewportComponent.viewportPortalDynamic();
    if (container) {
      this._clearPortalViews(container);
    }

    // 清理 ResizeObserver 和 window resize listener
    this.cleanupResizeObserver();

    // 清理邊標籤服務
    this._edgeLabelService.destroy();

    this._panZoomService.destroy();
    this._dragService.destroy();
    this._selectionService.destroy();
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
      zoomOnScroll: this.zoomOnScroll(), // 滑鼠滾輪縮放：以滑鼠位置為基準
      zoomOnPinch: this.zoomOnPinch(), // 觸控板縮放：以觸控位置為基準
      panOnScroll: this.panOnScroll(),
      panOnScrollSpeed: this.panOnScrollSpeed(),
      zoomOnDoubleClick: true, // 雙擊縮放：以雙擊位置為基準
      panOnDrag: this.panOnDrag(),
      preventScrolling: true,
      paneClickDistance: this.paneClickDistance(),
      defaultViewport: { x: 0, y: 0, zoom: 1 },
      onPaneContextMenu: (event: MouseEvent) => {
        this.onPaneContextMenu.emit({ event });
      },
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
        this.performFitView(this.fitViewOptions());
        this._initialFitViewExecuted.set(true);
      }
    });
  }

  // 根據ID獲取節點 - 使用 nodeLookup 確保獲取最新的節點資訊（包含 internals）
  getNodeById(id: string): NodeType | undefined {
    // 使用 nodeLookup 而不是 visibleNodes，確保獲取包含 internals 的完整節點資訊
    const nodeLookup = this._flowService.nodeLookup();
    const internalNode = nodeLookup.get(id);

    if (!internalNode) {
      return undefined;
    }

    // 返回包含 internals 的完整節點
    return internalNode as NodeType;
  }

  // 🔑 關鍵修正：按照 React Flow 模式，動態獲取最新節點狀態
  getEdgeConnectionPoints(
    sourceNodeId: string,
    targetNodeId: string,
    edge: EdgeType
  ): {
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourcePosition: Position;
    targetPosition: Position;
  } {
    // 🔑 動態獲取最新節點狀態，與 React Flow 的 store.nodeLookup.get() 等效
    const nodeLookup = this._flowService.nodeLookup();
    const internalSourceNode = nodeLookup.get(sourceNodeId);
    const internalTargetNode = nodeLookup.get(targetNodeId);


    if (!internalSourceNode || !internalTargetNode) {
      console.warn(`⚠️ 節點未找到: source=${sourceNodeId}, target=${targetNodeId}`);
      // 如果找不到節點，返回預設值
      return {
        sourceX: 0, sourceY: 0, targetX: 0, targetY: 0,
        sourcePosition: Position.Bottom, targetPosition: Position.Top
      };
    }

    // 如果節點還沒有 handleBounds，表示還未初始化完成，使用備用計算
    if (
      !(internalSourceNode as any).internals?.handleBounds ||
      !(internalTargetNode as any).internals?.handleBounds
    ) {
      return this.getFallbackEdgePosition(internalSourceNode, internalTargetNode);
    }

    const sourceInternals = (internalSourceNode as any).internals;
    const targetInternals = (internalTargetNode as any).internals;


    // 使用系統包的 getEdgePosition 函數
    const edgePosition = getEdgePosition({
      id: edge.id,
      sourceNode: internalSourceNode as any,
      targetNode: internalTargetNode as any,
      sourceHandle: edge.sourceHandle || null,
      targetHandle: edge.targetHandle || null,
      connectionMode: ConnectionMode.Strict,
      onError: () => {
        // Silently handle edge position errors
      },
    });


    // 如果 getEdgePosition 返回 null，則使用備用計算
    if (!edgePosition) {
      return this.getFallbackEdgePosition(internalSourceNode, internalTargetNode);
    }
    
    const result = {
      sourceX: edgePosition.sourceX,
      sourceY: edgePosition.sourceY,
      targetX: edgePosition.targetX,
      targetY: edgePosition.targetY,
      sourcePosition: edgePosition.sourcePosition,
      targetPosition: edgePosition.targetPosition,
    };
    
    return result;
  }

  // 🔑 關鍵修正：優先使用節點的直接屬性，確保佈局變更立即生效
  private getPositionFromHandles(node: any, isSource: boolean): Position | null {
    // 🔑 優先使用節點的直接 sourcePosition/targetPosition 屬性
    const directPosition = isSource ? node.sourcePosition : node.targetPosition;
    if (directPosition) {
      return directPosition;
    }
    
    // 備用：從 handles 配置中獲取
    if (node.handles && Array.isArray(node.handles)) {
      const handle = node.handles.find((h: any) => 
        isSource ? h.type === 'source' : h.type === 'target'
      );
      if (handle?.position) {
        return handle.position;
      }
    }
    
    // 最後備用：智能默認值
    return isSource ? Position.Bottom : Position.Top;
  }

  // 🔑 關鍵修正：備用邊計算，按照 React Flow 模式使用 handles[].position
  private getFallbackEdgePosition(sourceNode: NodeType, targetNode: NodeType) {
    // 🔑 使用 handles 配置而非 node.sourcePosition，與 React Flow 邏輯一致
    const sourcePosition = this.getPositionFromHandles(sourceNode, true) || Position.Bottom;
    const targetPosition = this.getPositionFromHandles(targetNode, false) || Position.Top;


    const getSimpleHandlePosition = (node: any, position: Position) => {
      // 直接使用節點的 internals，因為從 nodeLookup 獲取的節點已包含此資訊
      const nodePos = node.internals?.positionAbsolute || {
        x: node.position.x,
        y: node.position.y,
      };
      
      // 🔑 關鍵修正：正確獲取節點尺寸
      // 優先順序：internals.measured > node.measured > node.width/height > 默認值
      const measured = node.internals?.measured || node.measured || {
        width: node.width || 150,
        height: node.height || 50,  // 修正預設高度為 50（與 layouting 範例一致）
      };
      
      // 🔑 Handle 尺寸：根據 CSS (.xy-flow__handle) 定義
      const HANDLE_SIZE = 6; // 6px × 6px
      const HANDLE_RADIUS = HANDLE_SIZE / 2; // 3px
      

      // 🔑 修正：根據 CSS transform 計算 handle 中心位置
      // Handle 中心位置extends超出節點邊界，與 CSS 中的 transform 一致
      switch (position) {
        case Position.Top:
          // CSS: top: 0; transform: translate(-50%, -50%)
          return { 
            x: nodePos.x + measured.width / 2, 
            y: nodePos.y - HANDLE_RADIUS 
          };
        case Position.Bottom:
          // CSS: bottom: 0; transform: translate(-50%, 50%)
          return {
            x: nodePos.x + measured.width / 2,
            y: nodePos.y + measured.height + HANDLE_RADIUS,
          };
        case Position.Left:
          // CSS: left: 0; transform: translate(-50%, -50%)
          return { 
            x: nodePos.x - HANDLE_RADIUS, 
            y: nodePos.y + measured.height / 2 
          };
        case Position.Right:
          // CSS: right: 0; transform: translate(50%, -50%)
          return {
            x: nodePos.x + measured.width + HANDLE_RADIUS,
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
  // 節點點擊處理

  handleNodeClick(event: MouseEvent, node: NodeType) {
    // 阻止事件冒泡，避免觸發pane的clearSelection
    event.stopPropagation();

    // 🔑 第一部分：處理選擇邏輯（與 elementsSelectable 相關）
    const elementsSelectable = this._flowService.elementsSelectable();
    const isNodeSelectable = !!(node.selectable || (elementsSelectable && typeof node.selectable === 'undefined'));
    
    // 如果節點可選擇，執行選擇邏輯
    if (isNodeSelectable) {
      const keyCode = this.multiSelectionKeyCode();
      const keys = Array.isArray(keyCode) ? keyCode : keyCode ? [keyCode] : undefined;
      const multiSelect = this._keyboardService.shouldUseMultiSelection(keys, event);
      
      // 選擇節點
      this._flowService.selectNode(node.id, multiSelect);
    }

    // 🔑 第二部分：條件性地觸發事件回調（與 captureElementClick 相關）
    // React Flow 邏輯：只有當有處理器時才觸發，與 elementsSelectable 完全獨立
    const nodeClickHandler = this.onNodeClickHandler();
    if (nodeClickHandler) {
      nodeClickHandler({ event, node });
    } else {
      // 🔑 與 React Flow 一致：當沒有 onClick 處理器時，觸發 Angular 輸出事件（向後兼容）
      this.onNodeClick.emit({ event, node });
    }
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

  handleNodeFocus(event: FocusEvent, node: NodeType) {
    // 與 React Flow 保持一致：focus 事件不進行自動選擇
    // 僅發出 focus 事件，保留 Tab 鍵導航功能
    this.onNodeFocus.emit({ event, node });
  }

  handleEdgeClick(event: MouseEvent, edge: EdgeType) {
    // 阻止事件冒泡，避免觸發背景點擊
    event.stopPropagation();

    // 🔑 第一部分：選擇邏輯（與 elementsSelectable 相關）
    if (this._flowService.elementsSelectable()) {
      // 使用服務的 handleEdgeClick 方法處理選擇邏輯
      this._flowService.handleEdgeClick(edge.id);
    }

    // 🔑 第二部分：條件性地觸發事件回調（與 captureElementClick 相關）
    // React Flow 邏輯：只有當有處理器時才觸發，與 elementsSelectable 完全獨立
    const edgeClickHandler = this.onEdgeClickHandler();
    if (edgeClickHandler) {
      edgeClickHandler({ event, edge });
    } else {
      // 🔑 與 React Flow 一致：當沒有 onClick 處理器時，觸發 Angular 輸出事件（向後兼容）
      this.onEdgeClick.emit({ event, edge });
    }
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

  handleEdgeFocus(event: FocusEvent, edge: EdgeType) {
    // 與 React Flow 保持一致：focus 事件不進行自動選擇
    // 僅發出 focus 事件，保留 Tab 鍵導航功能
    this.onEdgeFocus.emit({ event, edge });
  }

  handleEdgeKeyDown(event: KeyboardEvent, edge: EdgeType) {
    // 檢查是否允許選取元素
    if (!this._flowService.elementsSelectable()) {
      return;
    }

    // 空格鍵或Enter鍵觸發選擇（無障礙功能）
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();

      // 使用 KeyboardService 檢查多選鍵狀態（支持 multiSelectionKeyCode 配置）
      const keyCode = this.multiSelectionKeyCode();
      const keys = Array.isArray(keyCode) ? keyCode : keyCode ? [keyCode] : undefined;
      const multiSelect = this._keyboardService.shouldUseMultiSelection(
        keys,
        event as any
      );

      this._flowService.selectEdge(edge.id, multiSelect);

      // 觸發點擊事件（為了一致性）
      this.onEdgeClick.emit({ event: event as any, edge });
    }
  }

  handlePaneClick(event: MouseEvent) {
    // 🔑 條件性處理 pane 點擊事件（與 React Flow 完全一致）
    
    // 清除選擇狀態（與 React Flow 一致：無論 capture 狀態如何都清除選擇）
    if (this.elementsSelectable()) {
      this._flowService.clearSelection();
    }
    
    // 只有在啟用 captureOnPaneClick 時才執行事件處理
    if (this.captureOnPaneClick()) {
      // 1. 調用用戶提供的處理器函數（與 React Flow 一致）
      const handler = this.onPaneClickHandler();
      if (handler) {
        handler(event);
      }
      
      // 2. 發出 Angular 輸出事件
      this.onPaneClick.emit({ event });
    }
  }

  handlePaneContextMenu(event: MouseEvent) {
    // 檢查是否有選擇元素的上下文菜單
    this._selectionService.checkSelectionContextMenu(event);

    // 發出 pane 右鍵菜單事件（與 React 版本一致）
    // 注意：panOnDrag 的檢查已經在 pane 組件中處理了
    this.onPaneContextMenu.emit({ event });
  }

  handlePaneScroll(event: WheelEvent) {
    // 🔑 與 React Flow 完全一致的 onPaneScroll 事件處理邏輯
    // 純事件通知，不干擾滾動行為
    
    // 只有當啟用 captureOnPaneScroll 或有用戶處理器時才處理
    const scrollHandler = this.onPaneScrollHandler();
    const shouldCapture = this.captureOnPaneScroll();
    
    if (shouldCapture || scrollHandler) {
      // 1. 調用用戶提供的處理器函式（與 React Flow 一致）
      if (scrollHandler) {
        scrollHandler(event);
      }
      
      // 2. 發出 Angular 輸出事件
      this.onPaneScroll.emit({ event });
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

      // 使用 requestAnimationFrame 確保所有同步更新和微任務完成後再檢查
      requestAnimationFrame(() => {
        const newEdgeCount = this._flowService.edges().length;

        // 如果父組件沒有添加新的 edge，則使用默認邏輯創建
        if (newEdgeCount === currentEdgeCount) {
          this._flowService.onConnect(eventData.connection!);
        }
      });
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

  // 選擇事件處理器 - 由 PaneComponent 觸發
  handleSelectionStart(event: SelectionStartEvent): void {
    this.onSelectionStart.emit(event);
  }

  handleSelectionEnd(event: any): void {
    this.onSelectionEnd.emit(event);
  }

  handleSelectionContextMenu(event: any): void {
    this.onSelectionContextMenu.emit(event);
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
