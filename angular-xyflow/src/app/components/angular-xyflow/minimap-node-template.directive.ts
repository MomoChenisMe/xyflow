import { Directive, TemplateRef, inject } from '@angular/core';
import { MinimapNodeTemplateContext } from './types';

@Directive({
  selector: '[angularXyFlowMinimapNode]',
  standalone: true,
})
export class MinimapNodeTemplateDirective {
  public templateRef = inject(TemplateRef<MinimapNodeTemplateContext>);
}