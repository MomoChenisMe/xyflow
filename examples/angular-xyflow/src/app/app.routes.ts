import { Routes } from '@angular/router';
import { BasicExample } from './examples/basic';
import { AngularBasicModernComponent } from './components/examples/angular-basic-modern.component';
import { TestSimpleDragComponent } from './components/test-simple-drag.component';

/**
 * Angular XYFlow 應用路由配置
 * 簡化版本 - 直接顯示 BasicExample
 */
export const routes: Routes = [
  // 根路徑顯示基本範例 (新版本使用Signals)
  {
    path: '',
    component: AngularBasicModernComponent,
  },

  // 基本範例路由 (新版本使用Signals)
  {
    path: 'basic',
    component: AngularBasicModernComponent,
  },

  // 舊版本基本範例路由
  {
    path: 'basic-old',
    component: BasicExample,
  },

  // 測試拖拉功能
  {
    path: 'test-drag',
    component: TestSimpleDragComponent,
  },

  // 未匹配的路由重定向到根路徑
  {
    path: '**',
    redirectTo: '/',
  },
];
