// 基於 @xyflow/system 的邊緣類型定義
export interface Edge<T = any> {
  id: string;
  type?: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  animated?: boolean;
  hidden?: boolean;
  deletable?: boolean;
  selectable?: boolean;
  data?: T;
  selected?: boolean;
  markerStart?: string | EdgeMarker;
  markerEnd?: string | EdgeMarker;
  zIndex?: number;
  ariaLabel?: string;
  interactionWidth?: number;
}

export interface EdgeMarker {
  type: string;
  color?: string;
  width?: number;
  height?: number;
  markerUnits?: string;
  orient?: string;
  strokeWidth?: number;
}