// Angular 核心模組
import {
  Component,
  input,
  output,
  ElementRef,
  computed,
  signal,
  effect,
  afterNextRender,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
  Injector
} from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';

// XyFlow 系統模組
import { type Connection, Position, elementSelectionKeys } from '@xyflow/system';

// 專案內部模組
import { AngularNode, NodeTypes } from '../../types';
import { errorMessages, defaultErrorHandler, ErrorCode } from '../../constants';
import { AngularXYFlowDragService } from '../../services/drag.service';
import { AngularXYFlowService } from '../../services/angular-xyflow.service';
import { NodeTemplateDirective } from '../../directives/node-template.directive';
import { builtinNodeTypes } from '../nodes';

@Component({
  selector: 'angular-xyflow-node',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: {
    'class': 'xy-flow__node angular-xyflow__node',
    '[class]': 'nodeClasses()',
    '[attr.data-node-id]': 'node().id',
    '[attr.tabindex]': 'getTabIndex()',
    '[attr.role]': 'getNodeRole()',
    '[attr.aria-label]': 'getAriaLabel()',
    '[style.position]': '"absolute"',
    '[style.transform]': 'nodeTransform()',
    '[style.z-index]': 'node().zIndex || 1',
    '[style.width]': 'getNodeWidth()',
    '[style.height]': 'getNodeHeight()',
    '[style.user-select]': '"none"',
    '[style.pointer-events]': '"auto"',
    '[style.visibility]': 'nodeHasDimensions() ? "visible" : "hidden"',
    '[style.opacity]': 'node().hidden ? 0 : 1',
    '[style.cursor]': 'getCursor()',
    '[style]': 'getNodeStyles()',
    '(click)': 'onNodeClick($event)',
    '(dblclick)': 'onNodeDoubleClick($event)',
    '(contextmenu)': 'onNodeContextMenu($event)',
    '(mousedown)': 'onNodeMouseDown($event)',
    '(focus)': 'onNodeFocus($event)',
    '(keydown)': 'onNodeKeyDown($event)'
  },
  template: `
    <!-- Node content -->
    @if (nodeComponent()) {
      <!-- 使用動態元件載入 - 直接渲染，不包裹 -->
      <ng-container
        [ngComponentOutlet]="nodeComponent()"
        [ngComponentOutletInputs]="nodeInputs()"
        [ngComponentOutletInjector]="nodeInjector"
      />
    } @else {
      @if (customTemplate()) {
      <!-- 使用自定義模板（向後兼容） -->
      <ng-container
        [ngTemplateOutlet]="customTemplate().templateRef"
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
        <!-- 後備：簡單的標籤顯示 - 直接輸出文字，與 React 保持一致 -->
        {{ node().data['label'] || node().id }}
      }
    }
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
      /* 僅用於後備內容的包裹，保持與系統樣式一致 */
      height: 100%;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* 讓系統 CSS 處理所有顏色和主題相關的樣式 */
    /* 移除所有硬編碼的顏色、背景、邊框樣式 */
    /* 這些現在由 packages/system/src/styles/style.css 中的 .xy-flow 和 .xy-flow.dark 處理 */

    /* nodrag 類防止拖拽時移動節點 */
    .nodrag {
      pointer-events: auto;
    }
  `]
})
export class NodeWrapperComponent implements OnDestroy {
  // 輸入屬性
  node = input.required<AngularNode>();
  selected = input<boolean>(false);
  dragging = input<boolean>(false);
  customNodeTemplates = input<readonly any[]>([]);
  nodeTypes = input<NodeTypes>();

  // 輸出事件
  nodeClick = output<MouseEvent>();
  nodeDoubleClick = output<MouseEvent>();
  nodeContextMenu = output<MouseEvent>();
  nodeFocus = output<FocusEvent>();
  nodeDragStart = output<MouseEvent>();
  nodeDrag = output<{ event: MouseEvent; position: { x: number; y: number } }>();
  nodeDragStop = output<MouseEvent>();
  connectStart = output<{ event: MouseEvent; nodeId: string; handleType: 'source' | 'target' }>();
  connectEnd = output<{ connection?: Connection; event: MouseEvent }>();
  handleClick = output<{ event: MouseEvent; nodeId: string; handleId?: string; handleType: 'source' | 'target' }>();

