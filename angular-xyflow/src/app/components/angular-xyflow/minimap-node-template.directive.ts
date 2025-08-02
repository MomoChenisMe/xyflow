import { Directive, TemplateRef } from '@angular/core';
import { MinimapNodeTemplateContext } from './types';

@Directive({
  selector: '[angularXyFlowMinimapNode]',
  standalone: true,
})
export class MinimapNodeTemplateDirective {
  constructor(public templateRef: TemplateRef<MinimapNodeTemplateContext>) {}
}