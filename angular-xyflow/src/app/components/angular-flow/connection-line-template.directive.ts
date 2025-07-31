import { Directive, TemplateRef } from '@angular/core';
import { ConnectionLineTemplateContext } from './types';

@Directive({
  selector: '[angularFlowConnectionLine]',
  standalone: true,
})
export class ConnectionLineTemplateDirective {
  constructor(public templateRef: TemplateRef<ConnectionLineTemplateContext>) {}
}