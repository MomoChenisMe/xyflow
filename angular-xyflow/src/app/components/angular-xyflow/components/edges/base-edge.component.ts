import {
  Component,
  input,
  computed,
  output,
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { isNumeric } from '@xyflow/system';
import { EdgeTextComponent } from './edge-text.component';
import { EdgeEventDirective } from '../../directives/edge-event.directive';
import { AngularXYFlowService } from '../../services/angular-xyflow.service';

export interface BaseEdgeProps {
  path: string;
  labelX?: number;
  labelY?: number;
  label?: string | number;
  labelStyle?: Record<string, any>;
  labelShowBg?: boolean;
  labelBgStyle?: Record<string, any>;
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;
  interactionWidth?: number;
  className?: string;
  style?: Record<string, any>;
  markerEnd?: string | any;
  markerStart?: string | any;
  id?: string;
}

/**
 * BaseEdge 組件用於所有邊的內部實現。它可以在自定義邊中使用，
 * 並為您處理不可見的輔助邊和邊標籤。
 *
 * @example
 * ```typescript
 * import { BaseEdgeComponent } from './components/edges/base-edge/base-edge.component';
 * import { getStraightPath } from '@xyflow/system';
 *
 * @Component({
 *   template: `
 *     <svg:g angular-xyflow-base-edge
 *       [path]="edgePath()"
 *       [labelX]="labelX()"
 *       [labelY]="labelY()"
 *       [label]="label"
 *       [style]="style" />
 *   `
 * })
 * export class CustomEdgeComponent {
 *   // 計算路徑邏輯
 * }
 * ```
 */
@Component({
  selector: 'svg:g[angular-xyflow-base-edge]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, EdgeTextComponent],
  hostDirectives: [
    {
      directive: EdgeEventDirective,
      inputs: ['selectable']
    }
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <!-- 主要邊路徑 -->
    <svg:path
      [attr.id]="id()"
      [attr.d]="path()"
      fill="none"
      [class]="edgePathClasses()"
      [attr.style]="styleString()"
      [attr.marker-end]="markerEnd()"
      [attr.marker-start]="markerStart()"
      [attr.pathLength]="pathLength()"
    />

    <!-- 互動區域（不可見但可互動） -->
    @if (interactionWidth()) {
    <svg:path
      [attr.d]="path()"
      fill="none"
      stroke="transparent"
      [attr.stroke-width]="interactionWidth()"
      class="angular-xyflow__edge-interaction"
      [style.pointer-events]="'stroke'"
    />
    }

    <!-- 邊標籤 -->
    @if (shouldShowLabel()) {
    <svg:g
      angular-xyflow-edge-text
      [x]="labelX()!"
      [y]="labelY()!"
      [label]="label()!"
      [labelStyle]="labelStyle()"
      [labelShowBg]="labelShowBg() !== false"
      [labelBgStyle]="labelBgStyle()"
      [labelBgPadding]="labelBgPadding() || [2, 4]"
      [labelBgBorderRadius]="labelBgBorderRadius() || 2"
    />
    }
  `,
})
export class BaseEdgeComponent {
  // 輸入屬性
  path = input.required<string>();
  labelX = input<number>();
  labelY = input<number>();
  label = input<string | number>();
  labelStyle = input<Record<string, any>>();
  labelShowBg = input<boolean>();
  labelBgStyle = input<Record<string, any>>();
  labelBgPadding = input<[number, number]>();
  labelBgBorderRadius = input<number>();
  interactionWidth = input<number>(20);
  className = input<string>();
  style = input<Record<string, any>>();
  markerEnd = input<string | any>();
  markerStart = input<string | any>();
  id = input<string>();
  pathLength = input<number>();
  selectable = input<boolean>(true);
  selected = input<boolean>(false);
  animated = input<boolean>(false);

  // 輸出事件（現在由 EdgeEventDirective 處理）
  edgeClick = output<MouseEvent>();
  edgeDoubleClick = output<MouseEvent>();
  edgeContextMenu = output<MouseEvent>();
  edgeMouseEnter = output<MouseEvent>();
  edgeMouseLeave = output<MouseEvent>();
  edgeMouseMove = output<MouseEvent>();

  // 注入服務
  private readonly flowService = inject(AngularXYFlowService);

  // 🔑 關鍵修正：添加與 React Flow 完全一致的 isSelectable 計算
  isEdgeSelectable = computed(() => {
    const selectable = this.selectable();
    const elementsSelectable = this.flowService.elementsSelectable();
    
    // React Flow 邏輯：edge.selectable || (elementsSelectable && typeof edge.selectable === 'undefined')
    if (selectable !== undefined) {
      return selectable;
    }
    
    return elementsSelectable;
  });

  // 計算屬性
  edgePathClasses = computed(() => {
    const baseClasses = ['angular-xyflow__edge-path'];
    const customClass = this.className();
    const selected = this.selected();
    const animated = this.animated();
    const isSelectable = this.isEdgeSelectable();
    
    if (customClass) {
      baseClasses.push(customClass);
    }
    if (selected) {
      baseClasses.push('selected');
    }
    if (animated) {
      baseClasses.push('animated');
    }
    
    // 🔑 關鍵修正：添加 inactive class 邏輯（與 React Flow 一致）
    if (!isSelectable) {
      baseClasses.push('inactive');
    }
    
    return baseClasses.join(' ');
  });

  shouldShowLabel = computed(() => {
    const label = this.label();
    const labelX = this.labelX();
    const labelY = this.labelY();
    return label && isNumeric(labelX) && isNumeric(labelY);
  });

  // 將樣式對象轉換為 CSS 字符串，處理選中狀態
  styleString = computed(() => {
    const selected = this.selected();
    const customStyle = this.style();
    
    // 🔑 關鍵修正：讓 CSS 類優先處理選中狀態，只在有自定義樣式時才應用內聯樣式
    if (!customStyle || Object.keys(customStyle).length === 0) {
      // 沒有自定義樣式時返回 undefined，讓 CSS 類完全控制樣式
      return undefined;
    }
    
    // 默認樣式（與 React 版本保持一致）
    const defaultStyle: Record<string, any> = {};
    
    // 🔧 移除內聯的選中狀態樣式，讓 CSS 類處理
    // 這樣可以避免內聯樣式覆蓋 CSS 類
    
    // 合併自定義樣式
    const finalStyle = { ...defaultStyle, ...customStyle };

    return Object.entries(finalStyle)
      .map(
        ([key, value]) =>
          `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`
      )
      .join('; ');
  });

}
