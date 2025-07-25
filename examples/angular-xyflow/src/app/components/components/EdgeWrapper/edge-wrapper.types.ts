import { HandleType } from '../../../types/edge';

/**
 * Edge change event types
 */
export interface EdgeChangeEvent {
  id: string;
  [key: string]: any;
}

/**
 * Mouse event handlers for edges
 */
export interface EdgeMouseEvents {
  onClick?: (event: MouseEvent, edge: any) => void;
  onDoubleClick?: (event: MouseEvent, edge: any) => void;
  onContextMenu?: (event: MouseEvent, edge: any) => void;
  onMouseEnter?: (event: MouseEvent, edge: any) => void;
  onMouseMove?: (event: MouseEvent, edge: any) => void;
  onMouseLeave?: (event: MouseEvent, edge: any) => void;
}

/**
 * Reconnection event handlers
 */
export interface EdgeReconnectionEvents {
  onReconnect?: (edge: any, connection: any) => void;
  onReconnectStart?: (event: MouseEvent, edge: any, handleType: 'source' | 'target') => void;
  onReconnectEnd?: (event: MouseEvent | TouchEvent, edge: any, handleType: 'source' | 'target', connectionState: any) => void;
}

/**
 * Edge position data
 */
export interface EdgePosition {
  sourceX: number | null;
  sourceY: number | null;
  targetX: number | null;
  targetY: number | null;
  sourcePosition: any | null;
  targetPosition: any | null;
}

/**
 * Edge wrapper component properties
 */
export interface EdgeWrapperProps extends EdgeMouseEvents, EdgeReconnectionEvents {
  /** Edge ID */
  id: string;
  /** Whether edges can be focused */
  edgesFocusable?: boolean;
  /** Whether edges can be reconnected */
  edgesReconnectable?: boolean;
  /** Whether elements can be selected */
  elementsSelectable?: boolean;
  /** Reconnection radius */
  reconnectRadius?: number;
  /** React Flow instance ID */
  rfId?: string;
  /** Available edge types */
  edgeTypes?: Record<string, any>;
  /** CSS class for preventing pan */
  noPanClassName?: string;
  /** Error handler */
  onError?: (code: string, message: string) => void;
  /** Disable keyboard accessibility */
  disableKeyboardA11y?: boolean;
}

/**
 * Mock edge type
 */
export interface MockEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  selected?: boolean;
  animated?: boolean;
  hidden?: boolean;
  data?: any;
  style?: any;
  label?: string;
  labelStyle?: any;
  labelShowBg?: boolean;
  labelBgStyle?: any;
  labelBgPadding?: number;
  labelBgBorderRadius?: number;
  className?: string;
  zIndex?: number;
  focusable?: boolean;
  reconnectable?: boolean | HandleType;
  selectable?: boolean;
  deletable?: boolean;
  markerStart?: string;
  markerEnd?: string;
  pathOptions?: any;
  interactionWidth?: number;
  ariaRole?: string;
  ariaLabel?: string | null;
  domAttributes?: Record<string, any>;
}

/**
 * Mock node type
 */
export interface MockNode {
  id: string;
  position: { x: number; y: number };
  data?: any;
  type?: string;
  selected?: boolean;
  dragging?: boolean;
  selectable?: boolean;
  deletable?: boolean;
  width?: number;
  height?: number;
}