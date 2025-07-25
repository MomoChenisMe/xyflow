/**
 * Angular XYFlow DOM 工具
 * 
 * 提供DOM操作相關的工具函數
 * 包括元素查找、尺寸計算、事件處理等
 */

import { XYPosition, Dimensions, Rect } from '../types/system-types';

// ===================
// DOM 查詢工具
// ===================

/**
 * 查找最近的父元素
 */
export function findClosestParent(
  element: Element,
  selector: string
): Element | null {
  let current = element.parentElement;
  
  while (current) {
    if (current.matches(selector)) {
      return current;
    }
    current = current.parentElement;
  }
  
  return null;
}

/**
 * 檢查元素是否包含特定類名
 */
export function hasClass(element: Element, className: string): boolean {
  return element.classList.contains(className);
}

/**
 * 添加多個類名
 */
export function addClasses(element: Element, classNames: string[]): void {
  element.classList.add(...classNames);
}

/**
 * 移除多個類名
 */
export function removeClasses(element: Element, classNames: string[]): void {
  element.classList.remove(...classNames);
}

/**
 * 切換類名
 */
export function toggleClass(element: Element, className: string, force?: boolean): boolean {
  return element.classList.toggle(className, force);
}

// ===================
// 尺寸和位置計算
// ===================

/**
 * 獲取元素的邊界矩形
 */
export function getElementBounds(element: Element): Rect {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height
  };
}

/**
 * 獲取元素尺寸
 */
export function getElementDimensions(element: Element): Dimensions {
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height
  };
}

/**
 * 獲取元素位置
 */
export function getElementPosition(element: Element): XYPosition {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top
  };
}

/**
 * 獲取元素相對於父元素的位置
 */
export function getElementRelativePosition(
  element: Element,
  parent: Element
): XYPosition {
  const elementRect = element.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();
  
  return {
    x: elementRect.left - parentRect.left,
    y: elementRect.top - parentRect.top
  };
}

/**
 * 獲取視窗尺寸
 */
export function getViewportDimensions(): Dimensions {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

// ===================
// 滾動處理
// ===================

/**
 * 獲取元素滾動位置
 */
export function getElementScrollPosition(element: Element): XYPosition {
  return {
    x: element.scrollLeft,
    y: element.scrollTop
  };
}

/**
 * 設置元素滾動位置
 */
export function setElementScrollPosition(
  element: Element,
  position: XYPosition
): void {
  element.scrollLeft = position.x;
  element.scrollTop = position.y;
}

/**
 * 平滑滾動到位置
 */
export function smoothScrollTo(
  element: Element,
  position: XYPosition,
  behavior: ScrollBehavior = 'smooth'
): void {
  element.scrollTo({
    left: position.x,
    top: position.y,
    behavior
  });
}

/**
 * 檢查元素是否可滾動
 */
export function isElementScrollable(element: Element): boolean {
  const style = window.getComputedStyle(element);
  const overflow = style.overflow + style.overflowX + style.overflowY;
  
  return /auto|scroll/.test(overflow) && (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}

// ===================
// 事件處理工具
// ===================

/**
 * 獲取鼠標/觸摸事件的位置
 */
export function getEventPosition(
  event: MouseEvent | TouchEvent,
  bounds?: DOMRect | null
): XYPosition {
  let position: XYPosition;
  
  if ('touches' in event && event.touches.length > 0) {
    const touch = event.touches[0];
    position = { x: touch.clientX, y: touch.clientY };
  } else if ('changedTouches' in event && event.changedTouches.length > 0) {
    const touch = event.changedTouches[0];
    position = { x: touch.clientX, y: touch.clientY };
  } else {
    position = { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY };
  }
  
  // 如果提供了邊界，計算相對位置
  if (bounds) {
    return {
      x: position.x - bounds.left,
      y: position.y - bounds.top
    };
  }
  
  return position;
}

/**
 * 獲取相對於元素的事件位置
 */
export function getEventPositionRelative(
  event: MouseEvent | TouchEvent,
  element: Element
): XYPosition {
  const eventPos = getEventPosition(event);
  const elementRect = element.getBoundingClientRect();
  
  return {
    x: eventPos.x - elementRect.left,
    y: eventPos.y - elementRect.top
  };
}

/**
 * 檢查是否為觸摸事件
 */
export function isTouchEvent(event: Event): event is TouchEvent {
  return 'touches' in event;
}

/**
 * 檢查是否為鼠標事件
 */
export function isMouseEvent(event: Event): event is MouseEvent {
  return 'clientX' in event && 'clientY' in event;
}

/**
 * 阻止事件冒泡和默認行為
 */
export function preventDefault(event: Event): void {
  event.preventDefault();
  event.stopPropagation();
}

// ===================
// CSS 樣式工具
// ===================

/**
 * 設置CSS變量
 */
export function setCSSVariable(
  element: Element,
  name: string,
  value: string
): void {
  (element as HTMLElement).style.setProperty(`--${name}`, value);
}

/**
 * 獲取CSS變量值
 */
export function getCSSVariable(
  element: Element,
  name: string
): string {
  return getComputedStyle(element).getPropertyValue(`--${name}`).trim();
}

/**
 * 設置多個CSS變量
 */
export function setCSSVariables(
  element: Element,
  variables: Record<string, string>
): void {
  Object.entries(variables).forEach(([name, value]) => {
    setCSSVariable(element, name, value);
  });
}

/**
 * 應用內聯樣式
 */
export function applyStyles(
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration>
): void {
  Object.assign(element.style, styles);
}

/**
 * 獲取計算樣式
 */
export function getComputedStyleProperty(
  element: Element,
  property: string
): string {
  return getComputedStyle(element).getPropertyValue(property);
}

// ===================
// 元素創建和操作
// ===================

/**
 * 創建元素
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  attributes?: Record<string, string>,
  styles?: Partial<CSSStyleDeclaration>
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  
  if (styles) {
    applyStyles(element, styles);
  }
  
  return element;
}

/**
 * 創建SVG元素
 */
export function createSVGElement<K extends keyof SVGElementTagNameMap>(
  tagName: K,
  attributes?: Record<string, string>
): SVGElementTagNameMap[K] {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
  
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  
  return element;
}

/**
 * 設置元素屬性
 */
export function setAttributes(
  element: Element,
  attributes: Record<string, string>
): void {
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

/**
 * 移除元素屬性
 */
export function removeAttributes(
  element: Element,
  attributes: string[]
): void {
  attributes.forEach(attr => element.removeAttribute(attr));
}

// ===================
// 可見性檢測
// ===================

/**
 * 檢查元素是否在視窗內可見
 */
export function isElementInViewport(
  element: Element,
  threshold: number = 0
): boolean {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  return (
    rect.top >= -threshold &&
    rect.left >= -threshold &&
    rect.bottom <= windowHeight + threshold &&
    rect.right <= windowWidth + threshold
  );
}

/**
 * 檢查元素是否部分可見
 */
export function isElementPartiallyVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < windowHeight &&
    rect.left < windowWidth
  );
}

/**
 * 觀察元素可見性變化
 */
export function observeElementVisibility(
  element: Element,
  callback: (isVisible: boolean) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      callback(entry.isIntersecting);
    });
  }, options);
  
  observer.observe(element);
  return observer;
}