  // 錯誤處理事件（與 React Flow 保持一致）
  onError = output<{ code: string; message: string }>();

  // Host 元素引用
  private readonly elementRef = inject(ElementRef<HTMLDivElement>);
  // 為了相容性，保留 nodeElement 作為 host 元素的引用
  get nodeElement() {
    return { nativeElement: this.elementRef.nativeElement };
  }

  // 內部狀態
  private isDragging = signal(false);
  private resizeObserver?: ResizeObserver;
  private _dragService = inject(AngularXYFlowDragService);
  private _flowService = inject(AngularXYFlowService);

  // 動態元件載入所需的 Injector
  protected readonly nodeInjector = inject(Injector);

  // 錯誤處理器
  private readonly errorHandler = (code: ErrorCode, message: string) => {
    // 發出錯誤事件
    this.onError.emit({ code, message });
    // 同時使用預設處理器輸出到 console
    defaultErrorHandler(code, message);
  };

  // 存儲當前節點 ID 用於清理 - 避免在 ngOnDestroy 時訪問 signal
  private currentNodeId?: string;

  // 追踪拖曳是否已初始化
  private dragInitialized = false;

  // 追踪最後的 dragHandle 值，用於檢測變化
  private lastDragHandle?: string;

  // 獲取解析後的節點類型（與 React Flow 邏輯一致）
  private getResolvedNodeType(): string {
    const node = this.node();
    let nodeType = node.type || 'default';
    const userNodeTypes = this.nodeTypes();

    // React Flow 邏輯：
    // 1. 首先查找用戶定義的 nodeTypes
    // 2. 如果沒有找到，查找內建類型
    // 3. 如果類型不存在，回退到 default
    let NodeComponent = userNodeTypes?.[nodeType] || builtinNodeTypes[nodeType];

    if (NodeComponent === undefined) {
      // 錯誤處理：類型未找到，回退到 default
      nodeType = 'default';
    }

    return nodeType;
  }

