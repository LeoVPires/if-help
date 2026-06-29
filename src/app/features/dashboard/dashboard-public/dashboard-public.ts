import {
  Component,
  Input,
  ViewChild,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  OnInit,
  inject,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  Agrupamento,
  AmbienteLocal,
  Chamado,
  LocalCampus,
  TipoDemanda,
} from '../../../core/modals/chamado';
import { ConfigurarLocaisService } from '../../../core/services/configurar-locais';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';

interface FilterState {
  search: string;
  categoria: string;
  status: string;
  prioridade: string;
  local: string;
  ambiente: string;
  cardFiltro: 'Aberto' | 'Em Execução' | 'Concluído' | null;
}

type DashboardRow =
  | {
      kind: 'chamado';
      key: string;
      chamado: Chamado;
      createdEm: string;
    }
  | {
      kind: 'agrupamento';
      key: string;
      agrupamento: Agrupamento;
      filhos: Chamado[];
      createdEm: string;
    };

@Component({
  selector: 'app-dashboard-public',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatTooltipModule,
    MatAccordion,
    MatExpansionModule,
  ],
  templateUrl: './dashboard-public.html',
  styleUrl: './dashboard-public.scss',
})
export class DashboardPublic implements OnInit, OnChanges, AfterViewInit {
  @Input() chamados: Chamado[] = [];
  @Input() agrupamentos: Agrupamento[] = [];

  private configurarLocaisService = inject(ConfigurarLocaisService);

  dataSource = new MatTableDataSource<DashboardRow>();

  displayedColumns: string[] = ['expand', 'localizacao', 'demanda', 'status', 'abertura'];

  countAberto = 0;
  countExecucao = 0;
  countConcluido = 0;

  filtros: FilterState = {
    search: '',
    categoria: '',
    status: '',
    prioridade: '',
    local: '',
    ambiente: '',
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
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.sortingDataAccessor = (item: DashboardRow, property: string) => {
      const base = item.kind === 'chamado' ? item.chamado : item.agrupamento;

      switch (property) {
        case 'expand':
          return item.kind === 'agrupamento' ? 1 : 0;

        case 'localizacao':
          return `${base.localCampus}|${base.ambienteLocal}`.toLowerCase();

        case 'demanda':
          return item.kind === 'agrupamento'
            ? `${item.agrupamento.tipoDemanda} ${item.agrupamento.descricoes.join(' ')}`.toLowerCase()
            : `${item.chamado.tipoDemanda} ${item.chamado.descricao}`.toLowerCase();

        case 'status':
          return base.status?.toLowerCase() ?? '';

        case 'abertura':
          return new Date(item.createdEm).getTime();

        default:
          return (base as any)[property];
      }
    };
  }

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

  toggleStatusFilter(status: 'Aberto' | 'Em Execução' | 'Concluído') {
    this.filtros.cardFiltro = this.filtros.cardFiltro === status ? null : status;
    this.aplicarFiltroAtual();
  }

