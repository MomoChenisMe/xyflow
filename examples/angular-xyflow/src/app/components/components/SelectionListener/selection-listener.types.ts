import { NodeBase } from '../Nodes/nodes.types';

/**
 * 選擇變化參數
 */
export interface SelectionChangeParams<NodeType = NodeBase, EdgeType = any> {
  /** 選中的節點 */
  nodes: NodeType[];
  /** 選中的邊緣 */
  edges: EdgeType[];
}

/**
 * 選擇變化處理函數
 */
export type OnSelectionChangeFunc<NodeType = NodeBase, EdgeType = any> = (
  params: SelectionChangeParams<NodeType, EdgeType>
) => void;

/**
 * SelectionListener 組件屬性
 */
export interface SelectionListenerProps<NodeType = NodeBase, EdgeType = any> {
  /** 選擇變化回調函數 */
  onSelectionChange?: OnSelectionChangeFunc<NodeType, EdgeType>;
}

/**
 * 選擇器切片類型
 */
export interface SelectorSlice<NodeType = NodeBase, EdgeType = any> {
  /** 選中的節點 */
  selectedNodes: NodeType[];
  /** 選中的邊緣 */
  selectedEdges: EdgeType[];
}