// Angular 核心模組
import { Injectable, inject } from '@angular/core';

// XyFlow 系統模組
import { XYResizer } from '@xyflow/system';
import type { 
  XYResizerInstance,
  XYResizerChange, 
  XYResizerChildChange,
  CoordinateExtent,
  Transform,
  NodeOrigin,
  ControlPosition
} from '@xyflow/system';

// 專案內部模組
import { AngularXYFlowService } from './angular-xyflow.service';
import type { AngularNode, AngularEdge } from '../types';

/**
 * XYResizer 包裝服務
 * 封裝 @xyflow/system 的 XYResizer 功能，提供 Angular 友善的 API
 */
@Injectable({
  providedIn: 'root'
})
export class AngularXYResizerService {
  private resizerInstances = new Map<string, XYResizerInstance>();

  /**
   * 創建 XYResizer 實例
   */
  createResizer<NodeType extends AngularNode = AngularNode, EdgeType extends AngularEdge = AngularEdge>(
    params: {
      domNode: HTMLDivElement;
      nodeId: string;
      flowService: AngularXYFlowService<NodeType, EdgeType>;
      onChange: (change: XYResizerChange, childChanges: XYResizerChildChange[]) => void;
      onEnd?: (change: Required<XYResizerChange>) => void;
    }
  ): XYResizerInstance {
    
    const { domNode, nodeId, flowService, onChange, onEnd } = params;
    
    // XYResizer 參數配置
    const resizerParams = {
      domNode,
      nodeId,
      getStoreItems: () => {
        // 獲取當前流程狀態 - 模擬 React Flow 的 store.getState()
        const viewport = flowService.viewport();
        const nodeLookup = flowService.nodeLookup();
        const snapGrid = flowService.snapGrid();
        const snapToGrid = flowService.snapToGrid();
        
        return {
          nodeLookup: flowService.internalNodeLookup(), // 使用內部節點 Lookup
          transform: [viewport.x, viewport.y, viewport.zoom] as Transform,
          snapGrid: snapGrid || [15, 15],
          snapToGrid: snapToGrid || false,
          nodeOrigin: [0, 0] as NodeOrigin,
          paneDomNode: flowService.getPaneDomNode() as HTMLDivElement | null,
        };
      },
      onChange,
      onEnd,
    };
    
    // 創建 XYResizer 實例
    const resizer = XYResizer(resizerParams as any);
    
    // 存儲實例以便後續更新或清理
    this.resizerInstances.set(nodeId, resizer);
    
    return resizer;
  }
  
  /**
   * 更新 XYResizer 實例配置
   */
  updateResizer(nodeId: string, updateParams: {
    controlPosition: ControlPosition;
    boundaries: {
      minWidth: number;
      maxWidth: number;
      minHeight: number;
      maxHeight: number;
    };
    keepAspectRatio: boolean;
    resizeDirection?: 'horizontal' | 'vertical';
    onResizeStart?: (event: any, params: any) => void;
    onResize?: (event: any, params: any) => void;
    onResizeEnd?: (event: any, params: any) => void;
    shouldResize?: (event: any, params: any) => boolean;
  }): void {
    const resizer = this.resizerInstances.get(nodeId);
    if (resizer && resizer.update) {
      resizer.update({
        controlPosition: updateParams.controlPosition,
        boundaries: updateParams.boundaries,
        keepAspectRatio: updateParams.keepAspectRatio,
        resizeDirection: updateParams.resizeDirection,
        onResizeStart: updateParams.onResizeStart,
        onResize: updateParams.onResize,
        onResizeEnd: updateParams.onResizeEnd,
        shouldResize: updateParams.shouldResize,
      });
    }
  }
  
  /**
   * 銷毀 XYResizer 實例
   */
  destroyResizer(nodeId: string): void {
    const resizer = this.resizerInstances.get(nodeId);
    if (resizer) {
      // 如果 XYResizer 提供銷毀方法，調用它
      if (typeof resizer.destroy === 'function') {
        resizer.destroy();
      }
      this.resizerInstances.delete(nodeId);
    }
  }
  
  /**
   * 銷毀所有 XYResizer 實例
   */
  destroyAllResizers(): void {
    this.resizerInstances.forEach((resizer, nodeId) => {
      this.destroyResizer(nodeId);
    });
    this.resizerInstances.clear();
  }
  
  /**
   * 獲取特定節點的 resizer 實例
   */
  getResizerInstance(nodeId: string): XYResizerInstance | undefined {
    return this.resizerInstances.get(nodeId);
  }
  
  /**
   * 檢查節點是否有 resizer 實例
   */
  hasResizer(nodeId: string): boolean {
    return this.resizerInstances.has(nodeId);
  }
}