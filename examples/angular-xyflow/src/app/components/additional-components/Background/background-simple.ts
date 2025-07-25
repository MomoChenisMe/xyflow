import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'background',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="xy-flow__background" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; visibility: visible;">
      <svg width="100%" height="100%" style="width: 100%; height: 100%;">
        <defs>
          <pattern 
            id="dot-pattern" 
            [attr.x]="backgroundOffset().x" 
            [attr.y]="backgroundOffset().y" 
            width="20" 
            height="20" 
            patternUnits="userSpaceOnUse"
          >
            <circle 
              cx="10" 
              cy="10" 
              r="1" 
              class="xy-flow__background-pattern dots"
              fill="#b1b1b7"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-pattern)" />
      </svg>
    </div>
  `,
  styles: []
})
export class SimpleBackground {
  variant = input<string>('dots');
  viewport = input.required<{ x: number; y: number; zoom: number }>();
  
  backgroundOffset = computed(() => {
    const vp = this.viewport();
    const patternSize = 20;
    return {
      x: (vp.x % patternSize),
      y: (vp.y % patternSize)
    };
  });
}