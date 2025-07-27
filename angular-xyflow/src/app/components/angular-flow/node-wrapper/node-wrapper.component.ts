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
  OnInit,
  OnDestroy,
  inject,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularNode } from '../types';
import { HandleComponent } from '../handle/handle.component';
import { AngularFlowDragService } from '../drag.service';
import { AngularFlowService } from '../angular-flow.service';
import { type Connection, type Position } from '@xyflow/system';

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
      border-radius: 8px;
      border: 1px solid #b1b1b7;
      background: #fff;
      color: #222;
      min-width: 150px;
      min-height: 40px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }

    .xy-flow__node:hover,
    .angular-flow__node:hover {
      box-shadow: 0 1px 4px 1px rgba(0, 0, 0, 0.08);
    }

    .xy-flow__node.selected,
    .angular-flow__node.selected {
      box-shadow: 0 0 0 2px #ff0072;
    }

    .xy-flow__node.dragging,
    .angular-flow__node.dragging {
      cursor: grabbing;
    }

    .angular-flow__node-content {
      padding: 10px 15px;
      min-height: 20px;
      width: 100%;
      box-sizing: border-box;
    }

    .angular-flow__node-label {
      font-size: 12px;
      font-weight: 500;
      text-align: center;
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

    /* Input node specific styles */
    .angular-flow__node.type-input {
      background: #ffffff;
      border: 1px solid #b1b1b7;
      border-radius: 8px;
    }

    .angular-flow__node.type-input:hover {
      border-color: #999;
    }

    /* Default node specific styles */
    .angular-flow__node.type-default {
      background: #ffffff;
      border: 1px solid #b1b1b7;
      border-radius: 8px;
    }

    .angular-flow__node.type-default:hover {
      border-color: #999;
    }

    /* Output node specific styles */
    .angular-flow__node.type-output {
      background: #ffffff;
      border: 1px solid #b1b1b7;
      border-radius: 8px;
    }

    .angular-flow__node.type-output:hover {
      border-color: #999;
    }

    /* Light/Dark theme classes */
    .angular-flow__node.light {
      background: #fff;
      border-color: #ddd;
      color: #222;
    }

    .angular-flow__node.dark {
      background: #333;
      border-color: #555;
      color: #fff;
    }
  `]
})
export class NodeWrapperComponent implements OnInit, OnDestroy {
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
  private dragService = inject(AngularFlowDragService);
  private flowService = inject(AngularFlowService);
  
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

    // 監聽節點數據變化，重新設置拖拽
    effect(() => {
      const nodeData = this.node();
      if (nodeData) {
        // 延遲設置拖拽，確保 DOM 元素已準備好
        setTimeout(() => this.setupDragForNode(), 0);
      }
    });

    // 渲染後設置觀察器
    afterRenderEffect(() => {
      this.setupResizeObserver();
    });
  }

  ngOnInit() {
    // 初始化邏輯
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    // 清理此節點的拖拽實例
    const nodeData = this.node();
    if (nodeData) {
      this.dragService.destroyNodeDrag(nodeData.id);
    }
  }

  // 為此節點設置拖拽功能
  private setupDragForNode() {
    const element = this.nodeElement()?.nativeElement;
    const nodeData = this.node();
    
    if (!element || !nodeData) {
      console.log('❌ 無法設置拖拽：element 或 nodeData 為空', { element, nodeData });
      return;
    }

    // 檢查節點是否可拖拽
    const isDraggable = nodeData.draggable !== false;
    
    console.log('🔧 設置拖拽功能', {
      nodeId: nodeData.id,
      isDraggable,
      element: element,
      elementClasses: element.className
    });
    
    if (isDraggable) {
      this.dragService.initializeDrag({
        nodeId: nodeData.id,
        domNode: element,
        isSelectable: true,
        nodeClickDistance: 0
      });
      
      console.log('✅ 拖拽功能已設置', { nodeId: nodeData.id });
    } else {
      console.log('⚠️ 節點不可拖拽', { nodeId: nodeData.id });
    }
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
      this.nodeClick.emit(event);
    }
  }

  // 輔助方法
  getSourcePosition(): Position {
    return (this.node().sourcePosition as Position) || 'bottom';
  }

  getTargetPosition(): Position {
    return (this.node().targetPosition as Position) || 'bottom';
  }

  getCursor(): string {
    const node = this.node();
    if (node.draggable === false) {
      return 'default';
    }
    return this.isDragging() ? 'grabbing' : 'grab';
  }

  // 檢查 Handle 是否被選中
  isHandleSelected(type: 'source' | 'target'): boolean {
    const nodeId = this.node().id;
    return this.flowService.isHandleSelected(nodeId, undefined, type);
  }
}