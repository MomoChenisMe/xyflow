import { Directive, TemplateRef, inject } from '@angular/core';
import { ConnectionLineTemplateContext } from './types';

@Directive({
  selector: '[angularXyFlowConnectionLine]',
  standalone: true,
})
export class ConnectionLineTemplateDirective {
  public templateRef = inject(TemplateRef<ConnectionLineTemplateContext>);
}