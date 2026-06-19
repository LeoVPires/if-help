import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarAgrupamento } from './editar-agrupamento';

describe('EditarAgrupamento', () => {
  let component: EditarAgrupamento;
  let fixture: ComponentFixture<EditarAgrupamento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarAgrupamento],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarAgrupamento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
