import {
  Component,
  Input,
  ViewChild,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  inject,
  OnInit,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { finalize } from 'rxjs/operators';

import {
  Agrupamento,
  Chamado,
  TipoDemanda,
  LocalCampus,
  AmbienteLocal,
} from '../../../core/modals/chamado';

import { ConfigurarLocaisService } from '../../../core/services/configurar-locais';
import { ChamadosService } from '../../../core/services/chamados';
import { AgrupamentosService } from '../../../core/services/agrupamento';

import { AgrupamentoDialogComponent } from './agrupamento-dialog/agrupamento-dialog';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';

interface FilterState {
  status: string;
  search: string;
  categoria: string;
  prioridade: string;
  local: string;
  ambiente: string;
  cardFiltro: 'agrupamento' | 'alta' | 'triagem' | null;
}

type DashboardRow =
  | {
      kind: 'agrupamento';
      key: string;
      agrupamento: Agrupamento;
      filhos: Chamado[];
    }
  | {
      kind: 'chamado';
      key: string;
      chamado: Chamado;
    };

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
    MatAccordion,
    MatExpansionModule,
  ],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.scss',
})
export class DashboardAdmin implements OnInit, OnChanges, AfterViewInit {
  @Input() chamados: Chamado[] = [];
  @Input() agrupamentos: Agrupamento[] = [];

  private dialog = inject(MatDialog);
  private configurarLocaisService = inject(ConfigurarLocaisService);
  private chamadosService = inject(ChamadosService);
  private agrupamentosService = inject(AgrupamentosService);

  dataSource = new MatTableDataSource<DashboardRow>();

  displayedColumns: string[] = ['expand', 'id', 'localizacao', 'demanda', 'status', 'acoes'];

  countSugestoesAgrupamento = 0;
  countAltaPrioridade = 0;
  countAguardandoTriagem = 0;

  filtros: FilterState = {
    search: '',
    categoria: '',
    prioridade: '',
    local: '',
    ambiente: '',
    status: '',
    cardFiltro: null,
  };

  categoriasDisponiveis: string[] = [];
  statusPossiveis: string[] = ['Aberto', 'Em Execução', 'Fechado', 'Cancelado'];
  prioridadesDisponiveis: string[] = ['Baixa', 'Média', 'Alta', 'Crítica'];

  locaisDisponiveis: LocalCampus[] = [];
  ambientesDisponiveis: AmbienteLocal[] = [];

