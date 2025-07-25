import { 
  Component, 
  input, 
  ElementRef, 
  viewChild, 
  AfterViewInit, 
  OnDestroy, 
  computed, 
  effect,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  ResizeControlProps, 
  ResizeControlLineProps, 
  ResizeControlVariant, 
  ControlPosition,
  ControlLinePosition,
  ResizeBoundaries,
  ResizeParams,
  ShouldResize,
  OnResizeStart,
  OnResize,
  OnResizeEnd,
  ResizeControlDirection
} from './node-resizer.types';

// Mock XYResizer implementation - in real app this would come from @xyflow/system
interface XYResizerInstance {
  destroy(): void;
  update(config: any): void;
}

interface XYResizerChange {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface XYResizerChildChange {
  id: string;
  position: { x: number; y: number };
}

// Mock XYResizer factory
const XYResizer = (config: {
  domNode: HTMLElement;
  nodeId: string;
  getStoreItems: () => any;
  onChange: (change: XYResizerChange, childChanges: XYResizerChildChange[]) => void;
  onEnd: (params: { width: number; height: number }) => void;
}): XYResizerInstance => {
  return {
    destroy: () => {},
    update: () => {}
  };
};

const defaultPositions: Record<ResizeControlVariant, ControlPosition> = {
  [ResizeControlVariant.Line]: ControlPosition.Right,
  [ResizeControlVariant.Handle]: ControlPosition.BottomRight,
};

/**
 * To create your own resizing UI, you can use the `NodeResizeControl` component where you can pass children (such as icons).
 * @public
 */
@Component({
  selector: 'xy-node-resize-control',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #resizeControlRef
      [class]="controlClass()"
      [ngStyle]="controlStyle"
    >
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./node-resizer.styles.css'],
  styles: [`
    :host {
      position: absolute;
      user-select: none;
      pointer-events: all;
      
      &.handle {
        border: 1px solid;
        background: var(--xy-resize-background-color, var(--xy-resize-background-color-default));
        width: 10px;
        height: 10px;
        border-radius: 1px;
        
        &.top-left {
          top: -5px;
          left: -5px;
          cursor: nw-resize;
        }
        
        &.top {
          top: -5px;
          left: 50%;
          margin-left: -5px;
          cursor: n-resize;
        }
        
        &.top-right {
          top: -5px;
          right: -5px;
          cursor: ne-resize;
        }
        
        &.right {
          top: 50%;
          right: -5px;
          margin-top: -5px;
          cursor: e-resize;
        }
        
        &.bottom-right {
          bottom: -5px;
          right: -5px;
          cursor: se-resize;
        }
        
        &.bottom {
          bottom: -5px;
          left: 50%;
          margin-left: -5px;
          cursor: s-resize;
        }
        
        &.bottom-left {
          bottom: -5px;
          left: -5px;
          cursor: sw-resize;
        }
        
        &.left {
          top: 50%;
          left: -5px;
          margin-top: -5px;
          cursor: w-resize;
        }
      }
      
      &.line {
        border: 1px solid;
        border-color: var(--xy-resize-background-color, var(--xy-resize-background-color-default));
        
        &.top {
          top: 0;
          left: 0;
          width: 100%;
          height: 0;
          cursor: n-resize;
        }
        
        &.right {
          top: 0;
          right: 0;
          width: 0;
          height: 100%;
          cursor: e-resize;
        }
        
        &.bottom {
          bottom: 0;
          left: 0;
          width: 100%;
          height: 0;
          cursor: s-resize;
        }
        
        &.left {
          top: 0;
          left: 0;
          width: 0;
          height: 100%;
          cursor: w-resize;
        }
      }
    }
  `]
})
export class NodeResizeControl implements AfterViewInit, OnDestroy {
  resizeControlRef = viewChild.required<ElementRef<HTMLDivElement>>('resizeControlRef');

  // Angular Flow context injection (mocked for now)
  // In real implementation, these would be injected from Angular Flow services
  nodeId = input<string>();
  store = input<any>(); // Store service would be injected
  contextNodeId = input<string>(); // From node context service

  // Control configuration
  position = input<ControlPosition | ControlLinePosition>();
  variant = input<ResizeControlVariant>(ResizeControlVariant.Handle);
  className = input<string>();
  style = input<{ [key: string]: any }>();
  color = input<string>();
  
  // Resize constraints
  minWidth = input<number>(10);
  minHeight = input<number>(10);
  maxWidth = input<number>(Number.MAX_VALUE);
  maxHeight = input<number>(Number.MAX_VALUE);
  keepAspectRatio = input<boolean>(false);
  resizeDirection = input<ResizeControlDirection>();
  autoScale = input<boolean>(true);
  
  // Event callbacks
  shouldResize = input<ShouldResize>();
  onResizeStart = input<OnResizeStart>();
  onResize = input<OnResize>();
  onResizeEnd = input<OnResizeEnd>();

  // Transform for auto scaling (would come from store)
  transform = input<[number, number, number]>([0, 0, 1]);

  private resizer: XYResizerInstance | null = null;

