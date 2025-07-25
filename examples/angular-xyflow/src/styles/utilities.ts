/**
 * Angular XYFlow 樣式工具函數
 * 
 * 提供樣式相關的工具函數，包括類名組合、CSS 屬性處理、
 * 動態樣式生成等功能，完全兼容 React Flow 的樣式工具
 */

// CSS 屬性類型定義
export interface CSSProperties {
  [key: string]: string | number | undefined;
}

/**
 * 類名值類型
 */
export type ClassValue = 
  | string 
  | number 
  | boolean 
  | undefined 
  | null 
  | ClassObject 
  | ClassValue[];

/**
 * 類名對象類型
 */
export interface ClassObject {
  [key: string]: boolean | undefined | null;
}

/**
 * 樣式工具類
 */
export class StyleUtils {
  /**
   * 組合類名 - 替代 classcat 庫的功能
   * 
   * @param classes 類名值數組
   * @returns 組合後的類名字符串
   * 
   * @example
   * ```typescript
   * // 基礎用法
   * cc('foo', 'bar') // 'foo bar'
   * 
   * // 條件類名
   * cc('foo', isActive && 'active') // 'foo active' 或 'foo'
   * 
   * // 對象形式
   * cc({
   *   'foo': true,
   *   'bar': false,
   *   'baz': isSelected
   * }) // 'foo' + (isSelected ? ' baz' : '')
   * 
   * // 混合用法
   * cc('base', {
   *   'active': isActive,
   *   'disabled': isDisabled
   * }, customClass)
   * ```
   */
  static combineClasses(...classes: ClassValue[]): string {
    const result: string[] = [];

    for (const cls of classes) {
      if (!cls) continue;

      if (typeof cls === 'string' || typeof cls === 'number') {
        result.push(String(cls));
      } else if (typeof cls === 'object' && !Array.isArray(cls)) {
        // 對象形式：{ className: boolean }
        for (const [key, value] of Object.entries(cls)) {
          if (value) {
            result.push(key);
          }
        }
      } else if (Array.isArray(cls)) {
        // 遞歸處理數組
        const nested = StyleUtils.combineClasses(...cls);
        if (nested) {
          result.push(nested);
        }
      }
    }

    return result.join(' ');
  }

  /**
   * 創建 React Flow 風格的節點類名
   */
  static createNodeClassName(
    baseClass: string = 'angular-flow__node',
    nodeType?: string,
    selected?: boolean,
    dragging?: boolean,
    customClass?: string,
    additionalClasses?: ClassValue[]
  ): string {
    return StyleUtils.combineClasses(
      baseClass,
      nodeType && `${baseClass}-${nodeType}`,
      {
        'selected': !!selected,
        'dragging': !!dragging,
      },
      customClass,
      ...(additionalClasses || [])
    );
  }

  /**
   * 創建 React Flow 風格的邊線類名
   */
  static createEdgeClassName(
    baseClass: string = 'angular-flow__edge',
    edgeType?: string,
    selected?: boolean,
    animated?: boolean,
    customClass?: string,
    additionalClasses?: ClassValue[]
  ): string {
    return StyleUtils.combineClasses(
      baseClass,
      edgeType && `${baseClass}-${edgeType}`,
      {
        'selected': !!selected,
        'animated': !!animated,
      },
      customClass,
      ...(additionalClasses || [])
    );
  }

  /**
   * 創建 Handle 類名
   */
  static createHandleClassName(
    position: 'top' | 'right' | 'bottom' | 'left',
    type: 'source' | 'target',
    connectable?: boolean,
    customClass?: string,
    noPanClassName?: string
  ): string {
    return StyleUtils.combineClasses(
      'angular-flow__handle',
      `angular-flow__handle-${position}`,
      'nodrag',
      noPanClassName,
      customClass,
      {
        'source': type === 'source',
        'target': type === 'target',
        'connectable': !!connectable,
      }
    );
  }

  /**
   * 創建控制器類名
   */
  static createControlsClassName(
    orientation: 'vertical' | 'horizontal' = 'vertical',
    customClass?: string
  ): string {
    return StyleUtils.combineClasses(
      'angular-flow__controls',
      orientation,
      customClass
    );
  }

