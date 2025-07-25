import { Component, computed, ChangeDetectionStrategy, input, output, viewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Panel } from './panel.component';
import { ControlButton } from './control-button.component';
import { PlusIcon, MinusIcon, FitViewIcon, LockIcon, UnlockIcon } from './icons.component';
import { ControlProps, PanelPosition, FitViewOptions, AriaLabelConfig } from './controls.types';

// 默認的無障礙標籤配置
const defaultAriaLabelConfig: Required<AriaLabelConfig> = {
  'controls.ariaLabel': 'React Flow controls',
  'controls.zoomIn.ariaLabel': 'zoom in',
  'controls.zoomOut.ariaLabel': 'zoom out',
  'controls.fitView.ariaLabel': 'fit view',
  'controls.interactive.ariaLabel': 'toggle interactivity'
};

/**
 * Controls 組件 - 提供縮放、適應視圖和鎖定互動性的控制面板
 * 
 * 這個組件使用最新的 Angular Signal API 實現，提供便利的控制按鈕來縮放、
 * 適應視圖和鎖定視圖窗口。支持水平和垂直佈局，可以自定義樣式和無障礙標籤。
 * 
 * @component
 * @selector xy-controls
 * @example
 * ```html
 * <xy-flow [nodes]="nodes" [edges]="edges">
 *   <xy-controls 
 *     [showZoom]="true"
 *     [showFitView]="true"
 *     [showInteractive]="true"
 *     orientation="vertical"
 *     (onZoomIn)="handleZoomIn()"
 *     (onZoomOut)="handleZoomOut()">
 *   </xy-controls>
 * </xy-flow>
 * ```
 * 
 * @remarks 要擴展或自定義控制項，可以使用 `<xy-control-button />` 組件
 */
