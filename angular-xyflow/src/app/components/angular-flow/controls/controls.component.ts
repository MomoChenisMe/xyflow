import { 
  Component, 
  input, 
  output,
  inject,
  computed,
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularFlowService } from '../angular-flow.service';
import { AngularFlowPanZoomService } from '../panzoom.service';
import { PanelComponent, type PanelPosition } from '../panel/panel.component';

@Component({
  selector: 'angular-flow-controls',
  standalone: true,
  imports: [CommonModule, PanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <angular-flow-panel
      [position]="position()"
      [style]="style()"
      [className]="'xy-flow__controls angular-flow__controls ' + orientation() + ' ' + (className() || '')"
      [attr.data-testid]="'af__controls'"
      [attr.aria-label]="ariaLabel()"
    >
      <div 
        class="angular-flow__controls-inner nopan"
        (dblclick)="onDoubleClick($event)"
        (mousedown)="onMouseDown($event)"
      >
      <!-- Zoom In Button -->
      <button 
        type="button"
        class="xy-flow__controls-button angular-flow__controls-button angular-flow__controls-zoomin nopan"
        [disabled]="!canZoomIn()"
        (click)="onZoomIn($event)"
        [attr.aria-label]="'Zoom in'"
        [title]="'Zoom in'"
      >
        <svg:svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
          <svg:path d="M32 18.133H18.133V32h-4.266V18.133H0v-4.266h13.867V0h4.266v13.867H32z" fill="currentColor" />
        </svg:svg>
      </button>
      
      <!-- Zoom Out Button -->
      <button 
        type="button"
        class="xy-flow__controls-button angular-flow__controls-button angular-flow__controls-zoomout nopan"
        [disabled]="!canZoomOut()"
        (click)="onZoomOut($event)"
        [attr.aria-label]="'Zoom out'"
        [title]="'Zoom out'"
      >
        <svg:svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 5">
          <svg:path d="M0 0h32v4.2H0z" fill="currentColor" />
        </svg:svg>
      </button>
      
      <!-- Fit View Button -->
      <button 
        type="button"
        class="xy-flow__controls-button angular-flow__controls-button angular-flow__controls-fitview nopan"
        (click)="onFitView($event)"
        [attr.aria-label]="'Fit view'"
        [title]="'Fit view'"
      >
        <svg:svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 30">
          <svg:path d="M3.692 4.63c0-.53.4-.938.939-.938h5.215V0H4.708C2.13 0 0 2.054 0 4.63v5.216h3.692V4.631zM27.354 0h-5.2v3.692h5.17c.53 0 .984.4.984.939v5.215H32V4.631A4.624 4.624 0 0027.354 0zm.954 24.83c0 .532-.4.94-.939.94h-5.215v3.768h5.215c2.577 0 4.631-2.13 4.631-4.707v-5.139h-3.692v5.139zm-23.677.94c-.531 0-.939-.4-.939-.94v-5.138H0v5.139c0 2.577 2.13 4.707 4.708 4.707h5.138V25.77H4.631z" fill="currentColor" />
        </svg:svg>
      </button>
      
      <!-- Interactive Toggle Button -->
      @if (showInteractive()) {
        <button 
          type="button"
          class="xy-flow__controls-button angular-flow__controls-button angular-flow__controls-interactive nopan"
          [class.active]="!isInteractive()"
          (click)="onToggleInteractivity($event)"
          [attr.aria-label]="isInteractive() ? 'Disable interaction' : 'Enable interaction'"
          [title]="isInteractive() ? 'Disable interaction' : 'Enable interaction'"
        >
          @if (isInteractive()) {
            <!-- 交互啟用時顯示解鎖圖標 (開放的鎖) -->
            <svg:svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 32">
              <svg:path d="M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0c-4.114 1.828-1.37 2.133.305 2.438 1.676.305 4.42 2.59 4.42 5.181v3.048H3.047A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047z" fill="currentColor" />
            </svg:svg>
          } @else {
            <!-- 交互禁用時顯示鎖定圖標 (閉合的鎖) -->
            <svg:svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 32">
              <svg:path d="M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0 8 0 4.571 3.429 4.571 7.619v3.048H3.048A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047zm4.724-13.866H7.467V7.619c0-2.59 2.133-4.724 4.723-4.724 2.591 0 4.724 2.133 4.724 4.724v3.048z" fill="currentColor" />
            </svg:svg>
          }
        </button>
      }
      </div>
    </angular-flow-panel>
  `,
  styles: [`
    /* Angular 風格的 Controls，使用系統 CSS 變量支持顏色模式 */
    .angular-flow__controls {
      display: flex;
      gap: 4px;
      background: var(--xy-controls-button-background-color, var(--xy-controls-button-background-color-default));
      border: 1px solid var(--xy-controls-button-border-color, var(--xy-controls-button-border-color-default));
      border-radius: 6px;
      padding: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .angular-flow__controls.vertical {
      flex-direction: column;
    }
    
    .angular-flow__controls.horizontal {
      flex-direction: row;
    }
    
    .angular-flow__controls-inner {
      display: flex;
      gap: 4px;
      flex-direction: inherit;
      pointer-events: auto;
    }

    /* Angular 風格的按鈕，使用系統變量 */
    .angular-flow__controls-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: var(--xy-controls-button-background-color, var(--xy-controls-button-background-color-default));
      border: 1px solid var(--xy-controls-button-border-color, var(--xy-controls-button-border-color-default));
      border-radius: 4px;
      cursor: pointer;
      color: var(--xy-controls-button-color, var(--xy-controls-button-color-default));
      font-size: 14px;
      transition: all 0.2s;
      pointer-events: auto;
      user-select: none;
    }

    .angular-flow__controls-button:hover:not(:disabled) {
      background: var(--xy-controls-button-background-color-hover, var(--xy-controls-button-background-color-hover-default));
      color: var(--xy-controls-button-color-hover, var(--xy-controls-button-color-hover-default));
      border-color: var(--xy-controls-button-border-color, var(--xy-controls-button-border-color-default));
    }

    .angular-flow__controls-button:active:not(:disabled) {
      transform: scale(0.95);
    }

    .angular-flow__controls-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .angular-flow__controls-button.active {
      background: #ff0072 !important;
      border-color: #ff0072 !important;
      color: #fff !important;
    }

    .angular-flow__controls-button.active:hover {
      background: #e6006a !important;
      border-color: #e6006a !important;
    }

    .angular-flow__controls-button svg {
      width: 16px;
      height: 16px;
    }
  `]
})
export class ControlsComponent {
  // 注入服務
  private _flowService = inject(AngularFlowService);
  private panZoomService = inject(AngularFlowPanZoomService);
  
  // 輸入屬性
  readonly showZoom = input<boolean>(true);
  readonly showFitView = input<boolean>(true);
  readonly showInteractive = input<boolean>(true);
  readonly fitViewOptions = input<any>();
  readonly position = input<PanelPosition>('bottom-left');
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');
  readonly style = input<Record<string, any>>({});
  readonly className = input<string>('');
  readonly ariaLabel = input<string>('Controls');
  
  // 輸出事件
  readonly onZoomInClick = output<void>();
  readonly onZoomOutClick = output<void>();
  readonly onFitViewClick = output<void>();
  readonly onInteractiveChange = output<boolean>();
  
  // 內部狀態 - 從服務獲取

  // 計算屬性
  readonly canZoomIn = computed(() => {
    const viewport = this._flowService.viewport();
    const maxZoom = this._flowService.maxZoom();
    return viewport.zoom < maxZoom;
  });

  readonly canZoomOut = computed(() => {
    const viewport = this._flowService.viewport();
    const minZoom = this._flowService.minZoom();
    return viewport.zoom > minZoom;
  });

  readonly isInteractive = computed(() => {
    return this._flowService.isInteractive();
  });

  // 事件處理方法
  // 捕獲並阻止雙擊事件，防止觸發 angular-flow 的雙擊縮放
  onDoubleClick(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
  }

  // 捕獲並阻止 mousedown 事件，防止觸發拖動
  onMouseDown(event: MouseEvent) {
    // 只阻止傳播，不阻止默認行為（以保留按鈕點擊功能）
    event.stopPropagation();
  }

  onZoomIn(event: MouseEvent) {
    // 阻止事件冒泡，防止觸發 angular-flow 的 double click
    event.stopPropagation();
    
    if (!this.canZoomIn()) return;
    
    this.panZoomService.zoomIn();
    this.onZoomInClick.emit();
  }

  onZoomOut(event: MouseEvent) {
    // 阻止事件冒泡，防止觸發 angular-flow 的 double click
    event.stopPropagation();
    
    if (!this.canZoomOut()) return;
    
    this.panZoomService.zoomOut();
    this.onZoomOutClick.emit();
  }

  async onFitView(event: MouseEvent) {
    // 阻止事件冒泡，防止觸發 angular-flow 的 double click
    event.stopPropagation();
    
    const options = this.fitViewOptions();
    try {
      await this.panZoomService.fitView(options);
      this.onFitViewClick.emit();
    } catch (error) {
      console.error('FitView failed:', error);
    }
  }

  onToggleInteractivity(event: MouseEvent) {
    // 阻止事件冒泡，防止觸發 angular-flow 的 double click
    event.stopPropagation();
    
    const currentState = this.isInteractive();
    const newValue = !currentState;
    
    
    // 只更新 Node/Edge 交互性狀態，不影響 viewport 交互
    this._flowService.setInteractivity(newValue);
    
    // ✅ 不修改 PanZoom 設置，保留 viewport 交互功能
    // viewport 的 panOnDrag, zoomOnScroll 等應該始終保持啟用
    
    this.onInteractiveChange.emit(newValue);
  }

}