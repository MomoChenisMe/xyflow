import { Component, input, ChangeDetectionStrategy, NO_ERRORS_SCHEMA, computed } from '@angular/core';
import { BackgroundVariant } from './background.types';

@Component({
  selector: 'svg[line-pattern]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <path
      [attr.stroke-width]="lineWidth()"
      [attr.d]="pathData()"
      [class]="'react-flow__background-pattern ' + variant() + (className() ? ' ' + className() : '')"
    />
  `,
})
export class LinePattern {
  dimensions = input<[number, number]>([0, 0]);
  variant = input<BackgroundVariant>(BackgroundVariant.Lines);
  lineWidth = input<number>(1);
  className = input<string>();

  pathData = computed(() => {
    const [width, height] = this.dimensions();
    return `M${width / 2} 0 V${height} M0 ${height / 2} H${width}`;
  });
}

@Component({
  selector: 'svg[dot-pattern]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <circle 
      [attr.cx]="radius()" 
      [attr.cy]="radius()" 
      [attr.r]="radius()"
      [class]="'react-flow__background-pattern dots' + (className() ? ' ' + className() : '')"
    />
  `,
})
export class DotPattern {
  radius = input<number>(1);
  className = input<string>();
}