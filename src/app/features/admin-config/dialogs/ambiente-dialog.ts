import { Component, inject } from '@angular/core';

import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-ambiente-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatInputModule],
  templateUrl: './ambiente-dialog.html',
  styleUrl: './dialogs-style.scss',
})
export class AmbienteDialog {
  private fb = inject(FormBuilder);

  dialogRef = inject(MatDialogRef<AmbienteDialog>);

  form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
  });

  salvar() {
    if (this.form.invalid) return;

    this.dialogRef.close(this.form.getRawValue());
  }
}
