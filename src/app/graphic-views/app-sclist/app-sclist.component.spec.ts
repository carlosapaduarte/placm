import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppSCListComponent } from './app-sclist.component';

describe('AppSCListComponent', () => {
  let component: AppSCListComponent;
  let fixture: ComponentFixture<AppSCListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppSCListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppSCListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
