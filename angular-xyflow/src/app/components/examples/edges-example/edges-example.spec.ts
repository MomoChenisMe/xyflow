import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EdgesExample } from './edges-example';

describe('EdgesExample', () => {
  let component: EdgesExample;
  let fixture: ComponentFixture<EdgesExample>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EdgesExample]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EdgesExample);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
