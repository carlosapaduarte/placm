import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmitAccessibilityStatementComponent } from './submit-accessibility-statement.component';

describe('SubmitAccessibilityStatementComponent', () => {
  let component: SubmitAccessibilityStatementComponent;
  let fixture: ComponentFixture<SubmitAccessibilityStatementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SubmitAccessibilityStatementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmitAccessibilityStatementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
