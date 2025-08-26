import {
  Component,
  input,
  output,
  viewChild,
  ElementRef,
  ChangeDetectionStrategy,
  TemplateRef,
  inject,
  computed,
  ViewContainerRef,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position } from '@xyflow/system';
import {
  AngularNode,
  AngularEdge,
  EdgeMarker,
  ConnectionLineTemplateContext,
  NodeTypes,
  EdgeTypes,
} from '../../types';
import { NodeWrapperComponent } from '../../components/node-wrapper/node-wrapper.component';
import { EdgeWrapperComponent } from '../../components/edge-wrapper/edge-wrapper.component';
import { ConnectionLineComponent } from '../../components/connection-line/connection-line.component';
import { AngularXYFlowService } from '../../services/angular-xyflow.service';
import { ViewportPortalService } from '../../services/viewport-portal.service';
import { MarkerDefinitionsComponent } from '../edge-renderer/marker-definitions.component';

// 連接狀態類型定義
export interface ConnectionState {
  inProgress: boolean;
  from: { x: number; y: number };
  to: { x: number; y: number };
  fromPosition: Position;
  toPosition: Position;
  isValid?: boolean | null;
}

// 邊連接點類型定義
export interface EdgeConnectionPoints {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
}

@Component({
  selector: 'angular-xyflow-viewport',
  standalone: true,
  imports: [
    CommonModule,
    NodeWrapperComponent,
    EdgeWrapperComponent,
    ConnectionLineComponent,
    MarkerDefinitionsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #viewport
      class="xy-flow__viewport angular-xyflow__viewport"
      [style.transform]="viewportTransform()"
      [style.transform-origin]="'0 0'"
      [style.position]="'absolute'"
      [style.top]="'0'"
      [style.left]="'0'"
      [style.width]="'100%'"
      [style.height]="'100%'"
    >
      <!-- Marker definitions - 使用獨立的 MarkerDefinitions 組件 -->
      <angular-xyflow-marker-definitions
        [edges]="visibleEdges()"
        [defaultColor]="defaultMarkerColor()"
        [rfId]="rfId()"
        [defaultMarkerStart]="defaultMarkerStart()"
        [defaultMarkerEnd]="defaultMarkerEnd()"
      />

      <!-- Edges layer -->
      <div class="xy-flow__edges angular-xyflow__edges">
        @for (edge of visibleEdgesFiltered(); track edge.id) { @let connectionPoints =
        edgeConnectionPointsMap().get(edge.id); @if (connectionPoints) {
        <angular-xyflow-edge-wrapper
          [edge]="edge"
          [sourceX]="connectionPoints.sourceX"
          [sourceY]="connectionPoints.sourceY"
          [targetX]="connectionPoints.targetX"
          [targetY]="connectionPoints.targetY"
          [sourcePosition]="connectionPoints.sourcePosition"
          [targetPosition]="connectionPoints.targetPosition"
          [isDarkMode]="isDarkMode()"
          [edgeTypes]="edgeTypes()"
          [getMarkerId]="getMarkerId()"
          (edgeClick)="edgeClick.emit($event)"
          (edgeDoubleClick)="edgeDoubleClick.emit($event)"
          (edgeContextMenu)="edgeContextMenu.emit($event)"
          (edgeFocus)="edgeFocus.emit($event)"
          (edgeKeyDown)="edgeKeyDown.emit($event)"
        />
        } }
      </div>

      <!-- Connection Line - 顯示連接進行中的線條（獨立層，高於節點） -->
      @if (connectionInProgress()) {
      <svg:svg
        class="xy-flow__connectionline angular-xyflow__connectionline xy-flow__container"
        [style.position]="'absolute'"
        [style.top]="'0'"
        [style.left]="'0'"
        [style.width]="'100%'"
        [style.height]="'100%'"
        [style.pointer-events]="'none'"
        [style.z-index]="'1001'"
        [style.overflow]="'visible'"
        angular-xyflow-connection-line
        [connectionState]="connectionInProgress()"
        [customTemplate]="customConnectionLineTemplate()"
        [connectionLineStyle]="connectionLineStyle()"
      />
      }

      <!-- Nodes layer -->
      <div
        class="xy-flow__nodes angular-xyflow__nodes"
        [style.position]="'absolute'"
        [style.top]="'0'"
        [style.left]="'0'"
        [style.width]="'100%'"
        [style.height]="'100%'"
      >
        @for (node of visibleNodesFiltered(); track node.id) {
        <angular-xyflow-node
          [node]="node"
          [selected]="node.selected || false"
          [dragging]="node.dragging || false"
          [customNodeTemplates]="customNodeTemplates()"
          [nodeTypes]="nodeTypes()"
          (nodeClick)="nodeClick.emit({ event: $event, node })"
          (nodeDoubleClick)="nodeDoubleClick.emit({ event: $event, node })"
          (nodeContextMenu)="nodeContextMenu.emit({ event: $event, node })"
          (nodeFocus)="nodeFocus.emit({ event: $event, node })"
          (nodeDragStart)="nodeDragStart.emit({ event: $event, node })"
          (nodeDrag)="
            nodeDrag.emit({
              event: $event.event,
              position: $event.position,
              node
            })
          "
          (nodeDragStop)="nodeDragStop.emit({ event: $event, node })"
          (connectStart)="connectStart.emit({ event: $event.event, node })"
          (connectEnd)="connectEnd.emit($event)"
          (handleClick)="handleClick.emit($event)"
        />
        }
      </div>

      <!-- 🔑 關鍵修正：Viewport Portal 容器在 viewport 內部，自動繼承變換 -->
      <div
        #viewportPortalContainer
        class="angular-xyflow__viewport-portal"
        [style.position]="'absolute'"
        [style.top]="'0'"
        [style.left]="'0'"
        [style.width]="'100%'"
        [style.height]="'100%'"
        [style.pointer-events]="'none'"
        [style.z-index]="'10'"
      >
        <!-- 靜態內容投影 -->
        <ng-content select="[viewportPortal]"></ng-content>
        <!-- 動態內容容器 -->
        <ng-container #viewportPortalDynamic></ng-container>
      </div>
    </div>
  `,
  styles: [
    `
      .angular-xyflow__viewport {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      .angular-xyflow__pane {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
        cursor: default;
      }

      .angular-xyflow__pane.draggable {
        cursor: grab;
      }

      .angular-xyflow__pane.dragging {
        cursor: grabbing;
      }

      .angular-xyflow__pane.selection {
        cursor: crosshair;
      }

      .angular-xyflow__edges {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }

      .angular-xyflow__nodes {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      /* Viewport Portal 樣式 - 在 viewport 內部，自動繼承變換 */
      .angular-xyflow__viewport-portal {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10;
      }

      .angular-xyflow__viewport-portal > * {
        pointer-events: auto; /* 允許子元素接收事件 */
      }
    `,
  ],
})
export class ViewportComponent<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> {
  // 輸入信號
  viewportTransform = input.required<string>();
  visibleNodes = input.required<NodeType[]>();
  visibleEdges = input.required<EdgeType[]>();
  connectionInProgress = input.required<ConnectionState | null>();
  customConnectionLineTemplate = input<
    TemplateRef<ConnectionLineTemplateContext> | undefined
  >();
  connectionLineStyle = input<Record<string, any>>();
  customNodeTemplates = input<readonly any[]>([]);
  nodeTypes = input<NodeTypes>();
  edgeTypes = input<EdgeTypes>();
  isDarkMode = input<boolean>(false);
  defaultMarkerColor = input<string>('#b1b1b7');
  rfId = input<string>();
  defaultMarkerStart = input<EdgeMarker | string>();
  defaultMarkerEnd = input<EdgeMarker | string>();

  // 函數輸入
  getNodeById = input.required<(id: string) => NodeType | undefined>();
  getEdgeConnectionPoints =
    input.required<
      (
        sourceNodeId: string,
        targetNodeId: string,
        edge: EdgeType
      ) => EdgeConnectionPoints
    >();
  getMarkerId =
    input.required<
      (edge: any, position: 'start' | 'end', marker: EdgeMarker) => string
    >();

  // 過濾掉隱藏的節點，實現與 React Flow 完全一致的 DOM 結構
  visibleNodesFiltered = computed(() =>
    this.visibleNodes().filter(node => !node.hidden)
  );

  // 計算 Edge 連接點
  // 注意：移除快取機制，確保節點位置變化時能正確更新
  // React 版本的做法是在每個 EdgeWrapper 內部獨立計算，這裡為了架構一致性在父組件計算
  edgeConnectionPointsMap = computed(() => {
    const edges = this.visibleEdges();
    const nodes = this.visibleNodes(); // 🔑 React Flow 等效：最新的節點數據源
    const getConnectionPoints = this.getEdgeConnectionPoints();

    const connectionPointsMap = new Map<string, EdgeConnectionPoints>();

    // 🔑 關鍵修正：完全模仿 React Flow 的做法
    // React Flow: 使用 store.nodeLookup.get(nodeId)，我們使用傳入的最新 nodes
    edges.forEach((edge) => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        // 🔑 關鍵修正：按照 React Flow 模式，傳遞節點 ID 而非節點對象
        const connectionPoints = getConnectionPoints(
          sourceNode.id,  // 傳遞節點 ID，讓方法內動態獲取最新狀態
          targetNode.id,  // 傳遞節點 ID，讓方法內動態獲取最新狀態
          edge
        );
        
        connectionPointsMap.set(edge.id, connectionPoints);
      }
    });
    return connectionPointsMap;
  });

  // 過濾掉隱藏的邊緣，包含完整的 React Flow 邏輯
  visibleEdgesFiltered = computed(() => {
    const edges = this.visibleEdges();
    const connectionPointsMap = this.edgeConnectionPointsMap();

    return edges.filter(edge => {
      // React Flow 邏輯：檢查邊緣隱藏狀態
      if (edge.hidden) {
        return false;
      }

      const connectionPoints = connectionPointsMap.get(edge.id);
      if (!connectionPoints) {
        return false;
      }

      // React Flow 邏輯：檢查座標有效性
      const { sourceX, sourceY, targetX, targetY } = connectionPoints;
      if (sourceX === null || sourceY === null || targetX === null || targetY === null) {
        return false;
      }

      return true;
    });
  });

  // 輸出事件
  nodeClick = output<{ event: MouseEvent; node: NodeType }>();
  nodeDoubleClick = output<{ event: MouseEvent; node: NodeType }>();
  nodeContextMenu = output<{ event: MouseEvent; node: NodeType }>();
  nodeFocus = output<{ event: FocusEvent; node: NodeType }>();
  nodeDragStart = output<{ event: MouseEvent; node: NodeType }>();
  nodeDrag = output<{
    event: MouseEvent;
    position: { x: number; y: number };
    node: NodeType;
  }>();
  nodeDragStop = output<{ event: MouseEvent; node: NodeType }>();
  connectStart = output<{ event: MouseEvent; node: NodeType }>();
  connectEnd = output<{ connection?: any; event: MouseEvent }>();
  handleClick = output<{
    event: MouseEvent;
    nodeId: string;
    handleId?: string;
    handleType: string;
  }>();
  edgeClick = output<{ event: MouseEvent; edge: EdgeType }>();
  edgeDoubleClick = output<{ event: MouseEvent; edge: EdgeType }>();
  edgeContextMenu = output<{ event: MouseEvent; edge: EdgeType }>();
  edgeFocus = output<{ event: FocusEvent; edge: EdgeType }>();
  edgeKeyDown = output<{ event: KeyboardEvent; edge: EdgeType }>();

  // 視圖子元素
  viewportElement = viewChild.required<ElementRef<HTMLDivElement>>('viewport');
  viewportPortalDynamic = viewChild('viewportPortalDynamic', { read: ViewContainerRef });

  // 注入服務
  private _flowService = inject(AngularXYFlowService);
  private _portalService = inject(ViewportPortalService);

  // 計算信號 - 判斷邊是否可聚焦（類似 React 版本的邏輯）
  isEdgeFocusable = computed(() => {
    return (edge: EdgeType) => {
      // React 版本邏輯：edge.focusable || (edgesFocusable && typeof edge.focusable === 'undefined')
      const edgesFocusable = this._flowService.edgesFocusable();
      return !!(
        edge.focusable ||
        (edgesFocusable && typeof edge.focusable === 'undefined')
      );
    };
  });

  constructor() {
    // 🔑 關鍵修復：監聽 ViewportPortalService 並渲染動態內容
    effect(() => {
      const container = this.viewportPortalDynamic();
      const activeItems = this._portalService.activeItems();

      if (container) {
        // 清空現有內容
        container.clear();

        // 渲染所有活躍的 portal 項目
        activeItems.forEach(item => {
          if (item.content instanceof TemplateRef) {
            container.createEmbeddedView(item.content, {
              $implicit: item.data,
              data: item.data
            });
          }
        });
      }
    });
  }
}
