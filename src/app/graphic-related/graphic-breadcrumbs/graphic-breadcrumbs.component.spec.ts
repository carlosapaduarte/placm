import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphicBreadcrumbsComponent } from './graphic-breadcrumbs.component';

describe('GraphicBreadcrumbsComponent', () => {
  let component: GraphicBreadcrumbsComponent;
  let fixture: ComponentFixture<GraphicBreadcrumbsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GraphicBreadcrumbsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GraphicBreadcrumbsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
