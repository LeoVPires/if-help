import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Chamado, StatusChamado, PrioridadeChamado, Nota } from '../../core/modals/chamado';
import { ChamadosService, Usuario } from '../../core/services/chamados';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-editar-chamado',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
  ],
  templateUrl: './editar-chamado.html',
  styleUrl: './editar-chamado.scss',
})
export class EditarChamado implements OnInit, OnDestroy {
  chamadoId!: string;
  chamadoForm!: FormGroup;
  isEditing = false;
  isLoading = true;

  chamadoAtual?: Chamado;
  notasInternas: Nota[] = [];
  listaTecnicos: Usuario[] = [];

  // 🚀 Objeto de backup caso a sessão demore um milissegundo a mais para responder
  usuarioLogado = {
    nome: 'Usuário do Sistema',
    funcao: 'Técnico',
  };

  statusOpcoes: StatusChamado[] = ['Aberto', 'Em Execução', 'Fechado', 'Cancelado'];
  prioridadeOpcoes: PrioridadeChamado[] = ['Baixa', 'Média', 'Alta', 'Crítica'];

  private subChamado?: Subscription;
  private subNotas?: Subscription;
  private subUsuarios?: Subscription;
  private subPerfil?: Subscription; // 👈 Assinatura para o perfil logado

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private location: Location,
    private snackBar: MatSnackBar,
    private chamadosService: ChamadosService,
    private authService: AuthService, // 👈 Injetado o seu AuthService
    private cdr: ChangeDetectorRef,
  ) {
    this.inicializarFormularioVazio();
  }

  ngOnInit() {
    // 1. Escuta quem é o usuário logado no sistema
    this.subPerfil = this.authService.usuarioPerfil$.subscribe({
      next: (perfil) => {
        if (perfil) {
          this.usuarioLogado.nome = perfil.nome;
          // Mapeia a role para um formato mais amigável na exibição se preferir (ex: 'admin' -> 'Administrador')
          this.usuarioLogado.funcao = perfil.role === 'admin' ? 'Administrador' : 'Servidor';
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Erro ao ler perfil do usuário:', err),
    });

    // 2. Escuta mudanças na rota para carregar os dados
    this.route.paramMap.subscribe((params) => {
      this.chamadoId = params.get('id') || '';

      this.subChamado?.unsubscribe();
      this.subNotas?.unsubscribe();
      this.subUsuarios?.unsubscribe();

      if (this.chamadoId) {
        this.escutarDadosDoFirebase();
      }
    });
  }

  ngOnDestroy() {
    this.subChamado?.unsubscribe();
    this.subNotas?.unsubscribe();
    this.subUsuarios?.unsubscribe();
    this.subPerfil?.unsubscribe(); // 👈 Cancela a assinatura ao sair da página
  }

  get statusControl() {
    return this.chamadoForm.get('status');
  }
  get prioridadeControl() {
    return this.chamadoForm.get('prioridade');
  }
  get atribuidoParaControl() {
    return this.chamadoForm.get('atribuidoPara');
  }

  private inicializarFormularioVazio() {
    this.chamadoForm = this.fb.group({
      localCampus: [{ value: '', disabled: true }, Validators.required],
      ambienteLocal: [{ value: '', disabled: true }, Validators.required],
      tipoDemanda: [{ value: '', disabled: true }, Validators.required],
      prioridade: [{ value: '', disabled: true }, Validators.required],
      status: [{ value: '', disabled: true }, Validators.required],
      atribuidoPara: [{ value: '', disabled: true }],
      descricao: [{ value: '', disabled: true }, Validators.required],
      novaNota: [''],
    });
  }

  private escutarDadosDoFirebase() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.subChamado = this.chamadosService.getChamadoById(this.chamadoId).subscribe({
      next: (chamado) => {
        this.chamadoAtual = chamado;
        this.atualizarValoresFormulario(chamado);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
        this.snackBar.open('Erro ou chamado não encontrado.', 'OK', { duration: 3000 });
      },
    });

    this.subNotas = this.chamadosService.getNotasChamado(this.chamadoId).subscribe({
      next: (notas) => {
        this.notasInternas = notas;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao escutar notas:', err),
    });

    this.subUsuarios = this.chamadosService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.listaTecnicos = usuarios.filter((u) => u.role === 'admin' || u.role === 'servidor');
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar técnicos:', err),
    });
  }

  private atualizarValoresFormulario(chamado: Chamado) {
    this.chamadoForm.patchValue({
      localCampus: chamado.localCampus,
      ambienteLocal: chamado.ambienteLocal,
      tipoDemanda: chamado.tipoDemanda,
      prioridade: chamado.prioridade,
      status: chamado.status,
      atribuidoPara: chamado.atribuidoPara || '',
      descricao: chamado.descricao,
    });
  }

  toggleEdit() {
    if (!this.chamadoAtual) return;
    this.isEditing = !this.isEditing;

    if (this.isEditing) {
      this.chamadoForm.get('status')?.enable();
      this.chamadoForm.get('prioridade')?.enable();
      this.chamadoForm.get('localCampus')?.enable();
      this.chamadoForm.get('ambienteLocal')?.enable();
      this.chamadoForm.get('atribuidoPara')?.enable();
      this.chamadoForm.get('novaNota')?.clearValidators();
    } else {
      this.cancelarEdicao();
    }
    this.chamadoForm.get('novaNota')?.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  cancelarEdicao() {
    this.isEditing = false;
    if (this.chamadoAtual) {
      this.atualizarValoresFormulario(this.chamadoAtual);
    }
    this.chamadoForm.get('status')?.disable();
    this.chamadoForm.get('prioridade')?.disable();
    this.chamadoForm.get('localCampus')?.disable();
    this.chamadoForm.get('ambienteLocal')?.disable();
    this.chamadoForm.get('atribuidoPara')?.disable();
    this.chamadoForm.get('novaNota')?.setValue('');
    this.chamadoForm.get('novaNota')?.clearValidators();
    this.chamadoForm.get('novaNota')?.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  async fecharChamado() {
    if (!this.chamadoAtual) return;

    this.chamadoForm.get('novaNota')?.setValidators([Validators.required]);
    this.chamadoForm.get('novaNota')?.updateValueAndValidity();

    if (this.chamadoForm.get('novaNota')?.invalid) {
      this.snackBar.open(
        'Adicione uma justificativa no campo de anotações para fechar o chamado.',
        'OK',
        { duration: 4000 },
      );
      return;
    }

    try {
      const justificativa = this.chamadoForm.get('novaNota')?.value;
      let textoNota = `- Status mudado de ${this.chamadoAtual.status} para Fechado`;
      if (justificativa && justificativa.trim() !== '') {
        textoNota += `\n- Justificativa: ${justificativa}`;
      }

      const novaNota: Nota = {
        autorNome: this.usuarioLogado.nome,
        autorFuncao: this.usuarioLogado.funcao,
        texto: textoNota,
        criadoEm: new Date().toISOString(),
      };

      await this.chamadosService.addNota(this.chamadoId, novaNota);
      await this.chamadosService.updateStatusChamado(this.chamadoId, 'Fechado');

      this.chamadoForm.get('novaNota')?.setValue('');
      this.isEditing = false;
      this.snackBar.open('Chamado encerrado com sucesso!', 'OK', { duration: 3000 });
    } catch (err) {
      console.error(err);
      this.snackBar.open('Erro ao encerrar o chamado.', 'OK', { duration: 3000 });
    }
  }

  async adicionarNotaAvulsa() {
    const notaTexto = this.chamadoForm.get('novaNota')?.value;
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

      await this.chamadosService.addNota(this.chamadoId, novaNota);
      this.chamadoForm.get('novaNota')?.setValue('');
      this.snackBar.open('Nota interna adicionada!', 'OK', { duration: 2000 });
    } catch (err) {
      console.error(err);
      this.snackBar.open('Erro ao registrar nota.', 'OK', { duration: 3000 });
    }
  }

  async salvarAlteracoes() {
    if (this.chamadoForm.invalid || !this.chamadoAtual) {
      this.snackBar.open('Por favor, preencha todos os campos obrigatórios.', 'OK', {
        duration: 3000,
      });
      return;
    }

    try {
      const formRaw = this.chamadoForm.getRawValue();
      let linhasHistorico: string[] = [];

      if (this.chamadoAtual.status !== formRaw.status) {
        linhasHistorico.push(
          `- Status mudado de '${this.chamadoAtual.status}' para '${formRaw.status}'`,
        );
      }
      if (this.chamadoAtual.prioridade !== formRaw.prioridade) {
        linhasHistorico.push(
          `- Prioridade mudada de '${this.chamadoAtual.prioridade}' para '${formRaw.prioridade}'`,
        );
      }
      if (this.chamadoAtual.atribuidoPara !== formRaw.atribuidoPara) {
        const tecnicoSelecionado = this.listaTecnicos.find((t) => t.id === formRaw.atribuidoPara);
        const nomeTecnico = tecnicoSelecionado ? tecnicoSelecionado.nome : 'Ninguém';
        const nomeAnterior = this.chamadoAtual.atribuidoParaNome || 'Ninguém';
        linhasHistorico.push(`- Responsável alterado de '${nomeAnterior}' para '${nomeTecnico}'`);
      }
      if (
        this.chamadoAtual.localCampus !== formRaw.localCampus ||
        this.chamadoAtual.ambienteLocal !== formRaw.ambienteLocal
      ) {
        linhasHistorico.push(`- Local/Ambiente updated pelo Administrador`);
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

      const dadosAtualizados: Partial<Chamado> = {
        localCampus: formRaw.localCampus,
        ambienteLocal: formRaw.ambienteLocal,
        prioridade: formRaw.prioridade,
        status: formRaw.status,
        atribuidoPara: formRaw.atribuidoPara,
        atribuidoParaNome: tecnicoAtual ? tecnicoAtual.nome : '',
      };

      await this.chamadosService.addNota(this.chamadoId, novaNota);
      await this.chamadosService.updateChamado(this.chamadoId, dadosAtualizados);

      this.cancelarEdicao();
      this.snackBar.open('Alterações salvas com sucesso!', 'OK', { duration: 3000 });
    } catch (err) {
      console.error(err);
      this.snackBar.open('Erro ao salvar modificações.', 'OK', { duration: 3000 });
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
