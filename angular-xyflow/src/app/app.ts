import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasicExampleComponent } from './components/basic-example/basic-example.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BasicExampleComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
