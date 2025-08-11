import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EdgeTypes } from './edge-types';

describe('EdgeTypes', () => {
  let component: EdgeTypes;
  let fixture: ComponentFixture<EdgeTypes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EdgeTypes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EdgeTypes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
