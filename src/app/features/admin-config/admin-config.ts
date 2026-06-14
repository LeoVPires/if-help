import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Importações dos seus Serviços e Modais
import { ConfigurarLocaisService } from '../../core/services/configurar-locais';
import { TipoDemanda, LocalCampus, AmbienteLocal } from '../../core/modals/chamado'; // Ajuste o caminho
import { UserPerfil } from '../../core/services/auth'; // Ajuste o caminho

// Importações dos componentes de diálogo que você criou
import { TipoDemandaDialog } from './dialogs/tipo-demanda-dialog'; // Ajuste o caminho
import { LocalDialog } from './dialogs/local-dialog'; // Ajuste o caminho
import { AmbienteDialog } from './dialogs/ambiente-dialog'; // Ajuste o caminho

@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatExpansionModule,
    MatDialogModule,
    FormsModule,
  ],
  templateUrl: './admin-config.html',
  styleUrl: './admin-config.scss',
})
export class AdminConfig implements OnInit {
  private configService = inject(ConfigurarLocaisService);
  private dialog = inject(MatDialog);

  // --- Sinais Reativos (Substituindo os dados mocados) ---
  tiposDemanda = signal<TipoDemanda[]>([]);
  locais = signal<LocalCampus[]>([]);
  usuarios = signal<UserPerfil[]>([]);
  termoBusca = signal<string>('');

  constructor() {
    // Efeito para disparar a busca de usuários no Firebase sempre que o termo digitado mudar
    effect(() => {
      const termo = this.termoBusca();
      this.configService.buscarUsuariosPorNome(termo).subscribe({
        next: (lista) => this.usuarios.set(lista),
        error: (err) => console.error('Erro ao buscar usuários:', err),
      });
    });
  }

  ngOnInit(): void {
    this.carregarDadosIniciais();
  }

  private carregarDadosIniciais() {
    // Carrega tipos de demanda em tempo real
    this.configService.getTiposDemanda().subscribe({
      next: (dados) => this.tiposDemanda.set(dados),
      error: (err) => console.error('Erro ao carregar demandas:', err),
    });

    // Carrega locais com seus respectivos ambientes aninhados
    this.configService.getLocaisComAmbientes().subscribe({
      next: (dados) => this.locais.set(dados),
      error: (err) => console.error('Erro ao carregar locais:', err),
    });
  }

  // --- Retorna a lista vinda direta do Firebase (A busca já ocorre no servidor) ---
  get usuariosFiltrados() {
    return this.usuarios();
  }

  // ==========================================
  // LÓGICA DE CONTROLE DE ACESSOS (ROLES)
  // ==========================================
  alterarRole(usuarioId: string, novaRole: 'admin' | 'servidor' | 'aluno') {
    this.configService
      .alterarRoleUsuario(usuarioId, novaRole)
      .then(() => {
        console.log(`Role do usuário ${usuarioId} atualizada com sucesso para ${novaRole}!`);
      })
      .catch((err) => console.error('Erro ao alterar nível de acesso:', err));
  }

  // ==========================================
  // OPERAÇÕES DE DIÁLOGOS (CRUD)
  // ==========================================

  abrirModalNovo(tipo: 'demanda' | 'local') {
    if (tipo === 'demanda') {
      const dialogRef = this.dialog.open(TipoDemandaDialog, { width: '450px' });
      dialogRef.afterClosed().subscribe((resultado: TipoDemanda) => {
        if (resultado) {
          this.configService
            .addTipoDemanda(resultado)
            .catch((err) => console.error('Erro ao adicionar demanda:', err));
        }
      });
    } else if (tipo === 'local') {
      const dialogRef = this.dialog.open(LocalDialog, { width: '400px' });
      dialogRef.afterClosed().subscribe((resultado: LocalCampus) => {
        if (resultado) {
          this.configService
            .addLocal(resultado)
            .catch((err) => console.error('Erro ao adicionar local:', err));
        }
      });
    }
  }

  // Métodos adicionais para complementar o CRUD das Demandas
  editarTipoDemanda(demanda: TipoDemanda) {
    const dialogRef = this.dialog.open(TipoDemandaDialog, { width: '450px', data: demanda });
    // Dica: Para preencher o form de edição, use o MAT_DIALOG_DATA dentro do seu TipoDemandaDialog
    dialogRef.afterClosed().subscribe((resultado: Partial<TipoDemanda>) => {
      if (resultado && demanda.id) {
        this.configService
          .updateTipoDemanda(demanda.id, resultado)
          .catch((err) => console.error('Erro ao atualizar demanda:', err));
      }
    });
  }

  excluirTipoDemanda(id: string) {
    if (confirm('Deseja realmente excluir este Tipo de Demanda?')) {
      this.configService
        .deleteTipoDemanda(id)
        .catch((err) => console.error('Erro ao remover demanda:', err));
    }
  }

  // ==========================================
  // GERENCIAMENTO DE LOCAIS E AMBIENTES
  // ==========================================
  abrirModalNovoAmbiente(localId: string) {
    const dialogRef = this.dialog.open(AmbienteDialog, { width: '400px' });
    dialogRef.afterClosed().subscribe((resultado: AmbienteLocal) => {
      if (resultado) {
        this.configService
          .addAmbiente(localId, resultado)
          .catch((err) => console.error('Erro ao adicionar ambiente:', err));
      }
    });
  }

  editarLocal(localId: string, event: Event) {
    event.stopPropagation();
    // Localiza os dados atuais para enviar ao modal se necessário
    const localAtual = this.locais().find((l) => l.id === localId);
    const dialogRef = this.dialog.open(LocalDialog, { width: '400px', data: localAtual });

    dialogRef.afterClosed().subscribe((resultado: Partial<LocalCampus>) => {
      if (resultado) {
        this.configService
          .updateLocal(localId, resultado)
          .catch((err) => console.error('Erro ao atualizar local:', err));
      }
    });
  }

  excluirLocal(localId: string, event: Event) {
    event.stopPropagation();
    if (
      confirm(
        'Aviso: Remover este local irá apagar todos os ambientes vinculados a ele. Continuar?',
      )
    ) {
      this.configService
        .deleteLocal(localId)
        .catch((err) => console.error('Erro ao excluir local:', err));
    }
  }

  editarAmbiente(localId: string, ambiente: AmbienteLocal) {
    if (!ambiente.id) return;
    const dialogRef = this.dialog.open(AmbienteDialog, { width: '400px', data: ambiente });
    dialogRef.afterClosed().subscribe((resultado: Partial<AmbienteLocal>) => {
      if (resultado && ambiente.id) {
        this.configService
          .updateAmbiente(localId, ambiente.id, resultado)
          .catch((err) => console.error('Erro ao editar ambiente:', err));
      }
    });
  }

  excluirAmbiente(localId: string, ambienteId: string) {
    if (confirm('Deseja realmente remover este ambiente?')) {
      this.configService
        .deleteAmbiente(localId, ambienteId)
        .catch((err) => console.error('Erro ao excluir ambiente:', err));
    }
  }
}
