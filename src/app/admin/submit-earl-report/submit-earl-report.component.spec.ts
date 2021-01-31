import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmitEarlReportComponent } from './submit-earl-report.component';

describe('SubmitEarlReportComponent', () => {
  let component: SubmitEarlReportComponent;
  let fixture: ComponentFixture<SubmitEarlReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SubmitEarlReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmitEarlReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