  expandedRowKey: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.carregarTiposDemanda();
    this.carregarLocais();
    this.configurarFiltroPersonalizado();
    this.reconstruirTabela();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['chamados'] || changes['agrupamentos']) {
      this.reconstruirTabela();
      this.calcularContadores();
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.sortingDataAccessor = (item: DashboardRow, property: string) => {
      const chamado = item.kind === 'chamado' ? item.chamado : item.agrupamento;
      const tituloAgrupamento =
        item.kind === 'agrupamento' ? `agrupamento ${item.agrupamento.id}` : '';

      switch (property) {
        case 'expand':
          return item.kind === 'agrupamento' ? 1 : 0;

        case 'id':
          return item.kind === 'agrupamento'
            ? tituloAgrupamento.toLowerCase()
            : Number(chamado.id ?? 0);

        case 'localizacao':
          return `${chamado.localCampus}|${chamado.ambienteLocal}`.toLowerCase();

        case 'demanda':
          return item.kind === 'agrupamento'
            ? `${item.agrupamento.tipoDemanda} ${item.agrupamento.descricoes.join(' ')}`.toLowerCase()
            : (chamado.tipoDemanda?.toLowerCase() ?? '');

        case 'status':
          return chamado.status?.toLowerCase() ?? '';

        default:
          return (chamado as any)[property];
      }
    };
  }

  // =========================================================
  // RECONSTRUÇÃO DA TABELA
  // =========================================================

  private reconstruirTabela() {
    const rows: DashboardRow[] = [];
    const chamadosAgrupados = new Set<string>();

    for (const agrupamento of this.agrupamentos ?? []) {
      const filhos = (this.chamados ?? []).filter((c) => c.agrupamentoId === agrupamento.id);

      for (const filho of filhos) {
        if (filho.id) chamadosAgrupados.add(filho.id);
      }

      rows.push({
        kind: 'agrupamento',
        key: `agr-${agrupamento.id}`,
        agrupamento,
        filhos,
      });
    }

    for (const chamado of this.chamados ?? []) {
      if (chamado.agrupamentoId) continue;
      if (chamado.id && chamadosAgrupados.has(chamado.id)) continue;

      rows.push({
        kind: 'chamado',
        key: `ch-${chamado.id}`,
        chamado,
      });
    }

    this.dataSource.data = rows;
    this.aplicarFiltroAtual();
  }

  // =========================================================
  // CARREGAMENTO DE FILTROS AUXILIARES
  // =========================================================

  private carregarTiposDemanda() {
    this.configurarLocaisService.getTiposDemanda().subscribe((tipos: TipoDemanda[]) => {
      this.categoriasDisponiveis = tipos.map((t) => t.nome);
    });
  }

  private carregarLocais() {
    this.configurarLocaisService.getLocaisComAmbientes().subscribe((locais) => {
      this.locaisDisponiveis = locais;
    });
  }

  // =========================================================
  // FILTROS
  // =========================================================

  aplicarFiltroTexto(event: Event) {
    this.filtros.search = (event.target as HTMLInputElement).value;
    this.aplicarFiltroAtual();
  }

  aplicarFiltroSelect(
    tipo: keyof Pick<FilterState, 'categoria' | 'prioridade' | 'ambiente' | 'status'>,
    valor: string,
  ) {
    this.filtros[tipo] = valor;
    this.aplicarFiltroAtual();
  }

  selecionarLocal(localNome: string) {
    this.filtros.local = localNome;
    this.filtros.ambiente = '';

    const localSelecionado = this.locaisDisponiveis.find((l) => l.nome === localNome);
    this.ambientesDisponiveis = localSelecionado?.ambientes ?? [];

    this.aplicarFiltroAtual();
  }

  toggleCardFilter(filtroCard: 'agrupamento' | 'alta' | 'triagem') {
    this.filtros.cardFiltro = this.filtros.cardFiltro === filtroCard ? null : filtroCard;
    this.aplicarFiltroAtual();
  }

  private aplicarFiltroAtual() {
    this.dataSource.filter = JSON.stringify(this.filtros);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private configurarFiltroPersonalizado() {
    this.dataSource.filterPredicate = (row: DashboardRow, filterStr: string) => {
      const f: FilterState = JSON.parse(filterStr);

      const textoBase =
        row.kind === 'agrupamento'
          ? [
              row.agrupamento.id,
              row.agrupamento.idGrupo,
              row.agrupamento.localCampus,
              row.agrupamento.ambienteLocal,
              row.agrupamento.status,
              row.agrupamento.prioridade,
              row.agrupamento.tipoDemanda,
              row.agrupamento.descricoes.join(' '),
              row.filhos.map((c) => `${c.id} ${c.descricao} ${c.tipoDemanda}`).join(' '),
            ].join(' ')
          : [
              row.chamado.id,
              row.chamado.localCampus,
              row.chamado.ambienteLocal,
              row.chamado.descricao,
              row.chamado.tipoDemanda,
              row.chamado.status,
              row.chamado.prioridade,
              row.chamado.idGrupo,
            ].join(' ');

      let match = true;

      if (f.search) {
        if (!textoBase.toLowerCase().includes(f.search.toLowerCase())) {
          match = false;
        }
      }

      if (f.categoria) {
        if (row.kind === 'agrupamento') {
          const matchCategoria = row.filhos.some((c) => c.tipoDemanda === f.categoria);
          if (!matchCategoria) match = false;
        } else if (row.chamado.tipoDemanda !== f.categoria) {
          match = false;
        }
      }

      if (f.prioridade) {
        if (row.kind === 'agrupamento') {
          if (row.agrupamento.prioridade !== f.prioridade) match = false;
        } else if (row.chamado.prioridade !== f.prioridade) {
          match = false;
        }
      }

      if (f.local) {
        if (row.kind === 'agrupamento') {
          if (row.agrupamento.localCampus !== f.local) match = false;
        } else if (row.chamado.localCampus !== f.local) {
          match = false;
        }
      }

      if (f.ambiente) {
        if (row.kind === 'agrupamento') {
          if (row.agrupamento.ambienteLocal !== f.ambiente) match = false;
        } else if (row.chamado.ambienteLocal !== f.ambiente) {
          match = false;
        }
      }

      if (f.status) {
        if (row.kind === 'agrupamento') {
          if (row.agrupamento.status !== f.status) match = false;
        } else if (row.chamado.status !== f.status) {
          match = false;
        }
      }

      if (f.cardFiltro === 'alta') {
        const statusAlta =
          row.kind === 'agrupamento'
            ? row.agrupamento.prioridade === 'Alta' || row.agrupamento.prioridade === 'Crítica'
            : row.chamado.prioridade === 'Alta' || row.chamado.prioridade === 'Crítica';

        if (!statusAlta) match = false;
      }

      if (f.cardFiltro === 'triagem') {
        const emTriagem =
          row.kind === 'agrupamento'
            ? row.agrupamento.status === 'Aberto' && row.agrupamento.atribuidoPara === ''
            : row.chamado.status === 'Aberto' && row.chamado.atribuidoPara === '';

        if (!emTriagem) match = false;
      }

      if (f.cardFiltro === 'agrupamento') {
        if (row.kind === 'agrupamento') {
          match = false;
        } else {
          if (!this.podeAgrupar(row.chamado)) {
            match = false;
          }
        }
      }

      return match;
    };
  }

  // =========================================================
  // CONTADORES
  // =========================================================

  private calcularContadores() {
    this.countAltaPrioridade = 0;
    this.countAguardandoTriagem = 0;

    // Contar chamados sem agrupamento
    for (const chamado of this.chamados ?? []) {
      if (chamado.agrupamentoId) continue;

      if (chamado.prioridade === 'Alta' || chamado.prioridade === 'Crítica') {
        this.countAltaPrioridade++;
      }

      if (chamado.status === 'Aberto' && chamado.atribuidoPara === '') {
        this.countAguardandoTriagem++;
      }
    }

    // Contar agrupamentos como uma única linha
    for (const agrupamento of this.agrupamentos ?? []) {
      if (agrupamento.prioridade === 'Alta' || agrupamento.prioridade === 'Crítica') {
        this.countAltaPrioridade++;
      }

      if (agrupamento.status === 'Aberto' && agrupamento.atribuidoPara === '') {
        this.countAguardandoTriagem++;
      }
    }

    // Sugestões de agrupamento
    const gruposPorId = new Map<string, Chamado[]>();

    for (const chamado of this.chamados ?? []) {
      if (chamado.agrupamentoId) continue;
      if (chamado.status !== 'Aberto') continue;

      const grupo = gruposPorId.get(chamado.idGrupo) ?? [];
      grupo.push(chamado);
      gruposPorId.set(chamado.idGrupo, grupo);
    }

    this.countSugestoesAgrupamento = [...gruposPorId.entries()].filter(([idGrupo, grupo]) => {
      if (grupo.length < 2) return false;

      return !this.agrupamentos.some((a) => a.idGrupo === idGrupo);
    }).length;
  }

  // =========================================================
  // AGRUPAMENTO
  // =========================================================

  getChamadosDisponiveisParaAdicionar(agrupamento: Agrupamento): Chamado[] {
    return this.chamados.filter(
      (c) => !c.agrupamentoId && c.status === 'Aberto' && c.idGrupo === agrupamento.idGrupo,
    );
  }

  getQuantidadeParaAdicionarAoAgrupamento(agrupamento: Agrupamento): number {
    return this.getChamadosDisponiveisParaAdicionar(agrupamento).length;
  }

  abrirDialogAdicionarAoAgrupamento(row: DashboardRow) {
    if (row.kind !== 'agrupamento') return;

    const candidatos = this.getChamadosDisponiveisParaAdicionar(row.agrupamento);

    if (candidatos.length === 0) {
      return;
    }

    const ref = this.dialog.open(AgrupamentoDialogComponent, {
      width: '680px',
      data: {
        agrupamento: row.agrupamento,
        chamadosParaAgrupar: candidatos,
        modo: 'adicionar',
      },
    });

    ref.afterClosed().subscribe(async (idsSelecionados: string[]) => {
      if (!idsSelecionados?.length) return;

      for (const id of idsSelecionados) {
        await this.agrupamentosService.adicionarChamado(row.agrupamento.id!, id);
      }
    });
  }

  getChamadosParaAgrupar(chamadoBase: Chamado): Chamado[] {
    return (this.chamados ?? []).filter(
      (c) =>
        c.id !== chamadoBase.id &&
        c.agrupamentoId === null &&
        c.status === 'Aberto' &&
        c.idGrupo === chamadoBase.idGrupo,
    );
  }

  podeAgrupar(chamadoBase: Chamado): boolean {
    const jaExisteAgrupamento = this.agrupamentos.some((a) => a.idGrupo === chamadoBase.idGrupo);
    const candidatos = this.getChamadosParaAgrupar(chamadoBase);

    return !jaExisteAgrupamento && candidatos.length > 0 && !chamadoBase.agrupamentoId;
  }

  abrirDialogAgrupamento(element: Chamado) {
    if (!this.podeAgrupar(element)) {
      return;
    }

    const chamadosParaAgrupar = this.getChamadosParaAgrupar(element);

    const ref = this.dialog.open(AgrupamentoDialogComponent, {
      width: '680px',
      data: {
        chamadoBase: element,
        chamadosParaAgrupar,
      },
    });

    ref.afterClosed().subscribe(async (idsSelecionados: string[] | undefined) => {
      if (!idsSelecionados || idsSelecionados.length === 0) return;

      const chamadosSelecionados = [
        element,
        ...this.chamados.filter((c) => idsSelecionados.includes(c.id ?? '')),
      ];

      try {
        await this.agrupamentosService.criarAgrupamento(chamadosSelecionados);
      } catch (error) {
        console.error(error);
      }
    });
  }

  async desfazerAgrupamento(row: DashboardRow) {
    if (row.kind !== 'agrupamento' || !row.agrupamento.id) return;

    const confirmar = window.confirm('Deseja desfazer este agrupamento?');
    if (!confirmar) return;

    try {
      await this.agrupamentosService.desfazerAgrupamento(row.agrupamento.id);
    } catch (error) {
      console.error(error);
    }
  }

  desagruparChamadoDoAgrupamento(chamado: Chamado) {
    if (!chamado.agrupamentoId) return;

    this.agrupamentosService.removerChamado(chamado.agrupamentoId, chamado.id!);
  }

  async atualizarStatusAgrupamento(row: DashboardRow, novoStatus: Chamado['status']) {
    if (row.kind !== 'agrupamento' || !row.agrupamento.id) return;

    try {
      await this.agrupamentosService.atualizarAgrupamento(row.agrupamento.id, {
        status: novoStatus,
      });
    } catch (error) {
      console.error(error);
    }
  }

  // =========================================================
  // EXPANSÃO
  // =========================================================

  isGroupRow = (_: number, row: DashboardRow) => row.kind === 'agrupamento';

  isExpanded(row: DashboardRow): boolean {
    return this.expandedRowKey === row.key;
  }

  toggleExpansion(row: DashboardRow) {
    if (row.kind !== 'agrupamento') return;
    this.expandedRowKey = this.expandedRowKey === row.key ? null : row.key;
  }

  // =========================================================
  // UTILITÁRIOS DE TEMPLATE
  // =========================================================

  trackByRow = (_: number, row: DashboardRow) => row.key;

  getLinhaTitulo(row: DashboardRow): string {
    if (row.kind === 'agrupamento') {
      return `Agrupamento (${row.agrupamento.chamadosIds.length} chamados)`;
    }

    return `#${row.chamado.id}`;
  }

  getFilaDeFilhos(row: DashboardRow): Chamado[] {
    return row.kind === 'agrupamento' ? row.filhos : [];
  }

  getQuantidadeParaBadge(row: DashboardRow): number {
    if (row.kind !== 'chamado') return 0;

    return this.getChamadosParaAgrupar(row.chamado).length;
  }

  async limparFiltroCard() {
    this.filtros.cardFiltro = null;
    this.aplicarFiltroAtual();
  }

  async abrirAgrupamentoExistente(row: DashboardRow) {
    if (row.kind !== 'agrupamento' || !row.agrupamento.id) return;

    await this.atualizarStatusAgrupamento(row, row.agrupamento.status);
  }
}
