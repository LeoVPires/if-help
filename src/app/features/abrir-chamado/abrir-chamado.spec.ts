import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbrirChamado } from './abrir-chamado';

describe('AbrirChamado', () => {
  let component: AbrirChamado;
  let fixture: ComponentFixture<AbrirChamado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AbrirChamado],
    }).compileComponents();

    fixture = TestBed.createComponent(AbrirChamado);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
