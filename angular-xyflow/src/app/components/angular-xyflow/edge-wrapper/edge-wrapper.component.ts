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
} from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { Position } from '@xyflow/system';
import { AngularEdge, EdgeTypes, EdgeMarker, MarkerType } from '../types';
import { errorMessages, defaultErrorHandler, ErrorCode } from '../constants';
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
    NgComponentOutlet,
    BezierEdgeComponent,
    StraightEdgeComponent,
    StepEdgeComponent,
    SmoothStepEdgeComponent,
    SimpleBezierEdgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: {
    class: 'angular-xyflow__edge xy-flow__edge',
    '[class.selected]': 'edge().selected',
    '[class.animated]': 'edge().animated',
    '[class.selectable]': 'edge().selectable !== false',
    '[style.position]': '"absolute"',
    '[style.z-index]': 'edge().zIndex || 0',
    '[style.pointer-events]': '"none"',
  },
  template: `
    <!-- 動態載入邊組件 (svg) -->
    @if (edgeComponent()) {
      <ng-container
        [ngComponentOutlet]="edgeComponent()"
        [ngComponentOutletInputs]="edgeComponentInputs()"
        [ngComponentOutletInjector]="edgeInjector"
      />
    }
  `,
})
export class EdgeWrapperComponent<EdgeType extends AngularEdge = AngularEdge> {
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
  getMarkerId =
    input.required<
      (edge: any, position: 'start' | 'end', marker: EdgeMarker) => string
    >();

  // 輸出事件
  edgeClick = output<{ event: MouseEvent; edge: EdgeType }>();
  edgeDoubleClick = output<{ event: MouseEvent; edge: EdgeType }>();
  edgeContextMenu = output<{ event: MouseEvent; edge: EdgeType }>();
  edgeFocus = output<{ event: FocusEvent; edge: EdgeType }>();
  edgeKeyDown = output<{ event: KeyboardEvent; edge: EdgeType }>();

  // 錯誤處理事件（與 React Flow 保持一致）
  onError = output<{ code: string; message: string }>();

  // 注入器
  protected readonly edgeInjector = inject(Injector);

  // 錯誤處理器
  private readonly errorHandler = (code: ErrorCode, message: string) => {
    // 發出錯誤事件
    this.onError.emit({ code, message });
    // 同時使用預設處理器輸出到 console
    defaultErrorHandler(code, message);
  };

  // 內建邊類型（類似 React Flow 的 builtinEdgeTypes）
  private readonly builtinEdgeTypes: Record<string, Type<any>> = {
    default: BezierEdgeComponent, // 預設使用 BezierEdge，與 React Flow 一致
    bezier: BezierEdgeComponent, // 標準貝茲曲線
    straight: StraightEdgeComponent, // 直線邊
    step: StepEdgeComponent, // 階梯邊（無圓角）
    smoothstep: SmoothStepEdgeComponent, // 平滑階梯邊（有圓角）
    simplebezier: SimpleBezierEdgeComponent, // 簡單貝茲曲線
  };

  // 獲取解析後的邊類型
  readonly resolvedEdgeType = computed(() => {
    const edge = this.edge();
    let edgeType = edge.type || 'default';
    const userEdgeTypes = this.edgeTypes();

    // 類型檢查邏輯：
    // 1. 首先查找用戶定義的 edgeTypes
    // 2. 如果沒有找到，查找內建類型
    // 3. 如果類型不存在，回退到 default
    const EdgeComponent =
      userEdgeTypes?.[edgeType] || this.builtinEdgeTypes[edgeType];

    if (EdgeComponent === undefined) {
      // 錯誤處理：類型未找到，回退到 default
      this.errorHandler('error011', errorMessages.error011(edgeType));
      edgeType = 'default';
    }

    return edgeType;
  });

  // 動態邊組件選擇
  readonly edgeComponent = computed(() => {
    const resolvedType = this.resolvedEdgeType();
    const userEdgeTypes = this.edgeTypes();

    // 使用解析後的類型獲取組件
    let EdgeComponent =
      userEdgeTypes?.[resolvedType] || this.builtinEdgeTypes[resolvedType];

    // 如果解析後的類型仍然找不到組件（極少見情況），使用預設的 bezier
    if (EdgeComponent === undefined) {
      EdgeComponent = this.builtinEdgeTypes['default'];
    }

    return EdgeComponent;
  });

