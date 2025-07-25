import { Injectable, computed, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * 色彩模式類型
 */
export type ColorMode = 'light' | 'dark' | 'system';

/**
 * 色彩模式類名
 */
export type ColorModeClass = 'light' | 'dark';

/**
 * 色彩模式選項
 */
export interface ColorModeOptions {
  defaultMode?: ColorMode;
  storageKey?: string;
  attribute?: string;
  className?: boolean;
}

/**
 * 媒體查詢結果
 */
interface MediaQueryResult {
  matches: boolean;
  media: string;
}

/**
 * ColorModeService - Angular equivalent of React Flow's useColorModeClass hook
 * 
 * 色彩模式服務 - 提供完整的主題管理功能
 * 等價於 React Flow 的 useColorModeClass hook
 * 
 * 主要功能：
 * - 色彩模式管理（淺色/深色/系統）
 * - 系統主題自動檢測
 * - 主題持久化存儲
 * - CSS 類名自動切換
 * - 媒體查詢監聽
 * - SSR 兼容
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <div [class]="'app ' + currentColorModeClass()">
 *       <div>當前主題: {{ currentColorMode() }}</div>
 *       <div>是否為深色模式: {{ isDarkMode() }}</div>
 *       <div>是否為系統模式: {{ isSystemMode() }}</div>
 *       
 *       <button (click)="setLightMode()">淺色模式</button>
 *       <button (click)="setDarkMode()">深色模式</button>
 *       <button (click)="setSystemMode()">系統模式</button>
 *       <button (click)="toggleMode()">切換模式</button>
 *     </div>
 *   `,
 *   styles: [`
 *     .app.light {
 *       background: white;
 *       color: black;
 *     }
 *     .app.dark {
 *       background: #1a1a1a;
 *       color: white;
 *     }
 *   `]
 * })
 * export class ThemeComponent {
 *   currentColorMode = computed(() => this.colorModeService.getColorMode());
 *   currentColorModeClass = computed(() => this.colorModeService.getColorModeClass());
 *   isDarkMode = computed(() => this.colorModeService.isDarkMode());
 *   isSystemMode = computed(() => this.colorModeService.isSystemMode());
 *   
 *   constructor(private colorModeService: ColorModeService) {
 *     // 監聽主題變化
 *     effect(() => {
 *       const mode = this.currentColorMode();
 *       console.log('Color mode changed:', mode);
 *     });
 *   }
 *   
 *   setLightMode() {
 *     this.colorModeService.setColorMode('light');
 *   }
 *   
 *   setDarkMode() {
 *     this.colorModeService.setColorMode('dark');
 *   }
 *   
 *   setSystemMode() {
 *     this.colorModeService.setColorMode('system');
 *   }
 *   
 *   toggleMode() {
 *     this.colorModeService.toggleColorMode();
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ColorModeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  
  /** 默認配置 */
  private readonly defaultOptions: Required<ColorModeOptions> = {
    defaultMode: 'system',
    storageKey: 'angular-flow-color-mode',
    attribute: 'data-color-mode',
    className: true,
  };
  
  /** 當前配置 */
  private options: Required<ColorModeOptions>;
  
  /** 色彩模式狀態信號 */
  private colorModeSignal = signal<ColorMode>('system');
  
  /** 系統偏好的色彩模式信號 */
  private systemColorModeSignal = signal<ColorModeClass>('light');
  
  /** 媒體查詢對象 */
  private mediaQuery: MediaQueryList | null = null;
  
  /** 響應式屬性 */
  colorMode = computed(() => this.colorModeSignal());
  systemColorMode = computed(() => this.systemColorModeSignal());
  
  /** 實際應用的色彩模式類名 */
  colorModeClass = computed(() => {
    const mode = this.colorMode();
    if (mode === 'system') {
      return this.systemColorMode();
    }
    return mode as ColorModeClass;
  });
  
  /** 色彩模式狀態檢查 */
  isDarkMode = computed(() => this.colorModeClass() === 'dark');
  isLightMode = computed(() => this.colorModeClass() === 'light');
  isSystemMode = computed(() => this.colorMode() === 'system');

  constructor() {
    this.options = { ...this.defaultOptions };
    
    if (this.isBrowser) {
      this.initializeColorMode();
      this.setupSystemColorModeListener();
      this.setupDOMUpdates();
    }
  }

  // ===================
  // 初始化
  // ===================

  /**
   * 初始化色彩模式
   */
  private initializeColorMode(): void {
    // 從本地存儲讀取保存的模式
    const savedMode = this.getStoredColorMode();
    const initialMode = savedMode || this.options.defaultMode;
    
    // 檢測系統偏好
    this.detectSystemColorMode();
    
    // 設置初始模式
    this.colorModeSignal.set(initialMode);
    
    console.log('ColorModeService initialized:', {
      savedMode,
      initialMode,
      systemMode: this.systemColorMode(),
    });
  }

  /**
   * 設置系統色彩模式監聽器
   */
  private setupSystemColorModeListener(): void {
    if (!this.isBrowser || !window.matchMedia) return;
    
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // 初始檢測
    this.updateSystemColorMode(this.mediaQuery);
    
    // 監聽變化
    const handleChange = (e: MediaQueryListEvent) => {
      this.updateSystemColorMode(e);
    };
    
    // 使用現代 API 或回退到舊 API
    if (this.mediaQuery.addEventListener) {
      this.mediaQuery.addEventListener('change', handleChange);
    } else {
      // 舊版瀏覽器回退
      (this.mediaQuery as any).addListener(handleChange);
    }
  }

  /**
   * 更新系統色彩模式
   */
  private updateSystemColorMode(mediaQuery: MediaQueryResult): void {
    const systemMode = mediaQuery.matches ? 'dark' : 'light';
    this.systemColorModeSignal.set(systemMode);
    
    console.log('System color mode changed:', systemMode);
  }

  /**
   * 檢測系統色彩模式
   */
  private detectSystemColorMode(): void {
    if (!this.isBrowser || !window.matchMedia) {
      this.systemColorModeSignal.set('light');
      return;
    }
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.updateSystemColorMode(mediaQuery);
  }

  /**
   * 設置 DOM 更新
   */
  private setupDOMUpdates(): void {
    effect(() => {
      const colorModeClass = this.colorModeClass();
      this.updateDOMAttributes(colorModeClass);
    });
  }

  /**
   * 更新 DOM 屬性
   */
  private updateDOMAttributes(colorModeClass: ColorModeClass): void {
    if (!this.isBrowser) return;
    
    const documentElement = document.documentElement;
    
    // 更新 data 屬性
    documentElement.setAttribute(this.options.attribute, colorModeClass);
    
    // 更新 CSS 類名
    if (this.options.className) {
      documentElement.classList.remove('light', 'dark');
      documentElement.classList.add(colorModeClass);
    }
    
    console.log('DOM updated with color mode:', colorModeClass);
  }

  // ===================
  // 公共 API
  // ===================

  /**
   * 獲取當前色彩模式
   */
  getColorMode(): ColorMode {
    return this.colorMode();
  }

  /**
   * 獲取當前色彩模式類名
   */
  getColorModeClass(): ColorModeClass {
    return this.colorModeClass();
  }

  /**
   * 設置色彩模式
   */
  setColorMode(mode: ColorMode): void {
    this.colorModeSignal.set(mode);
    this.storeColorMode(mode);
    
    console.log('Color mode set to:', mode);
  }

  /**
   * 切換色彩模式
   */
  toggleColorMode(): void {
    const currentMode = this.colorMode();
    
    switch (currentMode) {
      case 'light':
        this.setColorMode('dark');
        break;
      case 'dark':
        this.setColorMode('system');
        break;
      case 'system':
        this.setColorMode('light');
        break;
    }
  }

  /**
   * 在淺色和深色模式之間切換（忽略系統模式）
   */
  toggleLightDark(): void {
    const currentClass = this.colorModeClass();
    const newMode = currentClass === 'light' ? 'dark' : 'light';
    this.setColorMode(newMode);
  }

  /**
   * 更新配置
   */
  updateOptions(options: Partial<ColorModeOptions>): void {
    this.options = { ...this.options, ...options };
    
    // 重新初始化如果在瀏覽器環境中
    if (this.isBrowser) {
      this.setupDOMUpdates();
    }
  }

  // ===================
  // 本地存儲
  // ===================

  /**
   * 從本地存儲獲取色彩模式
   */
  private getStoredColorMode(): ColorMode | null {
    if (!this.isBrowser) return null;
    
    try {
      const stored = localStorage.getItem(this.options.storageKey);
      if (stored && this.isValidColorMode(stored)) {
        return stored as ColorMode;
      }
    } catch (error) {
      console.warn('Failed to read color mode from localStorage:', error);
    }
    
    return null;
  }

  /**
   * 保存色彩模式到本地存儲
   */
  private storeColorMode(mode: ColorMode): void {
    if (!this.isBrowser) return;
    
    try {
      localStorage.setItem(this.options.storageKey, mode);
    } catch (error) {
      console.warn('Failed to save color mode to localStorage:', error);
    }
  }

  /**
   * 清除本地存儲的色彩模式
   */
  clearStoredColorMode(): void {
    if (!this.isBrowser) return;
    
    try {
      localStorage.removeItem(this.options.storageKey);
    } catch (error) {
      console.warn('Failed to clear color mode from localStorage:', error);
    }
  }

  // ===================
  // 工具方法
  // ===================

  /**
   * 檢查是否為有效的色彩模式
   */
  private isValidColorMode(mode: string): mode is ColorMode {
    return ['light', 'dark', 'system'].includes(mode);
  }

  /**
   * 獲取系統是否支持色彩模式偏好
   */
  supportsColorScheme(): boolean {
    return this.isBrowser && !!window.matchMedia;
  }

  /**
   * 獲取當前瀏覽器的用戶偏好
   */
  getUserPreference(): ColorModeClass | null {
    if (!this.supportsColorScheme()) return null;
    
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const lightQuery = window.matchMedia('(prefers-color-scheme: light)');
    
    if (darkQuery.matches) return 'dark';
    if (lightQuery.matches) return 'light';
    
    return null;
  }

  /**
   * 強制重新檢測系統偏好
   */
  refreshSystemColorMode(): void {
    if (this.isBrowser) {
      this.detectSystemColorMode();
    }
  }

  /**
   * 重置為默認設置
   */
  reset(): void {
    this.clearStoredColorMode();
    this.setColorMode(this.options.defaultMode);
  }

  /**
   * 獲取當前狀態摘要
   */
  getStateSummary(): {
    colorMode: ColorMode;
    colorModeClass: ColorModeClass;
    systemColorMode: ColorModeClass;
    isDarkMode: boolean;
    isLightMode: boolean;
    isSystemMode: boolean;
    supportsColorScheme: boolean;
  } {
    return {
      colorMode: this.colorMode(),
      colorModeClass: this.colorModeClass(),
      systemColorMode: this.systemColorMode(),
      isDarkMode: this.isDarkMode(),
      isLightMode: this.isLightMode(),
      isSystemMode: this.isSystemMode(),
      supportsColorScheme: this.supportsColorScheme(),
    };
  }

  // ===================
  // 生命周期
  // ===================

  /**
   * 清理資源
   */
  destroy(): void {
    if (this.mediaQuery && this.isBrowser) {
      if (this.mediaQuery.removeEventListener) {
        // 現代瀏覽器
        this.mediaQuery.removeEventListener('change', this.updateSystemColorMode.bind(this));
      } else {
        // 舊版瀏覽器
        (this.mediaQuery as any).removeListener(this.updateSystemColorMode.bind(this));
      }
    }
  }
}