  /**
   * 創建小地圖類名
   */
  static createMiniMapClassName(customClass?: string): string {
    return StyleUtils.combineClasses(
      'angular-flow__minimap',
      customClass
    );
  }

  /**
   * 創建背景類名
   */
  static createBackgroundClassName(
    variant: 'dots' | 'lines' | 'cross' | undefined,
    customClass?: string
  ): string {
    return StyleUtils.combineClasses(
      'angular-flow__background',
      variant,
      customClass
    );
  }
}

/**
 * CSS 屬性工具類
 */
export class CSSUtils {
  /**
   * 合併 CSS 樣式對象
   */
  static mergeStyles(...styles: (CSSProperties | undefined)[]): CSSProperties {
    return Object.assign({}, ...styles.filter(Boolean));
  }

  /**
   * 將 CSS 屬性對象轉換為字符串
   */
  static stylesToString(styles: CSSProperties): string {
    return Object.entries(styles)
      .map(([key, value]) => {
        if (value === undefined || value === null) return '';
        const cssKey = this.camelToKebab(key);
        return `${cssKey}: ${value}`;
      })
      .filter(Boolean)
      .join('; ');
  }

  /**
   * 將駝峰命名轉換為短橫線命名
   */
  static camelToKebab(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * 創建容器樣式
   */
  static createContainerStyle(
    width?: number | string,
    height?: number | string,
    additional?: CSSProperties
  ): CSSProperties {
    return CSSUtils.mergeStyles(
      {
        position: 'absolute',
        top: 0,
        left: 0,
        width: width || '100%',
        height: height || '100%',
      },
      additional
    );
  }

  /**
   * 創建節點樣式
   */
  static createNodeStyle(
    position: { x: number; y: number },
    zIndex?: number,
    additional?: CSSProperties
  ): CSSProperties {
    return CSSUtils.mergeStyles(
      {
        position: 'absolute',
        transform: `translate(${position.x}px, ${position.y}px)`,
        zIndex: zIndex || 1,
      },
      additional
    );
  }

  /**
   * 創建 Handle 樣式
   */
  static createHandleStyle(
    position: 'top' | 'right' | 'bottom' | 'left',
    additional?: CSSProperties
  ): CSSProperties {
    const positionStyles: Record<string, CSSProperties> = {
      top: { top: '-4px', left: '50%', transform: 'translate(-50%, 0)' },
      right: { top: '50%', right: '-4px', transform: 'translate(0, -50%)' },
      bottom: { bottom: '-4px', left: '50%', transform: 'translate(-50%, 0)' },
      left: { top: '50%', left: '-4px', transform: 'translate(0, -50%)' },
    };

    return CSSUtils.mergeStyles(
      {
        position: 'absolute',
        pointerEvents: 'none',
      },
      positionStyles[position],
      additional
    );
  }

  /**
   * 創建變換樣式
   */
  static createTransformStyle(
    x: number,
    y: number,
    zoom: number,
    additional?: CSSProperties
  ): CSSProperties {
    return CSSUtils.mergeStyles(
      {
        transform: `translate(${x}px, ${y}px) scale(${zoom})`,
        transformOrigin: '0 0',
      },
      additional
    );
  }

  /**
   * 創建選擇框樣式
   */
  static createSelectionStyle(
    rect: { x: number; y: number; width: number; height: number },
    additional?: CSSProperties
  ): CSSProperties {
    return CSSUtils.mergeStyles(
      {
        position: 'absolute',
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        pointerEvents: 'none',
      },
      additional
    );
  }
}

/**
 * 動畫工具類
 */
export class AnimationUtils {
  /**
   * 創建節點出現動畫的樣式
   */
  static createNodeAppearAnimation(
    duration: number = 200,
    easing: string = 'ease-out'
  ): CSSProperties {
    return {
      animation: `node-appear ${duration}ms ${easing}`,
    };
  }

  /**
   * 創建邊線繪製動畫的樣式
   */
  static createEdgeDrawAnimation(
    duration: number = 500,
    easing: string = 'ease-out'
  ): CSSProperties {
    return {
      animation: `edge-appear ${duration}ms ${easing}`,
    };
  }

