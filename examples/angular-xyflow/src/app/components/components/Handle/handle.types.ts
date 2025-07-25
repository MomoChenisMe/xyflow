import { Position } from '../Edges/edges.types';

// Re-export Position for use by other components
export { Position };

/**
 * 連接類型
 */
export type HandleType = 'source' | 'target';

/**
 * 連接模式
 */
export enum ConnectionMode {
  Strict = 'strict',
  Loose = 'loose',
}

/**
 * 連接接口
 */
export interface Connection {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

/**
 * 連接狀態
 */
export interface ConnectionState {
  fromHandle?: {
    nodeId: string;
    id: string | null;
    type: HandleType;
    position: Position;
  } | null;
  toHandle?: {
    nodeId: string;
    id: string | null;
    type: HandleType;
    position: Position;
  } | null;
  isValid: boolean;
  inProgress?: boolean;
  toPosition?: Position | null;
}

/**
 * 連接開始處理器
 */
export type OnConnectStart = (
  event: MouseEvent | TouchEvent,
  params: { nodeId: string; handleId: string | null; handleType: HandleType }
) => void;

/**
 * 連接結束處理器
 */
export type OnConnectEnd = (
  event: MouseEvent | TouchEvent,
  connectionState: Omit<ConnectionState, 'inProgress'>
) => void;

/**
 * 連接處理器
 */
export type OnConnect = (connection: Connection) => void;

/**
 * 連接驗證器
 */
export type IsValidConnection = (connection: Connection) => boolean;

/**
 * Handle 組件屬性
 */
export interface HandleProps {
  /** Handle 類型 */
  type?: HandleType;
  /** Handle 位置 */
  position?: Position;
  /** Handle ID */
  id?: string;
  /** 是否可連接 */
  isConnectable?: boolean;
  /** 是否可作為連接起點 */
  isConnectableStart?: boolean;
  /** 是否可作為連接終點 */
  isConnectableEnd?: boolean;
  /** 連接驗證器 */
  isValidConnection?: IsValidConnection;
  /** 連接完成回調 */
  onConnect?: OnConnect;
  /** CSS 類名 */
  className?: string;
  /** 樣式 */
  style?: any;
  /** 滑鼠按下事件 */
  onMouseDown?: (event: MouseEvent) => void;
  /** 觸摸開始事件 */
  onTouchStart?: (event: TouchEvent) => void;
  /** 點擊事件 */
  onClick?: (event: MouseEvent) => void;
}

/**
 * Handle 連接選擇器狀態
 */
export interface HandleConnectionState {
  connectingFrom: boolean;
  connectingTo: boolean;
  clickConnecting: boolean;
  isPossibleEndHandle: boolean;
  connectionInProcess: boolean;
  clickConnectionInProcess: boolean;
  valid: boolean;
}

/**
 * 點擊連接 Handle
 */
export interface ClickConnectionHandle {
  nodeId: string;
  type: HandleType;
  id: string | null;
}

/**
 * Handle 系統屬性 - 模擬 @xyflow/system 的 HandlePropsSystem
 */
export interface HandlePropsSystem {
  type?: HandleType;
  position?: Position;
  id?: string;
  isConnectable?: boolean;
  isConnectableStart?: boolean;
  isConnectableEnd?: boolean;
  isValidConnection?: IsValidConnection;
}