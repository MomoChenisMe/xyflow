import { Component, effect, signal, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { routeList, IRoute } from '../../app.routes';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header>
      <a class="logo" href="https://github.com/xyflow/xyflow">
        Angular Flow Dev
      </a>
      <select [value]="currentPath()" (change)="onPathChange($event)">
        @for (route of routes; track route.path) {
          <option [value]="route.path">{{ route.name }}</option>
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
    
    select {
      padding: 0.5rem;
      border: 1px solid #e5e5e5;
      border-radius: 4px;
      background: #fff;
      font-size: 0.9rem;
      min-width: 200px;
    }
    
    select:focus {
      outline: none;
      border-color: #0ea5e9;
    }
  `]
})
export class HeaderComponent implements OnDestroy {
  routes = routeList;
  currentPath = signal('basic');
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private location: Location,
    private titleService: Title
  ) {
    // 初始化當前路徑（移除前導斜線）
    const initialPath = this.location.path().replace(/^\//, '') || 'basic';
    this.currentPath.set(initialPath);
    
    // 監聽路由變化事件
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        const newPath = event.urlAfterRedirects.replace(/^\//, '') || 'basic';
        // 只有在路徑確實不同時才更新，避免觸發不必要的更新
        if (this.currentPath() !== newPath) {
          this.currentPath.set(newPath);
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
    
    // 直接導航到新路徑，路由事件會自動更新 currentPath
    this.router.navigate([`/${newPath}`]);
  }
}