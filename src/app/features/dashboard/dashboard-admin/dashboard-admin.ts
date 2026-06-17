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

import { Chamado, TipoDemanda, LocalCampus, AmbienteLocal } from '../../../core/modals/chamado';
import { ConfigurarLocaisService } from '../../../core/services/configurar-locais';

import { AgrupamentoDialogComponent } from './agrupamento-dialog/agrupamento-dialog';

interface FilterState {
  status: string;
  search: string;
  categoria: string;
  prioridade: string;
  local: string;
  ambiente: string;
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
export class DashboardAdmin implements OnInit, OnChanges, AfterViewInit {
  @Input() chamados: Chamado[] = [];

  private dialog = inject(MatDialog);
  private configurarLocaisService = inject(ConfigurarLocaisService);

  dataSource = new MatTableDataSource<Chamado>();

  displayedColumns: string[] = ['id', 'localizacao', 'demanda', 'status', 'acoes'];

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
  statusPossiveis: string[] = ['Aberto', 'Em Andamento', 'Fechado', 'Cancelado'];
  prioridadesDisponiveis: string[] = ['Baixa', 'Média', 'Alta', 'Crítica'];

  locaisDisponiveis: LocalCampus[] = [];
  ambientesDisponiveis: AmbienteLocal[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.carregarTiposDemanda();
    this.carregarLocais();
  }

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

    this.dataSource.sortingDataAccessor = (item: Chamado, property: string) => {
      switch (property) {
        case 'localizacao':
          return `${item.localCampus}|${item.ambienteLocal}`.toLowerCase();

        case 'demanda':
          return item.tipoDemanda?.toLowerCase() ?? '';

        case 'status':
          return item.status?.toLowerCase();

        case 'id':
          return Number(item.id);

        default:
          return (item as any)[property];
      }
    };
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

  aplicarFiltroTexto(event: Event) {
    this.filtros.search = (event.target as HTMLInputElement).value;
    this.atualizarFiltroDataSource();
  }

  aplicarFiltroSelect(
    tipo: keyof Pick<FilterState, 'categoria' | 'prioridade' | 'ambiente' | 'status'>,
    valor: string,
  ) {
    this.filtros[tipo] = valor;
    this.atualizarFiltroDataSource();
  }

  selecionarLocal(localNome: string) {
    this.filtros.local = localNome;
    this.filtros.ambiente = '';

    const localSelecionado = this.locaisDisponiveis.find((l) => l.nome === localNome);

    this.ambientesDisponiveis = localSelecionado?.ambientes ?? [];

    this.atualizarFiltroDataSource();
  }

  toggleCardFilter(filtroCard: 'agrupamento' | 'alta' | 'triagem') {
    this.filtros.cardFiltro = this.filtros.cardFiltro === filtroCard ? null : filtroCard;

    this.atualizarFiltroDataSource();
  }

  private atualizarFiltroDataSource() {
    this.dataSource.filter = JSON.stringify(this.filtros);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private configurarFiltroPersonalizado() {
    this.dataSource.filterPredicate = (data: Chamado, filterStr: string) => {
      const f: FilterState = JSON.parse(filterStr);

      let match = true;

      if (f.search) {
        const textToSearch = `${data.id}
          ${data.localCampus}
          ${data.ambienteLocal}
          ${data.descricao}
          ${data.tipoDemanda}`.toLowerCase();

        if (!textToSearch.includes(f.search.toLowerCase())) {
          match = false;
        }
      }

      if (f.categoria && data.tipoDemanda !== f.categoria) {
        match = false;
      }

      if (f.prioridade && data.prioridade !== f.prioridade) {
        match = false;
      }

      if (f.local && data.localCampus !== f.local) {
        match = false;
      }

      if (f.ambiente && data.ambienteLocal !== f.ambiente) {
        match = false;
      }

      if (f.cardFiltro === 'alta' && data.prioridade !== 'Alta' && data.prioridade !== 'Crítica') {
        match = false;
      }

      if (f.cardFiltro === 'triagem' && (data.atribuidoPara !== '' || data.status !== 'Aberto')) {
        match = false;
      }

      if (f.cardFiltro === 'agrupamento') {
        match = match && this.temDuplicatas(data);
      }

      if (f.status && data.status !== f.status) {
        match = false;
      }

      return match;
    };
  }

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
      (c) =>
        chamadoBase.status === 'Aberto' &&
        c.idGrupo === chamadoBase.idGrupo &&
        c.id !== chamadoBase.id &&
        c.status === 'Aberto',
    );
  }

  abrirDialogAgrupamento(element: Chamado) {
    const chamadosParaAgrupar = this.getChamadosParaAgrupar(element);

    if (chamadosParaAgrupar.length > 0) {
      this.dialog.open(AgrupamentoDialogComponent, {
        width: '600px',
        data: {
          chamadoBase: element,
          chamadosParaAgrupar,
        },
      });
    }
  }
}
