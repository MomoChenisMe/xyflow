import { 
  Component, 
  input, 
  output,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularFlowService } from '../angular-flow.service';
import { AngularFlowPanZoomService } from '../panzoom.service';

@Component({
  selector: 'angular-flow-controls',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div 
      class="angular-flow__controls nopan"
      [style.position]="'absolute'"
      [style.bottom]="'10px'"
      [style.left]="'10px'"
      [style.z-index]="'5'"
      [style.display]="'flex'"
      [style.flex-direction]="'column'"
      [style.gap]="'4px'"
      [style.pointer-events]="'auto'"
      (dblclick)="onDoubleClick($event)"
      (mousedown)="onMouseDown($event)"
    >
      <!-- Zoom In Button -->
      <button 
        type="button"
        class="angular-flow__controls-button angular-flow__controls-zoomin nopan"
        [disabled]="!canZoomIn()"
        (click)="onZoomIn($event)"
        [attr.aria-label]="'Zoom in'"
        [title]="'Zoom in'"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
          <line x1="8" y1="11" x2="14" y2="11"></line>
          <line x1="11" y1="8" x2="11" y2="14"></line>
        </svg>
      </button>
      
      <!-- Zoom Out Button -->
      <button 
        type="button"
        class="angular-flow__controls-button angular-flow__controls-zoomout nopan"
        [disabled]="!canZoomOut()"
        (click)="onZoomOut($event)"
        [attr.aria-label]="'Zoom out'"
        [title]="'Zoom out'"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      </button>
      
      <!-- Fit View Button -->
      <button 
        type="button"
        class="angular-flow__controls-button angular-flow__controls-fitview nopan"
        (click)="onFitView($event)"
        [attr.aria-label]="'Fit view'"
        [title]="'Fit view'"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
        </svg>
      </button>
      
      <!-- Interactive Toggle Button -->
      @if (showInteractive()) {
        <button 
          type="button"
          class="angular-flow__controls-button angular-flow__controls-interactive nopan"
          [class.active]="!isInteractive()"
          (click)="onToggleInteractivity($event)"
          [attr.aria-label]="isInteractive() ? 'Disable interaction' : 'Enable interaction'"
          [title]="isInteractive() ? 'Disable interaction' : 'Enable interaction'"
        >
          @if (isInteractive()) {
            <!-- 交互啟用時顯示解鎖圖標 (開放的鎖) -->
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <circle cx="12" cy="16" r="1"></circle>
              <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
            </svg>
          } @else {
            <!-- 交互禁用時顯示鎖定圖標 (閉合的鎖) -->
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <circle cx="12" cy="16" r="1"></circle>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          }
        </button>
      }
    </div>
  `,
  styles: [`
    .angular-flow__controls {
      position: absolute;
      bottom: 10px;
      left: 10px;
      z-index: 5;
      display: flex;
      flex-direction: column;
      gap: 4px;
      pointer-events: auto;
    }

    .angular-flow__controls-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      color: #222;
      font-size: 14px;
      transition: all 0.2s;
      pointer-events: auto;
      user-select: none;
    }

    .angular-flow__controls-button:hover:not(:disabled) {
      background: #f5f5f5;
      border-color: #ccc;
    }

    .angular-flow__controls-button:active:not(:disabled) {
      background: #eee;
      transform: scale(0.95);
    }

    .angular-flow__controls-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .angular-flow__controls-button.active {
      background: #ff0072;
      border-color: #ff0072;
      color: #fff;
    }

    .angular-flow__controls-button.active:hover {
      background: #e6006a;
      border-color: #e6006a;
    }

    .angular-flow__controls-button svg {
      width: 16px;
      height: 16px;
    }
  `]
})
export class ControlsComponent {
  // 注入服務
  private flowService = inject(AngularFlowService);
  private panZoomService = inject(AngularFlowPanZoomService);
  
  // 輸入屬性
  readonly showZoom = input<boolean>(true);
  readonly showFitView = input<boolean>(true);
  readonly showInteractive = input<boolean>(true);
  readonly fitViewOptions = input<any>();
  
  // 輸出事件
  readonly onZoomInClick = output<void>();
  readonly onZoomOutClick = output<void>();
  readonly onFitViewClick = output<void>();
  readonly onInteractiveChange = output<boolean>();
  
  // 內部狀態 - 從服務獲取

  // 計算屬性
  readonly canZoomIn = computed(() => {
    const viewport = this.flowService.viewport();
    const maxZoom = this.flowService.maxZoom();
    return viewport.zoom < maxZoom;
  });

  readonly canZoomOut = computed(() => {
    const viewport = this.flowService.viewport();
    const minZoom = this.flowService.minZoom();
    return viewport.zoom > minZoom;
  });

  readonly isInteractive = computed(() => {
    return this.flowService.isInteractive();
  });

  // 事件處理方法
  // 捕獲並阻止雙擊事件，防止觸發 angular-flow 的雙擊縮放
  onDoubleClick(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    console.log('🚫 Controls 已阻止雙擊事件傳播');
  }

  // 捕獲並阻止 mousedown 事件，防止觸發拖動
  onMouseDown(event: MouseEvent) {
    // 只阻止傳播，不阻止默認行為（以保留按鈕點擊功能）
    event.stopPropagation();
    console.log('🚫 Controls 已阻止 mousedown 事件傳播');
  }

  onZoomIn(event: MouseEvent) {
    // 阻止事件冒泡，防止觸發 angular-flow 的 double click
    event.stopPropagation();
    
    if (!this.canZoomIn()) return;
    
    console.log('🔍 Controls ZoomIn 點擊（已阻止事件冒泡）');
    this.panZoomService.zoomIn();
    this.onZoomInClick.emit();
  }

  onZoomOut(event: MouseEvent) {
    // 阻止事件冒泡，防止觸發 angular-flow 的 double click
    event.stopPropagation();
    
    if (!this.canZoomOut()) return;
    
    console.log('🔍 Controls ZoomOut 點擊（已阻止事件冒泡）');
    this.panZoomService.zoomOut();
    this.onZoomOutClick.emit();
  }

  onFitView(event: MouseEvent) {
    // 阻止事件冒泡，防止觸發 angular-flow 的 double click
    event.stopPropagation();
    
    console.log('🎯 Controls FitView 點擊（已阻止事件冒泡）');
    const options = this.fitViewOptions();
    this.panZoomService.fitView(options);
    this.onFitViewClick.emit();
  }

  onToggleInteractivity(event: MouseEvent) {
    // 阻止事件冒泡，防止觸發 angular-flow 的 double click
    event.stopPropagation();
    
    const currentState = this.isInteractive();
    const newValue = !currentState;
    
    console.log('🔧 Controls Interactivity 切換（已阻止事件冒泡）:', newValue);
    
    // 只更新 Node/Edge 交互性狀態，不影響 viewport 交互
    this.flowService.setInteractivity(newValue);
    
    // ✅ 不修改 PanZoom 設置，保留 viewport 交互功能
    // viewport 的 panOnDrag, zoomOnScroll 等應該始終保持啟用
    
    this.onInteractiveChange.emit(newValue);
  }

}