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
import {
  AngularNode,
  AngularEdge,
  SelectionStartEvent,
  SelectionEndEvent,
  SelectionContextMenuEvent,
} from '../../types';

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

  // 輸出事件
  onPaneClick = output<MouseEvent>();
  onPaneDoubleClick = output<MouseEvent>();
  onPaneContextMenu = output<MouseEvent>();
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

  // 計算屬性
  isDraggable = computed(() => {
    const panOnDrag = this.panOnDrag();
    return panOnDrag === true || (Array.isArray(panOnDrag) && panOnDrag.includes(0));
  });

  getCursor = computed(() => {
    if (this.isDragging()) return 'grabbing';
    if (this.isDraggable()) return 'grab';
    if (this.isSelectionActive()) return 'pointer';
    return 'default';
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
    // 與 React 版本一致：防止選擇進行中或連接進行中時的點擊事件
    const connectionInProgress = this.flowService.connectionState().inProgress;
    
    if (this.selectionService.isSelectionInProgress() || connectionInProgress) {
      // 重置 selectionInProgress 狀態（與 React 版本一致）
      this.selectionService['selectionInProgress'] = false;
      // 不發出任何事件，完全阻止點擊
      return;
    }
    
    // 只有當點擊目標是 pane 容器本身時才觸發事件
    if (event.target === this.paneContainer().nativeElement) {
      // 直接在這裡清除選擇，確保點擊空白處時清除選擇
      this.flowService.clearSelection();
      this.onPaneClick.emit(event);
    }
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
}