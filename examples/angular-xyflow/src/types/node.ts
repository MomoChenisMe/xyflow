// 基於 @xyflow/system 的節點類型定義
export interface Node<T = any> {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: T;
  sourcePosition?: 'top' | 'right' | 'bottom' | 'left';
  targetPosition?: 'top' | 'right' | 'bottom' | 'left';
  hidden?: boolean;
  selected?: boolean;
  dragging?: boolean;
  draggable?: boolean;
  selectable?: boolean;
  connectable?: boolean;
  deletable?: boolean;
  dragHandle?: string;
  width?: number;
  height?: number;
  parentId?: string;
  zIndex?: number;
  extent?: 'parent' | [[number, number], [number, number]];
  expandParent?: boolean;
  ariaLabel?: string;
  className?: string;
}