import {
  Component,
  input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  viewChild,
  ElementRef,
  NO_ERRORS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EdgeWrapperProps, EdgePosition, MockEdge, MockNode } from './edge-wrapper.types';
import { HandleType } from '../../types/constants';

/**
 * Mock @xyflow/system utilities
 */
const mockXYFlowSystem = {
  getMarkerId: (marker: string, rfId?: string) => `${marker}-${rfId || 'default'}`,
  elementSelectionKeys: ['Enter', ' ', 'Escape'],
  getEdgePosition: (params: any): EdgePosition | null => {
    // 簡化的實現 - 實際應該計算邊緣位置
    return {
      sourceX: 100,
      sourceY: 100,
      targetX: 200,
      targetY: 200,
      sourcePosition: 'right',
      targetPosition: 'left',
    };
  },
  getElevatedEdgeZIndex: (params: any) => params.zIndex || 1,
  errorMessages: {
    'error011': (edgeType: string) => `Edge type "${edgeType}" not found`,
  },
};

/**
 * Built-in edge types - 模擬內建邊緣類型
 */
const builtinEdgeTypes = {
  default: 'DefaultEdge',
  straight: 'StraightEdge',
  step: 'StepEdge',
  smoothstep: 'SmoothStepEdge',
  simplebezier: 'SimpleBezierEdge',
};

/**
 * Null position constant
 */
const nullPosition: EdgePosition = {
  sourceX: null,
  sourceY: null,
  targetX: null,
  targetY: null,
  sourcePosition: null,
  targetPosition: null,
};

/**
 * Mock store service for edge data
 */
class MockEdgeStoreService {
  private edges = signal<Map<string, MockEdge>>(new Map());
  private nodes = signal<Map<string, MockNode>>(new Map());
  private selectedEdges = signal<Set<string>>(new Set());
  private defaultEdgeOptions = signal<Partial<MockEdge> | null>(null);

  // 模擬 store state
  private state = {
    connectionMode: 'strict',
    elevateEdgesOnSelect: true,
    multiSelectionActive: false,
    nodesSelectionActive: false,
  };

  getEdge(id: string) {
    return this.edges().get(id);
  }

  getNode(id: string) {
    return this.nodes().get(id);
  }

  getDefaultEdgeOptions() {
    return this.defaultEdgeOptions();
  }

  getState() {
    return {
      ...this.state,
      edgeLookup: this.edges(),
      nodeLookup: this.nodes(),
      addSelectedEdges: (edgeIds: string[]) => {
        const selected = new Set(this.selectedEdges());
        edgeIds.forEach(id => selected.add(id));
        this.selectedEdges.set(selected);
      },
      unselectNodesAndEdges: (params: { nodes?: any[], edges?: any[] }) => {
        if (params.edges) {
          const selected = new Set(this.selectedEdges());
          params.edges.forEach(edge => selected.delete(edge.id));
          this.selectedEdges.set(selected);
        }
      },
    };
  }

