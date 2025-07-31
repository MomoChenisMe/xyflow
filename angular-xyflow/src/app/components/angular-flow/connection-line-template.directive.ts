import { Directive, TemplateRef } from '@angular/core';
import { ConnectionLineTemplateContext } from './types';

@Directive({
  selector: '[angularXyFlowConnectionLine]',
  standalone: true,
})
export class ConnectionLineTemplateDirective {
  constructor(public templateRef: TemplateRef<ConnectionLineTemplateContext>) {}
}