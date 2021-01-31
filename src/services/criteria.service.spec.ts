import { TestBed } from '@angular/core/testing';

import { CriteriaService } from './criteria.service';

describe('CriteriaService', () => {
  let service: CriteriaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CriteriaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
