import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MatDialogModule,
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

import { Chamado, TipoDemanda, LocalCampus, AmbienteLocal, Nota } from '../../core/modals/chamado';
import { ChamadosService } from '../../core/services/chamados';
import { AuthService, UserPerfil } from '../../core/services/auth';
import { ConfigurarLocaisService } from '../../core/services/configurar-locais';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';

interface FilterState {
  status: string;
  search: string;
  categoria: string;
  prioridade: string;
  local: string;
  ambiente: string;
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
    MatSelectModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    MatAccordion,
    MatExpansionModule,
  ],
  templateUrl: './meus-chamados.html',
  styleUrl: './meus-chamados.scss',
})
export class MeusChamados implements OnInit, AfterViewInit {
  private dialog = inject(MatDialog);
  private chamadosService = inject(ChamadosService);
  private authService = inject(AuthService);
  private configurarLocaisService = inject(ConfigurarLocaisService);

  currentUser: UserPerfil | null = null;
  meusChamados: Chamado[] = [];
  dataSource = new MatTableDataSource<Chamado>();

  displayedColumns: string[] = ['id', 'localizacao', 'demanda', 'status', 'dataAbertura', 'acoes'];

  countMeusAbertos = 0;
  countEmAndamento = 0;
  countHistorico = 0;

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

    // Busca o usuário logado e depois os chamados dele
    this.authService.usuarioPerfil$.subscribe((user) => {
      if (user) {
        this.currentUser = user;
        this.carregarMeusChamados(user.nome);
        // Dica: Se no futuro tiver alunos com o mesmo nome, considere filtrar por user.uid (criadoPor)
      }
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Customização da lógica de ordenação (Sort)
    this.dataSource.sortingDataAccessor = (item: Chamado, property: string) => {
      switch (property) {
        case 'id':
          // Garante que a ordenação por ID seja numérica e não textual
          return String(item.id) || 0;

        case 'localizacao':
          // Junta Local + Ambiente para ordenar em ordem alfabética contínua
          return `${item.localCampus}|${item.ambienteLocal}`.toLowerCase();

        case 'demanda':
          // Ordena pelo nome da categoria (tipoDemanda)
          return item.tipoDemanda?.toLowerCase() ?? '';

        case 'status':
          return item.status?.toLowerCase() ?? '';

        case 'dataAbertura':
          // Transforma a string ISO (criadoEm) em um timestamp numérico para ordenar as datas perfeitamente
          return item.criadoEm ? new Date(item.criadoEm).getTime() : 0;

        default:
          // Caso padrão para qualquer outra propriedade simples
          return (item as any)[property];
      }
    };

    // Inicializa as regras de filtragem de texto que já tínhamos
    this.configurarFiltroPersonalizado();
  }

  private carregarMeusChamados(nomeUsuario: string) {
    this.chamadosService.getChamados().subscribe((todosChamados) => {
      // Filtra apenas os chamados onde o criadoPorNome é igual ao nome do usuário
      this.meusChamados = todosChamados.filter((c) => c.criadoPorNome === nomeUsuario);
      this.dataSource.data = this.meusChamados;
      this.calcularContadores();
    });
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

  // --- MÉTODOS DE FILTRO (Copiados do Admin) ---
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

  toggleCardFilter(filtroCard: 'abertos' | 'andamento' | 'historico') {
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
        const textToSearch =
          `${data.id} ${data.localCampus} ${data.ambienteLocal} ${data.descricao} ${data.tipoDemanda}`.toLowerCase();
        if (!textToSearch.includes(f.search.toLowerCase())) {
          match = false;
        }
      }

      if (f.categoria && data.tipoDemanda !== f.categoria) match = false;
      if (f.prioridade && data.prioridade !== f.prioridade) match = false;
      if (f.local && data.localCampus !== f.local) match = false;
      if (f.ambiente && data.ambienteLocal !== f.ambiente) match = false;
      if (f.status && data.status !== f.status) match = false;

      // Filtros dos Cards
      if (f.cardFiltro === 'abertos' && data.status !== 'Aberto') match = false;
      if (f.cardFiltro === 'andamento' && data.status !== 'Em Execução') match = false;
      if (f.cardFiltro === 'historico' && data.status !== 'Fechado' && data.status !== 'Cancelado')
        match = false;

      return match;
    };
  }

  private calcularContadores() {
    this.countMeusAbertos = this.meusChamados.filter((c) => c.status === 'Aberto').length;
    this.countEmAndamento = this.meusChamados.filter((c) => c.status === 'Em Execução').length;
    this.countHistorico = this.meusChamados.filter(
      (c) => c.status === 'Fechado' || c.status === 'Cancelado',
    ).length;
  }

  // --- AÇÃO DO "PULO DO GATO" ---
  abrirDialogCancelar(chamado: Chamado) {
    const dialogRef = this.dialog.open(CancelamentoDialogComponent, {
      width: '400px',
      data: { chamadoId: chamado.id },
    });

    dialogRef.afterClosed().subscribe(async (motivo) => {
      // Se o modal retornar undefined (fechou fora), não faz nada
      // Se retornar uma string (mesmo vazia), o usuário confirmou
      if (motivo !== undefined && chamado.id && this.currentUser) {
        // 1. Atualiza Status
        await this.chamadosService.updateStatusChamado(chamado.id, 'Cancelado');

        // 2. Cria a regra da Nota
        const textoJustificativa = motivo.trim();
        const textoNota = textoJustificativa
          ? `[Solicitante]: Cancelado. Justificativa: ${textoJustificativa}`
          : `[Sistema]: Chamado cancelado pelo solicitante.`;

        const novaNota: Nota = {
          autorNome: this.currentUser.nome,
          autorFuncao: this.currentUser.role, // Vai salvar como 'aluno', 'servidor', etc.
          texto: textoNota,
          criadoEm: new Date().toISOString(),
        };

        await this.chamadosService.addNota(chamado.id, novaNota);
      }
    });
  }
}

// ==========================================
// COMPONENTE DO MODAL (DIALOG) DE CANCELAMENTO
// ==========================================
@Component({
  selector: 'app-cancelamento-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatInputModule, FormsModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Cancelar Chamado #{{ data.chamadoId }}</h2>
    <mat-dialog-content>
      <p>Tem certeza que deseja cancelar este chamado? Esta ação não pode ser desfeita.</p>

      <mat-form-field appearance="outline" style="width: 100%; margin-top: 10px;">
        <mat-label>Motivo do cancelamento (Opcional)</mat-label>
        <textarea
          matInput
          [(ngModel)]="motivo"
          rows="3"
          placeholder="Ex: O problema já foi resolvido / A aula mudou de sala..."
        ></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancelar()">Voltar</button>
      <button mat-flat-button color="warn" (click)="confirmar()">Sim, Cancelar</button>
    </mat-dialog-actions>
  `,
})
export class CancelamentoDialogComponent {
  motivo: string = '';
  private dialogRef = inject(MatDialogRef<CancelamentoDialogComponent>);
  public data = inject(MAT_DIALOG_DATA);

  cancelar(): void {
    this.dialogRef.close(); // Retorna undefined
  }

  confirmar(): void {
    this.dialogRef.close(this.motivo); // Retorna a string (vazia ou preenchida)
  }
}
