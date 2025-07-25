import { Injectable, signal, computed, effect, Renderer2, RendererFactory2, DOCUMENT, inject } from '@angular/core';
import { ColorModeService } from '../hooks/color-mode.service';

/**
 * 顏色模式枚舉
 */
export enum ColorMode {
  Light = 'light',
  Dark = 'dark',
  System = 'system'
}

/**
 * 主題配置接口
 */
export interface ThemeConfig {
  /** 顏色模式 */
  colorMode: ColorMode;
  /** 自定義 CSS 變量 */
  customVariables?: Record<string, string>;
  /** 是否自動檢測系統主題 */
  autoDetectSystemTheme?: boolean;
  /** 主題變化回調 */
  onThemeChange?: (theme: AppliedTheme) => void;
}

/**
 * 應用的主題狀態
 */
export interface AppliedTheme {
  /** 當前顏色模式 */
  colorMode: ColorMode;
  /** 實際應用的主題（light 或 dark） */
  resolvedTheme: 'light' | 'dark';
  /** 是否為系統主題 */
  isSystemTheme: boolean;
  /** CSS 類名 */
  cssClass: string;
}

/**
 * 主題服務
 * 
 * 負責管理 Angular XYFlow 的主題系統，包括亮色/暗色主題切換、
 * 系統主題檢測、CSS 變量管理等功能
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <div [class]="themeService.cssClass()">
 *       <angular-flow [colorMode]="themeService.colorMode()"></angular-flow>
 *     </div>
 *   `
 * })
 * export class AppComponent {
 *   constructor(public themeService: ThemeService) {
 *     // 設置暗色主題
 *     this.themeService.setColorMode(ColorMode.Dark);
 *     
 *     // 設置自定義變量
 *     this.themeService.setCustomVariable('--xy-node-background-color', '#ff0000');
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private document = inject(DOCUMENT);
  private rendererFactory = inject(RendererFactory2);
  private renderer: Renderer2;
  
  /** 當前顏色模式 */
  private colorModeSignal = signal<ColorMode>(ColorMode.System);
  
  /** 系統偏好的主題 */
  private systemThemeSignal = signal<'light' | 'dark'>('light');
  
  /** 是否自動檢測系統主題 */
  private autoDetectSystemSignal = signal(true);
  
  /** 自定義 CSS 變量 */
  private customVariablesSignal = signal<Record<string, string>>({});
  
  /** 媒體查詢監聽器 */
  private mediaQueryList?: MediaQueryList;
  
  /** 主題變化回調 */
  private themeChangeCallback?: (theme: AppliedTheme) => void;

  constructor() {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    
    // 初始化系統主題檢測
    this.initSystemThemeDetection();
    
    // 監聽主題變化並應用到 DOM
    effect(() => {
      const theme = this.appliedTheme();
      this.applyThemeToDOM(theme);
      
      // 調用回調
      if (this.themeChangeCallback) {
        this.themeChangeCallback(theme);
      }
    }, { allowSignalWrites: true });
  }

  // ===================
  // 公共 API
  // ===================

  /**
   * 當前顏色模式
   */
  colorMode = computed(() => this.colorModeSignal());

  /**
   * 系統偏好主題
   */
  systemTheme = computed(() => this.systemThemeSignal());

  /**
   * 實際應用的主題
   */
  resolvedTheme = computed((): 'light' | 'dark' => {
    const mode = this.colorModeSignal();
    if (mode === ColorMode.System) {
      return this.systemThemeSignal();
    }
    return mode as 'light' | 'dark';
  });

  /**
   * 應用的主題狀態
   */
  appliedTheme = computed((): AppliedTheme => {
    const colorMode = this.colorModeSignal();
    const resolvedTheme = this.resolvedTheme();
    
    return {
      colorMode,
      resolvedTheme,
      isSystemTheme: colorMode === ColorMode.System,
      cssClass: this.getCssClass(resolvedTheme)
    };
  });

  /**
   * CSS 類名
   */
  cssClass = computed(() => this.appliedTheme().cssClass);

  /**
   * 是否為暗色主題
   */
  isDark = computed(() => this.resolvedTheme() === 'dark');

  /**
   * 是否為亮色主題
   */
  isLight = computed(() => this.resolvedTheme() === 'light');

  /**
   * 自定義變量
   */
  customVariables = computed(() => this.customVariablesSignal());

  // ===================
  // 主題控制方法
  // ===================

  /**
   * 設置顏色模式
   */
  setColorMode(mode: ColorMode): void {
    this.colorModeSignal.set(mode);
    
    // 如果切換到非系統模式，保存到 localStorage
    if (mode !== ColorMode.System) {
      try {
        localStorage.setItem('angular-flow-color-mode', mode);
      } catch (error) {
        console.warn('無法保存主題設置到 localStorage:', error);
      }
    } else {
      try {
        localStorage.removeItem('angular-flow-color-mode');
      } catch (error) {
        console.warn('無法從 localStorage 移除主題設置:', error);
      }
    }
  }

  /**
   * 切換主題
   */
  toggleTheme(): void {
    const current = this.colorModeSignal();
    
    if (current === ColorMode.System) {
      // 如果當前是系統模式，切換到與系統相反的模式
      const systemTheme = this.systemThemeSignal();
      this.setColorMode(systemTheme === 'dark' ? ColorMode.Light : ColorMode.Dark);
    } else {
      // 在 light 和 dark 之間切換
      this.setColorMode(current === ColorMode.Light ? ColorMode.Dark : ColorMode.Light);
    }
  }

  /**
   * 設置自動檢測系統主題
   */
  setAutoDetectSystemTheme(enabled: boolean): void {
    this.autoDetectSystemSignal.set(enabled);
    
    if (enabled) {
      this.initSystemThemeDetection();
    } else {
      this.destroySystemThemeDetection();
    }
  }

  // ===================
  // CSS 變量管理
  // ===================

  /**
   * 設置自定義 CSS 變量
   */
  setCustomVariable(name: string, value: string): void {
    const current = this.customVariablesSignal();
    this.customVariablesSignal.set({
      ...current,
      [name]: value
    });
  }

  /**
   * 設置多個自定義 CSS 變量
   */
  setCustomVariables(variables: Record<string, string>): void {
    const current = this.customVariablesSignal();
    this.customVariablesSignal.set({
      ...current,
      ...variables
    });
  }

  /**
   * 移除自定義 CSS 變量
   */
  removeCustomVariable(name: string): void {
    const current = this.customVariablesSignal();
    const { [name]: removed, ...rest } = current;
    this.customVariablesSignal.set(rest);
  }

  /**
   * 清除所有自定義 CSS 變量
   */
  clearCustomVariables(): void {
    this.customVariablesSignal.set({});
  }

  // ===================
  // 主題配置
  // ===================

  /**
   * 配置主題
   */
  configure(config: Partial<ThemeConfig>): void {
    if (config.colorMode !== undefined) {
      this.setColorMode(config.colorMode);
    }
    
    if (config.customVariables) {
      this.setCustomVariables(config.customVariables);
    }
    
    if (config.autoDetectSystemTheme !== undefined) {
      this.setAutoDetectSystemTheme(config.autoDetectSystemTheme);
    }
    
    if (config.onThemeChange) {
      this.themeChangeCallback = config.onThemeChange;
    }
  }

  /**
   * 獲取當前主題配置
   */
  getConfig(): ThemeConfig {
    return {
      colorMode: this.colorModeSignal(),
      customVariables: this.customVariablesSignal(),
      autoDetectSystemTheme: this.autoDetectSystemSignal(),
      onThemeChange: this.themeChangeCallback
    };
  }

  // ===================
  // 初始化和恢復
  // ===================

  /**
   * 從 localStorage 恢復主題設置
   */
  restoreFromStorage(): void {
    try {
      const saved = localStorage.getItem('angular-flow-color-mode');
      if (saved && Object.values(ColorMode).includes(saved as ColorMode)) {
        this.setColorMode(saved as ColorMode);
      }
    } catch (error) {
      console.warn('無法從 localStorage 恢復主題設置:', error);
    }
  }

  /**
   * 重置到默認設置
   */
  reset(): void {
    this.colorModeSignal.set(ColorMode.System);
    this.customVariablesSignal.set({});
    this.autoDetectSystemSignal.set(true);
    this.themeChangeCallback = undefined;
    
    try {
      localStorage.removeItem('angular-flow-color-mode');
    } catch (error) {
      console.warn('無法清除 localStorage 中的主題設置:', error);
    }
  }

  // ===================
  // 工具方法
  // ===================

  /**
   * 獲取 CSS 類名
   */
  private getCssClass(theme: 'light' | 'dark'): string {
    return theme === 'dark' ? 'angular-flow dark' : 'angular-flow';
  }

  /**
   * 檢測當前系統主題
   */
  private detectSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return 'light';
    }
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * 初始化系統主題檢測
   */
  private initSystemThemeDetection(): void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    // 設置初始系統主題
    this.systemThemeSignal.set(this.detectSystemTheme());

    // 監聽系統主題變化
    this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      this.systemThemeSignal.set(e.matches ? 'dark' : 'light');
    };

    // 使用新的 addEventListener 方法（如果可用）
    if (this.mediaQueryList.addEventListener) {
      this.mediaQueryList.addEventListener('change', handleChange);
    } else {
      // 回退到舊的 addListener 方法
      this.mediaQueryList.addListener(handleChange);
    }
  }

  /**
   * 銷毀系統主題檢測
   */
  private destroySystemThemeDetection(): void {
    if (this.mediaQueryList) {
      const handleChange = () => {}; // 空函數引用
      
      if (this.mediaQueryList.removeEventListener) {
        this.mediaQueryList.removeEventListener('change', handleChange);
      } else {
        this.mediaQueryList.removeListener(handleChange);
      }
      
      this.mediaQueryList = undefined;
    }
  }

  /**
   * 應用主題到 DOM
   */
  private applyThemeToDOM(theme: AppliedTheme): void {
    if (typeof document === 'undefined') {
      return;
    }

    // 設置根元素的類名
    const rootElement = this.document.documentElement;
    
    // 移除舊的主題類
    this.renderer.removeClass(rootElement, 'light');
    this.renderer.removeClass(rootElement, 'dark');
    this.renderer.removeClass(rootElement, 'system');
    
    // 添加新的主題類
    this.renderer.addClass(rootElement, theme.resolvedTheme);
    if (theme.isSystemTheme) {
      this.renderer.addClass(rootElement, 'system');
    }

    // 應用自定義 CSS 變量
    const customVars = this.customVariablesSignal();
    Object.entries(customVars).forEach(([name, value]) => {
      this.renderer.setStyle(rootElement, name, value);
    });
  }

  /**
   * 清理資源
   */
  destroy(): void {
    this.destroySystemThemeDetection();
    this.themeChangeCallback = undefined;
  }
}

