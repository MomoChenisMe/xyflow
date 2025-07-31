import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="timer"
      [class.show]="show()"
    >
      <div 
        class="progress" 
        [style.width.%]="percentage()"
      ></div>
      Connection will be canceled in {{ remaining() }} seconds
    </div>
  `,
  styles: [`
    .timer {
      position: absolute;
      bottom: 0;
      transition-duration: 0.3s;
      left: 50%;
      transform: translate(-50%, 100%);
      font-size: 1.5rem;
      z-index: 999;
      background: linear-gradient(#fff, #fff, #f5f5f5);
      padding: 0.8rem 1.5rem;
      border-radius: 5px;
      border: 1px solid #ccc;
      box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.2);
    }

    .timer.show {
      transform: translate(-50%, 0%) translateY(-15px);
    }

    .progress {
      display: none;
      position: absolute;
      bottom: 0;
      left: 0;
      height: 5px;
      background: linear-gradient(to right, #42df96, #16dfed);
    }

    .timer.show .progress {
      display: block;
    }
  `]
})
export class TimerComponent {
  // 輸入信號
  duration = input.required<number>();
  remaining = input.required<number>();
  show = input.required<boolean>();

  // 計算進度百分比
  percentage = computed(() => {
    const dur = this.duration();
    const rem = this.remaining();
    return dur > 0 ? 100 - (rem / dur) * 100 : 0;
  });
}