import { TestBed } from '@angular/core/testing';

import { Chamados } from './chamados';

describe('Chamados', () => {
  let service: Chamados;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Chamados);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
