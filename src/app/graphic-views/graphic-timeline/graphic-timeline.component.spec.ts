import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphicTimelineComponent } from './graphic-timeline.component';

describe('GraphicTimelineComponent', () => {
  let component: GraphicTimelineComponent;
  let fixture: ComponentFixture<GraphicTimelineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GraphicTimelineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GraphicTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
