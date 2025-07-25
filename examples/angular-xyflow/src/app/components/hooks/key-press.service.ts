import { Injectable, computed, signal, effect, PLATFORM_ID, inject, Signal, WritableSignal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * 鍵盤按鍵代碼類型
 */
export type KeyCode = string | string[];

/**
 * 按鍵選項
 */
export interface KeyPressOptions {
  target?: EventTarget | null;
  actOnKeyUp?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  enabled?: boolean;
}

/**
 * 按鍵組合選項
 */
export interface KeyCombinationOptions extends KeyPressOptions {
  requireAll?: boolean; // 是否需要所有按鍵同時按下
}

/**
 * 按鍵序列選項
 */
export interface KeySequenceOptions extends KeyPressOptions {
  timeout?: number; // 序列超時時間（毫秒）
  resetOnWrongKey?: boolean; // 按錯鍵是否重置序列
}

/**
 * 按鍵事件信息
 */
export interface KeyEventInfo {
  key: string;
  code: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  timestamp: number;
  target: EventTarget | null;
}

/**
 * 按鍵狀態
 */
export interface KeyState {
  isPressed: boolean;
  pressedAt: number | null;
  releasedAt: number | null;
  pressCount: number;
}

/**
 * KeyPressService - Angular equivalent of React Flow's useKeyPress hook
 * 
 * 鍵盤按鍵服務 - 提供完整的鍵盤事件處理功能
 * 等價於 React Flow 的 useKeyPress hook，但功能更加強大
 * 
 * 主要功能：
 * - 單一按鍵監聽
 * - 按鍵組合監聽
 * - 按鍵序列監聽
 * - 按鍵狀態追蹤
 * - 自定義事件目標
 * - SSR 兼容
 * - 防抖和節流
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <div>
 *       <div>Space 鍵狀態: {{ spacePressed() ? '按下' : '釋放' }}</div>
 *       <div>Ctrl+S 狀態: {{ ctrlSPressed() ? '按下' : '釋放' }}</div>
 *       <div>箭頭鍵狀態: {{ arrowKeyPressed() ? '按下' : '釋放' }}</div>
 *       <div>Konami 序列: {{ konamiSequence() ? '完成' : '未完成' }}</div>
 *       
 *       <div>最近按鍵: {{ lastKeyPressed() }}</div>
 *       <div>按鍵計數: {{ keyPressCount() }}</div>
 *     </div>
 *   `
 * })
 * export class KeyboardComponent {
 *   // 單一按鍵
 *   spacePressed = this.keyPressService.useKeyPress(' ');
 *   
 *   // 按鍵組合
 *   ctrlSPressed = this.keyPressService.useKeyCombination(['Control', 's']);
 *   
 *   // 多個按鍵（任一按下）
 *   arrowKeyPressed = this.keyPressService.useKeyPress(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
 *   
 *   // 按鍵序列（Konami Code）
 *   konamiSequence = this.keyPressService.useKeySequence([
 *     'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
 *     'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
 *     'KeyB', 'KeyA'
 *   ]);
 *   
 *   lastKeyPressed = computed(() => this.keyPressService.getLastKeyPressed());
 *   keyPressCount = computed(() => this.keyPressService.getTotalKeyPressCount());
 *   
 *   constructor(private keyPressService: KeyPressService) {
 *     // 監聽全局按鍵事件
 *     effect(() => {
 *       if (this.spacePressed()) {
 *         console.log('Space key pressed!');
 *       }
 *     });
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class KeyPressService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  
  /** 按鍵狀態映射 */
  private keyStates = new Map<string, WritableSignal<KeyState>>();
  
  /** 按鍵事件歷史 */
  private keyEventHistory = signal<KeyEventInfo[]>([]);
  
  /** 當前按下的按鍵集合 */
  private currentlyPressed = signal<Set<string>>(new Set());
  
  /** 最大歷史記錄數 */
  private readonly maxHistorySize = 100;
  
  /** 全局按鍵計數 */
  private totalKeyPressCount = signal(0);
  
  /** 最後按下的按鍵 */
  private lastKeyPressed = signal<string | null>(null);
  
  /** 事件監聽器映射 */
  private eventListeners = new Map<EventTarget, Set<EventListener>>();

  constructor() {
    if (this.isBrowser) {
      this.setupGlobalKeyListeners();
    }
  }

  // ===================
  // 初始化
  // ===================

  /**
   * 設置全局按鍵監聽器
   */
  private setupGlobalKeyListeners(): void {
    if (!this.isBrowser) return;
    
    const handleKeyDown: EventListener = (evt: Event) => {
      this.handleKeyEvent(evt as KeyboardEvent, 'keydown');
    };
    
    const handleKeyUp: EventListener = (evt: Event) => {
      this.handleKeyEvent(evt as KeyboardEvent, 'keyup');
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // 存儲監聽器以便後續清理
    const listeners = new Set([handleKeyDown, handleKeyUp]);
    this.eventListeners.set(document, listeners);
  }

  /**
   * 處理鍵盤事件
   */
  private handleKeyEvent(event: KeyboardEvent, type: 'keydown' | 'keyup'): void {
    const keyInfo: KeyEventInfo = {
      key: event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      timestamp: Date.now(),
      target: event.target,
    };
    
    // 更新按鍵狀態
    this.updateKeyState(event.key, type === 'keydown', keyInfo);
    
    // 更新當前按下的按鍵集合
    this.updateCurrentlyPressed(event.key, type === 'keydown');
    
    // 添加到事件歷史
    this.addToHistory(keyInfo);
    
    // 更新統計信息
    if (type === 'keydown') {
      this.totalKeyPressCount.update(count => count + 1);
      this.lastKeyPressed.set(event.key);
    }
  }

  /**
   * 更新按鍵狀態
   */
  private updateKeyState(key: string, isPressed: boolean, keyInfo: KeyEventInfo): void {
    if (!this.keyStates.has(key)) {
      this.keyStates.set(key, signal({
        isPressed: false,
        pressedAt: null,
        releasedAt: null,
        pressCount: 0,
      }));
    }
    
    const keyStateSignal = this.keyStates.get(key)!;
    const currentState = keyStateSignal();
    
    keyStateSignal.set({
      isPressed,
      pressedAt: isPressed ? keyInfo.timestamp : currentState.pressedAt,
      releasedAt: isPressed ? currentState.releasedAt : keyInfo.timestamp,
      pressCount: isPressed ? currentState.pressCount + 1 : currentState.pressCount,
    });
  }

  /**
   * 更新當前按下的按鍵集合
   */
  private updateCurrentlyPressed(key: string, isPressed: boolean): void {
    this.currentlyPressed.update(pressed => {
      const newPressed = new Set(pressed);
      if (isPressed) {
        newPressed.add(key);
      } else {
        newPressed.delete(key);
      }
      return newPressed;
    });
  }

  /**
   * 添加到事件歷史
   */
  private addToHistory(keyInfo: KeyEventInfo): void {
    this.keyEventHistory.update(history => {
      const newHistory = [...history, keyInfo];
      if (newHistory.length > this.maxHistorySize) {
        newHistory.shift();
      }
      return newHistory;
    });
  }

  // ===================
  // 公共 API - 基礎按鍵監聽
  // ===================

  /**
   * 監聽單一按鍵或按鍵組
   */
  useKeyPress(keyCode: KeyCode, options: KeyPressOptions = {}): Signal<boolean> {
    const keys = Array.isArray(keyCode) ? keyCode : [keyCode];
    const pressedSignal = signal(false);
    
    effect(() => {
      if (!options.enabled && options.enabled !== undefined) {
        pressedSignal.set(false);
        return;
      }
      
      const currentlyPressed = this.currentlyPressed();
      const isAnyKeyPressed = keys.some(key => currentlyPressed.has(key));
      pressedSignal.set(isAnyKeyPressed);
    });
    
    return pressedSignal.asReadonly();
  }

  /**
   * 監聽按鍵組合（所有按鍵必須同時按下）
   */
  useKeyCombination(keys: string[], options: KeyCombinationOptions = {}): Signal<boolean> {
    const combinationSignal = signal(false);
    
    effect(() => {
      if (!options.enabled && options.enabled !== undefined) {
        combinationSignal.set(false);
        return;
      }
      
      const currentlyPressed = this.currentlyPressed();
      const requireAll = options.requireAll !== false;
      
      let isPressed: boolean;
      if (requireAll) {
        // 所有按鍵都必須按下
        isPressed = keys.every(key => currentlyPressed.has(key));
      } else {
        // 任一按鍵按下即可
        isPressed = keys.some(key => currentlyPressed.has(key));
      }
      
      combinationSignal.set(isPressed);
    });
    
    return combinationSignal.asReadonly();
  }

  /**
   * 監聽按鍵序列
   */
  useKeySequence(sequence: string[], options: KeySequenceOptions = {}): Signal<boolean> {
    const sequenceSignal = signal(false);
    const currentSequence = signal<string[]>([]);
    const lastKeyTime = signal<number>(0);
    const timeout = options.timeout || 2000; // 默認 2 秒超時
    
    effect(() => {
      if (!options.enabled && options.enabled !== undefined) {
        sequenceSignal.set(false);
        currentSequence.set([]);
        return;
      }
      
      const history = this.keyEventHistory();
      if (history.length === 0) return;
      
      const lastEvent = history[history.length - 1];
      const currentTime = lastEvent.timestamp;
      
      // 檢查超時
      if (currentTime - lastKeyTime() > timeout) {
        currentSequence.set([]);
      }
      
      lastKeyTime.set(currentTime);
      
      const current = currentSequence();
      const expectedKey = sequence[current.length];
      
      if (lastEvent.key === expectedKey) {
        // 正確的按鍵
        const newSequence = [...current, lastEvent.key];
        currentSequence.set(newSequence);
        
        // 檢查是否完成序列
        if (newSequence.length === sequence.length) {
          sequenceSignal.set(true);
          currentSequence.set([]); // 重置序列
          
          // 一段時間後重置信號
          setTimeout(() => sequenceSignal.set(false), 100);
        }
      } else if (options.resetOnWrongKey !== false) {
        // 按錯鍵，重置序列
        currentSequence.set([]);
        sequenceSignal.set(false);
      }
    });
    
    return sequenceSignal.asReadonly();
  }

  // ===================
  // 狀態查詢
  // ===================

  /**
   * 獲取按鍵狀態
   */
  getKeyState(key: string): KeyState {
    const keyStateSignal = this.keyStates.get(key);
    return keyStateSignal ? keyStateSignal() : {
      isPressed: false,
      pressedAt: null,
      releasedAt: null,
      pressCount: 0,
    };
  }

  /**
   * 檢查按鍵是否被按下
   */
  isKeyPressed(key: string): boolean {
    return this.currentlyPressed().has(key);
  }

  /**
   * 獲取當前按下的所有按鍵
   */
  getCurrentlyPressedKeys(): string[] {
    return Array.from(this.currentlyPressed());
  }

  /**
   * 獲取最後按下的按鍵
   */
  getLastKeyPressed(): string | null {
    return this.lastKeyPressed();
  }

  /**
   * 獲取總按鍵計數
   */
  getTotalKeyPressCount(): number {
    return this.totalKeyPressCount();
  }

  /**
   * 獲取按鍵事件歷史
   */
  getKeyEventHistory(): KeyEventInfo[] {
    return this.keyEventHistory();
  }

  /**
   * 獲取最近的按鍵事件
   */
  getRecentKeyEvents(count = 10): KeyEventInfo[] {
    const history = this.keyEventHistory();
    return history.slice(-count);
  }

  // ===================
  // 便捷方法
  // ===================

  /**
   * 檢查修飾鍵狀態
   */
  getModifierKeys(): {
    ctrl: boolean;
    meta: boolean;
    shift: boolean;
    alt: boolean;
  } {
    return {
      ctrl: this.isKeyPressed('Control'),
      meta: this.isKeyPressed('Meta'),
      shift: this.isKeyPressed('Shift'),
      alt: this.isKeyPressed('Alt'),
    };
  }

  /**
   * 檢查是否按下任何修飾鍵
   */
  hasModifierKey(): boolean {
    const modifiers = this.getModifierKeys();
    return modifiers.ctrl || modifiers.meta || modifiers.shift || modifiers.alt;
  }

  /**
   * 檢查是否為字母鍵
   */
  isAlphaKey(key: string): boolean {
    return /^[a-zA-Z]$/.test(key);
  }

  /**
   * 檢查是否為數字鍵
   */
  isNumericKey(key: string): boolean {
    return /^[0-9]$/.test(key);
  }

  /**
   * 檢查是否為箭頭鍵
   */
  isArrowKey(key: string): boolean {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
  }

  /**
   * 檢查是否為功能鍵
   */
  isFunctionKey(key: string): boolean {
    return /^F\d+$/.test(key);
  }

  // ===================
  // 高級功能
  // ===================

  /**
   * 創建自定義按鍵映射
   */
  createKeyMap(keyMap: Record<string, () => void>, options: KeyPressOptions = {}): void {
    Object.entries(keyMap).forEach(([key, callback]) => {
      const keySignal = this.useKeyPress(key, options);
      
      effect(() => {
        if (keySignal()) {
          callback();
        }
      });
    });
  }

  /**
   * 防抖按鍵監聽
   */
  useKeyPressDebounced(keyCode: KeyCode, delay = 300, options: KeyPressOptions = {}): Signal<boolean> {
    const debouncedSignal = signal(false);
    const keySignal = this.useKeyPress(keyCode, options);
    let timeoutId: number | null = null;
    
    effect(() => {
      if (keySignal()) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        timeoutId = window.setTimeout(() => {
          debouncedSignal.set(true);
          setTimeout(() => debouncedSignal.set(false), 50); // 短暫設置為 true
        }, delay);
      }
    });
    
    return debouncedSignal.asReadonly();
  }

  /**
   * 節流按鍵監聽
   */
  useKeyPressThrottled(keyCode: KeyCode, interval = 100, options: KeyPressOptions = {}): Signal<boolean> {
    const throttledSignal = signal(false);
    const keySignal = this.useKeyPress(keyCode, options);
    let lastTrigger = 0;
    
    effect(() => {
      if (keySignal()) {
        const now = Date.now();
        if (now - lastTrigger >= interval) {
          lastTrigger = now;
          throttledSignal.set(true);
          setTimeout(() => throttledSignal.set(false), 50); // 短暫設置為 true
        }
      }
    });
    
    return throttledSignal.asReadonly();
  }

  // ===================
  // 工具方法
  // ===================

  /**
   * 重置所有狀態
   */
  reset(): void {
    this.keyStates.clear();
    this.keyEventHistory.set([]);
    this.currentlyPressed.set(new Set());
    this.totalKeyPressCount.set(0);
    this.lastKeyPressed.set(null);
  }

  /**
   * 清除事件歷史
   */
  clearHistory(): void {
    this.keyEventHistory.set([]);
  }

  /**
   * 獲取統計信息
   */
  getStatistics(): {
    totalKeyPresses: number;
    uniqueKeysPressed: number;
    currentlyPressed: string[];
    mostPressedKey: string | null;
    lastKeyPressed: string | null;
  } {
    const keyPressCount = new Map<string, number>();
    
    this.keyStates.forEach((stateSignal, key) => {
      keyPressCount.set(key, stateSignal().pressCount);
    });
    
    const mostPressed = [...keyPressCount.entries()]
      .sort((a, b) => b[1] - a[1])[0];
    
    return {
      totalKeyPresses: this.totalKeyPressCount(),
      uniqueKeysPressed: this.keyStates.size,
      currentlyPressed: this.getCurrentlyPressedKeys(),
      mostPressedKey: mostPressed ? mostPressed[0] : null,
      lastKeyPressed: this.lastKeyPressed(),
    };
  }

  // ===================
  // 生命周期
  // ===================

  /**
   * 清理資源
   */
  destroy(): void {
    if (!this.isBrowser) return;
    
    // 移除所有事件監聽器
    this.eventListeners.forEach((listeners, target) => {
      listeners.forEach(listener => {
        target.removeEventListener('keydown', listener as EventListener);
        target.removeEventListener('keyup', listener as EventListener);
      });
    });
    
    this.eventListeners.clear();
    this.reset();
  }
}

