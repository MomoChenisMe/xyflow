import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppBasic } from './app/app-basic';
import { routes } from './app/app.routes';
import {
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';

/**
 * Angular XYFlow 範例應用啟動文件
 * 配置路由和其他服務提供者
 */
bootstrapApplication(AppBasic, {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
  ],
}).catch((err) => console.error(err));
