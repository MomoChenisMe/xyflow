import {
  Component,
  input,
  computed,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { getBezierPath, Position } from '@xyflow/system';
import { BaseEdgeComponent } from '../../angular-xyflow/components/edges/base-edge/base-edge.component';
import { EdgeLabelRendererComponent } from '../../angular-xyflow/edge-label-renderer/edge-label-renderer.component';
import { AngularXYFlowService } from '../../angular-xyflow/services/angular-xyflow.service';

@Component({
  selector: 'svg:svg[app-edge-renderer-custom-edge2]',
  standalone: true,
  imports: [CommonModule, BaseEdgeComponent, EdgeLabelRendererComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 使用 BaseEdge 渲染路徑 -->
    <svg:g angular-xyflow-base-edge 
      [id]="id()" 
      [path]="edgePath()"
      [selected]="selected()"
      [animated]="animated()"
      [style]="style()"
      [interactionWidth]="interactionWidth()"
      [selectable]="selectable()"
    />

    <!-- 使用 EdgeLabelRenderer 渲染 HTML 內容（現在直接渲染到 HTML 層） -->
    <angular-xyflow-edge-label-renderer>
      <div
        [style.transform]="labelTransform()"
        [style.background]="'white'"
        [style.border]="'1px solid #555'"
        [style.padding.px]="5"
        [style.z-index]="isConnectedNodeDragging() ? 10 : 0"
        style="position: absolute; transform-origin: center;"
      >
        {{ edgeText() }}
      </div>
    </angular-xyflow-edge-label-renderer>
  `,
})
export class EdgeRendererCustomEdge2Component {
  // 注入服務
  private flowService = inject(AngularXYFlowService);

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

  // 標籤位置轉換
  labelTransform = computed(() => {
    const x = this.labelX();
    const y = this.labelY();
    return `translate(-50%, -50%) translate(${x}px, ${y}px)`;
  });

  edgeText = computed(() => {
    const edgeData = this.data();
    return edgeData?.['text'] || '';
  });

  // 檢查連接的節點是否正在拖動
  isConnectedNodeDragging = computed(() => {
    const nodes = this.flowService.nodes();
    const source = this.source();
    const target = this.target();
    
    return nodes.some(
      (node) => node.dragging && (target === node.id || source === node.id)
    );
  });
}