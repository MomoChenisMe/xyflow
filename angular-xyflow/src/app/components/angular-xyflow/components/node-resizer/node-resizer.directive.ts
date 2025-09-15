// Angular 核心模組
import {
  Directive,
  input,
  output,
  signal,
  effect,
  inject,
  ElementRef,
  Injector,
  ChangeDetectorRef,
  afterNextRender,
  OnDestroy,
  Renderer2,
} from '@angular/core';

// XyFlow 系統模組
import { 
  XYResizer,
  type XYResizerInstance,
  type XYResizerChange,
  type XYResizerChildChange,
  type ControlPosition,
  XY_RESIZER_HANDLE_POSITIONS,
  XY_RESIZER_LINE_POSITIONS,
} from '@xyflow/system';

// 專案內部模組
import { AngularXYFlowService } from '../../services/angular-xyflow.service';
import { AngularNode, AngularEdge } from '../../types';

/**
 * NodeResizer 指令
 * 直接在節點宿主元素上提供調整大小功能
 * 徹底避免多層 host 元素嵌套問題
 */
@Directive({
  selector: '[angularXyflowNodeResizer]',
  standalone: true,
})
export class NodeResizerDirective implements OnDestroy {
  // 注入服務和依賴
  private _flowService = inject(AngularXYFlowService<AngularNode, AngularEdge>);
  private injector = inject(Injector);
  private elementRef = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);
  private cdr = inject(ChangeDetectorRef);
  
  // 輸入屬性
  nodeId = input.required<string>();
  minWidth = input<number>(10);
  maxWidth = input<number>(Number.MAX_VALUE);
  minHeight = input<number>(10);
  maxHeight = input<number>(Number.MAX_VALUE);
  isVisible = input<boolean>(false);
  selected = input<boolean>(false);
  keepAspectRatio = input<boolean>(false);
  shouldResize = input<((event: any, params: any) => boolean) | undefined>(undefined);
  color = input<string>('#005bb5');
  enableResizer = input<boolean>(false);
  
  // 輸出事件
  resizeStart = output<any>();
  resize = output<any>();
  resizeEnd = output<any>();
  
  // 內部狀態
  protected isResizing = signal(false);
  
  // 控制元素和 XYResizer 實例
  private controlElements = new Map<string, HTMLElement>();
  private resizers = new Map<string, XYResizerInstance>();
  private isSetup = false;
  private lastEnableResizer = false;
  
  constructor() {
    // 在下一次渲染後初始化
    afterNextRender(() => {
      this.setupResizers();
    }, { injector: this.injector });
    
    // 響應輸入變化
    effect(() => {
      const nodeId = this.nodeId();
      const minWidth = this.minWidth();
      const maxWidth = this.maxWidth();
      const minHeight = this.minHeight();
      const maxHeight = this.maxHeight();
      const keepAspectRatio = this.keepAspectRatio();
      const isVisible = this.isVisible();
      const selected = this.selected();
      const color = this.color();
      const enableResizer = this.enableResizer();
      
      if (this.isSetup) {
        this.handleEnableResizerChange(enableResizer);
        this.updateResizers();
        this.updateVisibility();
      }
    }, { injector: this.injector });
  }
  
  ngOnDestroy(): void {
    this.destroyResizers();
  }
  
  /**
   * 處理 enableResizer 變化
   */
  private handleEnableResizerChange(enableResizer: boolean): void {
    if (this.lastEnableResizer === enableResizer) {
      return;
    }
    
    if (enableResizer && !this.lastEnableResizer) {
      // 從禁用變為啟用：創建控制元素
      this.createControlElements();
      this.createResizerInstances();
    } else if (!enableResizer && this.lastEnableResizer) {
      // 從啟用變為禁用：清理控制元素
      this.destroyResizers();
    }
    
    this.lastEnableResizer = enableResizer;
  }
  
  /**
   * 設置所有調整器
   */
  private setupResizers(): void {
    const hostElement = this.elementRef.nativeElement;
    
    // 設置宿主元素樣式
    this.renderer.setStyle(hostElement, 'position', 'relative');
    
    // 只有在需要 resizer 時才創建控制元素
    if (this.enableResizer()) {
      // 創建所有控制元素
      this.createControlElements();
      this.createResizerInstances();
    }
    
    this.isSetup = true;
    this.lastEnableResizer = this.enableResizer();
    this.updateVisibility();
  }
  
  /**
   * 創建 XYResizer 實例
   */
  private createResizerInstances(): void {
    // 為每個控制元素創建 XYResizer 實例
    this.controlElements.forEach((element, position) => {
      const resizer = XYResizer({
        domNode: element as HTMLDivElement,
        nodeId: this.nodeId(),
        getStoreItems: () => ({
          nodeLookup: this._flowService.getSystemNodeLookup(),
          transform: this._flowService.getCurrentTransform(),
          snapGrid: this._flowService.getSnapGridSettings().snapGrid,
          snapToGrid: this._flowService.getSnapGridSettings().snapToGrid,
          nodeOrigin: this._flowService.getNodeOrigin(),
          paneDomNode: this._flowService.getPaneDomNode(),
        }),
        onChange: (change, childChanges) => this.handleResizerChange(change, childChanges),
        onEnd: (change) => this.handleResizerEnd(change),
      });
      
      // 更新 resizer 配置
      this.updateResizerConfig(resizer, position as ControlPosition);
      
      // 保存到映射表
      this.resizers.set(position, resizer);
    });
  }
  
  /**
   * 創建所有控制元素
   */
  private createControlElements(): void {
    const hostElement = this.elementRef.nativeElement;
    
    // 創建調整線 (Lines)
    XY_RESIZER_LINE_POSITIONS.forEach(position => {
      const lineElement = this.renderer.createElement('div');
      this.renderer.addClass(lineElement, 'angular-xyflow__resize-control-line');
      this.renderer.addClass(lineElement, `angular-xyflow__resize-control-line-${position}`);
      this.renderer.setStyle(lineElement, 'pointer-events', 'all');
      this.renderer.setAttribute(lineElement, 'data-position', position);
      
      // 設置基本樣式
      this.applyLineStyles(lineElement, position);
      
      this.renderer.appendChild(hostElement, lineElement);
      this.controlElements.set(position, lineElement);
    });
    
    // 創建調整手柄 (Handles)
    XY_RESIZER_HANDLE_POSITIONS.forEach(position => {
      const handleElement = this.renderer.createElement('div');
      this.renderer.addClass(handleElement, 'angular-xyflow__resize-control-handle');
      this.renderer.addClass(handleElement, `angular-xyflow__resize-control-handle-${position}`);
      this.renderer.setStyle(handleElement, 'pointer-events', 'all');
      this.renderer.setAttribute(handleElement, 'data-position', position);
      
      // 設置基本樣式
      this.applyHandleStyles(handleElement, position);
      
      this.renderer.appendChild(hostElement, handleElement);
      this.controlElements.set(position, handleElement);
    });
  }
  
  /**
   * 應用線條樣式
   */
  private applyLineStyles(element: HTMLElement, position: string): void {
    this.renderer.setStyle(element, 'position', 'absolute');
    this.renderer.setStyle(element, 'border', `1px solid ${this.color()}`);
    this.renderer.setStyle(element, 'background', 'transparent');
    
    switch (position) {
      case 'top':
        this.renderer.setStyle(element, 'top', '0');
        this.renderer.setStyle(element, 'left', '0');
        this.renderer.setStyle(element, 'right', '0');
        this.renderer.setStyle(element, 'height', '1px');
        this.renderer.setStyle(element, 'transform', 'translateY(-50%)'); // 精確對齊邊緣
        this.renderer.setStyle(element, 'cursor', 'ns-resize');
        break;
      case 'bottom':
        this.renderer.setStyle(element, 'bottom', '0');
        this.renderer.setStyle(element, 'left', '0');
        this.renderer.setStyle(element, 'right', '0');
        this.renderer.setStyle(element, 'height', '1px');
        this.renderer.setStyle(element, 'transform', 'translateY(50%)'); // 精確對齊邊緣
        this.renderer.setStyle(element, 'cursor', 'ns-resize');
        break;
      case 'left':
        this.renderer.setStyle(element, 'left', '0');
        this.renderer.setStyle(element, 'top', '0');
        this.renderer.setStyle(element, 'bottom', '0');
        this.renderer.setStyle(element, 'width', '1px');
        this.renderer.setStyle(element, 'transform', 'translateX(-50%)'); // 精確對齊邊緣
        this.renderer.setStyle(element, 'cursor', 'ew-resize');
        break;
      case 'right':
        this.renderer.setStyle(element, 'right', '0');
        this.renderer.setStyle(element, 'top', '0');
        this.renderer.setStyle(element, 'bottom', '0');
        this.renderer.setStyle(element, 'width', '1px');
        this.renderer.setStyle(element, 'transform', 'translateX(50%)'); // 精確對齊邊緣
        this.renderer.setStyle(element, 'cursor', 'ew-resize');
        break;
    }
  }
  
  /**
   * 應用手柄樣式
   */
  private applyHandleStyles(element: HTMLElement, position: string): void {
    this.renderer.setStyle(element, 'position', 'absolute');
    this.renderer.setStyle(element, 'width', '5px');  // 修正：與React Flow一致的5px
    this.renderer.setStyle(element, 'height', '5px'); // 修正：與React Flow一致的5px
    this.renderer.setStyle(element, 'background', this.color());
    this.renderer.setStyle(element, 'border', '1px solid #fff');
    this.renderer.setStyle(element, 'border-radius', '1px'); // 修正：微圓角，與React Flow原版一致
    this.renderer.setStyle(element, 'box-sizing', 'content-box'); // 修正：確保5px是內容大小，border額外添加
    this.renderer.setStyle(element, 'transform', 'translate(-50%, -50%)'); // 修正：精確居中對齊
    
    switch (position) {
      case 'top-left':
        this.renderer.setStyle(element, 'top', '0');
        this.renderer.setStyle(element, 'left', '0');
        this.renderer.setStyle(element, 'cursor', 'nwse-resize');
        break;
      case 'top-right':
        this.renderer.setStyle(element, 'top', '0');
        this.renderer.setStyle(element, 'right', '0');
        this.renderer.setStyle(element, 'cursor', 'nesw-resize');
        break;
      case 'bottom-left':
        this.renderer.setStyle(element, 'bottom', '0');
        this.renderer.setStyle(element, 'left', '0');
        this.renderer.setStyle(element, 'cursor', 'nesw-resize');
        break;
      case 'bottom-right':
        this.renderer.setStyle(element, 'bottom', '0');
        this.renderer.setStyle(element, 'right', '0');
        this.renderer.setStyle(element, 'cursor', 'nwse-resize');
        break;
    }
  }
  
  /**
   * 更新可見性
   */
  private updateVisibility(): void {
    const enableResizer = this.enableResizer();
    const isVisible = enableResizer && (this.isVisible() || this.selected());
    
    this.controlElements.forEach((element) => {
      this.renderer.setStyle(element, 'display', isVisible ? 'block' : 'none');
    });
  }
  
  /**
   * 更新所有 resizers 配置
   */
  private updateResizers(): void {
    this.resizers.forEach((resizer, position) => {
      this.updateResizerConfig(resizer, position as ControlPosition);
    });
    
    // 更新手柄顏色
    XY_RESIZER_HANDLE_POSITIONS.forEach(position => {
      const element = this.controlElements.get(position);
      if (element) {
        this.renderer.setStyle(element, 'background', this.color());
      }
    });
    
    // 更新線條顏色
    XY_RESIZER_LINE_POSITIONS.forEach(position => {
      const element = this.controlElements.get(position);
      if (element) {
        this.renderer.setStyle(element, 'border', `1px solid ${this.color()}`);
      }
    });
  }
  
  /**
   * 更新單個 resizer 配置
   */
  private updateResizerConfig(resizer: XYResizerInstance, position: ControlPosition): void {
    resizer.update({
      controlPosition: position,
      boundaries: {
        minWidth: this.minWidth(),
        minHeight: this.minHeight(),
        maxWidth: this.maxWidth(),
        maxHeight: this.maxHeight(),
      },
      keepAspectRatio: this.keepAspectRatio(),
      resizeDirection: this.getResizeDirection(position),
      onResizeStart: (event, params) => {
        this.isResizing.set(true);
        this.updateZIndex(true);
        this.resizeStart.emit({ event, params, position });
      },
      onResize: (event, params) => {
        this.resize.emit({ event, params, position });
      },
      onResizeEnd: (event, params) => {
        this.isResizing.set(false);
        this.updateZIndex(false);
        this.resizeEnd.emit({ event, params, position });
      },
      shouldResize: this.shouldResize(),
    });
  }
  
  /**
   * 更新 z-index
   * 修正：避免影響 Parent-Child 節點的層次關係
   */
  private updateZIndex(isResizing: boolean): void {
    this.controlElements.forEach((element) => {
      // 🔑 修正：使用相對較低的 z-index，避免蓋掉 child nodes
      // resize 時使用 100，完成後使用 1，這樣不會影響 parent-child 關係
      this.renderer.setStyle(element, 'z-index', isResizing ? '100' : '1');
    });
  }
  
  /**
   * 處理 resizer 變化
   */
  private handleResizerChange(change: XYResizerChange, childChanges: XYResizerChildChange[]): void {
    const flowInstance = this._flowService.getFlowInstance();
    const nodeId = this.nodeId();
    
    // 更新節點
    if (change.x !== undefined || change.y !== undefined || 
        change.width !== undefined || change.height !== undefined) {
      flowInstance.updateNode(nodeId, (node) => ({
        ...node,
        position: {
          x: change.x ?? node.position.x,
          y: change.y ?? node.position.y,
        },
        width: change.width ?? node.width,
        height: change.height ?? node.height,
      }));
    }
    
    // 更新子節點
    childChanges.forEach(childChange => {
      flowInstance.updateNode(childChange.id, (node) => ({
        ...node,
        position: childChange.position,
        extent: childChange.extent,
      }));
    });
  }
  
  /**
   * 處理 resizer 結束
   */
  private handleResizerEnd(change: Required<XYResizerChange>): void {
    // 可以在這裡處理調整結束的額外邏輯
  }
  
  /**
   * 銷毀所有 resizers
   */
  private destroyResizers(): void {
    this.resizers.forEach(resizer => resizer.destroy());
    this.resizers.clear();
    
    // 移除所有控制元素
    this.controlElements.forEach((element) => {
      this.renderer.removeChild(this.elementRef.nativeElement, element);
    });
    this.controlElements.clear();
  }
  
  /**
   * 獲取調整方向
   */
  private getResizeDirection(position: ControlPosition): 'horizontal' | 'vertical' | undefined {
    if (position === 'left' || position === 'right') {
      return 'horizontal';
    }
    if (position === 'top' || position === 'bottom') {
      return 'vertical';
    }
    return undefined;
  }
}