import { TestBed } from '@angular/core/testing';

import { Agrupamento } from './agrupamento';

describe('Agrupamento', () => {
  let service: Agrupamento;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Agrupamento);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
