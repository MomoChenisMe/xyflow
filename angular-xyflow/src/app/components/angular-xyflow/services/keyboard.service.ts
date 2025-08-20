// Angular 核心模組
import { Injectable, signal, computed, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// 鍵盤按鍵類型定義
export type KeyboardKey = string;

// 按鍵狀態接口
export interface KeyboardState {
  meta: boolean;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
}

// 平台類型
type Platform = 'mac' | 'windows' | 'other';

@Injectable({
  providedIn: 'root'
})
export class KeyboardService implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // 按鍵狀態信號
  private _keyboardState = signal<KeyboardState>({
    meta: false,
    ctrl: false,
    shift: false,
    alt: false
  });

  // 當前按下的鍵集合
  private _pressedKeys = signal<Set<string>>(new Set());

  // 計算平台
  private _platform = computed<Platform>(() => {
    if (!this.isBrowser) return 'other';
    
    const userAgent = window.navigator.userAgent;
    if (userAgent.includes('Mac')) return 'mac';
    if (userAgent.includes('Win')) return 'windows';
    return 'other';
  });

  // 公開的只讀信號
  keyboardState = computed(() => this._keyboardState());
  pressedKeys = computed(() => this._pressedKeys());
  platform = computed(() => this._platform());

  // 計算是否為多選按鍵激活
  multiSelectionActive = computed(() => {
    const state = this._keyboardState();
    const platform = this._platform();
    
    // 支持 Meta (Mac) / Ctrl (Windows) 和 Shift 鍵進行多選（Figma 風格）
    // 在 Mac 上支援 Meta(Cmd) 和 Shift，在 Windows/其他平台支援 Ctrl 和 Shift
    const primaryMultiKey = platform === 'mac' ? state.meta : state.ctrl;
    return primaryMultiKey || state.shift;
  });

  // 計算是否為縮放激活按鍵
  zoomActivationActive = computed(() => {
    const state = this._keyboardState();
    const platform = this._platform();
    
    // 與多選按鍵相同邏輯
    return platform === 'mac' ? state.meta : state.ctrl;
  });

  // 計算是否為選擇框激活按鍵（通常是 Shift）
  selectionBoxActive = computed(() => this._keyboardState().shift);

  // 事件監聽器
  private keydownListener?: (event: KeyboardEvent) => void;
  private keyupListener?: (event: KeyboardEvent) => void;
  private blurListener?: () => void;
  private focusListener?: () => void;

  constructor() {
    this.setupEventListeners();
  }

  // 設置事件監聽器
  private setupEventListeners(): void {
    if (!this.isBrowser) return;

    this.keydownListener = (event: KeyboardEvent) => this.handleKeyDown(event);
    this.keyupListener = (event: KeyboardEvent) => this.handleKeyUp(event);
    this.blurListener = () => this.resetState();
    this.focusListener = () => this.resetState();

    // 添加事件監聽器
    document.addEventListener('keydown', this.keydownListener, true);
    document.addEventListener('keyup', this.keyupListener, true);
    window.addEventListener('blur', this.blurListener);
    window.addEventListener('focus', this.focusListener);
  }

  // 處理按鍵按下事件
  handleKeyDown(event: KeyboardEvent): void {
    const key = this.normalizeKey(event.key);
    
    // 更新按下的鍵集合
    this._pressedKeys.update(keys => new Set(keys).add(key));

    // 更新修飾鍵狀態
    this._keyboardState.update(state => ({
      ...state,
      meta: event.metaKey,
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey
    }));
  }

  // 處理按鍵釋放事件
  handleKeyUp(event: KeyboardEvent): void {
    const key = this.normalizeKey(event.key);
    
    // 更新按下的鍵集合
    this._pressedKeys.update(keys => {
      const newKeys = new Set(keys);
      newKeys.delete(key);
      return newKeys;
    });

    // 更新修飾鍵狀態
    this._keyboardState.update(state => ({
      ...state,
      meta: event.metaKey,
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey
    }));
  }

  // 重置所有狀態
  private resetState(): void {
    this._keyboardState.set({
      meta: false,
      ctrl: false,
      shift: false,
      alt: false
    });
    this._pressedKeys.set(new Set());
  }

  // 標準化按鍵名稱
  private normalizeKey(key: string): string {
    // 統一按鍵名稱格式
    switch (key.toLowerCase()) {
      case 'control':
        return 'ctrl';
      case 'command':
      case 'meta':
        return 'meta';
      case 'shift':
        return 'shift';
      case 'alt':
        return 'alt';
      default:
        return key.toLowerCase();
    }
  }

  // 檢查特定按鍵是否被按下
  isKeyPressed(key: KeyboardKey): boolean {
    const normalizedKey = this.normalizeKey(key);
    return this._pressedKeys().has(normalizedKey);
  }

  // 檢查按鍵組合是否激活
  isKeyComboActive(keys: KeyboardKey[]): boolean {
    const pressedKeys = this._pressedKeys();
    return keys.every(key => pressedKeys.has(this.normalizeKey(key)));
  }

  // 檢查是否應該使用多選邏輯
  shouldUseMultiSelection(customKeys?: KeyboardKey[], event?: MouseEvent): boolean {
    // 如果有自定義按鍵配置，優先使用
    if (customKeys && customKeys.length > 0) {
      // 檢查是否有任一自定義按鍵被按下
      return customKeys.some(key => {
        const normalizedKey = this.normalizeKey(key);
        let keyPressed = false;
        
        // 從事件中檢查對應的 modifier
        if (event) {
          switch (normalizedKey) {
            case 'meta': keyPressed = event.metaKey; break;
            case 'ctrl': keyPressed = event.ctrlKey; break;
            case 'shift': keyPressed = event.shiftKey; break;
            case 'alt': keyPressed = event.altKey; break;
            default: keyPressed = this.isKeyPressed(normalizedKey); break;
          }
        } else {
          keyPressed = this.isKeyPressed(normalizedKey);
        }
        
        return keyPressed;
      });
    }
    
    // 使用預設多選邏輯（Meta/Control）
    if (event) {
      const platform = this._platform();
      return platform === 'mac' ? event.metaKey : event.ctrlKey;
    }
    
    return this.multiSelectionActive();
  }

  // 檢查是否應該激活縮放
  shouldActivateZoom(customKey?: KeyboardKey): boolean {
    if (customKey) {
      return this.isKeyPressed(customKey);
    }
    return this.zoomActivationActive();
  }

  // 獲取平台特定的預設多選按鍵
  getDefaultMultiSelectionKeys(): KeyboardKey[] {
    const platform = this._platform();
    return platform === 'mac' ? ['meta'] : ['ctrl'];
  }

  // 獲取平台特定的預設縮放激活按鍵
  getDefaultZoomActivationKey(): KeyboardKey {
    const platform = this._platform();
    return platform === 'mac' ? 'meta' : 'ctrl';
  }

  // 清理事件監聽器
  ngOnDestroy(): void {
    if (!this.isBrowser) return;

    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener, true);
    }
    if (this.keyupListener) {
      document.removeEventListener('keyup', this.keyupListener, true);
    }
    if (this.blurListener) {
      window.removeEventListener('blur', this.blurListener);
    }
    if (this.focusListener) {
      window.removeEventListener('focus', this.focusListener);
    }
  }
}