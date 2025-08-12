import {
  Directive,
  HostListener,
  inject,
  ElementRef,
  OnInit,
  input
} from '@angular/core';
import { EdgeWrapperComponent } from '../components/edge-wrapper/edge-wrapper.component';

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
  
  // 接收 selectable 屬性以決定是否處理點擊事件
  selectable = input<boolean>(true);

  ngOnInit() {
    // 確保元素可以接收事件
    const element = this.elementRef.nativeElement as SVGElement;
    if (element) {
      // 設置必要的樣式以接收事件
      element.style.pointerEvents = 'all';
      element.style.cursor = this.selectable() ? 'pointer' : 'default';
    }
  }


  @HostListener('click', ['$event'])
  handleClick(event: MouseEvent): void {
    if (this.selectable() && this.edgeWrapper) {
      event.stopPropagation();
      const edge = this.edgeWrapper.edge();
      this.edgeWrapper.edgeClick.emit({ event, edge });
    }
  }

  @HostListener('dblclick', ['$event'])
  handleDoubleClick(event: MouseEvent): void {
    if (this.edgeWrapper) {
      event.stopPropagation();
      const edge = this.edgeWrapper.edge();
      this.edgeWrapper.edgeDoubleClick.emit({ event, edge });
    }
  }

  @HostListener('contextmenu', ['$event'])
  handleContextMenu(event: MouseEvent): void {
    if (this.edgeWrapper) {
      event.stopPropagation();
      // 與 React Flow 保持一致：不阻止瀏覽器預設的右鍵菜單，讓開發者自行決定
      // event.preventDefault(); // 移除以允許右鍵菜單
      const edge = this.edgeWrapper.edge();
      this.edgeWrapper.edgeContextMenu.emit({ event, edge });
    }
  }

  @HostListener('mouseenter', ['$event'])
  handleMouseEnter(event: MouseEvent): void {
    // 可以在這裡處理 hover 效果
    const element = this.elementRef.nativeElement as SVGElement;
    if (element && this.selectable()) {
      element.style.cursor = 'pointer';
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
    if (this.edgeWrapper) {
      const edge = this.edgeWrapper.edge();
      this.edgeWrapper.edgeFocus.emit({ event, edge });
    }
  }

  @HostListener('keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (this.edgeWrapper) {
      const edge = this.edgeWrapper.edge();
      this.edgeWrapper.edgeKeyDown.emit({ event, edge });
    }
  }
}