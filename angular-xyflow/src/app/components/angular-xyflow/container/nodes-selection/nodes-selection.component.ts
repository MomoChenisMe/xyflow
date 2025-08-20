// Angular 核心模組
import {
  Component,
  computed,
  inject,
  signal,
  effect,
  ElementRef,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// XyFlow 系統模組
import { getInternalNodesBounds, isNumeric } from '@xyflow/system';

// 專案內部模組
import { AngularXYFlowService } from '../../services/angular-xyflow.service';
import { KeyboardService } from '../../services/keyboard.service';
import { AngularXYFlowDragService } from '../../services/drag.service';
import { 
  AngularNode, 
  AngularEdge,
  SelectionContextMenuEvent,
  Viewport 
} from '../../types';

@Component({
  selector: 'angular-xyflow-nodes-selection',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (shouldRenderNodesSelection()) {
      <div
        [class]="outerContainerClass()"
        [style.transform]="transformString()"
      >
        <div
          #nodeRef
          [class]="innerRectClass"
          [tabindex]="tabIndex()"
          [style.width.px]="selectionBounds().width"
          [style.height.px]="selectionBounds().height"
          (click)="onClick($event)"
          (contextmenu)="onContextMenu($event)"
          (keydown)="onKeyDown($event)"
        ></div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        /* Host element must be positioned but take full viewport size */
        /* This matches React Flow's positioning approach */
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 3;
      }
      
      .xy-flow__nodesselection {
        position: absolute;
        z-index: 3;
        pointer-events: none;
        transform-origin: left top;
      }
      
      .xy-flow__nodesselection-rect {
        background: var(--xy-selection-background-color, var(--xy-selection-background-color-default));
        border: var(--xy-selection-border, var(--xy-selection-border-default));
        border-radius: 2px;
        pointer-events: all;
      }
      
      .xy-flow__nodesselection-rect:focus,
      .xy-flow__nodesselection-rect:focus-visible {
        outline: none;
      }
      
      .xy-flow__container {
        /* Ensure proper container behavior */
        box-sizing: border-box;
      }
    `,
  ],
})
export class NodesSelectionComponent<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> {
  private _flowService = inject(AngularXYFlowService<NodeType, EdgeType>);
  private _keyboardService = inject(KeyboardService);
  private _dragService = inject(AngularXYFlowDragService);

  // ViewChild reference
  nodeRef = viewChild<ElementRef<HTMLDivElement>>('nodeRef');

  // CSS 類別常量
  innerRectClass = 'xy-flow__nodesselection-rect';

  // 外層容器類別計算
  outerContainerClass = computed(() => {
    const noPanClassName = this._flowService.noPanClassName() || 'nopan';
    return `xy-flow__nodesselection xy-flow__container ${noPanClassName}`;
  });

  // 計算選中節點的邊界框
  selectionBounds = computed(() => {
    const internalNodeLookup = this._flowService.internalNodeLookup();
    
    if (internalNodeLookup.size === 0) {
      return { width: null, height: null, x: 0, y: 0 };
    }

    const bounds = getInternalNodesBounds(internalNodeLookup, {
      filter: (node) => !!node.selected,
    });

    return {
      width: isNumeric(bounds.width) ? bounds.width : null,
      height: isNumeric(bounds.height) ? bounds.height : null,
      x: bounds.x,
      y: bounds.y,
    };
  });

  // Transform 字符串計算
  transformString = computed(() => {
    const viewport = this._flowService.viewport();
    const bounds = this.selectionBounds();
    
    // 與 React Flow 一致的 transform 計算
    // translate(viewport.x, viewport.y) scale(viewport.zoom) translate(bounds.x, bounds.y)
    return `translate(${viewport.x}px,${viewport.y}px) scale(${viewport.zoom}) translate(${bounds.x}px,${bounds.y}px)`;
  });

  // 是否應該渲染 NodesSelection
  shouldRenderNodesSelection = computed(() => {
    const nodesSelectionActive = this._flowService.nodesSelectionActive();
    const userSelectionActive = this._flowService.userSelectionActive();
    const bounds = this.selectionBounds();
    
    // 與 React Flow 的條件完全一致
    return nodesSelectionActive && !userSelectionActive && bounds.width && bounds.height;
  });

  // tabindex 計算
  tabIndex = computed(() => {
    const disableKeyboardA11y = this._flowService.disableKeyboardA11y();
    return disableKeyboardA11y ? undefined : -1;
  });

  // 點擊事件處理：檢查是否點擊到節點
  onClick(event: MouseEvent): void {
    console.log('[NodesSelection] onClick - checking for node at position:', event.clientX, event.clientY);
    
    // 隱藏 NodesSelection rect 以獲取底下的元素
    const rect = this.nodeRef()?.nativeElement;
    if (!rect) return;
    
    // 暫時隱藏 rect 以進行 hit testing
    const originalPointerEvents = rect.style.pointerEvents;
    rect.style.pointerEvents = 'none';
    
    try {
      // 獲取點擊位置的元素
      const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
      console.log('[NodesSelection] Element below:', elementBelow?.tagName, elementBelow?.className);
      
      if (elementBelow) {
        // 檢查是否點擊到節點（檢查元素本身以及向上查找）
        let nodeElement = elementBelow.closest('.xy-flow__node');
        
        // 如果沒找到，也檢查元素本身是否是節點
        if (!nodeElement && elementBelow.classList?.contains('xy-flow__node')) {
          nodeElement = elementBelow;
        }
        
        console.log('[NodesSelection] Node element found:', nodeElement);
        
        if (nodeElement) {
          // 正確的屬性名稱是 data-node-id，不是 data-id
          const nodeId = nodeElement.getAttribute('data-node-id');
          console.log('[NodesSelection] Found node ID:', nodeId);
          
          if (nodeId) {
            console.log('[NodesSelection] Calling handleNodeClick for node:', nodeId);
            // 使用服務的 handleNodeClick 方法
            this._flowService.handleNodeClick(nodeId, { unselect: false });
            return;
          }
        }
        
        // 詳細輸出調試信息
        console.log('[NodesSelection] Element classList:', elementBelow.classList?.toString());
        console.log('[NodesSelection] Element attributes:', Array.from(elementBelow.attributes || []).map(attr => `${attr.name}="${attr.value}"`));
      }
      
      // 如果沒有點擊到節點，隱藏 NodesSelection
      console.log('[NodesSelection] No node clicked, hiding NodesSelection');
      this._flowService.setNodesSelectionActive(false);
      
    } finally {
      // 恢復 pointer events
      rect.style.pointerEvents = originalPointerEvents;
    }
  }

  // 右鍵菜單事件處理
  onContextMenu(event: MouseEvent): void {
    const onSelectionContextMenu = this._flowService.onSelectionContextMenu();
    
    if (onSelectionContextMenu) {
      event.preventDefault();
      const selectedNodes = this._flowService.getSelectedNodes();
      const selectedEdges = this._flowService.getSelectedEdges();
      
      const selectionEvent: SelectionContextMenuEvent<NodeType, EdgeType> = {
        event,
        nodes: selectedNodes,
        edges: selectedEdges,
      };
      
      onSelectionContextMenu(selectionEvent);
    }
  }

  // 鍵盤導航處理
  onKeyDown(event: KeyboardEvent): void {
    const disableKeyboardA11y = this._flowService.disableKeyboardA11y();
    if (disableKeyboardA11y) return;

    // 方向鍵位移映射（與 React Flow 一致）
    const arrowKeyDiffs: Record<string, { x: number; y: number }> = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
    };

    if (arrowKeyDiffs[event.key]) {
      event.preventDefault();
      
      const factor = event.shiftKey ? 4 : 1;
      const direction = arrowKeyDiffs[event.key];
      
      // 移動選中的節點
      this.moveSelectedNodes({
        direction,
        factor,
      });
    }
  }

  // 移動選中節點的邏輯
  private moveSelectedNodes({ direction, factor }: { 
    direction: { x: number; y: number }; 
    factor: number 
  }): void {
    const selectedNodes = this._flowService.getSelectedNodes();
    const deltaX = direction.x * factor;
    const deltaY = direction.y * factor;

    // 批量更新節點位置
    const updatedNodes = selectedNodes.map(node => ({
      ...node,
      position: {
        x: node.position.x + deltaX,
        y: node.position.y + deltaY,
      },
    }));

    // 觸發節點位置更新
    this._flowService.updateNodes(updatedNodes);
  }

  constructor() {
    // 焦點管理：選中時自動聚焦（與 React Flow 一致）
    effect(() => {
      const shouldRender = this.shouldRenderNodesSelection();
      const disableKeyboardA11y = this._flowService.disableKeyboardA11y();
      
      if (shouldRender && !disableKeyboardA11y) {
        // 延遲聚焦以確保元素已渲染
        setTimeout(() => {
          const nodeElement = this.nodeRef()?.nativeElement;
          if (nodeElement) {
            nodeElement.focus({
              preventScroll: true,
            });
          }
        });
      }
    });

    // 整合拖拽功能（與 React Flow 的 useDrag 類似）
    effect(() => {
      const nodeElement = this.nodeRef()?.nativeElement;
      if (nodeElement && this.shouldRenderNodesSelection()) {
        // 設置拖拽處理（通過 DragService）
        this._dragService.initializeNodesSelectionDrag(nodeElement);
      }
    });
  }
}