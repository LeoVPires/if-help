import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

import { Chamado, AgrupamentoDialogData } from '../../../../core/modals/chamado';

@Component({
  selector: 'app-agrupamento-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatCheckboxModule, MatIconModule],
  templateUrl: './agrupamento-dialog.html',
  styleUrl: './agrupamento-dialog.scss',
})
export class AgrupamentoDialogComponent {
  selecionados = new Set<string>();

  constructor(
    public dialogRef: MatDialogRef<AgrupamentoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AgrupamentoDialogData,
  ) {
    for (const chamado of this.data.chamadosParaAgrupar) {
      if (chamado.id) {
        this.selecionados.add(chamado.id);
      }
    }
  }

  alternarSelecao(chamadoId: string, selecionado: boolean) {
    if (selecionado) {
      this.selecionados.add(chamadoId);
      return;
    }

    this.selecionados.delete(chamadoId);
  }

  estaSelecionado(chamadoId: string): boolean {
    return this.selecionados.has(chamadoId);
  }

  confirmar() {
    this.dialogRef.close([...this.selecionados]);
  }
}
