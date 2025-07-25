/**
 * Control position types for resize handles
 */
export enum ControlPosition {
  Top = 'top',
  TopRight = 'top-right',
  Right = 'right',
  BottomRight = 'bottom-right',
  Bottom = 'bottom',
  BottomLeft = 'bottom-left',
  Left = 'left',
  TopLeft = 'top-left'
}

/**
 * Control line position types for resize lines
 */
export enum ControlLinePosition {
  Top = 'top',
  Right = 'right',
  Bottom = 'bottom',
  Left = 'left'
}

/**
 * Resize control variant types
 */
export enum ResizeControlVariant {
  Handle = 'handle',
  Line = 'line'
}

/**
 * Resize direction types
 */
export enum ResizeControlDirection {
  Horizontal = 'horizontal',
  Vertical = 'vertical'
}

/**
 * Resize boundary constraints
 */
export interface ResizeBoundaries {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
}

/**
 * Resize parameters passed to callbacks
 */
export interface ResizeParams {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Should resize callback type
 */
export type ShouldResize = (event: MouseEvent, params: ResizeParams) => boolean;

/**
 * Resize start callback type
 */
export type OnResizeStart = (event: MouseEvent, params: ResizeParams) => void;

/**
 * Resize callback type
 */
export type OnResize = (event: MouseEvent, params: ResizeParams) => void;

/**
 * Resize end callback type
 */
export type OnResizeEnd = (event: MouseEvent, params: ResizeParams) => void;

/**
 * @expand
 */
export interface NodeResizerProps {
  /**
   * Id of the node it is resizing.
   * @remarks optional if used inside custom node
   */
  nodeId?: string;
  /** Color of the resize handle. */
  color?: string;
  /** Class name applied to handle. */
  handleClassName?: string;
  /** Style applied to handle. */
  handleStyle?: { [key: string]: any };
  /** Class name applied to line. */
  lineClassName?: string;
  /** Style applied to line. */
  lineStyle?: { [key: string]: any };
  /**
   * Are the controls visible.
   * @default true
   */
  isVisible?: boolean;
  /**
   * Minimum width of node.
   * @default 10
   */
  minWidth?: number;
  /**
   * Minimum height of node.
   * @default 10
   */
  minHeight?: number;
  /**
   * Maximum width of node.
   * @default Number.MAX_VALUE
   */
  maxWidth?: number;
  /**
   * Maximum height of node.
   * @default Number.MAX_VALUE
   */
  maxHeight?: number;
  /**
   * Keep aspect ratio when resizing.
   * @default false
   */
  keepAspectRatio?: boolean;
  /**
   * Scale the controls with the zoom level.
   * @default true
   */
  autoScale?: boolean;
  /** Callback to determine if node should resize. */
  shouldResize?: ShouldResize;
  /** Callback called when resizing starts. */
  onResizeStart?: OnResizeStart;
  /** Callback called when resizing. */
  onResize?: OnResize;
  /** Callback called when resizing ends. */
  onResizeEnd?: OnResizeEnd;
}

/**
 * @expand
 */
export interface ResizeControlProps extends Pick<
  NodeResizerProps,
  | 'nodeId'
  | 'color'
  | 'minWidth'
  | 'minHeight'
  | 'maxWidth'
  | 'maxHeight'
  | 'keepAspectRatio'
  | 'shouldResize'
  | 'autoScale'
  | 'onResizeStart'
  | 'onResize'
  | 'onResizeEnd'
> {
  /**
   * Position of the control.
   * @example ControlPosition.TopLeft, ControlPosition.TopRight,
   * ControlPosition.BottomLeft, ControlPosition.BottomRight
   */
  position?: ControlPosition;
  /**
   * Variant of the control.
   * @default "handle"
   * @example ResizeControlVariant.Handle, ResizeControlVariant.Line
   */
  variant?: ResizeControlVariant;
  /**
   * The direction the user can resize the node.
   * If not provided, the user can resize in any direction.
   */
  resizeDirection?: ResizeControlDirection;
  className?: string;
  style?: { [key: string]: any };
}

/**
 * @expand
 */
export interface ResizeControlLineProps extends Omit<ResizeControlProps, 'resizeDirection' | 'position'> {
  position?: ControlLinePosition;
}