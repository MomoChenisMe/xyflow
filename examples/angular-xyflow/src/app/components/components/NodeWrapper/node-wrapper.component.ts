import { 
  Component, 
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
  ElementRef,
  viewChild,
  AfterViewInit,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '../../../types/node';
import { HandleComponent } from '../Handle/handle.component';
import { Position, XYDrag, type XYDragInstance } from '@xyflow/system';
import { NodeIdService } from '../../contexts/node-id.service';
import { FlowStoreService } from '../../store/flow-store.service';

/**
 * NodeWrapper 組件 - 負責單個節點的渲染和拖拽功能
 * 
 * 這個組件使用最新的 Angular Signal API 實現，對應 React Flow 的 NodeWrapper 組件。
 * 負責單個節點的渲染、拖拽交互、選擇狀態管理等核心功能。
 * 
 * @component
 * @selector angular-node-wrapper
 * @example
 * ```html
 * <angular-node-wrapper 
 *   [node]="nodeData"
 *   [index]="nodeIndex"
 *   [viewport]="currentViewport"
 *   [isDraggable]="true"
 *   [isSelectable]="true"
 *   [isConnectable]="true"
 *   (onNodeClick)="handleNodeClick($event)"
 *   (onNodeDragStart)="handleDragStart($event)">
 * </angular-node-wrapper>
 * ```
 * 
 * @remarks 這個組件處理節點的拖拽邏輯，包括與 XYDrag 系統的集成，
 * 支持多選、拖拽閾值、自動平移等高級功能。
 */
@Component({
  selector: 'angular-node-wrapper',
  standalone: true,
  imports: [CommonModule, HandleComponent],
  providers: [NodeIdService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      #nodeElement
      class="react-flow__node xy-flow__node selectable"
      [class.react-flow__node-input]="node().type === 'input'"
      [class.react-flow__node-default]="!node().type || node().type === 'default'"
      [class.react-flow__node-output]="node().type === 'output'"
      [class.draggable]="isDraggable()"
      [class.selected]="node().selected"
      [class.dragging]="isDragging()"
      [class.light]="node().className === 'light'"
      [class.dark]="node().className === 'dark'"
      [attr.data-id]="node().id"
      [style.transform]="nodeTransform()"
      style="position: absolute; user-select: none; pointer-events: all; transform-origin: 0 0; box-sizing: border-box; touch-action: none;"
      [style.cursor]="getCursor()"
      (mousedown)="handleMouseDown($event)"
      (click)="handleClick($event)"
      tabindex="0"
    >
      <!-- 目標手柄（頂部） -->
      @if (node().type !== 'input') {
        <xy-handle 
          type="target"
          [position]="Position.Top"
          id="target"
          [isConnectable]="isConnectable()"
          [isConnectableEnd]="true"
          [isConnectableStart]="false"
        ></xy-handle>
      }
      
      <!-- 源手柄（底部） -->
      @if (node().type !== 'output') {
        <xy-handle 
          type="source"
          [position]="Position.Bottom"
          id="source"
          [isConnectable]="isConnectable()"
          [isConnectableStart]="true"
          [isConnectableEnd]="false"
        ></xy-handle>
      }
      
      <!-- 節點內容 -->
      <div class="xy-flow__node-label">
        {{ node().data['label'] }}
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }
    
    .xy-flow__node {
      background: #fff;
      border: 1px solid #1a192b;
      border-radius: 3px;
      padding: 10px;
      font-size: 12px;
      text-align: center;
      width: 150px;
      min-height: 36px;
    }
    
    .xy-flow__node.selected {
      box-shadow: 0 0 0 0.5px #1a192b;
    }
    
    .xy-flow__node.dragging {
      cursor: grabbing;
    }
    
    .xy-flow__node.light {
      background: #fff;
      color: #222;
      border-color: #1a192b;
    }
    
    .xy-flow__node.dark {
      background: #343435;
      color: #fffffb;
      border-color: #888;
    }
    
    .xy-flow__node-label {
      pointer-events: none;
    }
    
    .xy-flow__handle {
      position: absolute;
      width: 10px;
      height: 10px;
      background: #555;
      border: 2px solid #fff;
      border-radius: 50%;
    }
    
    .xy-flow__handle-top {
      top: -5px;
      left: 50%;
      transform: translateX(-50%);
    }
    
    .xy-flow__handle-bottom {
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
    }
  `]
})
export class NodeWrapperComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  /** 節點元素引用 */
  nodeElement = viewChild<ElementRef<HTMLDivElement>>('nodeElement');
  
  /** Position 枚舉供模板使用 */
  public Position = Position;
  
  /** 注入的服務 */
  private nodeIdService = inject(NodeIdService);
  private cdr = inject(ChangeDetectorRef);
  private flowStore = inject(FlowStoreService);
  
  /** XYDrag 實例 */
  private xyDragInstance?: XYDragInstance;
  
  /** 當前拖拽位置（用於即時顯示） */
  private currentDragPosition = signal<{x: number, y: number} | null>(null);
  
  /** 計算節點的 transform 樣式 */
  protected nodeTransform = computed(() => {
    const node = this.node();
    const dragPosition = this.currentDragPosition();
    const isDragging = this.isDragging();
    
    console.log(`🎨 nodeTransform computed for node ${node.id}:`, {
      isDragging,
      dragPosition,
      originalPosition: node.position
    });
    
    // 如果正在拖拽，使用拖拽位置；否則使用原始位置
    if (isDragging && dragPosition) {
      const transform = `translate(${dragPosition.x}px, ${dragPosition.y}px)`;
      console.log(`✅ Using drag position: ${transform}`);
      return transform;
    }
    
    const transform = `translate(${node.position.x}px, ${node.position.y}px)`;
    console.log(`📍 Using original position: ${transform}`);
    return transform;
  });
  
  /** 節點數據 - 必需輸入 */
  node = input.required<Node>();
  
  /** 節點索引 - 必需輸入 */
  index = input.required<number>();
  
  /** 視口參數 - 必需輸入 */
  viewport = input.required<{ x: number; y: number; zoom: number }>();
  
  /** 多選按鍵碼 */
  multiSelectionKeyCode = input<string>('Meta');
  
  /** 是否可拖拽 */
  isDraggable = input<boolean>(true);
  
  /** 是否可選擇 */
  isSelectable = input<boolean>(true);
  
  /** 是否可連接 */
  isConnectable = input<boolean>(true);
  
  /** 節點點擊事件 */
  onNodeClick = output<{ event: MouseEvent; node: Node }>();
  
  /** 節點拖拽開始事件 */
  onNodeDragStart = output<{ event: MouseEvent; node: Node; index: number }>();
  
  /** 節點拖拽進行中事件 */
  onNodeDrag = output<{ event: MouseEvent; node: Node; delta: { x: number; y: number } }>();
  
  /** 節點拖拽結束事件 */
  onNodeDragStop = output<{ event: MouseEvent; node: Node }>();
  
  /** 節點位置變化事件 */
  onNodePositionChange = output<{ node: Node; position: { x: number; y: number } }>();
  
  /** 連接開始事件 */
  onConnectionStart = output<{ nodeId: string; handleType: string; position: { x: number; y: number } }>();
  
  /** 連接結束事件 */
  onConnectionEnd = output<{ nodeId: string | null; handleType: string | null }>();
  
  /** 是否正在拖拽的狀態信號 */
  public isDragging = signal(false);
  
  constructor() {
    // 監聽節點變化並更新 nodeId 服務
    effect(() => {
      const node = this.node();
      if (node) {
        this.nodeIdService.setNodeId(node.id);
      }
    });
  }
  
  ngOnInit() {
    // Set the node ID in the NodeIdService as early as possible
    const node = this.node();
    const isDraggable = this.isDraggable();
    console.log('NodeWrapper ngOnInit - setting nodeId:', node.id, 'isDraggable:', isDraggable);
    this.nodeIdService.setNodeId(node.id);
  }
  
  ngAfterViewInit() {
    // 節點可能需要調整大小
    this.updateNodeDimensions();
    
    // 初始化 XYDrag
    this.initializeDrag();
    
    console.log('🔧 NodeWrapper AfterViewInit completed for node:', this.node().id);
  }
  
  ngOnDestroy() {
    // 清理 XYDrag
    this.xyDragInstance?.destroy();
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['node'] && !changes['node'].firstChange) {
      const oldNode = changes['node'].previousValue;
      const newNode = changes['node'].currentValue;
      
      if (oldNode.position.x !== newNode.position.x || oldNode.position.y !== newNode.position.y) {
        console.log(`🔄 NodeWrapper ${this.node().id} - Position updated from (${oldNode.position.x}, ${oldNode.position.y}) to (${newNode.position.x}, ${newNode.position.y})`);
        // 手動觸發變更檢測
        this.cdr.markForCheck();
      }
    }
    
    // 更新 XYDrag 配置 - 只有在 XYDrag 實例存在時才更新
    if (changes['isDraggable'] || changes['isSelectable'] || changes['node']) {
      // 只有在 ngAfterViewInit 之後才嘗試更新拖拽配置
      if (this.xyDragInstance) {
        this.updateDragConfig();
      }
    }
  }
  
  private updateNodeDimensions() {
    const nodeElementRef = this.nodeElement();
    if (!nodeElementRef) return;
    
    const rect = nodeElementRef.nativeElement.getBoundingClientRect();
    const node = this.node();
    
    if (!node.width || !node.height) {
      // 更新節點尺寸（如果需要）
      const viewport = this.viewport();
      const width = rect.width / viewport.zoom;
      const height = rect.height / viewport.zoom;
      
      // 這裡可以觸發節點尺寸更新事件
    }
  }
  
  getCursor(): string {
    if (this.isDragging()) {
      return 'grabbing';
    }
    if (this.isDraggable()) {
      return 'grab';
    }
    if (this.isSelectable()) {
      return 'pointer';
    }
    return 'default';
  }
  
  
  private initializeDrag() {
    const nodeElementRef = this.nodeElement();
    const isDraggable = this.isDraggable();
    const node = this.node();
    
    console.log('🔧 initializeDrag called', {
      hasNodeElement: !!nodeElementRef,
      isDraggable: isDraggable,
      nodeId: node.id
    });
    
    if (!nodeElementRef || !isDraggable) {
      console.log('❌ initializeDrag aborted - missing element or not draggable');
      return;
    }
    
    // 創建 XYDrag 實例
    this.xyDragInstance = XYDrag({
      getStoreItems: () => this.getStoreItems(),
      onNodeMouseDown: (id: string) => {
        console.log('XYDrag onNodeMouseDown:', id);
        // 處理節點選擇
      },
      onDragStart: () => {
        console.log('XYDrag onDragStart');
        this.isDragging.set(true);
        // 清除之前的拖拽位置
        this.currentDragPosition.set(null);
        
        this.onNodeDragStart.emit({
          event: new MouseEvent('dragstart'),
          node: this.node(),
          index: this.index()
        });
      },
      onDrag: (event, dragItems, node, nodes) => {
        console.log('XYDrag onDrag');
        this.onNodeDrag.emit({
          event: event as MouseEvent,
          node: this.node(),
          delta: { x: 0, y: 0 } // XYDrag 會自動處理位置
        });
      },
      onDragStop: () => {
        console.log('XYDrag onDragStop');
        this.isDragging.set(false);
        // 不要立即清除拖拽位置，讓最終位置保持一段時間
        // 這樣可以確保最終位置被正確應用
        setTimeout(() => {
          this.currentDragPosition.set(null);
        }, 100);
        
        this.onNodeDragStop.emit({
          event: new MouseEvent('dragstop'),
          node: this.node()
        });
      }
    });
    
    // 更新 XYDrag 配置
    console.log('🔍 About to call updateDragConfig, xyDragInstance exists:', !!this.xyDragInstance);
    this.updateDragConfig();
  }
  
  private updateDragConfig() {
    const nodeElementRef = this.nodeElement();
    if (!this.xyDragInstance || !nodeElementRef) {
      console.log('❌ updateDragConfig aborted:', {
        hasXYDragInstance: !!this.xyDragInstance,
        hasNodeElement: !!nodeElementRef
      });
      return;
    }
    
    console.log('✅ updateDragConfig executing:', {
      nodeId: this.node().id,
      domNode: nodeElementRef.nativeElement,
      isSelectable: this.isSelectable()
    });
    
    this.xyDragInstance.update({
      domNode: nodeElementRef.nativeElement,
      nodeId: this.node().id,
      isSelectable: this.isSelectable(),
      nodeClickDistance: 0
    });
  }
  
  private getStoreItems() {
    const node = this.node();
    const index = this.index();
    const viewport = this.viewport();
    const isDraggable = this.isDraggable();
    const isSelectable = this.isSelectable();
    const isConnectable = this.isConnectable();
    const nodeElementRef = this.nodeElement();
    
    // 獲取整個 ReactFlow 容器而不是單個節點
    const flowContainer = nodeElementRef?.nativeElement.closest('.react-flow') as HTMLElement;
    
    console.log('🔍 getStoreItems debug:', {
      nodeId: node.id,
      hasNodeElement: !!nodeElementRef,
      hasFlowContainer: !!flowContainer,
      flowContainerClass: flowContainer?.className,
      viewport: viewport
    });
    
    // 創建一個最小的 store items 對象
    return {
      nodes: [node],
      nodeLookup: new Map([[node.id, {
        id: node.id,
        type: node.type,
        data: node.data,
        position: node.position,
        selected: node.selected || false,
        draggable: isDraggable,
        selectable: isSelectable,
        connectable: isConnectable,
        measured: {
          width: node.width || 150,
          height: node.height || 36
        },
        internals: {
          userNode: node,
          positionAbsolute: node.position,
          z: index || 0
        }
      }]]),
      edges: [],
      nodeExtent: [[-Infinity, -Infinity], [Infinity, Infinity]] as [[number, number], [number, number]],
      snapGrid: [15, 15] as [number, number],
      snapToGrid: false,
      nodeOrigin: [0, 0] as [number, number],
      multiSelectionActive: false,
      domNode: flowContainer || nodeElementRef?.nativeElement, // 使用整個容器，如果找不到則回退到節點元素
      transform: [0, 0, viewport?.zoom || 1] as [number, number, number], // 使用 0,0 作為初始平移值
      autoPanOnNodeDrag: false,
      nodesDraggable: isDraggable,
      selectNodesOnDrag: false,
      nodeDragThreshold: 0,
      panBy: async () => false,
      unselectNodesAndEdges: () => {},
      updateNodePositions: (dragItems: any, dragging: boolean = false) => {
        console.log('updateNodePositions called', dragItems, dragging);
        console.log('🔍 dragItems type:', typeof dragItems);
        console.log('🔍 dragItems instanceof Map:', dragItems instanceof Map);
        console.log('🔍 dragItems size:', dragItems?.size);
        
        if (!dragItems || typeof dragItems[Symbol.iterator] !== 'function') {
          console.error('❌ dragItems is not iterable:', dragItems);
          return;
        }
        
        for (const [id, dragItem] of dragItems) {
          if (id === node.id) {
            try {
              console.log('🔍 dragItem for node', id, ':', {
                'position.x': dragItem.position?.x,
                'position.y': dragItem.position?.y,
                'internals.positionAbsolute.x': dragItem.internals?.positionAbsolute?.x,
                'internals.positionAbsolute.y': dragItem.internals?.positionAbsolute?.y
              });
              
              // 使用 internals.positionAbsolute 來獲取正確的拖拽位置
              const newPosition = {
                x: dragItem.internals.positionAbsolute.x,
                y: dragItem.internals.positionAbsolute.y
              };
              
              console.log('🔄 Updating node position:', {
                nodeId: id,
                oldPosition: node.position,
                newPosition: newPosition,
                dragging: dragging
              });
              
              if (dragging) {
                // 拖拽過程中，更新臨時位置用於即時顯示
                console.log('🔥 Setting currentDragPosition:', newPosition);
                this.currentDragPosition.set(newPosition);
                console.log('🔥 currentDragPosition set to:', this.currentDragPosition());
                
                // 🔥 CRITICAL FIX: Emit position changes during drag for real-time edge updates
                const updatedNode = {
                  ...node,
                  position: newPosition
                };
                
                console.log('🚀 Emitting onNodePositionChange during drag:', {
                  nodeId: updatedNode.id,
                  newPosition: newPosition
                });
                this.onNodePositionChange.emit({
                  node: updatedNode,
                  position: newPosition
                });
              } else {
                // 拖拽結束時，保持最終位置而不是清除
                console.log('🎯 Drag ended, keeping final position:', newPosition);
                
                // 創建更新後的節點對象
                const updatedNode = {
                  ...node,
                  position: newPosition
                };
                
                // 發出節點位置變更事件，讓父組件更新節點數據
                console.log('🚀 Emitting onNodePositionChange event:', {
                  nodeId: updatedNode.id,
                  newPosition: newPosition
                });
                this.onNodePositionChange.emit({
                  node: updatedNode,
                  position: newPosition
                });
                
                // 不要立即清除拖拽位置，等待父組件更新節點位置後再清除
                // this.currentDragPosition.set(null);
              }
            } catch (error) {
              console.error('❌ Error in updateNodePositions:', error);
              console.log('dragItem keys:', Object.keys(dragItem || {}));
            }
          }
        }
      }
    };
  }
  
  handleMouseDown(event: MouseEvent) {
    const node = this.node();
    const isDraggable = this.isDraggable();
    const index = this.index();
    
    console.log('🖱️ NodeWrapper mousedown triggered!', {
      nodeId: node.id,
      isDraggable: isDraggable,
      target: event.target,
      currentTarget: event.currentTarget
    });
    
    if (!isDraggable) {
      console.log('❌ Node is not draggable');
      return;
    }
    
    // 簡單測試：檢查事件是否被觸發
    console.log('✅ MouseDown event working on node:', node.id);
    
    // 觸發拖拽開始事件
    this.onNodeDragStart.emit({
      event,
      node: node,
      index: index
    });
  }
  
  handleClick(event: MouseEvent) {
    if (!this.isSelectable()) return;
    
    event.stopPropagation();
    
    this.onNodeClick.emit({
      event,
      node: this.node()
    });
  }
  
  // Handle events are now managed by the Handle component itself
}