/**
 * Angular 版本的 useColorModeClass hook
 */
export function useColorModeClass(colorMode?: ColorMode): ColorModeClass {
  const colorModeService = new ColorModeService();
  
  if (colorMode) {
    colorModeService.setColorMode(colorMode);
  }
  
  return colorModeService.getColorModeClass();
}

/**
 * 色彩模式工具函數
 */
export const ColorModeUtils = {
  /**
   * 檢查是否為深色模式
   */
  isDark: (mode: ColorModeClass) => mode === 'dark',
  
  /**
   * 檢查是否為淺色模式
   */
  isLight: (mode: ColorModeClass) => mode === 'light',
  
  /**
   * 切換模式
   */
  toggle: (mode: ColorModeClass): ColorModeClass => mode === 'dark' ? 'light' : 'dark',
  
  /**
   * 獲取對比模式
   */
  opposite: (mode: ColorModeClass): ColorModeClass => mode === 'dark' ? 'light' : 'dark',
  
  /**
   * 從字符串解析色彩模式
   */
  parse: (str: string): ColorMode | null => {
    const normalizedStr = str.toLowerCase().trim();
    if (['light', 'dark', 'system'].includes(normalizedStr)) {
      return normalizedStr as ColorMode;
    }
    return null;
  },
  
  /**
   * 獲取 CSS 變量名
   */
  getCSSVariable: (mode: ColorModeClass, property: string) => `--color-${mode}-${property}`,
  
  /**
   * 生成主題相關的 CSS 類名
   */
  getThemeClass: (mode: ColorModeClass, component?: string) => {
    const base = `theme-${mode}`;
    return component ? `${base} ${component}-${mode}` : base;
  },
} as const;