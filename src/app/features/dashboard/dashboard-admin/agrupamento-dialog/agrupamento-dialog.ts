import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Adicionado para gerenciar o ngModel das checkboxes

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

import { Chamado } from '../../../../core/modals/chamado';
import { AgrupamentosService } from '../../../../core/services/agrupamento';

export interface AgrupamentoDialogData {
  chamadoBase: Chamado;
  chamadosParaAgrupar: Chamado[];
}

@Component({
  selector: 'app-agrupamento-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './agrupamento-dialog.html',
  styleUrl: './agrupamento-dialog.scss',
})
export class AgrupamentoDialogComponent {
  private agrupamentosService = inject(AgrupamentosService);

  // Mapeia o ID do chamado para um booleano indicando se está selecionado
  selecionados: { [key: string]: boolean } = {};
  carregando = false;

  constructor(
    public dialogRef: MatDialogRef<AgrupamentoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AgrupamentoDialogData,
  ) {
    // Por padrão, inicializa todos os candidatos marcados como true
    this.data.chamadosParaAgrupar.forEach((c) => {
      if (c.id) this.selecionados[c.id] = true;
    });
  }

  async confirmarAgrupamento() {
    const filhosSelecionados = this.data.chamadosParaAgrupar.filter(
      (c) => c.id && this.selecionados[c.id],
    );

    // O grupo será composto pelo chamadoBase + os filhos selecionados
    const todosOsChamadosDoGrupo = [this.data.chamadoBase, ...filhosSelecionados];

    this.carregando = true;
    try {
      await this.agrupamentosService.criarAgrupamento(todosOsChamadosDoGrupo);
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Erro ao agrupar chamados:', error);
    } finally {
      this.carregando = false;
    }
  }
}
