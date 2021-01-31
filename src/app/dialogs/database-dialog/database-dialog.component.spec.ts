import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatabaseDialogComponent } from './database-dialog.component';

describe('DatabaseDialogComponent', () => {
  let component: DatabaseDialogComponent;
  let fixture: ComponentFixture<DatabaseDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatabaseDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatabaseDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
