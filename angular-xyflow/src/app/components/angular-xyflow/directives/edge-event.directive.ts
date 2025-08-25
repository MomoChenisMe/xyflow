import {
  Directive,
  HostListener,
  inject,
  ElementRef,
  OnInit,
  input,
  computed
} from '@angular/core';
import { EdgeWrapperComponent } from '../components/edge-wrapper/edge-wrapper.component';
import { AngularXYFlowService } from '../services/angular-xyflow.service';

/**
 * 指令用於統一處理所有 Edge 事件
 * 自動附加到所有 BaseEdge 組件，處理點擊、雙擊、右鍵選單和滑鼠事件
 */
@Directive({
  selector: '[angular-xyflow-base-edge]',
  standalone: true
})
export class EdgeEventDirective implements OnInit {
  // 注入 EdgeWrapper 以發出事件
  private edgeWrapper = inject(EdgeWrapperComponent, { optional: true });
  private elementRef = inject(ElementRef);
  private flowService = inject(AngularXYFlowService, { optional: true });
  
  // 接收 selectable 屬性以決定是否處理點擊事件
  selectable = input<boolean>(true);
  
  // 🔑 關鍵修正：添加與 React Flow 完全一致的 isSelectable 計算
  // React Flow 邏輯：edge.selectable || (elementsSelectable && typeof edge.selectable === 'undefined')
  isSelectable = computed(() => {
    const edge = this.edgeWrapper?.edge();
    if (!edge) return false;
    
    const elementsSelectable = this.flowService?.elementsSelectable() ?? true;
    
    // 如果 edge 有明確的 selectable 屬性，使用它
    if (edge.selectable !== undefined) {
      return edge.selectable;
    }
    
    // 否則使用 elementsSelectable（與React Flow邏輯完全一致）
    return elementsSelectable;
  });

  ngOnInit() {
    // 確保元素可以接收事件
    const element = this.elementRef.nativeElement as SVGElement;
    if (element) {
      // 🔑 關鍵修正：根據 React Flow 邏輯設定 pointer-events 和 cursor
      const isSelectable = this.isSelectable();
      
      if (isSelectable) {
        element.style.pointerEvents = 'all';
        element.style.cursor = 'pointer';
      } else {
        // inactive edge: pointer-events none, cursor default
        element.style.pointerEvents = 'none';
        element.style.cursor = 'default';
      }
    }
  }


  @HostListener('click', ['$event'])
  handleClick(event: MouseEvent): void {
    // 🔑 關鍵修正：使用 React Flow 式的 isSelectable 計算結果
    if (this.isSelectable() && this.edgeWrapper) {
      event.stopPropagation();
      event.preventDefault(); // 也阻止默認行為
      const edge = this.edgeWrapper.edge();
      this.edgeWrapper.edgeClick.emit({ event, edge });
    }
  }

  @HostListener('dblclick', ['$event'])
  handleDoubleClick(event: MouseEvent): void {
    // 🔑 關鍵修正：雙擊事件也應該檢查 isSelectable
    if (this.isSelectable() && this.edgeWrapper) {
      event.stopPropagation();
      const edge = this.edgeWrapper.edge();
      this.edgeWrapper.edgeDoubleClick.emit({ event, edge });
    }
  }

  @HostListener('contextmenu', ['$event'])
  handleContextMenu(event: MouseEvent): void {
    // 🔑 關鍵修正：右鍵菜單也應該檢查 isSelectable
    if (this.isSelectable() && this.edgeWrapper) {
      event.stopPropagation();
      // 與 React Flow 保持一致：不阻止瀏覽器預設的右鍵菜單，讓開發者自行決定
      // event.preventDefault(); // 移除以允許右鍵菜單
      const edge = this.edgeWrapper.edge();
      this.edgeWrapper.edgeContextMenu.emit({ event, edge });
    }
  }

  @HostListener('mouseenter', ['$event'])
  handleMouseEnter(event: MouseEvent): void {
    // 🔑 關鍵修正：與 ngOnInit 中的邏輯保持一致
    const element = this.elementRef.nativeElement as SVGElement;
    if (element) {
      const isSelectable = this.isSelectable();
      element.style.cursor = isSelectable ? 'pointer' : 'default';
    }
  }

  @HostListener('mouseleave', ['$event'])
  handleMouseLeave(event: MouseEvent): void {
    // 可以在這裡處理 hover 離開效果
  }

  @HostListener('mousemove', ['$event'])
  handleMouseMove(event: MouseEvent): void {
    // 可以在這裡處理滑鼠移動
  }

  @HostListener('focus', ['$event'])
  handleFocus(event: FocusEvent): void {
    // 🔑 關鍵修正：focus 事件也應該檢查 isSelectable
    if (this.isSelectable() && this.edgeWrapper) {
      const edge = this.edgeWrapper.edge();
      this.edgeWrapper.edgeFocus.emit({ event, edge });
    }
  }

  @HostListener('keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    // 🔑 關鍵修正：keydown 事件也應該檢查 isSelectable
    if (this.isSelectable() && this.edgeWrapper) {
      const edge = this.edgeWrapper.edge();
      this.edgeWrapper.edgeKeyDown.emit({ event, edge });
    }
  }
}