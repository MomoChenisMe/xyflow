import {
  Component,
  input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  computed,
  viewChild,
  ElementRef,
  inject,
  effect,
  ComponentRef,
  ViewContainerRef,
  Type
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeWrapperProps, NodeBase, InternalNode, NodeEvents } from '../nodes.types';
import { DefaultNodeComponent } from '../DefaultNode/default-node.component';
import { InputNodeComponent } from '../InputNode/input-node.component';
import { OutputNodeComponent } from '../OutputNode/output-node.component';
import { GroupNodeComponent } from '../GroupNode/group-node.component';
import { NodeIdService } from '../../../contexts/node-id.service';

/**
 * Mock system utilities - 模擬 @xyflow/system 的工具函數
 */
const mockSystemUtils = {
  elementSelectionKeys: ['Enter', ' ', 'Escape'],
  getNodeDimensions: (node: any) => ({ width: node.width || 150, height: node.height || 40 }),
  nodeHasDimensions: (node: any) => !!(node.width && node.height),
  getNodesInside: (nodes: Map<string, any>, bounds: any, transform: any, partially?: boolean) => [],
  isInputDOMNode: (event: Event) => {
    const target = event.target as HTMLElement;
    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
  },
  errorMessages: {
    'error003': (nodeType: string) => `Node type "${nodeType}" not found. Using fallback type "default".`,
  },
};

/**
 * 箭頭鍵對應的移動量
 */
const arrowKeyDiffs = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

/**
 * 內建節點類型映射
 */
const builtinNodeTypes = {
  default: DefaultNodeComponent,
  input: InputNodeComponent,
  output: OutputNodeComponent,
  group: GroupNodeComponent,
};

/**
 * Mock store service for nodes
 */
class MockNodeStoreService {
  private nodes = signal<Map<string, InternalNode>>(new Map());
  private selectedNodes = signal<Set<string>>(new Set());
  
  private state = signal({
    nodeLookup: new Map(),
    parentLookup: new Map(),
    selectNodesOnDrag: true,
    nodeDragThreshold: 1,
    transform: [0, 0, 1] as [number, number, number],
    width: 1000,
    height: 600,
    autoPanOnNodeFocus: true,
    ariaLabelConfig: {
      'node.a11yDescription.ariaLiveMessage': (params: any) => 
        `Node moved to position ${params.x}, ${params.y}`,
    },
    ariaLiveMessage: '',
    setCenter: (x: number, y: number, options?: any) => {},
  });

  getNode(id: string): InternalNode | undefined {
    return this.nodes().get(id);
  }

  getState() {
    return this.state();
  }

  setState(updates: any) {
    this.state.update(current => ({ ...current, ...updates }));
  }

  // 模擬節點點擊處理邏輯
  handleNodeClick(params: { id: string; unselect?: boolean }) {
    const { id, unselect } = params;
    const selected = new Set(this.selectedNodes());
    
    if (unselect) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    
    this.selectedNodes.set(selected);
  }

  // 初始化測試數據
  initTestData() {
    const testNode: InternalNode = {
      id: 'node-1',
      position: { x: 100, y: 100 },
      data: { label: 'Test Node' },
      type: 'default',
      selected: false,
      dragging: false,
      measured: { width: 150, height: 40 },
      internals: {
        positionAbsolute: { x: 100, y: 100 },
        z: 1,
        handleBounds: {
          source: [],
          target: [],
        },
      },
    };

    const nodeMap = new Map([[testNode.id, testNode]]);
    this.nodes.set(nodeMap);
    
    this.state.update(current => ({
      ...current,
      nodeLookup: nodeMap,
    }));
  }
}

/**
 * NodeWrapper - Angular equivalent of React NodeWrapper component
 * 
 * 節點包裝器組件 - 為所有節點提供基礎功能的容器
 * 處理節點的拖拽、選擇、事件、鍵盤導航和無障礙功能
 * 
 * 主要功能：
 * - 節點定位和變換
 * - 拖拽系統
 * - 選擇管理  
 * - 鍵盤導航
 * - 事件處理
 * - 無障礙支持
 * - 動態節點類型渲染
 */
