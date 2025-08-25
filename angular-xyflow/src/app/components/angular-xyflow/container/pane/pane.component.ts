import {
  Component,
  input,
  output,
  viewChild,
  ElementRef,
  ChangeDetectionStrategy,
  computed,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
  afterNextRender,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { SelectionBoxComponent } from '../selection-box/selection-box.component';
import { SelectionService } from '../../services/selection.service';
import { KeyboardService } from '../../services/keyboard.service';
import { AngularXYFlowService } from '../../services/angular-xyflow.service';
import { AngularXYFlowDragService } from '../../services/drag.service';
import {
  AngularNode,
  AngularEdge,
  SelectionStartEvent,
  SelectionEndEvent,
  SelectionContextMenuEvent,
} from '../../types';
import { isPanOnDragEnabled, getPanCursor, isAnyPanOnDragEnabled } from '../../utils/pan-drag-utils';

export type PaneClickEvent<NodeType extends AngularNode = AngularNode> = {
  event: MouseEvent;
  node?: NodeType;
};

@Component({
  selector: 'angular-xyflow-pane',
  standalone: true,
  imports: [
    CommonModule,
    SelectionBoxComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div
      #paneContainer
      class="xy-flow__pane angular-xyflow__pane"
      [class.draggable]="isDraggable()"
      [class.dragging]="isDragging()"
      [class.selection]="isSelectionActive()"
      [style.width]="'100%'"
      [style.height]="'100%'"
      [style.position]="'absolute'"
      [style.top]="'0'"
      [style.left]="'0'"
      [style.cursor]="getCursor()"
      (click)="handleClick($event)"
      (dblclick)="handleDoubleClick($event)"
      (contextmenu)="handleContextMenu($event)"
      (wheel)="handleWheel($event)"
      (mouseenter)="onMouseEnter.emit($event)"
      (mousemove)="onMouseMove.emit($event)"
      (mouseleave)="onMouseLeave.emit($event)"
    >
      <!-- Viewport - 包含所有實際的渲染內容 -->
      <ng-content></ng-content>
      
      <!-- 選取框 -->
      @if (selectionService.isSelectionActive()) {
        <angular-xyflow-selection-box
          [selectionBox]="selectionService.selectionBox()"
          [selectionBoxStyle]="selectionService.selectionBoxStyle()"
        />
      }
    </div>
  `,
  styles: [
    `
      .angular-xyflow__pane {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        cursor: default;
      }

      .angular-xyflow__pane.draggable {
        cursor: grab;
      }

      .angular-xyflow__pane.dragging {
        cursor: grabbing;
      }

      .angular-xyflow__pane.selection {
        cursor: pointer;
      }
    `,
  ],
})
export class PaneComponent<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> {
  // 輸入
  isSelectionActive = input<boolean>(false);
  panOnDrag = input<boolean | number[]>(true);
  isDragging = input<boolean>(false);
  elementsSelectable = input<boolean>(true);
  selectionKeyPressed = input<boolean>(false);
  selectionOnDrag = input<boolean>(false);
  paneClickDistance = input<number>(0);
  // 🔑 新增：控制是否捕獲 onPaneClick 事件 - 與 React Flow capture onPaneClick 功能對應
  captureOnPaneClick = input<boolean>(true);
  // 🔑 新增：控制是否捕獲 onPaneScroll 事件 - 與 React Flow onPaneScroll 功能對應
  captureOnPaneScroll = input<boolean>(true);

  // 輸出事件
  onPaneClick = output<MouseEvent>();
  onPaneDoubleClick = output<MouseEvent>();
  onPaneContextMenu = output<MouseEvent>();
  onPaneScroll = output<WheelEvent>();
  onMouseEnter = output<MouseEvent>();
  onMouseMove = output<MouseEvent>();
  onMouseLeave = output<MouseEvent>();
  onSelectionStart = output<SelectionStartEvent>();
  onSelectionEnd = output<SelectionEndEvent<NodeType, EdgeType>>();
  onSelectionContextMenu = output<SelectionContextMenuEvent<NodeType, EdgeType>>();

  // 視圖引用
  paneContainer = viewChild.required<ElementRef<HTMLDivElement>>('paneContainer');

  // 服務注入
  protected selectionService = inject(SelectionService<NodeType, EdgeType>);
  private keyboardService = inject(KeyboardService);
  private flowService = inject(AngularXYFlowService<NodeType, EdgeType>);
  private dragService = inject(AngularXYFlowDragService);

  // 計算屬性 - 使用工具函數優化
  isDraggable = computed(() => {
    const panOnDrag = this.panOnDrag();
    return isPanOnDragEnabled(panOnDrag, 0); // 檢查左鍵拖拽
  });

  // 檢查是否啟用了任何形式的 panOnDrag
  isAnyPanOnDragEnabled = computed(() => {
    const panOnDrag = this.panOnDrag();
    return isAnyPanOnDragEnabled(panOnDrag);
  });

  // 檢查特定滑鼠按鍵是否支援拖拽
  isMouseButtonSupported = computed(() => (button: number) => {
    const panOnDrag = this.panOnDrag();
    return isPanOnDragEnabled(panOnDrag, button);
  });

  getCursor = computed(() => {
    const panOnDrag = this.panOnDrag();
    const isDragging = this.isDragging();
    const isSelectionActive = this.isSelectionActive();
    
    if (isSelectionActive) return 'pointer';
    
    // 使用工具函數獲取適當的游標
    return getPanCursor(panOnDrag, isDragging);
  });

  // 🔑 計算是否應該處理 pane 點擊事件 - 與 React Flow 完全一致的邏輯
  shouldHandlePaneClick = computed(() => {
    // 第一道檢查：是否啟用捕獲
    if (!this.captureOnPaneClick()) {
      return false;
    }
    
    // 第二道檢查：是否被阻止（選擇、連接、拖拽進行中）
    const selectionInProgress = this.selectionService.isSelectionInProgress();
    const dragging = this.dragService.dragging();
    
    // 使用 flowService 的方法檢查是否應該阻止
    const isBlocked = this.flowService.isPaneClickBlocked(selectionInProgress, dragging);
    
    return !isBlocked;
  });

  // 🔑 計算是否應該發射 pane scroll 事件 - 與 React Flow 完全一致的邏輯
  shouldEmitPaneScroll = computed(() => (event: WheelEvent) => {
    // 第一道檢查：是否啟用捕獲
    if (!this.captureOnPaneScroll()) {
      return false;
    }
    
    // 第二道檢查：事件目標檢測（與 React Flow wrapHandler 一致）
    const target = event.target as HTMLElement;
    const paneElement = this.paneContainer().nativeElement;
    
    // 檢查是否直接在 pane 容器上滾動（不是在節點或邊上）
    const isDirectPaneScroll = target === paneElement || 
                               (paneElement.contains(target) && 
                                !target.closest('.xy-flow__node, .xy-flow__edge, angular-xyflow-node, angular-xyflow-edge'));
    
    return isDirectPaneScroll;
  });

  constructor() {
    // 渲染後初始化選取服務
    afterNextRender(() => {
      const paneElement = this.paneContainer().nativeElement;
      if (paneElement) {
        // 初始化選取服務，傳入 pane 元素（與 React 版本一致）
        this.selectionService.initialize(paneElement);
        
        // 設置選取事件回調
        this.selectionService.setOnSelectionStart((event) => {
          this.onSelectionStart.emit(event);
        });
        
        this.selectionService.setOnSelectionEnd((event) => {
          this.onSelectionEnd.emit(event);
        });
        
        this.selectionService.setOnSelectionContextMenu((event) => {
          this.onSelectionContextMenu.emit(event);
        });
      }
    });
  }

  handleClick(event: MouseEvent): void {
    // 🔑 第一道防線：檢查是否有操作進行中（與 React Flow 一致）
    const selectionInProgress = this.selectionService.isSelectionInProgress();
    const connectionInProgress = this.flowService.connectionState().inProgress;
    const dragging = this.dragService.dragging();
    
    // 如果有任何阻止條件，重置選擇進行中狀態並直接返回
    if (selectionInProgress || connectionInProgress || dragging) {
      // 重置 selectionInProgress 狀態（與 React Flow 一致）
      if (selectionInProgress) {
        this.selectionService['selectionInProgress'] = false;
      }
      // 不發出任何事件，完全阻止點擊
      return;
    }
    
    // 🔑 第二道防線：更精確的 pane 點擊檢測（與 React Flow 一致）
    const target = event.target as HTMLElement;
    const paneElement = this.paneContainer().nativeElement;
    
    // 檢查點擊是否真正在 pane 上，而不是子元素
    // React Flow 邏輯：只有直接點擊 pane 背景才觸發
    const isDirectPaneClick = target === paneElement || 
                             paneElement.contains(target) && 
                             !target.closest('.xy-flow__node, .xy-flow__edge, angular-xyflow-node, angular-xyflow-edge');
    
    // 可選的調試日誌（生產環境可移除）
    // console.log('🔍 Pane click check:', { target: target.className, isDirectPaneClick });
    
    if (!isDirectPaneClick) {
      return;
    }
    
    // 🔑 簡化：直接發出事件，讓 AngularXYFlowComponent 處理 capture 邏輯
    this.onPaneClick.emit(event);
  }

  handleDoubleClick(event: MouseEvent): void {
    if (event.target === this.paneContainer().nativeElement) {
      this.onPaneDoubleClick.emit(event);
    }
  }

  handleContextMenu(event: MouseEvent): void {
    // 當右鍵包含在panOnDrag中時，讓XYPanZoom系統處理右鍵事件
    // 系統會在適當時機觸發onPaneContextMenu回調
    const panOnDrag = this.panOnDrag();
    if (Array.isArray(panOnDrag) && panOnDrag.includes(2)) {
      // 阻止瀏覽器默認的右鍵菜單，但讓XYPanZoom系統控制事件流程
      event.preventDefault();
      // XYPanZoom會先觸發move start，然後在適當時機觸發context menu
      return;
    }
    
    // 只有右鍵不用於拖曳時才直接觸發
    this.onPaneContextMenu.emit(event);
  }

  handleWheel(event: WheelEvent): void {
    // 🔑 與 React Flow 完全一致的 onPaneScroll 事件處理邏輯
    // 只做事件通知，不阻止默認行為或干擾 XYPanZoom 系統
    
    // 檢查是否應該發射 pane scroll 事件
    const shouldEmit = this.shouldEmitPaneScroll()(event);
    
    if (shouldEmit) {
      // 發射事件給父組件處理
      this.onPaneScroll.emit(event);
    }
    
    // 不調用 preventDefault()，讓 XYPanZoom 系統正常處理滾動
    // React Flow 的 onPaneScroll 也是純事件通知，不干擾滾動行為
  }
}