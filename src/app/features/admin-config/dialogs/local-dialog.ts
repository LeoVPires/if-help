import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select'; // 👈 Adicionado para o seletor de ícones
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-local-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule, // 👈 Importado aqui
  ],
  templateUrl: './local-dialog.html',
  styleUrl: './dialogs-style.scss',
})
export class LocalDialog {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<LocalDialog>);

  // Lista de ícones focada em grandes estruturas/locais do Campus
  listaIcones = [
    { classe: 'domain', label: 'Bloco Principal / Administração' },
    { classe: 'school', label: 'Bloco de Aulas / Pedagógico' },
    { classe: 'biotech', label: 'Bloco de Laboratórios' },
    { classe: 'sports_basketball', label: 'Complexo Esportivo / Ginásio' },
    { classe: 'local_library', label: 'Biblioteca Central' },
    { classe: 'restaurant', label: 'Vivência / Refeitório' },
    { classe: 'account_tree', label: 'Setor de TI / CPD' },
    { classe: 'commute', label: 'Estacionamento / Garagem' },
  ];

  form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    icone: ['domain', Validators.required], // 'domain' já inicia como padrão funcional
  });

  salvar() {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
