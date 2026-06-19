import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription, combineLatest, map } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  Agrupamento,
  ChamadoSnapshot,
  Nota,
  StatusChamado,
  PrioridadeChamado,
} from '../../core/modals/chamado';
import { AgrupamentosService } from '../../core/services/agrupamento';
import { ChamadosService, Usuario } from '../../core/services/chamados';
import { AuthService } from '../../core/services/auth';

interface NotaExibicao extends Nota {
  origem: 'agrupamento' | 'chamado';
  origemLabel: string;
  chamadoId?: string;
}

@Component({
  selector: 'app-editar-agrupamento',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './editar-agrupamento.html',
  styleUrl: './editar-agrupamento.scss',
})
export class EditarAgrupamento implements OnInit, OnDestroy {
  agrupamentoId!: string;
  agrupamentoForm!: FormGroup;

  isEditing = false;
  isLoading = true;

  agrupamentoAtual?: Agrupamento;
  chamadosDoAgrupamento: ChamadoSnapshot[] = [];

  notasExibidas: NotaExibicao[] = [];
  listaTecnicos: Usuario[] = [];

  usuarioLogado = {
    nome: 'Usuário do Sistema',
    funcao: 'Técnico',
  };

  statusOpcoes: StatusChamado[] = ['Aberto', 'Em Execução', 'Fechado', 'Cancelado'];
  prioridadeOpcoes: PrioridadeChamado[] = ['Baixa', 'Média', 'Alta', 'Crítica'];

