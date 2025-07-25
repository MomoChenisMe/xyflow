export * from './handle.component';
export * from './handle.types';

// Re-export types for external use
export type { 
  HandleProps, 
  HandleType, 
  Connection, 
  ConnectionState,
  OnConnect,
  OnConnectStart,
  OnConnectEnd,
  IsValidConnection 
} from './handle.types';

export { ConnectionMode, Position } from './handle.types';