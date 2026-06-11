import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarChamado } from './editar-chamado';

describe('EditarChamado', () => {
  let component: EditarChamado;
  let fixture: ComponentFixture<EditarChamado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarChamado],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarChamado);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
