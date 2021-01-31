import { TestBed } from '@angular/core/testing';

import { EarlService } from './earl.service';

describe('EarlService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: EarlService = TestBed.get(EarlService);
    expect(service).toBeTruthy();
  });
});
