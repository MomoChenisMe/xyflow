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
  CUSTOM_ELEMENTS_SCHEMA,
  TemplateRef
} from '@angular/core';
import { CommonModule } from '@angular/common';

// XyFlow 系統模組
import { type Connection, Position, getNodePositionWithOrigin, elementSelectionKeys } from '@xyflow/system';

// 專案內部模組
import { AngularNode, NodeTemplateContext } from '../types';
import { HandleComponent } from '../handle/handle.component';
import { AngularXYFlowDragService } from '../services/drag.service';
import { AngularXYFlowService } from '../services/angular-xyflow.service';
import { NodeTemplateDirective } from '../node-template.directive';

@Component({
  selector: 'angular-xyflow-node',
  standalone: true,
  imports: [CommonModule, HandleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div
      #nodeElement
      class="xy-flow__node angular-xyflow__node"
      [class]="nodeClasses()"
      [attr.data-node-id]="node().id"
      [attr.tabindex]="getTabIndex()"
      [attr.role]="getNodeRole()"
      [attr.aria-label]="getAriaLabel()"
      [style.position]="'absolute'"
      [style.transform]="nodeTransform()"
      [style.z-index]="node().zIndex || 1"
      [style.width]="getNodeWidth()"
      [style.height]="node().height ? node().height + 'px' : 'auto'"
      [style.user-select]="'none'"
      [style.pointer-events]="'auto'"
      [style.opacity]="node().hidden ? 0 : 1"
      [style.cursor]="getCursor()"
      (click)="onNodeClick($event)"
      (mousedown)="onNodeMouseDown($event)"
      (focus)="onNodeFocus($event)"
      (keydown)="onNodeKeyDown($event)"
    >
      <!-- Target handle (左側) - 只在沒有自定義模板時顯示 -->
      @if (shouldShowHandles() && hasTargetHandle() && !customTemplate()) {
        <angular-xyflow-handle
          type="target"
          [position]="getTargetPosition()"
          [nodeId]="node().id"
          [isConnectable]="node().connectable !== false"
          [selected]="isHandleSelected('target')"
          [style]="{}"
          (connectStart)="connectStart.emit($event)"
          (connectEnd)="connectEnd.emit($event)"
          (handleClick)="handleClick.emit($event)"
        />
      }

      <!-- Node content -->
      <div class="angular-xyflow__node-content">
        @if (customTemplate(); as template) {
          <!-- 使用自定義模板 -->
          <ng-container
            [ngTemplateOutlet]="template.templateRef"
            [ngTemplateOutletContext]="{
              $implicit: {
                node: node(),
                selected: selected(),
                dragging: dragging(),
                onNodeClick: onNodeClick.bind(this),
                onColorChange: onColorChange.bind(this),
                onConnectStart: onConnectStart.bind(this),
                onConnectEnd: onConnectEnd.bind(this),
                onHandleClick: onHandleClick.bind(this)
              },
              node: node(),
              selected: selected(),
              dragging: dragging(),
              onNodeClick: onNodeClick.bind(this),
              onColorChange: onColorChange.bind(this),
              onConnectStart: onConnectStart.bind(this),
              onConnectEnd: onConnectEnd.bind(this),
              onHandleClick: onHandleClick.bind(this)
            }"
          />
        } @else {
          <!-- 默認節點內容 -->
          <div class="angular-xyflow__node-label">{{ node().data['label'] || node().id }}</div>
        }
      </div>

      <!-- Source handles (右側) - 只在沒有自定義模板時顯示 -->
      @if (shouldShowHandles() && hasSourceHandle() && !customTemplate()) {
        <!-- 默認單個 source handle -->
        <angular-xyflow-handle
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
    </div>
  `,
  styles: [`
    /* 基本定位和行為樣式 - 不包含顏色主題 */
    .xy-flow__node,
    .angular-xyflow__node {
      position: absolute;
      cursor: grab;
    }

    .xy-flow__node.dragging,
    .angular-xyflow__node.dragging {
      cursor: grabbing;
    }

    .angular-xyflow__node-content {
      /* 繼承父容器的 padding，與系統樣式保持一致 */
      height: 100%;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .angular-xyflow__node-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* 讓系統 CSS 處理所有顏色和主題相關的樣式 */
    /* 移除所有硬編碼的顏色、背景、邊框樣式 */
    /* 這些現在由 packages/system/src/styles/style.css 中的 .xy-flow 和 .xy-flow.dark 處理 */

    /* 自定義顏色選擇器節點樣式 - 與React版本保持一致的垂直布局 */
    .color-selector-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 10px;
      width: auto;
    }

    .color-picker {
      width: 50px;
      height: 25px;
      border: 1px solid #ccc;
      border-radius: 3px;
      cursor: pointer;
      /* 確保顏色選擇器不會影響文字排列 */
      flex-shrink: 0;
    }

    /* nodrag 類防止拖拽時移動節點 */
    .nodrag {
      pointer-events: auto;
    }

    /* 為 selectorNode 添加特殊樣式 - 與React版本保持一致 */
    .xy-flow__node-selectorNode {
      font-size: 12px;
      background: #f0f2f3;
      border: 1px solid #555;
      border-radius: 5px;
      text-align: center;
      padding: 10px;
      /* 移除width設定，讓內容自然撐開 */
    }
  `]
})
export class NodeWrapperComponent implements OnDestroy {
  // 輸入屬性
  readonly node = input.required<AngularNode>();
  readonly selected = input<boolean>(false);
  readonly dragging = input<boolean>(false);
  readonly customNodeTemplates = input<readonly any[]>([]);

  // 輸出事件
  readonly nodeClick = output<MouseEvent>();
  readonly nodeFocus = output<FocusEvent>();
  readonly nodeDragStart = output<MouseEvent>();
  readonly nodeDrag = output<{ event: MouseEvent; position: { x: number; y: number } }>();
  readonly nodeDragStop = output<MouseEvent>();
  readonly connectStart = output<{ event: MouseEvent; nodeId: string; handleType: 'source' | 'target' }>();
  readonly connectEnd = output<{ connection?: Connection; event: MouseEvent }>();
  readonly handleClick = output<{ event: MouseEvent; nodeId: string; handleId?: string; handleType: 'source' | 'target' }>();

  // 視圖子元素
  readonly nodeElement = viewChild.required<ElementRef<HTMLDivElement>>('nodeElement');

  // 內部狀態
  private readonly isDragging = signal(false);
  private resizeObserver?: ResizeObserver;
  private _dragService = inject(AngularXYFlowDragService);
  private _flowService = inject(AngularXYFlowService);

  // 計算屬性
  readonly nodeClasses = computed(() => {
    const classes = ['xy-flow__node', 'angular-xyflow__node'];
    const nodeData = this.node();
    const nodeType = nodeData.type || 'default';

    // 添加正確的節點類型類，匹配系統樣式
    classes.push(`xy-flow__node-${nodeType}`);

    // 添加 selectable 類以啟用 hover 和 focus 樣式
    if (this._flowService.elementsSelectable()) {
      classes.push('selectable');
    }

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
    const node = this.node();
    // 使用與 Angular Flow 服務一致的位置計算
    // 這確保與內部位置狀態保持同步，包括 NaN 值的處理
    const pos = this._flowService.getNodeVisualPosition(node);
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

  // 查找當前節點類型的自定義模板
  readonly customTemplate = computed(() => {
    const nodeType = this.node().type;
    const templates = this.customNodeTemplates();
    
    // 只有 selectorNode 類型才使用自定義模板，其他類型使用默認模板
    if (nodeType === 'selectorNode' && templates.length > 0) {
      return templates[0] || null;
    }
    
    return null;
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
      nodeClickDistance: 0,
      onDragStart: (event: MouseEvent, nodeId: string) => {
        this.nodeDragStart.emit(event);
      },
      onDrag: (event: MouseEvent, nodeId: string, position: { x: number; y: number }) => {
        // 傳遞拖曳事件和最新位置
        this.nodeDrag.emit({ event, position });
      },
      onDragStop: (event: MouseEvent, nodeId: string) => {
        this.nodeDragStop.emit(event);
      }
    });
  }

  // 設置大小調整觀察器
  private setupResizeObserver() {
    const element = this.nodeElement()?.nativeElement;
    if (!element) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // 更新統一位置計算系統中的測量尺寸
        this._flowService.updateNodeMeasuredDimensions(this.node().id, { width, height });
      }
    });

    this.resizeObserver.observe(element);
  }


  onNodeClick(event: MouseEvent) {
    // 避免在拖動後觸發點擊
    if (!this.isDragging()) {
      const isSelectable = this._flowService.elementsSelectable();
      
      // 根據 React Flow 邏輯：當交互被禁用時，完全阻止點擊事件
      if (!isSelectable) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      
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
  getNodeWidth(): string {
    const nodeData = this.node();
    if (nodeData.width) {
      return nodeData.width + 'px';
    }
    
    // 使用自定義模板的節點使用 auto 寬度，讓內容自然撐開
    if (this.customTemplate()) {
      return 'auto';
    }
    
    // 默認寬度
    return '150px';
  }

  getSourcePosition(): Position {
    const node = this.node();
    return (node.sourcePosition as Position) || Position.Bottom;
  }

  getTargetPosition(): Position {
    const node = this.node();
    return (node.targetPosition as Position) || Position.Top;
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

  // 顏色改變處理（用於 selectorNode）
  onColorChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const nodeData = this.node().data;
    
    // 調用節點數據中的 onChange 函數（如果存在）
    if (nodeData && typeof nodeData['onChange'] === 'function') {
      nodeData['onChange'](event);
    }
  }

  // Handle 事件處理方法 - 轉發到父組件
  onConnectStart(event: { event: MouseEvent; nodeId: string; handleType: 'source' | 'target'; handleId?: string }): void {
    this.connectStart.emit(event);
  }

  onConnectEnd(event: { connection?: Connection; event: MouseEvent }): void {
    this.connectEnd.emit(event);
  }

  onHandleClick(event: { event: MouseEvent; nodeId: string; handleType: 'source' | 'target'; handleId?: string }): void {
    this.handleClick.emit(event);
  }

  // 檢查 Handle 是否被選中
  isHandleSelected(type: 'source' | 'target', handleId?: string): boolean {
    const nodeId = this.node().id;
    return this._flowService.isHandleSelected(nodeId, handleId, type);
  }

  // A11y 相關方法
  getTabIndex(): number {
    const nodeData = this.node();
    const globalSelectable = this._flowService.elementsSelectable();

    // 檢查是否有自定義的 tabIndex
    if (nodeData.domAttributes && typeof nodeData.domAttributes['tabIndex'] === 'number') {
      return nodeData.domAttributes['tabIndex'];
    }

    // 如果節點可選擇，設為 0 讓它可以被鍵盤聚焦
    return globalSelectable ? 0 : -1;
  }

  getNodeRole(): string {
    const nodeData = this.node();

    // 檢查是否有自定義的 aria role
    if (nodeData.ariaRole) {
      return nodeData.ariaRole;
    }

    // 預設使用 'button' role，因為節點是可交互的
    return 'button';
  }

  getAriaLabel(): string {
    const nodeData = this.node();

    // 檢查是否有自定義的 aria-label
    if (nodeData.domAttributes?.['aria-label']) {
      return nodeData.domAttributes['aria-label'] as string;
    }

    // 檢查是否有自定義的 aria-roledescription
    if (nodeData.domAttributes?.['aria-roledescription']) {
      return nodeData.domAttributes['aria-roledescription'] as string;
    }

    // 預設使用節點的 label 或 id
    const label = nodeData.data?.['label'] || nodeData.id;
    return `Node ${label}`;
  }

  onNodeFocus(event: FocusEvent): void {
    const nodeId = this.node().id;
    const isSelectable = this._flowService.elementsSelectable();
    
    // 根據 React Flow 邏輯：當交互被禁用時，阻止焦點相關操作
    if (!isSelectable) {
      event.preventDefault();
      return;
    }

    // 檢查是否是鍵盤焦點 (類似 React 版本的 :focus-visible 檢查)
    const isKeyboardFocus = this.isKeyboardFocused(event);

    // 只在鍵盤焦點時執行自動平移（與 React 版本一致）
    if (isKeyboardFocus) {
      this._flowService.panToNodeOnFocus(nodeId);
    }

    // 發出focus事件，讓父組件處理狀態同步（controlled模式需要）
    this.nodeFocus.emit(event);
  }

  onNodeKeyDown(event: KeyboardEvent): void {
    const nodeId = this.node().id;
    const isSelectable = this._flowService.elementsSelectable();

    // 處理選擇相關的按鍵（Enter, Space, Escape）- 與 React 版本保持一致
    if (elementSelectionKeys.includes(event.key) && isSelectable) {
      const unselect = event.key === 'Escape';
      
      if (unselect) {
        event.preventDefault();
        // 清除選擇
        this._flowService.clearSelection();
        // 移除焦點 - 與 React 版本保持一致
        const element = this.nodeElement()?.nativeElement;
        if (element) {
          requestAnimationFrame(() => element.blur());
        }
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        // 觸發節點點擊事件
        const mouseEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        });
        this.onNodeClick(mouseEvent);
      }
    }

    // 處理方向鍵移動（可選功能）
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      this.handleKeyboardMove(event.key);
    }
  }

  private handleKeyboardMove(key: string): void {
    // 這個功能可以讓用戶使用鍵盤移動節點
    // 目前先留空，可以根據需要實現
  }

  // 檢查焦點是否來自鍵盤（類似 React 版本的 :focus-visible 檢查）
  private isKeyboardFocused(event: FocusEvent): boolean {
    const target = event.target as HTMLElement;

    // 使用現代瀏覽器的 :focus-visible 偽類檢查
    if (target && target.matches && typeof target.matches === 'function') {
      try {
        return target.matches(':focus-visible');
      } catch (e) {
        // 某些較舊的瀏覽器可能不支持 :focus-visible
      }
    }

    // 備用檢查：如果沒有 :focus-visible 支持，使用簡單的啟發式判斷
    // 這個方法不完美，但通常有效
    return this.wasRecentKeyboardInteraction();
  }

  private wasRecentKeyboardInteraction(): boolean {
    // 簡單的啟發式判斷：檢查最近是否有鍵盤事件
    // 這是一個簡化的實現，在生產環境中可能需要更複雜的邏輯
    return document.activeElement?.tagName !== 'BODY';
  }
}
