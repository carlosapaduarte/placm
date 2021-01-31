import { TestBed } from '@angular/core/testing';

import { StatementService } from './statement.service';

describe('StatementService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: StatementService = TestBed.get(StatementService);
    expect(service).toBeTruthy();
  });
});
