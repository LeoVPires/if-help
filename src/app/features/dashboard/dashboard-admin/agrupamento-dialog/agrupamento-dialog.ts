import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

import { Chamado } from '../../../../core/modals/chamado';

export interface AgrupamentoDialogData {
  chamadoBase: Chamado;
  chamadosParaAgrupar: Chamado[];
}

@Component({
  selector: 'app-agrupamento-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatCheckboxModule, MatIconModule],
  templateUrl: './agrupamento-dialog.html',
  styleUrl: './agrupamento-dialog.scss',
})
export class AgrupamentoDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AgrupamentoDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: AgrupamentoDialogData,
  ) {}
}
