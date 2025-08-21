import { Component, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position, getBezierPath } from '@xyflow/system';
import { AngularXYFlowService } from '../../angular-xyflow/services/angular-xyflow.service';
import { getEdgeParams } from './floating-edges.utils';

@Component({
  selector: 'svg:svg[app-floating-edge]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @if (edgePath()) {
      <svg:g class="react-flow__connection">
        <svg:path 
          [attr.id]="id()" 
          class="react-flow__edge-path" 
          [attr.d]="edgePath()" 
          [style]="style()"
          fill="none"
          stroke="#b1b1b7"
          stroke-width="1"
        />
      </svg:g>
    }
  `,
})
export class FloatingEdgeComponent {
  private flowService = inject(AngularXYFlowService);

  // 基本邊線屬性 - 與React版本的EdgeProps一致
  id = input.required<string>();
  source = input.required<string>();
  target = input.required<string>();
  style = input<Record<string, any>>();
  
  // 其他可能的邊線屬性
  sourceX = input<number>();
  sourceY = input<number>();
  targetX = input<number>();
  targetY = input<number>();
  sourcePosition = input<Position>();
  targetPosition = input<Position>();
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

  // 模擬React版本的useStore邏輯 - 獲取實時節點數據
  sourceAndTargetNodes = computed(() => {
    const sourceNode = this.flowService.nodeLookup().get(this.source());
    const targetNode = this.flowService.nodeLookup().get(this.target());
    
    // 為節點添加絕對位置信息，用於正確的浮動邊線計算
    let sourceNodeWithAbsolute = sourceNode;
    let targetNodeWithAbsolute = targetNode;
    
    if (sourceNode) {
      const sourceInternals = this.flowService.getNodeInternals(sourceNode.id);
      sourceNodeWithAbsolute = {
        ...sourceNode,
        positionAbsolute: sourceInternals?.positionAbsolute || sourceNode.position
      } as any;
    }
    
    if (targetNode) {
      const targetInternals = this.flowService.getNodeInternals(targetNode.id);
      targetNodeWithAbsolute = {
        ...targetNode,
        positionAbsolute: targetInternals?.positionAbsolute || targetNode.position
      } as any;
    }
    
    return { sourceNode: sourceNodeWithAbsolute, targetNode: targetNodeWithAbsolute };
  });

  // 計算浮動邊線路徑 - 與React版本完全一致的邏輯
  edgePath = computed(() => {
    const { sourceNode, targetNode } = this.sourceAndTargetNodes();
    
    // 如果沒有找到節點，返回null（與React版本行為一致）
    if (!sourceNode || !targetNode) {
      return null;
    }

    // 使用getEdgeParams計算真正的浮動連接點
    const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

    // 使用getBezierPath生成路徑
    const [path] = getBezierPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: sourcePos,
      targetPosition: targetPos,
      targetX: tx,
      targetY: ty,
    });

    return path;
  });
}