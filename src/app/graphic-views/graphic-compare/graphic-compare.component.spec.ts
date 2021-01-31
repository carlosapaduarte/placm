import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphicCompareComponent } from './graphic-compare.component';

describe('GraphicCompareComponent', () => {
  let component: GraphicCompareComponent;
  let fixture: ComponentFixture<GraphicCompareComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GraphicCompareComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GraphicCompareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
