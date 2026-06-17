import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select'; // 👈 Adicionado para o seletor de ícones
import { MatIconModule } from '@angular/material/icon'; // 👈 Adicionado para a prévia dos ícones
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ambiente-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatSelectModule, // 👈 Importado aqui
    MatIconModule, // 👈 Importado aqui
  ],
  templateUrl: './ambiente-dialog.html',
  styleUrl: './dialogs-style.scss',
})
export class AmbienteDialog {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<AmbienteDialog>);

  // Lista idêntica à que você já usa e aprovou
  listaIcones = [
    { classe: 'school', label: 'Sala de Aula' },
    { classe: 'computer', label: 'Laboratório de Informática' },
    { classe: 'menu_book', label: 'Biblioteca' },
    { classe: 'restaurant', label: 'Refeitório' },
    { classe: 'sports_soccer', label: 'Quadra Esportiva' },
    { classe: 'meeting_room', label: 'Sala Administrativa' },
    { classe: 'science', label: 'Laboratório' },
    { classe: 'local_hospital', label: 'Enfermaria' },
    { classe: 'account_balance', label: 'Auditório' },
    { classe: 'park', label: 'Área Externa' },
    { classe: 'wc', label: 'Banheiro' },
    { classe: 'man', label: 'Banheiro Masculino' },
    { classe: 'woman', label: 'Banheiro Feminino' },
    { classe: 'transfer_within_a_station', label: 'Corredor' },
    { classe: 'stairs_2', label: 'Escada' },
  ];

  // Adicionado o campo 'icone' para sumir com o erro NG01050
  form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    icone: ['meeting_room', Validators.required],
  });

  salvar() {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
