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
} from './types';
import { NodeWrapperComponent } from './node-wrapper/node-wrapper.component';
import { EdgeWrapperComponent } from './edge-wrapper/edge-wrapper.component';
import { type Connection } from '@xyflow/system';

@Component({
  selector: 'angular-flow',
  standalone: true,
  imports: [CommonModule, NodeWrapperComponent, EdgeWrapperComponent],
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
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#b1b1b7" />
            </marker>
          </defs>

          <!-- 調試：顯示邊的循環狀態 -->
          <text x="10" y="20" fill="purple" font-size="12">
            邊總數: {{ visibleEdges().length }}
          </text>

          @for (edge of visibleEdges(); track edge.id) {
            @let sourceNode = getNodeById(edge.source);
            @let targetNode = getNodeById(edge.target);

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
                  [attr.marker-end]="'url(#arrowhead)'"
                  [class]="'angular-flow__edge-path xy-flow__edge-path'"
                  style="pointer-events: stroke;"
                />

                <!-- Edge label -->
                @if (edge.data?.['label']) {
                  <text
                    [attr.x]="(sourceNode.position.x + targetNode.position.x) / 2 + 75"
                    [attr.y]="(sourceNode.position.y + targetNode.position.y) / 2 + 20"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    class="angular-flow__edge-label xy-flow__edge-label"
                    style="font-size: 12px; fill: #222; pointer-events: none;"
                  >
                    {{ edge.data?.['label'] }}
                  </text>
                }
              </g>
            }
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
      edges: result
    });

    return result;
  });

  readonly viewportTransform = computed(() => {
    const viewport = this.flowService.viewport();
    return `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`;
  });

  // 流程實例
  readonly flowInstance = computed(() => this.flowService.getFlowInstance());

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

  // 計算邊路徑
  calculateEdgePath(sourceNode: NodeType, targetNode: NodeType, edge: EdgeType): string {
    // 使用節點的實際尺寸，如果沒有則使用默認值
    const sourceWidth = (sourceNode as any).width || 150;
    const sourceHeight = (sourceNode as any).height || 40;
    const targetWidth = (targetNode as any).width || 150;
    const targetHeight = (targetNode as any).height || 40;

    // 計算節點中心點
    const sourceX = sourceNode.position.x + sourceWidth / 2;
    const sourceY = sourceNode.position.y + sourceHeight / 2;
    const targetX = targetNode.position.x + targetWidth / 2;
    const targetY = targetNode.position.y + targetHeight / 2;

    // 根據邊類型返回不同的路徑
    const edgeType = (edge as any).type || 'default';

    switch (edgeType) {
      case 'straight':
        return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;

      case 'step':
        const midX = (sourceX + targetX) / 2;
        return `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;

      case 'default':
      case 'bezier':
      default:
        // 簡化的貝茲曲線
        const controlX1 = sourceX + (targetX - sourceX) * 0.3;
        const controlX2 = sourceX + (targetX - sourceX) * 0.7;
        return `M ${sourceX} ${sourceY} C ${controlX1} ${sourceY}, ${controlX2} ${targetY}, ${targetX} ${targetY}`;
    }
  }

  // 事件處理方法
  handleNodeClick(event: MouseEvent, node: NodeType) {
    this.onNodeClick.emit({ event, node });
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

  handleConnectStart(event: MouseEvent, node: NodeType) {
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
}
