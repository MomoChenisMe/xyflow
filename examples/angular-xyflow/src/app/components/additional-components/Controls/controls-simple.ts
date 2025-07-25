import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'controls',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="xy-flow__controls xy-flow__panel bottom left" 
         style="box-shadow: var(--xy-controls-box-shadow, var(--xy-controls-box-shadow-default)); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 4px; background-color: #fefefe; display: flex; flex-direction: column; font-size: 12px; font-weight: 600; overflow: hidden; visibility: visible; min-width: 26px; min-height: 78px;">
      @if (showZoom()) {
        <button class="xy-flow__controls-button xy-flow__controls-zoomin" 
                (click)="onZoomIn.emit()"
                style="display: flex; justify-content: center; align-items: center; height: 26px; width: 26px; padding: 4px; border: none; border-bottom: 1px solid #eee; cursor: pointer; user-select: none;">
          <svg viewBox="0 0 24 24" style="width: 12px; height: 12px; fill: currentColor;">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
        <button class="xy-flow__controls-button xy-flow__controls-zoomout" 
                (click)="onZoomOut.emit()"
                style="display: flex; justify-content: center; align-items: center; height: 26px; width: 26px; padding: 4px; border: none; border-bottom: 1px solid #eee; cursor: pointer; user-select: none;">
          <svg viewBox="0 0 24 24" style="width: 12px; height: 12px; fill: currentColor;">
            <path d="M19 13H5v-2h14v2z"/>
          </svg>
        </button>
      }
      @if (showFitView()) {
        <button class="xy-flow__controls-button xy-flow__controls-fitview" 
                (click)="onFitView.emit()"
                style="display: flex; justify-content: center; align-items: center; height: 26px; width: 26px; padding: 4px; border: none; border-bottom: 1px solid #eee; cursor: pointer; user-select: none;">
          <svg viewBox="0 0 24 24" style="width: 12px; height: 12px; fill: currentColor;">
            <path d="M15 3l2.3 2.3-2.89 2.87 1.42 1.42L18.7 6.7 21 9V3h-6zM3 9l2.3-2.3 2.87 2.89 1.42-1.42L6.7 5.3 9 3H3v6zm6 12l-2.3-2.3 2.89-2.87-1.42-1.42L5.3 17.3 3 15v6h6zm12-6l-2.3 2.3-2.87-2.89-1.42 1.42 2.89 2.87L15 21h6v-6z"/>
          </svg>
        </button>
      }
      @if (showInteractive()) {
        <button class="xy-flow__controls-button xy-flow__controls-interactive" 
                (click)="onInteractiveChange.emit()"
                style="display: flex; justify-content: center; align-items: center; height: 26px; width: 26px; padding: 4px; border: none; cursor: pointer; user-select: none;">
          <!-- Conditional icon based on interactive state -->
          @if (isInteractive()) {
            <!-- Unlock icon - when interactive (unlocked) -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 32" style="width: 12px; height: 12px; fill: currentColor;">
              <path d="M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0c-4.114 1.828-1.37 2.133.305 2.438 1.676.305 4.42 2.59 4.42 5.181v3.048H3.047A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047z" />
            </svg>
          } @else {
            <!-- Lock icon - when not interactive (locked) -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 32" style="width: 12px; height: 12px; fill: currentColor;">
              <path d="M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0 8 0 4.571 3.429 4.571 7.619v3.048H3.048A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047zm4.724-13.866H7.467V7.619c0-2.59 2.133-4.724 4.723-4.724 2.591 0 4.724 2.133 4.724 4.724v3.048z" />
            </svg>
          }
        </button>
      }
    </div>
  `,
  styles: []
})
export class ControlsSimple {
  showZoom = input(true);
  showFitView = input(true);  
  showInteractive = input(true);
  isInteractive = input(true); // 新增：接收當前互動狀態
  
  onZoomIn = output<void>();
  onZoomOut = output<void>();
  onFitView = output<void>();
  onInteractiveChange = output<void>();
}