@Component({
  selector: 'xy-node-wrapper',
  standalone: true,
  imports: [
    CommonModule
  ],
  providers: [NodeIdService], // 為每個節點實例提供獨立的 NodeIdService
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #nodeRef
      [class]="nodeClasses()"
      [style]="nodeStyles()"
      [attr.data-id]="id()"
      [attr.data-testid]="'rf__node-' + id()"
      [attr.tabindex]="isFocusable() ? 0 : null"
      [attr.role]="nodeRole()"
      [attr.aria-roledescription]="'node'"
      [attr.aria-describedby]="computedAriaDescribedBy()"
      [attr.aria-label]="node()?.ariaLabel || ariaLabel()"
      (mouseenter)="onMouseEnterHandler($event)"
      (mousemove)="onMouseMoveHandler($event)"
      (mouseleave)="onMouseLeaveHandler($event)"
      (contextmenu)="onContextMenuHandler($event)"
      (click)="onSelectNodeHandler($event)"
      (dblclick)="onDoubleClickHandler($event)"
      (keydown)="onKeyDown($event)"
      (focus)="onFocus($event)">
      
      <!-- 動態節點組件容器 -->
      <ng-container #nodeContainer></ng-container>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }
    
    .react-flow__node {
      position: absolute;
      user-select: none;
      pointer-events: all;
      transform-origin: 0 0;
      box-sizing: border-box;
    }
    
    .react-flow__node.selected {
      z-index: 1000;
    }
    
    .react-flow__node.selectable:hover {
      box-shadow: 0 1px 4px 1px rgba(40, 40, 40, 0.1);
    }
    
    .react-flow__node.draggable {
      cursor: grab;
    }
    
    .react-flow__node.dragging {
      cursor: grabbing;
    }
    
    .react-flow__node:focus,
    .react-flow__node:focus-visible {
      outline: 2px solid #ff0071;
      outline-offset: 2px;
    }
  `]
})
export class NodeWrapperComponent implements OnInit, OnDestroy {
  id = input.required<string>();
  nodeTypes = input<Record<string, Type<any>>>();
  onClick = input<(event: MouseEvent, node: NodeBase) => void>();
  onDoubleClick = input<(event: MouseEvent, node: NodeBase) => void>();
  onContextMenu = input<(event: MouseEvent, node: NodeBase) => void>();
  onMouseEnter = input<(event: MouseEvent, node: NodeBase) => void>();
  onMouseMove = input<(event: MouseEvent, node: NodeBase) => void>();
  onMouseLeave = input<(event: MouseEvent, node: NodeBase) => void>();
  onDragStart = input<(event: DragEvent, node: NodeBase) => void>();
  onDrag = input<(event: DragEvent, node: NodeBase) => void>();
  onDragStop = input<(event: DragEvent, node: NodeBase) => void>();
  onError = input<(code: string, message: string) => void>();
  rfId = input<string>();
  noPanClassName = input<string>();
  disableKeyboardA11y = input<boolean>();
  nodeOrigin = input<[number, number]>();
  nodeExtent = input<[[number, number], [number, number]]>();
  
  // NodeProps 屬性
  data = input<any>();
  dragging = input<boolean>();
  selected = input<boolean>();
  type = input<string>();
  xPos = input.required<number>();
  yPos = input.required<number>();
  zIndex = input.required<number>();
  draggable = input<boolean>();
  selectable = input<boolean>();
  deletable = input<boolean>();
  connectable = input<boolean>();
  focusable = input<boolean>();
  width = input<number>();
  height = input<number>();
  parentId = input<string>();
  hidden = input<boolean>();
  initialized = input<boolean>();
  isParent = input<boolean>();
  style = input<any>();
  className = input<string>();
  ariaLabel = input<string>();
  ariaLabelledBy = input<string>();
  ariaDescribedBy = input<string>();
  role = input<string>();

  nodeRef = viewChild.required<ElementRef<HTMLDivElement>>('nodeRef');
  nodeContainer = viewChild.required<ViewContainerRef>('nodeContainer');

  private store = new MockNodeStoreService();
  private nodeIdService = inject(NodeIdService);
  private nodeComponentRef?: ComponentRef<any>;
  private isDragging = signal(false);

  // 計算屬性
  node = computed(() => this.store.getNode(this.id()));
  nodeType = computed(() => this.node()?.type || this.type() || 'default');
  
  // 行為標誌
  isDraggable = computed(() => {
    const node = this.node();
    return !!(node?.draggable ?? this.draggable() ?? true);
  });
  
  isSelectable = computed(() => {
    const node = this.node();
    return !!(node?.selectable ?? this.selectable() ?? true);
  });
  
  isConnectable = computed(() => {
    const node = this.node();
    return !!(node?.connectable ?? this.connectable() ?? true);
  });
  
  isFocusable = computed(() => {
    const node = this.node();
    return !!(node?.focusable ?? this.focusable() ?? true);
  });

  // 樣式計算
  nodeClasses = computed(() => {
    const node = this.node();
    const nodeType = this.nodeType();
    const classes = [
      'react-flow__node',
      `react-flow__node-${nodeType}`,
      this.className(),
      node?.className,
    ].filter(Boolean);

    if (this.isDraggable() && this.noPanClassName()) {
      classes.push(this.noPanClassName());
    }
    
    if (node?.selected || this.selected()) classes.push('selected');
    if (this.isSelectable()) classes.push('selectable');
    if (this.isParent()) classes.push('parent');
    if (this.isDraggable()) classes.push('draggable');
    if (this.isDragging()) classes.push('dragging');

    return classes.join(' ');
  });

  nodeStyles = computed(() => {
    const node = this.node();
    const internals = node?.internals;
    
    return {
      zIndex: internals?.z ?? this.zIndex(),
      transform: `translate(${internals?.positionAbsolute.x ?? this.xPos()}px, ${internals?.positionAbsolute.y ?? this.yPos()}px)`,
      pointerEvents: this.hasPointerEvents() ? 'all' : 'none',
      visibility: this.hasDimensions() ? 'visible' : 'hidden',
      ...this.style(),
      ...node?.style,
    };
  });

  nodeRole = computed(() => {
    const node = this.node();
    return node?.ariaLabel ?? this.role() ?? (this.isFocusable() ? 'group' : undefined);
  });

  computedAriaDescribedBy = computed(() => {
    if (this.disableKeyboardA11y()) return undefined;
    return this.ariaDescribedBy() ?? `node-desc-${this.rfId()}`;
  });

  private hasPointerEvents = computed(() => {
    return this.isSelectable() || 
           this.isDraggable() || 
           !!this.onClick || 
           !!this.onMouseEnter || 
           !!this.onMouseMove || 
           !!this.onMouseLeave;
  });

  private hasDimensions = computed(() => {
    const node = this.node();
    return mockSystemUtils.nodeHasDimensions(node);
  });

  ngOnInit() {
    this.store.initTestData();
    // 設置節點 ID 到服務中
    this.nodeIdService.setNodeId(this.id());
    this.createNodeComponent();
  }

  ngOnDestroy() {
    this.nodeComponentRef?.destroy();
    // 清除節點 ID
    this.nodeIdService.clearNodeId();
  }

  /**
   * 創建動態節點組件
   */
  private createNodeComponent() {
    const nodeType = this.nodeType();
    const NodeComponent = this.nodeTypes()?.[nodeType] || (builtinNodeTypes as any)[nodeType];
    
    if (!NodeComponent) {
      const errorHandler = this.onError();
      if (errorHandler) {
        errorHandler('003', mockSystemUtils.errorMessages['error003'](nodeType));
      }
      const DefaultComponent = builtinNodeTypes.default;
      this.nodeComponentRef = this.nodeContainer().createComponent(DefaultComponent);
    } else {
      this.nodeComponentRef = this.nodeContainer().createComponent(NodeComponent);
    }

    // 設置組件屬性
    this.updateNodeComponentProps();
  }

  /**
   * 更新節點組件屬性
   */
  private updateNodeComponentProps() {
    if (!this.nodeComponentRef) return;

    const node = this.node();
    const instance = this.nodeComponentRef.instance;
    
    // 設置基本屬性
    instance.id = this.id();
    instance.data = node?.data ?? this.data();
    instance.type = this.nodeType();
    instance.selected = node?.selected ?? this.selected();
    instance.dragging = this.isDragging();
    instance.connectable = this.isConnectable();
    instance.xPos = this.xPos();
    instance.yPos = this.yPos();
    instance.zIndex = this.zIndex();

    this.nodeComponentRef.changeDetectorRef.markForCheck();
  }

  // 事件處理器
  onMouseEnterHandler(event: MouseEvent) {
    const node = this.node();
    const mouseEnterHandler = this.onMouseEnter();
    if (mouseEnterHandler && node) {
      mouseEnterHandler(event, node);
    }
  }

  onMouseMoveHandler(event: MouseEvent) {
    const node = this.node();
    const mouseMoveHandler = this.onMouseMove();
    if (mouseMoveHandler && node) {
      mouseMoveHandler(event, node);
    }
  }

  onMouseLeaveHandler(event: MouseEvent) {
    const node = this.node();
    const mouseLeaveHandler = this.onMouseLeave();
    if (mouseLeaveHandler && node) {
      mouseLeaveHandler(event, node);
    }
  }

  onContextMenuHandler(event: MouseEvent) {
    const node = this.node();
    const contextMenuHandler = this.onContextMenu();
    if (contextMenuHandler && node) {
      contextMenuHandler(event, node);
    }
  }

  onDoubleClickHandler(event: MouseEvent) {
    const node = this.node();
    const doubleClickHandler = this.onDoubleClick();
    if (doubleClickHandler && node) {
      doubleClickHandler(event, node);
    }
  }

  onSelectNodeHandler(event: MouseEvent) {
    const state = this.store.getState();
    
    if (this.isSelectable() && (!state.selectNodesOnDrag || !this.isDraggable() || state.nodeDragThreshold > 0)) {
      this.store.handleNodeClick({ id: this.id() });
    }

    const node = this.node();
    const clickHandler = this.onClick();
    if (clickHandler && node) {
      clickHandler(event, node);
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (mockSystemUtils.isInputDOMNode(event) || this.disableKeyboardA11y()) {
      return;
    }

    if (mockSystemUtils.elementSelectionKeys.includes(event.key) && this.isSelectable()) {
      const unselect = event.key === 'Escape';
      this.store.handleNodeClick({ id: this.id(), unselect });
    } else if (this.isDraggable() && this.selected() && event.key in arrowKeyDiffs) {
      event.preventDefault();
      this.moveSelectedNodes(event);
    }
  }

  onFocus(event: FocusEvent) {
    if (this.disableKeyboardA11y() || !this.nodeRef().nativeElement.matches(':focus-visible')) {
      return;
    }

    const state = this.store.getState();
    if (!state.autoPanOnNodeFocus) {
      return;
    }

    // 實現自動平移到焦點節點的邏輯
    console.log('Focus on node:', this.id);
  }

  /**
   * 移動選中的節點
   */
  private moveSelectedNodes(event: KeyboardEvent) {
    const direction = arrowKeyDiffs[event.key as keyof typeof arrowKeyDiffs];
    const factor = event.shiftKey ? 4 : 1;
    
    console.log('Move selected nodes:', {
      direction,
      factor,
      nodeId: this.id,
    });

    // 在實際實現中，這裡會更新節點位置
    const state = this.store.getState();
    this.store.setState({
      ariaLiveMessage: state.ariaLabelConfig['node.a11yDescription.ariaLiveMessage']({
        direction: event.key.replace('Arrow', '').toLowerCase(),
        x: this.xPos() + direction.x * factor,
        y: this.yPos() + direction.y * factor,
      }),
    });
  }
}