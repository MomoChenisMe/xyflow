import { 
  Component, 
  ViewContainerRef, 
  ComponentRef, 
  TemplateRef, 
  input, 
  OnInit, 
  OnDestroy,
  ChangeDetectionStrategy,
  inject,
  AfterViewInit,
  viewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

/**
 * NodeToolbarPortal component - renders content in the React Flow renderer
 * Uses Angular CDK Overlay to create a portal similar to React's createPortal
 */
@Component({
  selector: 'xy-node-toolbar-portal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #portalTemplate>
      <ng-content></ng-content>
    </ng-template>
  `,
  styles: [`
    :host {
      display: none;
    }
  `]
})
export class NodeToolbarPortal implements OnInit, OnDestroy, AfterViewInit {
  portalTemplate = viewChild.required<TemplateRef<any>>('portalTemplate');
  
  // Inputs for renderer element selection
  rendererSelector = input<string>('.react-flow__renderer');
  rendererElement = input<HTMLElement>();

  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);
  private overlayRef?: OverlayRef;
  private portal?: TemplatePortal;

  ngOnInit() {
    // Create overlay configuration
    const positionStrategy = this.overlay.position()
      .global()
      .top('0')
      .left('0');

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: false,
      panelClass: 'node-toolbar-overlay'
    });
  }

  ngAfterViewInit() {
    this.createPortal();
  }

  ngOnDestroy() {
    this.destroyPortal();
  }

  private createPortal() {
    const portalTemplate = this.portalTemplate();
    if (!portalTemplate || !this.overlayRef) {
      return;
    }

    // Find the target renderer element
    const rendererElement = this.getRendererElement();
    if (!rendererElement) {
      console.warn('NodeToolbarPortal: Could not find renderer element');
      return;
    }

    // Create and attach the portal
    this.portal = new TemplatePortal(portalTemplate, this.viewContainerRef);
    this.overlayRef.attach(this.portal);

    // Move the overlay to the renderer element
    this.moveOverlayToRenderer(rendererElement);
  }

  private destroyPortal() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private getRendererElement(): HTMLElement | null {
    const rendererElement = this.rendererElement();
    if (rendererElement) {
      return rendererElement;
    }

    // Try to find the renderer element in the DOM
    const element = document.querySelector(this.rendererSelector());
    return element as HTMLElement;
  }

  private moveOverlayToRenderer(rendererElement: HTMLElement) {
    if (!this.overlayRef?.overlayElement) {
      return;
    }

    // Move the overlay content to the renderer element
    const overlayElement = this.overlayRef.overlayElement;
    const content = overlayElement.firstElementChild;
    
    if (content) {
      // Remove from overlay
      overlayElement.removeChild(content);
      // Append to renderer
      rendererElement.appendChild(content);
    }
  }
}

/**
 * Simple portal implementation using direct DOM manipulation
 * Alternative to CDK Overlay for simpler use cases
 */
@Component({
  selector: 'xy-simple-portal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #content style="display: none;">
      <ng-content></ng-content>
    </div>
  `
})
export class SimplePortal implements AfterViewInit, OnDestroy {
  contentElement = viewChild.required<ElementRef<HTMLDivElement>>('content');
  
  targetSelector = input<string>('.react-flow__renderer');
  targetElement = input<HTMLElement>();

  private portalElement?: HTMLElement;

  ngAfterViewInit() {
    this.createPortal();
  }

  ngOnDestroy() {
    this.destroyPortal();
  }

  private createPortal() {
    const target = this.getTargetElement();
    const contentElement = this.contentElement();
    if (!target || !contentElement) {
      return;
    }

    // Clone the content and append to target
    const content = contentElement.nativeElement;
    this.portalElement = content.cloneNode(true) as HTMLElement;
    this.portalElement.style.display = 'block';
    
    target.appendChild(this.portalElement);
  }

  private destroyPortal() {
    if (this.portalElement && this.portalElement.parentNode) {
      this.portalElement.parentNode.removeChild(this.portalElement);
    }
  }

  private getTargetElement(): HTMLElement | null {
    const targetElement = this.targetElement();
    if (targetElement) {
      return targetElement;
    }

    return document.querySelector(this.targetSelector()) as HTMLElement;
  }
}