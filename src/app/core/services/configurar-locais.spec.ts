import { TestBed } from '@angular/core/testing';

import { ConfigurarLocais } from './configurar-locais';

describe('ConfigurarLocais', () => {
  let service: ConfigurarLocais;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigurarLocais);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