  // 初始化測試數據
  initTestData() {
    const testEdge: MockEdge = {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      type: 'default',
      selected: false,
      animated: false,
      hidden: false,
      data: { label: 'Test Edge' },
      style: {},
      className: '',
      zIndex: 1,
    };

    const testNodes: MockNode[] = [
      { id: 'node-1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
      { id: 'node-2', position: { x: 200, y: 0 }, data: { label: 'Node 2' } },
    ];

    const edgeMap = new Map([[testEdge.id, testEdge]]);
    const nodeMap = new Map(testNodes.map(node => [node.id, node]));
    
    this.edges.set(edgeMap);
    this.nodes.set(nodeMap);
  }
}

/**
 * EdgeWrapper 組件 - 邊緣包裝器組件處理邊緣的渲染、選擇、事件和重新連接
 * 
 * 這個組件使用最新的 Angular Signal API 實現，對應 React Flow 的 EdgeWrapper 組件。
 * 管理邊緣的所有交互和視覺狀態，包括選擇、重新連接、動畫等功能。
 * 
 * @component
 * @selector xy-edge-wrapper
 * @example
 * ```html
 * <xy-edge-wrapper 
 *   [id]="edgeId"
 *   [edgesFocusable]="true"
 *   [edgesReconnectable]="true"
 *   [elementsSelectable]="true"
 *   (onClick)="handleEdgeClick($event, $edge)"
 *   (onDoubleClick)="handleEdgeDoubleClick($event, $edge)">
 * </xy-edge-wrapper>
 * ```
 * 
 * @remarks 這個組件負責邊緣的完整生命周期管理，包括位置計算、
 * 事件處理、鍵盤可訪問性以及重新連接功能等。
 */
@Component({
  selector: 'xy-edge-wrapper',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <svg [style.z-index]="zIndex()">
      <g
        #edgeRef
        [class]="edgeClasses()"
        [attr.data-id]="id()"
        [attr.data-testid]="'rf__edge-' + id()"
        [attr.tabindex]="isFocusable() ? 0 : null"
        [attr.role]="edgeRole()"
        [attr.aria-roledescription]="'edge'"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-describedby]="ariaDescribedBy()"
        (click)="onEdgeClick($event)"
        (dblclick)="onEdgeDoubleClick($event)"
        (contextmenu)="onEdgeContextMenu($event)"
        (mouseenter)="onEdgeMouseEnter($event)"
        (mousemove)="onEdgeMouseMove($event)"
        (mouseleave)="onEdgeMouseLeave($event)"
        (keydown)="onKeyDown($event)">
        
        <!-- 動態渲染邊緣組件 -->
        @if (!reconnecting() && !edge().hidden && positionValid()) {
          <!-- 這裡應該動態渲染對應的邊緣組件類型 -->
          <text 
            [attr.x]="((sourceX() ?? 0) + (targetX() ?? 0)) / 2"
            [attr.y]="((sourceY() ?? 0) + (targetY() ?? 0)) / 2"
            text-anchor="middle"
            class="react-flow__edge-text">
            EdgeType: {{ edgeType() }}
          </text>
          
          <!-- 簡化的路徑渲染 -->
          <path
            [attr.d]="edgePath()"
            [class]="'react-flow__edge-path'"
            [attr.marker-start]="markerStartUrl()"
            [attr.marker-end]="markerEndUrl()"
            [style]="edge().style"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5">
          </path>
        }
        
        <!-- 重新連接錨點 -->
        @if (isReconnectable() && !reconnecting()) {
          <!-- EdgeUpdateAnchors 組件應該在這裡渲染 -->
          <circle 
            *ngIf="canReconnectSource()"
            [attr.cx]="sourceX()"
            [attr.cy]="sourceY()"
            [attr.r]="reconnectRadius() || 10"
            class="react-flow__edge-update-anchor"
            fill="transparent"
            stroke="currentColor"
            (mousedown)="onReconnectSourceMouseDown($event)"
            (mouseenter)="setUpdateHover(true)"
            (mouseleave)="setUpdateHover(false)">
          </circle>
          
          <circle 
            *ngIf="canReconnectTarget()"
            [attr.cx]="targetX()"
            [attr.cy]="targetY()"
            [attr.r]="reconnectRadius() || 10"
            class="react-flow__edge-update-anchor"
            fill="transparent"
            stroke="currentColor"
            (mousedown)="onReconnectTargetMouseDown($event)"
            (mouseenter)="setUpdateHover(true)"
            (mouseleave)="setUpdateHover(false)">
          </circle>
        }
      </g>
    </svg>
  `,
  styles: [`
    :host {
      display: contents;
    }
    
    .react-flow__edge {
      cursor: pointer;
    }
    
    .react-flow__edge.selected {
      stroke: #555;
    }
    
    .react-flow__edge.animated {
      stroke-dasharray: 5;
      animation: dashdraw 0.5s linear infinite;
    }
    
    .react-flow__edge.inactive {
      cursor: default;
      pointer-events: none;
    }
    
    .react-flow__edge.updating {
      stroke: #ff0000;
    }
    
    .react-flow__edge-update-anchor {
      cursor: grab;
      stroke-width: 2;
    }
    
    .react-flow__edge-update-anchor:hover {
      stroke-width: 4;
    }
    
    @keyframes dashdraw {
      from {
        stroke-dashoffset: 10;
      }
    }
  `]
})
export class EdgeWrapperComponent implements OnInit, OnDestroy {
  /** 邊緣唯一標識符 - 必需輸入 */
  id = input.required<string>();
  
  /** 邊緣是否可聚焦 */
  edgesFocusable = input<boolean>();
  
  /** 邊緣是否可重新連接 */
  edgesReconnectable = input<boolean>();
  
  /** 元素是否可選擇 */
  elementsSelectable = input<boolean>();
  
  /** 點擊事件回調函數 */
  onClick = input<(event: MouseEvent, edge: any) => void>();
  
  /** 雙擊事件回調函數 */
  onDoubleClick = input<(event: MouseEvent, edge: any) => void>();
  
  /** 右鍵菜單事件回調函數 */
  onContextMenu = input<(event: MouseEvent, edge: any) => void>();
  
  /** 鼠標進入事件回調函數 */
  onMouseEnter = input<(event: MouseEvent, edge: any) => void>();
  
  /** 鼠標移動事件回調函數 */
  onMouseMove = input<(event: MouseEvent, edge: any) => void>();
  
  /** 鼠標離開事件回調函數 */
  onMouseLeave = input<(event: MouseEvent, edge: any) => void>();
  
  /** 重新連接錨點半徑 */
  reconnectRadius = input<number>();
  
  /** 重新連接回調函數 */
  onReconnect = input<(edge: any, connection: any) => void>();
  
  /** 重新連接開始回調函數 */
  onReconnectStart = input<(event: MouseEvent, edge: any, handleType: 'source' | 'target') => void>();
  
  /** 重新連接結束回調函數 */
  onReconnectEnd = input<(event: MouseEvent | TouchEvent, edge: any, handleType: 'source' | 'target', connectionState: any) => void>();
  
  /** React Flow 實例 ID */
  rfId = input<string>();
  
  /** 邊緣類型映射 */
  edgeTypes = input<Record<string, any>>();
  
  /** 禁用平移的 CSS 類名 */
  noPanClassName = input<string>();
  
  /** 錯誤處理回調函數 */
  onError = input<(code: string, message: string) => void>();
  
  /** 禁用鍵盤無障礙功能 */
  disableKeyboardA11y = input<boolean>();

  /** 邊緣元素引用 */
  edgeRef = viewChild<ElementRef<SVGGElement>>('edgeRef');

  private store = new MockEdgeStoreService();
  private updateHover = signal(false);
  protected reconnecting = signal(false);

  // Edge data signals
  private rawEdge = computed(() => {
    const edge = this.store.getEdge(this.id());
    const defaultOptions = this.store.getDefaultEdgeOptions();
    return edge ? (defaultOptions ? { ...defaultOptions, ...edge } : edge) : null;
  });

  // Computed properties
  edge = computed(() => this.rawEdge() || {} as MockEdge);
  edgeType = computed(() => this.edge().type || 'default');
  
  // Position calculations
  sourceX = signal<number | null>(100);
  sourceY = signal<number | null>(100);
  targetX = signal<number | null>(200);
  targetY = signal<number | null>(200);
  sourcePosition = signal<any>('right');
  targetPosition = signal<any>('left');
  zIndex = signal(1);

  // Computed styling and behavior
  isFocusable = computed(() => !!(this.edge().focusable || (this.edgesFocusable() && typeof this.edge().focusable === 'undefined')));
  isReconnectable = computed(() => 
    typeof this.onReconnect() !== 'undefined' && 
    (this.edge().reconnectable || (this.edgesReconnectable() && typeof this.edge().reconnectable === 'undefined'))
  );
  isSelectable = computed(() => !!(this.edge().selectable || (this.elementsSelectable() && typeof this.edge().selectable === 'undefined')));

  positionValid = computed(() => 
    this.sourceX() !== null && 
    this.sourceY() !== null && 
    this.targetX() !== null && 
    this.targetY() !== null
  );

  // CSS classes
  edgeClasses = computed(() => {
    const edge = this.edge();
    const classes = [
      'react-flow__edge',
      `react-flow__edge-${this.edgeType()}`,
      edge.className,
      this.noPanClassName()
    ].filter(Boolean);

    if (edge.selected) classes.push('selected');
    if (edge.animated) classes.push('animated');
    if (!this.isSelectable() && !this.onClick()) classes.push('inactive');
    if (this.updateHover()) classes.push('updating');
    if (this.isSelectable()) classes.push('selectable');

    return classes.join(' ');
  });

  // Marker URLs
  markerStartUrl = computed(() => {
    const marker = this.edge().markerStart;
    return marker ? `url('#${mockXYFlowSystem.getMarkerId(marker, this.rfId())}')` : undefined;
  });

  markerEndUrl = computed(() => {
    const marker = this.edge().markerEnd;
    return marker ? `url('#${mockXYFlowSystem.getMarkerId(marker, this.rfId())}')` : undefined;
  });

  // Edge path
  edgePath = computed(() => {
    const sx = this.sourceX();
    const sy = this.sourceY();
    const tx = this.targetX();
    const ty = this.targetY();
    
    if (sx === null || sy === null || tx === null || ty === null) {
      return '';
    }
    
    // 簡化的貝塞爾曲線路徑
    const cpx1 = sx + (tx - sx) * 0.5;
    const cpy1 = sy;
    const cpx2 = sx + (tx - sx) * 0.5;
    const cpy2 = ty;
    
    return `M ${sx},${sy} C ${cpx1},${cpy1} ${cpx2},${cpy2} ${tx},${ty}`;
  });

  // ARIA attributes
  edgeRole = computed(() => this.edge().ariaRole ?? (this.isFocusable() ? 'group' : 'img'));
  ariaLabel = computed(() => {
    const edge = this.edge();
    if (edge.ariaLabel === null) return undefined;
    return edge.ariaLabel || `Edge from ${edge.source} to ${edge.target}`;
  });
  ariaDescribedBy = computed(() => 
    this.isFocusable() ? `edge-desc-${this.rfId()}` : undefined
  );

  // Reconnection capabilities
  canReconnectSource = computed(() => {
    const reconnectable = this.edge().reconnectable;
    return reconnectable === true || reconnectable === 'source';
  });

  canReconnectTarget = computed(() => {
    const reconnectable = this.edge().reconnectable;
    return reconnectable === true || reconnectable === 'target';
  });

  ngOnInit() {
    this.store.initTestData();
    this.calculatePositions();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  /**
   * 計算邊緣位置
   */
  private calculatePositions() {
    const edge = this.edge();
    const sourceNode = this.store.getNode(edge.source);
    const targetNode = this.store.getNode(edge.target);

    if (!sourceNode || !targetNode) {
      this.setNullPosition();
      return;
    }

    const position = mockXYFlowSystem.getEdgePosition({
      id: this.id(),
      sourceNode,
      targetNode,
      sourceHandle: edge.sourceHandle || null,
      targetHandle: edge.targetHandle || null,
      connectionMode: 'strict',
      onError: this.onError(),
    });

    if (position) {
      this.sourceX.set(position.sourceX);
      this.sourceY.set(position.sourceY);
      this.targetX.set(position.targetX);
      this.targetY.set(position.targetY);
      this.sourcePosition.set(position.sourcePosition);
      this.targetPosition.set(position.targetPosition);
    } else {
      this.setNullPosition();
    }

    // Calculate z-index
    const zIndex = mockXYFlowSystem.getElevatedEdgeZIndex({
      selected: edge.selected,
      zIndex: edge.zIndex,
      sourceNode,
      targetNode,
      elevateOnSelect: true,
    });
    this.zIndex.set(zIndex);
  }

  private setNullPosition() {
    this.sourceX.set(null);
    this.sourceY.set(null);
    this.targetX.set(null);
    this.targetY.set(null);
    this.sourcePosition.set(null);
    this.targetPosition.set(null);
  }

  // Event handlers
  onEdgeClick(event: MouseEvent) {
    const state = this.store.getState();
    const edge = this.edge();
    
    if (this.isSelectable()) {
      if (edge.selected && state.multiSelectionActive) {
        state.unselectNodesAndEdges({ nodes: [], edges: [edge] });
        const edgeRef = this.edgeRef();
        if (edgeRef) {
          edgeRef.nativeElement?.blur();
        }
      } else {
        state.addSelectedEdges([this.id()]);
      }
    }

    this.onClick()?.(event, edge);
  }

  onEdgeDoubleClick(event: MouseEvent) {
    this.onDoubleClick()?.(event, { ...this.edge() });
  }

  onEdgeContextMenu(event: MouseEvent) {
    this.onContextMenu()?.(event, { ...this.edge() });
  }

  onEdgeMouseEnter(event: MouseEvent) {
    this.onMouseEnter()?.(event, { ...this.edge() });
  }

  onEdgeMouseMove(event: MouseEvent) {
    this.onMouseMove()?.(event, { ...this.edge() });
  }

  onEdgeMouseLeave(event: MouseEvent) {
    this.onMouseLeave()?.(event, { ...this.edge() });
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.disableKeyboardA11y() && mockXYFlowSystem.elementSelectionKeys.includes(event.key) && this.isSelectable()) {
      const state = this.store.getState();
      const edge = this.edge();
      const unselect = event.key === 'Escape';

      if (unselect) {
        const edgeRef = this.edgeRef();
        if (edgeRef) {
          edgeRef.nativeElement?.blur();
        }
        state.unselectNodesAndEdges({ edges: [edge] });
      } else {
        state.addSelectedEdges([this.id()]);
      }
    }
  }

  // Reconnection handlers
  onReconnectSourceMouseDown(event: MouseEvent) {
    this.handleEdgeUpdater(event, {
      nodeId: this.edge().target,
      id: this.edge().targetHandle ?? null,
      type: 'target' as const
    });
  }

  onReconnectTargetMouseDown(event: MouseEvent) {
    this.handleEdgeUpdater(event, {
      nodeId: this.edge().source,
      id: this.edge().sourceHandle ?? null,
      type: 'source' as const
    });
  }

  setUpdateHover(hover: boolean) {
    this.updateHover.set(hover);
  }

  private handleEdgeUpdater(
    event: MouseEvent,
    oppositeHandle: { nodeId: string; id: string | null; type: 'source' | 'target' }
  ) {
    if (event.button !== 0) return;

    this.reconnecting.set(true);
    this.onReconnectStart()?.(event, this.edge(), oppositeHandle.type);

    // 模擬重新連接邏輯
    // 在實際實現中，這裡會調用 XYHandle.onPointerDown
    console.log('Edge reconnection started', { edge: this.edge(), oppositeHandle });
  }
}