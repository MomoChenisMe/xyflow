import {
  Component,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { RouterOutlet, provideRouter } from '@angular/router';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppBasic } from './app-basic';
import { routes } from './app.routes';

/**
 * Angular XYFlow 範例應用根組件
 * 對應 React 的 BrowserRouter 結構
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: ` <router-outlet /> `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class App {}

/**
 * 啟動應用 - 配置路由和服務
 */
export function startApp() {
  return bootstrapApplication(AppBasic, {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideZonelessChangeDetection(),
      provideRouter(routes),
    ],
  });
}
