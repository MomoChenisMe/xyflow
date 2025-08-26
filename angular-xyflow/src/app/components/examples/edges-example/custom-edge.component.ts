import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { getBezierPath, Position } from '@xyflow/system';
import { BaseEdgeComponent } from '../../angular-xyflow/components/edges/base-edge.component';

@Component({
  selector: 'svg:svg[app-custom-edge]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BaseEdgeComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <!-- 使用 BaseEdge 渲染路徑（事件由指令處理） -->
    <svg:g angular-xyflow-base-edge 
      [id]="id()" 
      [path]="edgePath()" 
      [selected]="selected()"
      [animated]="animated()"
      [style]="style()"
      [interactionWidth]="interactionWidth()"
      [selectable]="selectable()"
    />

    <!-- 使用 textPath 在路徑上顯示文字（與 React 一致） -->
    <svg:text>
      <svg:textPath
        [attr.href]="'#' + id()"
        style="font-size: 12px; pointer-events: none; user-select: none;"
        startOffset="50%"
        text-anchor="middle"
      >
        {{ edgeText() }}
      </svg:textPath>
    </svg:text>
  `,
})
export class CustomEdgeComponent {
  // 使用 Angular 20 的 input signal API
  id = input.required<string>();
  source = input.required<string>();
  target = input.required<string>();
  sourceX = input.required<number>();
  sourceY = input.required<number>();
  targetX = input.required<number>();
  targetY = input.required<number>();
  sourcePosition = input.required<Position>();
  targetPosition = input.required<Position>();

  // 可選輸入
  data = input<any>();
  type = input<string>();
  selected = input<boolean>(false);
  markerEnd = input<string>();
  markerStart = input<string>();
  interactionWidth = input<number>(20);
  sourceHandleId = input<string>();
  targetHandleId = input<string>();
  animated = input<boolean>(false);
  hidden = input<boolean>(false);
  deletable = input<boolean>(true);
  selectable = input<boolean>(true);
  style = input<Record<string, any>>();
  
  // 🔑 關鍵修正：添加 sourceNode 和 targetNode 輸入屬性（自定義邊組件需要）
  sourceNode = input<any>();
  targetNode = input<any>();

  // 計算屬性
  pathData = computed(() => {
    return getBezierPath({
      sourceX: this.sourceX(),
      sourceY: this.sourceY(),
      sourcePosition: this.sourcePosition(),
      targetX: this.targetX(),
      targetY: this.targetY(),
      targetPosition: this.targetPosition(),
    });
  });

  edgePath = computed(() => this.pathData()[0]);
  labelX = computed(() => this.pathData()[1]);
  labelY = computed(() => this.pathData()[2]);

  edgeText = computed(() => {
    const edgeData = this.data();
    return edgeData?.['text'] || '';
  });
}
