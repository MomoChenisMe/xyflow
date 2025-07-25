/**
 * Angular XYFlow 工具類型定義
 * 
 * 定義工具類型、泛型輔助類型和樣式相關類型
 * 包括類型守衛、類型轉換、樣式工具等
 */

import { Type, Signal, ComponentRef as NgComponentRef } from '@angular/core';
import { AngularNode } from './nodes';
import { AngularEdge } from './edges';

// ===================
// 基礎工具類型
// ===================

/**
 * 深度部分類型
 * 遞歸地將所有屬性設為可選
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 深度必需類型
 * 遞歸地將所有屬性設為必需
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * 必需鍵
 * 提取對象中必需的鍵
 */
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * 可選鍵
 * 提取對象中可選的鍵
 */
export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

/**
 * 按類型選擇
 * 根據值類型篩選對象屬性
 */
export type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

/**
 * 忽略類型
 * 排除指定類型的屬性
 */
export type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};

/**
 * 非空類型
 * 排除 null 和 undefined
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * 可能為 null 的類型
 */
export type Nullable<T> = T | null;

/**
 * 可能為 undefined 的類型
 */
export type Optional<T> = T | undefined;

/**
 * 條件類型
 * 根據條件選擇類型
 */
export type If<C extends boolean, T, F = never> = C extends true ? T : F;

/**
 * 值的類型
 * 提取對象值的聯合類型
 */
export type ValueOf<T> = T[keyof T];

/**
 * 數組元素類型
 * 提取數組元素的類型
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * 函數參數類型
 * 提取函數參數的類型
 */
export type Parameters<T extends (...args: any[]) => any> = 
  T extends (...args: infer P) => any ? P : never;

/**
 * 函數返回類型
 * 提取函數返回值的類型
 */
export type ReturnType<T extends (...args: any[]) => any> = 
  T extends (...args: any[]) => infer R ? R : never;

// ===================
// 節點和邊線工具類型
// ===================

/**
 * 節點數據類型提取
 */
export type NodeData<T> = T extends AngularNode<infer D, any> ? D : any;

/**
 * 節點類型提取
 */
export type NodeType<T> = T extends AngularNode<any, infer U> ? U : string;

/**
 * 邊線數據類型提取
 */
export type EdgeData<T> = T extends AngularEdge<infer D, any> ? D : any;

/**
 * 邊線類型提取
 */
export type EdgeType<T> = T extends AngularEdge<any, infer U> ? U : string;

/**
 * 節點類型守衛
 */
export type NodeTypeGuard<T extends AngularNode = AngularNode> = (node: unknown) => node is T;

/**
 * 邊線類型守衛
 */
export type EdgeTypeGuard<T extends AngularEdge = AngularEdge> = (edge: unknown) => edge is T;

/**
 * 元素類型聯合
 */
export type FlowElement = AngularNode | AngularEdge;

/**
 * 元素類型區分
 */
export type ElementType = 'node' | 'edge';

/**
 * 元素 ID 映射
 */
export type ElementMap<T> = Map<string, T>;

/**
 * 元素查找表
 */
export type ElementLookup<T> = Record<string, T>;

// ===================
// 組件相關類型
// ===================

/**
 * Angular 組件引用
 */
export type ComponentRef<T = any> = NgComponentRef<T>;

/**
 * 組件類型映射
 */
export type ComponentTypeMap<T = any> = Record<string, Type<T>>;

/**
 * 組件工廠
 */
export type ComponentFactory<T = any> = (data?: any) => Type<T>;

/**
 * 組件實例
 */
export type ComponentInstance<T = any> = T;

/**
 * 組件上下文
 */
export type ComponentContext<T = any> = {
  $implicit: T;
  index?: number;
  count?: number;
  first?: boolean;
  last?: boolean;
  even?: boolean;
  odd?: boolean;
};

// ===================
// 樣式相關類型
// ===================

/**
 * CSS 屬性類型
 */
export type CSSProperties = Partial<CSSStyleDeclaration> & Record<string, any>;

/**
 * 樣式值類型
 */
