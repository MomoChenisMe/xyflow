import { Position } from '@xyflow/system';

interface XYPosition {
  x: number;
  y: number;
}

interface InternalNode {
  internals: {
    positionAbsolute: XYPosition;
  };
  measured?: {
    width: number;
    height: number;
  };
}

// 返回兩個節點中心之間線段與節點邊界的交點
function getNodeIntersection(intersectionNode: InternalNode, targetNode: InternalNode): XYPosition {
  // https://math.stackexchange.com/questions/1724792/an-algorithm-for-finding-the-intersection-point-between-a-center-of-vision-and-a
  
  const { width: intersectionNodeWidth, height: intersectionNodeHeight } = intersectionNode.measured!;
  const intersectionNodePosition = intersectionNode.internals.positionAbsolute;
  const targetPosition = targetNode.internals.positionAbsolute!;
  
  const w = intersectionNodeWidth! / 2;
  const h = intersectionNodeHeight! / 2;
  
  const x2 = intersectionNodePosition.x + w;
  const y2 = intersectionNodePosition.y + h;
  const x1 = targetPosition.x + w;
  const y1 = targetPosition.y + h;
  
  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1);
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + x2;
  const y = h * (-xx3 + yy3) + y2;
  
  return { x, y };
}

// 返回節點相對於交點的位置（上、右、下或左）
function getEdgePosition(node: InternalNode, intersectionPoint: XYPosition): Position {
  const n = { ...node.internals.positionAbsolute, ...node };
  const nx = Math.round(n.x!);
  const ny = Math.round(n.y!);
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);
  
  if (px <= nx + 1) {
    return Position.Left;
  }
  if (px >= nx + node.measured?.width! - 1) {
    return Position.Right;
  }
  if (py <= ny + 1) {
    return Position.Top;
  }
  if (py >= n.y! + node.measured?.height! - 1) {
    return Position.Bottom;
  }
  
  return Position.Top;
}

// 返回創建邊緣所需的參數 (sx, sy, tx, ty, sourcePos, targetPos)
export function getEdgeParams(source: InternalNode, target: InternalNode) {
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