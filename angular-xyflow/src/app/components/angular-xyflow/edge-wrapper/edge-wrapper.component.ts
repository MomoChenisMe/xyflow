import {
  Component,
  input,
  output,
  computed,
  inject,
  ChangeDetectionStrategy,
  Type,
  Injector,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewChild,
  ViewContainerRef,
  ElementRef,
  Renderer2,
  ComponentRef,
  AfterViewInit,
  OnDestroy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position } from '@xyflow/system';
import {
  AngularEdge,
  EdgeTypes,
  EdgeProps,
  EdgeMarker,
} from '../types';
import { EdgeComponent } from '../edge/edge.component';
import { BezierEdgeComponent } from '../components/edges/bezier-edge/bezier-edge.component';
import { StraightEdgeComponent } from '../components/edges/straight-edge/straight-edge.component';
import { StepEdgeComponent } from '../components/edges/step-edge/step-edge.component';
import { SmoothStepEdgeComponent } from '../components/edges/smooth-step-edge/smooth-step-edge.component';
import { SimpleBezierEdgeComponent } from '../components/edges/simple-bezier-edge/simple-bezier-edge.component';

@Component({
  selector: 'angular-xyflow-edge-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    EdgeComponent,
    BezierEdgeComponent,
    StraightEdgeComponent,
    StepEdgeComponent,
    SmoothStepEdgeComponent,
    SimpleBezierEdgeComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <svg
      class="angular-xyflow__edge xy-flow__edge xy-flow__container"
      [class.selected]="edge().selected"
      [class.animated]="edge().animated"
      [class.selectable]="edge().selectable !== false"
      [attr.tabindex]="isEdgeFocusable() ? 0 : null"
      [style.position]="'absolute'"
      [style.width]="'100%'"
      [style.height]="'100%'"
      [style.overflow]="'visible'"
      [style.z-index]="edge().zIndex || 0"
      (click)="handleClick($event)"
      (dblclick)="handleDoubleClick($event)"
      (contextmenu)="handleContextMenu($event)"
      (focus)="handleFocus($event)"
      (keydown)="handleKeyDown($event)"
    >
      <!-- 條件渲染內建邊組件 -->
    @switch (resolvedEdgeType()) {
        @case ('default') {
          @if (hasCustomEdgeType()) {
            <!-- 動態組件容器 -->
            <svg:g 
              #dynamicEdgeContainer
              [style.pointer-events]="'auto'"
              [style.cursor]="edge().selectable !== false ? 'pointer' : 'default'"
            ></svg:g>
          } @else {
            <svg:g
              angular-xyflow-bezier-edge
              [style.pointer-events]="'auto'"
              [style.cursor]="edge().selectable !== false ? 'pointer' : 'default'"
              [id]="edgeInputs().id"
              [sourceX]="edgeInputs().sourceX"
              [sourceY]="edgeInputs().sourceY"
              [targetX]="edgeInputs().targetX"
              [targetY]="edgeInputs().targetY"
              [sourcePosition]="edgeInputs().sourcePosition"
              [targetPosition]="edgeInputs().targetPosition"
              [label]="edgeInputs()['label']"
              [labelStyle]="edgeInputs()['labelStyle']"
              [labelShowBg]="edgeInputs()['labelShowBg']"
              [labelBgStyle]="edgeInputs()['labelBgStyle']"
              [labelBgPadding]="edgeInputs()['labelBgPadding']"
              [labelBgBorderRadius]="edgeInputs()['labelBgBorderRadius']"
              [style]="edgeInputs().style"
              [markerEnd]="edgeInputs()['markerEnd']"
              [markerStart]="edgeInputs()['markerStart']"
              [interactionWidth]="edgeInputs().interactionWidth"
              [data]="edgeInputs().data"
              [type]="edgeInputs().type"
              [selected]="edgeInputs().selected"
              [sourceHandleId]="edgeInputs().sourceHandleId"
              [targetHandleId]="edgeInputs().targetHandleId"
              [animated]="edgeInputs().animated"
              [hidden]="edgeInputs().hidden"
              [deletable]="edgeInputs().deletable"
              [selectable]="edgeInputs().selectable" />
          }
        }
        @case ('bezier') {
          <svg:g
            angular-xyflow-bezier-edge
            [style.pointer-events]="'auto'"
            [style.cursor]="edge().selectable !== false ? 'pointer' : 'default'"
            [id]="edgeInputs().id"
            [sourceX]="edgeInputs().sourceX"
            [sourceY]="edgeInputs().sourceY"
            [targetX]="edgeInputs().targetX"
            [targetY]="edgeInputs().targetY"
            [sourcePosition]="edgeInputs().sourcePosition"
            [targetPosition]="edgeInputs().targetPosition"
            [label]="edgeInputs()['label']"
            [labelStyle]="edgeInputs()['labelStyle']"
            [labelShowBg]="edgeInputs()['labelShowBg']"
            [labelBgStyle]="edgeInputs()['labelBgStyle']"
            [labelBgPadding]="edgeInputs()['labelBgPadding']"
            [labelBgBorderRadius]="edgeInputs()['labelBgBorderRadius']"
            [style]="edgeInputs().style"
            [markerEnd]="edgeInputs()['markerEnd']"
            [markerStart]="edgeInputs()['markerStart']"
            [interactionWidth]="edgeInputs().interactionWidth"
            [data]="edgeInputs().data"
            [type]="edgeInputs().type"
            [selected]="edgeInputs().selected"
            [sourceHandleId]="edgeInputs().sourceHandleId"
            [targetHandleId]="edgeInputs().targetHandleId"
            [animated]="edgeInputs().animated"
            [hidden]="edgeInputs().hidden"
            [deletable]="edgeInputs().deletable"
            [selectable]="edgeInputs().selectable" />
        }
        @case ('straight') {
          <svg:g
            angular-xyflow-straight-edge
            [style.pointer-events]="'auto'"
            [style.cursor]="edge().selectable !== false ? 'pointer' : 'default'"
            [id]="edgeInputs().id"
            [sourceX]="edgeInputs().sourceX"
            [sourceY]="edgeInputs().sourceY"
            [targetX]="edgeInputs().targetX"
            [targetY]="edgeInputs().targetY"
            [label]="edgeInputs()['label']"
            [labelStyle]="edgeInputs()['labelStyle']"
            [labelShowBg]="edgeInputs()['labelShowBg']"
            [labelBgStyle]="edgeInputs()['labelBgStyle']"
            [labelBgPadding]="edgeInputs()['labelBgPadding']"
            [labelBgBorderRadius]="edgeInputs()['labelBgBorderRadius']"
            [style]="edgeInputs().style"
            [markerEnd]="edgeInputs()['markerEnd']"
            [markerStart]="edgeInputs()['markerStart']"
            [interactionWidth]="edgeInputs().interactionWidth"
            [data]="edgeInputs().data"
            [type]="edgeInputs().type"
            [selected]="edgeInputs().selected"
            [sourceHandleId]="edgeInputs().sourceHandleId"
            [targetHandleId]="edgeInputs().targetHandleId"
            [animated]="edgeInputs().animated"
            [hidden]="edgeInputs().hidden"
            [deletable]="edgeInputs().deletable"
            [selectable]="edgeInputs().selectable" />
        }
        @case ('step') {
          <svg:g
            angular-xyflow-step-edge
            [style.pointer-events]="'auto'"
            [style.cursor]="edge().selectable !== false ? 'pointer' : 'default'"
            [id]="edgeInputs().id"
            [sourceX]="edgeInputs().sourceX"
            [sourceY]="edgeInputs().sourceY"
            [targetX]="edgeInputs().targetX"
            [targetY]="edgeInputs().targetY"
            [sourcePosition]="edgeInputs().sourcePosition"
            [targetPosition]="edgeInputs().targetPosition"
            [label]="edgeInputs()['label']"
            [labelStyle]="edgeInputs()['labelStyle']"
            [labelShowBg]="edgeInputs()['labelShowBg']"
            [labelBgStyle]="edgeInputs()['labelBgStyle']"
            [labelBgPadding]="edgeInputs()['labelBgPadding']"
            [labelBgBorderRadius]="edgeInputs()['labelBgBorderRadius']"
            [style]="edgeInputs().style"
            [markerEnd]="edgeInputs()['markerEnd']"
            [markerStart]="edgeInputs()['markerStart']"
            [pathOptions]="edgeInputs().pathOptions"
            [interactionWidth]="edgeInputs().interactionWidth"
            [data]="edgeInputs().data"
            [type]="edgeInputs().type"
            [selected]="edgeInputs().selected"
            [sourceHandleId]="edgeInputs().sourceHandleId"
            [targetHandleId]="edgeInputs().targetHandleId"
            [animated]="edgeInputs().animated"
            [hidden]="edgeInputs().hidden"
            [deletable]="edgeInputs().deletable"
            [selectable]="edgeInputs().selectable" />
        }
        @case ('smoothstep') {
          <svg:g
            angular-xyflow-smooth-step-edge
            [style.pointer-events]="'auto'"
            [style.cursor]="edge().selectable !== false ? 'pointer' : 'default'"
            [id]="edgeInputs().id"
            [sourceX]="edgeInputs().sourceX"
            [sourceY]="edgeInputs().sourceY"
            [targetX]="edgeInputs().targetX"
            [targetY]="edgeInputs().targetY"
            [sourcePosition]="edgeInputs().sourcePosition"
            [targetPosition]="edgeInputs().targetPosition"
            [label]="edgeInputs()['label']"
            [labelStyle]="edgeInputs()['labelStyle']"
            [labelShowBg]="edgeInputs()['labelShowBg']"
            [labelBgStyle]="edgeInputs()['labelBgStyle']"
            [labelBgPadding]="edgeInputs()['labelBgPadding']"
            [labelBgBorderRadius]="edgeInputs()['labelBgBorderRadius']"
            [style]="edgeInputs().style"
            [markerEnd]="edgeInputs()['markerEnd']"
            [markerStart]="edgeInputs()['markerStart']"
            [pathOptions]="edgeInputs().pathOptions"
            [interactionWidth]="edgeInputs().interactionWidth"
            [data]="edgeInputs().data"
            [type]="edgeInputs().type"
            [selected]="edgeInputs().selected"
            [sourceHandleId]="edgeInputs().sourceHandleId"
            [targetHandleId]="edgeInputs().targetHandleId"
            [animated]="edgeInputs().animated"
            [hidden]="edgeInputs().hidden"
            [deletable]="edgeInputs().deletable"
            [selectable]="edgeInputs().selectable" />
        }
        @case ('simplebezier') {
          <svg:g
            angular-xyflow-simple-bezier-edge
            [style.pointer-events]="'auto'"
            [style.cursor]="edge().selectable !== false ? 'pointer' : 'default'"
            [id]="edgeInputs().id"
            [sourceX]="edgeInputs().sourceX"
            [sourceY]="edgeInputs().sourceY"
            [targetX]="edgeInputs().targetX"
            [targetY]="edgeInputs().targetY"
            [sourcePosition]="edgeInputs().sourcePosition"
            [targetPosition]="edgeInputs().targetPosition"
            [label]="edgeInputs()['label']"
            [labelStyle]="edgeInputs()['labelStyle']"
            [labelShowBg]="edgeInputs()['labelShowBg']"
            [labelBgStyle]="edgeInputs()['labelBgStyle']"
            [labelBgPadding]="edgeInputs()['labelBgPadding']"
            [labelBgBorderRadius]="edgeInputs()['labelBgBorderRadius']"
            [style]="edgeInputs().style"
            [markerEnd]="edgeInputs()['markerEnd']"
            [markerStart]="edgeInputs()['markerStart']"
            [interactionWidth]="edgeInputs().interactionWidth"
            [data]="edgeInputs().data"
            [type]="edgeInputs().type"
            [selected]="edgeInputs().selected"
            [sourceHandleId]="edgeInputs().sourceHandleId"
            [targetHandleId]="edgeInputs().targetHandleId"
            [animated]="edgeInputs().animated"
            [hidden]="edgeInputs().hidden"
            [deletable]="edgeInputs().deletable"
            [selectable]="edgeInputs().selectable" />
        }
        @default {
          <!-- 預設情況：使用 BezierEdge 或自定義類型通過手動創建 -->
          @if (hasCustomEdgeType()) {
            <!-- 動態組件容器 -->
            <svg:g 
              #dynamicEdgeContainer
              [style.pointer-events]="'auto'"
              [style.cursor]="edge().selectable !== false ? 'pointer' : 'default'"
            ></svg:g>
          } @else {
            <!-- 預設使用 BezierEdge -->
            <svg:g
              angular-xyflow-bezier-edge
              [style.pointer-events]="'auto'"
              [style.cursor]="edge().selectable !== false ? 'pointer' : 'default'"
              [id]="edgeInputs().id"
              [sourceX]="edgeInputs().sourceX"
              [sourceY]="edgeInputs().sourceY"
              [targetX]="edgeInputs().targetX"
              [targetY]="edgeInputs().targetY"
              [sourcePosition]="edgeInputs().sourcePosition"
              [targetPosition]="edgeInputs().targetPosition"
              [label]="edgeInputs()['label']"
              [labelStyle]="edgeInputs()['labelStyle']"
              [labelShowBg]="edgeInputs()['labelShowBg']"
              [labelBgStyle]="edgeInputs()['labelBgStyle']"
              [labelBgPadding]="edgeInputs()['labelBgPadding']"
              [labelBgBorderRadius]="edgeInputs()['labelBgBorderRadius']"
              [style]="edgeInputs().style"
              [markerEnd]="edgeInputs()['markerEnd']"
              [markerStart]="edgeInputs()['markerStart']"
              [interactionWidth]="edgeInputs().interactionWidth"
              [data]="edgeInputs().data"
              [type]="edgeInputs().type"
              [selected]="edgeInputs().selected"
              [sourceHandleId]="edgeInputs().sourceHandleId"
              [targetHandleId]="edgeInputs().targetHandleId"
              [animated]="edgeInputs().animated"
              [hidden]="edgeInputs().hidden"
              [deletable]="edgeInputs().deletable"
              [selectable]="edgeInputs().selectable" />
          }
        }
      }
    </svg>
  `,
})
export class EdgeWrapperComponent<EdgeType extends AngularEdge = AngularEdge> implements AfterViewInit, OnDestroy {
  // 輸入屬性
  edge = input.required<EdgeType>();
  sourceX = input.required<number>();
  sourceY = input.required<number>();
  targetX = input.required<number>();
  targetY = input.required<number>();
  sourcePosition = input.required<Position>();
  targetPosition = input.required<Position>();
  sourceHandleId = input<string>();
  targetHandleId = input<string>();
  isDarkMode = input<boolean>(false);
  edgeTypes = input<EdgeTypes>();
  getMarkerId = input.required<(edge: any, position: 'start' | 'end', marker: EdgeMarker) => string>();

  // 輸出事件
  edgeClick = output<{ event: MouseEvent; edge: EdgeType }>();
  edgeDoubleClick = output<{ event: MouseEvent; edge: EdgeType }>();
  edgeContextMenu = output<{ event: MouseEvent; edge: EdgeType }>();
  edgeFocus = output<{ event: FocusEvent; edge: EdgeType }>();
  edgeKeyDown = output<{ event: KeyboardEvent; edge: EdgeType }>();

  // 動態組件載入所需的依賴
  protected readonly edgeInjector = inject(Injector);
  private readonly renderer = inject(Renderer2);
  private readonly viewContainerRef = inject(ViewContainerRef);
  
  // ViewChild 引用動態組件容器
  @ViewChild('dynamicEdgeContainer', { read: ElementRef, static: false })
  private dynamicEdgeContainer?: ElementRef<SVGGElement>;
  
  // 存儲動態創建的組件引用
  private dynamicComponentRef?: ComponentRef<any>;

  constructor() {
    // 監聽邊類型和輸入的變化，重新創建動態組件
    effect(() => {
      // 觸發重算：監聽相關信號的變化
      this.hasCustomEdgeType();
      this.edgeComponent();
      this.edgeInputs();
      
      // 如果組件已經初始化且需要動態組件，重新創建
      if (this.dynamicEdgeContainer && this.hasCustomEdgeType()) {
        this.createDynamicComponent();
      }
    });
  }

  // 內建邊類型（類似 React Flow 的 builtinEdgeTypes）
  private readonly builtinEdgeTypes: Record<string, Type<any>> = {
    default: BezierEdgeComponent,           // 預設使用 BezierEdge，與 React Flow 一致
    bezier: BezierEdgeComponent,            // 標準貝茲曲線
    straight: StraightEdgeComponent,        // 直線邊
    step: StepEdgeComponent,                // 階梯邊（無圓角）
    smoothstep: SmoothStepEdgeComponent,    // 平滑階梯邊（有圓角）
    simplebezier: SimpleBezierEdgeComponent, // 簡單貝茲曲線
  };

  // 獲取解析後的邊類型（與 React Flow 邏輯一致）
  readonly resolvedEdgeType = computed(() => {
    const edge = this.edge();
    let edgeType = edge.type || 'default';
    const userEdgeTypes = this.edgeTypes();
    
    // React Flow 邏輯：
    // 1. 首先查找用戶定義的 edgeTypes
    // 2. 如果沒有找到，查找內建類型
    // 3. 如果類型不存在，回退到 default
    let EdgeComponent = userEdgeTypes?.[edgeType] || this.builtinEdgeTypes[edgeType];
    
    if (EdgeComponent === undefined) {
      // 錯誤處理：類型未找到，回退到 default
      console.warn(`Edge type "${edgeType}" not found. Using fallback type "default".`);
      edgeType = 'default';
    }
    
    return edgeType;
  });

  // 檢查是否為自定義邊類型（非內建類型）
  readonly hasCustomEdgeType = computed(() => {
    const resolvedType = this.resolvedEdgeType();
    const userEdgeTypes = this.edgeTypes();
    
    // 檢查解析後的類型是否有用戶自定義版本
    return userEdgeTypes && userEdgeTypes[resolvedType] !== undefined;
  });

  // 動態邊組件選擇
  readonly edgeComponent = computed(() => {
    const edge = this.edge();
    let edgeType = edge.type || 'default';
    const userEdgeTypes = this.edgeTypes();
    
    // React Flow 邏輯：
    // 1. 首先查找用戶定義的 edgeTypes
    // 2. 如果沒有找到，查找內建類型
    // 3. 如果類型不存在，回退到 default
    let EdgeComponent = userEdgeTypes?.[edgeType] || this.builtinEdgeTypes[edgeType];
    
    if (EdgeComponent === undefined) {
      // 錯誤處理：類型未找到，回退到 default
      console.warn(`Edge type "${edgeType}" not found. Using fallback type "default".`);
      edgeType = 'default';
      EdgeComponent = userEdgeTypes?.['default'] || this.builtinEdgeTypes['default'];
    }
    
    return EdgeComponent;
  });

  // 準備傳遞給動態邊組件的輸入屬性
  readonly edgeInputs = computed(() => {
    const edge = this.edge();
    const resolvedEdgeType = this.resolvedEdgeType();
    const inputs: EdgeProps = {
      id: edge.id,
      data: edge.data,
      type: resolvedEdgeType,
      selected: edge.selected || false,
      sourceX: this.sourceX(),
      sourceY: this.sourceY(),
      targetX: this.targetX(),
      targetY: this.targetY(),
      sourcePosition: this.sourcePosition(),
      targetPosition: this.targetPosition(),
      sourceHandleId: this.sourceHandleId(),
      targetHandleId: this.targetHandleId(),
      markerStart: edge.markerStart,
      markerEnd: edge.markerEnd,
      style: edge.style,
      animated: edge.animated,
      hidden: edge.hidden,
      deletable: edge.deletable,
      selectable: edge.selectable,
      interactionWidth: 20, // 預設交互寬度
      pathOptions: (edge as any).pathOptions, // 路徑選項（如 curvature, borderRadius 等）
    };
    return inputs;
  });

  // 計算邊是否可聚焦
  readonly isEdgeFocusable = computed(() => {
    const edge = this.edge();
    // 根據 React Flow 邏輯：edge.focusable || (edgesFocusable && typeof edge.focusable === 'undefined')
    // 這裡簡化為檢查邊自身的 focusable 屬性
    return edge.focusable !== false;
  });

  // 事件處理方法
  handleClick(event: MouseEvent): void {
    const edge = this.edge();
    if (edge.selectable !== false) {
      event.stopPropagation();
      this.edgeClick.emit({ event, edge });
    }
  }

  handleDoubleClick(event: MouseEvent): void {
    const edge = this.edge();
    event.stopPropagation();
    this.edgeDoubleClick.emit({ event, edge });
  }

  handleContextMenu(event: MouseEvent): void {
    const edge = this.edge();
    event.stopPropagation();
    this.edgeContextMenu.emit({ event, edge });
  }

  handleFocus(event: FocusEvent): void {
    const edge = this.edge();
    if (this.isEdgeFocusable()) {
      this.edgeFocus.emit({ event, edge });
    }
  }

  handleKeyDown(event: KeyboardEvent): void {
    const edge = this.edge();
    if (this.isEdgeFocusable()) {
      this.edgeKeyDown.emit({ event, edge });
    }
  }

  ngAfterViewInit(): void {
    // 檢查是否需要創建動態組件
    if (this.hasCustomEdgeType() && this.dynamicEdgeContainer) {
      this.createDynamicComponent();
    }
  }

  ngOnDestroy(): void {
    // 清理動態組件
    if (this.dynamicComponentRef) {
      this.dynamicComponentRef.destroy();
      this.dynamicComponentRef = undefined;
    }
  }

  private createDynamicComponent(): void {
    // 清理舊的組件
    if (this.dynamicComponentRef) {
      this.dynamicComponentRef.destroy();
    }

    const edgeComponent = this.edgeComponent();
    const inputs = this.edgeInputs();
    
    if (!edgeComponent || !this.dynamicEdgeContainer) {
      return;
    }

    // 創建組件並設置屬性
    this.dynamicComponentRef = this.viewContainerRef.createComponent(edgeComponent, {
      injector: this.edgeInjector
    });

    // 設置組件的輸入屬性 - 使用 setInput 方法來正確設置 input 信號
    Object.keys(inputs).forEach(key => {
      const value = inputs[key as keyof typeof inputs];
      if (value !== undefined && this.dynamicComponentRef) {
        try {
          this.dynamicComponentRef.setInput(key, value);
        } catch (error) {
          console.warn(`Could not set input ${key}:`, error);
        }
      }
    });

    // 手動觸發變更檢測
    this.dynamicComponentRef.changeDetectorRef.detectChanges();
    
    // 等待下一個微任務來確保 DOM 已更新
    setTimeout(() => {
      if (!this.dynamicComponentRef || !this.dynamicEdgeContainer) {
        return;
      }
      
      // 獲取組件的 DOM 元素
      const componentElement = this.dynamicComponentRef.location.nativeElement;
      
      // 清空 SVG 容器
      while (this.dynamicEdgeContainer.nativeElement.firstChild) {
        this.renderer.removeChild(
          this.dynamicEdgeContainer.nativeElement,
          this.dynamicEdgeContainer.nativeElement.firstChild
        );
      }
      
      // 如果組件有 innerHTML，使用它來創建 SVG 內容
      if (componentElement.innerHTML) {
        // 使用 innerHTML 來設置 SVG 內容，確保正確的命名空間
        this.dynamicEdgeContainer.nativeElement.innerHTML = componentElement.innerHTML;
      } else {
        // 否則將組件的子元素複製到 SVG 容器中
        const childNodes = Array.from(componentElement.childNodes) as Node[];
        childNodes.forEach((child: Node) => {
          const clonedChild = child.cloneNode(true);
          this.renderer.appendChild(this.dynamicEdgeContainer!.nativeElement, clonedChild);
        });
      }
    }, 0);
  }
}