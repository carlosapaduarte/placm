import { TestBed } from '@angular/core/testing';

import { CombinedService } from './combined.service';

describe('CombinedService', () => {
  let service: CombinedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CombinedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
