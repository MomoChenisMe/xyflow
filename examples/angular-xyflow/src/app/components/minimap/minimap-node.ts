import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MiniMapNodeProps } from './minimap.types';

/**
 * MiniMapNode Component - 與 React 版本的 MiniMapNode 完全相同
 * 渲染單個節點在 MiniMap 中的表示
 */
@Component({
  selector: 'minimap-node',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <rect
      [class]="nodeClass()"
      [attr.x]="x()"
      [attr.y]="y()"
      [attr.rx]="borderRadius()"
      [attr.ry]="borderRadius()"
      [attr.width]="width()"
      [attr.height]="height()"
      [ngStyle]="nodeStyle()"
      [attr.shape-rendering]="shapeRendering()"
      (click)="handleClick($event)"
    />
  `
})
export class MiniMapNode {
  // 與 React 版本相同的屬性
  id = input.required<string>();
  x = input.required<number>();
  y = input.required<number>();
  width = input.required<number>();
  height = input.required<number>();
  borderRadius = input<number>(5);
  className = input<string>('');
  color = input<string>();
  strokeColor = input<string>();
  strokeWidth = input<number>();
  style = input<{ [key: string]: any }>();
  shapeRendering = input<string>('geometricPrecision');
  selected = input<boolean>(false);
  onClick = input<((event: MouseEvent, id: string) => void) | undefined>(undefined);

  // 計算節點 CSS 類別 - 與 React 版本相同
  protected nodeClass = computed(() => {
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

  // 計算節點樣式 - 與 React 版本相同的邏輯
  protected nodeStyle = computed(() => {
    const style = this.style() || {};
    const color = this.color();
    const strokeColor = this.strokeColor();
    const strokeWidth = this.strokeWidth();
    
    const { background, backgroundColor } = style;
    const fill = (color || background || backgroundColor) as string;

    return {
      fill,
      stroke: strokeColor,
      strokeWidth,
    };
  });

  // 處理點擊事件 - 與 React 版本相同
  protected handleClick(event: MouseEvent): void {
    const onClick = this.onClick();
    if (onClick) {
      onClick(event, this.id());
    }
  }
}