export type StyleValue = string | number | null | undefined;

/**
 * 樣式對象類型
 */
export type StyleObject = Record<string, StyleValue>;

/**
 * 類名值類型
 */
export type ClassValue = 
  | string
  | number
  | boolean
  | undefined
  | null
  | ClassValue[]
  | { [className: string]: boolean | undefined | null };

/**
 * 樣式綁定類型
 */
export type StyleBinding = StyleObject | string | null | undefined;

/**
 * 類名綁定類型
 */
export type ClassBinding = ClassValue | ClassValue[];

/**
 * CSS 變數類型
 */
export type CSSVariable = `--${string}`;

/**
 * CSS 變數值類型
 */
export type CSSVariableValue = string | number;

/**
 * CSS 變數映射
 */
export type CSSVariableMap = Record<CSSVariable, CSSVariableValue>;

/**
 * 主題變數類型
 */
export interface ThemeVariables {
  // 顏色變數
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
    accent: string;
  };
  
  // 尺寸變數
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  // 字體變數
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    fontWeight: {
      normal: string;
      medium: string;
      bold: string;
    };
  };
  
  // 邊框變數
  borders: {
    radius: {
      sm: string;
      md: string;
      lg: string;
    };
    width: {
      thin: string;
      medium: string;
      thick: string;
    };
  };
  
  // 陰影變數
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  
  // 過渡變數
  transitions: {
    fast: string;
    medium: string;
    slow: string;
  };
}

// ===================
// 信號相關類型
// ===================

/**
 * 信號類型
 */
export type SignalType<T> = Signal<T>;

/**
 * 可寫信號類型
 */
export type WritableSignalType<T> = import('@angular/core').WritableSignal<T>;

/**
 * 計算信號類型
 */
export type ComputedSignalType<T> = import('@angular/core').Signal<T>;

/**
 * 信號輸入類型
 */
export type SignalInput<T> = T | Signal<T>;

/**
 * 信號或值類型
 */
export type MaybeSignal<T> = T | Signal<T>;

/**
 * 響應式值類型
 */
export type ReactiveValue<T> = Signal<T> | T;

// ===================
// 事件相關類型
// ===================

/**
 * 事件處理器類型
 */
export type EventHandler<T extends Event = Event> = (event: T) => void;

/**
 * 異步事件處理器類型
 */
export type AsyncEventHandler<T extends Event = Event> = (event: T) => Promise<void>;

/**
 * 可取消事件處理器類型
 */
export type CancelableEventHandler<T extends Event = Event> = (event: T) => boolean | void;

/**
 * 事件監聽器選項
 */
export interface EventListenerOptions {
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
  signal?: AbortSignal;
}

/**
 * 事件發射器類型
 */
export interface EventEmitter<T = any> {
  emit(value: T): void;
  subscribe(callback: (value: T) => void): () => void;
  unsubscribe(): void;
}

// ===================
// 泛型工具類型
// ===================

/**
 * 擴展類型
 * 合併兩個類型，第二個類型的屬性會覆蓋第一個
 */
export type Extend<T, U> = Omit<T, keyof U> & U;

/**
 * 合併類型
 * 合併多個類型
 */
export type Merge<T extends Record<string, any>[]> = 
  T extends [infer First, ...infer Rest]
    ? First extends Record<string, any>
      ? Rest extends Record<string, any>[]
        ? Merge<Rest> extends Record<string, any>
          ? Extend<First, Merge<Rest>>
          : First
        : First
      : never
    : {};

/**
 * 重寫類型
 * 用新的類型定義重寫現有類型的屬性
 */
export type Override<T, U> = Omit<T, keyof U> & U;

/**
 * 部分覆蓋類型
 * 部分重寫現有類型的屬性
 */
export type PartialOverride<T, U> = Omit<T, keyof U> & Partial<U>;

/**
 * 嚴格類型
 * 確保類型 T 只包含 U 中定義的屬性
 */
export type Exact<T, U> = T extends U ? (U extends T ? T : never) : never;

