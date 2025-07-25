import { Component, signal, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';

import routes from './routes';

/**
 * Angular XYFlow 範例頁面頭部組件
 * 對應 React 的 /examples/react/src/App/header.tsx
 * 
 * 功能：
 * - 顯示應用標題和 logo
 * - 提供範例選擇下拉選單
 * - 處理路由導航
 * - 動態更新頁面標題
 */

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-layout">
      <header class="app-header">
        <a class="logo" href="https://github.com/xyflow/xyflow" target="_blank" rel="noopener">
          Angular XYFlow Dev
        </a>
        <select 
          [value]="currentPath()" 
          (change)="onRouteChange($event)"
          class="route-selector"
        >
          @for (route of routes; track route.path) {
            <option [value]="route.path">
              {{ route.name }}
            </option>
          }
        </select>
      </header>
      
      <main class="app-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
    }

    .app-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background: #fff;
      border-bottom: 1px solid #e1e5e9;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      flex-shrink: 0;
    }

    .logo {
      font-size: 18px;
      font-weight: 600;
      color: #374151;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .logo:hover {
      color: #7c3aed;
    }

    .route-selector {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      font-size: 14px;
      color: #374151;
      cursor: pointer;
      min-width: 200px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .route-selector:focus {
      outline: none;
      border-color: #7c3aed;
      box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
    }

    .route-selector:hover {
      border-color: #9ca3af;
    }

    .app-content {
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    /* 確保路由組件占滿剩餘空間 */
    :host ::ng-deep .app-content > * {
      height: 100%;
      width: 100%;
    }
  `]
})
export class HeaderComponent {
  private router = inject(Router);
  private titleService = inject(Title);
  
  // 可用的路由
  public routes = routes;
  
  // 當前路徑信號
  public currentPath = signal('basic'); // 默認顯示 Basic 範例

  constructor() {
    // 監聽路徑變化，更新頁面標題
    effect(() => {
      const currentRoute = this.routes.find(route => route.path === this.currentPath());
      const title = `Angular XYFlow Examples${currentRoute ? ' - ' + currentRoute.name : ''}`;
      this.titleService.setTitle(title);
    });

    // 初始化時導航到默認路由
    this.navigateToRoute(this.currentPath());
  }

  /**
   * 處理路由選擇變化
   */
  onRouteChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newPath = target.value;
    this.currentPath.set(newPath);
    this.navigateToRoute(newPath);
  }

  /**
   * 導航到指定路由
   */
  private navigateToRoute(path: string) {
    this.router.navigate(['/examples', path]).catch(err => {
      console.error('Navigation failed:', err);
    });
  }
}