  // 計算屬性
  nodeClasses = computed(() => {
    const classes = ['xy-flow__node', 'angular-xyflow__node'];
    const nodeData = this.node();

    // 獲取解析後的節點類型（與 nodeComponent 計算邏輯保持一致）
    const resolvedNodeType = this.getResolvedNodeType();

    // React Flow 行為：使用解析後的節點類型（如果未註冊則回退到 default）
    classes.push(`xy-flow__node-${resolvedNodeType}`);

    // 添加 selectable 類以啟用 hover 和 focus 樣式
    if (this._flowService.elementsSelectable()) {
      classes.push('selectable');
    }

    // 關鍵修復：為可拖曳節點添加 nopan 類別（與 React Flow 一致）
    // 這防止了在節點上（特別是有 dragHandle 但不在 handle 上）拖曳時觸發 viewport panning
    const globalDraggable = this._flowService.nodesDraggable();
    const nodeDraggable = nodeData.draggable !== false;
    const isDraggable = globalDraggable && nodeDraggable && !nodeData.hidden;

    if (isDraggable) {
      classes.push('nopan');
    }

    // 注意：React Flow 不會為回退到 default 的節點添加 type- 類
    // 只有當原始類型存在且未回退時才添加 type- 類
    if (nodeData.type && resolvedNodeType === nodeData.type) {
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

  nodeTransform = computed(() => {
    const node = this.node();
    // 使用與 Angular Flow 服務一致的位置計算
    // 這確保與內部位置狀態保持同步，包括 NaN 值的處理
    const pos = this._flowService.getNodeVisualPosition(node);
    return `translate(${pos.x}px, ${pos.y}px)`;
  });

  // 檢查節點是否已有尺寸（與 React Flow 的 nodeHasDimensions 一致）
  nodeHasDimensions = computed(() => {
    const node = this.node();
    const internals = this._flowService.getNodeInternals(node.id);

    // React Flow 的邏輯：
    // visibility 控制使用的是實際測量或明確設置的尺寸
    // initialWidth/Height 只用於 fitView 計算，不影響節點可見性

    // 如果有測量尺寸，使用測量尺寸
    if (internals?.measured?.width !== undefined && internals?.measured?.height !== undefined) {
      return internals.measured.width > 0 && internals.measured.height > 0;
    }

    // 如果有明確設置的 width/height，則節點可見
    if (node.width !== undefined && node.height !== undefined) {
      return node.width > 0 && node.height > 0;
    }

    // 只有 initialWidth/Height 的節點應該被隱藏，等待測量
    return false;
  });

  // 動態元件載入 - 根據節點類型解析對應的元件（模擬 React Flow 的 nodeTypes 邏輯）
  nodeComponent = computed(() => {
    const node = this.node();
    let nodeType = node.type || 'default';
    const userNodeTypes = this.nodeTypes();

    // React Flow 邏輯：
    // 1. 首先查找用戶定義的 nodeTypes
    // 2. 如果沒有找到，查找內建類型
    // 3. 如果類型不存在，回退到 default
    let NodeComponent = userNodeTypes?.[nodeType] || builtinNodeTypes[nodeType];

    if (NodeComponent === undefined) {
      // 錯誤處理：類型未找到，回退到 default（使用統一錯誤處理機制）
      this.errorHandler('error003', errorMessages.error003(nodeType));
      nodeType = 'default';
      NodeComponent = userNodeTypes?.['default'] || builtinNodeTypes['default'];
    }

    return NodeComponent;
  });

  // 準備傳遞給動態元件的輸入屬性
  nodeInputs = computed(() => {
    const node = this.node();
    const resolvedNodeType = this.getResolvedNodeType();

    // 獲取節點的絕對位置
    const internals = this._flowService.getNodeInternals(node.id);
    const positionAbsolute = internals?.positionAbsolute || { x: node.position.x, y: node.position.y };

    const inputs: Record<string, unknown> = {
      id: node.id,
      data: node.data,
      type: resolvedNodeType,  // 傳遞解析後的節點類型（與 React Flow 一致）
      selected: this.selected(),
      dragging: this.dragging(),
      isConnectable: node.connectable !== false,
      sourcePosition: node.sourcePosition || Position.Bottom,
      targetPosition: node.targetPosition || Position.Top,
      width: node.width,
      height: node.height,
      parentId: node.parentId,
      zIndex: node.zIndex || 0,
      draggable: node.draggable !== false,
      selectable: node.selectable !== false,
      deletable: node.deletable !== false,
      positionAbsoluteX: positionAbsolute.x,
      positionAbsoluteY: positionAbsolute.y,
      dragHandle: node.dragHandle
    };
    return inputs;
  });

  // 查找自定義模板（舊版向後兼容）
  // 只在沒有使用 nodeTypes 時才使用模板方式
  customTemplate = computed(() => {
    // 如果已經使用 nodeTypes，則不使用模板方式
    if (this.nodeComponent()) {
      return null;
    }

    const templates = this.customNodeTemplates();
    if (templates.length > 0) {
      // 使用第一個模板（舊版行為）
      return templates[0];
    }

    return null;
  });

  constructor() {
    // 監聽拖動狀態變化 - 對應 React 的 dragging state
    effect(() => {
      const dragging = this.dragging();
      this.isDragging.set(dragging);
    });

    // 初始化階段 - 對應 React 的第一個 useEffect（創建 XYDrag 實例）
    effect(() => {
      const nodeData = this.node();
      if (nodeData) {
        // 存儲節點 ID 用於清理
        this.currentNodeId = nodeData.id;
      }
    });

    // 關鍵：使用 afterNextRender 確保 DOM 渲染後再設置拖曳
    // 對應 React 的第二個 useEffect（更新拖曳配置）
    // 雖然混合讀寫不是最佳實踐，但由於 TypeScript 類型推斷限制，暫時使用簡化版本
    afterNextRender(() => {
      const nodeData = this.node();
      const element = this.nodeElement?.nativeElement;

      if (!element || !nodeData) {
        return;
      }

      // 階段1：報告組件創建完成
      this._flowService.reportNodeComponentCreated(nodeData.id);

      // 對應 React 的 disabled 邏輯
      const globalDraggable = this._flowService.nodesDraggable();
      const nodeDraggable = nodeData.draggable !== false;
      const isDraggable = globalDraggable && nodeDraggable;
      const disabled = nodeData.hidden || !isDraggable;

      // 檢查是否需要重新初始化（配置變化）
      const configChanged = !this.dragInitialized ||
                          this.lastDragHandle !== nodeData.dragHandle;

      if (disabled) {
        // 如果禁用，銷毀拖曳實例
        if (this.dragInitialized) {
          this._dragService.destroyNodeDrag(nodeData.id);
          this.dragInitialized = false;
        }
      } else if (configChanged) {
        // 配置變化，重新初始化
        // 如果有 dragHandle，需要確保 handle 元素已渲染
        if (nodeData.dragHandle) {
          // 使用 requestAnimationFrame 確保動態組件完成渲染
          requestAnimationFrame(() => {
            this.initializeDragWithHandle(nodeData, element);
          });
        } else {
          // 沒有 dragHandle，直接初始化
          this.initializeDragWithHandle(nodeData, element);
        }
      }

      // 設置觀察器（只在首次）
      if (!this.resizeObserver) {
        this.setupResizeObserver();
      }

      // 階段2：報告 DOM 渲染完成（在所有初始化工作完成後）
      this._flowService.reportNodeDOMRendered(nodeData.id);
    });
  }

  // 新增輔助方法，對應 React 的 xyDrag.current?.update
  private initializeDragWithHandle(nodeData: AngularNode, element: HTMLElement): void {
    // 總是先銷毀舊的實例，確保乾淨的狀態
    if (this.dragInitialized) {
      this._dragService.destroyNodeDrag(nodeData.id);
      // 給一點時間讓清理完成
      setTimeout(() => {
        this.setupNewDragInstance(nodeData, element);
      }, 0);
    } else {
      this.setupNewDragInstance(nodeData, element);
    }
  }

  private setupNewDragInstance(nodeData: AngularNode, element: HTMLElement): void {
    // 初始化拖曳
    this._dragService.initializeDrag({
      nodeId: nodeData.id,
      domNode: element,
      handleSelector: nodeData.dragHandle,
      isSelectable: true,
      nodeClickDistance: 1,
      onDragStart: (event: MouseEvent) => {
        this.nodeDragStart.emit(event);
      },
      onDrag: (event: MouseEvent, nodeId: string, position: { x: number; y: number }) => {
        this.nodeDrag.emit({ event, position });
      },
      onDragStop: (event: MouseEvent) => {
        this.nodeDragStop.emit(event);
      }
    });

    this.dragInitialized = true;
    this.lastDragHandle = nodeData.dragHandle;
  }


  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    // 清理此節點的拖拽實例 - 使用存儲的 nodeId 避免在銷毀階段訪問 signal
    const currentNodeId = this.currentNodeId;
    if (currentNodeId) {
      this._dragService.destroyNodeDrag(currentNodeId);
      // 清理此節點的渲染階段追蹤
      this._flowService.cleanupNodeStages(currentNodeId);
    }
  }


  // 設置大小調整觀察器
  private setupResizeObserver() {
    const element = this.nodeElement?.nativeElement;
    if (!element) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // 與 React Flow 保持一致：使用 offsetWidth/offsetHeight 而非 contentRect
        // offsetWidth/offsetHeight 包含 content + padding + border
        const target = entry.target as HTMLElement;
        const width = target.offsetWidth;
        const height = target.offsetHeight;

        // 測量尺寸完成

        // 階段3：報告尺寸測量完成（同時更新測量尺寸）
        this._flowService.reportNodeDimensionsMeasured(this.node().id, { width, height }, target);
      }
    });

