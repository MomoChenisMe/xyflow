import {
  Component,
  input,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ChangeDetectionStrategy,
  signal,
  computed,
  viewChild,
  ElementRef,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodesSelectionProps, SelectionBounds, TransformInfo } from './nodes-selection.types';
import { NodeBase } from '../Nodes/nodes.types';

/**
 * Mock utilities - 模擬 @xyflow/system 的工具函數
 */
const mockSystemUtils = {
  getInternalNodesBounds: (nodeLookup: Map<string, any>, options: { filter: (node: any) => boolean }) => {
    // 簡化的實現 - 計算選中節點的邊界
    const selectedNodes = Array.from(nodeLookup.values()).filter(options.filter);
    
    if (selectedNodes.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    selectedNodes.forEach(node => {
      const x = node.internals?.positionAbsolute?.x ?? node.position?.x ?? 0;
      const y = node.internals?.positionAbsolute?.y ?? node.position?.y ?? 0;
      const width = node.measured?.width ?? node.width ?? 150;
      const height = node.measured?.height ?? node.height ?? 40;
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  },

  isNumeric: (value: any): boolean => {
    return !isNaN(parseFloat(value)) && isFinite(value);
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
 * Mock store service for nodes selection
 */
class MockNodesSelectionStoreService {
  private state = signal({
    nodeLookup: new Map() as Map<string, any>,
    transform: [0, 0, 1] as [number, number, number],
    userSelectionActive: false,
    nodes: [] as any[],
  });

  getState() {
    return this.state();
  }

  setState(updates: any) {
    this.state.update(current => ({ ...current, ...updates }));
  }

  // 計算選擇邊界
  getSelectionBounds = computed(() => {
    const state = this.getState();
    const bounds = mockSystemUtils.getInternalNodesBounds(state.nodeLookup, {
      filter: (node) => !!node.selected,
    });

    return {
      width: mockSystemUtils.isNumeric(bounds.width) ? bounds.width : null,
      height: mockSystemUtils.isNumeric(bounds.height) ? bounds.height : null,
      x: bounds.x,
      y: bounds.y,
    };
  });

  // 計算變換字符串
  getTransformInfo = computed(() => {
    const state = this.getState();
    const bounds = this.getSelectionBounds();
    const { transform } = state;
    
    return {
      transformString: `translate(${transform[0]}px,${transform[1]}px) scale(${transform[2]}) translate(${bounds.x}px,${bounds.y}px)`,
      userSelectionActive: state.userSelectionActive,
    };
  });

  // 初始化測試數據
  initTestData() {
    const testNodes = [
      {
        id: 'node-1',
        position: { x: 100, y: 100 },
        selected: true,
        width: 150,
        height: 40,
        internals: { positionAbsolute: { x: 100, y: 100 } },
        measured: { width: 150, height: 40 },
      },
      {
        id: 'node-2',
        position: { x: 300, y: 200 },
        selected: true,
        width: 150,
        height: 40,
        internals: { positionAbsolute: { x: 300, y: 200 } },
        measured: { width: 150, height: 40 },
      },
    ];

    const nodeLookup = new Map(testNodes.map(node => [node.id, node]));
    
    this.setState({
      nodeLookup,
      nodes: testNodes,
      userSelectionActive: false,
      transform: [50, 50, 1],
    });
  }
}

/**
 * NodesSelection - Angular equivalent of React NodesSelection component
 * 
 * 節點選擇組件 - 當用戶選擇一個或多個節點時顯示選擇矩形
 * 提供拖拽、鍵盤導航和右鍵菜單功能
 * 
 * 主要功能：
 * - 顯示選中節點的邊界矩形
 * - 支持選擇區域的拖拽移動
 * - 鍵盤箭頭鍵移動選中節點
 * - 右鍵菜單支持
 * - 自動聚焦管理
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <xy-nodes-selection
 *       [disableKeyboardA11y]="false"
 *       [noPanClassName]="'nopan'"
 *       [onSelectionContextMenu]="handleContextMenu">
 *     </xy-nodes-selection>
 *   `
 * })
 * export class FlowComponent {
 *   handleContextMenu(event: MouseEvent, nodes: any[]) {
 *     console.log('Context menu for nodes:', nodes);
 *   }
 * }
 * ```
 */
@Component({
  selector: 'xy-nodes-selection',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (shouldShowSelection()) {
      <div
        [class]="containerClasses()"
        [style.transform]="transformInfo().transformString">
        
        <div
          #nodeRef
          class="react-flow__nodesselection-rect"
          [style.width.px]="selectionBounds().width"
          [style.height.px]="selectionBounds().height"
          [attr.tabindex]="disableKeyboardA11y() ? null : -1"
          [attr.data-testid]="'rf__nodesselection'"
          (contextmenu)="onContextMenu($event)"
          (keydown)="onKeyDown($event)">
        </div>
      </div>
    }
  `,
  styles: [`
    .react-flow__nodesselection {
      z-index: 3;
      transform-origin: left top;
      pointer-events: none;
    }
    
    .react-flow__nodesselection-rect {
      position: absolute;
      pointer-events: all;
      cursor: grab;
      border: 1px solid #0041d0;
      border-radius: 2px;
      background: rgba(0, 89, 220, 0.08);
    }
    
    .react-flow__nodesselection-rect:focus,
    .react-flow__nodesselection-rect:focus-visible {
      outline: 2px solid #ff0071;
      outline-offset: 2px;
    }
    
    .react-flow__nodesselection-rect:active {
      cursor: grabbing;
    }
  `]
})
export class NodesSelectionComponent implements OnInit, OnDestroy, AfterViewInit {
  /** 選擇右鍵菜單回調函數 */
  onSelectionContextMenu = input<(event: MouseEvent, nodes: NodeBase[]) => void>();
  
  /** 禁用平移的 CSS 類名 */
  noPanClassName = input<string>();
  
  /** 是否禁用鍵盤無障礙功能 */
  disableKeyboardA11y = input<boolean>(false);

  nodeRef = viewChild<ElementRef<HTMLDivElement>>('nodeRef');

  private store = new MockNodesSelectionStoreService();
  private isDragging = signal(false);

  // 計算屬性
  selectionBounds = computed(() => this.store.getSelectionBounds());
  transformInfo = computed(() => this.store.getTransformInfo());

  // 是否應該顯示選擇
  shouldShowSelection = computed(() => {
    const transformInfo = this.transformInfo();
    const bounds = this.selectionBounds();
    
    return !transformInfo.userSelectionActive && 
           bounds.width !== null && 
           bounds.height !== null &&
           bounds.width > 0 && 
           bounds.height > 0;
  });

  // 容器 CSS 類名
  containerClasses = computed(() => {
    const classes = [
      'react-flow__nodesselection',
      'react-flow__container',
      this.noPanClassName()
    ].filter(Boolean);

    return classes.join(' ');
  });

  ngOnInit() {
    this.store.initTestData();
    this.setupDragLogic();
  }

  ngAfterViewInit() {
    // 自動聚焦到選擇矩形
    effect(() => {
      if (!this.disableKeyboardA11y() && this.shouldShowSelection() && this.nodeRef()) {
        setTimeout(() => {
          this.nodeRef()?.nativeElement.focus({
            preventScroll: true,
          });
        }, 0);
      }
    });
  }

  ngOnDestroy() {
    // 清理邏輯
  }

  /**
   * 設置拖拽邏輯
   */
  private setupDragLogic() {
    // 模擬 useDrag hook 的功能
    // 在實際實現中，這裡會集成真正的拖拽系統
    console.log('Setup drag logic for nodes selection');
  }

  /**
   * 右鍵菜單事件處理器
   */
  onContextMenu(event: MouseEvent) {
    const callback = this.onSelectionContextMenu();
    if (callback) {
      const state = this.store.getState();
      const selectedNodes = state.nodes.filter((n: any) => n.selected);
      callback(event, selectedNodes);
    }
  }

  /**
   * 鍵盤事件處理器
   */
  onKeyDown(event: KeyboardEvent) {
    if (this.disableKeyboardA11y()) {
      return;
    }

    const key = event.key as keyof typeof arrowKeyDiffs;
    if (Object.prototype.hasOwnProperty.call(arrowKeyDiffs, key)) {
      event.preventDefault();

      const direction = arrowKeyDiffs[key];
      const factor = event.shiftKey ? 4 : 1;

      this.moveSelectedNodes({
        direction,
        factor,
      });
    }
  }

  /**
   * 移動選中的節點
   */
  private moveSelectedNodes(params: {
    direction: { x: number; y: number };
    factor: number;
  }) {
    const { direction, factor } = params;
    
    console.log('Move selected nodes:', {
      direction,
      factor,
      deltaX: direction.x * factor,
      deltaY: direction.y * factor,
    });

    // 在實際實現中，這裡會更新選中節點的位置
    // 例如：updateNodePositions(direction.x * factor, direction.y * factor)
  }
}