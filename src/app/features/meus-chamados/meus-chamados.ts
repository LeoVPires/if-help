import {
  Component,
  Input,
  ViewChild,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  inject,
  Inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Material Imports
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MatDialogModule,
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';

import { Chamado } from '../../core/modals/chamado';

interface FilterState {
  search: string;
  cardFiltro: 'abertos' | 'andamento' | 'historico' | null;
}

@Component({
  selector: 'app-meus-chamados',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './meus-chamados.html',
  styleUrl: './meus-chamados.scss',
})
export class MeusChamados implements OnChanges, AfterViewInit {
  // Idealmente, a rota pai já deve enviar apenas os chamados filtrados do aluno logado
  @Input() chamados: Chamado[] = [];

  dataSource = new MatTableDataSource<Chamado>();
  displayedColumns: string[] = ['id', 'localizacao', 'demanda', 'status', 'acoes'];

  dialog = inject(MatDialog);

  // Contadores específicos do Aluno
  countAbertos = 0;
  countAndamento = 0;
  countHistorico = 0;

  filtros: FilterState = { search: '', cardFiltro: null };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['chamados'] && this.chamados) {
      this.dataSource.data = this.chamados;
      this.calcularContadores();
      this.configurarFiltroPersonalizado();
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  atualizarDados() {
    // Método para disparar evento ou recarregar os chamados da API se necessário
  }

  // --- FILTRAGEM ---
  aplicarFiltroTexto(event: Event) {
    this.filtros.search = (event.target as HTMLInputElement).value;
    this.atualizarFiltroDataSource();
  }

  toggleCardFilter(filtroCard: 'abertos' | 'andamento' | 'historico') {
    this.filtros.cardFiltro = this.filtros.cardFiltro === filtroCard ? null : filtroCard;
    this.atualizarFiltroDataSource();
  }

  private atualizarFiltroDataSource() {
    this.dataSource.filter = JSON.stringify(this.filtros);
  }

  private configurarFiltroPersonalizado() {
    this.dataSource.filterPredicate = (data: Chamado, filterStr: string) => {
      const f: FilterState = JSON.parse(filterStr);
      let match = true;

      if (f.search) {
        const textToSearch =
          `${data.id} ${data.bloco} ${data.sala} ${data.descricao}`.toLowerCase();
        if (!textToSearch.includes(f.search.toLowerCase())) match = false;
      }

      if (f.cardFiltro === 'abertos' && data.status !== 'Aberto') match = false;
      if (f.cardFiltro === 'andamento' && data.status !== 'Em Execução') match = false;
      if (f.cardFiltro === 'historico' && data.status !== 'Fechado' && data.status !== 'Cancelado')
        match = false;

      return match;
    };
  }

  private calcularContadores() {
    this.countAbertos = this.chamados.filter((c) => c.status === 'Aberto').length;
    this.countAndamento = this.chamados.filter((c) => c.status === 'Em Execução').length;
    this.countHistorico = this.chamados.filter(
      (c) => c.status === 'Fechado' || c.status === 'Cancelado',
    ).length;
  }

  // Abertura do modal de cancelamento
  abrirDialogCancelamento(element: Chamado) {
    const dialogRef = this.dialog.open(CancelamentoDialogComponent, {
      width: '450px',
      data: { chamado: element },
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) {
        // Enviar requisição para o back-end passando o ID do chamado
        // Nota gerada automaticamente por padrão: "Chamado cancelado pelo solicitante."
        console.log(`Chamado #${element.id} cancelado com sucesso.`);
      }
    });
  }
}

// =========================================================================
// COMPONENTE DO DIALOG DE CANCELAMENTO
// =========================================================================

@Component({
  selector: 'app-cancelamento-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title style="color: #c62828;">
      <mat-icon style="vertical-align: middle;">warning</mat-icon>
      Cancelar Solicitação
    </h2>
    <mat-dialog-content>
      <p>
        Tem certeza de que deseja cancelar o chamado <strong>#{{ data.chamado.id }}</strong
        >?
      </p>
      <p class="text-muted" style="font-size: 0.9em; margin-top: 8px;">
        Esta ação retirará o item da fila da Infraestrutura/TI de forma definitiva.
      </p>

      <mat-form-field appearance="outline" style="width: 100%; margin-top: 16px;">
        <mat-label>Motivo do cancelamento (Opcional)</mat-label>
        <textarea
          matInput
          #motivoInput
          placeholder="Ex: O problema foi resolvido sozinho..."
        ></textarea>
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Desistir</button>
      <button
        mat-flat-button
        color="warn"
        [mat-dialog-close]="{ motivo: motivoInput.value || 'Chamado cancelado pelo solicitante.' }"
      >
        Confirmar Cancelamento
      </button>
    </mat-dialog-actions>
  `,
})
export class CancelamentoDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CancelamentoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { chamado: Chamado },
  ) {}
}
