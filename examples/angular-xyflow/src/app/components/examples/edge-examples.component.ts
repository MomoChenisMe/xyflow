import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SmoothStepEdgeComponent } from '../components/Edges/SmoothStepEdge/smooth-step-edge.component';
import { StepEdgeComponent } from '../components/Edges/StepEdge/step-edge.component';
import { Position } from '../components/Edges/edges.types';

/**
 * EdgeExamples - 邊緣組件示例
 * 
 * 演示各種邊緣類型的使用方法
 */
@Component({
  selector: 'edge-examples',
  standalone: true,
  imports: [CommonModule, SmoothStepEdgeComponent, StepEdgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="edge-examples">
      <h3>邊緣組件示例</h3>
      
      <div class="example-section">
        <h4>SmoothStepEdge - 平滑階梯邊緣</h4>
        <svg width="400" height="200" viewBox="0 0 400 200">
          <xy-smooth-step-edge
            [source]="'node1'"
            [target]="'node2'"
            [sourceX]="50"
            [sourceY]="100"
            [targetX]="350"
            [targetY]="100"
            [sourcePosition]="Position.Right"
            [targetPosition]="Position.Left"
            [pathOptions]="{ borderRadius: 10, offset: 30 }"
            [style]="{ stroke: '#555', strokeWidth: 2 }"
            [markerEnd]="'url(#arrow)'">
          </xy-smooth-step-edge>
          
          <!-- 箭頭標記 -->
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" 
                    refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#555"/>
            </marker>
          </defs>
        </svg>
      </div>
      
      <div class="example-section">
        <h4>StepEdge - 直角階梯邊緣</h4>
        <svg width="400" height="200" viewBox="0 0 400 200">
          <xy-step-edge
            [source]="'node3'"
            [target]="'node4'"
            [sourceX]="50"
            [sourceY]="100"
            [targetX]="350"
            [targetY]="150"
            [sourcePosition]="Position.Right"
            [targetPosition]="Position.Left"
            [pathOptions]="{ offset: 40 }"
            [style]="{ stroke: '#0066cc', strokeWidth: 2 }"
            [markerEnd]="'url(#blue-arrow)'">
          </xy-step-edge>
          
          <!-- 藍色箭頭標記 -->
          <defs>
            <marker id="blue-arrow" markerWidth="10" markerHeight="10" 
                    refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#0066cc"/>
            </marker>
          </defs>
        </svg>
      </div>
    </div>
  `,
  styles: [`
    .edge-examples {
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    
    .example-section {
      margin-bottom: 30px;
    }
    
    h3 {
      color: #333;
      margin-bottom: 20px;
    }
    
    h4 {
      color: #666;
      margin-bottom: 10px;
    }
    
    svg {
      border: 1px solid #eee;
      background: #fff;
    }
  `]
})
export class EdgeExamplesComponent {
  Position = Position;
}