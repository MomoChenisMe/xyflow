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
  getNodePositionWithOrigin,
  getEdgePosition,
  ConnectionMode,
  ColorMode,
  ColorModeClass
} from '@xyflow/system';

// 專案內部模組
import { AngularFlowService } from './angular-flow.service';
import { AngularFlowDragService } from './drag.service';
import { AngularFlowPanZoomService } from './panzoom.service';
import {
  AngularNode,
  AngularEdge,
  Viewport,
  AngularFlowInstance,
  EdgeMarker,
  MarkerType,
  ConnectionLineTemplateContext,
} from './types';
import { NodeWrapperComponent } from './node-wrapper/node-wrapper.component';
import { ConnectionLineTemplateDirective } from './connection-line-template.directive';

@Component({
  selector: 'angular-flow',
  standalone: true,
  imports: [CommonModule, NodeWrapperComponent],
  providers: [AngularFlowService, AngularFlowDragService, AngularFlowPanZoomService],
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
      <div
        #viewport
        class="xy-flow__viewport angular-flow__viewport"
        [style.transform]="viewportTransform()"
        [style.transform-origin]="'0 0'"
        [style.position]="'absolute'"
        [style.top]="'0'"
        [style.left]="'0'"
        [style.width]="'100%'"
        [style.height]="'100%'"
      >
        <!-- Edges layer -->
        <svg:svg
          class="xy-flow__edges angular-flow__edges"
          [style.position]="'absolute'"
          [style.top]="'0'"
          [style.left]="'0'"
          [style.width]="'100%'"
          [style.height]="'100%'"
          [style.pointer-events]="'none'"
          [style.z-index]="'1'"
          [style.overflow]="'visible'"
        >
          <!-- Marker definitions -->
          @if (hasEdgeMarkers()) {
          <svg:defs>
            @for (marker of edgeMarkers(); track marker.id) {
            <svg:marker
              [id]="marker.id"
              [attr.markerWidth]="marker.width || 10"
              [attr.markerHeight]="marker.height || 7"
              [attr.refX]="marker.type === markerType.Arrow ? 8 : 9"
              [attr.refY]="marker.height ? marker.height / 2 : 3.5"
              [attr.orient]="marker.orient || 'auto'"
              [attr.markerUnits]="marker.markerUnits || 'strokeWidth'"
            >
              @if (marker.type === markerType.Arrow) {
              <svg:polyline
                points="0,0 8,3.5 0,7"
                [attr.stroke]="marker.color || '#b1b1b7'"
                [attr.stroke-width]="marker.strokeWidth || 1"
                fill="none"
              />
              } @else {
              <svg:polygon
                points="0 0, 10 3.5, 0 7"
                [attr.fill]="marker.color || '#b1b1b7'"
              />
              }
            </svg:marker>
            }
          </svg:defs>
          } @for (edge of visibleEdges(); track edge.id) { @let sourceNode =
          getNodeById(edge.source); @let targetNode = getNodeById(edge.target);
          @if (sourceNode && targetNode) {
          <svg:g
            class="angular-flow__edge xy-flow__edge"
            [class.selected]="edge.selected"
            [class.animated]="edge.animated"
            [class.selectable]="edge.selectable !== false"
            [attr.tabindex]="edge.selectable !== false ? 0 : null"
            (focus)="handleEdgeFocus($event, edge)"
            (keydown)="handleEdgeKeyDown($event, edge)"
          >
            <!-- 可見的邊路徑 -->
            <svg:path
              [attr.d]="calculateEdgePath(sourceNode, targetNode, edge)"
              [attr.fill]="'none'"
              [attr.marker-start]="getMarkerUrl(edge, 'start')"
              [attr.marker-end]="getMarkerUrl(edge, 'end')"
              [class]="'angular-flow__edge-path xy-flow__edge-path'"
              [ngStyle]="getEdgeStyles(edge)"
              style="pointer-events: none;"
            />
            
            <!-- 不可見的交互路徑，用於擴大點擊和 hover 範圍 -->
            <svg:path
              [attr.d]="calculateEdgePath(sourceNode, targetNode, edge)"
              [attr.stroke]="'transparent'"
              [attr.stroke-width]="20"
              [attr.fill]="'none'"
              [class]="'angular-flow__edge-interaction xy-flow__edge-interaction'"
              style="pointer-events: stroke; cursor: pointer;"
              (click)="handleEdgeClick($event, edge)"
            />

            <!-- Edge label -->
            @if (edge.data?.['label']) { @let connectionPoints =
            getEdgeConnectionPoints(sourceNode, targetNode, edge);
            <svg:text
              [attr.x]="
                (connectionPoints.sourceX + connectionPoints.targetX) / 2
              "
              [attr.y]="
                (connectionPoints.sourceY + connectionPoints.targetY) / 2
              "
              text-anchor="middle"
              dominant-baseline="middle"
              class="angular-flow__edge-label xy-flow__edge-label"
              style="font-size: 12px; fill: #222; pointer-events: none;"
            >
              {{ edge.data?.['label'] }}
            </svg:text>
            }
          </svg:g>
          } }
        </svg:svg>

        <!-- Connection Line - 顯示連接進行中的線條（獨立層，高於節點） -->
        @if (connectionInProgress() && (customConnectionLineTemplate() || connectionLinePath())) {
          <svg:svg
            class="xy-flow__connectionline angular-flow__connectionline xy-flow__container"
            [style.position]="'absolute'"
            [style.top]="'0'"
            [style.left]="'0'"
            [style.width]="'100%'"
            [style.height]="'100%'"
            [style.pointer-events]="'none'"
            [style.z-index]="'1001'"
            [style.overflow]="'visible'"
          >
            @let connState = connectionInProgress();
            @let context = connectionLineContext();
            @if (customConnectionLineTemplate() && context) {
              <!-- 使用自定義連接線模板 -->
              <ng-container 
                [ngTemplateOutlet]="customConnectionLineTemplate()!.templateRef"
                [ngTemplateOutletContext]="context"
              />
            } @else if (connectionLinePath()) {
              <!-- 使用預設連接線 -->
              <svg:g class="angular-flow__connection xy-flow__connection">
                <svg:path
                  [attr.d]="connectionLinePath()"
                  [attr.stroke]="
                    customConnectionLineType() === 'react' 
                      ? '#222'
                      : connState.isValid === true
                      ? '#10b981'
                      : connState.isValid === false
                      ? '#f87171'
                      : '#b1b1b7'
                  "
                  [attr.stroke-width]="customConnectionLineType() === 'react' ? '1.5' : '1'"
                  [attr.fill]="'none'"
                  [class]="customConnectionLineType() === 'react' ? 'angular-flow__connection-path xy-flow__connection-path animated' : 'angular-flow__connection-path xy-flow__connection-path'"
                  style="pointer-events: none;"
                />
                @if (customConnectionLineType() === 'react' && connState) {
                <svg:circle 
                  [attr.cx]="connState.to.x" 
                  [attr.cy]="connState.to.y" 
                  [attr.fill]="'#fff'" 
                  [attr.r]="'3'" 
                  [attr.stroke]="'#222'" 
                  [attr.stroke-width]="'1.5'"
                  style="pointer-events: none;"
                />
                }
              </svg:g>
            }
          </svg:svg>
        }

        <!-- Nodes layer -->
        <div
          class="xy-flow__nodes angular-flow__nodes"
          [style.position]="'absolute'"
          [style.top]="'0'"
          [style.left]="'0'"
          [style.width]="'100%'"
          [style.height]="'100%'"
          [style.z-index]="'2'"
        >
          @for (node of visibleNodes(); track node.id) {
          <angular-flow-node
            [node]="node"
            [selected]="node.selected || false"
            [dragging]="node.dragging || false"
            (nodeClick)="handleNodeClick($event, node)"
            (nodeFocus)="handleNodeFocus($event, node)"
            (nodeDragStart)="handleNodeDragStart($event, node)"
            (nodeDrag)="handleNodeDrag($event, node)"
            (nodeDragStop)="handleNodeDragStop($event, node)"
            (connectStart)="handleConnectStart($event.event, node)"
            (connectEnd)="handleConnectEnd($event)"
            (handleClick)="
              handleHandleClick(
                $event.event,
                $event.nodeId,
                $event.handleId,
                $event.handleType
              )
            "
          />
          }
        </div>
      </div>
      <!-- Content projection for background, controls, etc. -->
      <ng-content />
    </div>
  `,
  styles: [
    `
      .angular-flow {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
        background: #fafafa;
      }

      /* Viewport cursor styles - 對應 React Flow 的邏輯 */
      .angular-flow__pane {
        z-index: 1;
      }

      .angular-flow__pane--draggable {
        cursor: grab;
      }

      .angular-flow__pane--dragging {
        cursor: grabbing;
      }

      .angular-flow__pane--selection {
        cursor: pointer;
      }

      .angular-flow__viewport {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      .angular-flow__edges {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
      }

      .angular-flow__nodes {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2;
      }

      .angular-flow__edge-path {
        stroke: #b1b1b7;
        stroke-width: 1;
        fill: none;
      }
      
      /* Dark mode default edge color */
      .dark .angular-flow__edge-path {
        stroke: #3e3e3e;
      }

      .angular-flow__edge.selectable:hover .angular-flow__edge-path {
        stroke: #999;
      }
      
      .dark .angular-flow__edge.selectable:hover .angular-flow__edge-path {
        stroke: #888;
      }
      
      /* Ensure focus outline is removed */
      .angular-flow__edge:focus,
      .angular-flow__edge:focus-visible {
        outline: none;
      }

      .angular-flow__edge-path.selected,
      .angular-flow__edge.selectable:focus .angular-flow__edge-path,
      .angular-flow__edge.selectable:focus-visible .angular-flow__edge-path {
        stroke: #555;
        stroke-width: 2;
      }
      
      /* Dark mode edge selected/focus color */
      .dark .angular-flow__edge-path.selected,
      .dark .angular-flow__edge.selectable:focus .angular-flow__edge-path,
      .dark .angular-flow__edge.selectable:focus-visible .angular-flow__edge-path {
        stroke: #727272;
        stroke-width: 2;
      }

      .angular-flow__edge-path.animated {
        stroke-dasharray: 5;
        animation: flow 0.5s linear infinite;
      }

      @keyframes flow {
        to {
          stroke-dashoffset: -10;
        }
      }

      /* ConnectionLine 現在是獨立的 SVG 層，z-index 已經通過 inline style 設定為 1001 */
      .angular-flow__connectionline {
        pointer-events: none;
      }

      .angular-flow__connection-path {
        stroke: #b1b1b7;
        stroke-width: 1;
        fill: none;
        pointer-events: none;
      }
    `,
  ],
})
export class AngularFlowComponent<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> implements OnDestroy
{
  // 注入依賴
  private _flowService = inject(AngularFlowService<NodeType, EdgeType>);
  private _dragService = inject(AngularFlowDragService);
  private _panZoomService = inject(AngularFlowPanZoomService);

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
    return `angular-flow-${this.generateUniqueId()}`;
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
    return 'xy-flow angular-flow angular-flow__pane ' + this.className() + ' ' + this.viewportCursorClass() + ' ' + this.colorModeClass();
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
  viewportElement =
    viewChild.required<ElementRef<HTMLDivElement>>('viewport');

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
      return 'angular-flow__pane--selection';
    }

    // 當拖拽功能啟用時，根據拖拽狀態顯示對應鼠標
    if (panOnDragEnabled) {
      return isDragging ? 'angular-flow__pane--dragging' : 'angular-flow__pane--draggable';
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

  // 連接線路徑計算
  connectionLinePath = computed(() => {
    const connState = this.connectionInProgress();
    if (!connState) return null;

    const { from, to, fromPosition, toPosition } = connState;

    // 根據自定義連接線類型選擇不同的路徑算法
    const lineType = this.customConnectionLineType();
    if (lineType === 'react') {
      // 使用React樣式的路徑算法：M${fromX},${fromY} C ${fromX} ${toY} ${fromX} ${toY} ${toX},${toY}
      return `M${from.x},${from.y} C ${from.x} ${to.y} ${from.x} ${to.y} ${to.x},${to.y}`;
    }

    // 預設使用貝茲曲線路徑
    return this._getBezierPath(
      from.x,
      from.y,
      fromPosition,
      to.x,
      to.y,
      toPosition
    );
  });

  // 自定義連接線模板上下文
  connectionLineContext = computed<ConnectionLineTemplateContext | null>(() => {
    const connState = this.connectionInProgress();
    if (!connState) return null;

    const { from, to, fromPosition, toPosition } = connState;

    const props = {
      fromX: from.x,
      fromY: from.y,
      toX: to.x,
      toY: to.y,
      fromPosition,
      toPosition,
      isValid: connState.isValid,
      connectionLineStyle: undefined,
    };

    // 使用 $implicit 作為預設值，並提供所有變數作為具名屬性
    return {
      $implicit: props,
      ...props,
    };
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
        const markerId = this._getMarkerId(edge, 'start', markerData);
        if (!markers.find((m) => m.id === markerId)) {
          markers.push({ id: markerId, ...markerData });
        }
      }

      if (edge.markerEnd) {
        const markerData =
          typeof edge.markerEnd === 'string'
            ? { type: MarkerType.ArrowClosed }
            : edge.markerEnd;
        const markerId = this._getMarkerId(edge, 'end', markerData);
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

  // 傳統的更新容器大小方法（供外部調用）
  private updateContainerSize() {
    const container = this.flowContainer()?.nativeElement;
    if (container) {
      const rect = container.getBoundingClientRect();
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

  // 傳統的設置 PanZoom 方法（供外部調用或強制重新初始化）
  private setupPanZoom() {
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

  // 傳統的處理初始 fit view 方法（供外部調用）
  private handleInitialFitView() {
    // 檢查是否需要執行初始 fit view
    if (!this.fitView()) {
      return;
    }

    // 檢查是否有節點存在
    const nodes = this.visibleNodes();
    if (nodes.length === 0) {
      return;
    }

    // 確保 PanZoom 已初始化
    if (!this._panZoomService) {
      return;
    }


    // 執行 fit view，傳遞選項
    this.performFitView(this.fitViewOptions());
  }

  // 根據ID獲取節點
  getNodeById(id: string): NodeType | undefined {
    const node = this.visibleNodes().find((node) => node.id === id);
    return node;
  }

  // 計算 Handle 位置（使用統一位置計算系統）
  private getHandlePosition(
    node: NodeType,
    position: Position,
    nodeWidth: number,
    nodeHeight: number
  ): { x: number; y: number } {
    // 確定 Handle 類型
    const handleType: 'source' | 'target' = position === Position.Top ? 'target' : 'source';
    
    // 使用統一系統獲取 Handle 位置
    const unifiedPos = this._flowService.getHandlePositionAbsolute(
      node.id, 
      handleType, 
      position
    );
    
    if (unifiedPos) {
      return unifiedPos;
    }
    
    // 備用計算（如果統一系統尚未初始化）
    const adjustedPosition = getNodePositionWithOrigin(node, [0, 0]);
    const handleOffset = 4;

    switch (position) {
      case Position.Top:
        return { x: adjustedPosition.x + nodeWidth / 2, y: adjustedPosition.y - handleOffset };
      case Position.Right:
        return { x: adjustedPosition.x + nodeWidth + handleOffset, y: adjustedPosition.y + nodeHeight / 2 };
      case Position.Bottom:
        return { x: adjustedPosition.x + nodeWidth / 2, y: adjustedPosition.y + nodeHeight + handleOffset };
      case Position.Left:
        return { x: adjustedPosition.x - handleOffset, y: adjustedPosition.y + nodeHeight / 2 };
      default:
        return { x: adjustedPosition.x + nodeWidth / 2, y: adjustedPosition.y + nodeHeight / 2 };
    }
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

  // 計算貝茲曲線路徑
  private _getBezierPath(
    sourceX: number,
    sourceY: number,
    sourcePosition: Position,
    targetX: number,
    targetY: number,
    targetPosition: Position,
    curvature: number = 0.25
  ): string {
    const getControlPoint = (
      pos: Position,
      x: number,
      y: number,
      targetX: number,
      targetY: number
    ): [number, number] => {
      const distance = Math.sqrt((targetX - x) ** 2 + (targetY - y) ** 2);
      const offset = Math.max(distance * curvature, 20);

      switch (pos) {
        case Position.Left:
          return [x - offset, y];
        case Position.Right:
          return [x + offset, y];
        case Position.Top:
          return [x, y - offset];
        case Position.Bottom:
          return [x, y + offset];
        default:
          return [x, y];
      }
    };

    const [sourceControlX, sourceControlY] = getControlPoint(
      sourcePosition,
      sourceX,
      sourceY,
      targetX,
      targetY
    );
    const [targetControlX, targetControlY] = getControlPoint(
      targetPosition,
      targetX,
      targetY,
      sourceX,
      sourceY
    );

    return `M ${sourceX},${sourceY} C ${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`;
  }

  // 計算邊路徑
  calculateEdgePath(
    sourceNode: NodeType,
    targetNode: NodeType,
    edge: EdgeType
  ): string {
    const {
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    } = this.getEdgeConnectionPoints(sourceNode, targetNode, edge);

    // 根據邊類型返回不同的路徑
    const edgeType = (edge as any).type || 'default';

    switch (edgeType) {
      case 'straight':
        return `M ${sourceX},${sourceY} L ${targetX},${targetY}`;

      case 'step':
        const midX = (sourceX + targetX) / 2;
        return `M ${sourceX},${sourceY} L ${midX},${sourceY} L ${midX},${targetY} L ${targetX},${targetY}`;

      case 'smoothstep':
        // 簡化的 smooth step 實現
        const offsetX = Math.abs(targetX - sourceX) * 0.5;
        // const offsetY = Math.abs(targetY - sourceY) * 0.5; // 保留供未來擴展使用

        if (
          sourcePosition === Position.Right &&
          targetPosition === Position.Left
        ) {
          const midX = sourceX + offsetX;
          return `M ${sourceX},${sourceY} L ${midX},${sourceY} Q ${
            midX + 10
          },${sourceY} ${midX + 10},${sourceY + 10} L ${midX + 10},${
            targetY - 10
          } Q ${midX + 10},${targetY} ${
            midX + 20
          },${targetY} L ${targetX},${targetY}`;
        }

        return this._getBezierPath(
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
          0.1
        );

      case 'default':
      case 'bezier':
      default:
        return this._getBezierPath(
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition
        );
    }
  }

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
      target.classList.contains('angular-flow') ||
      target.classList.contains('xy-flow') ||
      target.classList.contains('angular-flow__viewport') ||
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
    const controlsElement = flowContainer.querySelector('.angular-flow__controls');
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
  getFlow(): AngularFlowInstance<NodeType, EdgeType> {
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

  // 獲取標記 ID
  private _getMarkerId(
    _edge: EdgeType,
    position: 'start' | 'end',
    marker: EdgeMarker
  ): string {
    const type = marker.type || MarkerType.ArrowClosed;
    const color = (marker.color || '#b1b1b7').replace('#', '');
    return `angular-flow__marker-${position}-${type}-${color}`;
  }

  // 獲取邊線樣式對象 - 類似React版本的完整樣式支持
  getEdgeStyles(edge: EdgeType): any {
    // 根據顏色模式選擇正確的顏色
    const isDarkMode = this.colorModeClass() === 'dark';
    const selectedStroke = isDarkMode ? '#727272' : '#555';
    const defaultStroke = isDarkMode ? '#3e3e3e' : '#b1b1b7';
    
    const defaultStyles = {
      stroke: edge.selected ? selectedStroke : defaultStroke,
      strokeWidth: edge.selected ? 2 : 1,
      fill: 'none',
    };

    // 合併自定義樣式，優先級高於默認樣式
    return edge.style ? { ...defaultStyles, ...edge.style } : defaultStyles;
  }

  // 保留原方法以兼容性（雖然現在不再使用）
  getEdgeStroke(edge: EdgeType): string {
    // 優先使用 edge.style['stroke']
    if (edge.style?.['stroke']) {
      return edge.style['stroke'];
    }
    // 其次使用選擇狀態樣式
    return edge.selected ? '#ff0072' : '#b1b1b7';
  }

  // 獲取邊線寬度 - 優先使用自定義樣式，然後是選擇狀態樣式
  getEdgeStrokeWidth(edge: EdgeType): number {
    // 優先使用 edge.style['strokeWidth']
    if (edge.style?.['strokeWidth'] !== undefined) {
      return edge.style['strokeWidth'];
    }
    // 其次使用選擇狀態樣式
    return edge.selected ? 2 : 1;
  }

  // 獲取標記 URL
  getMarkerUrl(edge: EdgeType, position: 'start' | 'end'): string | null {
    const marker = position === 'start' ? edge.markerStart : edge.markerEnd;
    if (!marker) return null;

    const markerData =
      typeof marker === 'string' ? { type: MarkerType.ArrowClosed } : marker;
    const markerId = this._getMarkerId(edge, position, markerData);
    return `url(#${markerId})`;
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
