import { 
  Component, 
  input, 
  output,
  inject,
  signal,
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularFlowService } from '../angular-flow.service';

@Component({
  selector: 'angular-flow-controls',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div 
      class="angular-flow__controls"
      [style.position]="'absolute'"
      [style.bottom]="'10px'"
      [style.left]="'10px'"
      [style.z-index]="'5'"
      [style.display]="'flex'"
      [style.flex-direction]="'column'"
      [style.gap]="'4px'"
    >
      <!-- Zoom In Button -->
      <button 
        type="button"
        class="angular-flow__controls-button angular-flow__controls-zoomin"
        [disabled]="!canZoomIn()"
        (click)="onZoomIn()"
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
        class="angular-flow__controls-button angular-flow__controls-zoomout"
        [disabled]="!canZoomOut()"
        (click)="onZoomOut()"
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
        class="angular-flow__controls-button angular-flow__controls-fitview"
        (click)="onFitView()"
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
          class="angular-flow__controls-button angular-flow__controls-interactive"
          [class.active]="isInteractive()"
          (click)="onToggleInteractivity()"
          [attr.aria-label]="isInteractive() ? 'Disable interaction' : 'Enable interaction'"
          [title]="isInteractive() ? 'Disable interaction' : 'Enable interaction'"
        >
          @if (isInteractive()) {
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <circle cx="12" cy="16" r="1"></circle>
              <path d="m7 11 0-7a5 5 0 0 1 10 0v7"></path>
            </svg>
          } @else {
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <circle cx="12" cy="16" r="1"></circle>
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
  
  // 內部狀態
  private readonly isInteractiveSignal = signal<boolean>(true);

  // 計算屬性
  canZoomIn(): boolean {
    const viewport = this.flowService.viewport();
    const maxZoom = this.flowService.maxZoom();
    return viewport.zoom < maxZoom;
  }

  canZoomOut(): boolean {
    const viewport = this.flowService.viewport();
    const minZoom = this.flowService.minZoom();
    return viewport.zoom > minZoom;
  }

  // 事件處理方法
  onZoomIn() {
    if (!this.canZoomIn()) return;
    
    const viewport = this.flowService.viewport();
    const maxZoom = this.flowService.maxZoom();
    const newZoom = Math.min(viewport.zoom * 1.2, maxZoom);
    
    this.flowService.getFlowInstance().setViewport({
      ...viewport,
      zoom: newZoom
    });
    
    this.onZoomInClick.emit();
  }

  onZoomOut() {
    if (!this.canZoomOut()) return;
    
    const viewport = this.flowService.viewport();
    const minZoom = this.flowService.minZoom();
    const newZoom = Math.max(viewport.zoom / 1.2, minZoom);
    
    this.flowService.getFlowInstance().setViewport({
      ...viewport,
      zoom: newZoom
    });
    
    this.onZoomOutClick.emit();
  }

  onFitView() {
    const options = this.fitViewOptions();
    this.flowService.getFlowInstance().fitView(options);
    this.onFitViewClick.emit();
  }

  onToggleInteractivity() {
    const newValue = !this.isInteractiveSignal();
    this.isInteractiveSignal.set(newValue);
    // 更新交互狀態邏輯
    this.onInteractiveChange.emit(newValue);
  }

  isInteractive(): boolean {
    return this.isInteractiveSignal();
  }
}