  private aplicarFiltroAtual() {
    this.dataSource.filter = JSON.stringify(this.filtros);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

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

  private reconstruirTabela() {
    const rows: DashboardRow[] = [];
    const chamadosAgrupados = new Set<string>();

    for (const agrupamento of this.agrupamentos ?? []) {
      const filhos = (this.chamados ?? []).filter(
        (c) =>
          (c.id && agrupamento.chamadosIds.includes(c.id)) ||
          (c.agrupamentoId !== null && c.agrupamentoId === agrupamento.id),
      );

      for (const filho of filhos) {
        if (filho.id) chamadosAgrupados.add(filho.id);
      }

      rows.push({
        kind: 'agrupamento',
        key: `agr-${agrupamento.id ?? agrupamento.idGrupo}`,
        agrupamento,
        filhos,
        createdEm: agrupamento.criadoEm,
      });
    }

    for (const chamado of this.chamados ?? []) {
      if (!chamado.id) continue;
      if (chamado.agrupamentoId) continue;
      if (chamadosAgrupados.has(chamado.id)) continue;

      rows.push({
        kind: 'chamado',
        key: `ch-${chamado.id}`,
        chamado,
        createdEm: chamado.criadoEm,
      });
    }

    rows.sort((a, b) => new Date(b.createdEm).getTime() - new Date(a.createdEm).getTime());

    this.dataSource.data = rows;
    this.updateCounters();
    this.aplicarFiltroAtual();
  }

  private updateCounters() {
    this.countAberto = this.chamados.filter((c) => c.status === 'Aberto').length;
    this.countExecucao = this.chamados.filter((c) => c.status === 'Em Execução').length;
    this.countConcluido = this.chamados.filter((c) => c.status === 'Fechado').length;
  }

  private getRowStatus(row: DashboardRow): string {
    return row.kind === 'agrupamento' ? row.agrupamento.status : row.chamado.status;
  }

  private getRowTextoBase(row: DashboardRow): string {
    if (row.kind === 'agrupamento') {
      return [
        row.agrupamento.id,
        row.agrupamento.idGrupo,
        row.agrupamento.localCampus,
        row.agrupamento.ambienteLocal,
        row.agrupamento.status,
        row.agrupamento.prioridade,
        row.agrupamento.tipoDemanda,
        row.agrupamento.descricoes.join(' '),
        row.filhos.map((c) => `${c.id} ${c.descricao} ${c.tipoDemanda}`).join(' '),
      ]
        .join(' ')
        .toLowerCase();
    }

    return [
      row.chamado.id,
      row.chamado.localCampus,
      row.chamado.ambienteLocal,
      row.chamado.descricao,
      row.chamado.tipoDemanda,
      row.chamado.status,
      row.chamado.prioridade,
      row.chamado.idGrupo,
    ]
      .join(' ')
      .toLowerCase();
  }

  private statusCardMatch(rowStatus: string, filtro: string | null): boolean {
    if (!filtro) return true;
    if (filtro === 'Concluído') return rowStatus === 'Fechado';
    return rowStatus === filtro;
  }

  private configurarFiltroPersonalizado() {
    this.dataSource.filterPredicate = (row: DashboardRow, filterStr: string) => {
      const f: FilterState = JSON.parse(filterStr);

      let match = true;
      const textoBase = this.getRowTextoBase(row);

      if (f.search && !textoBase.includes(f.search.toLowerCase())) {
        match = false;
      }

      if (f.categoria) {
        const categoriaMatch =
          row.kind === 'agrupamento'
            ? row.agrupamento.tipoDemanda === f.categoria
            : row.chamado.tipoDemanda === f.categoria;

        if (!categoriaMatch) match = false;
      }

      if (f.prioridade) {
        const prioridadeMatch =
          row.kind === 'agrupamento'
            ? row.agrupamento.prioridade === f.prioridade
            : row.chamado.prioridade === f.prioridade;

        if (!prioridadeMatch) match = false;
      }

      if (f.local) {
        const localMatch =
          row.kind === 'agrupamento'
            ? row.agrupamento.localCampus === f.local
            : row.chamado.localCampus === f.local;

        if (!localMatch) match = false;
      }

      if (f.ambiente) {
        const ambienteMatch =
          row.kind === 'agrupamento'
            ? row.agrupamento.ambienteLocal === f.ambiente
            : row.chamado.ambienteLocal === f.ambiente;

        if (!ambienteMatch) match = false;
      }

      if (f.status) {
        const statusMatch =
          row.kind === 'agrupamento'
            ? row.agrupamento.status === f.status
            : row.chamado.status === f.status;

        if (!statusMatch) match = false;
      }

      if (!this.statusCardMatch(this.getRowStatus(row), f.cardFiltro)) {
        match = false;
      }

      return match;
    };
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Aberto':
        return 'aberto';
      case 'Em Execução':
        return 'execucao';
      case 'Fechado':
        return 'fechado';
      case 'Cancelado':
        return 'cancelado';
      default:
        return '';
    }
  }

  isGroupRow = (_: number, row: DashboardRow) => row.kind === 'agrupamento';

  isExpanded(row: DashboardRow): boolean {
    return this.expandedRowKey === row.key;
  }

  toggleExpansion(row: DashboardRow) {
    if (row.kind !== 'agrupamento') return;
    this.expandedRowKey = this.expandedRowKey === row.key ? null : row.key;
  }

  getQuantidadeDeFilhos(row: DashboardRow): number {
    return row.kind === 'agrupamento' ? row.filhos.length : 0;
  }

  getLocalizacaoLabel(row: DashboardRow): string {
    if (row.kind === 'agrupamento') {
      return `${row.agrupamento.localCampus} - ${row.agrupamento.ambienteLocal}`;
    }

    return `${row.chamado.localCampus} - ${row.chamado.ambienteLocal}`;
  }

  getTipoDemandaLabel(row: DashboardRow): string {
    return row.kind === 'agrupamento' ? row.agrupamento.tipoDemanda : row.chamado.tipoDemanda;
  }

  getDescricaoLabel(row: DashboardRow): string {
    if (row.kind === 'agrupamento') {
      return row.agrupamento.descricoes[0] ?? 'Agrupamento de chamados';
    }

    return row.chamado.descricao;
  }

  getStatusLabel(row: DashboardRow): string {
    return row.kind === 'agrupamento' ? row.agrupamento.status : row.chamado.status;
  }

  getAberturaLabel(row: DashboardRow): string {
    return row.kind === 'agrupamento' ? row.agrupamento.criadoEm : row.chamado.criadoEm;
  }

  trackByRow = (_: number, row: DashboardRow) => row.key;
}