/**
 * 主題工具函數
 */
export const ThemeUtils = {
  /**
   * 檢查是否支持系統主題檢測
   */
  supportsSystemThemeDetection(): boolean {
    return typeof window !== 'undefined' && 
           typeof window.matchMedia === 'function';
  },

  /**
   * 獲取系統偏好的主題
   */
  getSystemPreference(): 'light' | 'dark' {
    if (!ThemeUtils.supportsSystemThemeDetection()) {
      return 'light';
    }
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },

  /**
   * 檢查是否支持高對比度
   */
  supportsHighContrast(): boolean {
    if (!ThemeUtils.supportsSystemThemeDetection()) {
      return false;
    }
    
    return window.matchMedia('(prefers-contrast: high)').matches;
  },

  /**
   * 檢查是否偏好減少動畫
   */
  prefersReducedMotion(): boolean {
    if (!ThemeUtils.supportsSystemThemeDetection()) {
      return false;
    }
    
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * 生成主題變量映射
   */
  generateThemeVariables(baseTheme: 'light' | 'dark', overrides?: Record<string, string>): Record<string, string> {
    const lightTheme = {
      '--xy-background-color': '#fafafa',
      '--xy-node-background-color': '#fff',
      '--xy-node-color': '#222',
      '--xy-edge-stroke': '#b1b1b7',
      '--xy-handle-background-color': '#1a192b',
    };

    const darkTheme = {
      '--xy-background-color': '#1a1a1a',
      '--xy-node-background-color': '#1e1e1e',
      '--xy-node-color': '#fff',
      '--xy-edge-stroke': '#3e3e3e',
      '--xy-handle-background-color': '#bebebe',
    };

    const baseVariables = baseTheme === 'dark' ? darkTheme : lightTheme;
    return { ...baseVariables, ...overrides };
  }
} as const;