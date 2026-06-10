import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeusChamados } from './meus-chamados';

describe('MeusChamados', () => {
  let component: MeusChamados;
  let fixture: ComponentFixture<MeusChamados>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeusChamados],
    }).compileComponents();

    fixture = TestBed.createComponent(MeusChamados);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
