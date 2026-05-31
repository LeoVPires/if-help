import { Component, Input, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-abrir-chamado',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './abrir-chamado.html',
  styleUrl: './abrir-chamado.scss',
})
export class AbrirChamado {
  @Input() role: 'admin' | 'aluno' = 'aluno';

  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    lugar: ['', Validators.required],
    ambiente: ['', Validators.required],
    tipoProblema: ['', Validators.required],
    descricao: ['', [Validators.required, Validators.minLength(10)]],

    prioridade: ['media'],
    responsavelId: [''],
  });

  lugar = [
    null,
    'Bloco Adm',
    'Bloco 1',
    'Bloco 2',
    'Bloco 3',
    'Quadra',
    'Refeitório',
    'Cantina',
    'Estacionameto',
  ];

  problemas = [
    null,
    'Elétrica',
    'Hidráulica',
    'Limpeza',
    'TI',
    'Internet',
    'Ar Condicionado',
    'Estrutural',
    'Outros',
  ];

  servidores = [null, 'João Silva', 'Maria Santos', 'Pedro Oliveira'];

  salvar() {
    console.log(this.form.getRawValue());
  }
}
