import { Component, input } from '@angular/core';

@Component({
  selector: 'app-custom-node',
  standalone: true,
  template: `
    <div>Custom node</div>
  `
})
export class CustomNodeComponent {
  // 定義 input 屬性以避免 Angular 錯誤，但不實際使用它們（與 React 版本一致）
  readonly id = input<string>();
  readonly data = input<Record<string, unknown>>();
  readonly type = input<string>();
  readonly selected = input<boolean>();
  readonly dragging = input<boolean>();
  readonly isConnectable = input<boolean>();
  readonly sourcePosition = input<string>();
  readonly targetPosition = input<string>();
  readonly width = input<number>();
  readonly height = input<number>();
  readonly parentId = input<string>();
  readonly zIndex = input<number>();
  readonly draggable = input<boolean>();
  readonly selectable = input<boolean>();
  readonly deletable = input<boolean>();
  readonly positionAbsoluteX = input<number>();
  readonly positionAbsoluteY = input<number>();
  readonly dragHandle = input<string>();
}