import { 
  Component, 
  input, 
  computed,
  inject,
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularFlowService } from '../angular-flow.service';
import { BackgroundVariant } from '../types';

@Component({
  selector: 'angular-xyflow-background',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <svg:svg 
      class="xy-flow__background angular-xyflow__background"
      [class]="className()"
      [style.position]="'absolute'"
      [style.top]="'0'"
      [style.left]="'0'"
      [style.width]="'100%'"
      [style.height]="'100%'"
      [style.z-index]="'0'"
      [style.pointer-events]="'none'"
      [style.--xy-background-color-props]="bgColor()"
      [style.--xy-background-pattern-color-props]="color()"
    >
      <svg:defs>
        <svg:pattern
          [id]="patternId()"
          [attr.x]="patternPosition().x"
          [attr.y]="patternPosition().y"
          [attr.width]="scaledGap()[0]"
          [attr.height]="scaledGap()[1]"
          patternUnits="userSpaceOnUse"
          [attr.patternTransform]="patternTransform()"
        >
          @if (variant() === backgroundVariant.Dots) {
            <!-- Dot Pattern -->
            <svg:circle
              [attr.cx]="scaledSize() / 2"
              [attr.cy]="scaledSize() / 2"
              [attr.r]="scaledSize() / 2"
              [class]="'xy-flow__background-pattern dots ' + (patternClassName() || '')"
            />
          } @else {
            <!-- Line Pattern (includes Lines and Cross) -->
            <svg:path
              [attr.stroke-width]="lineWidth()"
              [attr.d]="linePath()"
              [class]="'xy-flow__background-pattern ' + variant() + ' ' + (patternClassName() || '')"
              fill="none"
            />
          }
        </svg:pattern>
      </svg:defs>
      
      <svg:rect 
        x="0" 
        y="0" 
        width="100%" 
        height="100%" 
        [attr.fill]="'url(#' + patternId() + ')'"
      />
    </svg:svg>
  `,
  styles: [`
    .angular-xyflow__background {
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
  // 注入服務
  private _flowService = inject(AngularFlowService);
  
  // 輸入屬性
  readonly id = input<string>();
  readonly variant = input<BackgroundVariant>(BackgroundVariant.Dots);
  readonly gap = input<number | [number, number]>(20);
  readonly size = input<number>();
  readonly lineWidth = input<number>(1);
  readonly offset = input<number | [number, number]>(0);
  readonly color = input<string>();
  readonly bgColor = input<string>();
  readonly className = input<string>();
  readonly patternClassName = input<string>();
  
  // 常量
  readonly backgroundVariant = BackgroundVariant;
  
  private readonly defaultSize = {
    [BackgroundVariant.Dots]: 1,
    [BackgroundVariant.Lines]: 1,
    [BackgroundVariant.Cross]: 6,
  };
  
  // 計算信號
  readonly viewport = computed(() => this._flowService.viewport());
  
  readonly patternId = computed(() => {
    const baseId = this.id() || '';
    return `angular-xyflow-pattern-${this.variant()}-${baseId}`;
  });
  
  readonly gapXY = computed((): [number, number] => {
    const gap = this.gap();
    return Array.isArray(gap) ? gap : [gap, gap];
  });
  
  readonly offsetXY = computed((): [number, number] => {
    const offset = this.offset();
    return Array.isArray(offset) ? offset : [offset, offset];
  });
  
  readonly scaledGap = computed((): [number, number] => {
    const gapXY = this.gapXY();
    const zoom = this.viewport().zoom;
    return [gapXY[0] * zoom || 1, gapXY[1] * zoom || 1];
  });
  
  readonly scaledSize = computed(() => {
    const size = this.size() || this.defaultSize[this.variant()];
    const zoom = this.viewport().zoom;
    return size * zoom;
  });
  
  readonly patternDimensions = computed(() => {
    const isCross = this.variant() === BackgroundVariant.Cross;
    const scaledGap = this.scaledGap();
    const scaledSize = this.scaledSize();
    
    return isCross 
      ? [scaledSize, scaledSize]
      : scaledGap;
  });
  
  readonly scaledOffset = computed((): [number, number] => {
    const offsetXY = this.offsetXY();
    const zoom = this.viewport().zoom;
    const patternDims = this.patternDimensions();
    
    return [
      offsetXY[0] * zoom || 1 + patternDims[0] / 2,
      offsetXY[1] * zoom || 1 + patternDims[1] / 2,
    ];
  });
  
  readonly patternPosition = computed(() => {
    const viewport = this.viewport();
    const scaledGap = this.scaledGap();
    
    return {
      x: viewport.x % scaledGap[0],
      y: viewport.y % scaledGap[1]
    };
  });
  
  readonly patternTransform = computed(() => {
    const scaledOffset = this.scaledOffset();
    return `translate(-${scaledOffset[0]},-${scaledOffset[1]})`;
  });
  
  readonly linePath = computed(() => {
    const dims = this.patternDimensions();
    const variant = this.variant();
    
    if (variant === BackgroundVariant.Cross) {
      return `M${dims[0] / 2} 0 V${dims[1]} M0 ${dims[1] / 2} H${dims[0]}`;
    } else {
      // Lines variant
      return `M${dims[0] / 2} 0 V${dims[1]} M0 ${dims[1] / 2} H${dims[0]}`;
    }
  });
}