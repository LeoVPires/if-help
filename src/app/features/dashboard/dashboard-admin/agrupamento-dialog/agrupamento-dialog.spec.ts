import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgrupamentoDialog } from './agrupamento-dialog';

describe('AgrupamentoDialog', () => {
  let component: AgrupamentoDialog;
  let fixture: ComponentFixture<AgrupamentoDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgrupamentoDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(AgrupamentoDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
