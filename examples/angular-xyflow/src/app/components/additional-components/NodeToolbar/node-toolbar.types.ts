/**
 * Position enum for toolbar placement
 */
export enum Position {
  Top = 'top',
  TopLeft = 'top-left',
  TopRight = 'top-right',
  Right = 'right',
  Bottom = 'bottom',
  BottomLeft = 'bottom-left',
  BottomRight = 'bottom-right',
  Left = 'left'
}

/**
 * Alignment enum for toolbar positioning
 */
export enum Align {
  Start = 'start',
  Center = 'center',
  End = 'end'
}

/**
 * Node internal data structure (simplified)
 */
export interface InternalNode {
  id: string;
  selected: boolean;
  internals: {
    positionAbsolute: { x: number; y: number };
    z: number;
  };
  measured: {
    width: number;
    height: number;
  };
}

/**
 * Node lookup map type
 */
export type NodeLookup = Map<string, InternalNode>;

/**
 * Transform data structure
 */
export interface Transform {
  x: number;
  y: number;
  zoom: number;
}

/**
 * @expand
 */
export interface NodeToolbarProps {
  /**
   * By passing in an array of node id's you can render a single tooltip for a group or collection
   * of nodes.
   */
  nodeId?: string | string[];
  /** If `true`, node toolbar is visible even if node is not selected. */
  isVisible?: boolean;
  /**
   * Position of the toolbar relative to the node.
   * @default Position.Top
   * @example Position.TopLeft, Position.TopRight, Position.BottomLeft, Position.BottomRight
   */
  position?: Position;
  /**
   * The space between the node and the toolbar, measured in pixels.
   * @default 10
   */
  offset?: number;
  /**
   * Align the toolbar relative to the node.
   * @default "center"
   * @example Align.Start, Align.Center, Align.End
   */
  align?: Align;
  /** CSS class name */
  className?: string;
  /** CSS styles */
  style?: { [key: string]: any };
  /** Additional HTML attributes */
  [key: string]: any;
}