// ===================
// 焦點管理
// ===================

/**
 * 設置元素焦點
 */
export function focusElement(element: HTMLElement): void {
  element.focus();
}

/**
 * 移除元素焦點
 */
export function blurElement(element: HTMLElement): void {
  element.blur();
}

/**
 * 檢查元素是否有焦點
 */
export function isElementFocused(element: Element): boolean {
  return document.activeElement === element;
}

/**
 * 獲取可聚焦的元素
 */
export function getFocusableElements(container: Element): Element[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');
  
  return Array.from(container.querySelectorAll(focusableSelectors));
}

// ===================
// 拖拽輔助工具
// ===================

/**
 * 檢查拖拽事件是否包含文件
 */
export function dragEventHasFiles(event: DragEvent): boolean {
  return event.dataTransfer?.types.includes('Files') ?? false;
}

/**
 * 獲取拖拽事件的文件
 */
export function getDragEventFiles(event: DragEvent): File[] {
  return Array.from(event.dataTransfer?.files ?? []);
}

/**
 * 設置拖拽數據
 */
export function setDragData(
  dataTransfer: DataTransfer,
  type: string,
  data: string
): void {
  dataTransfer.setData(type, data);
}

/**
 * 獲取拖拽數據
 */
export function getDragData(
  dataTransfer: DataTransfer,
  type: string
): string {
  return dataTransfer.getData(type);
}

// ===================
// XYFlow 專用工具
// ===================

/**
 * 獲取元素的宿主文檔
 */
export function getHostForElement(element: Element | EventTarget | null): Document {
  if (!element) {
    return document;
  }
  
  const el = element as Element;
  const root = el.getRootNode();
  
  // 如果是文檔節點，直接返回
  if (root.nodeType === Node.DOCUMENT_NODE) {
    return root as Document;
  }
  
  // 如果是影子根，返回影子根的宿主文檔
  if ('host' in root) {
    return (root as ShadowRoot).ownerDocument || document;
  }
  
  return document;
}

/**
 * 計算自動平移
 */
export function calcAutoPan(
  position: XYPosition | undefined,
  bounds: DOMRect | null,
  speed = 15
): [number, number] {
  if (!position || !bounds) {
    return [0, 0];
  }
  
  const threshold = 50;
  let xMovement = 0;
  let yMovement = 0;
  
  if (position.x < threshold) {
    xMovement = -speed;
  } else if (position.x > bounds.width - threshold) {
    xMovement = speed;
  }
  
  if (position.y < threshold) {
    yMovement = -speed;
  } else if (position.y > bounds.height - threshold) {
    yMovement = speed;
  }
  
  return [xMovement, yMovement];
}

/**
 * 添加邊線到邊線列表
 */
export function addEdge(edgeParams: any, edges: any[]): any[] {
  return [...edges, { ...edgeParams, id: edgeParams.id || `edge-${Date.now()}` }];
}