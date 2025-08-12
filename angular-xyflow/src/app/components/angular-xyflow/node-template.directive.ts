import { Directive, TemplateRef, inject } from '@angular/core';
import { NodeTemplateContext } from './types';

@Directive({
  selector: '[angularXyFlowNodeTemplate]',
  standalone: true,
})
export class NodeTemplateDirective {
  public templateRef = inject(TemplateRef<NodeTemplateContext>);
}