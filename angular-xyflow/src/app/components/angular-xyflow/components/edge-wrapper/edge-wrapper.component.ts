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
import { AngularEdge, EdgeTypes, EdgeMarker, MarkerType } from '../../types';
import { errorMessages, defaultErrorHandler, ErrorCode } from '../../constants';
import { AngularXYFlowService } from '../../services/angular-xyflow.service';
import { BezierEdgeComponent } from '../edges/bezier-edge.component';
import { StraightEdgeComponent } from '../edges/straight-edge.component';
import { StepEdgeComponent } from '../edges/step-edge.component';
import { SmoothStepEdgeComponent } from '../edges/smooth-step-edge.component';
import { SimpleBezierEdgeComponent } from '../edges/simple-bezier-edge.component';

@Component({
  selector: 'angular-xyflow-edge-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    NgComponentOutlet,
    // 內建邊組件通過動態載入，不需要在 imports 中列出
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: {
    class: 'angular-xyflow__edge xy-flow__edge',
    '[class.selected]': 'edge().selected',
    '[class.animated]': 'edge().animated',
    '[class.selectable]': 'isSelectable()',
    '[class.inactive]': '!isSelectable() && !hasOnClick()',
    '[style.position]': '"absolute"',
    '[style.z-index]': 'edge().zIndex || 0',
    '[style.pointer-events]': 'getPointerEvents()',
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

  // 注入器和服務
  protected readonly edgeInjector = inject(Injector);
  private readonly flowService = inject(AngularXYFlowService);

  // 錯誤處理器
  private readonly errorHandler = (code: ErrorCode, message: string) => {
    // 發出錯誤事件
    this.onError.emit({ code, message });
    // 同時使用預設處理器輸出到 console
    defaultErrorHandler(code, message);
  };

  // 🔑 關鍵修正：添加與 React Flow 完全一致的 isSelectable 計算
  // React Flow 邏輯：edge.selectable || (elementsSelectable && typeof edge.selectable === 'undefined')
  public isSelectable = computed(() => {
    const edge = this.edge();
    const elementsSelectable = this.flowService.elementsSelectable();
    
    // 如果 edge 有明確的 selectable 屬性，使用它
    if (edge.selectable !== undefined) {
      return edge.selectable;
    }
    
    // 否則使用 elementsSelectable（與 React Flow 邏輯完全一致）
    return elementsSelectable;
  });

  // 檢查是否有 onClick 事件
  public hasOnClick = computed(() => {
    // 在 Angular 中，我們檢查是否有事件監聽器
    // 簡化實作：如果 edge 是 selectable，我們假設可能有 click 事件
    // 這個邏輯可以根據實際需求進一步細化
    return this.isSelectable();
  });

  // 根據 React Flow 邏輯設定 pointer-events
  public getPointerEvents = computed(() => {
    const isSelectable = this.isSelectable();
    const hasOnClick = this.hasOnClick();
    
    // React Flow 邏輯：inactive edge 設定 pointer-events: none
    if (!isSelectable && !hasOnClick) {
      return 'none';
    }
    
    return 'all';
  });

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
  resolvedEdgeType = computed(() => {
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
  edgeComponent = computed(() => {
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
  private lastComputedEdgeId: string | null = null;
  edgeComponentInputs = computed(() => {
    const edge = this.edge();
    const resolvedEdgeType = this.resolvedEdgeType();
    
    // 只在 edge id 改變時輸出，避免重複
    if (this.lastComputedEdgeId !== edge.id) {
      this.lastComputedEdgeId = edge.id;
    }
    

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
    // 🔑 關鍵修正：總是傳遞 selected 屬性，預設為 false
    coreInputs['selected'] = edge.selected ?? false;
    
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
    // 🔑 關鍵修正：總是傳遞 animated 屬性，預設為 false
    coreInputs['animated'] = edge.animated ?? false;
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
      
      // 🔑 關鍵修正：為自定義邊傳遞完整的節點數據
      // 這對於 FloatingEdge 等需要節點位置和尺寸信息的邊線至關重要
      const sourceNode = this.flowService.nodeLookup().get(edge.source);
      const targetNode = this.flowService.nodeLookup().get(edge.target);
      
      if (sourceNode) {
        const sourceInternals = this.flowService.getNodeInternals(edge.source);
        coreInputs['sourceNode'] = {
          ...sourceNode,
          positionAbsolute: sourceInternals?.positionAbsolute || sourceNode.position,
          measured: sourceInternals?.measured || { width: 100, height: 40 }
        };
      }
      
      if (targetNode) {
        const targetInternals = this.flowService.getNodeInternals(edge.target);
        coreInputs['targetNode'] = {
          ...targetNode,
          positionAbsolute: targetInternals?.positionAbsolute || targetNode.position,
          measured: targetInternals?.measured || { width: 100, height: 40 }
        };
      }
    }

    // 為 BaseEdge 傳遞 selectable 屬性
    coreInputs['selectable'] = edge.selectable !== false;

    return coreInputs;
  });

  // 計算邊是否可聚焦
  isEdgeFocusable = computed(() => {
    const edge = this.edge();
    // 根據 React Flow 邏輯：edge.focusable || (edgesFocusable && typeof edge.focusable === 'undefined')
    // 這裡簡化為檢查邊自身的 focusable 屬性
    return edge.focusable !== false;
  });
}