@Component({
  selector: 'xy-controls',
  standalone: true,
  imports: [
    CommonModule, 
    Panel, 
    ControlButton, 
    PlusIcon, 
    MinusIcon, 
    FitViewIcon, 
    LockIcon, 
    UnlockIcon
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <xy-panel
      #panelElement
      [className]="panelClass()"
      [position]="position()"
      [style]="style()"
      testId="rf__controls"
      [ariaLabel]="effectiveAriaLabel()"
    >
      @if (showZoom()) {
        <xy-control-button
          (onClick)="handleZoomIn()"
          className="react-flow__controls-zoomin"
          [title]="ariaLabels()['controls.zoomIn.ariaLabel']"
          [ariaLabel]="ariaLabels()['controls.zoomIn.ariaLabel']"
          [disabled]="maxZoomReached()"
        >
          <plus-icon />
        </xy-control-button>
        <xy-control-button
          (onClick)="handleZoomOut()"
          className="react-flow__controls-zoomout"
          [title]="ariaLabels()['controls.zoomOut.ariaLabel']"
          [ariaLabel]="ariaLabels()['controls.zoomOut.ariaLabel']"
          [disabled]="minZoomReached()"
        >
          <minus-icon />
        </xy-control-button>
      }
      @if (showFitView()) {
        <xy-control-button
          className="react-flow__controls-fitview"
          (onClick)="handleFitView()"
          [title]="ariaLabels()['controls.fitView.ariaLabel']"
          [ariaLabel]="ariaLabels()['controls.fitView.ariaLabel']"
        >
          <fit-view-icon />
        </xy-control-button>
      }
      @if (showInteractive()) {
        <xy-control-button
          className="react-flow__controls-interactive"
          (onClick)="handleToggleInteractivity()"
          [title]="ariaLabels()['controls.interactive.ariaLabel']"
          [ariaLabel]="ariaLabels()['controls.interactive.ariaLabel']"
        >
          @if (isInteractive()) {
            <unlock-icon />
          } @else {
            <lock-icon />
          }
        </xy-control-button>
      }
      <ng-content></ng-content>
    </xy-panel>
  `,
  styleUrls: ['./controls.styles.css'],
  styles: [`
    .xy-flow__controls {
      box-shadow: var(--xy-controls-box-shadow, var(--xy-controls-box-shadow-default));
      border: var(--xy-controls-border, var(--xy-controls-border-default));
      border-radius: var(--xy-controls-border-radius, var(--xy-controls-border-radius-default));
      background: var(--xy-controls-button-background-color, var(--xy-controls-button-background-color-default));
      display: flex;
      font-size: 12px;
      font-weight: 600;
      overflow: hidden;
      min-width: 26px;
      
      &.horizontal {
        flex-direction: row;
      }
      
      &.vertical {
        flex-direction: column;
      }
    }
  `]
})
export class ControlsComponent {
  /** 是否顯示縮放控制按鈕 */
  showZoom = input<boolean>(true);
  
  /** 是否顯示適應視圖按鈕 */
  showFitView = input<boolean>(true);
  
  /** 是否顯示互動性切換按鈕 */
  showInteractive = input<boolean>(true);
  
  /** 適應視圖選項 */
  fitViewOptions = input<FitViewOptions | undefined>();
  
  /** 面板位置 */
  position = input<PanelPosition>(PanelPosition.BottomLeft);
  
  /** CSS 類名 */
  className = input<string | undefined>();
  
  /** 內聯樣式 */
  style = input<{ [key: string]: any } | undefined>();
  
  /** 佈局方向 - 水平或垂直 */
  orientation = input<'horizontal' | 'vertical'>('vertical');
  
  /** 自定義 ARIA 標籤 */
  ariaLabel = input<string | undefined>();

  /** 互動性狀態 - 這些需要從 Angular Flow 服務獲取 */
  isInteractive = input<boolean>(true);
  
  /** 是否達到最小縮放比例 */
  minZoomReached = input<boolean>(false);
  
  /** 是否達到最大縮放比例 */
  maxZoomReached = input<boolean>(false);
  
  /** 無障礙標籤配置 */
  ariaLabelConfig = input<Partial<AriaLabelConfig>>({});

  /** 縮放放大事件 */
  onZoomIn = output<void>();
  
  /** 縮放縮小事件 */
  onZoomOut = output<void>();
  
  /** 適應視圖事件 */
  onFitView = output<void>();
  
  /** 互動性切換事件 */
  onInteractiveChange = output<boolean>();
  
  /** 面板元素引用 */
  panelElement = viewChild<ElementRef<HTMLDivElement>>('panelElement');

  /** 計算屬性 - 無障礙標籤配置 */
  ariaLabels = computed(() => ({
    ...defaultAriaLabelConfig,
    ...this.ariaLabelConfig()
  }));

  /** 計算屬性 - 有效的 ARIA 標籤 */
  effectiveAriaLabel = computed(() => 
    this.ariaLabel() ?? this.ariaLabels()['controls.ariaLabel']
  );

  /** 計算屬性 - 面板 CSS 類名 */
  panelClass = computed(() => {
    const classes = ['react-flow__controls'];
    
    if (this.orientation() === 'horizontal') {
      classes.push('horizontal');
    } else {
      classes.push('vertical');
    }
    
    const className = this.className();
    if (className) {
      classes.push(className);
    }
    
    return classes.join(' ');
  });

  /**
   * 處理縮放放大事件
   */
  handleZoomIn(): void {
    // 這裡需要調用 Angular Flow 服務的 zoomIn 方法
    // 暫時只發出事件
    this.onZoomIn.emit();
  }

  /**
   * 處理縮放縮小事件
   */
  handleZoomOut(): void {
    // 這裡需要調用 Angular Flow 服務的 zoomOut 方法
    // 暫時只發出事件
    this.onZoomOut.emit();
  }

  /**
   * 處理適應視圖事件
   */
  handleFitView(): void {
    // 這裡需要調用 Angular Flow 服務的 fitView 方法
    // 暫時只發出事件
    this.onFitView.emit();
  }

  /**
   * 處理切換互動性事件
   */
  handleToggleInteractivity(): void {
    // 這裡需要調用 Angular Flow 服務來切換互動性
    // 暫時只發出事件
    this.onInteractiveChange.emit(!this.isInteractive());
  }
}