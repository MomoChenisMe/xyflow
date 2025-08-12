import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-custom-node',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>Custom node</div>
  `
})
export class CustomNodeComponent {
  // 定義 input 屬性以避免 Angular 錯誤，但不實際使用它們（與 React 版本一致）
  id = input<string>();
  data = input<Record<string, unknown>>();
  type = input<string>();
  selected = input<boolean>();
  dragging = input<boolean>();
  isConnectable = input<boolean>();
  sourcePosition = input<string>();
  targetPosition = input<string>();
  width = input<number>();
  height = input<number>();
  parentId = input<string>();
  zIndex = input<number>();
  draggable = input<boolean>();
  selectable = input<boolean>();
  deletable = input<boolean>();
  positionAbsoluteX = input<number>();
  positionAbsoluteY = input<number>();
  dragHandle = input<string>();
}