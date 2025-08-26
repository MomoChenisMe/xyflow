import { XYPosition, AngularNode, AngularEdge } from '../../angular-xyflow/types';
import { Position } from '@xyflow/system';

// 這個輔助函數返回交點
// 即intersectionNode中心與targetNode之間連線的交點
function getNodeIntersection(intersectionNode: AngularNode, targetNode: AngularNode): XYPosition {
  // 使用節點的絕對位置進行計算（如果可用），否則使用相對位置
  const intersectionPos = (intersectionNode as any).positionAbsolute || intersectionNode.position;
  const targetPos = (targetNode as any).positionAbsolute || targetNode.position;
  
  const { width: intersectionNodeWidth, height: intersectionNodeHeight } = intersectionNode.measured ?? {
    width: 150, // 默認節點寬度
    height: 36, // 默認節點高度
  };
  
  const { width: targetNodeWidth, height: targetNodeHeight } = targetNode.measured ?? {
    width: 150,
    height: 36,
  };

  const w = intersectionNodeWidth / 2;
  const h = intersectionNodeHeight / 2;

  const x2 = intersectionPos.x + w;
  const y2 = intersectionPos.y + h;
  const x1 = targetPos.x + targetNodeWidth / 2;
  const y1 = targetPos.y + targetNodeHeight / 2;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + x2;
  const y = h * (-xx3 + yy3) + y2;

  return { x, y };
}

// 返回節點相對於交點的位置（上、右、下或左）
function getEdgePosition(node: AngularNode, intersectionPoint: XYPosition): Position {
  const nodePos = (node as any).positionAbsolute || node.position;
  const nx = Math.round(nodePos.x);
  const ny = Math.round(nodePos.y);
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);

  const { width = 150, height = 36 } = node.measured ?? {};

  if (px <= nx + 1) {
    return Position.Left;
  }
  if (px >= nx + width - 1) {
    return Position.Right;
  }
  if (py <= ny + 1) {
    return Position.Top;
  }
  if (py >= ny + height - 1) {
    return Position.Bottom;
  }

  return Position.Top;
}

// 返回創建邊線所需的參數 (sx, sy, tx, ty, sourcePos, targetPos)
export function getEdgeParams(source: AngularNode, target: AngularNode) {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);

  const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
  const targetPos = getEdgePosition(target, targetIntersectionPoint);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  };
}

type NodesAndEdges = {
  nodes: AngularNode[];
  edges: AngularEdge[];
};

export function createElements(): NodesAndEdges {
  const nodes: AngularNode[] = [];
  const edges: AngularEdge[] = [];

  const center = { 
    x: (typeof window !== 'undefined' ? window.innerWidth : 800) / 2, 
    y: (typeof window !== 'undefined' ? window.innerHeight : 600) / 2 
  };

  nodes.push({ 
    id: 'target', 
    data: { label: 'Target' }, 
    position: center,
    type: 'default'
  });

  for (let i = 0; i < 8; i++) {
    const degrees = i * (360 / 8);
    const radians = degrees * (Math.PI / 180);
    const x = 250 * Math.cos(radians) + center.x;
    const y = 250 * Math.sin(radians) + center.y;

    const isChild = i === 1;
    nodes.push({
      id: `${i}`,
      data: { label: 'Source' },
      position: isChild ? { x: 0, y: 0 } : { x, y },
      parentId: isChild ? '0' : undefined,
      type: 'default'
    });

    edges.push({
      id: `edge-${i}`,
      target: 'target',
      source: `${i}`,
      type: 'floating',
    });
  }

  return { nodes, edges };
}