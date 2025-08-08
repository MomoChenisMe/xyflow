import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkerType, EdgeMarker } from '../types';

// Marker 屬性介面
export interface MarkerProps extends EdgeMarker {
  id: string;
}

@Component({
  selector: 'angular-xyflow-marker-definitions',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (markers().length > 0) {
      <svg:svg
        class="react-flow__marker"
        aria-hidden="true"
        [style.position]="'absolute'"
        [style.width]="'0'"
        [style.height]="'0'"
        [style.overflow]="'visible'"
      >
        <svg:defs>
          @for (marker of markers(); track marker.id) {
            <svg:marker
              class="react-flow__arrowhead"
              [id]="marker.id"
              [attr.markerWidth]="marker.width || 12.5"
              [attr.markerHeight]="marker.height || 12.5"
              [attr.viewBox]="'-10 -10 20 20'"
              [attr.refX]="0"
              [attr.refY]="0"
              [attr.orient]="marker.orient || 'auto-start-reverse'"
              [attr.markerUnits]="marker.markerUnits || 'strokeWidth'"
            >
              @if (marker.type === markerType.ArrowClosed) {
                <!-- 填充的箭頭 (ArrowClosed) -->
                <svg:polyline
                  [attr.stroke]="marker.color || '#b1b1b7'"
                  [attr.fill]="marker.color || '#b1b1b7'"
                  [attr.stroke-width]="marker.strokeWidth || 1"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  points="-5,-4 0,0 -5,4 -5,-4"
                />
              } @else {
                <!-- 開放的箭頭 (Arrow) -->
                <svg:polyline
                  [attr.stroke]="marker.color || '#b1b1b7'"
                  [attr.stroke-width]="marker.strokeWidth || 1"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  fill="none"
                  points="-5,-4 0,0 -5,4"
                />
              }
            </svg:marker>
          }
        </svg:defs>
      </svg:svg>
    }
  `
})
export class MarkerDefinitionsComponent {
  // 常數
  markerType = MarkerType;
  
  // 輸入屬性
  edges = input.required<any[]>();
  defaultColor = input<string>('#b1b1b7');
  rfId = input<string>();
  defaultMarkerStart = input<EdgeMarker | string>();
  defaultMarkerEnd = input<EdgeMarker | string>();

  // 計算所有需要的 markers
  markers = computed(() => {
    const edgeList = this.edges();
    const defaultColorValue = this.defaultColor();
    const rfIdValue = this.rfId();
    const defaultStart = this.defaultMarkerStart();
    const defaultEnd = this.defaultMarkerEnd();
    
    const result = this.createMarkerIds(edgeList, {
      id: rfIdValue,
      defaultColor: defaultColorValue,
      defaultMarkerStart: defaultStart,
      defaultMarkerEnd: defaultEnd
    });
    
    return result;
  });

  // 從 edges 創建唯一的 marker IDs（基於 @xyflow/system 的邏輯）
  private createMarkerIds(
    edges: any[],
    options: {
      id?: string;
      defaultColor?: string;
      defaultMarkerStart?: EdgeMarker | string;
      defaultMarkerEnd?: EdgeMarker | string;
    }
  ): MarkerProps[] {
    const ids = new Set<string>();
    const markers: MarkerProps[] = [];

    edges.forEach(edge => {
      // 處理 markerStart 和 markerEnd
      [edge.markerStart || options.defaultMarkerStart, edge.markerEnd || options.defaultMarkerEnd].forEach(marker => {
        if (marker && typeof marker === 'object') {
          const markerId = this.getMarkerId(marker, options.id);
          if (!ids.has(markerId)) {
            const markerProps: MarkerProps = {
              id: markerId,
              type: marker.type || MarkerType.ArrowClosed,
              color: marker.color || options.defaultColor,
              ...marker
            };
            markers.push(markerProps);
            ids.add(markerId);
          }
        }
      });
    });

    // 排序以確保穩定的渲染順序
    return markers.sort((a, b) => a.id.localeCompare(b.id));
  }

  // 生成 marker ID（基於 @xyflow/system 的邏輯）
  private getMarkerId(marker: EdgeMarker | string, id?: string): string {
    if (!marker) {
      return '';
    }

    if (typeof marker === 'string') {
      return marker;
    }

    const idPrefix = id ? `${id}__` : '';

    return `${idPrefix}${Object.keys(marker)
      .sort()
      .map(key => `${key}=${marker[key as keyof EdgeMarker]}`)
      .join('&')}`;
  }
}