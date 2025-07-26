import { 
  Component, 
  input, 
  output, 
  computed,
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularEdge, AngularNode } from '../types';
import { 
  getBezierPath, 
  getStraightPath,
  getSmoothStepPath,
  Position 
} from '@xyflow/system';

@Component({
  selector: 'angular-flow-edge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  template: `
    <!-- 絕對最簡化測試 -->
    <text x="300" y="50" fill="blue" font-size="16">
      EDGE COMPONENT WORKS!
    </text>
  `,
  styles: [`
    .angular-flow__edge {
      pointer-events: auto;
    }

    .angular-flow__edge-path, .xy-flow__edge-path {
      stroke: #b1b1b7;
      stroke-width: 2;
      fill: none;
    }

    .angular-flow__edge-path:hover {
      stroke: #999;
      stroke-width: 2;
    }

    .angular-flow__edge-path.selected {
      stroke: #ff0072;
      stroke-width: 2;
    }

    .angular-flow__edge-path.animated {
      stroke-dasharray: 5;
      animation: flow 0.5s linear infinite;
    }

    @keyframes flow {
      to {
        stroke-dashoffset: -10;
      }
    }

    .angular-flow__edge-label {
      font-size: 12px;
      fill: #222;
      pointer-events: none;
    }

    /* Edge type specific styles */
    .edge-type-default .angular-flow__edge-path {
      stroke: #b1b1b7;
    }

    .edge-type-straight .angular-flow__edge-path {
      stroke: #b1b1b7;
    }

    .edge-type-step .angular-flow__edge-path {
      stroke: #b1b1b7;
    }

    .edge-type-smoothstep .angular-flow__edge-path {
      stroke: #b1b1b7;
    }

    .edge-type-bezier .angular-flow__edge-path {
      stroke: #b1b1b7;
    }
  `]
})
export class EdgeWrapperComponent {
  // 輸入屬性
  readonly edge = input.required<AngularEdge>();
  readonly sourceNode = input<AngularNode>();
  readonly targetNode = input<AngularNode>();
  

  // 獲取debug偏移量來避免文字重疊
  getDebugOffset(): number {
    const edgeId = this.edge().id;
    if (edgeId === 'e1-2') return 0;
    if (edgeId === 'e1-3') return 50;
    return 100;
  }

  // 獲取簡化的邊路徑
  getSimplePath(): string {
    const source = this.sourceNode();
    const target = this.targetNode();
    
    if (!source || !target) {
      return '';
    }
    
    // 計算節點中心點作為連接點
    const sourceX = source.position.x + (source.width || 150) / 2;
    const sourceY = source.position.y + (source.height || 40) / 2;
    const targetX = target.position.x + (target.width || 150) / 2;
    const targetY = target.position.y + (target.height || 40) / 2;
    
    const edge = this.edge();
    
    // 根據邊類型返回不同的路徑
    switch (edge.type) {
      case 'straight':
        return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
      
      case 'step':
        const midX = (sourceX + targetX) / 2;
        return `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;
      
      default: // 'default' 或 'bezier'
        // 簡化的貝茲曲線
        const controlX1 = sourceX + (targetX - sourceX) * 0.3;
        const controlX2 = sourceX + (targetX - sourceX) * 0.7;
        return `M ${sourceX} ${sourceY} C ${controlX1} ${sourceY}, ${controlX2} ${targetY}, ${targetX} ${targetY}`;
    }
  }
  
  // 輸出事件
  readonly edgeClick = output<MouseEvent>();
  readonly edgeMouseEnter = output<MouseEvent>();
  readonly edgeMouseLeave = output<MouseEvent>();
  
  // 計算屬性
  readonly edgeClasses = computed(() => {
    const classes = ['angular-flow__edge'];
    const edgeData = this.edge();
    
    if (edgeData.type) {
      classes.push(`edge-type-${edgeData.type}`);
    }
    
    if (edgeData.className) {
      classes.push(edgeData.className);
    }
    
    if (edgeData.selected) {
      classes.push('selected');
    }
    
    if (edgeData.animated) {
      classes.push('animated');
    }
    
    return classes.join(' ');
  });
  
  readonly pathData = computed(() => {
    const sourceNode = this.sourceNode();
    const targetNode = this.targetNode();
    const edge = this.edge();
    
    console.log('🔗 計算邊路徑:', { 
      edgeId: edge.id, 
      sourceId: edge.source, 
      targetId: edge.target,
      sourceNode: sourceNode ? 'Found' : 'Missing',
      targetNode: targetNode ? 'Found' : 'Missing'
    });
    
    if (!sourceNode || !targetNode) {
      console.warn('⚠️ 邊缺少節點:', { 
        edgeId: edge.id, 
        sourceNode: !!sourceNode, 
        targetNode: !!targetNode 
      });
      return null;
    }
    
    // 計算源和目標位置
    const sourcePosition = this.getHandlePosition(sourceNode, edge.sourceHandle, 'source');
    const targetPosition = this.getHandlePosition(targetNode, edge.targetHandle, 'target');
    
    console.log('🎯 Handle 位置:', { 
      edgeId: edge.id,
      sourcePosition, 
      targetPosition 
    });
    
    if (!sourcePosition || !targetPosition) {
      console.warn('⚠️ Handle 位置計算失敗:', { 
        edgeId: edge.id,
        sourcePosition,
        targetPosition
      });
      return null;
    }
    
    // 根據邊類型生成路徑 - 改進版本
    const edgeType = edge.type || 'default';
    
    try {
      switch (edgeType) {
        case 'straight':
          return getStraightPath({
            sourceX: sourcePosition.x,
            sourceY: sourcePosition.y,
            targetX: targetPosition.x,
            targetY: targetPosition.y
          });
          
        case 'step':
          return getSmoothStepPath({
            sourceX: sourcePosition.x,
            sourceY: sourcePosition.y,
            sourcePosition: sourcePosition.position,
            targetX: targetPosition.x,
            targetY: targetPosition.y,
            targetPosition: targetPosition.position,
            borderRadius: 0
          });
          
        case 'smoothstep':
          return getSmoothStepPath({
            sourceX: sourcePosition.x,
            sourceY: sourcePosition.y,
            sourcePosition: sourcePosition.position,
            targetX: targetPosition.x,
            targetY: targetPosition.y,
            targetPosition: targetPosition.position,
            borderRadius: 5
          });
          
        case 'simplebezier':
          return getBezierPath({
            sourceX: sourcePosition.x,
            sourceY: sourcePosition.y,
            sourcePosition: sourcePosition.position,
            targetX: targetPosition.x,
            targetY: targetPosition.y,
            targetPosition: targetPosition.position
          });
          
        case 'bezier':
          return getBezierPath({
            sourceX: sourcePosition.x,
            sourceY: sourcePosition.y,
            sourcePosition: sourcePosition.position,
            targetX: targetPosition.x,
            targetY: targetPosition.y,
            targetPosition: targetPosition.position,
            curvature: (edge.data as any)?.['curvature'] || 0.25
          });
          
        case 'default':
        default:
          // 默認使用 bezier 
          const result = getBezierPath({
            sourceX: sourcePosition.x,
            sourceY: sourcePosition.y,
            sourcePosition: sourcePosition.position,
            targetX: targetPosition.x,
            targetY: targetPosition.y,
            targetPosition: targetPosition.position
          });
          
          console.log('✅ 邊路徑計算成功:', { 
            edgeId: edge.id,
            edgeType,
            pathData: result,
            isArray: Array.isArray(result),
            hasPath: !!result?.[0]
          });
          
          return result;
      }
    } catch (error) {
      console.warn('❌ 邊路徑計算失敗:', error, { edge, sourcePosition, targetPosition });
      // 降級到直線路徑
      const fallbackResult = getStraightPath({
        sourceX: sourcePosition.x,
        sourceY: sourcePosition.y,
        targetX: targetPosition.x,
        targetY: targetPosition.y
      });
      
      console.log('🔧 使用降級路徑:', { 
        edgeId: edge.id,
        fallbackResult
      });
      
      return fallbackResult;
    }
  });
  
  readonly edgeColor = computed(() => {
    const edge = this.edge();
    if (edge.selected) {
      return '#ff0072';
    }
    // 可以根據邊的 data 或其他屬性來設置顏色
    return '#b1b1b7';
  });
  
  readonly edgeWidth = computed(() => {
    const edge = this.edge();
    if (edge.selected) {
      return 2;
    }
    return 1;
  });
  
  readonly hasMarker = computed(() => {
    // 決定是否顯示箭頭標記
    return true;
  });

  // 獲取 handle 位置 - 改進版本
  private getHandlePosition(node: AngularNode, handleId: string | undefined, handleType: 'source' | 'target') {
    // 使用節點的實際尺寸，如果沒有則使用默認值
    const nodeWidth = node.width || 150;
    const nodeHeight = node.height || 40;
    
    console.log('🎯 計算Handle位置:', { 
      nodeId: node.id, 
      handleType, 
      nodePosition: node.position,
      nodeWidth, 
      nodeHeight 
    });
    
    // 決定 handle 位置
    let position: Position;
    if (handleType === 'source') {
      position = (node.sourcePosition || Position.Right) as Position;
    } else {
      position = (node.targetPosition || Position.Left) as Position;
    }
    
    console.log('🎯 Handle 方向:', { nodeId: node.id, handleType, position });
    
    // 計算 handle 的絕對位置 (節點位置 + handle 偏移)
    let x: number;
    let y: number;
    
    switch (position) {
      case Position.Top:
        x = node.position.x + nodeWidth / 2;
        y = node.position.y;
        break;
      case Position.Right:
        x = node.position.x + nodeWidth;
        y = node.position.y + nodeHeight / 2;
        break;
      case Position.Bottom:
        x = node.position.x + nodeWidth / 2;
        y = node.position.y + nodeHeight;
        break;
      case Position.Left:
      default:
        x = node.position.x;
        y = node.position.y + nodeHeight / 2;
        break;
    }
    
    const result = { x, y, position };
    console.log('✅ Handle 位置計算完成:', { nodeId: node.id, handleType, result });
    
    return result;
  }

  // 事件處理方法
  handleClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.edgeClick.emit(event);
  }

  handleMouseEnter(event: MouseEvent) {
    this.edgeMouseEnter.emit(event);
  }

  handleMouseLeave(event: MouseEvent) {
    this.edgeMouseLeave.emit(event);
  }
}