import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DrilldownDialogComponent } from './drilldown-dialog.component';

describe('DrilldownDialogComponent', () => {
  let component: DrilldownDialogComponent;
  let fixture: ComponentFixture<DrilldownDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DrilldownDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DrilldownDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