  private subPerfil?: Subscription;
  private subUsuarios?: Subscription;
  private subNotasCombinadas?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private location: Location,
    private snackBar: MatSnackBar,
    private agrupamentosService: AgrupamentosService,
    private chamadosService: ChamadosService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
    this.inicializarFormularioVazio();
  }

  ngOnInit() {
    this.subPerfil = this.authService.usuarioPerfil$.subscribe({
      next: (perfil) => {
        if (perfil) {
          this.usuarioLogado.nome = perfil.nome;
          this.usuarioLogado.funcao = perfil.role === 'admin' ? 'Administrador' : 'Servidor';
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Erro ao ler perfil do usuário:', err),
    });

    this.subUsuarios = this.chamadosService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.listaTecnicos = usuarios.filter((u) => u.role === 'admin' || u.role === 'servidor');
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar técnicos:', err),
    });

    this.route.paramMap.subscribe((params) => {
      this.agrupamentoId = params.get('id') || '';

      if (this.agrupamentoId) {
        this.carregarAgrupamento();
      }
    });
  }

  ngOnDestroy() {
    this.subPerfil?.unsubscribe();
    this.subUsuarios?.unsubscribe();
    this.subNotasCombinadas?.unsubscribe();
  }

  get statusControl() {
    return this.agrupamentoForm.get('status');
  }

  get prioridadeControl() {
    return this.agrupamentoForm.get('prioridade');
  }

  get atribuidoParaControl() {
    return this.agrupamentoForm.get('atribuidoPara');
  }

  private inicializarFormularioVazio() {
    this.agrupamentoForm = this.fb.group({
      localCampus: [{ value: '', disabled: true }, Validators.required],
      ambienteLocal: [{ value: '', disabled: true }, Validators.required],
      tipoDemanda: [{ value: '', disabled: true }],
      prioridade: [{ value: '', disabled: true }, Validators.required],
      status: [{ value: '', disabled: true }, Validators.required],
      atribuidoPara: [{ value: '', disabled: true }],
      novaNota: [''],
    });
  }

  private async carregarAgrupamento() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.subNotasCombinadas?.unsubscribe();

    try {
      const agrupamento = await this.agrupamentosService.getAgrupamentoPorId(this.agrupamentoId);

      if (!agrupamento) {
        this.snackBar.open('Agrupamento não encontrado.', 'OK', { duration: 3000 });
        this.voltar();
        return;
      }

      this.agrupamentoAtual = agrupamento;
      this.chamadosDoAgrupamento = agrupamento.membros ?? [];

      this.atualizarValoresFormulario(agrupamento);
      this.carregarNotasCombinadas();
    } catch (err) {
      console.error(err);
      this.snackBar.open('Erro ao carregar agrupamento.', 'OK', { duration: 3000 });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private atualizarValoresFormulario(agrupamento: Agrupamento) {
    this.agrupamentoForm.patchValue({
      localCampus: agrupamento.localCampus,
      ambienteLocal: agrupamento.ambienteLocal,
      tipoDemanda: agrupamento.tipoDemanda,
      prioridade: agrupamento.prioridade,
      status: agrupamento.status,
      atribuidoPara: agrupamento.atribuidoPara || '',
      novaNota: '',
    });
  }

  private carregarNotasCombinadas() {
    if (!this.agrupamentoId) return;

    const notasAgrupamento$ = this.agrupamentosService.getNotasAgrupamento(this.agrupamentoId).pipe(
      map((notas) =>
        notas.map((nota) => ({
          ...nota,
          origem: 'agrupamento' as const,
          origemLabel: 'Agrupamento',
        })),
      ),
    );

    const streamsChamados = this.chamadosDoAgrupamento.map((membro) =>
      this.chamadosService.getNotasChamado(membro.chamadoId).pipe(
        map((notas) =>
          notas.map((nota) => ({
            ...nota,
            origem: 'chamado' as const,
            origemLabel: `Chamado #${membro.chamadoId}`,
            chamadoId: membro.chamadoId,
          })),
        ),
      ),
    );

    if (streamsChamados.length === 0) {
      this.subNotasCombinadas = notasAgrupamento$.subscribe({
        next: (notas) => {
          this.notasExibidas = this.ordenarNotas(notas);
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Erro ao carregar notas do agrupamento:', err),
      });

      return;
    }

    this.subNotasCombinadas = combineLatest([notasAgrupamento$, ...streamsChamados]).subscribe({
      next: (listas) => {
        const todasAsNotas = listas.flat();
        this.notasExibidas = this.ordenarNotas(todasAsNotas);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar notas combinadas:', err),
    });
  }

  private ordenarNotas(notas: NotaExibicao[]): NotaExibicao[] {
    return [...notas].sort(
      (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
    );
  }

  toggleEdit() {
    if (!this.agrupamentoAtual) return;

    this.isEditing = !this.isEditing;

    if (this.isEditing) {
      this.agrupamentoForm.get('status')?.enable();
      this.agrupamentoForm.get('prioridade')?.enable();
      this.agrupamentoForm.get('localCampus')?.enable();
      this.agrupamentoForm.get('ambienteLocal')?.enable();
      this.agrupamentoForm.get('atribuidoPara')?.enable();
      this.agrupamentoForm.get('novaNota')?.clearValidators();
    } else {
      this.cancelarEdicao();
    }

    this.agrupamentoForm.get('novaNota')?.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  cancelarEdicao() {
    this.isEditing = false;

    if (this.agrupamentoAtual) {
      this.atualizarValoresFormulario(this.agrupamentoAtual);
    }

    this.agrupamentoForm.get('status')?.disable();
    this.agrupamentoForm.get('prioridade')?.disable();
    this.agrupamentoForm.get('localCampus')?.disable();
    this.agrupamentoForm.get('ambienteLocal')?.disable();
    this.agrupamentoForm.get('atribuidoPara')?.disable();
    this.agrupamentoForm.get('novaNota')?.setValue('');
    this.agrupamentoForm.get('novaNota')?.clearValidators();
    this.agrupamentoForm.get('novaNota')?.updateValueAndValidity();

    this.cdr.detectChanges();
  }

  async salvarAlteracoes() {
    if (this.agrupamentoForm.invalid || !this.agrupamentoAtual) {
      this.snackBar.open('Por favor, preencha todos os campos obrigatórios.', 'OK', {
        duration: 3000,
      });
      return;
    }

    try {
      const formRaw = this.agrupamentoForm.getRawValue();
      const linhasHistorico: string[] = [];

      if (this.agrupamentoAtual.localCampus !== formRaw.localCampus) {
        linhasHistorico.push(
          `- Local alterado de '${this.agrupamentoAtual.localCampus}' para '${formRaw.localCampus}'`,
        );
      }

      if (this.agrupamentoAtual.ambienteLocal !== formRaw.ambienteLocal) {
        linhasHistorico.push(
          `- Ambiente alterado de '${this.agrupamentoAtual.ambienteLocal}' para '${formRaw.ambienteLocal}'`,
        );
      }

      if (this.agrupamentoAtual.status !== formRaw.status) {
        linhasHistorico.push(
          `- Status mudado de '${this.agrupamentoAtual.status}' para '${formRaw.status}'`,
        );
      }

      if (this.agrupamentoAtual.prioridade !== formRaw.prioridade) {
        linhasHistorico.push(
          `- Prioridade mudada de '${this.agrupamentoAtual.prioridade}' para '${formRaw.prioridade}'`,
        );
      }

      if (this.agrupamentoAtual.atribuidoPara !== formRaw.atribuidoPara) {
        const tecnicoSelecionado = this.listaTecnicos.find((t) => t.id === formRaw.atribuidoPara);
        const nomeTecnico = tecnicoSelecionado ? tecnicoSelecionado.nome : 'Ninguém';
        const nomeAnterior = this.agrupamentoAtual.atribuidoParaNome || 'Ninguém';

        linhasHistorico.push(`- Responsável alterado de '${nomeAnterior}' para '${nomeTecnico}'`);
      }

      const comentarioExtra = formRaw.novaNota ? formRaw.novaNota.trim() : '';
      if (comentarioExtra !== '') {
        linhasHistorico.push(`- Observação técnica: ${comentarioExtra}`);
      }

      if (linhasHistorico.length === 0) {
        this.cancelarEdicao();
        return;
      }

      const tecnicoAtual = this.listaTecnicos.find((t) => t.id === formRaw.atribuidoPara);
      const textoFinalNota = linhasHistorico.join('\n');

      const novaNota: Nota = {
        autorNome: this.usuarioLogado.nome,
        autorFuncao: this.usuarioLogado.funcao,
        texto: textoFinalNota,
        criadoEm: new Date().toISOString(),
      };

      const dadosAtualizados = {
        localCampus: formRaw.localCampus,
        ambienteLocal: formRaw.ambienteLocal,
        prioridade: formRaw.prioridade,
        status: formRaw.status,
        atribuidoPara: formRaw.atribuidoPara,
        atribuidoParaNome: tecnicoAtual ? tecnicoAtual.nome : '',
      };

      await this.agrupamentosService.addNotaAgrupamento(this.agrupamentoId, novaNota);
      await this.agrupamentosService.atualizarAgrupamento(this.agrupamentoId, dadosAtualizados);

      this.cancelarEdicao();
      await this.carregarAgrupamento();

      this.snackBar.open('Alterações salvas com sucesso!', 'OK', { duration: 3000 });
    } catch (err) {
      console.error(err);
      this.snackBar.open('Erro ao salvar modificações.', 'OK', { duration: 3000 });
    }
  }

  async fecharAgrupamento() {
    if (!this.agrupamentoAtual) return;

    this.agrupamentoForm.get('novaNota')?.setValidators([Validators.required]);
    this.agrupamentoForm.get('novaNota')?.updateValueAndValidity();

    if (this.agrupamentoForm.get('novaNota')?.invalid) {
      this.snackBar.open(
        'Adicione uma justificativa no campo de anotações para fechar o agrupamento.',
        'OK',
        { duration: 4000 },
      );
      return;
    }

    try {
      const justificativa = this.agrupamentoForm.get('novaNota')?.value;
      let textoNota = `- Status mudado de ${this.agrupamentoAtual.status} para Fechado`;

      if (justificativa && justificativa.trim() !== '') {
        textoNota += `\n- Justificativa: ${justificativa}`;
      }

      const novaNota: Nota = {
        autorNome: this.usuarioLogado.nome,
        autorFuncao: this.usuarioLogado.funcao,
        texto: textoNota,
        criadoEm: new Date().toISOString(),
      };

      await this.agrupamentosService.addNotaAgrupamento(this.agrupamentoId, novaNota);
      await this.agrupamentosService.atualizarAgrupamento(this.agrupamentoId, {
        status: 'Fechado',
      });

      this.cancelarEdicao();
      await this.carregarAgrupamento();

      this.snackBar.open('Agrupamento encerrado com sucesso!', 'OK', { duration: 3000 });
    } catch (err) {
      console.error(err);
      this.snackBar.open('Erro ao encerrar o agrupamento.', 'OK', { duration: 3000 });
    }
  }

  async adicionarNotaAvulsa() {
    const notaTexto = this.agrupamentoForm.get('novaNota')?.value;

    if (!notaTexto || notaTexto.trim() === '') {
      this.snackBar.open('Escreva algo no campo de anotações primeiro.', 'OK', { duration: 3000 });
      return;
    }

    try {
      const novaNota: Nota = {
        autorNome: this.usuarioLogado.nome,
        autorFuncao: this.usuarioLogado.funcao,
        texto: notaTexto,
        criadoEm: new Date().toISOString(),
      };

      await this.agrupamentosService.addNotaAgrupamento(this.agrupamentoId, novaNota);
      this.agrupamentoForm.get('novaNota')?.setValue('');

      this.snackBar.open('Nota interna adicionada ao agrupamento!', 'OK', {
        duration: 2000,
      });
    } catch (err) {
      console.error(err);
      this.snackBar.open('Erro ao registrar nota.', 'OK', { duration: 3000 });
    }
  }

  async desagruparChamado(membro: ChamadoSnapshot) {
    if (!this.agrupamentoAtual?.id) return;

    try {
      await this.agrupamentosService.removerChamado(this.agrupamentoAtual.id, membro.chamadoId);
      this.snackBar.open(`Chamado #${membro.chamadoId} desagrupado com sucesso!`, 'OK', {
        duration: 3000,
      });

      await this.carregarAgrupamento();
    } catch (err) {
      console.error(err);
      this.snackBar.open('Erro ao desagrupar o chamado.', 'OK', { duration: 3000 });
    }
  }

  getIniciais(nome?: string): string {
    if (!nome) return '';

    const partes = nome.trim().split(/\s+/);

    if (partes.length === 1) {
      return partes[0][0].toUpperCase();
    }

    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  voltar() {
    this.location.back();
  }
}
