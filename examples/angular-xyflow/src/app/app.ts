import { Component } from '@angular/core';
import { AppBasic } from './app-basic';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppBasic],
  template: `
    <app-basic />
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class App {}