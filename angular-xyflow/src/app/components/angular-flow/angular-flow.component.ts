import {
  Component,
  input,
  output,
  viewChild,
  effect,
  signal,
  computed,
  afterRenderEffect,
  ElementRef,
  ChangeDetectionStrategy,
  OnDestroy,
  OnInit,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularFlowService } from './angular-flow.service';
import { AngularFlowDragService } from './drag.service';
import { AngularFlowPanZoomService } from './panzoom.service';
import {
  AngularFlowProps,
  AngularNode,
  AngularEdge,
  Viewport,
  AngularFlowInstance,
  EdgeMarker,
  MarkerType,
} from './types';
import { NodeWrapperComponent } from './node-wrapper/node-wrapper.component';
import { type Connection, Position } from '@xyflow/system';

@Component({
  selector: 'angular-flow',
  standalone: true,
  imports: [CommonModule, NodeWrapperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div
      #flowContainer
      class="xy-flow angular-flow"
      [class]="className()"
      [style.width]="'100%'"
      [style.height]="'100%'"
      [style.position]="'relative'"
      [style.overflow]="'hidden'"
      [style.background]="'#fafafa'"
      (click)="handlePaneClick($event)"
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
        <svg
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
            <defs>
              @for (marker of edgeMarkers(); track marker.id) {
                <marker
                  [id]="marker.id"
                  [attr.markerWidth]="marker.width || 10"
                  [attr.markerHeight]="marker.height || 7"
                  [attr.refX]="marker.type === markerType.Arrow ? 8 : 9"
                  [attr.refY]="marker.height ? marker.height / 2 : 3.5"
                  [attr.orient]="marker.orient || 'auto'"
                  [attr.markerUnits]="marker.markerUnits || 'strokeWidth'"
                >
                  @if (marker.type === markerType.Arrow) {
                    <polyline
                      points="0,0 8,3.5 0,7"
                      [attr.stroke]="marker.color || '#b1b1b7'"
                      [attr.stroke-width]="marker.strokeWidth || 1"
                      fill="none"
                    />
                  } @else {
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      [attr.fill]="marker.color || '#b1b1b7'"
                    />
                  }
                </marker>
              }
            </defs>
          }

          @for (edge of visibleEdges(); track edge.id) { @let sourceNode =
          getNodeById(edge.source); @let targetNode = getNodeById(edge.target);
          @if (sourceNode && targetNode) {
          <g
            class="angular-flow__edge xy-flow__edge"
            [class.selected]="edge.selected"
            [class.animated]="edge.animated"
          >
            <!-- 計算邊路徑 -->
            <path
              [attr.d]="calculateEdgePath(sourceNode, targetNode, edge)"
              [attr.stroke]="edge.selected ? '#ff0072' : '#b1b1b7'"
              [attr.stroke-width]="edge.selected ? 2 : 1"
              [attr.fill]="'none'"
              [attr.marker-start]="getMarkerUrl(edge, 'start')"
              [attr.marker-end]="getMarkerUrl(edge, 'end')"
              [class]="'angular-flow__edge-path xy-flow__edge-path'"
              style="pointer-events: stroke; cursor: pointer;"
              (click)="handleEdgeClick($event, edge)"
            />

            <!-- Edge label -->
            @if (edge.data?.['label']) {
            @let connectionPoints = getEdgeConnectionPoints(sourceNode, targetNode, edge);
            <text
              [attr.x]="(connectionPoints.sourceX + connectionPoints.targetX) / 2"
              [attr.y]="(connectionPoints.sourceY + connectionPoints.targetY) / 2"
              text-anchor="middle"
              dominant-baseline="middle"
              class="angular-flow__edge-label xy-flow__edge-label"
              style="font-size: 12px; fill: #222; pointer-events: none;"
            >
              {{ edge.data?.['label'] }}
            </text>
            }
          </g>
          } }

          <!-- Connection Line - 顯示連接進行中的線條 -->
          @if (connectionInProgress() && connectionLinePath()) {
          @let connState = connectionInProgress();
          <g class="angular-flow__connection-line xy-flow__connection-line">
            <path
              [attr.d]="connectionLinePath()"
              [attr.stroke]="connState.isValid === true ? '#10b981' : connState.isValid === false ? '#f87171' : '#b1b1b7'"
              [attr.stroke-width]="1"
              [attr.fill]="'none'"
              class="angular-flow__connection-path xy-flow__connection-path"
              style="pointer-events: none;"
            />
          </g>
          }
        </svg>

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
            (nodeDragStart)="handleNodeDragStart($event, node)"
            (nodeDrag)="handleNodeDrag($event, node)"
            (nodeDragStop)="handleNodeDragStop($event, node)"
            (connectStart)="handleConnectStart($event.event, node)"
            (connectEnd)="handleConnectEnd($event)"
            (handleClick)="handleHandleClick($event.event, $event.nodeId, $event.handleId, $event.handleType)"
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

      .angular-flow__edge-path:hover {
        stroke: #999;
        stroke-width: 2;
      }

      .angular-flow__edge-path.selected {
        stroke: #ff0072;
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

      .angular-flow__connection-line {
        pointer-events: none;
        z-index: 1000;
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
> implements OnInit, OnDestroy
{
  // 注入服務
  private flowService = inject(AngularFlowService<NodeType, EdgeType>);
  private dragService = inject(AngularFlowDragService);
  private panZoomService = inject(AngularFlowPanZoomService);

  // 輸入信號
  readonly defaultNodes = input<NodeType[]>([]);
  readonly defaultEdges = input<EdgeType[]>([]);
  readonly nodes = input<NodeType[]>();
  readonly edges = input<EdgeType[]>();
  readonly className = input<string>('');
  readonly minZoom = input<number>(0.5);
  readonly maxZoom = input<number>(2);
  readonly fitView = input<boolean>(false);
  readonly fitViewOptions = input<any>();
  readonly selectNodesOnDrag = input<boolean>(false);
  readonly nodeOrigin = input<[number, number]>([0, 0]);
  readonly elevateEdgesOnSelect = input<boolean>(true);
  readonly elevateNodesOnSelect = input<boolean>(false);
  readonly defaultEdgeOptions = input<Partial<EdgeType>>();
  readonly nodeDragThreshold = input<number>(0);

  // 輸出事件
  readonly onNodesChange = output<NodeType[]>();
  readonly onEdgesChange = output<EdgeType[]>();
  readonly onConnect = output<Connection>();
  readonly onNodeClick = output<{ event: MouseEvent; node: NodeType }>();
  readonly onNodeDragStart = output<{
    event: MouseEvent;
    node: NodeType;
    nodes: NodeType[];
  }>();
  readonly onNodeDrag = output<{
    event: MouseEvent;
    node: NodeType;
    nodes: NodeType[];
  }>();
  readonly onNodeDragStop = output<{
    event: MouseEvent;
    node: NodeType;
    nodes: NodeType[];
  }>();
  readonly onSelectionDragStart = output<{
    event: MouseEvent;
    nodes: NodeType[];
  }>();
  readonly onSelectionDrag = output<{ event: MouseEvent; nodes: NodeType[] }>();
  readonly onSelectionDragStop = output<{
    event: MouseEvent;
    nodes: NodeType[];
  }>();

  // 視圖子元素
  readonly flowContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('flowContainer');
  readonly viewportElement =
    viewChild.required<ElementRef<HTMLDivElement>>('viewport');

  // 內部狀態信號
  private readonly containerSize = signal({ width: 0, height: 0 });
  readonly markerType = MarkerType;

  // 計算信號
  readonly visibleNodes = computed(() => {
    const controlledNodes = this.nodes();
    if (controlledNodes && controlledNodes.length > 0) {
      return controlledNodes;
    }
    return this.flowService.nodes();
  });

  readonly visibleEdges = computed(() => {
    const controlledEdges = this.edges();
    const serviceEdges = this.flowService.edges();

    let result: EdgeType[];
    if (controlledEdges && controlledEdges.length > 0) {
      result = controlledEdges;
    } else {
      result = serviceEdges;
    }

    console.log('🔗 可見邊計算:', {
      controlledEdges: controlledEdges?.length || 0,
      serviceEdges: serviceEdges.length,
      result: result.length,
      edges: result,
    });

    return result;
  });

  readonly viewportTransform = computed(() => {
    const viewport = this.flowService.viewport();
    return `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`;
  });

  // 流程實例
  readonly flowInstance = computed(() => this.flowService.getFlowInstance());

  // 連接狀態
  readonly connectionState = computed(() => this.flowService.connectionState());

  // 連接進行中狀態 - 類型安全的計算信號
  readonly connectionInProgress = computed(() => {
    const state = this.connectionState();
    if (!state.inProgress) return null;
    
    // TypeScript 類型守衛，確保我們有正確的類型
    return state as any; // 安全的類型轉換，因為我們已經檢查了 inProgress
  });

  // 連接線路徑計算
  readonly connectionLinePath = computed(() => {
    const connState = this.connectionInProgress();
    if (!connState) return null;

    const { from, to, fromPosition, toPosition } = connState;
    
    // 使用貝茲曲線路徑
    return this.getBezierPath(
      from.x,
      from.y,
      fromPosition,
      to.x,
      to.y,
      toPosition
    );
  });

  // 邊線標記相關計算
  readonly hasEdgeMarkers = computed(() => {
    const edges = this.visibleEdges();
    return edges.some(edge => edge.markerStart || edge.markerEnd);
  });

  readonly edgeMarkers = computed(() => {
    const edges = this.visibleEdges();
    const markers: Array<{ id: string; type: MarkerType; color?: string; width?: number; height?: number; orient?: string; markerUnits?: string; strokeWidth?: number }> = [];
    
    edges.forEach((edge) => {
      if (edge.markerStart) {
        const markerData = typeof edge.markerStart === 'string' ? { type: MarkerType.ArrowClosed } : edge.markerStart;
        const markerId = this.getMarkerId(edge, 'start', markerData);
        if (!markers.find(m => m.id === markerId)) {
          markers.push({ id: markerId, ...markerData });
        }
      }
      
      if (edge.markerEnd) {
        const markerData = typeof edge.markerEnd === 'string' ? { type: MarkerType.ArrowClosed } : edge.markerEnd;
        const markerId = this.getMarkerId(edge, 'end', markerData);
        if (!markers.find(m => m.id === markerId)) {
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
        this.flowService.initialize(this.flowContainer().nativeElement, {
          nodes: nodes,
          edges: edges,
          minZoom: this.minZoom(),
          maxZoom: this.maxZoom(),
        });
      }
    });

    // 渲染後副作用
    afterRenderEffect(() => {
      this.updateContainerSize();
      this.setupPanZoom();
    });
  }

  ngOnInit() {
    // 初始化
  }

  ngOnDestroy() {
    this.panZoomService.destroy();
    this.dragService.destroy();
    this.flowService.destroy();
  }

  // 更新容器大小
  private updateContainerSize() {
    const container = this.flowContainer()?.nativeElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      this.containerSize.set({ width: rect.width, height: rect.height });
    }
  }

  // 設置 PanZoom 功能
  private setupPanZoom() {
    const container = this.flowContainer()?.nativeElement;
    if (!container) {
      console.log('❌ 無法設置 PanZoom：容器不存在');
      return;
    }

    console.log('🔧 設置 PanZoom 功能', { container });

    this.panZoomService.initializePanZoom({
      domNode: container,
      minZoom: this.minZoom(),
      maxZoom: this.maxZoom(),
      zoomOnScroll: true,
      zoomOnPinch: true,
      panOnScroll: false,
      panOnScrollSpeed: 0.5,
      zoomOnDoubleClick: true,
      panOnDrag: true,
      preventScrolling: true,
      paneClickDistance: 0,
      defaultViewport: { x: 0, y: 0, zoom: 1 },
    });
  }

  // 根據ID獲取節點
  getNodeById(id: string): NodeType | undefined {
    const node = this.visibleNodes().find((node) => node.id === id);
    console.log('🔍 查找節點:', { nodeId: id, found: !!node, nodeData: node });
    return node;
  }

  // 計算 Handle 位置
  private getHandlePosition(
    node: NodeType,
    position: Position,
    nodeWidth: number,
    nodeHeight: number
  ): { x: number; y: number } {
    const x = node.position.x;
    const y = node.position.y;

    switch (position) {
      case Position.Top:
        return { x: x + nodeWidth / 2, y: y };
      case Position.Right:
        return { x: x + nodeWidth, y: y + nodeHeight / 2 };
      case Position.Bottom:
        return { x: x + nodeWidth / 2, y: y + nodeHeight };
      case Position.Left:
        return { x: x, y: y + nodeHeight / 2 };
      default:
        return { x: x + nodeWidth / 2, y: y + nodeHeight / 2 };
    }
  }

  // 獲取邊的連接點
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
    // 使用節點的實際尺寸，如果沒有則使用默認值
    const sourceWidth = (sourceNode as any).width || 150;
    const sourceHeight = (sourceNode as any).height || 40;
    const targetWidth = (targetNode as any).width || 150;
    const targetHeight = (targetNode as any).height || 40;

    // 獲取 handle 位置，如果沒有設定則使用預設值
    const sourcePosition = sourceNode.sourcePosition || Position.Bottom;
    const targetPosition = targetNode.targetPosition || Position.Top;

    // 計算實際的連接點
    const sourcePoint = this.getHandlePosition(sourceNode, sourcePosition, sourceWidth, sourceHeight);
    const targetPoint = this.getHandlePosition(targetNode, targetPosition, targetWidth, targetHeight);

    return {
      sourceX: sourcePoint.x,
      sourceY: sourcePoint.y,
      targetX: targetPoint.x,
      targetY: targetPoint.y,
      sourcePosition,
      targetPosition,
    };
  }

  // 計算貝茲曲線路徑
  private getBezierPath(
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
    const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } =
      this.getEdgeConnectionPoints(sourceNode, targetNode, edge);

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
        const offsetY = Math.abs(targetY - sourceY) * 0.5;
        
        if (sourcePosition === Position.Right && targetPosition === Position.Left) {
          const midX = sourceX + offsetX;
          return `M ${sourceX},${sourceY} L ${midX},${sourceY} Q ${midX + 10},${sourceY} ${midX + 10},${sourceY + 10} L ${midX + 10},${targetY - 10} Q ${midX + 10},${targetY} ${midX + 20},${targetY} L ${targetX},${targetY}`;
        }
        
        return this.getBezierPath(sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, 0.1);

      case 'default':
      case 'bezier':
      default:
        return this.getBezierPath(sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition);
    }
  }

  // 事件處理方法
  handleNodeClick(event: MouseEvent, node: NodeType) {
    // 阻止事件冒泡，避免觸發背景點擊
    event.stopPropagation();
    
    // 檢查是否按下 Ctrl/Cmd 鍵進行多選
    const multiSelect = event.ctrlKey || event.metaKey;
    
    // 選擇節點
    this.flowService.selectNode(node.id, multiSelect);
    
    this.onNodeClick.emit({ event, node });
  }

  handleEdgeClick(event: MouseEvent, edge: EdgeType) {
    // 阻止事件冒泡，避免觸發背景點擊
    event.stopPropagation();
    
    // 檢查是否按下 Ctrl/Cmd 鍵進行多選
    const multiSelect = event.ctrlKey || event.metaKey;
    
    // 選擇邊線
    this.flowService.selectEdge(edge.id, multiSelect);
    
    console.log('Edge clicked:', edge.id, 'Selected:', edge.selected);
  }

  handlePaneClick(event: MouseEvent) {
    // 只有當點擊的是背景元素時才清除選擇
    const target = event.target as HTMLElement;
    
    // 檢查點擊的是否是背景元素
    if (target.classList.contains('angular-flow') || 
        target.classList.contains('xy-flow') || 
        target.classList.contains('angular-flow__viewport') ||
        target.classList.contains('xy-flow__viewport')) {
      this.flowService.clearSelection();
    }
  }

  handleHandleClick(event: MouseEvent, nodeId: string, handleId: string | undefined, type: 'source' | 'target') {
    // 阻止事件冒泡，避免觸發節點或背景點擊
    event.stopPropagation();
    
    // 檢查是否按下 Ctrl/Cmd 鍵進行多選
    const multiSelect = event.ctrlKey || event.metaKey;
    
    // 選擇 Handle
    this.flowService.selectHandle(nodeId, handleId, type, multiSelect);
    
    console.log('Handle clicked:', { nodeId, handleId, type });
  }

  handleNodeDragStart(event: MouseEvent, node: NodeType) {
    const nodes = this.visibleNodes();
    this.onNodeDragStart.emit({ event, node, nodes });
  }

  handleNodeDrag(event: MouseEvent, node: NodeType) {
    const nodes = this.visibleNodes();
    this.onNodeDrag.emit({ event, node, nodes });
  }

  handleNodeDragStop(event: MouseEvent, node: NodeType) {
    const nodes = this.visibleNodes();
    this.onNodeDragStop.emit({ event, node, nodes });
  }

  handleConnectStart(_event: MouseEvent, _node: NodeType) {
    // 連接開始邏輯
  }

  handleConnectEnd(connection: Connection) {
    this.flowService.onConnect(connection);
    this.onConnect.emit(connection);
  }

  // 公開方法來獲取流程實例
  getFlow(): AngularFlowInstance<NodeType, EdgeType> {
    return this.flowInstance();
  }

  // PanZoom 相關公開方法
  setViewport(viewport: Viewport, options?: { duration?: number }): void {
    this.panZoomService.setViewport(viewport, options);
  }

  getViewport(): Viewport {
    return this.panZoomService.getViewport();
  }

  performFitView(options?: any): void {
    this.panZoomService.fitView(options);
  }

  zoomIn(): void {
    this.panZoomService.zoomIn();
  }

  zoomOut(): void {
    this.panZoomService.zoomOut();
  }

  resetViewport(): void {
    this.panZoomService.resetViewport();
  }

  // 獲取標記 ID
  private getMarkerId(_edge: EdgeType, position: 'start' | 'end', marker: EdgeMarker): string {
    const type = marker.type || MarkerType.ArrowClosed;
    const color = (marker.color || '#b1b1b7').replace('#', '');
    return `angular-flow__marker-${position}-${type}-${color}`;
  }

  // 獲取標記 URL
  getMarkerUrl(edge: EdgeType, position: 'start' | 'end'): string | null {
    const marker = position === 'start' ? edge.markerStart : edge.markerEnd;
    if (!marker) return null;
    
    const markerData = typeof marker === 'string' ? { type: MarkerType.ArrowClosed } : marker;
    const markerId = this.getMarkerId(edge, position, markerData);
    return `url(#${markerId})`;
  }
}
