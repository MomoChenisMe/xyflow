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
import { EdgeTextComponent } from '../../angular-xyflow/components/edges/edge-text.component';

@Component({
  selector: 'svg:svg[app-custom-edge2]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BaseEdgeComponent, EdgeTextComponent],
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

    <!-- 使用 EdgeText 組件顯示標籤（與 React 一致） -->
    @if (edgeText()) {
    <svg:g
      angular-xyflow-edge-text
      [x]="labelX()"
      [y]="labelY()"
      [label]="edgeText()"
      [labelStyle]="labelStyleObj()"
      [labelShowBg]="true"
      [labelBgStyle]="labelBgStyleObj()"
      [labelBgPadding]="labelPadding()"
      [labelBgBorderRadius]="2"
    />
    }
  `,
})
export class CustomEdge2Component {
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

  // 樣式計算屬性
  labelStyleObj = computed(() => ({ fill: 'white' }));
  labelBgStyleObj = computed(() => ({ fill: 'red' }));
  labelPadding = computed(() => [2, 4] as [number, number]);
}