  /**
   * 創建脈衝動畫的樣式
   */
  static createPulseAnimation(
    duration: number = 1000,
    iterationCount: string = 'infinite'
  ): CSSProperties {
    return {
      animation: `pulse ${duration}ms ${iterationCount}`,
    };
  }

  /**
   * 創建旋轉動畫的樣式
   */
  static createSpinAnimation(
    duration: number = 1000,
    iterationCount: string = 'infinite',
    direction: 'normal' | 'reverse' = 'normal'
  ): CSSProperties {
    return {
      animation: `spin ${duration}ms linear ${iterationCount} ${direction}`,
    };
  }

  /**
   * 創建過渡效果的樣式
   */
  static createTransition(
    properties: string | string[],
    duration: number = 150,
    easing: string = 'ease-in-out',
    delay: number = 0
  ): CSSProperties {
    const props = Array.isArray(properties) ? properties.join(', ') : properties;
    return {
      transition: `${props} ${duration}ms ${easing} ${delay}ms`,
    };
  }
}

/**
 * 響應式工具類
 */
export class ResponsiveUtils {
  /**
   * 檢查是否為移動設備
   */
  static isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  }

  /**
   * 檢查是否為小屏設備
   */
  static isSmallScreen(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 480;
  }

  /**
   * 檢查是否為觸控設備
   */
  static isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * 獲取響應式的 Handle 大小
   */
  static getResponsiveHandleSize(): number {
    if (ResponsiveUtils.isSmallScreen()) return 14;
    if (ResponsiveUtils.isMobile()) return 12;
    return 8;
  }

  /**
   * 獲取響應式的控制器大小
   */
  static getResponsiveControlSize(): number {
    if (ResponsiveUtils.isSmallScreen()) return 36;
    if (ResponsiveUtils.isMobile()) return 32;
    return 24;
  }
}

/**
 * 主題工具類
 */
export class ThemeStyleUtils {
  /**
   * 獲取 CSS 變量值
   */
  static getCSSVariable(name: string, fallback?: string): string {
    if (typeof document === 'undefined') return fallback || '';
    
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    
    return value || fallback || '';
  }

  /**
   * 設置 CSS 變量
   */
  static setCSSVariable(name: string, value: string): void {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty(name, value);
  }

  /**
   * 移除 CSS 變量
   */
  static removeCSSVariable(name: string): void {
    if (typeof document === 'undefined') return;
    document.documentElement.style.removeProperty(name);
  }

  /**
   * 批量設置 CSS 變量
   */
  static setCSSVariables(variables: Record<string, string>): void {
    Object.entries(variables).forEach(([name, value]) => {
      ThemeStyleUtils.setCSSVariable(name, value);
    });
  }

  /**
   * 創建主題感知的樣式
   */
  static createThemeAwareStyle(
    lightStyles: CSSProperties,
    darkStyles: CSSProperties,
    currentTheme: 'light' | 'dark'
  ): CSSProperties {
    return currentTheme === 'dark' ? darkStyles : lightStyles;
  }
}

/**
 * 便捷的類名組合函數（全局導出）
 */
export const cc = StyleUtils.combineClasses;

/**
 * 預定義的樣式常量
 */
export const PRESET_STYLES = {
  /**
   * 容器樣式
   */
  container: {
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },

  /**
   * 隱藏元素樣式
   */
  hidden: {
    display: 'none',
  },

  /**
   * 可見元素樣式
   */
  visible: {
    display: 'block',
  },

  /**
   * 禁用指針事件
   */
  noPointerEvents: {
    pointerEvents: 'none' as const,
  },

  /**
   * 啟用指針事件
   */
  allPointerEvents: {
    pointerEvents: 'all' as const,
  },

  /**
   * 禁用用戶選擇
   */
  noUserSelect: {
    userSelect: 'none' as const,
    WebkitUserSelect: 'none' as const,
    MozUserSelect: 'none' as const,
    msUserSelect: 'none' as const,
  },

  /**
   * 中心對齊
   */
  centerAlign: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /**
   * 絕對定位到中心
   */
  absoluteCenter: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
} as const;

// 類型已在上面直接導出，不需要重複導出