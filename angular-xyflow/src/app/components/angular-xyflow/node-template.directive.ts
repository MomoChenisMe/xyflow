import { Directive, TemplateRef } from '@angular/core';
import { NodeTemplateContext } from './types';

@Directive({
  selector: '[angularXyFlowNodeTemplate]',
  standalone: true,
})
export class NodeTemplateDirective {
  constructor(public templateRef: TemplateRef<NodeTemplateContext>) {}
}