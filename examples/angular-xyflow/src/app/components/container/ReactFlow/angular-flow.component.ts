import { 
  Component, 
  input,
  output,
  ChangeDetectionStrategy,
  ElementRef,
  viewChild,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '../../../types/node';
import { AngularEdge } from '../../types/edges';
import { WrapperComponent } from './wrapper.component';

/**
 * AngularFlow 主組件
 * 對應 React Flow 的 ReactFlow 組件
 * 提供類似 ReactFlow 的 API 和功能
 */
@Component({
  selector: 'angular-flow',
  standalone: true,
  imports: [CommonModule, WrapperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      #reactFlowWrapper
      class="react-flow xy-flow" 
      [class]="className() || ''"
      style="width: 100%; height: 100%; position: relative; z-index: 0; overflow: hidden;"
      (scroll)="onWrapperScroll($event)"
      role="application"
      [attr.id]="id()"
    >
      <!-- Wrapper 組件 - 對應 React 的組件層級結構 -->
      <angular-flow-wrapper
        [nodes]="nodes()"
        [edges]="edges()"
        [defaultNodes]="defaultNodes()"
        [defaultEdges]="defaultEdges()"
        [width]="width()"
        [height]="height()"
        [fitView]="fitView()"
        [fitViewOptions]="fitViewOptions()"
        [minZoom]="minZoom()"
        [maxZoom]="maxZoom()"
        [nodeOrigin]="nodeOrigin()"
        [nodeExtent]="nodeExtent()"
        [className]="className()"
        [nodeTypes]="nodeTypes()"
        [edgeTypes]="edgeTypes()"
        [connectionLineType]="connectionLineType()"
        [connectionLineStyle]="connectionLineStyle()"
        [connectionMode]="connectionMode()"
        [connectOnClick]="connectOnClick()"
        [defaultEdgeOptions]="defaultEdgeOptions()"
        [connectionDragThreshold]="connectionDragThreshold()"
        [reconnectRadius]="reconnectRadius()"
        [selectionKeyCode]="selectionKeyCode()"
        [selectionOnDrag]="selectionOnDrag()"
        [selectionMode]="selectionMode()"
        [multiSelectionKeyCode]="multiSelectionKeyCode()"
        [elementsSelectable]="elementsSelectable()"
        [selectNodesOnDrag]="selectNodesOnDrag()"
        [panActivationKeyCode]="panActivationKeyCode()"
        [zoomActivationKeyCode]="zoomActivationKeyCode()"
        [translateExtent]="translateExtent()"
        [preventScrolling]="preventScrolling()"
        [zoomOnScroll]="zoomOnScroll()"
        [zoomOnPinch]="zoomOnPinch()"
        [zoomOnDoubleClick]="zoomOnDoubleClick()"
        [panOnScroll]="panOnScroll()"
        [panOnScrollSpeed]="panOnScrollSpeed()"
        [panOnScrollMode]="panOnScrollMode()"
        [panOnDrag]="panOnDrag()"
        [deleteKeyCode]="deleteKeyCode()"
        [disableKeyboardA11y]="disableKeyboardA11y()"
        [onlyRenderVisibleElements]="onlyRenderVisibleElements()"
        [nodesDraggable]="nodesDraggable()"
        [nodesConnectable]="nodesConnectable()"
        [nodesFocusable]="nodesFocusable()"
        [nodeDragThreshold]="nodeDragThreshold()"
        [edgesFocusable]="edgesFocusable()"
        [edgesReconnectable]="edgesReconnectable()"
        [elevateEdgesOnSelect]="elevateEdgesOnSelect()"
        [elevateNodesOnSelect]="elevateNodesOnSelect()"
        [snapToGrid]="snapToGrid()"
        [snapGrid]="snapGrid()"
        [noDragClassName]="noDragClassName()"
        [noWheelClassName]="noWheelClassName()"
        [noPanClassName]="noPanClassName()"
        [paneClickDistance]="paneClickDistance()"
        [nodeClickDistance]="nodeClickDistance()"
        [defaultMarkerColor]="defaultMarkerColor()"
        [rfId]="rfId()"
        [debug]="debug()"
        [ariaLabelConfig]="ariaLabelConfig()"
        [inputViewport]="viewport()"
        (onInit)="onInit.emit($event)"
        (onNodeClick)="onNodeClick.emit($event)"
        (onNodeMouseEnter)="onNodeMouseEnter.emit($event)"
        (onNodeMouseMove)="onNodeMouseMove.emit($event)"
        (onNodeMouseLeave)="onNodeMouseLeave.emit($event)"
        (onNodeContextMenu)="onNodeContextMenu.emit($event)"
        (onNodeDoubleClick)="onNodeDoubleClick.emit($event)"
        (onNodeDragStart)="onNodeDragStart.emit($event)"
        (onNodeDrag)="onNodeDrag.emit($event)"
        (onNodeDragStop)="onNodeDragStop.emit($event)"
        (onEdgeClick)="onEdgeClick.emit($event)"
        (onEdgeContextMenu)="onEdgeContextMenu.emit($event)"
        (onEdgeDoubleClick)="onEdgeDoubleClick.emit($event)"
        (onEdgeMouseEnter)="onEdgeMouseEnter.emit($event)"
        (onEdgeMouseMove)="onEdgeMouseMove.emit($event)"
        (onEdgeMouseLeave)="onEdgeMouseLeave.emit($event)"
        (onSelectionChange)="onSelectionChange.emit($event)"
        (onSelectionDragStart)="onSelectionDragStart.emit($event)"
        (onSelectionDrag)="onSelectionDrag.emit($event)"
        (onSelectionDragStop)="onSelectionDragStop.emit($event)"
        (onSelectionContextMenu)="onSelectionContextMenu.emit($event)"
        (onSelectionStart)="onSelectionStart.emit($event)"
        (onSelectionEnd)="onSelectionEnd.emit($event)"
        (onConnect)="onConnect.emit($event)"
        (onConnectStart)="onConnectStart.emit($event)"
        (onConnectEnd)="onConnectEnd.emit($event)"
        (onClickConnectStart)="onClickConnectStart.emit($event)"
        (onClickConnectEnd)="onClickConnectEnd.emit($event)"
        (onReconnect)="onReconnect.emit($event)"
        (onReconnectStart)="onReconnectStart.emit($event)"
        (onReconnectEnd)="onReconnectEnd.emit($event)"
        (onNodesDelete)="onNodesDelete.emit($event)"
        (onEdgesDelete)="onEdgesDelete.emit($event)"
        (onDelete)="onDelete.emit($event)"
        (onBeforeDelete)="onBeforeDelete.emit($event)"
        (onMove)="onMove.emit($event)"
        (onMoveStart)="onMoveStart.emit($event)"
        (onMoveEnd)="onMoveEnd.emit($event)"
        (onViewportChange)="onViewportChange.emit($event)"
        (onNodesChange)="handleNodesChange($event)"
        (onEdgesChange)="onEdgesChange.emit($event)"
        (onNodePositionChange)="onNodePositionChange.emit($event)"
        (onError)="onError.emit($event)"
      >
        <!-- 內容投影 - 對應 React 的 children -->
        <ng-content></ng-content>
      </angular-flow-wrapper>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    
    .react-flow {
      width: 100%;
      height: 100%;
      position: relative;
      z-index: 0;
    }
  `]
})
export class AngularFlowComponent implements AfterViewInit, OnDestroy {
  reactFlowWrapper = viewChild.required<ElementRef<HTMLDivElement>>('reactFlowWrapper');

  // === 核心 Props (對應 ReactFlow props) ===
  
  // 節點和邊
  nodes = input<Node[]>();
  edges = input<AngularEdge[]>();
  defaultNodes = input<Node[]>([]);
  defaultEdges = input<AngularEdge[]>([]);
  
  // 尺寸
  width = input<number>();
  height = input<number>();
  
  // 視口控制
  fitView = input<boolean>(false);
  fitViewOptions = input<any>();
  minZoom = input<number>(0.5);
  maxZoom = input<number>(2);
  nodeOrigin = input<[number, number]>([0, 0]);
  nodeExtent = input<any>();
  
  // 組件類型和樣式
  className = input<string>('');
  nodeTypes = input<any>();
  edgeTypes = input<any>();
  
  // 連接相關
  connectionLineType = input<string>('default');
  connectionLineStyle = input<any>();
  connectionMode = input<string>();
  connectOnClick = input<boolean>(true);
  defaultEdgeOptions = input<any>();
  connectionDragThreshold = input<number>(1);
  reconnectRadius = input<number>(10);
  
  // 選擇相關
  selectionKeyCode = input<string>('Shift');
  selectionOnDrag = input<boolean>(false);
  selectionMode = input<'partial' | 'full'>('full');
  multiSelectionKeyCode = input<string>('Meta');
  elementsSelectable = input<boolean>(true);
  selectNodesOnDrag = input<boolean>(true);
  
  // 平移和縮放
  panActivationKeyCode = input<string>('Space');
  zoomActivationKeyCode = input<string>('Meta');
  translateExtent = input<any>();
  preventScrolling = input<boolean>(true);
  zoomOnScroll = input<boolean>(true);
  zoomOnPinch = input<boolean>(true);
  zoomOnDoubleClick = input<boolean>(true);
  panOnScroll = input<boolean>(false);
  panOnScrollSpeed = input<number>(0.5);
  panOnScrollMode = input<string>('free');
  panOnDrag = input<boolean>(true);
  
  // 鍵盤
  deleteKeyCode = input<string>('Backspace');
  disableKeyboardA11y = input<boolean>(false);
  
  // 渲染
  onlyRenderVisibleElements = input<boolean>(false);
  
  // 節點行為
  nodesDraggable = input<boolean>(true);
  nodesConnectable = input<boolean>(true);
  nodesFocusable = input<boolean>(true);
  nodeDragThreshold = input<number>(1);
  
  // 邊行為
  edgesFocusable = input<boolean>(true);
  edgesReconnectable = input<boolean>(true);
  elevateEdgesOnSelect = input<boolean>(false);
  elevateNodesOnSelect = input<boolean>(true);
  
  // 網格對齊
  snapToGrid = input<boolean>(false);
  snapGrid = input<[number, number]>([15, 15]);
  
  // 樣式類名
  noDragClassName = input<string>('nodrag');
  noWheelClassName = input<string>('nowheel');
  noPanClassName = input<string>('nopan');
  
  // 其他
  paneClickDistance = input<number>(0);
  nodeClickDistance = input<number>(0);
  defaultMarkerColor = input<string>('#b1b1b7');
  rfId = input<string>('1');
  debug = input<boolean>(false);
  ariaLabelConfig = input<any>();
  viewport = input<any>();
  id = input<string>();

  // === 事件輸出 (對應 ReactFlow callbacks) ===
  
  // 初始化
  onInit = output<any>();
  
  // 節點事件
  onNodeClick = output<any>();
  onNodeMouseEnter = output<any>();
  onNodeMouseMove = output<any>();
  onNodeMouseLeave = output<any>();
  onNodeContextMenu = output<any>();
  onNodeDoubleClick = output<any>();
  onNodeDragStart = output<any>();
  onNodeDrag = output<any>();
  onNodeDragStop = output<any>();
  
  // 邊事件
  onEdgeClick = output<any>();
  onEdgeContextMenu = output<any>();
  onEdgeDoubleClick = output<any>();
  onEdgeMouseEnter = output<any>();
  onEdgeMouseMove = output<any>();
  onEdgeMouseLeave = output<any>();
  
  // 選擇事件
  onSelectionChange = output<any>();
  onSelectionDragStart = output<any>();
  onSelectionDrag = output<any>();
  onSelectionDragStop = output<any>();
  onSelectionContextMenu = output<any>();
  onSelectionStart = output<any>();
  onSelectionEnd = output<any>();
  
  // 連接事件
  onConnect = output<any>();
  onConnectStart = output<any>();
  onConnectEnd = output<any>();
  onClickConnectStart = output<any>();
  onClickConnectEnd = output<any>();
  onReconnect = output<any>();
  onReconnectStart = output<any>();
  onReconnectEnd = output<any>();
  
  // 刪除事件
  onNodesDelete = output<any>();
  onEdgesDelete = output<any>();
  onDelete = output<any>();
  onBeforeDelete = output<any>();
  
  // 視口事件
  onMove = output<any>();
  onMoveStart = output<any>();
  onMoveEnd = output<any>();
  onViewportChange = output<any>();
  
  // 變更事件
  onNodesChange = output<Node[]>();
  onEdgesChange = output<AngularEdge[]>();
  onNodePositionChange = output<{ node: Node; position: { x: number; y: number } }>();
  
  // 其他事件
  onError = output<any>();

  // 🔥 CRITICAL: React Flow's scroll reset mechanism 
  // Prevents viewport from shifting when nodes are outside bounds
  onWrapperScroll(event: Event) {
    const target = event.currentTarget as HTMLElement;
    if (target) {
      // Reset scroll position immediately to prevent viewport drift
      target.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }

  handleNodesChange(nodes: Node[]) {
    console.log('🎉 AngularFlowComponent handleNodesChange called with', nodes.length, 'nodes');
    
    // 檢查節點位置變化
    nodes.forEach((node, index) => {
      console.log(`Node ${node.id} position: (${node.position.x}, ${node.position.y})`);
    });
    
    this.onNodesChange.emit(nodes);
    console.log('🎉 AngularFlowComponent emitted onNodesChange');
  }

  ngAfterViewInit() {
    // 組件初始化完成後的邏輯
  }

  ngOnDestroy() {
    // 清理邏輯
  }
}