/**
 * Angular 版本的 useKeyPress hook
 */
export function useKeyPress(keyCode: KeyCode, options?: KeyPressOptions): Signal<boolean> {
  const keyPressService = new KeyPressService();
  return keyPressService.useKeyPress(keyCode, options);
}

/**
 * 鍵盤工具函數
 */
export const KeyUtils = {
  /**
   * 標準化按鍵名稱
   */
  normalizeKey: (key: string): string => {
    // 處理常見的按鍵別名
    const keyMap: Record<string, string> = {
      'Esc': 'Escape',
      'Del': 'Delete',
      'Ins': 'Insert',
      'Space': ' ',
      'Return': 'Enter',
    };
    
    return keyMap[key] || key;
  },
  
  /**
   * 檢查是否為特殊鍵
   */
  isSpecialKey: (key: string): boolean => {
    const specialKeys = [
      'Control', 'Meta', 'Shift', 'Alt',
      'CapsLock', 'NumLock', 'ScrollLock',
      'Insert', 'Delete', 'Home', 'End',
      'PageUp', 'PageDown', 'Tab', 'Enter',
      'Escape', 'Backspace'
    ];
    
    return specialKeys.includes(key);
  },
  
  /**
   * 獲取按鍵的顯示名稱
   */
  getDisplayName: (key: string): string => {
    const displayNames: Record<string, string> = {
      ' ': 'Space',
      'Control': 'Ctrl',
      'Meta': navigator.platform.includes('Mac') ? 'Cmd' : 'Win',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→',
    };
    
    return displayNames[key] || key;
  },
  
  /**
   * 創建按鍵組合的顯示字符串
   */
  formatKeyCombination: (keys: string[]): string => {
    return keys.map(key => KeyUtils.getDisplayName(key)).join(' + ');
  },
} as const;