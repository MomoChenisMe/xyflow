import { Position } from './node';

// 邊緣基礎類型
export interface Edge<
  EdgeData extends Record<string, unknown> = Record<string, unknown>,
  EdgeType extends string | undefined = string | undefined
> {
  id: string;
  type?: EdgeType;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  data?: EdgeData;
  style?: Record<string, any>;
  className?: string;
  animated?: boolean;
  selected?: boolean;
  deletable?: boolean;
  selectable?: boolean;
  focusable?: boolean;
  label?: string;
  labelStyle?: Record<string, any>;
  interactionWidth?: number;
  markerStart?: EdgeMarker;
  markerEnd?: EdgeMarker;
  reconnectable?: boolean | HandleType;
  ariaRole?: string;
}

// 邊緣位置資訊
export interface EdgePosition {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
}

// 邊緣標記
export interface EdgeMarker {
  type: MarkerType;
  color?: string;
  width?: number;
  height?: number;
  markerUnits?: string;
  orient?: string;
  strokeWidth?: number;
}

// 標記類型
export enum MarkerType {
  Arrow = 'arrow',
  ArrowClosed = 'arrowclosed',
}

// Handle 類型
export type HandleType = 'source' | 'target';

// 連接線類型
export enum ConnectionLineType {
  Bezier = 'bezier',
  Straight = 'straight',
  Step = 'step',
  SmoothStep = 'smoothstep',
  SimpleBezier = 'simplebezier',
}

// 內建邊緣類型
export type BuiltInEdge = 
  | Edge<any, 'default'>
  | Edge<any, 'straight'>
  | Edge<any, 'step'>
  | Edge<any, 'smoothstep'>
  | Edge<any, 'simplebezier'>;

// 邊緣變更類型
export type EdgeChange =
  | EdgeSelectionChange
  | EdgeRemoveChange
  | EdgeAddChange
  | EdgeReplaceChange;

export interface EdgeSelectionChange {
  id: string;
  type: 'selection';
  selected: boolean;
}

export interface EdgeRemoveChange {
  id: string;
  type: 'remove';
}

export interface EdgeAddChange<EdgeType extends Edge = Edge> {
  id: string;
  type: 'add';
  edge: EdgeType;
}

export interface EdgeReplaceChange<EdgeType extends Edge = Edge> {
  id: string;
  type: 'replace';
  edge: EdgeType;
}

// 連接狀態
export interface Connection {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

// 路徑選項
export interface BezierPathOptions {
  curvature?: number;
}

export interface SmoothStepPathOptions {
  offset?: number;
  borderRadius?: number;
}

export interface StepPathOptions {
  offset?: number;
}
