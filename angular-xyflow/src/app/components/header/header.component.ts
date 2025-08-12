import { Component, ChangeDetectionStrategy, effect, signal, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { routeList } from '../../app.routes';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <a class="logo" href="https://github.com/xyflow/xyflow">
        Angular Flow Dev
      </a>
      <select [value]="currentPath()" (change)="onPathChange($event)" class="route-select">
        @for (route of routes; track route.path) {
          <option [value]="route.path" [selected]="currentPath() === route.path">{{ route.name }}</option>
        }
      </select>
    </header>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #fff;
      border-bottom: 1px solid #e5e5e5;
    }
    
    .logo {
      color: #333;
      text-decoration: none;
      font-weight: 600;
      font-size: 1.2rem;
    }
    
    .logo:hover {
      color: #0ea5e9;
    }
    
    .route-select {
      padding: 0.5rem;
      border: 1px solid #e5e5e5;
      border-radius: 4px;
      background: #fff;
      font-size: 0.9rem;
      min-width: 200px;
      cursor: pointer;
    }
    
    .route-select:focus {
      outline: none;
      border-color: #0ea5e9;
      box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.1);
    }
    
    .route-select:hover {
      border-color: #94a3b8;
    }
  `]
})
export class HeaderComponent implements OnDestroy {
  routes = routeList;
  currentPath = signal('basic');
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private titleService: Title
  ) {
    // 提取路徑的統一方法
    const extractPath = (url: string): string => {
      // 移除前導斜線和查詢參數/片段
      const cleanPath = url.split('?')[0].split('#')[0].replace(/^\//, '');
      // 確保返回有效路徑，如果為空則返回 'basic'
      return cleanPath || 'basic';
    };

    // 初始化當前路徑
    const initialPath = extractPath(this.router.url);
    this.currentPath.set(initialPath);
    
    // 監聽路由變化事件
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        const newPath = extractPath(event.urlAfterRedirects);
        
        // 確保新路徑是有效的路由
        const isValidRoute = this.routes.some(route => route.path === newPath);
        const finalPath = isValidRoute ? newPath : 'basic';
        
        // 只有在路徑確實不同時才更新
        if (this.currentPath() !== finalPath) {
          this.currentPath.set(finalPath);
        }
      });
    
    // 當路徑改變時更新文檔標題
    effect(() => {
      const path = this.currentPath();
      const route = this.routes.find((route) => route.path === path);
      const pageName = route?.name;
      
      this.titleService.setTitle(`Angular Flow Examples${pageName ? ' - ' + pageName : ''}`);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPathChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newPath = select.value;
    
    // 驗證新路徑是否有效
    const isValidRoute = this.routes.some(route => route.path === newPath);
    
    if (isValidRoute && newPath !== this.currentPath()) {
      // 導航到新路徑
      this.router.navigate([`/${newPath}`]).catch((error) => {
        console.error('導航失敗:', error);
        // 如果導航失敗，重置 select 的值
        select.value = this.currentPath();
      });
    } else if (!isValidRoute) {
      // 如果路徑無效，重置 select 的值
      select.value = this.currentPath();
    }
  }
}