import { 
  Component, 
  input, 
  computed,
  inject,
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularFlowService } from '../angular-flow.service';

@Component({
  selector: 'angular-flow-minimap',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div 
      class="angular-flow__minimap"
      [style.position]="'absolute'"
      [style.bottom]="'10px'"
      [style.right]="'10px'"
      [style.width]="width() + 'px'"
      [style.height]="height() + 'px'"
      [style.background]="backgroundColor()"
      [style.border]="'1px solid #ddd'"
      [style.border-radius]="'4px'"
      [style.z-index]="'5'"
      [style.overflow]="'hidden'"
    >
      <svg 
        [attr.width]="width()"
        [attr.height]="height()"
        [attr.viewBox]="viewBox()"
        class="angular-flow__minimap-svg"
      >
        <!-- Background -->
        <rect
          [attr.width]="width()"
          [attr.height]="height()"
          [attr.fill]="backgroundColor()"
        />
        
        <!-- Nodes -->
        @for (node of visibleNodes(); track node.id) {
          <rect
            [attr.x]="getNodeMiniMapX(node)"
            [attr.y]="getNodeMiniMapY(node)"
            [attr.width]="getNodeMiniMapWidth(node)"
            [attr.height]="getNodeMiniMapHeight(node)"
            [attr.fill]="getNodeColor(node)"
            [attr.stroke]="getNodeStrokeColor(node)"
            [attr.stroke-width]="1"
            [attr.rx]="2"
          />
        }
        
        <!-- Viewport indicator -->
        <rect
          [attr.x]="viewportRect().x"
          [attr.y]="viewportRect().y"
          [attr.width]="viewportRect().width"
          [attr.height]="viewportRect().height"
          fill="none"
          [attr.stroke]="maskColor()"
          stroke-width="2"
          [attr.stroke-dasharray]="'4,4'"
        />
        
        <!-- Mask overlay -->
        <defs>
          <mask id="minimap-mask">
            <rect width="100%" height="100%" fill="white"/>
            <rect
              [attr.x]="viewportRect().x"
              [attr.y]="viewportRect().y"
              [attr.width]="viewportRect().width"
              [attr.height]="viewportRect().height"
              fill="black"
            />
          </mask>
        </defs>
        
        <rect
          width="100%"
          height="100%"
          [attr.fill]="maskColor()"
          [attr.opacity]="0.3"
          mask="url(#minimap-mask)"
        />
      </svg>
    </div>
  `,
  styles: [`
    .angular-flow__minimap {
      position: absolute;
      bottom: 10px;
      right: 10px;
      z-index: 5;
      overflow: hidden;
      border-radius: 4px;
      border: 1px solid #ddd;
    }

    .angular-flow__minimap-svg {
      display: block;
    }
  `]
})
export class MinimapComponent {
  // 注入服務
  private flowService = inject(AngularFlowService);
  
  // 輸入屬性
  readonly width = input<number>(200);
  readonly height = input<number>(150);
  readonly backgroundColor = input<string>('#fff');
  readonly nodeColor = input<string>('#e2e2e2');
  readonly nodeStrokeColor = input<string>('#222');
  readonly maskColor = input<string>('#ff0072');
  
  // 計算屬性
  readonly visibleNodes = computed(() => {
    return this.flowService.nodes();
  });
  
  readonly viewBox = computed(() => {
    const nodes = this.visibleNodes();
    if (nodes.length === 0) {
      return `0 0 ${this.width()} ${this.height()}`;
    }
    
    // 計算所有節點的邊界
    const bounds = this.getNodesBounds(nodes);
    const padding = 20;
    
    return `${bounds.x - padding} ${bounds.y - padding} ${bounds.width + padding * 2} ${bounds.height + padding * 2}`;
  });
  
  readonly viewportRect = computed(() => {
    const viewport = this.flowService.viewport();
    const nodes = this.visibleNodes();
    
    if (nodes.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    const bounds = this.getNodesBounds(nodes);
    const padding = 20;
    const totalWidth = bounds.width + padding * 2;
    const totalHeight = bounds.height + padding * 2;
    
    // 視口在 minimap 中的位置和大小
    const scale = Math.min(this.width() / totalWidth, this.height() / totalHeight);
    
    return {
      x: (-viewport.x * scale),
      y: (-viewport.y * scale),
      width: this.width() / viewport.zoom * scale,
      height: this.height() / viewport.zoom * scale
    };
  });

  // 獲取節點在 minimap 中的位置和大小
  getNodeMiniMapX(node: any): number {
    return node.position.x;
  }

  getNodeMiniMapY(node: any): number {
    return node.position.y;
  }

  getNodeMiniMapWidth(node: any): number {
    return node.width || 150;
  }

  getNodeMiniMapHeight(node: any): number {
    return node.height || 40;
  }

  getNodeColor(node: any): string {
    if (node.selected) {
      return this.maskColor();
    }
    return this.nodeColor();
  }

  getNodeStrokeColor(node: any): string {
    if (node.selected) {
      return this.maskColor();
    }
    return this.nodeStrokeColor();
  }

  // 計算節點邊界
  private getNodesBounds(nodes: any[]) {
    if (nodes.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach(node => {
      const nodeWidth = node.width || 150;
      const nodeHeight = node.height || 40;
      
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
}