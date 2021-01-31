import { TestBed } from '@angular/core/testing';

import { QueryParametersService } from './query-parameters.service';

describe('QueryParametersService', () => {
  let service: QueryParametersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QueryParametersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
