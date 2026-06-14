import { Component, inject } from '@angular/core';

import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-local-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatInputModule],
  templateUrl: './local-dialog.html',
  styleUrl: './dialogs-style.scss',
})
export class LocalDialog {
  private fb = inject(FormBuilder);

  dialogRef = inject(MatDialogRef<LocalDialog>);

  form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    icone: ['domain', Validators.required],
  });

  salvar() {
    if (this.form.invalid) return;

    this.dialogRef.close(this.form.getRawValue());
  }
}
