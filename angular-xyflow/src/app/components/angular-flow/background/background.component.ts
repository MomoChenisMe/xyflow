import { 
  Component, 
  input, 
  computed,
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackgroundVariant } from '../types';

@Component({
  selector: 'angular-flow-background',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <svg 
      class="angular-flow__background"
      [style.position]="'absolute'"
      [style.top]="'0'"
      [style.left]="'0'"
      [style.width]="'100%'"
      [style.height]="'100%'"
      [style.z-index]="'0'"
      [style.pointer-events]="'none'"
    >
      <defs>
        @if (variant() === 'dots') {
          <pattern
            id="angular-flow-background-dots"
            [attr.width]="gap()"
            [attr.height]="gap()"
            patternUnits="userSpaceOnUse"
          >
            <circle
              [attr.cx]="gap() / 2"
              [attr.cy]="gap() / 2"
              [attr.r]="size() / 2"
              [attr.fill]="color()"
            />
          </pattern>
        }
        
        @if (variant() === 'lines') {
          <pattern
            id="angular-flow-background-lines"
            [attr.width]="gap()"
            [attr.height]="gap()"
            patternUnits="userSpaceOnUse"
          >
            <path
              [attr.d]="'M ' + gap() + ' 0 L 0 0 0 ' + gap()"
              [attr.stroke]="color()"
              [attr.stroke-width]="size()"
              fill="none"
            />
          </pattern>
        }
        
        @if (variant() === 'cross') {
          <pattern
            id="angular-flow-background-cross"
            [attr.width]="gap()"
            [attr.height]="gap()"
            patternUnits="userSpaceOnUse"
          >
            <path
              [attr.d]="getCrossPath()"
              [attr.stroke]="color()"
              [attr.stroke-width]="size()"
              fill="none"
            />
          </pattern>
        }
      </defs>
      
      <rect
        width="100%"
        height="100%"
        [attr.fill]="patternFill()"
      />
    </svg>
  `,
  styles: [`
    .angular-flow__background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      pointer-events: none;
    }
  `]
})
export class BackgroundComponent {
  // 輸入屬性
  readonly variant = input<BackgroundVariant>(BackgroundVariant.Dots);
  readonly gap = input<number>(20);
  readonly size = input<number>(1);
  readonly color = input<string>('#d0d0d0');
  readonly backgroundColor = input<string>('transparent');
  
  // 計算屬性
  readonly patternFill = computed(() => {
    const bgColor = this.backgroundColor();
    const variant = this.variant();
    
    if (bgColor && bgColor !== 'transparent') {
      return bgColor;
    }
    
    switch (variant) {
      case BackgroundVariant.Dots:
        return 'url(#angular-flow-background-dots)';
      case BackgroundVariant.Lines:
        return 'url(#angular-flow-background-lines)';
      case BackgroundVariant.Cross:
        return 'url(#angular-flow-background-cross)';
      default:
        return 'transparent';
    }
  });

  // 獲取十字圖案路徑
  getCrossPath(): string {
    const gap = this.gap();
    const halfGap = gap / 2;
    const size = this.size();
    
    return `
      M ${halfGap - size/2} 0 
      L ${halfGap + size/2} 0 
      L ${halfGap + size/2} ${gap} 
      L ${halfGap - size/2} ${gap} 
      Z
      M 0 ${halfGap - size/2} 
      L 0 ${halfGap + size/2} 
      L ${gap} ${halfGap + size/2} 
      L ${gap} ${halfGap - size/2} 
      Z
    `;
  }
}