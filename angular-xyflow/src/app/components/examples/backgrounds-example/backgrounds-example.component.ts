import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularXYFlowComponent } from '../../angular-xyflow/angular-xyflow.component';
import { BackgroundComponent } from '../../angular-xyflow/background/background.component';
import { AngularNode, BackgroundVariant } from '../../angular-xyflow/types';

@Component({
  selector: 'app-backgrounds-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    BackgroundComponent
  ],
  template: `
    <div class="wrapper">
      <!-- Flow A: Dots -->
      <angular-xyflow
        [defaultNodes]="flowANodes"
        id="flow-a"
      >
        <angular-xyflow-background 
          [variant]="backgroundVariant.Dots" 
          id="bg-a-dots" 
        />
      </angular-xyflow>

      <!-- Flow B: Lines with gap 50x50 -->
      <angular-xyflow
        [defaultNodes]="flowBNodes"
        id="flow-b"
      >
        <angular-xyflow-background 
          [variant]="backgroundVariant.Lines" 
          [gap]="[50, 50]" 
          id="bg-b-lines"
        />
      </angular-xyflow>

      <!-- Flow C: Cross with gap 100x50 -->
      <angular-xyflow
        [defaultNodes]="flowCNodes"
        id="flow-c"
      >
        <angular-xyflow-background 
          [variant]="backgroundVariant.Cross" 
          [gap]="[100, 50]" 
          id="bg-c-cross"
        />
      </angular-xyflow>

      <!-- Flow D: Multiple background layers -->
      <angular-xyflow
        [defaultNodes]="flowDNodes"
        id="flow-d"
      >
        <angular-xyflow-background 
          [variant]="backgroundVariant.Lines" 
          [gap]="10" 
          id="bg-d-lines-1"
        />
        <angular-xyflow-background 
          [variant]="backgroundVariant.Lines" 
          [gap]="100" 
          [offset]="2" 
          [color]="'#ccc'" 
          id="bg-d-lines-2"
        />
      </angular-xyflow>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .wrapper {
      display: flex;
      height: 100%;
    }

    .wrapper angular-xyflow {
      width: 100%;
      height: 100%;
    }

    .wrapper angular-xyflow {
      border-right: 1px solid #ddd;
    }

    .wrapper angular-xyflow:last-child {
      border-right: none;
    }
  `]
})
export class BackgroundsExampleComponent {
  // 背景變體枚舉
  backgroundVariant = BackgroundVariant;

  // 為每個流程創建獨立的節點實例 - 避免共享狀態
  private createInitialNodes(): AngularNode[] {
    return [
      {
        id: '1',
        data: { label: 'Node 1' } as Record<string, unknown>,
        position: { x: 50, y: 50 },
      },
    ];
  }

  // 每個流程的獨立節點
  readonly flowANodes = this.createInitialNodes();
  readonly flowBNodes = this.createInitialNodes();
  readonly flowCNodes = this.createInitialNodes();
  readonly flowDNodes = this.createInitialNodes();
}