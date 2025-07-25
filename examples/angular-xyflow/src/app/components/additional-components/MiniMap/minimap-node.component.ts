import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MiniMapNodeProps } from './minimap.types';

/**
 * MiniMapNode Component - renders individual node representation in minimap
 * Matches React Flow's MiniMapNode exactly
 */
@Component({
  selector: 'xy-minimap-node',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <rect
      [class]="rectClass()"
      [attr.x]="x()"
      [attr.y]="y()"
      [attr.rx]="borderRadius()"
      [attr.ry]="borderRadius()"
      [attr.width]="width()"
      [attr.height]="height()"
      [ngStyle]="rectStyle()"
      [attr.shape-rendering]="shapeRendering()"
      (click)="handleClick($event)"
    />
  `,
  styles: [`
    rect {
      cursor: pointer;
    }
  `]
})
export class MiniMapNode {
  id = input.required<string>();
  x = input.required<number>();
  y = input.required<number>();
  width = input.required<number>();
  height = input.required<number>();
  borderRadius = input.required<number>();
  className = input.required<string>();
  color = input<string>();
  shapeRendering = input.required<string>();
  strokeColor = input<string>();
  strokeWidth = input<number>();
  style = input<{ [key: string]: any }>();
  selected = input.required<boolean>();

  onClick = output<{ event: MouseEvent; id: string }>();

  // Computed class combining base classes with selected state
  rectClass = computed(() => {
    const classes = ['react-flow__minimap-node'];
    
    if (this.selected()) {
      classes.push('selected');
    }
    
    const className = this.className();
    if (className) {
      classes.push(className);
    }
    
    return classes.join(' ');
  });

  // Computed style combining fill, stroke properties
  rectStyle = computed(() => {
    const style = this.style() || {};
    const { background, backgroundColor } = style;
    const fill = (this.color() || background || backgroundColor) as string;

    return {
      fill,
      stroke: this.strokeColor(),
      strokeWidth: this.strokeWidth(),
      ...style
    };
  });

  handleClick(event: MouseEvent): void {
    this.onClick.emit({ event, id: this.id() });
  }
}