  // Computed properties
  effectiveNodeId = computed(() => this.nodeId() || this.contextNodeId());
  
  isHandleControl = computed(() => this.variant() === ResizeControlVariant.Handle);
  
  controlPosition = computed(() => this.position() ?? defaultPositions[this.variant()]);
  
  scale = computed(() => {
    if (this.isHandleControl() && this.autoScale()) {
      return `${Math.max(1 / this.transform()[2], 1)}`;
    }
    return undefined;
  });

  positionClassNames = computed(() => this.controlPosition().split('-'));

  controlClass = computed(() => {
    const classes = [
      'react-flow__resize-control',
      'nodrag',
      ...this.positionClassNames(),
      this.variant()
    ];
    
    const className = this.className();
    if (className) {
      classes.push(className);
    }
    
    return classes.join(' ');
  });

  controlStyle = computed(() => {
    const style = { ...this.style() };
    
    const scale = this.scale();
    if (scale) {
      style['scale'] = scale;
    }
    
    const color = this.color();
    if (color) {
      if (this.isHandleControl()) {
        style['backgroundColor'] = color;
      } else {
        style['borderColor'] = color;
      }
    }
    
    return style;
  });

  constructor() {
    // Effect to update resizer when properties change
    effect(() => {
      if (this.resizer) {
        this.updateResizer();
      }
    });
  }

  ngAfterViewInit() {
    this.initializeResizer();
  }

  ngOnDestroy() {
    this.resizer?.destroy();
  }

  private initializeResizer() {
    const nodeId = this.effectiveNodeId();
    if (!this.resizeControlRef()?.nativeElement || !nodeId) {
      return;
    }

    this.resizer = XYResizer({
      domNode: this.resizeControlRef().nativeElement,
      nodeId,
      getStoreItems: () => this.getStoreItems(),
      onChange: (change: XYResizerChange, childChanges: XYResizerChildChange[]) => {
        this.handleResizerChange(change, childChanges);
      },
      onEnd: ({ width, height }: { width: number; height: number }) => {
        this.handleResizerEnd(width, height);
      }
    });

    this.updateResizer();
  }

  private updateResizer() {
    if (!this.resizer) return;

    this.resizer.update({
      controlPosition: this.controlPosition(),
      boundaries: {
        minWidth: this.minWidth(),
        minHeight: this.minHeight(),
        maxWidth: this.maxWidth(),
        maxHeight: this.maxHeight(),
      },
      keepAspectRatio: this.keepAspectRatio(),
      resizeDirection: this.resizeDirection(),
      onResizeStart: this.onResizeStart(),
      onResize: this.onResize(),
      onResizeEnd: this.onResizeEnd(),
      shouldResize: this.shouldResize(),
    });
  }

  private getStoreItems() {
    // Mock implementation - in real app this would get data from Angular Flow store
    return {
      nodeLookup: new Map(),
      transform: this.transform(),
      snapGrid: [15, 15],
      snapToGrid: false,
      nodeOrigin: [0, 0],
      paneDomNode: null,
    };
  }

  private handleResizerChange(change: XYResizerChange, childChanges: XYResizerChildChange[]) {
    // Mock implementation - in real app this would trigger node changes in store
    console.log('Resize change:', change, childChanges);
  }

  private handleResizerEnd(width: number, height: number) {
    // Mock implementation - in real app this would trigger final dimension change
    console.log('Resize end:', width, height);
  }
}

/**
 * ResizeControlLine component for line-style resize controls
 */
@Component({
  selector: 'xy-resize-control-line',
  standalone: true,
  imports: [CommonModule, NodeResizeControl],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <xy-node-resize-control
      [nodeId]="nodeId()"
      [position]="position()"
      [variant]="ResizeControlVariant.Line"
      [className]="className()"
      [style]="style()"
      [color]="color()"
      [minWidth]="minWidth()"
      [minHeight]="minHeight()"
      [maxWidth]="maxWidth()"
      [maxHeight]="maxHeight()"
      [keepAspectRatio]="keepAspectRatio()"
      [autoScale]="autoScale()"
      [shouldResize]="shouldResize()"
      [onResizeStart]="onResizeStart()"
      [onResize]="onResize()"
      [onResizeEnd]="onResizeEnd()"
    >
      <ng-content></ng-content>
    </xy-node-resize-control>
  `
})
export class ResizeControlLine {
  nodeId = input<string>();
  position = input<ControlLinePosition>();
  className = input<string>();
  style = input<{ [key: string]: any }>();
  color = input<string>();
  minWidth = input<number>(10);
  minHeight = input<number>(10);
  maxWidth = input<number>(Number.MAX_VALUE);
  maxHeight = input<number>(Number.MAX_VALUE);
  keepAspectRatio = input<boolean>(false);
  autoScale = input<boolean>(true);
  shouldResize = input<ShouldResize>();
  onResizeStart = input<OnResizeStart>();
  onResize = input<OnResize>();
  onResizeEnd = input<OnResizeEnd>();

  readonly ResizeControlVariant = ResizeControlVariant;
}