import { NodeBase } from '../Nodes/nodes.types';

/**
 * 節點選擇組件屬性
 */
export interface NodesSelectionProps<NodeType = NodeBase> {
  /** 選擇右鍵菜單事件 */
  onSelectionContextMenu?: (event: MouseEvent, nodes: NodeType[]) => void;
  /** 禁用平移的類名 */
  noPanClassName?: string;
  /** 禁用鍵盤無障礙功能 */
  disableKeyboardA11y: boolean;
}

/**
 * 選擇邊界信息
 */
export interface SelectionBounds {
  /** 選擇區域寬度 */
  width: number | null;
  /** 選擇區域高度 */
  height: number | null;
  /** X 坐標 */
  x: number;
  /** Y 坐標 */
  y: number;
}

/**
 * 變換字符串信息
 */
export interface TransformInfo {
  /** CSS 變換字符串 */
  transformString: string;
  /** 是否有用戶選擇活動 */
  userSelectionActive: boolean;
}