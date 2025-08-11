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
} from '../types';
import { NodeWrapperComponent } from '../node-wrapper/node-wrapper.component';
import { EdgeWrapperComponent } from '../edge-wrapper/edge-wrapper.component';
import { ConnectionLineComponent } from '../connection-line/connection-line.component';
import { AngularXYFlowService } from '../services/angular-xyflow.service';
import { MarkerDefinitionsComponent } from '../marker/marker-definitions.component';

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
        @for (edge of visibleEdges(); track edge.id) {
          @let connectionPoints = edgeConnectionPointsMap().get(edge.id);
          @if (connectionPoints) {
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
          }
        }
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
        [style.z-index]="'2'"
      >
        @for (node of visibleNodes(); track node.id) {
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
          (nodeDrag)="nodeDrag.emit({ event: $event.event, position: $event.position, node })"
          (nodeDragStop)="nodeDragStop.emit({ event: $event, node })"
          (connectStart)="connectStart.emit({ event: $event.event, node })"
          (connectEnd)="connectEnd.emit($event)"
          (handleClick)="handleClick.emit($event)"
        />
        }
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
  customConnectionLineTemplate = input<TemplateRef<ConnectionLineTemplateContext> | undefined>();
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
  getEdgeConnectionPoints = input.required<(sourceNode: NodeType, targetNode: NodeType, edge: EdgeType) => EdgeConnectionPoints>();
  getMarkerId = input.required<(edge: any, position: 'start' | 'end', marker: EdgeMarker) => string>();

  // 計算 Edge 連接點
  // 注意：移除快取機制，確保節點位置變化時能正確更新
  // React 版本的做法是在每個 EdgeWrapper 內部獨立計算，這裡為了架構一致性在父組件計算
  readonly edgeConnectionPointsMap = computed(() => {
    const edges = this.visibleEdges();
    const getNode = this.getNodeById();
    const getConnectionPoints = this.getEdgeConnectionPoints();
    
    const connectionPointsMap = new Map<string, EdgeConnectionPoints>();
    
    // 不使用快取，確保每次節點位置改變時都能重新計算
    edges.forEach(edge => {
      const sourceNode = getNode(edge.source);
      const targetNode = getNode(edge.target);
      
      if (sourceNode && targetNode) {
        const connectionPoints = getConnectionPoints(sourceNode, targetNode, edge);
        connectionPointsMap.set(edge.id, connectionPoints);
      }
    });
    
    return connectionPointsMap;
  });

  // 輸出事件
  nodeClick = output<{ event: MouseEvent; node: NodeType }>();
  nodeDoubleClick = output<{ event: MouseEvent; node: NodeType }>();
  nodeContextMenu = output<{ event: MouseEvent; node: NodeType }>();
  nodeFocus = output<{ event: FocusEvent; node: NodeType }>();
  nodeDragStart = output<{ event: MouseEvent; node: NodeType }>();
  nodeDrag = output<{ event: MouseEvent; position: { x: number; y: number }; node: NodeType }>();
  nodeDragStop = output<{ event: MouseEvent; node: NodeType }>();
  connectStart = output<{ event: MouseEvent; node: NodeType }>();
  connectEnd = output<{ connection?: any; event: MouseEvent }>();
  handleClick = output<{ event: MouseEvent; nodeId: string; handleId?: string; handleType: string }>();
  edgeClick = output<{ event: MouseEvent; edge: EdgeType }>();
  edgeDoubleClick = output<{ event: MouseEvent; edge: EdgeType }>();
  edgeContextMenu = output<{ event: MouseEvent; edge: EdgeType }>();
  edgeFocus = output<{ event: FocusEvent; edge: EdgeType }>();
  edgeKeyDown = output<{ event: KeyboardEvent; edge: EdgeType }>();

  // 視圖子元素
  viewportElement = viewChild.required<ElementRef<HTMLDivElement>>('viewport');

  // 注入服務
  private _flowService = inject(AngularXYFlowService);

  // 計算信號 - 判斷邊是否可聚焦（類似 React 版本的邏輯）
  isEdgeFocusable = computed(() => {
    return (edge: EdgeType) => {
      // React 版本邏輯：edge.focusable || (edgesFocusable && typeof edge.focusable === 'undefined')
      const edgesFocusable = this._flowService.edgesFocusable();
      return !!(edge.focusable || (edgesFocusable && typeof edge.focusable === 'undefined'));
    };
  });

  // 常數
}
