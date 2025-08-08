import { Injectable } from '@angular/core';
import { MarkerType } from '../types';

// Marker Symbol 的屬性類型
export interface MarkerSymbolProps {
  color?: string;
  strokeWidth?: number;
}

// Marker Symbol 定義
export interface MarkerSymbolDefinition {
  type: 'polyline' | 'polygon' | 'path';
  points?: string;
  d?: string;
  style: {
    stroke?: string;
    fill?: string;
    strokeWidth?: number;
  };
  strokeLinecap?: string;
  strokeLinejoin?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MarkerSymbolsService {
  // 定義所有支援的 marker 符號
  private symbols: Record<MarkerType, (props: MarkerSymbolProps) => MarkerSymbolDefinition> = {
    [MarkerType.Arrow]: this.createArrowSymbol.bind(this),
    [MarkerType.ArrowClosed]: this.createArrowClosedSymbol.bind(this)
  };

  // 開放的箭頭符號
  private createArrowSymbol(props: MarkerSymbolProps): MarkerSymbolDefinition {
    const { color = 'none', strokeWidth = 1 } = props;
    return {
      type: 'polyline',
      points: '-5,-4 0,0 -5,4',
      style: {
        stroke: color,
        strokeWidth
      },
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    };
  }

  // 封閉的箭頭符號
  private createArrowClosedSymbol(props: MarkerSymbolProps): MarkerSymbolDefinition {
    const { color = 'none', strokeWidth = 1 } = props;
    return {
      type: 'polyline',
      points: '-5,-4 0,0 -5,4 -5,-4',
      style: {
        stroke: color,
        fill: color,
        strokeWidth
      },
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    };
  }

  // 獲取指定類型的符號定義
  getSymbol(type: MarkerType, props: MarkerSymbolProps): MarkerSymbolDefinition | null {
    const symbolCreator = this.symbols[type];
    
    if (!symbolCreator) {
      console.error(`[Angular XYFlow]: Unknown marker type "${type}"`);
      return null;
    }
    
    return symbolCreator(props);
  }

  // 檢查符號類型是否存在
  hasSymbol(type: MarkerType): boolean {
    return Object.prototype.hasOwnProperty.call(this.symbols, type);
  }

  // 註冊自定義符號（用於擴展）
  registerSymbol(type: MarkerType, creator: (props: MarkerSymbolProps) => MarkerSymbolDefinition): void {
    this.symbols[type] = creator;
  }
}