import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Subscription } from 'rxjs';

import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { ChamadosService } from '../../core/services/chamados';
import { AuthService, UserPerfil } from '../../core/services/auth';

import { ConfigurarLocaisService } from '../../core/services/configurar-locais';

import { Chamado, LocalCampus, TipoDemanda } from '../../core/modals/chamado';

@Component({
  selector: 'app-abrir-chamado',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    AsyncPipe,
  ],
  templateUrl: './abrir-chamado.html',
  styleUrl: './abrir-chamado.scss',
})
export class AbrirChamado implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);

  private chamadosService = inject(ChamadosService);
  private authService = inject(AuthService);
  private configurarLocaisService = inject(ConfigurarLocaisService);

  private subscriptions = new Subscription();

  usuario!: UserPerfil;

  role: 'admin' | 'aluno' | 'servidor' = 'aluno';
  usuario$ = this.authService.usuarioPerfil$;
  locais: LocalCampus[] = [];

  ambientesDisponiveis: string[] = [];

  tiposDemanda: TipoDemanda[] = [];

  servidoresDisponiveis: UserPerfil[] = [];

  form = this.fb.nonNullable.group({
    lugar: ['', Validators.required],

    ambiente: ['', Validators.required],

    tipoProblema: ['', Validators.required],

    descricao: ['', [Validators.required, Validators.minLength(10)]],

    prioridade: ['media'],

    responsavelId: [[] as string[]],
  });

  ngOnInit(): void {
    this.carregarUsuario();
    this.carregarLocais();
    this.carregarTiposDemanda();
    this.carregarServidores();
    this.escutarMudancaLocal();
  }

  private carregarUsuario(): void {
    const sub = this.authService.usuarioPerfil$.subscribe((perfil) => {
      if (!perfil) return;

      this.usuario = perfil;
      this.role = perfil.role;
    });

    this.subscriptions.add(sub);
  }

  private carregarLocais(): void {
    const sub = this.configurarLocaisService.getLocaisComAmbientes().subscribe((locais) => {
      this.locais = locais;
    });

    this.subscriptions.add(sub);
  }

  private carregarTiposDemanda(): void {
    const sub = this.configurarLocaisService.getTiposDemanda().subscribe((tipos) => {
      this.tiposDemanda = tipos;
    });

    this.subscriptions.add(sub);
  }

  private carregarServidores(): void {
    const sub = this.configurarLocaisService.buscarUsuariosPorNome('').subscribe((usuarios) => {
      this.servidoresDisponiveis = usuarios.filter(
        (u) => u.role === 'admin' || u.role === 'servidor',
      );
    });

    this.subscriptions.add(sub);
  }

  private escutarMudancaLocal(): void {
    const sub = this.form.controls.lugar.valueChanges.subscribe((localSelecionado) => {
      const local = this.locais.find((l) => l.nome === localSelecionado);

      this.ambientesDisponiveis = local?.ambientes?.map((amb) => amb.nome) ?? [];

      this.form.patchValue({
        ambiente: '',
      });
    });

    this.subscriptions.add(sub);
  }

  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');
  }

  async salvar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valor = this.form.getRawValue();

    const prioridades = {
      baixa: 'Baixa',
      media: 'Média',
      alta: 'Alta',
      critica: 'Crítica',
    } as const;

    const responsaveisSelecionados = this.servidoresDisponiveis.filter((usuario) =>
      valor.responsavelId.includes(usuario.uid),
    );

    const idGrupo = `${this.normalizarTexto(valor.lugar)}_${this.normalizarTexto(valor.ambiente)}_${this.normalizarTexto(valor.tipoProblema)}`;

    const chamado: Chamado = {
      localCampus: valor.lugar,
      ambienteLocal: valor.ambiente,
      tipoDemanda: valor.tipoProblema,
      descricao: valor.descricao,

      canalAbertura: 'formulario',

      status: 'Aberto',

      prioridade: prioridades[valor.prioridade as keyof typeof prioridades] ?? 'Média',

      criadoPor: this.usuario.email,
      criadoPorNome: this.usuario.nome,

      criadoEm: new Date().toISOString(),

      atribuidoPara: responsaveisSelecionados.map((u) => u.uid).join(','),

      atribuidoParaNome: responsaveisSelecionados.map((u) => u.nome).join(', '),

      idGrupo,
    };

    try {
      await this.chamadosService.addChamado(chamado);

      alert('Chamado registrado com sucesso.');

      this.form.reset({
        lugar: '',
        ambiente: '',
        tipoProblema: '',
        descricao: '',
        prioridade: 'media',
        responsavelId: [],
      });
    } catch (error) {
      console.error(error);

      alert('Erro ao registrar chamado.');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
