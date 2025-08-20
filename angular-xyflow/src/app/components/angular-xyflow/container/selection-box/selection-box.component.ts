// Angular 核心模組
import {
  Component,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// 專案內部模組
import { SelectionService } from '../../services/selection.service';
import { AngularNode, AngularEdge } from '../../types';

@Component({
  selector: 'angular-xyflow-selection-box',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (shouldRenderSelectionBox()) {
      <div
        class="angular-xyflow__selection angular-xyflow__container"
        [style.transform]="selectionTransform()"
        [style.width.px]="selectionBoxPosition().width"
        [style.height.px]="selectionBoxPosition().height"
        [style.background-color]="boxStyle().backgroundColor"
        [style.border-color]="boxStyle().borderColor"
        [style.border-width.px]="boxStyle().borderWidth"
        [style.border-style]="boxStyle().borderStyle"
        [style.opacity]="boxStyle().opacity || 1"
      ></div>
    }
  `,
  styles: [
    `
      .angular-xyflow__selection {
        position: absolute;
        z-index: 6;
        pointer-events: none;
        transform-origin: left top;
      }

      .angular-xyflow__container {
        /* Ensure proper positioning context */
        box-sizing: border-box;
      }
    `,
  ],
})
export class SelectionBoxComponent<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> {
  private _selectionService = inject(SelectionService<NodeType, EdgeType>);

  // 選擇框狀態
  selectionBox = computed(() => this._selectionService.selectionBox());

  // 計算是否應該渲染選擇框
  shouldRenderSelectionBox = computed(() => {
    const box = this.selectionBox();
    return box.active;
  });

  // 計算選擇框的位置和尺寸
  selectionBoxPosition = computed(() => {
    const box = this.selectionBox();
    
    if (!box.active) {
      return {
        left: 0,
        top: 0,
        width: 0,
        height: 0
      };
    }

    const left = Math.min(box.startX, box.endX);
    const top = Math.min(box.startY, box.endY);
    const width = Math.abs(box.endX - box.startX);
    const height = Math.abs(box.endY - box.startY);

    return {
      left,
      top,
      width,
      height
    };
  });

  // 計算選擇框的 CSS transform 字符串 - 與 React Flow 一致
  selectionTransform = computed(() => {
    const position = this.selectionBoxPosition();
    return `translate(${position.left}px, ${position.top}px)`;
  });

  // 獲取選擇框樣式
  boxStyle = computed(() => this._selectionService.selectionBoxStyle());
}