    this.resizeObserver.observe(element);
  }


  onNodeClick(event: MouseEvent) {
    // 檢查點擊是否來自 Handle - 如果是，不處理節點點擊
    if (this.isClickFromHandle(event)) {
      return;
    }

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

      // 注意：節點選擇邏輯已移至 angular-xyflow.component.ts 的 handleNodeClick
      // 這裡不再處理選擇邏輯，避免重複處理
      
      this.nodeClick.emit(event);
    }
  }

  onNodeDoubleClick(event: MouseEvent) {
    // 檢查點擊是否來自 Handle - 如果是，不處理節點雙擊
    if (this.isClickFromHandle(event)) {
      return;
    }

    // 避免在拖動後觸發雙擊
    if (!this.isDragging()) {
      const isSelectable = this._flowService.elementsSelectable();

      // 根據 React Flow 邏輯：當交互被禁用時，完全阻止雙擊事件
      if (!isSelectable) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      this.nodeDoubleClick.emit(event);
    }
  }

  onNodeContextMenu(event: MouseEvent) {
    // 檢查點擊是否來自 Handle - 如果是，不處理節點右鍵菜單
    if (this.isClickFromHandle(event)) {
      return;
    }

    const isSelectable = this._flowService.elementsSelectable();

    // 根據 React Flow 邏輯：當交互被禁用時，完全阻止右鍵菜單事件
    if (!isSelectable) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // React Flow 邏輯：不阻止瀏覽器預設的右鍵菜單，讓開發者自行決定
    this.nodeContextMenu.emit(event);
  }

  // 檢查點擊是否來自 Handle
  private isClickFromHandle(event: MouseEvent): boolean {
    const target = event.target as HTMLElement;
    if (!target) return false;

    // 檢查點擊的元素或其父元素是否是 Handle
    return target.closest('.xy-flow__handle') !== null ||
           target.classList.contains('xy-flow__handle');
  }

  // 處理 mousedown 事件 - 確保在 selectNodesOnDrag=false 時節點能立即被選中
  onNodeMouseDown(event: MouseEvent) {
    // 檢查點擊是否來自 Handle - 如果是，不處理節點 mousedown
    if (this.isClickFromHandle(event)) {
      return;
    }
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
    // 注意：節點選擇邏輯已移至 angular-xyflow.component.ts 的 handleNodeClick
    // 這裡不再處理選擇邏輯，避免重複處理
  }

  // 輔助方法
  getNodeWidth(): string | undefined {
    const nodeData = this.node();

    // 優先使用明確設定的 width
    if (nodeData.width) {
      return typeof nodeData.width === 'number' ? nodeData.width + 'px' : nodeData.width;
    }

    // 如果沒有明確的 width，檢查 style 中的 width（與 React Flow 一致）
    if (nodeData.style?.['width']) {
      const styleWidth = nodeData.style['width'];
      return typeof styleWidth === 'number' ? styleWidth + 'px' : styleWidth;
    }

    // 讓 CSS 後備樣式處理預設寬度
    // 當節點沒有明確指定寬度時，不設置內聯樣式
    // 這樣 CSS 中的 150px 預設寬度會生效
    return undefined;
  }

  getNodeHeight(): string | undefined {
    const nodeData = this.node();

    // 優先使用明確設定的 height
    if (nodeData.height) {
      return typeof nodeData.height === 'number' ? nodeData.height + 'px' : nodeData.height;
    }

    // 如果沒有明確的 height，檢查 style 中的 height（與 React Flow 一致）
    if (nodeData.style?.['height']) {
      const styleHeight = nodeData.style['height'];
      return typeof styleHeight === 'number' ? styleHeight + 'px' : styleHeight;
    }

    // 讓 CSS 後備樣式處理預設高度
    return undefined;
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

  getNodeStyles(): any {
    const node = this.node();
    // 返回節點的自定義樣式（如果有的話）
    // 注意：這裡返回的樣式會被應用到節點元素上
    // 包含 fontSize, color, background 等樣式屬性
    if (node.style) {
      // 建立新的樣式物件，確保 fontSize 和 color 正確應用
      const styles: any = {};

      // 處理 fontSize - 如果是數字，加上 'px' 單位
      if (node.style['fontSize'] !== undefined) {
        styles['fontSize'] = typeof node.style['fontSize'] === 'number'
          ? node.style['fontSize'] + 'px'
          : node.style['fontSize'];
      }

      // 處理其他所有樣式屬性（包括 color, background 等）
      Object.keys(node.style).forEach(key => {
        if (key !== 'fontSize' && key !== 'width' && key !== 'height') {
          // width 和 height 已經由 getNodeWidth() 和 getNodeHeight() 處理
          styles[key] = node.style![key];
        }
      });

      return styles;
    }
    return null;
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
    const globalNodesFocusable = this._flowService.nodesFocusable();

    // 檢查是否有自定義的 tabIndex
    if (nodeData.domAttributes && typeof nodeData.domAttributes['tabIndex'] === 'number') {
      return nodeData.domAttributes['tabIndex'];
    }

    // 與 React 版本一致：檢查節點的 focusable 屬性和全局 nodesFocusable 設定
    // node.focusable || (nodesFocusable && typeof node.focusable === 'undefined')
    const isFocusable = !!(
      nodeData.focusable ||
      (globalNodesFocusable && typeof nodeData.focusable === 'undefined')
    );

    return isFocusable ? 0 : -1;
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
        const element = this.nodeElement?.nativeElement;
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