/**
 * 互斥類型
 * 確保 T 和 U 不能同時存在
 */
export type XOR<T, U> = (T | U) extends object 
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U;

/**
 * 排除類型
 * 從 T 中排除與 U 相同的屬性
 */
export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

// ===================
// 配置相關類型
// ===================

/**
 * 配置選項基礎類型
 */
export interface BaseConfig {
  /** 啟用調試模式 */
  debug?: boolean;
  
  /** 自定義名稱 */
  name?: string;
  
  /** 版本信息 */
  version?: string;
  
  /** 元數據 */
  metadata?: Record<string, any>;
}

/**
 * 可選配置類型
 */
export type OptionalConfig<T extends BaseConfig> = Partial<T>;

/**
 * 必需配置類型
 */
export type RequiredConfig<T extends BaseConfig> = Required<T>;

/**
 * 配置工廠類型
 */
export type ConfigFactory<T extends BaseConfig> = () => T | Promise<T>;

/**
 * 配置驗證器類型
 */
export type ConfigValidator<T extends BaseConfig> = (config: T) => boolean | string[];

// ===================
// 錯誤處理類型
// ===================

/**
 * 錯誤類型
 */
export interface FlowError extends Error {
  code?: string;
  context?: any;
  timestamp?: number;
}

/**
 * 錯誤處理器類型
 */
export type ErrorHandler = (error: FlowError) => void;

/**
 * 結果類型
 * 表示可能成功或失敗的操作結果
 */
export type Result<T, E = FlowError> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * 可能失敗的類型
 */
export type Failable<T, E = FlowError> = T | E;

/**
 * 安全操作類型
 */
export type SafeOperation<T> = () => Result<T>;

// ===================
// 性能相關類型
// ===================

/**
 * 節流選項
 */
export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

/**
 * 防抖選項
 */
export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

/**
 * 性能標記
 */
export interface PerformanceMark {
  name: string;
  startTime: number;
  duration?: number;
  metadata?: any;
}

/**
 * 性能監控器
 */
export interface PerformanceMonitor {
  mark(name: string): void;
  measure(name: string, startMark?: string, endMark?: string): PerformanceMark;
  clearMarks(name?: string): void;
  getMarks(name?: string): PerformanceMark[];
}

// ===================
// 輔助函數類型
// ===================

/**
 * 身份函數類型
 */
export type Identity<T> = (value: T) => T;

/**
 * 預測函數類型
 */
export type Predicate<T> = (value: T) => boolean;

/**
 * 映射函數類型
 */
export type Mapper<T, U> = (value: T) => U;

/**
 * 歸約函數類型
 */
export type Reducer<T, U> = (accumulator: U, currentValue: T, index: number) => U;

/**
 * 比較函數類型
 */
export type Comparator<T> = (a: T, b: T) => number;

/**
 * 格式化函數類型
 */
export type Formatter<T> = (value: T) => string;

/**
 * 解析函數類型
 */
export type Parser<T> = (value: string) => T;

/**
 * 序列化函數類型
 */
export type Serializer<T> = (value: T) => string;

/**
 * 反序列化函數類型
 */
export type Deserializer<T> = (value: string) => T;

// ===================
// 調試和開發工具類型
// ===================

/**
 * 調試信息類型
 */
export interface DebugInfo {
  timestamp: number;
  level: 'log' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  context?: string;
}

/**
 * 調試選項
 */
export interface DebugOptions {
  enabled: boolean;
  level: 'log' | 'warn' | 'error' | 'debug';
  prefix?: string;
  timestamp?: boolean;
  context?: boolean;
}

/**
 * 開發工具配置
 */
export interface DevToolsConfig {
  enabled: boolean;
  name?: string;
  trace?: boolean;
  traceLimit?: number;
  actionSanitizer?: (action: any) => any;
  stateSanitizer?: (state: any) => any;
}

/**
 * 類型檢查器
 */
export type TypeChecker<T> = (value: unknown) => value is T;

/**
 * 類型斷言
 */
export type TypeAssertion<T> = (value: unknown, message?: string) => asserts value is T;