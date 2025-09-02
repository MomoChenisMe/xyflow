// Angular 核心模組
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

// 專案內部模組
import { FlowComponent } from './flow.component';

@Component({
  selector: 'app-multi-flows-example',
  standalone: true,
  imports: [
    CommonModule,
    FlowComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="multi-flows">
      <app-flow id="flow-a" />
      <app-flow id="flow-b" />
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      .multi-flows {
        display: flex;
        height: 100%;
      }

      /* 使用 ::ng-deep 覆蓋子組件樣式，對應 React 版本的 :global 選擇器 */
      .multi-flows ::ng-deep angular-xyflow {
        width: 100%;
        height: 100%;
      }

      /* 因為有 app-flow 組件包裹，使用 app-flow:first-child 選擇器 */
      .multi-flows app-flow:first-child ::ng-deep angular-xyflow {
        border-right: 2px solid #333;
      }
    `,
  ],
})
export class MultiFlowsExampleComponent {}