  // 準備傳遞給邊緣組件的輸入屬性
  readonly edgeComponentInputs = computed(() => {
    const edge = this.edge();
    const resolvedEdgeType = this.resolvedEdgeType();

    // 核心屬性（所有邊緣組件都需要）
    const coreInputs: Record<string, any> = {
      id: edge.id,
      sourceX: this.sourceX(),
      sourceY: this.sourceY(),
      targetX: this.targetX(),
      targetY: this.targetY(),
    };

    // 可選的共同屬性
    // 只有當邊緣有定義這些屬性時才添加
    if (edge.data !== undefined) coreInputs['data'] = edge.data;
    if (resolvedEdgeType) coreInputs['type'] = resolvedEdgeType;
    if (edge.selected !== undefined) coreInputs['selected'] = edge.selected;
    if (this.sourceHandleId() !== undefined)
      coreInputs['sourceHandleId'] = this.sourceHandleId();
    if (this.targetHandleId() !== undefined)
      coreInputs['targetHandleId'] = this.targetHandleId();

    // 標籤相關屬性（只有內建邊組件支援）
    // 自定義邊組件需要自己處理標籤
    const isBuiltinEdge = !!this.builtinEdgeTypes[resolvedEdgeType];
    if (isBuiltinEdge) {
      if (edge.label !== undefined) coreInputs['label'] = edge.label;
      if (edge.labelStyle !== undefined)
        coreInputs['labelStyle'] = edge.labelStyle;
      if (edge.labelShowBg !== undefined)
        coreInputs['labelShowBg'] = edge.labelShowBg;
      if (edge.labelBgStyle !== undefined)
        coreInputs['labelBgStyle'] = edge.labelBgStyle;
      if (edge.labelBgPadding !== undefined)
        coreInputs['labelBgPadding'] = edge.labelBgPadding;
      if (edge.labelBgBorderRadius !== undefined)
        coreInputs['labelBgBorderRadius'] = edge.labelBgBorderRadius;
    }

    // Marker 處理
    if (edge.markerStart) {
      const markerId = this.getMarkerId()(
        edge,
        'start',
        typeof edge.markerStart === 'string'
          ? { type: MarkerType.ArrowClosed }
          : edge.markerStart
      );
      // SVG marker 需要 url(#id) 格式
      coreInputs['markerStart'] = markerId ? `url(#${markerId})` : undefined;
    }
    if (edge.markerEnd) {
      const markerId = this.getMarkerId()(
        edge,
        'end',
        typeof edge.markerEnd === 'string'
          ? { type: MarkerType.ArrowClosed }
          : edge.markerEnd
      );
      // SVG marker 需要 url(#id) 格式
      coreInputs['markerEnd'] = markerId ? `url(#${markerId})` : undefined;
    }

    // 樣式和行為屬性
    if (edge.style !== undefined) coreInputs['style'] = edge.style;
    if (edge.animated !== undefined) coreInputs['animated'] = edge.animated;
    if (edge.hidden !== undefined) coreInputs['hidden'] = edge.hidden;
    if (edge.deletable !== undefined) coreInputs['deletable'] = edge.deletable;
    if (edge.selectable !== undefined)
      coreInputs['selectable'] = edge.selectable;

    // 互動寬度
    coreInputs['interactionWidth'] = edge.interactionWidth || 20;

    // Position 屬性（大部分邊類型需要，StraightEdge 除外）
    // 但由於組件定義為可選，可以安全傳遞
    coreInputs['sourcePosition'] = this.sourcePosition();
    coreInputs['targetPosition'] = this.targetPosition();

    // 自定義邊可能需要的額外屬性
    // 傳遞 source 和 target ID（某些自定義邊可能需要）
    if (!isBuiltinEdge) {
      coreInputs['source'] = edge.source;
      coreInputs['target'] = edge.target;
    }

    // 為 BaseEdge 傳遞 selectable 屬性
    coreInputs['selectable'] = edge.selectable !== false;

    return coreInputs;
  });

  // 計算邊是否可聚焦
  readonly isEdgeFocusable = computed(() => {
    const edge = this.edge();
    // 根據 React Flow 邏輯：edge.focusable || (edgesFocusable && typeof edge.focusable === 'undefined')
    // 這裡簡化為檢查邊自身的 focusable 屬性
    return edge.focusable !== false;
  });
}
