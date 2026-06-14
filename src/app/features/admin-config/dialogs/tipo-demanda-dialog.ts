import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select'; // IMPORTANTE
import { MatIconModule } from '@angular/material/icon'; // IMPORTANTE para ver os ícones na lista

@Component({
  selector: 'app-tipo-demanda-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './tipo-demanda-dialog.html',
  styleUrl: './dialogs-style.scss',
})
export class TipoDemandaDialog {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<TipoDemandaDialog>);

  // Lista de ícones temáticos para o admin escolher sem precisar adivinhar nomes
  listaIcones = [
    { classe: 'computer', label: 'Tecnologia da Informação / TI' },
    { classe: 'build', label: 'Infraestrutura / Oficina' },
    { classe: 'cleaning_services', label: 'Limpeza e Higiene' },
    { classe: 'menu_book', label: 'Biblioteca / Didático' },
    { classe: 'restaurant', label: 'Refeitório / Cantina' },
    { classe: 'chair', label: 'Mobiliário (Cadeiras, Mesas)' },
    { classe: 'ac_unit', label: 'Climatização / Ar-condicionado' },
    { classe: 'electric_bolt', label: 'Elétrica / Iluminação' },
  ];

  form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    descricao: ['', Validators.required],
    icone: ['computer', Validators.required], // Valor padrão inicial condizente com a lista
  });

  salvar() {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
