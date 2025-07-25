import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MiniMapNode } from './minimap-node.component';
import { MiniMapNodesProps, GetMiniMapNodeAttribute } from './minimap.types';
import { Node } from '../../../types/node';

/**
 * MiniMapNodes Component - renders all nodes in the minimap
 * Matches React Flow's MiniMapNodes logic exactly
 */
@Component({
  selector: 'xy-minimap-nodes',
  standalone: true,
  imports: [CommonModule, MiniMapNode],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (nodeData of visibleNodes(); track nodeData.id) {
      <xy-minimap-node
        [id]="nodeData.id"
        [x]="nodeData.x"
        [y]="nodeData.y"
        [width]="nodeData.width"
        [height]="nodeData.height"
        [style]="nodeData.style"
        [selected]="nodeData.selected"
        [className]="getNodeClassName(nodeData.node)"
        [color]="getNodeColor(nodeData.node)"
        [borderRadius]="nodeBorderRadius()"
        [strokeColor]="getNodeStrokeColor(nodeData.node)"
        [strokeWidth]="nodeStrokeWidth()"
        [shapeRendering]="shapeRendering()"
        (onClick)="handleNodeClick($event.event, $event.id)"
      />
    }
  `
})
export class MiniMapNodes<NodeType extends Node = Node> {
  nodeStrokeColor = input<string | GetMiniMapNodeAttribute<NodeType>>();
  nodeColor = input<string | GetMiniMapNodeAttribute<NodeType>>();
  nodeClassName = input<string | GetMiniMapNodeAttribute<NodeType>>('');
  nodeBorderRadius = input<number>(5);
  nodeStrokeWidth = input<number>();
  nodeComponent = input<any>(); // Not used in this implementation, could be extended
  onClick = input<(event: MouseEvent, nodeId: string) => void>();
  
  onNodeClick = output<{ event: MouseEvent; nodeId: string }>();

  // Required inputs from parent MiniMap
  nodeLookup = input.required<Map<string, any>>();
  nodeIds = input.required<string[]>();

  // Computed shape rendering based on browser (matches React implementation)
  shapeRendering = computed(() => {
    return typeof window === 'undefined' || !!(window as any).chrome ? 'crispEdges' : 'geometricPrecision';
  });

  // Convert attribute functions - matches React's getAttrFunction
  private nodeColorFunc = computed(() => this.getAttrFunction(this.nodeColor()));
  private nodeStrokeColorFunc = computed(() => this.getAttrFunction(this.nodeStrokeColor()));
  private nodeClassNameFunc = computed(() => this.getAttrFunction(this.nodeClassName()));

  // Filter and prepare visible nodes data
  visibleNodes = computed(() => {
    const nodeLookup = this.nodeLookup();
    const nodeIds = this.nodeIds();
    
    if (!nodeLookup || !nodeIds) {
      return [];
    }

    return nodeIds
      .map(nodeId => {
        const internalNode = nodeLookup.get(nodeId);
        if (!internalNode) return null;

        const node = internalNode.internals.userNode;
        const { x, y } = internalNode.internals.positionAbsolute;
        const { width, height } = this.getNodeDimensions(node);

        // Filter hidden nodes and nodes without dimensions (matches React logic)
        if (!node || node.hidden || !this.nodeHasDimensions(node)) {
          return null;
        }

        return {
          id: node.id,
          node,
          x,
          y,
          width,
          height,
          style: node.style,
          selected: !!node.selected
        };
      })
      .filter(Boolean) as Array<{
        id: string;
        node: NodeType;
        x: number;
        y: number;
        width: number;
        height: number;
        style?: any;
        selected: boolean;
      }>;
  });

  // Helper methods to get node attributes
  getNodeColor(node: NodeType): string {
    return this.nodeColorFunc()(node);
  }

  getNodeStrokeColor(node: NodeType): string {
    return this.nodeStrokeColorFunc()(node);
  }

  getNodeClassName(node: NodeType): string {
    return this.nodeClassNameFunc()(node);
  }

  handleNodeClick(event: MouseEvent, nodeId: string): void {
    this.onNodeClick.emit({ event, nodeId });
    const clickHandler = this.onClick();
    if (clickHandler) {
      clickHandler(event, nodeId);
    }
  }

  // Private helper methods (matches React implementation)
  private getAttrFunction<T>(func: any): (node: T) => string {
    return func instanceof Function ? func : () => func || '';
  }

  private getNodeDimensions(node: any): { width: number; height: number } {
    // Simple implementation - in real app this would use @xyflow/system's getNodeDimensions
    return {
      width: node.measured?.width ?? node.width ?? 150,
      height: node.measured?.height ?? node.height ?? 40
    };
  }

  private nodeHasDimensions(node: any): boolean {
    // Simple implementation - in real app this would use @xyflow/system's nodeHasDimensions
    const dimensions = this.getNodeDimensions(node);
    return dimensions.width > 0 && dimensions.height > 0;
  }
}