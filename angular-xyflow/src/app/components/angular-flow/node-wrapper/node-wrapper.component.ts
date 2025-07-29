// Angular 核心模組
import {
  Component,
  input,
  output,
  viewChild,
  ElementRef,
  computed,
  signal,
  effect,
  afterRenderEffect,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';

// XyFlow 系統模組
import { type Connection, type Position } from '@xyflow/system';

// 專案內部模組
import { AngularNode } from '../types';
import { HandleComponent } from '../handle/handle.component';
import { AngularFlowDragService } from '../drag.service';
import { AngularFlowService } from '../angular-flow.service';

@Component({
  selector: 'angular-flow-node',
  standalone: true,
  imports: [CommonModule, HandleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div
      #nodeElement
      class="xy-flow__node angular-flow__node"
      [class]="nodeClasses()"
      [attr.data-node-id]="node().id"
      [style.position]="'absolute'"
      [style.transform]="nodeTransform()"
      [style.z-index]="node().zIndex || 1"
      [style.width]="node().width ? node().width + 'px' : 'auto'"
      [style.height]="node().height ? node().height + 'px' : 'auto'"
      [style.user-select]="'none'"
      [style.pointer-events]="node().hidden ? 'none' : 'auto'"
      [style.opacity]="node().hidden ? 0 : 1"
      [style.cursor]="getCursor()"
      (click)="onNodeClick($event)"
      (mousedown)="onNodeMouseDown($event)"
    >
      <!-- Source handles -->
      @if (shouldShowHandles()) {
        @if (hasSourceHandle()) {
          <angular-flow-handle
            type="source"
            [position]="getSourcePosition()"
            [nodeId]="node().id"
            [isConnectable]="node().connectable !== false"
            [selected]="isHandleSelected('source')"
            (connectStart)="connectStart.emit($event)"
            (connectEnd)="connectEnd.emit($event)"
            (handleClick)="handleClick.emit($event)"
          />
        }
      }

      <!-- Node content based on type -->
      <div class="angular-flow__node-content">
        @switch (node().type) {
          @case ('input') {
            <div class="angular-flow__node-input">
<div class="angular-flow__node-label">{{ node().data?.['label'] || node().id }}</div>
            </div>
          }
          @case ('output') {
            <div class="angular-flow__node-output">
<div class="angular-flow__node-label">{{ node().data?.['label'] || node().id }}</div>
            </div>
          }
          @default {
            <div class="angular-flow__node-default">
<div class="angular-flow__node-label">{{ node().data?.['label'] || node().id }}</div>
            </div>
          }
        }
      </div>

      <!-- Target handles -->
      @if (shouldShowHandles()) {
        @if (hasTargetHandle()) {
          <angular-flow-handle
            type="target"
            [position]="getTargetPosition()"
            [nodeId]="node().id"
            [isConnectable]="node().connectable !== false"
            [selected]="isHandleSelected('target')"
            (connectStart)="connectStart.emit($event)"
            (connectEnd)="connectEnd.emit($event)"
            (handleClick)="handleClick.emit($event)"
          />
        }
      }
    </div>
  `,
  styles: [`
    .xy-flow__node,
    .angular-flow__node {
      position: absolute;
      cursor: grab;
      border-radius: 3px;
      border: 1px solid #1a192b;
      background: #fff;
      color: inherit;
      min-width: 150px;
      font-size: 12px;
      text-align: center;
      padding: 10px;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }

    .xy-flow__node:hover,
    .angular-flow__node:hover {
      box-shadow: 0 1px 4px 1px rgba(0, 0, 0, 0.08);
    }

    .xy-flow__node.selected,
    .angular-flow__node.selected {
      box-shadow: 0 0 0 0.5px #1a192b;
    }

    .xy-flow__node.dragging,
    .angular-flow__node.dragging {
      cursor: grabbing;
    }

    .angular-flow__node-content {
      width: 100%;
      box-sizing: border-box;
    }

    .angular-flow__node-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .angular-flow__node-input {
      /* Input nodes use the main node background */
    }

    .angular-flow__node-output {
      /* Output nodes use the main node background */
    }

    .angular-flow__node-default {
      /* Default nodes use the main node background */
    }

    /* Node type specific styles - minimal differences */
    .angular-flow__node.type-input,
    .angular-flow__node.type-default,
    .angular-flow__node.type-output {
      /* All node types inherit base styles */
    }

    /* Light/Dark theme classes - override base styles */
    .angular-flow__node.light {
      background: #fff;
      border-color: #1a192b;
      color: #222;
    }

    .angular-flow__node.light.selected {
      box-shadow: 0 0 0 0.5px #1a192b;
    }

    .angular-flow__node.dark {
      background: #1e1e1e;
      border-color: #3c3c3c;
      color: #f8f8f8;
    }

    .angular-flow__node.dark.selected {
      box-shadow: 0 0 0 0.5px #999;
    }
  `]
})
export class NodeWrapperComponent implements OnDestroy {
  // 輸入屬性
  readonly node = input.required<AngularNode>();
  readonly selected = input<boolean>(false);
  readonly dragging = input<boolean>(false);

  // 輸出事件
  readonly nodeClick = output<MouseEvent>();
  readonly nodeDragStart = output<MouseEvent>();
  readonly nodeDrag = output<MouseEvent>();
  readonly nodeDragStop = output<MouseEvent>();
  readonly connectStart = output<{ event: MouseEvent; nodeId: string; handleType: 'source' | 'target' }>();
  readonly connectEnd = output<Connection>();
  readonly handleClick = output<{ event: MouseEvent; nodeId: string; handleId?: string; handleType: 'source' | 'target' }>();

  // 視圖子元素
  readonly nodeElement = viewChild.required<ElementRef<HTMLDivElement>>('nodeElement');

  // 內部狀態
  private readonly isDragging = signal(false);
  private resizeObserver?: ResizeObserver;
  private _dragService = inject(AngularFlowDragService);
  private _flowService = inject(AngularFlowService);

  // 計算屬性
  readonly nodeClasses = computed(() => {
    const classes = ['xy-flow__node', 'angular-flow__node'];
    const nodeData = this.node();

    if (nodeData.type) {
      classes.push(`type-${nodeData.type}`);
    }

    if (nodeData.className) {
      classes.push(nodeData.className);
    }

    if (this.selected()) {
      classes.push('selected');
    }

    if (this.dragging() || this.isDragging()) {
      classes.push('dragging');
    }

    return classes.join(' ');
  });

  readonly nodeTransform = computed(() => {
    const pos = this.node().position;
    return `translate(${pos.x}px, ${pos.y}px)`;
  });

  readonly shouldShowHandles = computed(() => {
    // 顯示連接點的邏輯
    return true;
  });

  readonly hasSourceHandle = computed(() => {
    const nodeType = this.node().type;
    // Input 和 default 節點有 source handle，output 節點沒有
    return !nodeType || nodeType === 'default' || nodeType === 'input';
  });

  readonly hasTargetHandle = computed(() => {
    const nodeType = this.node().type;
    // Default 和 output 節點有 target handle，input 節點沒有
    return !nodeType || nodeType === 'default' || nodeType === 'output';
  });

  constructor() {
    // 監聽拖動狀態變化
    effect(() => {
      const dragging = this.dragging();
      this.isDragging.set(dragging);
    });

    // 監聽節點數據和全局拖動狀態變化，重新設置拖拽
    // 但避免在拖動過程中重新初始化
    effect(() => {
      const nodeData = this.node();
      const globalDraggable = this._flowService.nodesDraggable(); // 監聽全局狀態
      const isDragging = this.isDragging() || this._dragService.dragging(); // 檢查是否正在拖動
      
      if (nodeData && !isDragging) {
        // 只在不拖動時重新設置拖拽，確保 DOM 元素已準備好
        setTimeout(() => this.setupDragForNode(), 0);
      }
    });

    // 渲染後設置觀察器
    afterRenderEffect(() => {
      this.setupResizeObserver();
    });
  }


  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    // 清理此節點的拖拽實例
    const nodeData = this.node();
    if (nodeData) {
      this._dragService.destroyNodeDrag(nodeData.id);
    }
  }

  // 為此節點設置拖拽功能
  private setupDragForNode() {
    const element = this.nodeElement()?.nativeElement;
    const nodeData = this.node();

    if (!element || !nodeData) {
      return;
    }

    // 檢查節點是否可拖拽 - 需要同時滿足全局設置和節點設置
    const globalDraggable = this._flowService.nodesDraggable();
    const nodeDraggable = nodeData.draggable !== false;
    const isDraggable = globalDraggable && nodeDraggable;


    // 總是初始化拖動服務，但根據狀態啟用或禁用
    this._dragService.initializeDrag({
      nodeId: nodeData.id,
      domNode: element,
      isSelectable: true,
      nodeClickDistance: 0
    });

    // 根據狀態啟用或禁用拖動
    this._dragService.setNodeDraggable(nodeData.id, isDraggable);


  }

  // 設置大小調整觀察器
  private setupResizeObserver() {
    const element = this.nodeElement()?.nativeElement;
    if (!element) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // 可以發送大小變化事件給服務
      }
    });

    this.resizeObserver.observe(element);
  }


  onNodeClick(event: MouseEvent) {
    // 避免在拖動後觸發點擊
    if (!this.isDragging()) {
      const isSelectable = this._flowService.elementsSelectable();
      const globalDraggable = this._flowService.nodesDraggable();
      const nodeDraggable = this.node().draggable !== false;
      const isDraggable = globalDraggable && nodeDraggable;
      
      /*
       * 根據 React Flow 邏輯：
       * 當 selectNodesOnDrag=false 或節點不可拖拽或 nodeDragThreshold > 0 時，
       * 在 click 事件中處理節點選中
       * 當 selectNodesOnDrag=true 且節點可拖拽且 nodeDragThreshold=0 時，
       * 節點選中已經在 mousedown 時處理，這裡不需要再次處理
       */
      // 從服務獲取實際的設定值
      const selectNodesOnDrag = this._flowService.selectNodesOnDrag();
      const nodeDragThreshold = 0;    // 目前設為 0
      
      if (isSelectable && (!selectNodesOnDrag || !isDraggable || nodeDragThreshold > 0)) {
        // 這種情況下需要在點擊時選中節點
        this._flowService.selectNode(this.node().id, false);
      }
      
      this.nodeClick.emit(event);
    }
  }

  // 處理 mousedown 事件 - 確保在 selectNodesOnDrag=false 時節點能立即被選中
  onNodeMouseDown(event: MouseEvent) {
    // 檢查是否需要在 mousedown 時選中節點
    const isSelectable = this._flowService.elementsSelectable();
    const globalDraggable = this._flowService.nodesDraggable();
    const nodeDraggable = this.node().draggable !== false;
    const isDraggable = globalDraggable && nodeDraggable;
    const selectNodesOnDrag = this._flowService.selectNodesOnDrag();
    
    /*
     * 在以下情況下在 mousedown 時選中節點：
     * 1. 節點是可選中的
     * 2. selectNodesOnDrag=false (因為 XYDrag 不會在這種情況下調用 onNodeMouseDown)
     * 3. 節點是可拖拽的 (只有拖拽操作才需要這個邏輯)
     */
    if (isSelectable && !selectNodesOnDrag && isDraggable) {
      // 檢查節點是否已經被選中
      const currentNode = this.node();
      if (!currentNode.selected) {
        this._flowService.selectNode(currentNode.id, false);
      }
    }
  }

  // 輔助方法
  getSourcePosition(): Position {
    return (this.node().sourcePosition as Position) || 'bottom';
  }

  getTargetPosition(): Position {
    return (this.node().targetPosition as Position) || 'top';
  }

  getCursor(): string {
    const node = this.node();
    const globalDraggable = this._flowService.nodesDraggable();
    const nodeDraggable = node.draggable !== false;
    
    // 只有在全局和節點都允許拖動時才顯示拖動游標
    if (!globalDraggable || !nodeDraggable) {
      return 'default';
    }
    return this.isDragging() ? 'grabbing' : 'grab';
  }

  // 檢查 Handle 是否被選中
  isHandleSelected(type: 'source' | 'target'): boolean {
    const nodeId = this.node().id;
    return this._flowService.isHandleSelected(nodeId, undefined, type);
  }
}
