/**
 * 基礎邊緣組件屬性
 */
export interface BaseEdgeProps {
  /** 邊緣ID */
  id: string;
  /** 源節點位置 X */
  sourceX: number;
  /** 源節點位置 Y */
  sourceY: number;
  /** 目標節點位置 X */
  targetX: number;
  /** 目標節點位置 Y */
  targetY: number;
  /** 源節點位置方向 */
  sourcePosition?: any;
  /** 目標節點位置方向 */
  targetPosition?: any;
  /** 邊緣數據 */
  data?: any;
  /** 邊緣樣式 */
  style?: any;
  /** 是否選中 */
  selected?: boolean;
  /** 是否動畫 */
  animated?: boolean;
  /** 標籤文字 */
  label?: string;
  /** 標籤樣式 */
  labelStyle?: any;
  /** 是否顯示標籤背景 */
  labelShowBg?: boolean;
  /** 標籤背景樣式 */
  labelBgStyle?: any;
  /** 標籤背景內距 */
  labelBgPadding?: [number, number];
  /** 標籤背景圓角 */
  labelBgBorderRadius?: number;
  /** 交互寬度 */
  interactionWidth?: number;
  /** 起始標記 */
  markerStart?: string;
  /** 結束標記 */
  markerEnd?: string;
  /** 路徑字符串 */
  path: string;
}

/**
 * 邊緣組件通用屬性
 */
export interface EdgeComponentProps extends Omit<BaseEdgeProps, 'path'> {
  /** 邊緣類型 */
  type?: string;
  /** 源節點ID */
  source: string;
  /** 目標節點ID */
  target: string;
  /** 源連接點ID */
  sourceHandleId?: string | null;
  /** 目標連接點ID */
  targetHandleId?: string | null;
  /** 是否可選擇 */
  selectable?: boolean;
  /** 是否可刪除 */
  deletable?: boolean;
}

/**
 * 貝茲曲線邊緣屬性
 */
export interface BezierEdgeProps extends EdgeComponentProps {
  /** 曲率設置 */
  curvature?: number;
  /** 路徑選項 */
  pathOptions?: {
    curvature?: number;
  };
}

/**
 * 簡化貝茲曲線邊緣屬性
 */
export interface SimpleBezierEdgeProps extends EdgeComponentProps {
  /** 路徑選項 */
  pathOptions?: any;
}

/**
 * 平滑步進邊緣屬性
 */
export interface SmoothStepEdgeProps extends EdgeComponentProps {
  /** 邊框圓角 */
  borderRadius?: number;
  /** 步進偏移 */
  offset?: number;
  /** 路徑選項 */
  pathOptions?: {
    borderRadius?: number;
    offset?: number;
  };
}

/**
 * 步進邊緣屬性
 */
export interface StepEdgeProps extends EdgeComponentProps {
  /** 步進偏移 */
  offset?: number;
  /** 路徑選項 */
  pathOptions?: {
    offset?: number;
  };
}

/**
 * 直線邊緣屬性
 */
export interface StraightEdgeProps extends EdgeComponentProps {
  /** 路徑選項 */
  pathOptions?: any;
}

/**
 * 邊緣文字屬性
 */
export interface EdgeTextProps {
  /** 文字位置 X */
  x: number;
  /** 文字位置 Y */
  y: number;
  /** 標籤文字 */
  label?: string;
  /** 標籤樣式 */
  labelStyle?: any;
  /** 是否顯示背景 */
  labelShowBg?: boolean;
  /** 背景樣式 */
  labelBgStyle?: any;
  /** 背景內距 */
  labelBgPadding?: [number, number];
  /** 背景圓角 */
  labelBgBorderRadius?: number;
  /** CSS 類名 */
  className?: string;
}

/**
 * 邊緣錨點屬性
 */
export interface EdgeAnchorProps {
  /** 位置方向 */
  position: any;
  /** 中心點 X */
  centerX: number;
  /** 中心點 Y */
  centerY: number;
  /** 錨點半徑 */
  radius?: number;
  /** 錨點類型 */
  type: 'source' | 'target';
  /** 滑鼠按下事件 */
  onMouseDown?: (event: MouseEvent) => void;
  /** 滑鼠進入事件 */
  onMouseEnter?: (event: MouseEvent) => void;
  /** 滑鼠離開事件 */
  onMouseOut?: (event: MouseEvent) => void;
}

/**
 * 位置方向枚舉 - 模擬 @xyflow/system 的 Position
 */
export enum Position {
  Left = 'left',
  Top = 'top',
  Right = 'right',
  Bottom = 'bottom',
}

/**
 * 邊緣類型映射
 */
export interface EdgeTypes {
  [key: string]: any;
}

/**
 * 路徑計算結果
 */
export interface PathResult {
  path: string;
  labelX?: number;
  labelY?: number;
}