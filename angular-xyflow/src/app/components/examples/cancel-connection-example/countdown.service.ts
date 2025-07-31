import { Injectable, signal } from '@angular/core';

@Injectable()
export class CountdownService {
  private interval: ReturnType<typeof setInterval> | null = null;
  
  // 信號狀態
  private _remaining = signal(0);
  private _counting = signal(false);
  
  // 公開只讀信號
  readonly remaining = this._remaining.asReadonly();
  readonly counting = this._counting.asReadonly();

  start(duration: number, callback: () => void): void {
    this.stop(); // 清除之前的計時器
    this._remaining.set(duration);
    this._counting.set(true);

    this.interval = setInterval(() => {
      this._remaining.update((prev) => {
        if (prev === 1) {
          this.stop();
          callback();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this._remaining.set(0);
    this._counting.set(false);
  }

  ngOnDestroy(): void {
    this.stop();
  }
}