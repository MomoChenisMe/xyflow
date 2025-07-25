import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * MiniMapNodes Component - 現在由主要的MiniMap組件直接處理
 * 這個組件已被廢棄，邏輯移動到 minimap.ts 中直接渲染
 */
@Component({
  selector: 'minimap-nodes',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 這個組件已被廢棄，現在由MiniMap組件直接渲染rect元素 -->
  `
})
export class MiniMapNodesSimple {
  // 這個組件不再使用，所有邏輯已移動到主要的MiniMap組件中
}