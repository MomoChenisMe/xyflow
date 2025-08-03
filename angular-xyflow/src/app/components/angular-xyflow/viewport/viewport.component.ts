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
  MarkerType,
  ConnectionLineTemplateContext,
} from '../types';
import { NodeTemplateDirective } from '../node-template.directive';
import { NodeWrapperComponent } from '../node-wrapper/node-wrapper.component';
import { EdgeComponent } from '../edge/edge.component';
import { ConnectionLineComponent } from '../connection-line/connection-line.component';
import { AngularXYFlowService } from '../services/angular-xyflow.service';

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
    EdgeComponent,
    ConnectionLineComponent,
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
      <!-- Edges layer -->
      <svg:svg
        class="xy-flow__edges angular-xyflow__edges"
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
        }
        
        @for (edge of visibleEdges(); track edge.id) {
          @let sourceNode = getNodeById()(edge.source);
          @let targetNode = getNodeById()(edge.target);
          @if (sourceNode && targetNode) {
            @let connectionPoints = getEdgeConnectionPoints()(sourceNode, targetNode, edge);
            @let edgeFocusable = isEdgeFocusable()(edge);
            <svg:g
              class="angular-xyflow__edge xy-flow__edge"
              [class.selected]="edge.selected"
              [class.animated]="edge.animated"
              [class.selectable]="edge.selectable !== false"
              [attr.tabindex]="edgeFocusable ? 0 : null"
              (focus)="edgeFocusable ? edgeFocus.emit({ event: $event, edge }) : null"
              (keydown)="edgeFocusable ? edgeKeyDown.emit({ event: $event, edge }) : null"
              angular-xyflow-edge
              [edge]="edge"
              [sourceX]="connectionPoints.sourceX"
              [sourceY]="connectionPoints.sourceY"
              [targetX]="connectionPoints.targetX"
              [targetY]="connectionPoints.targetY"
              [sourcePosition]="connectionPoints.sourcePosition"
              [targetPosition]="connectionPoints.targetPosition"
              [isDarkMode]="isDarkMode()"
              [getMarkerId]="getMarkerId()"
              (edgeClick)="edgeClick.emit($event)"
            />
          }
        }
      </svg:svg>

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
          (nodeClick)="nodeClick.emit({ event: $event, node })"
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
  hasEdgeMarkers = input.required<boolean>();
  edgeMarkers = input.required<Array<{
    id: string;
    type: MarkerType;
    color?: string;
    width?: number;  
    height?: number;
    orient?: string;
    markerUnits?: string;
    strokeWidth?: number;
  }>>();
  connectionInProgress = input.required<ConnectionState | null>();
  customConnectionLineTemplate = input<TemplateRef<ConnectionLineTemplateContext> | undefined>();
  connectionLineStyle = input<Record<string, any>>();
  customNodeTemplates = input<readonly any[]>([]);
  isDarkMode = input<boolean>(false);
  
  // 函數輸入
  getNodeById = input.required<(id: string) => NodeType | undefined>();
  getEdgeConnectionPoints = input.required<(sourceNode: NodeType, targetNode: NodeType, edge: EdgeType) => EdgeConnectionPoints>();
  getMarkerId = input.required<(edge: any, position: 'start' | 'end', marker: EdgeMarker) => string>();
  
  // 輸出事件
  nodeClick = output<{ event: MouseEvent; node: NodeType }>();
  nodeFocus = output<{ event: FocusEvent; node: NodeType }>();
  nodeDragStart = output<{ event: MouseEvent; node: NodeType }>();
  nodeDrag = output<{ event: MouseEvent; position: { x: number; y: number }; node: NodeType }>();
  nodeDragStop = output<{ event: MouseEvent; node: NodeType }>();
  connectStart = output<{ event: MouseEvent; node: NodeType }>();
  connectEnd = output<{ connection?: any; event: MouseEvent }>();
  handleClick = output<{ event: MouseEvent; nodeId: string; handleId?: string; handleType: string }>();
  edgeClick = output<{ event: MouseEvent; edge: EdgeType }>();
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
  markerType = MarkerType;
}