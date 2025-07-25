import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Angular XYFlow 範例應用主組件
 * 簡化版本 - 直接包含路由出口
 */

@Component({
  selector: 'app-basic',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="app-basic">
      <header class="app-header">
        <h1>Angular XYFlow Basic Example</h1>
      </header>
      <main class="app-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-basic {
      width: 100vw;
      height: 100vh;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
        'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
        'Helvetica Neue', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      display: flex;
      flex-direction: column;
    }
    
    .app-header {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 1rem 2rem;
      flex-shrink: 0;
    }
    
    .app-header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
    }
    
    .app-content {
      flex: 1;
    }
  `]
})
export class AppBasic {}
