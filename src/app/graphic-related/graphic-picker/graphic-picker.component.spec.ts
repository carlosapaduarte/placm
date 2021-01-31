import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphicPickerComponent } from './graphic-picker.component';

describe('GraphicPickerComponent', () => {
  let component: GraphicPickerComponent;
  let fixture: ComponentFixture<GraphicPickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GraphicPickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GraphicPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
