import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphicSingleComponent } from './graphic-single.component';

describe('GraphicSingleComponent', () => {
  let component: GraphicSingleComponent;
  let fixture: ComponentFixture<GraphicSingleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GraphicSingleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GraphicSingleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
