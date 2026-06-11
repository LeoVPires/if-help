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
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import {
  MatDialogModule,
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';

import { Chamado } from '../../../core/modals/chamado';

// Interface para guardar o estado de todos os filtros juntos
interface FilterState {
  search: string;
  categoria: string;
  prioridade: string;
  cardFiltro: 'agrupamento' | 'alta' | 'triagem' | null;
}

@Component({
  selector: 'app-dashboard-admin',
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
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDialogModule,
  ],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.scss',
})
export class DashboardAdmin implements OnChanges, AfterViewInit {
  @Input() chamados: Chamado[] = [];

  dataSource = new MatTableDataSource<Chamado>();
  displayedColumns: string[] = ['id', 'localizacao', 'demanda', 'status', 'acoes'];

  // Injeta o serviço de Dialog
  dialog = inject(MatDialog);

  // Contadores dos Cards
  countSugestoesAgrupamento = 0;
  countAltaPrioridade = 0;
  countAguardandoTriagem = 0;

  // Estado atual dos filtros
  filtros: FilterState = { search: '', categoria: '', prioridade: '', cardFiltro: null };

  // Listas para os Selects
  categoriasDisponiveis: string[] = ['Infraestrutura', 'TI', 'Limpeza', 'Administrativo'];
  prioridadesDisponiveis: string[] = ['Baixa', 'Média', 'Alta', 'Crítica'];

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

  // --- LÓGICA DE FILTROS ---
  aplicarFiltroTexto(event: Event) {
    this.filtros.search = (event.target as HTMLInputElement).value;
    this.atualizarFiltroDataSource();
  }

  aplicarFiltroSelect(tipo: 'categoria' | 'prioridade', valor: string) {
    if (tipo === 'categoria') this.filtros.categoria = valor;
    if (tipo === 'prioridade') this.filtros.prioridade = valor;
    this.atualizarFiltroDataSource();
  }

  toggleCardFilter(filtroCard: 'agrupamento' | 'alta' | 'triagem') {
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

      if (f.categoria && data.categoria !== f.categoria) match = false;
      if (f.prioridade && data.prioridade !== f.prioridade) match = false;

      if (f.cardFiltro === 'alta' && data.prioridade !== 'Alta' && data.prioridade !== 'Crítica')
        match = false;
      if (f.cardFiltro === 'triagem' && (data.atribuidoPara !== '' || data.status !== 'Aberto'))
        match = false;
      if (f.cardFiltro === 'agrupamento') match = match && this.temDuplicatas(data);

      return match;
    };
  }

  // --- LÓGICA DE CONTADORES E AGRUPAMENTO ---
  private calcularContadores() {
    this.countAltaPrioridade = this.chamados.filter(
      (c) => c.prioridade === 'Alta' || c.prioridade === 'Crítica',
    ).length;
    this.countAguardandoTriagem = this.chamados.filter(
      (c) => c.atribuidoPara === '' && c.status === 'Aberto',
    ).length;

    const grupos = this.chamados.filter((c) => c.status === 'Aberto').map((c) => c.idGrupo);
    const gruposDuplicados = grupos.filter((item, index) => grupos.indexOf(item) !== index);

    this.countSugestoesAgrupamento = this.chamados.filter(
      (c) => c.status === 'Aberto' && gruposDuplicados.includes(c.idGrupo),
    ).length;
  }

  private temDuplicatas(chamado: Chamado): boolean {
    return this.chamados.some(
      (c) => c.idGrupo === chamado.idGrupo && c.id !== chamado.id && c.status === 'Aberto',
    );
  }

  getChamadosParaAgrupar(chamadoBase: Chamado): Chamado[] {
    return this.chamados.filter(
      (c) => c.idGrupo === chamadoBase.idGrupo && c.id !== chamadoBase.id && c.status === 'Aberto',
    );
  }

  // Novo método para abrir o Dialog
  abrirDialogAgrupamento(element: Chamado) {
    const chamadosParaAgrupar = this.getChamadosParaAgrupar(element);

    // Só abre se tiver itens para agrupar
    if (chamadosParaAgrupar.length > 0) {
      this.dialog.open(AgrupamentoDialogComponent, {
        width: '600px',
        data: { chamadoBase: element, chamadosParaAgrupar },
      });
    }
  }
}

// =========================================================================
// COMPONENTE DO DIALOG (Pode ser colocado no mesmo arquivo ou em um separado)
// =========================================================================

@Component({
  selector: 'app-agrupamento-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatCheckboxModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon style="vertical-align: middle;">lightbulb</mat-icon>
      Sugestão de Agrupamento Inteligente
    </h2>
    <mat-dialog-content>
      <p style="margin-bottom: 16px;">
        Foram encontrados outros chamados abertos neste mesmo local para a categoria
        <strong>{{ data.chamadoBase.categoria }}</strong
        >.
      </p>

      <div class="checkbox-list" style="display: flex; flex-direction: column; gap: 8px;">
        @for (sug of data.chamadosParaAgrupar; track sug.id) {
          <mat-checkbox color="primary">
            <strong>#{{ sug.id }}</strong> - {{ sug.descricao }}
            <span style="color: #666; font-size: 0.9em;">(Aberto por: {{ sug.criadoPor }})</span>
          </mat-checkbox>
        } @empty {
          <p class="text-muted">Nenhum chamado pendente encontrado para agrupar neste local.</p>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Cancelar</button>
      @if (data.chamadosParaAgrupar.length > 0) {
        <button mat-flat-button color="primary">Confirmar e Agrupar Selecionados</button>
      }
    </mat-dialog-actions>
  `,
})
export class AgrupamentoDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AgrupamentoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { chamadoBase: Chamado; chamadosParaAgrupar: Chamado[] },
  ) {}
}
